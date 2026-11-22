// A night warden: a guard walking a patrol loop, facing where it walks. Its vision cone
// is a wedge in front of it; the world asks visionConeOf for what it can see right now.

import { GUARD } from './config.js';

/** A guard on its route: `at` is the waypoint it walks toward, `back` the direction along it. */
export function createGuard(route) {
  const start = route[0];
  return {
    route,
    at: 1,
    back: false,
    x: start.x,
    y: start.y,
    angle: 0,
    speed: GUARD.speed,
  };
}

/** Walk the guard one step along its route, turning to face its direction of travel. */
export function updateGuard(guard, dt) {
  const target = guard.route[guard.at];
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const move = guard.speed * dt;
  if (dist <= move) {
    guard.x = target.x;
    guard.y = target.y;
    if (guard.at === guard.route.length - 1) guard.back = true;
    else if (guard.at === 0) guard.back = false;
    guard.at += guard.back ? -1 : 1;
  } else {
    guard.x += (dx / dist) * move;
    guard.y += (dy / dist) * move;
    guard.angle = Math.atan2(dy, dx);
  }
}

/** The guard's vision cone right now: where it stands, where it looks, how far it sees. */
export function visionConeOf(guard) {
  return { x: guard.x, y: guard.y, angle: guard.angle, range: GUARD.range, halfAngle: GUARD.halfAngle };
}
