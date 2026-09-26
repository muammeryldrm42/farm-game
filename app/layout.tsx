import type { Metadata, Viewport } from 'next';
import { Fredoka } from 'next/font/google';
import './globals.css';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-game' });

export const metadata: Metadata = {
  title: 'Talons Farm',
  description: 'Grow crops, raise animals, craft goods and build your dream farm. By Talons Protocol.',
  applicationName: 'Talons Farm',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3f9fd8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fredoka.variable}>
      <body className="font-game">{children}</body>
    </html>
  );
}
