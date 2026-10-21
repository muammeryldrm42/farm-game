// The neighbors' stalls, in the farm's stall window: the story's folk sell what they have spare, a
// few goods at a time, new ones every few hours (or at once for a few gems). Dearer than the farm's
// own goods: two and a half times what storage pays, more than the farm's stall can ever get for
// them (twice the storage price, and a fifth more on the prettiest farm), so buying to sell again
// never pays. They are the way to come by something an order needs that the farm has run out of,
// and those come first: what the orders on the board are short of. Nothing for the album (the
// fish and the rest are found by the farm itself, not bought).
import { ITEMS, ITEM_LIST } from './data';
import { ALBUM_IDS } from './album';
import { CAST, type CastId } from './story';
import type { GameState } from './state';

export const MARKET = { offers: 6, every: 3 * 3600e3, gems: 2, markup: 2.5, level: 4 };
export interface Offer { item: string; qty: number; price: number; seller: CastId; sold?: boolean }
export interface MarketState { refreshAt: number; offers: Offer[] }

const SELLERS = Object.keys(CAST) as CastId[];
export const offerPrice = (item: string, qty: number) => Math.ceil(ITEMS[item].sell * qty * MARKET.markup);

// `can`: what the farm can come by (makeable in state.ts): the offers are goods of its level, and
// mostly ones it could make too, so they mean something to it
export function genMarket(s: GameState, now: number, can: Set<string>): MarketState {
  const offers: Offer[] = [];
  const has = (id: string) => offers.some((o) => o.item === id);
  const seller = () => SELLERS[Math.floor(Math.random() * SELLERS.length)];
  // what the orders on the board are short of, a couple at most
  const short = new Map<string, number>();
  for (const o of s.orders) {
    if (o.readyAt > now) continue;
    for (const it of o.items) {
      const need = it.qty - (s.inv[it.id] ?? 0);
      if (need > 0 && ITEMS[it.id] && !ALBUM_IDS.has(it.id)) short.set(it.id, Math.max(short.get(it.id) ?? 0, need));
    }
  }
  for (const [id, need] of [...short].sort(() => Math.random() - 0.5).slice(0, 2)) {
    const qty = Math.min(10, need);
    offers.push({ item: id, qty, price: offerPrice(id, qty), seller: seller() });
  }
  // the rest from the goods of the farm's level, those it can make three times as likely
  const pool = ITEM_LIST.filter((i) => i.level <= s.level && i.sell > 0 && !ALBUM_IDS.has(i.id));
  const weight = (id: string) => (can.has(id) ? 3 : 1);
  const total = pool.reduce((a, i) => a + weight(i.id), 0);
  for (let tries = 0; offers.length < MARKET.offers && tries < 60; tries++) {
    let r = Math.random() * total;
    const it = pool.find((i) => (r -= weight(i.id)) <= 0) ?? pool[0];
    if (!it || has(it.id)) continue;
    const qty = Math.max(1, Math.min(10, Math.round(30 / it.sell + Math.random() * 2)));
    offers.push({ item: it.id, qty, price: offerPrice(it.id, qty), seller: seller() });
  }
  return { refreshAt: now + MARKET.every, offers };
}

// a saved market that can still be used (an item since taken out of the game drops the whole lot)
export function validMarket(m: unknown): MarketState | undefined {
  const x = m as MarketState | undefined;
  if (!x || typeof x.refreshAt !== 'number' || !Array.isArray(x.offers)) return undefined;
  return x.offers.every((o) => o && ITEMS[o.item] && o.qty > 0 && o.price > 0 && o.seller in CAST) ? x : undefined;
}
