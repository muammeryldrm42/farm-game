import type { Metadata, Viewport } from 'next';
import { Fredoka } from 'next/font/google';
import './globals.css';

const fredoka = Fredoka({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-game' });

const description = 'Grow crops, raise animals, craft goods and build your dream farm. By Talons Protocol.';
export const metadata: Metadata = {
  title: 'Talons Farm',
  description,
  applicationName: 'Talons Farm',
  // what a shared link shows (in chats and on social sites)
  openGraph: { title: 'Talons Farm', description, type: 'website', siteName: 'Talons Farm' },
  twitter: { card: 'summary', title: 'Talons Farm', description },
  // added to an iPhone's home screen: full screen, under the status bar
  appleWebApp: { capable: true, title: 'Talons Farm', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3f9fd8',
  // the game reaches the screen's edges (and round a camera cutout); the HUD keeps to the safe area
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fredoka.variable}>
      <body className="font-game">{children}</body>
    </html>
  );
}
