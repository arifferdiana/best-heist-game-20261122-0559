// Sound, generated, never a file: short WebAudio beeps. The context is made on the
// first user gesture (browsers block sound before one), and every call is a no-op without
// it, so the game also runs silent in a screenshot.

export function createAudio() {
  let context = null;

  function ensure() {
    if (context) return context;
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return null;
      context = new AC();
    } catch {
      return null;
    }
    return context;
  }

  function tone(freq, seconds, type, gain, delay = 0) {
    const ctx = ensure();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(gain, ctx.currentTime + delay);
      amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + seconds);
      osc.connect(amp).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + seconds);
    } catch {
      // Sound is decoration; a failure never breaks the game.
    }
  }

  let lastSpotted = 0;

  return {
    /** Make the context on a gesture, so the first real sound is allowed to play. */
    unlock() {
      ensure();
    },
    playLoot() {
      tone(880, 0.12, 'sine', 0.12);
      tone(1318, 0.18, 'sine', 0.1, 0.09);
    },
    playSpotted() {
      const now = performance.now();
      if (now - lastSpotted < 800) return;
      lastSpotted = now;
      tone(660, 0.1, 'square', 0.05);
      tone(520, 0.12, 'square', 0.05, 0.11);
    },
    playWin() {
      tone(523, 0.14, 'sine', 0.12);
      tone(659, 0.14, 'sine', 0.12, 0.12);
      tone(784, 0.22, 'sine', 0.12, 0.24);
    },
    playCaught() {
      tone(392, 0.25, 'sawtooth', 0.08);
      tone(196, 0.4, 'sawtooth', 0.08, 0.2);
    },
  };
}
