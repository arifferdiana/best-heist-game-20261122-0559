// Keyboard and pointer input. Held keys give a steering direction; one-shot presses
// (confirm, pause, smoke) are queued as bit flags and taken once by the loop, so a press
// between two frames is never lost and never counted twice. A mouse click sets a walk
// target the thief heads for until a key is pressed.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SMOKE = 4;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const SMOKE = new Set(['KeyE']);

export function createInput(canvas, toLogical) {
  const held = { up: false, down: false, left: false, right: false };
  let actions = 0;
  let target = null;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) held.up = true;
    else if (DOWN.has(event.code)) held.down = true;
    else if (LEFT.has(event.code)) held.left = true;
    else if (RIGHT.has(event.code)) held.right = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (SMOKE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_SMOKE;
    } else return;
    if (UP.has(event.code) || DOWN.has(event.code) || LEFT.has(event.code) || RIGHT.has(event.code)) target = null;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) held.up = false;
    else if (DOWN.has(event.code)) held.down = false;
    else if (LEFT.has(event.code)) held.left = false;
    else if (RIGHT.has(event.code)) held.right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    held.up = false;
    held.down = false;
    held.left = false;
    held.right = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    actions |= ACTION_CONFIRM;
    const point = toLogical(event.clientX, event.clientY);
    if (point) target = point;
  });

  return {
    /**
     * The steering direction right now, normalised: held keys first, else toward the
     * click target (which clears itself on arrival), else still.
     */
    direction(from) {
      const dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      const dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        return { x: dx / len, y: dy / len };
      }
      if (target) {
        const tx = target.x - from.x;
        const ty = target.y - from.y;
        const len = Math.hypot(tx, ty);
        if (len < 6) {
          target = null;
          return { x: 0, y: 0 };
        }
        return { x: tx / len, y: ty / len };
      }
      return { x: 0, y: 0 };
    },
    /** Forget a click target (a fresh game starts with nowhere to walk to). */
    clearTarget() {
      target = null;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
