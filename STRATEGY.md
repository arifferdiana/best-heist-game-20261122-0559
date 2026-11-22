# Strategy — The Gilded Vault

## The game

A top-down stealth heist in one vault room. The judge's first criterion is a
complete heist game shown in one frame: the cover screenshot (01-cover.png) is
the play scene mid-heist — Wren crossing the room, three wardens with vision
cones, two sweeping cameras, all three loot pedestals, and the alarm meter
partway up. Every element is canvas-drawn, original, and named in the game:
Wren, the Halcyon Gallery, the Sun Idol, the Crimson Ruby, the Moon Portrait.

## Depth (criterion 2)

Three routes around the room (left, right, and the centre case), patrols and
cones that must be read before moving, and a tool at a cost: two smoke pellets
that hide Wren inside their cloud. The alarm is a gradient, not a switch —
being seen fills it, hiding drains it — so a clipped cone is a scare, not an
instant loss.

## Feel and polish (criterion 3)

Cones turn red the moment a watcher sees Wren, the alarm's edge bleeds red
past 80, and the getaway pays off the planning: the vault door shows LOCKED
until the third loot, then EXIT. Win and caught screens state the time and the
loot, and the best getaway time is kept between visits.

## Structure (criterion 5)

The source is split into files with one clear job each, named for what they do:
guard.js (patrol, visionCone), camera.js (sweep, visionCone), alarm.js (meter),
thief.js (move, smoke), room.js (cover, line of sight), world.js (rules),
render.js (canvas, HUD), shots.js (the screenshot scenes), audio.js (WebAudio
beeps). No library is vendored; the only vendored file is the kit's own
makefun-game.ts.

## Screenshots

Four real renders of the game's own code, taken with the headless Chrome shell
from the deterministic scenes behind `?shot=start|play|alert|end&seed=1`:
01-cover (mid-heist, everything in one frame), 02-title, 03-win (the
getaway), 04-alert (caught in a cone, alarm high). The scenes play the real
rules forward with a seeded autopilot; the win scene poses the getaway when
the pilot runs out of time.
