// Every tuning number, colour and room fixture in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule depends on the
// screen size. All positions are in logical pixels, y growing downward.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** The outer wall's thickness; the room's walkable interior is inside it. */
export const WALL = 24;

export const THIEF = { radius: 14, speed: 252, grabRadius: 30 };

export const GUARD = {
  radius: 15,
  speed: 74,
  range: 262,
  halfAngle: (35 * Math.PI) / 180,
  catchRadius: 30,
};

export const CAMERA = {
  range: 305,
  halfAngle: (30 * Math.PI) / 180,
  sweep: (55 * Math.PI) / 180,
  sweepSpeed: 0.55,
};

/** The alarm meter: how fast being seen fills it, how fast hiding drains it, and its bands. */
export const ALARM = { rise: 46, decay: 13, warn: 55, critical: 80 };

export const PELLETS = { count: 2, radius: 96, seconds: 3 };

/** The three pieces of loot, each with its pedestal spot and its display name. */
export const LOOT_SPOTS = [
  { x: 198, y: 158, name: 'Sun Idol' },
  { x: 1082, y: 158, name: 'Crimson Ruby' },
  { x: 640, y: 296, name: 'Moon Portrait' },
];

/** The vault door: a gap in the top wall. Walking into it with all three loot wins. */
export const EXIT = { x: 580, y: 0, w: 120, h: 78 };

/** Where Wren the thief starts: bottom centre, just inside the doors. */
export const THIEF_SPAWN = { x: 640, y: 648 };

/**
 * Display cases: solid cover. They block movement and block a watcher line of sight, so
 * the room's routes run between them. Each is {x, y, w, h} in logical pixels.
 */
export const CASES = [
  { x: 296, y: 118, w: 184, h: 62 },
  { x: 800, y: 118, w: 184, h: 62 },
  { x: 516, y: 336, w: 248, h: 72 },
  { x: 148, y: 416, w: 72, h: 164 },
  { x: 1060, y: 416, w: 72, h: 164 },
  { x: 516, y: 556, w: 248, h: 62 },
];

/** Each guard's patrol: a loop of waypoints it walks, there and back again. */
export const GUARD_ROUTES = [
  [
    { x: 300, y: 92 },
    { x: 980, y: 92 },
  ],
  [
    { x: 400, y: 258 },
    { x: 880, y: 258 },
    { x: 880, y: 482 },
    { x: 400, y: 482 },
  ],
  [
    { x: 100, y: 200 },
    { x: 100, y: 500 },
  ],
];

/** Each camera's wall mount, the direction it faces at rest, and its sweep phase. */
export const CAMERAS = [
  { x: 42, y: 42, base: Math.PI / 4, phase: 0 },
  { x: 1238, y: 42, base: (3 * Math.PI) / 4, phase: 2.1 },
];

export const PALETTE = {
  floor: '#151a26',
  floorTile: '#1a2030',
  wall: '#2b3247',
  wallTrim: '#c9a227',
  caseBody: '#232c40',
  caseGlass: '#3d4a66',
  caseGold: '#c9a227',
  loot: '#f2c94c',
  lootGlow: '#f2c94c',
  exitLocked: '#e5534b',
  exitOpen: '#58c98a',
  thief: '#7c5cff',
  thiefCloak: '#4a358f',
  guard: '#2e4a6b',
  guardTrim: '#9fc3e8',
  coneCalm: 'rgba(242, 201, 76, 0.20)',
  coneSeen: 'rgba(229, 83, 75, 0.42)',
  cameraCone: 'rgba(120, 200, 255, 0.16)',
  cameraBody: '#3a4a63',
  smoke: 'rgba(190, 198, 214, 0.55)',
  hudPanel: '#202639',
  text: '#eef1f5',
  muted: '#9aa3b5',
  alarmCalm: '#58c98a',
  alarmWarn: '#f2c94c',
  alarmCritical: '#e5534b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best (fastest) getaway time is kept between visits, this browser only. */
export const BEST_KEY = 'gilded-vault.best';
