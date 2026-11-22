// The room's geometry: what a walker can stand on, and what a watcher can see through.
// Display cases and the outer walls are solid; a line of sight is blocked when it crosses
// a case. Everything here is pure geometry, no drawing and no game state.

import { CASES, FIELD, WALL } from './config.js';

/** Whether the point (x, y) is inside the walkable interior (inside the outer walls). */
export function insideRoom(x, y) {
  return x > WALL && x < FIELD.width - WALL && y > WALL && y < FIELD.height - WALL;
}

/** Whether a circle at (x, y) with radius r overlaps a wall or a display case. */
export function hitsSolid(x, y, r) {
  if (x - r < WALL || x + r > FIELD.width - WALL || y - r < WALL || y + r > FIELD.height - WALL) return true;
  for (const c of CASES) {
    if (x + r > c.x && x - r < c.x + c.w && y + r > c.y && y - r < c.y + c.h) return true;
  }
  return false;
}

/**
 * Move a circle from (x, y) by (dx, dy) with radius r, sliding along solids: each axis is
 * moved and resolved on its own, so a walker pushed into a wall slides along it instead of
 * sticking. Returns the new position.
 */
export function resolveMove(x, y, dx, dy, r) {
  let nx = x + dx;
  if (hitsSolid(nx, y, r)) nx = x;
  let ny = y + dy;
  if (hitsSolid(nx, ny, r)) ny = y;
  return { x: nx, y: ny };
}

/** Whether the segment from (x1, y1) to (x2, y2) crosses the rectangle r (Liang-Barsky). */
function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

/** Whether the sight line from (x1, y1) to (x2, y2) is blocked by a display case. */
export function lineBlocked(x1, y1, x2, y2) {
  for (const c of CASES) {
    if (segmentHitsRect(x1, y1, x2, y2, c)) return true;
  }
  return false;
}

/**
 * Whether a watcher at (wx, wy) facing `angle` with the given range and half-angle can see
 * the point (tx, ty): inside the range, inside the cone, and with a clear sight line.
 */
export function canSee(wx, wy, angle, range, halfAngle, tx, ty) {
  const dx = tx - wx;
  const dy = ty - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > halfAngle) return false;
  return !lineBlocked(wx, wy, tx, ty);
}
