/** @type {import('next').NextConfig} */
// `output: 'export'` writes the whole game as static files to `out/`, which the Android app
// (Capacitor, see capacitor.config.json) carries inside it: no server or website is needed.
// The YouTube build (NEXT_PUBLIC_TARGET=youtube, see tools/youtube.mjs) leaves the Android app's
// plugins out (src/game/nonative.ts).
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const youtube = process.env.NEXT_PUBLIC_TARGET === 'youtube';
const nonative = fileURLToPath(new URL('./src/game/nonative.ts', import.meta.url));
const dracoUrl = fileURLToPath(new URL('./tools/draco-url-loader.cjs', import.meta.url));

// On the website each model's address carries a few letters of what is in it
// (models/barn.glb?v=Xy3_q9): a model changed in a release is fetched afresh at once, where the
// browser would go on showing the one it had (with the new game, for up to a day), and one left
// as it was stays in the browser's cache with no asking again (vercel.json keeps models a year).
// The Android app reads its own files (the letters change nothing there); the YouTube build
// keeps the plain addresses.
const modelsDir = fileURLToPath(new URL('./public/models/', import.meta.url));
// (keyed as the game names them: barn, lod/barn...)
const modelV = youtube ? {} : Object.fromEntries(readdirSync(modelsDir, { recursive: true }).map(String).filter((f) => f.endsWith('.glb')).map((f) => [
  f.slice(0, -4).split('\\').join('/'),
  createHash('sha1').update(readFileSync(modelsDir + f)).digest('base64url').slice(0, 6),
]));

// The game's version, shown at the foot of the settings: a few letters of everything the game is
// made from (its code, texts, pictures and models, the packages it uses). The website and the
// Android app made from the same game show the same letters, whatever commit or machine built
// them, so a look at both tells whether they are the same game. (Hidden files, as a Mac's
// .DS_Store, are left out: they are not part of the game.)
const root = fileURLToPath(new URL('./', import.meta.url));
function gameVersion() {
  const files = ['package.json', 'package-lock.json', 'next.config.mjs', 'postcss.config.mjs', 'tailwind.config.ts', 'tools/draco-url-loader.cjs'];
  for (const dir of ['app', 'public', 'src']) {
    for (const e of readdirSync(root + dir, { recursive: true, withFileTypes: true })) {
      const path = `${e.parentPath ?? e.path}/${e.name}`.slice(root.length).split('\\').join('/');
      if (e.isFile() && !path.split('/').some((p) => p.startsWith('.') || p === '__pycache__')) files.push(path);
    }
  }
  const h = createHash('sha1');
  for (const f of files.sort()) h.update(f).update('\0').update(readFileSync(root + f)).update('\0');
  return h.digest('hex').slice(0, 7);
}

const nextConfig = {
  reactStrictMode: false,
  output: 'export',
  images: { unoptimized: true },
  env: { MODEL_V: JSON.stringify(modelV), GAME_VERSION: gameVersion() },
  webpack: (config) => {
    // the two builds keep their own webpack caches: sharing one, a build would take the other's
    // modules (the YouTube build the Android app's plugins, or the reverse)
    if (config.cache && typeof config.cache === 'object') config.cache = { ...config.cache, name: `${config.name}-${config.mode}-${youtube ? 'youtube' : 'web'}` };
    // the Draco decoder copies three.js names are not bundled (see tools/draco-url-loader.cjs)
    config.module.rules.push({ test: /[\\/]three[\\/]examples[\\/]jsm[\\/]loaders[\\/]DRACOLoader\.js$/, use: [dracoUrl] });
    if (youtube) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@capacitor/core$': nonative,
        '@capacitor/app$': nonative,
        '@capacitor/local-notifications$': nonative,
      };
    }
    return config;
  },
};
export default nextConfig;
