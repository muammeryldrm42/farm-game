// The YouTube Playables build: `npm run youtube` writes dist/youtube/ and dist/talons-farm-youtube.zip.
// The game is built with NEXT_PUBLIC_TARGET=youtube (src/game/yt.ts: saves in the player's YouTube
// account, no requests of its own, pause and sound from YouTube), then made to work from any folder
// (YouTube serves it from its own place, so every path is relative), YouTube's SDK is loaded before
// anything else, and the files are checked against YouTube's limits.
// The web and Android build in out/ is left as it was.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'out');
const KEEP = path.join(ROOT, '.out-keep');
const DIST = path.join(ROOT, 'dist');
const YT = path.join(DIST, 'youtube');
const ZIP = path.join(DIST, 'talons-farm-youtube.zip');
const SDK = '<script src="https://www.youtube.com/game_api/v1"></script>';
const MiB = 1024 * 1024;

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const rel = (f) => path.relative(YT, f).split(path.sep).join('/');

// ------------------------------------------------ build (the web and Android build put aside meanwhile)
fs.rmSync(KEEP, { recursive: true, force: true });
if (fs.existsSync(OUT)) fs.renameSync(OUT, KEEP);
try {
  execSync('npx next build', { cwd: ROOT, stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_TARGET: 'youtube' } });
  fs.rmSync(YT, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  fs.renameSync(OUT, YT);
} finally {
  fs.rmSync(OUT, { recursive: true, force: true });
  if (fs.existsSync(KEEP)) fs.renameSync(KEEP, OUT);
}

// ------------------------------------------------ only the game: no privacy page (the game shows its own),
// no 404 page, no data for moving between pages, and none of the code for Next's older kind of pages
for (const f of walk(YT)) {
  const r = rel(f);
  if (r !== 'index.html' && (r.endsWith('.html') || r.endsWith('.txt'))) fs.rmSync(f);
  else if (/^_next\/static\/chunks\/main-(?!app)[^/]+\.js$/.test(r)) fs.rmSync(f);
}
for (const d of ['privacy', '404', '_not-found', '_next/static/chunks/pages', '_next/static/chunks/app/privacy', '_next/static/chunks/app/_not-found']) {
  fs.rmSync(path.join(YT, d), { recursive: true, force: true });
}

// ------------------------------------------------ relative paths, and the SDK first
for (const f of walk(YT)) {
  const r = rel(f);
  let s, t;
  if (r === 'index.html') {
    s = fs.readFileSync(f, 'utf8');
    // every root path in the page (scripts, styles, fonts, the icon, and those in the page's data)
    t = s.replace(/(["'(\s,=])\/(_next\/|icon\.svg)/g, '$1./$2').replace(/\\"\/_next\//g, '\\"./_next/');
    t = t.replace('<head>', `<head>${SDK}`);
  } else if (r.endsWith('.css')) {
    s = fs.readFileSync(f, 'utf8');
    // the fonts, from _next/static/css/ to _next/static/media/
    t = s.replace(/url\(\/_next\/static\/media\//g, 'url(../media/');
  } else if (r.endsWith('.js')) {
    s = fs.readFileSync(f, 'utf8');
    // where webpack loads the game's other pieces from
    t = s.replace(/\.p="\/_next\/"/g, '.p="./_next/"');
  } else continue;
  if (t !== s) fs.writeFileSync(f, t);
}

// ------------------------------------------------ checks against YouTube's limits
const problems = [], notes = [];
const files = walk(YT);
let total = 0;
for (const f of files) {
  const r = rel(f), size = fs.statSync(f).size;
  total += size;
  if (!/^[A-Za-z0-9_\-./]+$/.test(r)) problems.push(`file name not allowed: ${r}`);
  if (size >= 30 * MiB) problems.push(`file over 30 MiB: ${r}`);
  if (/\.(html|js|css)$/.test(r)) {
    const s = fs.readFileSync(f, 'utf8');
    if (/["'(]\/_next\//.test(s.replace(/\\"/g, '"'))) problems.push(`root path left in ${r}`);
    for (const w of ['localStorage', 'sessionStorage', 'indexedDB', 'document.cookie']) if (s.includes(w)) problems.push(`${w} in ${r}`);
  }
}
if (!fs.existsSync(path.join(YT, 'index.html'))) problems.push('no index.html');
if (!fs.readFileSync(path.join(YT, 'index.html'), 'utf8').includes(SDK)) problems.push('the SDK is not loaded');
if (total >= 250 * MiB) problems.push(`over 250 MiB in all (${(total / MiB).toFixed(1)} MiB)`);
const big = files.filter((f) => fs.statSync(f).size > 512 * 1024).length;
notes.push(`${files.length} files, ${(total / MiB).toFixed(1)} MiB in all, ${big} over 512 KiB (YouTube recommends smaller, allows up to 30 MiB)`);

// ------------------------------------------------ the zip for YouTube (index.html at its top)
fs.rmSync(ZIP, { force: true });
execSync(`zip -q -r -X ${JSON.stringify(ZIP)} .`, { cwd: YT });
notes.push(`zip: ${path.relative(ROOT, ZIP)} (${(fs.statSync(ZIP).size / MiB).toFixed(1)} MiB)`);

for (const n of notes) console.log(n);
if (problems.length) {
  for (const p of problems) console.error(`PROBLEM: ${p}`);
  process.exit(1);
}
console.log('YouTube build ready');
