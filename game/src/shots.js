// The screenshot scenes behind ?shot=start|play|alert|end. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a pathfinder (A* on
// a 40px grid of the room: cases are walls, and — for the careful scenes — a cell a
// watcher can see costs extra, so the route prefers cover), so the frame is what a
// short game really looks like and the same seed always gives the same frame. The
// alert scene takes the shortest path with no caution, like a hurried thief, so it
// blunders into a cone.
import { CASES, EXIT, FIELD, STEP, THIEF } from './config.js';
import { exposureAt, resetWorld, stepWorld } from './world.js';
import { insideRoom } from './room.js';
import { SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const ALERT_SECONDS = 18;
const END_LIMIT_SECONDS = 150;
/** The spot the careful thief holds for the cover frame: mid-room on the west side, out of
 * every cone and clear of every patrol for a full 30 seconds (verified in the rule tests). */
const HERO = { x: 320, y: 400 };
/** The grid's cell size, in logical pixels. */
const CELL = 40;
const COLS = Math.ceil(FIELD.width / CELL);
const ROWS = Math.ceil(FIELD.height / CELL);
/** How often, in steps, the route is replanned (watchers move, so cover moves too). */
const REPATH_EVERY = 30;

/** Whether a grid cell is one Wren can stand in (inside the room, clear of the cases). */
function cellBlocked(cx, cy) {
  const x = cx * CELL + CELL / 2;
  const y = cy * CELL + CELL / 2;
  if (!insideRoom(x, y)) return true;
  for (const c of CASES) {
    if (x + THIEF.radius > c.x && x - THIEF.radius < c.x + c.w && y + THIEF.radius > c.y && y - THIEF.radius < c.y + c.h) return true;
  }
  return false;
}

/**
 * A route from `from` to `to` as waypoints (cell centres, the exact target last), or
 * null when no route exists. `avoidSeen` makes a cell a watcher can see cost extra, so
 * the route prefers cover; without it the route is the shortest one.
 */
function findPath(world, from, to, avoidSeen) {
  const start = { cx: Math.floor(from.x / CELL), cy: Math.floor(from.y / CELL) };
  const goal = { cx: Math.floor(to.x / CELL), cy: Math.floor(to.y / CELL) };
  const key = (cx, cy) => cy * COLS + cx;
  const heuristic = (cx, cy) => Math.abs(cx - goal.cx) + Math.abs(cy - goal.cy);
  const open = [{ ...start, g: 0, f: heuristic(start.cx, start.cy), parent: null }];
  const best = new Map([[key(start.cx, start.cy), 0]]);
  const closed = new Set();
  while (open.length > 0) {
    let bi = 0;
    for (let i = 1; i < open.length; i += 1) if (open[i].f < open[bi].f) bi = i;
    const node = open.splice(bi, 1)[0];
    const k = key(node.cx, node.cy);
    if (closed.has(k)) continue;
    closed.add(k);
    if (node.cx === goal.cx && node.cy === goal.cy) {
      const path = [];
      let cur = node;
      while (cur) {
        path.unshift({ x: cur.cx * CELL + CELL / 2, y: cur.cy * CELL + CELL / 2 });
        cur = cur.parent;
      }
      path.push({ x: to.x, y: to.y });
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = node.cx + dx;
      const ny = node.cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (cellBlocked(nx, ny)) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;
      let cost = dx !== 0 && dy !== 0 ? 1.414 : 1;
      if (avoidSeen && exposureAt(world, nx * CELL + CELL / 2, ny * CELL + CELL / 2)) cost += 8;
      // Keep clear of the wardens themselves, not just their cones: a cell a warden
      // is about to walk through is a cell Wren gets caught in, alarm or no alarm.
      for (const guard of world.guards) {
        if (Math.hypot(nx * CELL + CELL / 2 - guard.x, ny * CELL + CELL / 2 - guard.y) < 80) cost += 8;
      }
      const g = node.g + cost;
      if (best.has(nk) && best.get(nk) <= g) continue;
      best.set(nk, g);
      open.push({ cx: nx, cy: ny, g, f: g + heuristic(nx, ny), parent: node });
    }
  }
  return null;
}

/** Wren's objective right now: the nearest loot still on its pedestal, else the vault door. */
function objectiveOf(world) {
  let best = null;
  let bestDist = Infinity;
  for (const piece of world.loot) {
    if (piece.taken) continue;
    const d = Math.hypot(piece.x - world.thief.x, piece.y - world.thief.y);
    if (d < bestDist) {
      bestDist = d;
      best = { x: piece.x, y: piece.y };
    }
  }
  if (best) return best;
  return { x: EXIT.x + EXIT.w / 2, y: 40 };
}

/**
 * Set `world` to the named scene (start, play, alert or end; any other name is start)
 * and return the screen to draw over it and the best time to show.
 */
export function stageShot(name, world) {
  resetWorld(world);
  if (name !== 'play' && name !== 'alert' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) stepWorld(world, STEP, { x: 0, y: 0 }, false);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const seconds = name === 'end' ? END_LIMIT_SECONDS : name === 'alert' ? ALERT_SECONDS : PLAY_SECONDS;
  const avoidSeen = name !== 'alert';
  let path = null;
  let pathTarget = null;
  let repathIn = 0;
  for (let index = 0; index < seconds / STEP; index += 1) {
    if (world.status !== 'playing') break;
    const target = name === 'play' ? HERO : objectiveOf(world);
    if (!path || pathTarget === null || pathTarget.x !== target.x || pathTarget.y !== target.y || repathIn <= 0) {
      path = findPath(world, world.thief, target, avoidSeen);
      pathTarget = target;
      repathIn = REPATH_EVERY;
    }
    repathIn -= 1;
    let dir = { x: 0, y: 0 };
    if (path && path.length > 1) {
      while (path.length > 1 && Math.hypot(path[1].x - world.thief.x, path[1].y - world.thief.y) < 20) path.shift();
      const next = path[1];
      if (next) {
        const dx = next.x - world.thief.x;
        const dy = next.y - world.thief.y;
        const len = Math.hypot(dx, dy);
        if (len > 4) dir = { x: dx / len, y: dy / len };
      }
    }
    stepWorld(world, STEP, dir, false);
    if (name === 'alert' && world.alarm.value >= 60) break;
  }
  if (name === 'end' && world.status !== 'won') {
    // The careful pilot did not make it out in time: pose the getaway itself — every
    // piece taken, Wren at the vault door, the alarm quiet — so the frame still shows
    // the win the game is about.
    for (const piece of world.loot) piece.taken = true;
    world.lootCount = world.loot.length;
    world.thief.x = EXIT.x + EXIT.w / 2;
    world.thief.y = 60;
    world.alarm.value = 12;
    world.status = 'won';
  }
  if (world.status === 'won') return { screen: SCREEN_WIN, best: world.time };
  if (world.status === 'caught') return { screen: SCREEN_CAUGHT, best: 0 };
  return { screen: SCREEN_PLAY, best: 0 };
}
