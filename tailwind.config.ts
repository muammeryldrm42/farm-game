import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { game: ['var(--font-game)', 'system-ui', 'sans-serif'] },
      keyframes: {
        pop: { '0%': { transform: 'scale(.9) translateY(12px)', opacity: '0' }, '100%': { transform: 'scale(1) translateY(0)', opacity: '1' } },
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      // nudge: a few bobs (again now and then, see Hud), for what waits on the HUD for a long time
      animation: { pop: 'pop .22s cubic-bezier(.2,1.4,.4,1) both', bob: 'bob 1.4s ease-in-out infinite', nudge: 'bob 1.4s ease-in-out 3 both' },
    },
  },
  plugins: [],
};
export default config;
