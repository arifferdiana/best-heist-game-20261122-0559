// A wall-mounted security camera: it never moves, but its lens sweeps back and forth
// around its rest direction, so its vision cone is a moving wedge to be timed.

import { CAMERA } from './config.js';

/** A camera on its mount: `t` is its sweep clock, `angle` where its lens points now. */
export function createCamera(def) {
  return { x: def.x, y: def.y, base: def.base, phase: def.phase, t: def.phase, angle: def.base };
}

/** Advance the sweep: the lens swings like a pendulum around its rest direction. */
export function updateCamera(camera, dt) {
  camera.t += dt;
  camera.angle = camera.base + CAMERA.sweep * Math.sin(camera.t * CAMERA.sweepSpeed);
}

/** The camera's vision cone right now: where it hangs, where it looks, how far it sees. */
export function visionConeOf(camera) {
  return { x: camera.x, y: camera.y, angle: camera.angle, range: CAMERA.range, halfAngle: CAMERA.halfAngle };
}
