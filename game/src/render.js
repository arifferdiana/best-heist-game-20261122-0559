// The renderer: one canvas, one logical 1280x720 field scaled to the window, everything
// drawn with canvas paths (no images, no assets). It paints the vault room, the watchers
// and their vision cones, Wren, the loot, the smoke, and the HUD — the alarm meter, the
// loot count, the timer and the pellets — and the title, pause, win and caught screens
// over the room.

import { CASES, EXIT, FIELD, FONT, LOOT_SPOTS, PALETTE, PELLETS, WALL } from './config.js';
import { alarmBand } from './alarm.js';
import { visionConeOf as guardCone } from './guard.js';
import { visionConeOf as cameraCone } from './camera.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_CAUGHT = 'caught';

/** Seconds as MM:SS. */
export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    scale = Math.min(w / FIELD.width, h / FIELD.height);
    offsetX = (w - FIELD.width * scale) / 2;
    offsetY = (h - FIELD.height * scale) / 2;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
  }

  window.addEventListener('resize', resize);
  resize();

  /** A client point as a logical field point, or null when it is outside the field. */
  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - offsetX) / scale;
    const y = (clientY - rect.top - offsetY) / scale;
    if (x < 0 || y < 0 || x > FIELD.width || y > FIELD.height) return null;
    return { x, y };
  }

  function roundRectPath(x, y, w, h, r) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  function drawCone(cone, fill) {
    ctx.beginPath();
    ctx.moveTo(cone.x, cone.y);
    ctx.arc(cone.x, cone.y, cone.range, cone.angle - cone.halfAngle, cone.angle + cone.halfAngle);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(238, 241, 245, 0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawLootPiece(piece, time) {
    const twinkle = 0.55 + 0.45 * Math.sin(time * 3 + piece.x);
    // The pedestal.
    ctx.fillStyle = '#39415a';
    ctx.fillRect(piece.x - 16, piece.y + 8, 32, 12);
    ctx.fillStyle = '#4a5578';
    ctx.fillRect(piece.x - 12, piece.y - 2, 24, 12);
    // The glow, then the piece itself.
    const glow = ctx.createRadialGradient(piece.x, piece.y - 8, 2, piece.x, piece.y - 8, 34);
    glow.addColorStop(0, `rgba(242, 201, 76, ${0.5 * twinkle})`);
    glow.addColorStop(1, 'rgba(242, 201, 76, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(piece.x, piece.y - 8, 34, 0, 2 * Math.PI);
    ctx.fill();
    if (piece.name === 'Sun Idol') {
      ctx.fillStyle = PALETTE.loot;
      ctx.beginPath();
      ctx.moveTo(piece.x, piece.y - 26);
      ctx.lineTo(piece.x + 11, piece.y - 6);
      ctx.lineTo(piece.x - 11, piece.y - 6);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(piece.x, piece.y - 12, 5, 0, 2 * Math.PI);
      ctx.fill();
    } else if (piece.name === 'Crimson Ruby') {
      ctx.fillStyle = '#e5534b';
      ctx.beginPath();
      ctx.moveTo(piece.x, piece.y - 26);
      ctx.lineTo(piece.x + 10, piece.y - 12);
      ctx.lineTo(piece.x, piece.y + 2);
      ctx.lineTo(piece.x - 10, piece.y - 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(piece.x, piece.y - 22);
      ctx.lineTo(piece.x + 4, piece.y - 12);
      ctx.lineTo(piece.x, piece.y - 14);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = PALETTE.caseGold;
      ctx.fillRect(piece.x - 13, piece.y - 28, 26, 22);
      ctx.fillStyle = '#dfe6f2';
      ctx.fillRect(piece.x - 10, piece.y - 25, 20, 16);
      ctx.fillStyle = '#8a6d3b';
      ctx.beginPath();
      ctx.arc(piece.x, piece.y - 17, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
    // The sparkle.
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
    const sx = piece.x + 16;
    const sy = piece.y - 26;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 5);
    ctx.lineTo(sx + 1.5, sy - 1.5);
    ctx.lineTo(sx + 5, sy);
    ctx.lineTo(sx + 1.5, sy + 1.5);
    ctx.lineTo(sx, sy + 5);
    ctx.lineTo(sx - 1.5, sy + 1.5);
    ctx.lineTo(sx - 5, sy);
    ctx.lineTo(sx - 1.5, sy - 1.5);
    ctx.closePath();
    ctx.fill();
  }

  function drawThief(thief) {
    ctx.save();
    ctx.translate(thief.x, thief.y);
    ctx.rotate(thief.facing + Math.PI / 2);
    // The cloak: a hooded triangle with a gold clasp.
    ctx.fillStyle = PALETTE.thiefCloak;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(13, 12);
    ctx.lineTo(-13, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.thief;
    ctx.beginPath();
    ctx.arc(0, -6, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#1a1030';
    ctx.beginPath();
    ctx.arc(0, -6, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = PALETTE.loot;
    ctx.beginPath();
    ctx.arc(0, 8, 2.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  function drawGuard(guard, seeing) {
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = PALETTE.guardTrim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.radius - 4, guard.angle - 1.1, guard.angle + 1.1);
    ctx.stroke();
    // The facing tick: which way this warden looks.
    ctx.strokeStyle = PALETTE.guardTrim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * (guard.radius + 9), guard.y + Math.sin(guard.angle) * (guard.radius + 9));
    ctx.stroke();
    if (seeing) {
      ctx.fillStyle = '#e5534b';
      ctx.font = 'bold 16px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - guard.radius - 8);
    }
  }

  function drawCamera(camera) {
    ctx.fillStyle = PALETTE.cameraBody;
    ctx.fillRect(camera.x - 9, camera.y - 9, 18, 18);
    ctx.fillStyle = '#cfe6ff';
    ctx.beginPath();
    ctx.arc(camera.x + Math.cos(camera.angle) * 8, camera.y + Math.sin(camera.angle) * 8, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  function drawHud(world) {
    const band = alarmBand(world.alarm);
    const alarmColour = band === 'critical' ? PALETTE.alarmCritical : band === 'wary' ? PALETTE.alarmWarn : PALETTE.alarmCalm;
    ctx.textBaseline = 'middle';

    // Alarm meter, top left.
    roundRectPath(34, 34, 330, 52, 8);
    ctx.fillStyle = 'rgba(32, 38, 57, 0.85)';
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText('ALARM', 48, 52);
    ctx.fillStyle = '#10141f';
    roundRectPath(48, 62, 240, 12, 6);
    ctx.fill();
    ctx.fillStyle = alarmColour;
    const alarmWidth = Math.max(4, (240 * world.alarm.value) / 100);
    roundRectPath(48, 62, alarmWidth, 12, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px ' + FONT;
    ctx.fillText(`${Math.floor(world.alarm.value)}%`, 298, 68);

    // Loot, top right.
    roundRectPath(FIELD.width - 264, 34, 230, 52, 8);
    ctx.fillStyle = 'rgba(32, 38, 57, 0.85)';
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText(`LOOT  ${world.lootCount}/3`, FIELD.width - 250, 60);
    for (let i = 0; i < 3; i += 1) {
      const cx = FIELD.width - 96 + i * 26;
      const cy = 60;
      ctx.fillStyle = world.loot[i].taken ? PALETTE.loot : 'rgba(238,241,245,0.25)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx + 7, cy);
      ctx.lineTo(cx, cy + 8);
      ctx.lineTo(cx - 7, cy);
      ctx.closePath();
      ctx.fill();
    }

    // Timer and smoke, bottom corners.
    roundRectPath(34, FIELD.height - 86, 150, 52, 8);
    ctx.fillStyle = 'rgba(32, 38, 57, 0.85)';
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 20px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText(formatTime(world.time), 48, FIELD.height - 60);
    roundRectPath(FIELD.width - 184, FIELD.height - 86, 150, 52, 8);
    ctx.fillStyle = 'rgba(32, 38, 57, 0.85)';
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px ' + FONT;
    ctx.fillText(`SMOKE  ×${world.thief.pellets}`, FIELD.width - 170, FIELD.height - 60);

    // The controls hint, bottom centre.
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '13px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('WASD / arrows move · click to walk · E smoke · P pause', FIELD.width / 2, FIELD.height - 60);

    // A critical alarm bleeds red at the edges.
    if (band === 'critical') {
      const pulse = 0.12 + 0.08 * Math.sin(world.time * 6);
      ctx.strokeStyle = `rgba(229, 83, 75, ${pulse})`;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, FIELD.width - 10, FIELD.height - 10);
    }
  }

  function drawOverlay(title, titleColour, lines, best) {
    ctx.fillStyle = 'rgba(10, 12, 20, 0.74)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = titleColour;
    ctx.font = 'bold 64px ' + FONT;
    ctx.fillText(title, FIELD.width / 2, 250);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px ' + FONT;
    lines.forEach((line, i) => {
      ctx.fillText(line, FIELD.width / 2, 330 + i * 34);
    });
    if (best !== null && best !== undefined) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '16px ' + FONT;
      ctx.fillText(`Best getaway: ${formatTime(best)}`, FIELD.width / 2, 330 + lines.length * 34 + 12);
    }
  }

  /** Paint the world on the given screen, with the best getaway time when one exists. */
  function draw(world, screen, best) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);

    // The floor: dark tiles with a faint grid, and a gold runner up the middle.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.floorTile;
    for (let x = WALL; x < FIELD.width - WALL; x += 80) {
      for (let y = WALL; y < FIELD.height - WALL; y += 80) {
        if (((x + y) / 80) % 2 === 0) ctx.fillRect(x, y, 80, 80);
      }
    }
    ctx.fillStyle = '#33261a';
    ctx.fillRect(604, 80, 72, 540);
    ctx.fillStyle = PALETTE.wallTrim;
    ctx.fillRect(604, 80, 3, 540);
    ctx.fillRect(673, 80, 3, 540);

    // The outer walls with their gold trim.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, WALL);
    ctx.fillRect(0, FIELD.height - WALL, FIELD.width, WALL);
    ctx.fillRect(0, 0, WALL, FIELD.height);
    ctx.fillRect(FIELD.width - WALL, 0, WALL, FIELD.height);
    ctx.fillStyle = PALETTE.wallTrim;
    ctx.fillRect(WALL, WALL, FIELD.width - 2 * WALL, 2);
    ctx.fillRect(WALL, FIELD.height - WALL - 2, FIELD.width - 2 * WALL, 2);
    ctx.fillRect(WALL, WALL, 2, FIELD.height - 2 * WALL);
    ctx.fillRect(FIELD.width - WALL - 2, WALL, 2, FIELD.height - 2 * WALL);

    // The vault door: sealed red until every loot is taken, open green after.
    const open = world.lootCount === LOOT_SPOTS.length;
    ctx.fillStyle = '#10141f';
    ctx.fillRect(EXIT.x, 0, EXIT.w, EXIT.h);
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 3;
    ctx.strokeRect(EXIT.x + 2, 2, EXIT.w - 4, EXIT.h - 2);
    ctx.fillStyle = open ? PALETTE.exitOpen : PALETTE.exitLocked;
    ctx.beginPath();
    ctx.arc(EXIT.x + EXIT.w / 2, EXIT.h - 14, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 12px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText(open ? 'EXIT' : 'LOCKED', EXIT.x + EXIT.w / 2, EXIT.h - 34);

    // The display cases, glass and a glint of gold on each.
    for (const c of CASES) {
      roundRectPath(c.x, c.y, c.w, c.h, 6);
      ctx.fillStyle = PALETTE.caseBody;
      ctx.fill();
      ctx.fillStyle = PALETTE.caseGlass;
      roundRectPath(c.x + 6, c.y + 6, c.w - 12, Math.min(18, c.h - 12), 4);
      ctx.fill();
      ctx.fillStyle = PALETTE.caseGold;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2 + 6, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // The loot, still on its pedestal.
    for (const piece of world.loot) {
      if (!piece.taken) drawLootPiece(piece, world.sparkle);
    }

    // The vision cones, calm gold and camera blue, red where a watcher sees Wren.
    for (const guard of world.guards) {
      const cone = guardCone(guard);
      const seeing = world.seeing.includes(guard);
      drawCone(cone, seeing ? PALETTE.coneSeen : PALETTE.coneCalm);
    }
    for (const camera of world.cameras) {
      const cone = cameraCone(camera);
      const seeing = world.seeing.includes(camera);
      drawCone(cone, seeing ? PALETTE.coneSeen : PALETTE.cameraCone);
    }

    // The smoke, then the wardens, the cameras, and Wren on top.
    for (const cloud of world.thief.smoke) {
      const alpha = Math.max(0, cloud.ttl / PELLETS.seconds) * 0.55;
      ctx.fillStyle = `rgba(190, 198, 214, ${alpha})`;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, PELLETS.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cloud.x - 30, cloud.y + 12, PELLETS.radius * 0.6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cloud.x + 32, cloud.y - 10, PELLETS.radius * 0.55, 0, 2 * Math.PI);
      ctx.fill();
    }
    for (const guard of world.guards) drawGuard(guard, world.seeing.includes(guard));
    for (const camera of world.cameras) drawCamera(camera);
    drawThief(world.thief);

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(world);

    if (screen === SCREEN_TITLE) {
      drawOverlay('THE GILDED VAULT', PALETTE.loot, [
        'A midnight heist in the Halcyon Gallery.',
        'Take the Sun Idol, the Crimson Ruby and the Moon Portrait,',
        'then slip out through the vault door — unseen.',
        'Wardens patrol with lantern cones. Cameras sweep the room.',
        'WASD / arrows move · click to walk · E smoke pellet · P pause',
        '',
        'Press Space or click to begin.',
      ], best);
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay('PAUSED', PALETTE.text, ['Press P to keep stealing.'], null);
    } else if (screen === SCREEN_WIN) {
      drawOverlay('CLEAN GETAWAY!', PALETTE.exitOpen, [
        `Loot 3/3 · Time ${formatTime(world.time)}`,
        'Wren slips into the night with the gallery\'s finest.',
        '',
        'Press Space to play again.',
      ], best);
    } else if (screen === SCREEN_CAUGHT) {
      drawOverlay('SPOTTED!', PALETTE.exitLocked, [
        'The wardens caught Wren in the lamplight.',
        `Loot ${world.lootCount}/3 · Time ${formatTime(world.time)}`,
        '',
        'Press Space to try again.',
      ], null);
    }
  }

  return { draw, toLogical, resize };
}
