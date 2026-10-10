// Seasons and the rain schedule, shared by the renderer (sky, rain drops) and the game rules
// (rain waters the fields). The schedule is a pure function of time, so everyone agrees on it.
import { now as clockNow } from './clock';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export function seasonOf(d = new Date(clockNow())): Season {
  const m = d.getMonth();
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}

function hash(x: number, y: number, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// one game day, the same length as the day and night cycle
export const DAY_MS = 16 * 60 * 1000;
const SHOWER_S = 240;

// Not every day brings weather: some days get one shower of about four minutes (snow in winter),
// at a different time each day; the rest stay clear.
export function weatherAt(now: number, season: Season = seasonOf()) {
  const day = Math.floor(now / DAY_MS);
  const chance = season === 'summer' ? 0.18 : season === 'winter' ? 0.35 : 0.3;
  if (hash(day, 3, 5) >= chance) return { kind: 'clear' as const, k: 0 };
  const start = hash(day, 7, 5) * (DAY_MS / 1000 - SHOWER_S);
  const into = (now % DAY_MS) / 1000 - start;
  if (into < 0 || into > SHOWER_S) return { kind: 'clear' as const, k: 0 };
  const k = Math.max(0, Math.min(1, Math.min(into / 10, (SHOWER_S - into) / 10)));
  return { kind: season === 'winter' ? ('snow' as const) : ('rain' as const), k };
}

export const isRaining = (now: number) => weatherAt(now).kind === 'rain';
