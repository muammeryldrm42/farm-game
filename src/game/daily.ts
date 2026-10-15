// Daily tasks: three small tasks a day, made from what this farm can do (crops it grows, pens with
// animals, workshops whose goods it can make, its fruit trees, the order board, the fishing spot,
// the stall), and a bonus chest for finishing all three. They come with the first visit of the day,
// from level 3, and count from the moment they come. Tasks finished but not claimed by the end of
// their day are handed out when the next day's come.
import { ANIMAL, BUILDING, CROPS, ITEMS, RECIPES } from './data';
import { t as tr } from './i18n';
import type { GameState } from './state';

export const DAILY_LEVEL = 3;
export type DailyKind = 'harvest' | 'collect' | 'make' | 'fruit' | 'orders' | 'fish' | 'stall';
// `key`: the counter in the save that must grow by `target`; `item`: the crop, good or fruit asked for
export interface DailyTask { kind: DailyKind; key: string; item?: string; target: number; coins: number; xp: number; claimed?: boolean }
export interface DailyState {
  day: string;
  tasks: DailyTask[];
  // where the counters stood when the tasks came
  base: Record<string, number>;
  bonus: { coins: number; gems: number; xp: number; claimed?: boolean };
}

// a steady random draw for the day and the farm, so the tasks are the same however often it is asked
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type Draft = Omit<DailyTask, 'coins' | 'xp'>;

// `can`: what the farm can make (makeable in state.ts); `need`: the XP the level asks for
export function genDaily(s: GameState, day: string, can: Set<string>, need: number): DailyState {
  const rnd = rng(hash(day) ^ (s.createdAt % 2147483647));
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
  const lv = s.level;
  const count = (type: string) => s.objects.filter((o) => o.type === type).length;

  const make: Record<DailyKind, () => Draft | null> = {
    // one of the newer crops that grow within half an hour, about half the fields' worth
    harvest: () => {
      const plots = count('plot');
      const crops = CROPS.filter((c) => c.level <= lv && c.time <= 1800);
      if (!plots || !crops.length) return null;
      const c = pick(crops.slice(-6));
      return { kind: 'harvest', key: `harvest:${c.id}`, item: c.id, target: 2 * clamp(Math.round(plots / 2), 3, 10) };
    },
    // the goods of a pen with animals in it, a round or two of them
    collect: () => {
      const herds = new Map<string, number>();
      for (const o of s.objects) {
        const a = o.pen?.animals.length ? o.pen.animals.length : 0;
        const kind = BUILDING[o.type]?.animal;
        if (a && kind) herds.set(kind, (herds.get(kind) ?? 0) + a);
      }
      const list = [...herds].map(([id, n]) => ({ a: ANIMAL[id], n })).filter((h) => h.a && h.a.time <= 7200);
      if (!list.length) return null;
      const h = pick(list);
      return { kind: 'collect', key: `collect:${h.a!.product}`, item: h.a!.product, target: clamp(h.n * (h.a!.time <= 1200 ? 2 : 1), 3, 12) };
    },
    // a good from a workshop on the farm, made within the hour from what the farm has
    make: () => {
      const list = RECIPES.filter((r) => r.level <= lv && r.time <= 3600 && can.has(r.id) && count(r.building) > 0);
      if (!list.length) return null;
      const r = pick(list.slice(-12));
      return { kind: 'make', key: `make:${r.id}`, item: r.id, target: r.qty * (r.time <= 900 ? 3 : 2) };
    },
    // fruit from trees on the farm that are ready again within three hours
    fruit: () => {
      const trees = new Map<string, number>();
      for (const o of s.objects) {
        const d = BUILDING[o.type];
        if (d?.kind === 'tree' && d.fruit && (d.growTime ?? Infinity) <= 3 * 3600) trees.set(d.fruit, (trees.get(d.fruit) ?? 0) + 1);
      }
      if (!trees.size) return null;
      const [fruit, n] = pick([...trees]);
      return { kind: 'fruit', key: `harvest:${fruit}`, item: fruit, target: 2 * Math.min(n, 3) };
    },
    orders: () => ({ kind: 'orders', key: 'orders', target: lv < 10 ? 2 : lv < 40 ? 3 : 4 }),
    fish: () => (s.fishing?.open || s.seaFishing?.open ? { kind: 'fish', key: 'fish', target: rnd() < 0.5 ? 3 : 5 } : null),
    stall: () => (count('stall') ? { kind: 'stall', key: 'stall', target: 3 } : null),
  };

  // the kinds in a fresh order every day; the order board and a crop are there for any farm
  const kinds = Object.keys(make) as DailyKind[];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  const drafts: Draft[] = [];
  // (a small farm may need a second or third crop to make up three)
  for (const k of [...kinds, 'harvest', 'harvest', 'harvest', 'harvest', 'collect', 'collect'] as DailyKind[]) {
    if (drafts.length === 3) break;
    const d = make[k]();
    if (d && !drafts.some((x) => x.key === d.key)) drafts.push(d);
  }
  const coins = Math.round(20 + lv * 10);
  const xp = Math.max(3, Math.round(need * 0.04));
  const tasks = drafts.map((d) => ({ ...d, coins, xp }));
  const base: Record<string, number> = {};
  for (const t of tasks) base[t.key] = s.stats[t.key] ?? 0;
  return { day, tasks, base, bonus: { coins: Math.round(50 + lv * 20), gems: 2, xp: Math.max(5, Math.round(need * 0.08)) } };
}

export function dailyProgress(t: DailyTask, d: DailyState, s: GameState) {
  return Math.min(t.target, Math.max(0, (s.stats[t.key] ?? 0) - (d.base[t.key] ?? 0)));
}
export const dailyDone = (t: DailyTask, d: DailyState, s: GameState) => dailyProgress(t, d, s) >= t.target;
export const dailyAllDone = (d: DailyState, s: GameState) => d.tasks.every((t) => dailyDone(t, d, s));

// what can be claimed now: finished tasks not yet claimed, and the chest once all three are done
export function dailyClaimable(s: GameState) {
  const d = s.daily;
  if (!d) return 0;
  return d.tasks.filter((t) => !t.claimed && dailyDone(t, d, s)).length + (!d.bonus.claimed && dailyAllDone(d, s) ? 1 : 0);
}

export function dailyIcon(t: DailyTask) {
  if (t.item) return ITEMS[t.item]?.icon ?? '❔';
  return t.kind === 'orders' ? '📋' : t.kind === 'fish' ? '🎣' : '🏪';
}

// the task in the player's language
export function dailyText(t: DailyTask) {
  const item = t.item ? tr(ITEMS[t.item]?.name ?? t.item) : '';
  switch (t.kind) {
    case 'harvest': case 'fruit': return tr('Harvest {item} ×{n}', { item, n: t.target });
    case 'collect': return tr('Collect {item} ×{n}', { item, n: t.target });
    case 'make': return tr('Make {item} ×{n}', { item, n: t.target });
    case 'orders': return tr('Deliver orders ×{n}', { n: t.target });
    case 'fish': return tr('Catch anything ×{n}', { n: t.target });
    case 'stall': return tr('Sell at your stall ×3');
  }
}
