import type { MetadataRoute } from 'next';

// The web game as an app: added to a phone's home screen it opens full screen with its own icon
// (the Android app's picture). Paths are relative, so it works wherever the site is served from.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Talons Farm',
    short_name: 'Talons Farm',
    description: 'Grow crops, raise animals, craft goods and build your dream farm.',
    start_url: '.',
    scope: '.',
    display: 'fullscreen',
    background_color: '#3f9fd8',
    theme_color: '#3f9fd8',
    icons: [
      { src: 'app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'app-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
