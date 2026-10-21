// Farm festivals: every three days a festival comes to the farm for two of them, each with its own
// bonus (crops grow faster, workshops work faster, the pens give more, orders pay more, the fish
// bite sooner), then a quiet day before the next. Which one comes is picked for the farm, only one
// it can enjoy (no fishing festival before there is a fishing spot) and never the same one twice
// in a row, and kept in the save, so it stays the same all its days and the next one can be shown
// ahead. The days are the farm clock's, midnight to midnight. From level FEST_LEVEL.
import { BUILDING } from './data';
import type { GameState } from './state';

export const FEST_LEVEL = 4;
export type FestKind = 'harvest' | 'craft' | 'animals' | 'market' | 'fish';
// (`color`: the festival's border and lettering on the game's cream panels)
export const FESTS: Record<FestKind, { name: string; icon: string; text: string; color: string }> = {
  harvest: { name: 'Harvest Festival', icon: '🌾', text: 'Crops planted now grow 25% faster.', color: '#a8700a' },
  craft: { name: 'Craft Fair', icon: '🔨', text: 'Goods started now are made 25% faster.', color: '#a04a1a' },
  animals: { name: 'Animal Fair', icon: '🐄', text: 'Every animal has a 1 in 4 chance of an extra product.', color: '#b8327a' },
  market: { name: 'Market Days', icon: '💰', text: 'Orders pay 25% more coins.', color: '#2d7a2a' },
  fish: { name: 'Fishing Festival', icon: '🎣', text: 'Fish bite twice as fast.', color: '#1f6fae' },
};
// the bonuses: crops and goods take this much of their time, the chance of an extra animal
// product, the coins more on an order, and the wait for a bite
export const FEST_FAST = 0.75;
export const FEST_EXTRA = 0.25;
export const FEST_COINS = 0.25;
export const FEST_BITE = 0.5;

// a festival for DAYS days of every CYCLE
const CYCLE = 3, DAYS = 2;
// `slot`: the festival's place in the run of cycles; `kinds`: the festival of that slot and of
// the next; `seen`: the festival window was opened while it was on
export interface FestSave { slot: number; kinds: [FestKind, FestKind]; seen?: boolean }

// the day a time falls on, counted from 1970 in the farm's own calendar, and back
const dayNum = (t: number) => { const d = new Date(t); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const dayStart = (n: number) => { const u = new Date(n * 864e5); return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()).getTime(); };

export const festOn = (s: GameState) => s.level >= FEST_LEVEL;

// the festivals this farm can enjoy now
function open(s: GameState): FestKind[] {
  const out: FestKind[] = ['harvest', 'market'];
  if (s.objects.some((o) => BUILDING[o.type]?.kind === 'production')) out.push('craft');
  if (s.objects.some((o) => o.pen?.animals.length)) out.push('animals');
  if (s.fishing?.open || s.seaFishing?.open) out.push('fish');
  return out;
}

// a steady pick for the slot and the farm, never `not`
function pick(s: GameState, slot: number, not?: FestKind): FestKind {
  const list = open(s).filter((k) => k !== not);
  let x = (Math.imul(slot + 1, 2654435761) ^ (s.createdAt % 2147483647)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0;
  return list[((x ^ (x >>> 16)) >>> 0) % list.length];
}

// the festivals of the slot `now` falls in and of the next, from the save when it has them
function kindsAt(s: GameState, slot: number): [FestKind, FestKind] {
  const f = s.fest;
  if (f?.slot === slot) return f.kinds;
  const cur = f?.slot === slot - 1 ? f.kinds[1] : pick(s, slot, f?.slot === slot - 2 ? f.kinds[1] : undefined);
  return [cur, pick(s, slot + 1, cur)];
}

// the festival on now (null on the quiet day), when it ends, and the next one and when it starts
export function festNow(s: GameState, now: number) {
  const day = dayNum(now);
  const slot = Math.floor(day / CYCLE);
  const [cur, next] = kindsAt(s, slot);
  const on = day - slot * CYCLE < DAYS;
  return { slot, kind: on ? cur : null, end: dayStart(slot * CYCLE + DAYS), next, nextAt: dayStart((slot + 1) * CYCLE) };
}

export const festActive = (s: GameState, now: number, kind: FestKind) => festOn(s) && festNow(s, now).kind === kind;

// keeps the save's festivals to the slot on now: true when they changed (a new slot began)
export function keepFest(s: GameState, now: number) {
  const f = festNow(s, now);
  if (s.fest?.slot === f.slot) return false;
  s.fest = { slot: f.slot, kinds: kindsAt(s, f.slot) };
  return true;
}
