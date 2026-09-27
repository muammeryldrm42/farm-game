// Dumps the game's cartoon animal sculpts (src/game/gfx/toon*.ts) as JSON meshes with vertex
// colors plus their pivots, for animals.py to refine and bake in Blender.
// Run: node tools/blender/export_sculpts.mjs [out dir]   (needs `npm install`, uses sucrase)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const out = path.resolve(process.argv[2] ?? path.join(root, 'tools/blender/sculpts'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sculpts-'));
const src = path.join(root, 'src/game/gfx');
execFileSync(path.join(root, 'node_modules/.bin/sucrase'), [src, '-d', tmp, '--transforms', 'typescript'], { stdio: 'inherit' });
// node wants explicit extensions on relative ESM imports
for (const f of fs.readdirSync(tmp)) {
  const p = path.join(tmp, f);
  const code = fs.readFileSync(p, 'utf8').replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'");
  fs.writeFileSync(p.replace(/\.js$/, '.mjs'), code);
}
// three lives in the project's node_modules
fs.symlinkSync(path.join(root, 'node_modules'), path.join(tmp, 'node_modules'));
const { toonMakers } = await import(pathToFileURL(path.join(tmp, 'toon.mjs')).href);
const { toonMakers2 } = await import(pathToFileURL(path.join(tmp, 'toon2.mjs')).href);
const { withDetail } = await import(pathToFileURL(path.join(tmp, 'sdf.mjs')).href);

const dump = (g) => {
  if (!g) return null;
  const pos = g.getAttribute('position'), col = g.getAttribute('color');
  return { p: Array.from(pos.array, (v) => +v.toFixed(5)), c: col ? Array.from(col.array, (v) => +v.toFixed(3)) : null, i: g.index ? Array.from(g.index.array) : null };
};
fs.mkdirSync(out, { recursive: true });
const all = { ...toonMakers, ...toonMakers2 };
for (const [kind, make] of Object.entries(all)) {
  const cp = withDetail(0.9, make);
  const { body, head, leg, tail, ...meta } = cp;
  fs.writeFileSync(path.join(out, `${kind}.json`), JSON.stringify({ meta, body: dump(body), head: dump(head), leg: dump(leg), tail: dump(tail) }));
  console.log('exported', kind);
}
fs.rmSync(tmp, { recursive: true, force: true });
