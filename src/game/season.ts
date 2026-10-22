// Season events: four times a year the valley holds a two week event (Blossom Days in spring,
// Sunny Days in summer, Pumpkin Nights in autumn, Winter Lights at the turn of the year), on the
// same dates every year by the farm's calendar. While one is on, from level SEASON_LEVEL, the
// farm's work earns the event's tokens (counted from where its counters stood when it joined, as
// the Valley Cup counts its points), and the tokens open the steps of a prize track: coins, gems
// and two decorations made for the event, the one halfway and the other at the end. Prizes are
// claimed in the event's window; whatever was reached and not claimed is given when it ends. The
// decorations are the farm's for good: free to place, one of each, and worth nothing when sold.
import type { GameState } from './state';

export const SEASON_LEVEL = 5;
export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';
export interface SeasonDef {
  name: string; icon: string; token: string; tokenName: string; text: string; color: string;
  // the first day (month 1 to 12) and how many days it runs
  month: number; day: number; days: number;
  // the halfway prize and the grand prize
  decos: [string, string];
}
export const SEASONS: Record<SeasonId, SeasonDef> = {
  spring: { name: 'Blossom Days', icon: '🌸', token: '🦋', tokenName: 'Butterflies', text: 'The valley is in bloom and the butterflies are back.', color: '#c8487a', month: 4, day: 1, days: 15, decos: ['blossom_tree', 'butterfly_dome'] },
  summer: { name: 'Sunny Days', icon: '☀️', token: '🐚', tokenName: 'Seashells', text: 'Long sunny days, and seashells all along the shore.', color: '#d8840a', month: 7, day: 10, days: 15, decos: ['lawn_flamingos', 'paddling_pool'] },
  autumn: { name: 'Pumpkin Nights', icon: '🎃', token: '🍬', tokenName: 'Candies', text: 'Lanterns glow in every window and sweets are passed round.', color: '#c85a10', month: 10, day: 20, days: 15, decos: ['jack_lantern', 'lantern_arch'] },
  winter: { name: 'Winter Lights', icon: '⛄', token: '❄️', tokenName: 'Snowflakes', text: 'Lights on every tree, and gifts for the whole valley.', color: '#2a6ab8', month: 12, day: 18, days: 17, decos: ['festive_pine', 'gift_sleigh'] },
};
export const SEASON_IDS = Object.keys(SEASONS) as SeasonId[];
// the event a decoration is the prize of
export const PRIZE_OF: Record<string, SeasonId> = Object.create(null);
for (const id of SEASON_IDS) for (const d of SEASONS[id].decos) PRIZE_OF[d] = id;

// what earns tokens: the farm's counter, the tokens, how much of the counter earns them, and how
// it is said
export const SEASON_TOKENS: [string, number, number, string][] = [
  ['orders', 3, 1, 'Deliver an order'],
  ['dailyTask', 5, 1, 'Finish a daily task'],
  ['boat', 8, 1, 'Send off the cargo boat'],
  ['harvest', 1, 10, 'Every {n} crops harvested'],
  ['make', 1, 4, 'Every {n} goods made'],
  ['collect', 1, 4, 'Every {n} animal goods collected'],
];
// the prize track: the tokens each step needs and what it gives (`coins`: times the level's
// purse; `deco`: the event's first or second decoration)
export interface SeasonStep { at: number; coins?: number; gems?: number; deco?: 0 | 1 }
export const SEASON_TRACK: SeasonStep[] = [
  { at: 30, coins: 2 }, { at: 80, gems: 2 }, { at: 140, coins: 3 }, { at: 210, deco: 0 }, { at: 290, gems: 3 },
  { at: 380, coins: 4 }, { at: 480, gems: 5 }, { at: 590, coins: 5 }, { at: 700, gems: 5 }, { at: 820, deco: 1 },
];
export const seasonPurse = (level: number) => 30 + level * 5;

// `id`, `year`: the event joined; `base`: the counters then; `got`: the steps claimed
export interface SeasonSave { id: SeasonId; year: number; base: Record<string, number>; got: number }

// days counted from 1970 in the farm's own calendar (as fest.ts), and back
const dayNum = (t: number) => { const d = new Date(t); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const dayStart = (n: number) => { const u = new Date(n * 864e5); return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()).getTime(); };
const firstDay = (id: SeasonId, year: number) => Math.round(Date.UTC(year, SEASONS[id].month - 1, SEASONS[id].day) / 864e5);

// the event on at `now`, with when it began and ends; null between events
export function seasonNow(now: number): { id: SeasonId; year: number; start: number; end: number } | null {
  const day = dayNum(now), year = new Date(now).getFullYear();
  for (const id of SEASON_IDS) {
    for (const y of [year - 1, year]) {
      const f = firstDay(id, y);
      if (day >= f && day < f + SEASONS[id].days) return { id, year: y, start: dayStart(f), end: dayStart(f + SEASONS[id].days) };
    }
  }
  return null;
}

// the next event to begin after `now`, and when
export function seasonNext(now: number): { id: SeasonId; at: number } {
  const day = dayNum(now), year = new Date(now).getFullYear();
  let best: { id: SeasonId; at: number; f: number } | null = null;
  for (const id of SEASON_IDS) {
    for (const y of [year, year + 1]) {
      const f = firstDay(id, y);
      if (f > day && (!best || f < best.f)) best = { id, at: dayStart(f), f };
    }
  }
  return { id: best!.id, at: best!.at };
}

export const seasonOn = (s: GameState) => s.level >= SEASON_LEVEL;

export function seasonTokens(s: GameState, e: SeasonSave) {
  let n = 0;
  for (const [k, p, per] of SEASON_TOKENS) n += p * Math.floor(Math.max(0, (s.stats[k] ?? 0) - (e.base[k] ?? 0)) / per);
  return n;
}

// the steps reached and not yet claimed
export function seasonReady(s: GameState) {
  const e = s.season;
  if (!e) return 0;
  const n = seasonTokens(s, e);
  let k = 0;
  for (let i = e.got; i < SEASON_TRACK.length && SEASON_TRACK[i].at <= n; i++) k++;
  return k;
}

// the farm starts counting when it joins an event that is on
export function joinSeason(s: GameState, ev: { id: SeasonId; year: number }): SeasonSave {
  const base: Record<string, number> = {};
  for (const [k] of SEASON_TOKENS) base[k] = s.stats[k] ?? 0;
  return { id: ev.id, year: ev.year, base, got: 0 };
}

export const hasPrize = (s: GameState, id: string) => !!s.prizes?.includes(id);
