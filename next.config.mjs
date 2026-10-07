/** @type {import('next').NextConfig} */
// `output: 'export'` writes the whole game as static files to `out/`, which the Android app
// (Capacitor, see capacitor.config.json) carries inside it: no server or website is needed.
const nextConfig = { reactStrictMode: false, output: 'export', images: { unoptimized: true } };
export default nextConfig;
