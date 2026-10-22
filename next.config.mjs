/** @type {import('next').NextConfig} */
// `output: 'export'` writes the whole game as static files to `out/`, which the Android app
// (Capacitor, see capacitor.config.json) carries inside it: no server or website is needed.
// The YouTube build (NEXT_PUBLIC_TARGET=youtube, see tools/youtube.mjs) leaves the Android app's
// plugins out (src/game/nonative.ts).
import { fileURLToPath } from 'node:url';

const youtube = process.env.NEXT_PUBLIC_TARGET === 'youtube';
const nonative = fileURLToPath(new URL('./src/game/nonative.ts', import.meta.url));
const dracoUrl = fileURLToPath(new URL('./tools/draco-url-loader.cjs', import.meta.url));

const nextConfig = {
  reactStrictMode: false,
  output: 'export',
  images: { unoptimized: true },
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
