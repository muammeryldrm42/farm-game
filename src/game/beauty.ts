// The farm's beauty. Every decoration, path, fence and flower bed makes the farm a little
// prettier, and fruit trees a little too. Grander things count for more. The first of a kind counts
// fully and more of the same count less and less, and every different kind adds a few points of
// its own: a farm with many kinds of things is prettier than one with a hundred of the same.
// The prettier the farm, the more its customers pay: a small bonus on orders, the boat and the
// stall. Each beauty level also brings a gift of gems the first time it is reached.
import { BUILDING } from './data';
import type { GameState } from './state';

export interface BeautyLevel { name: string; at: number; bonus: number; gems: number }
export const BEAUTY_LEVELS: BeautyLevel[] = [
  { name: 'Plain', at: 0, bonus: 0, gems: 0 },
  { name: 'Tidy', at: 25, bonus: 0.02, gems: 2 },
  { name: 'Pretty', at: 80, bonus: 0.04, gems: 3 },
  { name: 'Charming', at: 200, bonus: 0.06, gems: 5 },
  { name: 'Lovely', at: 450, bonus: 0.08, gems: 8 },
  { name: 'Beautiful', at: 900, bonus: 0.1, gems: 10 },
  { name: 'Picturesque', at: 1600, bonus: 0.12, gems: 15 },
  { name: 'Enchanting', at: 2800, bonus: 0.14, gems: 20 },
  { name: 'Splendid', at: 4500, bonus: 0.16, gems: 25 },
  { name: 'Magnificent', at: 7000, bonus: 0.18, gems: 30 },
  { name: 'Legendary', at: 10000, bonus: 0.2, gems: 50 },
];
// points for every different kind on the farm
export const VARIETY = 3;

// what one of a kind is worth (0: not counted)
export function beautyPoints(type: string) {
  const d = BUILDING[type];
  if (!d) return 0;
  if (d.kind === 'deco') return Math.max(1, Math.round(Math.sqrt(d.cost) / 2));
  if (d.kind === 'tree') return Math.max(1, Math.round(Math.sqrt(d.cost) / 4));
  return 0;
}
// how much the k-th of a kind counts (0 for the first)
const weight = (k: number) => 1 / (1 + k / 4);
// how many of a kind count at all (as many as the shop suggests having)
const counted = (type: string) => Math.max(1, BUILDING[type]?.max ?? 1);
// what n of a kind are worth together
function kindPoints(type: string, n: number) {
  if (!n) return 0;
  let w = 0;
  for (let k = 0; k < Math.min(n, counted(type)); k++) w += weight(k);
  return Math.round(beautyPoints(type) * w) + VARIETY;
}

export interface Beauty { score: number; level: number; kinds: { type: string; n: number; points: number }[] }

export function beautyOf(s: GameState): Beauty {
  const n = new Map<string, number>();
  for (const o of s.objects) if (beautyPoints(o.type)) n.set(o.type, (n.get(o.type) ?? 0) + 1);
  const kinds: Beauty['kinds'] = [];
  let score = 0;
  for (const [type, c] of n) {
    const points = kindPoints(type, c);
    kinds.push({ type, n: c, points });
    score += points;
  }
  kinds.sort((a, b) => b.points - a.points);
  return { score, level: beautyLevelAt(score), kinds };
}

export function beautyLevelAt(score: number) {
  let l = 0;
  while (l + 1 < BEAUTY_LEVELS.length && score >= BEAUTY_LEVELS[l + 1].at) l++;
  return l;
}

// what one more of a kind would add to the farm's beauty now
export function beautyGain(s: GameState, type: string) {
  if (!beautyPoints(type)) return 0;
  const c = s.objects.reduce((a, o) => a + (o.type === type ? 1 : 0), 0);
  return kindPoints(type, c + 1) - kindPoints(type, c);
}
