// Wren, the thief: where she stands, how she moves, and her smoke pellets. A pellet
// bursts into a cloud where she drops it; while she stands inside a cloud no watcher can
// see her, so smoke is for crossing a cone, not for hiding in the open forever.

import { PELLETS, THIEF, THIEF_SPAWN } from './config.js';
import { resolveMove } from './room.js';

/** Wren at the door, pellets full, no smoke out. */
export function createThief() {
  return {
    x: THIEF_SPAWN.x,
    y: THIEF_SPAWN.y,
    radius: THIEF.radius,
    facing: -Math.PI / 2,
    pellets: PELLETS.count,
    smoke: [],
  };
}

/** Walk Wren by the (normalised) direction for dt, sliding along walls and cases. */
export function moveThief(thief, dx, dy, dt) {
  const moved = resolveMove(thief.x, thief.y, dx * THIEF.speed * dt, dy * THIEF.speed * dt, thief.radius);
  thief.x = moved.x;
  thief.y = moved.y;
}

/** Drop a smoke pellet at Wren's feet; returns false when she has none left. */
export function dropSmoke(thief) {
  if (thief.pellets <= 0) return false;
  thief.pellets -= 1;
  thief.smoke.push({ x: thief.x, y: thief.y, ttl: PELLETS.seconds });
  return true;
}

/** Age the smoke clouds, dropping the ones whose time is up. */
export function updateSmoke(thief, dt) {
  for (const cloud of thief.smoke) cloud.ttl -= dt;
  thief.smoke = thief.smoke.filter((cloud) => cloud.ttl > 0);
}

/** Whether Wren stands inside one of her own smoke clouds right now. */
export function hiddenBySmoke(thief) {
  for (const cloud of thief.smoke) {
    if (Math.hypot(thief.x - cloud.x, thief.y - cloud.y) < PELLETS.radius) return true;
  }
  return false;
}
