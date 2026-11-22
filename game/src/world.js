// The world: one heist, its state and its rules. A step moves Wren, walks the wardens,
// sweeps the cameras, and then asks who can see her: seen fills the alarm, hidden drains
// it, a full alarm or a warden's hand ends the run, and three pieces of loot plus the vault
// door win it. Nothing here draws or listens; it only decides.

import { CAMERAS, EXIT, GUARD, GUARD_ROUTES, LOOT_SPOTS, THIEF } from './config.js';
import { createAlarm, updateAlarm } from './alarm.js';
import { createCamera, updateCamera, visionConeOf as cameraCone } from './camera.js';
import { createGuard, updateGuard, visionConeOf as guardCone } from './guard.js';
import { createThief, dropSmoke, hiddenBySmoke, moveThief, updateSmoke } from './thief.js';
import { canSee } from './room.js';

/** A loot piece was grabbed. */
export const EVENT_LOOT = 1;
/** A watcher has just started seeing Wren (the rising edge of being seen). */
export const EVENT_SPOTTED = 2;
/** Wren was caught: the alarm filled, or a warden reached her. */
export const EVENT_CAUGHT = 4;
/** All three loot, and Wren reached the vault door. */
export const EVENT_WIN = 8;

/** A fresh heist: Wren at the door, wardens on patrol, loot on its pedestals. */
export function createWorld(random) {
  return {
    random,
    thief: createThief(),
    guards: GUARD_ROUTES.map((route) => createGuard(route)),
    cameras: CAMERAS.map((def) => createCamera(def)),
    loot: LOOT_SPOTS.map((spot) => ({ ...spot, taken: false })),
    alarm: createAlarm(),
    time: 0,
    sparkle: 0,
    lootCount: 0,
    status: 'playing',
    seen: false,
    // The watchers seeing Wren right now (guard or camera objects), for the renderer.
    seeing: [],
  };
}

/** Put a world back to its first night: a fresh thief, patrols and loot, alarm silent. */
export function resetWorld(world) {
  const fresh = createWorld(world.random);
  Object.assign(world, fresh);
}

/**
 * Whether the point (x, y) is seen by any watcher right now (cone plus a clear sight
 * line). The autopilot asks this of the places it thinks of walking to.
 */
export function exposureAt(world, x, y) {
  for (const guard of world.guards) {
    const cone = guardCone(guard);
    if (canSee(cone.x, cone.y, cone.angle, cone.range, cone.halfAngle, x, y)) return true;
  }
  for (const camera of world.cameras) {
    const cone = cameraCone(camera);
    if (canSee(cone.x, cone.y, cone.angle, cone.range, cone.halfAngle, x, y)) return true;
  }
  return false;
}

/**
 * Advance the heist by dt seconds. `move` is Wren's normalised steering direction,
 * `smoke` drops a pellet. Returns the EVENT_* flags of what happened in this step.
 */
export function stepWorld(world, dt, move, smoke) {
  if (world.status !== 'playing') return 0;
  let events = 0;
  world.time += dt;
  world.sparkle += dt;

  const moving = move.x !== 0 || move.y !== 0;
  if (moving) world.thief.facing = Math.atan2(move.y, move.x);
  moveThief(world.thief, move.x, move.y, dt);
  if (smoke) dropSmoke(world.thief);
  updateSmoke(world.thief, dt);
  for (const guard of world.guards) updateGuard(guard, dt);
  for (const camera of world.cameras) updateCamera(camera, dt);

  // Who can see Wren? Smoke hides her; otherwise every warden and camera gets a look.
  const hidden = hiddenBySmoke(world.thief);
  const seeing = [];
  if (!hidden) {
    for (const guard of world.guards) {
      const cone = guardCone(guard);
      if (canSee(cone.x, cone.y, cone.angle, cone.range, cone.halfAngle, world.thief.x, world.thief.y)) seeing.push(guard);
    }
    for (const camera of world.cameras) {
      const cone = cameraCone(camera);
      if (canSee(cone.x, cone.y, cone.angle, cone.range, cone.halfAngle, world.thief.x, world.thief.y)) seeing.push(camera);
    }
  }
  const wasSeen = world.seen;
  world.seen = seeing.length > 0;
  world.seeing = seeing;
  if (world.seen && !wasSeen) events |= EVENT_SPOTTED;

  // A full alarm ends the run where she stands.
  if (updateAlarm(world.alarm, dt, world.seen)) {
    world.status = 'caught';
    return events | EVENT_CAUGHT;
  }

  // A warden catching Wren by hand ends it too.
  for (const guard of world.guards) {
    if (Math.hypot(guard.x - world.thief.x, guard.y - world.thief.y) < GUARD.catchRadius + THIEF.radius) {
      world.status = 'caught';
      return events | EVENT_CAUGHT;
    }
  }

  // Loot within reach is pocketed.
  for (const piece of world.loot) {
    if (!piece.taken && Math.hypot(piece.x - world.thief.x, piece.y - world.thief.y) < THIEF.grabRadius) {
      piece.taken = true;
      world.lootCount += 1;
      events |= EVENT_LOOT;
    }
  }

  // The vault door opens only with every piece taken; reaching it then is the getaway.
  if (
    world.lootCount === LOOT_SPOTS.length &&
    world.thief.x > EXIT.x &&
    world.thief.x < EXIT.x + EXIT.w &&
    world.thief.y - world.thief.radius < EXIT.h
  ) {
    world.status = 'won';
    events |= EVENT_WIN;
  }
  return events;
}
