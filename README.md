# The Gilded Vault

A midnight stealth heist in the Halcyon Gallery. Wren the thief slips past night
wardens and sweeping security cameras, pockets the Sun Idol, the Crimson Ruby and
the Moon Portrait, and escapes through the vault door — unseen.

## Play

Open `game/index.html` in a desktop browser (or `node serve.ts` and visit
http://localhost:8080). Move with WASD or the arrow keys, or click to walk. Press
E to drop a smoke pellet (two per run); P pauses. Being seen fills the alarm
meter; a full meter — or a warden's hand — ends the run.

## The entry

- `game/` — the game as static files: `index.html` plus ES modules under `src/`,
  one job per file (guard patrols, camera sweeps, the alarm meter, the thief,
  the room's geometry, the rules, the renderer, the screenshot scenes).
- `screenshots/` — four real renders of the game's own code, taken with headless
  Chrome from `?shot=start|play|alert|end&seed=1` (see `shots.json`, `shots.mjs`).
- `main.ts` — the program that hands the game in: it copies `game/` and
  `screenshots/` to `/output` and writes `dossier.json` with the vendored library.
- `vendor/makefun-game.ts` — the kit's dossier library, copied unchanged.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
