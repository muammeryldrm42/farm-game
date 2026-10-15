/** @type {import('next').NextConfig} */
// `output: 'export'` writes the whole game as static files to `out/`, which the Android app
// (Capacitor, see capacitor.config.json) carries inside it: no server or website is needed.
// The YouTube build (NEXT_PUBLIC_TARGET=youtube, see tools/youtube.mjs) leaves the Android app's
// plugins out (src/game/nonative.ts).
import { fileURLToPath } from 'node:url';

const youtube = process.env.NEXT_PUBLIC_TARGET === 'youtube';
const nonative = fileURLToPath(new URL('./src/game/nonative.ts', import.meta.url));

const nextConfig = {
  reactStrictMode: false,
  output: 'export',
  images: { unoptimized: true },
  ...(youtube && {
    webpack: (config) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@capacitor/core$': nonative,
        '@capacitor/app$': nonative,
        '@capacitor/local-notifications$': nonative,
      };
      return config;
    },
  }),
};
export default nextConfig;
