// The Valley Cup: a week long contest among the valley's farms, from level CUP_LEVEL. The farm earns
// points for what it does that week (orders, daily tasks and the daily chest, story chapters, the
// coins its stall takes), counted from where its counters stood when the week began;
// four of the story's folk run farms of their own, whose points grow over the week a few times a
// day, a little differently every week. At the week's end the places are given out, and the farm's
// prize waits in Goals. The weeks run Monday to Sunday on the farm's clock. The stall counts by its
// coins, not its sales, so a run of one-wheat sales earns nothing.
import type { GameState } from './state';
import type { CastId } from './story';

export const CUP_LEVEL = 6;
// what earns points: the farm's counter, the points, how much of the counter earns them, and how
// it is said
export const CUP_POINTS: [string, number, number, string][] = [
  ['orders', 3, 1, 'Deliver an order'],
  ['dailyTask', 4, 1, 'Finish a daily task'],
  ['dailyChest', 6, 1, 'Open the daily chest'],
  ['chapters', 10, 1, 'Finish a story chapter'],
  ['stallCoins', 1, 50, 'Every {n} coins from your stall'],
];
// the other farms, and how keen each is (a share of a steady player's week)
export const RIVALS: { id: string; name: string; who: CastId; keen: number }[] = [
  { id: 'ivy', name: "Ivy's Garden", who: 'ivy', keen: 0.35 },
  { id: 'rosie', name: "Rosie's Bakery Farm", who: 'rosie', keen: 0.6 },
  { id: 'finn', name: "Finn's Wharf", who: 'finn', keen: 0.9 },
  { id: 'hazel', name: "Hazel's Orchard", who: 'hazel', keen: 1.25 },
];
// gems for first to fifth place
export const CUP_PRIZES = [25, 12, 6, 3, 1];

// `week`: the week on now; `base`: the counters when it began; `lv`: the farm's level then (the
// rivals keep to it all week); `from`: when the farm joined, for a first week begun part way;
// `last`: how the week before ended
export interface CupState { week: number; base: Record<string, number>; lv?: number; from?: number; last?: { week: number; place: number; points: number; claimed?: boolean } }

const dayNum = (t: number) => { const d = new Date(t); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const dayStart = (n: number) => { const u = new Date(n * 864e5); return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()).getTime(); };
// 1 January 1970 was a Thursday: day 4 was the first Monday
export const weekOf = (now: number) => Math.floor((dayNum(now) - 4) / 7);
export const weekEnd = (w: number) => dayStart(w * 7 + 11);
const weekStart = (w: number) => dayStart(w * 7 + 4);

export const cupOn = (s: GameState) => s.level >= CUP_LEVEL;

export function cupPoints(s: GameState, c: CupState) {
  let n = 0;
  for (const [k, p, per] of CUP_POINTS) n += p * Math.floor(Math.max(0, (s.stats[k] ?? 0) - (c.base[k] ?? 0)) / per);
  return n;
}

// a steady player's points in a week, one who looks in a few times a day (more at higher levels,
// with more to deliver)
const steady = (level: number) => Math.min(900, 360 + level * 6);
function rnd(a: number, b: number) {
  let x = (Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 2246822507)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 3266489909) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
// a rival's points `now` in the cup's week: their week's total, reached in steps a few times a
// day; in a first week joined part way, only the part left, from nothing when the farm joined
export function rivalPoints(i: number, c: Pick<CupState, 'week' | 'lv' | 'from'>, level: number, now: number) {
  const r = RIVALS[i], w = c.week;
  const ws = weekStart(w), we = weekEnd(w);
  const start = Math.min(we, Math.max(ws, c.from ?? ws));
  const share = (we - start) / (we - ws);
  const total = Math.round(steady(c.lv ?? level) * r.keen * (0.85 + rnd(w, i) * 0.3) * share);
  const k = Math.max(0, Math.min(1, (now - start) / Math.max(1, we - start)));
  // four sittings a day, each farm at its own hours
  const steps = Math.max(1, Math.round(28 * share)), step = Math.floor(k * steps + rnd(w, i + 10) * 0.9);
  return Math.round(total * Math.min(1, step / steps));
}

// the week's table: the farm and its rivals, best first
export function cupBoard(s: GameState, now: number) {
  const c = s.cup ?? { week: weekOf(now) };
  const rows: { id: string; points: number; you?: boolean }[] = RIVALS.map((r, i) => ({ id: r.id, points: rivalPoints(i, c, s.level, now) }));
  rows.push({ id: 'you', points: s.cup ? cupPoints(s, s.cup) : 0, you: true });
  // a tie goes to the farm
  rows.sort((a, b) => b.points - a.points || (a.you ? -1 : b.you ? 1 : 0));
  return rows;
}

// keeps the save's cup on the week on now; when a week has ended, how it ended (true: one ended)
export function keepCup(s: GameState, now: number) {
  const w = weekOf(now);
  const c = s.cup;
  if (c?.week === w) return false;
  const base: Record<string, number> = {};
  for (const [k] of CUP_POINTS) base[k] = s.stats[k] ?? 0;
  if (!c) { s.cup = { week: w, base, lv: s.level, from: now }; return false; }
  // the week that ended: the farm's points against the rivals' totals
  const points = cupPoints(s, c);
  const place = 1 + RIVALS.filter((_, i) => rivalPoints(i, c, s.level, weekEnd(c.week)) > points).length;
  s.cup = { week: w, base, lv: s.level, last: { week: c.week, place, points } };
  return true;
}

export const cupClaimable = (s: GameState) => (s.cup?.last && !s.cup.last.claimed ? 1 : 0);
