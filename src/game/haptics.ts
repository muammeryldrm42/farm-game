// A light touch of the phone's vibration with some of the game's sounds (a harvest, goods collected,
// coins, a building, a level, a rare find, a no), on phones that can; a quick run of harvests
// buzzes now and then, not at each one. Off in Settings, and never inside YouTube.
import type { Sfx } from './state';

const YT_BUILD = process.env.NEXT_PUBLIC_TARGET === 'youtube';
const PATTERN: Partial<Record<Sfx, number | number[]>> = {
  harvest: 8, collect: 12, coin: 10, build: 15, error: 25, levelup: [30, 60, 30], rare: [20, 50, 20, 50, 20],
};
let last = 0;

export const canBuzz = () => !YT_BUILD && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function buzz(n: Sfx | number) {
  const p = typeof n === 'number' ? n : PATTERN[n];
  if (p === undefined || !canBuzz()) return;
  const t = performance.now();
  if (typeof p === 'number' && t - last < 90) return;
  last = t;
  try { navigator.vibrate(p); } catch { /* not allowed before the first touch */ }
}
