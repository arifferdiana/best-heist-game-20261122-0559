// Take the entry's screenshots: start the static server, render each scene in
// shots.json with the headless Chrome shell, and write the PNGs to screenshots/.
//   node shots.mjs
// The shell is the Playwright headless shell this machine keeps under ~/.cache.
import { execFile, spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const chrome = join(
  homedir(),
  '.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell',
);
const port = 8901;
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));

const server = spawn(process.execPath, [join(here, 'serve.ts'), '--port', String(port)], { stdio: 'ignore' });

async function waitForServer(tries = 50) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/index.html`);
      if (res.ok) return;
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('the game server did not come up');
}

function takeShot(url, out) {
  return new Promise((resolve, reject) => {
    execFile(
      chrome,
      ['--headless', '--disable-gpu', '--no-sandbox', `--screenshot=${out}`, '--window-size=1280,720', '--virtual-time-budget=8000', '--hide-scrollbars', url],
      (error, _stdout, stderr) => {
        if (error) reject(new Error(`chrome failed for ${url}: ${stderr}`));
        else resolve();
      },
    );
  });
}

try {
  await waitForServer();
  for (const shot of shots) {
    const out = join(here, 'screenshots', shot.name);
    await takeShot(`http://127.0.0.1:${port}/${shot.query}`, out);
    console.log(`wrote ${out}`);
  }
} finally {
  server.kill();
}
