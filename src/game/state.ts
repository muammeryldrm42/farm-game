// Talons Farm - game state, persistence and all player actions
import { ANIMAL, BUILDING, BUILDINGS, CATCHES, CROP, ITEMS, ITEM_LIST, RECIPE, type BuildingDef } from './data';
import { isRaining } from './weather';
import { LAST_CHAPTER, chapterAt, taskProgress, type StoryState } from './story';

export const GRID = 68;
// the map grew three times, from 28 to 44 tiles, then to 60, then to 68 with a sandy beach all
// round; each time older farms are moved by this many tiles so they stay in the middle
export const MAP_OFF = 8;
export const MAP_OFF2 = 8;
export const MAP_OFF3 = 4;
// where the starting layout (written for the first 28 tile map) sits on today's map
export const FARM_OFF = MAP_OFF + MAP_OFF2 + MAP_OFF3;
export const CHUNK = 4;
export const NCH = GRID / CHUNK;
// the outer ring of chunks is the beach: always open, but only beach things stand on the sand
export const isBeachChunk = (cx: number, cy: number) => cx === 0 || cy === 0 || cx === NCH - 1 || cy === NCH - 1;
export const isBeachTile = (x: number, y: number) => isBeachChunk(Math.floor(x / CHUNK), Math.floor(y / CHUNK));
// a natural lake on the east side, part of the land: never for sale and never built on. Its
// chunks hold the water and a grassy bank round it.
// it lies inland in the north east woods, up past the pastures and well back from the beach
export const LAKE = { x: 52, z: 22, rx: 3.2, rz: 4.5 };
export const isLakeChunk = (cx: number, cy: number) => cx >= 12 && cx <= 13 && cy >= 4 && cy <= 6;
export const isLakeTile = (x: number, y: number) => isLakeChunk(Math.floor(x / CHUNK), Math.floor(y / CHUNK));
export const lakeE = (x: number, z: number) => Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz);
// the tiles under water (their middles inside the waterline, with a little room for the bank)
export const inLakeWater = (x: number, y: number) => lakeE(x + 0.5, y + 0.5) < 1.08;
export const SAVE_KEY = 'talons-farm-save-v1';

export interface FishingData { open: boolean; castAt: number | null; catchAt: number | null }
// the fishing spot lies in the sea just off the south shore
export const FISH_SPOT = { x: GRID / 2, y: GRID + 2.3 };
export const FISHING = { level: 5, cost: 800, time: 45 };
// `watered`: the current crop got its drink (by hand, rain or a sprinkler) and grows faster
export interface PlotData { crop: string | null; plantedAt: number; watered?: boolean }
export interface QueueEntry { recipe: string; startAt: number; endsAt: number }
export interface ProdData { queue: QueueEntry[]; slots: number }
// `graze`: the animal left through the open gate at `at` to eat grass (bees: nectar); `back`
// is set when it was called home early. A full animal walks back and starts producing.
export interface Animal { id: number; fedAt: number | null; graze?: { at: number; back?: number } }
export interface PenData { animals: Animal[] }
export interface TreeData { startAt: number }
export interface StallSlot { item: string | null; qty: number; price: number; listedAt: number; soldAt: number }
export interface Crate { item: string; qty: number; coins: number; xp: number; filled: boolean }
export interface Boat { crates: Crate[]; leavesAt: number; returnAt: number; bonusCoins: number; bonusGems: number }

export interface FarmObject {
  id: number;
  type: string;
  x: number;
  y: number;
  plot?: PlotData;
  prod?: ProdData;
  pen?: PenData;
  tree?: TreeData;
}

export interface OrderItem { id: string; qty: number }
export interface Order { id: number; items: OrderItem[]; coins: number; xp: number; gems: number; readyAt: number }

export interface Settings { sound: boolean; dayNight: boolean; clouds: boolean; music: boolean; weather: boolean; shadows: boolean }

export interface GameState {
  v: 1;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  inv: Record<string, number>;
  siloLevel: number;
  barnLevel: number;
  chunks: string[];
  objects: FarmObject[];
  orders: Order[];
  nextId: number;
  lastDaily: string;
  streak: number;
  stats: Record<string, number>;
  quests: string[];
  settings: Settings;
  createdAt: number;
  stall: StallSlot[];
  boat: Boat | null;
  achievements: Record<string, number>;
  tutorial: number;
  mapV?: number;
  fishing?: FishingData;
  restedOn?: string; // day key of the last nap that earned the rested bonus
  water?: { n: number; at: number }; // the bucket: waterings left, and when it was last filled
  starterWell?: boolean; // the free well every farm gets has been handed out
  lake?: boolean | number; // which lake site was cleared of anything built there (5: the current one)
  story?: StoryState; // the story chapter on now, where its counters stood when it began, and the last one told
}

// ---------------------------------------------------------------- helpers

export const xpNeed = (level: number) => Math.floor(15 * Math.pow(level, 1.6)) + 5;
// Each storage upgrade adds more room than the one before (+25, +30, +35 ...), so a well
// upgraded silo keeps up with the hundreds of goods the later levels bring.
export const upgradeStep = (lvl: number) => 25 + 5 * lvl;
export const capAt = (lvl: number) => 50 + 25 * lvl + (5 * lvl * (lvl - 1)) / 2;
export const siloCap = (s: GameState) => capAt(s.siloLevel);
export const barnCap = (s: GameState) => capAt(s.barnLevel);
export const storageCap = (s: GameState, k: 'silo' | 'barn') => (k === 'silo' ? siloCap(s) : barnCap(s));
// the price climbs steeply at first, then steadily, so big storage stays in reach late in the game
export const upgradeCost = (lvl: number) => Math.round((150 * Math.pow(1.5, Math.min(lvl, 12)) + Math.max(0, lvl - 12) * 30000) / 10) * 10;
export const gemCost = (ms: number) => Math.max(1, Math.ceil(ms / 60000));
export const slotCost = (slots: number) => 4 + (slots - 3) * 3;
export const MAX_SLOTS = 7;
export const orderCount = (level: number) => Math.min(8, 3 + Math.floor(level / 3));
export const maxPlots = (level: number) => Math.min(60, 6 + level * 2);

export function storageUsed(s: GameState, k: 'silo' | 'barn') {
  let n = 0;
  for (const id in s.inv) if (ITEMS[id] && ITEMS[id].storage === k) n += s.inv[id];
  return n;
}

export function fmtTime(ms: number) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  if (t < 60) return `${t}s`;
  const m = Math.floor(t / 60);
  if (m < 60) return `${m}m ${t % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function fmtNum(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString('en-US');
}

// ---------------------------------------------------------------- watering
// Watering is a bonus, never a chore: a watered crop needs 30% less of its remaining time, an
// unwatered one grows as before. Water is carried in a bucket filled at a well (every farm gets
// one); rain waters every field for free, and sprinklers water the fields around them.
export const WATER = { bucket: 5, boost: 0.3, sprinklerRange: 2 };

export function waterInfo(s: GameState, _now?: number) {
  const n = Math.min(WATER.bucket, Math.max(0, s.water?.n ?? WATER.bucket));
  const wells = s.objects.filter((o) => o.type === 'well').length;
  return { n, max: WATER.bucket, wells };
}

export const needsWater = (o: FarmObject, now: number) => {
  const pp = plotProgress(o, now);
  return !!pp.crop && !pp.ready && !o.plot?.watered;
};

export function plotProgress(o: FarmObject, now: number) {
  const p = o.plot;
  if (!p || !p.crop) return { crop: null as string | null, p: 0, ready: false, remaining: 0 };
  const c = CROP[p.crop];
  const total = c.time * 1000;
  const el = now - p.plantedAt;
  return { crop: p.crop, p: Math.min(1, el / total), ready: el >= total, remaining: Math.max(0, total - el) };
}

export function prodInfo(o: FarmObject, now: number) {
  const q = o.prod?.queue ?? [];
  const done = q.filter((e) => e.endsAt <= now);
  const current = q.find((e) => e.endsAt > now && e.startAt <= now) ?? null;
  const pending = q.filter((e) => e.startAt > now);
  const progress = current ? (now - current.startAt) / (current.endsAt - current.startAt) : 0;
  return { done, current, pending, progress };
}

export function animalReady(a: { fedAt: number | null }, time: number, now: number) {
  return a.fedAt !== null && now >= a.fedAt + time * 1000;
}

// ---------------------------------------------------------------- grazing
// A trip out of the pen: a walk to the pasture, a meal, and a walk home. Times are fixed so the
// rules stay a pure function of time (offline too); the renderer paces the walks to fit.
// grazing is slow and free; the feed trough is quick and costs feed
export const GRAZE = { walkMs: 12e3, eatMs: 450e3, beeEatMs: 350e3 };

export function grazePhase(a: Animal, now: number, bee = false) {
  const g = a.graze;
  if (!g) return { phase: 'in' as const, k: 0 };
  const { walkMs } = GRAZE, eatMs = bee ? GRAZE.beeEatMs : GRAZE.eatMs;
  if (g.back !== undefined) {
    const k = (now - g.back) / walkMs;
    return k >= 1 ? { phase: 'home' as const, k: 1 } : { phase: 'returning' as const, k, from: g.back };
  }
  const t = now - g.at;
  if (t < walkMs) return { phase: 'leaving' as const, k: t / walkMs };
  if (t < walkMs + eatMs) return { phase: 'eating' as const, k: (t - walkMs) / eatMs };
  if (t < 2 * walkMs + eatMs) return { phase: 'returning' as const, k: (t - walkMs - eatMs) / walkMs, from: g.at + walkMs + eatMs };
  return { phase: 'full' as const, k: 1, doneAt: g.at + 2 * walkMs + eatMs };
}

export function penInfo(o: FarmObject, now: number) {
  const d = BUILDING[o.type];
  const an = ANIMAL[d.animal ?? ''];
  const list = o.pen?.animals ?? [];
  let ready = 0, fed = 0, hungry = 0, out = 0, soonest = Infinity, soonestP = 0;
  for (const a of list) {
    if (a.graze) out++;
    if (a.fedAt === null) { if (!a.graze) hungry++; }
    else if (animalReady(a, an.time, now)) ready++;
    else {
      fed++;
      const rem = a.fedAt + an.time * 1000 - now;
      if (rem < soonest) { soonest = rem; soonestP = 1 - rem / (an.time * 1000); }
    }
  }
  return { animal: an, ready, fed, hungry, out, total: list.length, soonest, progress: soonestP };
}

export function treeInfo(o: FarmObject, now: number) {
  const d = BUILDING[o.type];
  const total = (d.growTime ?? 60) * 1000;
  const start = o.tree?.startAt ?? now;
  const el = now - start;
  return { fruit: d.fruit ?? 'apple', p: Math.min(1, el / total), ready: el >= total, remaining: Math.max(0, total - el) };
}

export const STALL_SLOTS = 4;
export const emptySlot = (): StallSlot => ({ item: null, qty: 0, price: 0, listedAt: 0, soldAt: 0 });
export const stallValue = (item: string, qty: number) => ITEMS[item].sell * qty;

export function boatState(s: GameState, now: number): 'none' | 'docked' | 'away' {
  if (!s.boat) return 'none';
  if (s.boat.crates.length && now < s.boat.leavesAt) return 'docked';
  return 'away';
}

export function genBoat(s: GameState, now: number): Boat {
  const pool = ITEM_LIST.filter((i) => i.level <= s.level && !i.id.endsWith('_feed'));
  const n = s.level < 10 ? 3 : s.level < 14 ? 4 : 6;
  const crates: Crate[] = [];
  for (let i = 0; i < n; i++) {
    const it = pool[Math.floor(Math.random() * pool.length)];
    const qty = Math.max(2, Math.min(it.storage === 'silo' ? 10 : 6, Math.round(60 / it.sell + Math.random() * 2)));
    const value = it.sell * qty;
    crates.push({ item: it.id, qty, coins: Math.round(value * 1.5), xp: Math.max(3, Math.round(value / 5)), filled: false });
  }
  const total = crates.reduce((a, c) => a + c.coins, 0);
  return { crates, leavesAt: now + 2 * 3600e3, returnAt: 0, bonusCoins: Math.round(total * 0.5), bonusGems: 1 + (Math.random() < 0.3 ? 1 : 0) };
}

export function feedHint(feed: string) {
  const r = RECIPE[feed];
  if (r) return `Make it at the ${BUILDING[r.building].name}.`;
  if (CROP[feed]) return 'Grow it in your fields.';
  return '';
}

export const horseBonus = (s: GameState) => Math.min(5, s.objects.filter((o) => o.type === 'stable').reduce((a, o) => a + (o.pen?.animals.length ?? 0), 0)) * 0.05;

export function canFulfill(s: GameState, o: Order, now: number) {
  return o.readyAt <= now && o.items.every((it) => (s.inv[it.id] ?? 0) >= it.qty);
}

export function chunkState(s: GameState, cx: number, cy: number): 'open' | 'buyable' | 'locked' | 'beach' | 'lake' {
  if (cx < 0 || cy < 0 || cx >= NCH || cy >= NCH) return 'locked';
  if (isBeachChunk(cx, cy)) return 'beach';
  if (isLakeChunk(cx, cy)) return 'lake';
  if (s.chunks.includes(`${cx},${cy}`)) return 'open';
  const n = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  return n.some(([dx, dy]) => s.chunks.includes(`${cx + dx},${cy + dy}`)) ? 'buyable' : 'locked';
}

export function expandInfo(s: GameState) {
  const n = Math.max(0, s.chunks.length - 9);
  // prices grow fast at first, then level off so the bigger map stays reachable
  const cost = 300 * Math.pow(1.35, Math.min(n, 18)) + Math.max(0, n - 18) * 3000;
  return { cost: Math.round(cost / 10) * 10, level: Math.min(35, 2 + Math.floor(n * 0.8)) };
}

export function fishingInfo(s: GameState, now: number) {
  const f = s.fishing;
  if (!f?.open) return { state: 'locked' as const, remaining: 0, p: 0 };
  if (f.castAt === null || f.catchAt === null) return { state: 'idle' as const, remaining: 0, p: 0 };
  const total = f.catchAt - f.castAt;
  if (now >= f.catchAt) return { state: 'ready' as const, remaining: 0, p: 1 };
  return { state: 'waiting' as const, remaining: f.catchAt - now, p: (now - f.castAt) / total };
}

// Everything that can bite at the fishing spot: [item, level, weight]. Rarer, later catches
// carry smaller weights, so a golden fish stays a thrill even at level 200.
export { CATCHES };
export function pickCatch(level: number, roll: number) {
  const open = CATCHES.filter(([, lv]) => level >= lv);
  let r = roll * open.reduce((a, [, , w]) => a + w, 0);
  for (const [id, , w] of open) { r -= w; if (r <= 0) return id; }
  return 'fish';
}

export const NAP_MS = 20000;
export const restBonus = (level: number) => 40 + level * 10;

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dailyReward(streak: number) {
  const day = ((streak - 1) % 7) + 1;
  return { day, coins: 30 + day * 30, gems: day === 7 ? 5 : day % 3 === 0 ? 1 : 0 };
}

// ---------------------------------------------------------------- quests

export interface Quest { id: string; text: string; target: number; coins: number; gems: number; xp: number; progress: (s: GameState) => number }
const st = (s: GameState, k: string) => s.stats[k] ?? 0;
const cnt = (s: GameState, type: string) => s.objects.filter((o) => o.type === type).length;

export const QUESTS: Quest[] = [
  { id: 'q1', text: 'Harvest 10 wheat', target: 10, coins: 40, gems: 0, xp: 5, progress: (s) => st(s, 'harvest:wheat') },
  { id: 'q2', text: 'Build a bakery', target: 1, coins: 50, gems: 1, xp: 5, progress: (s) => cnt(s, 'bakery') },
  { id: 'q3', text: 'Bake 3 bread', target: 3, coins: 60, gems: 0, xp: 8, progress: (s) => st(s, 'make:bread') },
  { id: 'q4', text: 'Deliver 3 orders', target: 3, coins: 100, gems: 1, xp: 10, progress: (s) => st(s, 'orders') },
  { id: 'q5', text: 'Clear 3 obstacles', target: 3, coins: 60, gems: 0, xp: 8, progress: (s) => st(s, 'clear') },
  { id: 'q6', text: 'Own 10 fields', target: 10, coins: 80, gems: 0, xp: 10, progress: (s) => cnt(s, 'plot') },
  { id: 'q7', text: 'Build a chicken coop', target: 1, coins: 100, gems: 1, xp: 10, progress: (s) => cnt(s, 'coop') },
  { id: 'q8', text: 'Collect 10 eggs', target: 10, coins: 120, gems: 0, xp: 12, progress: (s) => st(s, 'collect:egg') },
  { id: 'q9', text: 'Reach level 5', target: 5, coins: 200, gems: 2, xp: 0, progress: (s) => s.level },
  { id: 'q10', text: 'Expand your farm', target: 1, coins: 150, gems: 2, xp: 15, progress: (s) => st(s, 'expand') },
  { id: 'q11', text: 'Deliver 15 orders', target: 15, coins: 300, gems: 2, xp: 30, progress: (s) => st(s, 'orders') },
  { id: 'q12', text: 'Collect 20 milk', target: 20, coins: 350, gems: 1, xp: 30, progress: (s) => st(s, 'collect:milk') },
  { id: 'q13', text: 'Make 50 goods', target: 50, coins: 400, gems: 2, xp: 40, progress: (s) => st(s, 'make') },
  { id: 'q14', text: 'Harvest 500 crops', target: 500, coins: 600, gems: 3, xp: 50, progress: (s) => st(s, 'harvest') },
  { id: 'q15', text: 'Reach level 10', target: 10, coins: 800, gems: 5, xp: 0, progress: (s) => s.level },
  { id: 'q16', text: 'Deliver 50 orders', target: 50, coins: 1200, gems: 5, xp: 80, progress: (s) => st(s, 'orders') },
  { id: 'q17', text: 'Earn 10,000 coins', target: 10000, coins: 1000, gems: 5, xp: 60, progress: (s) => st(s, 'earned') },
  { id: 'q18', text: 'Collect 30 wool', target: 30, coins: 1500, gems: 5, xp: 80, progress: (s) => st(s, 'collect:wool') },
  { id: 'q20', text: 'Sell 5 things at your stall', target: 5, coins: 400, gems: 2, xp: 30, progress: (s) => st(s, 'stall') },
  { id: 'q21', text: 'Pick 20 apples', target: 20, coins: 500, gems: 2, xp: 40, progress: (s) => st(s, 'harvest:apple') },
  { id: 'q22', text: 'Send 3 boats', target: 3, coins: 900, gems: 4, xp: 60, progress: (s) => st(s, 'boat') },
  { id: 'q23', text: 'Catch 15 fish', target: 15, coins: 700, gems: 3, xp: 50, progress: (s) => st(s, 'make:fish') },
  { id: 'q19', text: 'Reach level 20', target: 20, coins: 3000, gems: 10, xp: 0, progress: (s) => s.level },
  { id: 'q24', text: 'Make 10 sushi', target: 10, coins: 2500, gems: 6, xp: 120, progress: (s) => st(s, 'make:sushi') },
  // the long road to level 200
  { id: 'q25', text: 'Reach level 30', target: 30, coins: 5000, gems: 12, xp: 0, progress: (s) => s.level },
  { id: 'q26', text: 'Collect 20 speckled eggs', target: 20, coins: 4000, gems: 6, xp: 200, progress: (s) => st(s, 'collect:speckled_egg') },
  { id: 'q27', text: 'Pick 20 quinces', target: 20, coins: 4500, gems: 6, xp: 220, progress: (s) => st(s, 'harvest:quince') },
  { id: 'q28', text: 'Reach level 50', target: 50, coins: 12000, gems: 20, xp: 0, progress: (s) => s.level },
  { id: 'q29', text: 'Collect 25 fresh cream', target: 25, coins: 9000, gems: 10, xp: 400, progress: (s) => st(s, 'collect:fresh_cream') },
  { id: 'q30', text: 'Build a swan lake', target: 1, coins: 8000, gems: 10, xp: 300, progress: (s) => cnt(s, 'swan_lake') },
  { id: 'q31', text: 'Reach level 75', target: 75, coins: 25000, gems: 30, xp: 0, progress: (s) => s.level },
  { id: 'q32', text: 'Collect 30 reindeer milk', target: 30, coins: 20000, gems: 15, xp: 800, progress: (s) => st(s, 'collect:reindeer_milk') },
  { id: 'q33', text: 'Reach level 100', target: 100, coins: 60000, gems: 50, xp: 0, progress: (s) => s.level },
  { id: 'q34', text: 'Build a flamingo lagoon', target: 1, coins: 30000, gems: 20, xp: 1500, progress: (s) => cnt(s, 'flamingo_lagoon') },
  { id: 'q35', text: 'Reach level 125', target: 125, coins: 90000, gems: 60, xp: 0, progress: (s) => s.level },
  { id: 'q36', text: 'Build a crane marsh', target: 1, coins: 80000, gems: 50, xp: 3000, progress: (s) => cnt(s, 'crane_marsh') },
  { id: 'q37', text: 'Reach level 150', target: 150, coins: 150000, gems: 80, xp: 0, progress: (s) => s.level },
  { id: 'q38', text: 'Collect 20 barn owl feathers', target: 20, coins: 120000, gems: 60, xp: 5000, progress: (s) => st(s, 'collect:owl_feather') },
  { id: 'q39', text: 'Reach level 175', target: 175, coins: 250000, gems: 100, xp: 0, progress: (s) => s.level },
  { id: 'q40', text: 'Plant a golden apple tree', target: 1, coins: 200000, gems: 100, xp: 8000, progress: (s) => cnt(s, 'golden_apple_tree') },
  { id: 'q41', text: 'Reach level 200', target: 200, coins: 500000, gems: 200, xp: 0, progress: (s) => s.level },
  { id: 'q42', text: 'Build the golden nest', target: 1, coins: 500000, gems: 250, xp: 0, progress: (s) => cnt(s, 'golden_nest') },
];

// ---------------------------------------------------------------- achievements

export interface Achievement { id: string; name: string; icon: string; unit: string; tiers: number[]; progress: (s: GameState) => number }
export const BADGE_GEMS = [2, 5, 10];
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'harvester', name: 'Harvester', icon: '🌾', unit: 'crops harvested', tiers: [100, 1000, 5000], progress: (s) => st(s, 'harvest') },
  { id: 'maker', name: 'Master Maker', icon: '🍞', unit: 'goods made', tiers: [50, 500, 2500], progress: (s) => st(s, 'make') },
  { id: 'rancher', name: 'Rancher', icon: '🐄', unit: 'animal goods collected', tiers: [50, 500, 2000], progress: (s) => ['egg', 'milk', 'wool', 'feather', 'goat_milk', 'honey', 'horseshoe', 'angora', 'alpaca_wool'].reduce((a, k) => a + st(s, `collect:${k}`), 0) },
  { id: 'orchard', name: 'Orchard Keeper', icon: '🍎', unit: 'fruit picked', tiers: [50, 500, 2000], progress: (s) => st(s, 'fruit') },
  { id: 'fisher', name: 'Angler', icon: '🎣', unit: 'catches', tiers: [20, 200, 1000], progress: (s) => st(s, 'make:fish') + st(s, 'make:lobster') },
  { id: 'trader', name: 'Order Hero', icon: '📋', unit: 'orders delivered', tiers: [25, 200, 1000], progress: (s) => st(s, 'orders') },
  { id: 'captain', name: 'Captain', icon: '⛵', unit: 'boats completed', tiers: [5, 30, 100], progress: (s) => st(s, 'boat') },
  { id: 'merchant', name: 'Merchant', icon: '🏪', unit: 'stall sales', tiers: [10, 100, 500], progress: (s) => st(s, 'stall') },
  { id: 'tycoon', name: 'Tycoon', icon: '💰', unit: 'coins earned', tiers: [10000, 100000, 1000000], progress: (s) => st(s, 'earned') },
  { id: 'baron', name: 'Land Baron', icon: '🪧', unit: 'land expansions', tiers: [3, 10, 30], progress: (s) => st(s, 'expand') },
  { id: 'lumberjack', name: 'Lumberjack', icon: '🪓', unit: 'obstacles cleared', tiers: [10, 50, 150], progress: (s) => st(s, 'clear') },
];
export const claimableBadges = (s: GameState) => ACHIEVEMENTS.filter((a) => {
  const k = s.achievements[a.id] ?? 0;
  return k < a.tiers.length && a.progress(s) >= a.tiers[k];
});

// ---------------------------------------------------------------- tutorial

export const TUTORIAL_DONE = 99;
export const TUTORIAL: { icon: string; text: string; done: (s: GameState) => boolean }[] = [
  { icon: '🌾', text: 'Tap the golden wheat to harvest it. You can also drag across fields.', done: (s) => st(s, 'harvest') >= 2 },
  { icon: '🌱', text: 'Tap an empty field and pick Wheat to plant it.', done: (s) => st(s, 'plant') >= 1 },
  { icon: '📋', text: 'Open the Order Board and deliver the wheat order.', done: (s) => st(s, 'orders') >= 1 },
  { icon: '🛒', text: 'Open the Shop and build a Bakery.', done: (s) => cnt(s, 'bakery') >= 1 },
  { icon: '🍞', text: 'Tap the Bakery, bake Bread, then collect it.', done: (s) => st(s, 'make:bread') >= 1 },
];

// finishing a story chapter: coins and XP that grow with the level, and gems on every tenth
export const storyReward = (n: number) => ({ coins: 60 + n * 30, xp: Math.round(xpNeed(n) * 0.15), gems: n % 10 === 0 ? 5 : 1 });

export const activeQuests = (s: GameState) => QUESTS.filter((q) => !s.quests.includes(q.id)).slice(0, 4);
export const claimableQuests = (s: GameState) => activeQuests(s).filter((q) => q.progress(s) >= q.target);

// ---------------------------------------------------------------- orders

export function genOrder(s: GameState, readyAt: number): Order {
  const pool = ITEM_LIST.filter((i) => i.level <= s.level && !i.id.endsWith('_feed'));
  const maxN = s.level < 3 ? 2 : 3;
  const n = Math.min(pool.length, 1 + Math.floor(Math.random() * maxN));
  const picked: typeof pool = [];
  const bag = [...pool];
  while (picked.length < n && bag.length) picked.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
  const items = picked.map((i) => ({
    id: i.id,
    qty: Math.max(1, Math.min(i.storage === 'silo' ? 8 : 4, Math.round((15 + Math.random() * 40) / i.sell + Math.random() * 1.5))),
  }));
  const value = items.reduce((a, it) => a + ITEMS[it.id].sell * it.qty, 0);
  return {
    id: s.nextId++,
    items,
    coins: Math.round(value * (1.35 + Math.random() * 0.35)),
    xp: Math.max(2, Math.round(value / 5)),
    gems: Math.random() < 0.07 ? 1 : 0,
    readyAt,
  };
}

// ---------------------------------------------------------------- new game / load

export function newGame(): GameState {
  const now = Date.now();
  const s: GameState = {
    v: 1, coins: 200, gems: 10, xp: 0, level: 1,
    inv: { wheat: 4 },
    siloLevel: 0, barnLevel: 0,
    chunks: [], objects: [], orders: [], nextId: 1,
    lastDaily: '', streak: 0, stats: {}, quests: [],
    settings: { sound: true, dayNight: true, clouds: true, music: true, weather: true, shadows: true },
    createdAt: now,
    stall: Array.from({ length: STALL_SLOTS }, emptySlot),
    boat: null,
    achievements: {},
    tutorial: 0,
    story: { ch: 1, started: 0, base: {}, seen: 0 },
    lake: 5,
  };
  for (let cx = 2; cx <= 4; cx++) for (let cy = 2; cy <= 4; cy++) s.chunks.push(`${cx},${cy}`);
  const add = (type: string, x: number, y: number, extra: Partial<FarmObject> = {}) => {
    const o: FarmObject = { id: s.nextId++, type, x, y, ...extra };
    s.objects.push(o);
    return o;
  };
  add('house', 8, 8);
  add('board', 11, 9);
  add('barn', 16, 8);
  add('silo', 18, 8);
  add('well', 13, 12);
  s.starterWell = true;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    add('plot', 10 + i, 12 + j, { plot: { crop: 'wheat', plantedAt: j === 0 ? now - 3600e3 : now - 8000 } });
  }
  const obs: [number, number, string][] = [
    [8, 17, 'tree_obs'], [9, 18, 'rock_obs'], [14, 18, 'tree_obs'], [18, 15, 'bush_obs'],
    [19, 19, 'tree_obs'], [17, 17, 'rock_obs'], [8, 14, 'bush_obs'], [15, 14, 'tree_obs'], [19, 12, 'bush_obs'],
  ];
  for (const [x, y, t] of obs) add(t, x, y);
  // a dirt path past the front doors and down to the fields
  for (let x = 8; x <= 17; x++) add('dirt_path', x, 10);
  for (let y = 11; y <= 13; y++) add('dirt_path', 9, y);
  for (let i = 0; i < orderCount(1); i++) s.orders.push(genOrder(s, now));
  // first order is always doable with starting wheat, for the tutorial
  s.orders[0] = { ...s.orders[0], items: [{ id: 'wheat', qty: 6 }], coins: 30, xp: 5, gems: 0 };
  shiftMap(s, FARM_OFF, 4);
  return s;
}

// Pigs and unicorns, and their goods, were taken out of the game. Saves that still hold them are paid back in
// coins, and orders, stall slots, boat crates and queues that mention them are cleaned up.
const REMOVED_VALUE: Record<string, number> = { bacon: 50, pig_feed: 14, rainbow_mane: 520 };
const REMOVED_BUILDING: Record<string, { cost: number; animal: number }> = {
  pigpen: { cost: 1000, animal: 160 }, unicorn_meadow: { cost: 32000, animal: 4000 },
  // decorations taken out later: paid back in full
  chapel: { cost: 10860, animal: 0 }, pagoda: { cost: 10320, animal: 0 }, torii_gate: { cost: 6600, animal: 0 }, totem_pole: { cost: 4140, animal: 0 },
};
function dropRemoved(s: GameState) {
  for (const o of s.objects) {
    const r = REMOVED_BUILDING[o.type];
    if (r) s.coins += r.cost + (o.pen?.animals.length ?? 0) * r.animal;
  }
  for (const k of Object.keys(s.inv)) {
    if (ITEMS[k]) continue;
    s.coins += (REMOVED_VALUE[k] ?? 0) * s.inv[k];
    delete s.inv[k];
  }
  s.stall = s.stall.map((x) => {
    if (!x.item || ITEMS[x.item]) return x;
    s.coins += (REMOVED_VALUE[x.item] ?? 0) * x.qty;
    return emptySlot();
  });
  if (s.boat) for (const c of s.boat.crates) if (!ITEMS[c.item]) { c.item = 'egg'; }
  const now = Date.now();
  s.orders = s.orders.map((o) => (o.items.every((it) => ITEMS[it.id]) ? o : genOrder(s, now)));
  for (const o of s.objects) if (o.prod) o.prod.queue = o.prod.queue.filter((e) => RECIPE[e.recipe]);
  for (const o of s.objects) if (o.plot?.crop && !CROP[o.plot.crop]) o.plot.crop = null;
}

// Moves a farm laid out on the old 28 tile map to the middle of the current map.
function shiftMap(s: GameState, off: number, v: number) {
  const cs = off / CHUNK;
  s.objects = s.objects.map((o) => ({ ...o, x: o.x + off, y: o.y + off }));
  s.chunks = s.chunks.map((k) => {
    const [x, y] = k.split(',').map(Number);
    return `${x + cs},${y + cs}`;
  });
  s.mapV = v;
}

export function loadGame(): GameState {
  let s: GameState | null = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) s = migrate(JSON.parse(raw));
  } catch { /* corrupted save, start fresh */ }
  return testBoost(s ?? newGame());
}

// TEMP test mode: level 200 and bottomless coins and gems while the game is being tested.
// Set TEST_MODE to false (or delete this block and its three uses) to turn it off.
export const TEST_MODE = true;
const TEST_FUNDS = 999_999_999;
function testBoost(s: GameState): GameState {
  if (!TEST_MODE) return s;
  s.level = Math.max(s.level, 200);
  s.tutorial = TUTORIAL_DONE;
  topUp(s);
  return s;
}
function topUp(s: GameState) {
  if (!TEST_MODE) return;
  if (s.coins < TEST_FUNDS) s.coins = TEST_FUNDS;
  if (s.gems < TEST_FUNDS) s.gems = TEST_FUNDS;
}

function migrate(d: Partial<GameState>): GameState {
  const base = newGame();
  const s = { ...base, ...d } as GameState;
  s.settings = { ...base.settings, ...(d.settings ?? {}) };
  s.stats = d.stats ?? {};
  s.inv = d.inv ?? {};
  s.quests = d.quests ?? [];
  s.achievements = d.achievements ?? {};
  s.stall = Array.isArray(d.stall) && d.stall.length === STALL_SLOTS ? d.stall : Array.from({ length: STALL_SLOTS }, emptySlot);
  s.boat = d.boat ?? null;
  s.starterWell = d.starterWell;
  // farms from before the story pick it up at the chapter of their level
  s.story = d.story ?? { ch: Math.min(LAST_CHAPTER + 1, Math.max(1, s.level ?? 1)), started: 0, base: {}, seen: 0 };
  // saves from before the tutorial existed skip it
  s.tutorial = typeof d.tutorial === 'number' ? d.tutorial : TUTORIAL_DONE;
  if (!Array.isArray(s.objects) || !Array.isArray(s.chunks)) return base;
  if ((d.mapV ?? 1) < 2) shiftMap(s, MAP_OFF, 2);
  if ((s.mapV ?? 1) < 3) shiftMap(s, MAP_OFF2, 3);
  if ((s.mapV ?? 1) < 4) shiftMap(s, MAP_OFF3, 4);
  dropRemoved(s);
  s.objects = s.objects.filter((o) => BUILDING[o.type]);
  // ids must stay unique: a hand edited or damaged save may carry a stale counter
  let top = 0;
  for (const o of s.objects) {
    top = Math.max(top, o.id);
    for (const a of o.pen?.animals ?? []) top = Math.max(top, a.id);
  }
  if (!(s.nextId > top)) s.nextId = top + 1;
  return s;
}

// ---------------------------------------------------------------- store

export type Sfx = 'harvest' | 'plant' | 'coin' | 'build' | 'error' | 'levelup' | 'click' | 'collect';
export interface Fx { kind: 'float' | 'burst'; gx: number; gy: number; text?: string; color?: string; z?: number }
export interface Placing { type: string; x: number; y: number; moveId?: number }
export interface Tool { kind: 'plant'; crop: string }
export type Panel = 'shop' | 'orders' | 'storage' | 'settings' | 'quests' | 'stall' | 'boat' | 'fishing' | 'home' | null;
export interface Flyer { icon: string; gx: number; gy: number; z: number; target: 'storage' | 'coins' | 'xp' }
export interface Toast { id: number; text: string; tone: 'info' | 'bad' | 'good'; at: number }

export interface UIState {
  selectedId: number | null;
  placing: Placing | null;
  tool: Tool | null;
  panel: Panel;
  storageTab: 'silo' | 'barn';
  expand: { cx: number; cy: number } | null;
  levelUp: number | null;
  daily: boolean;
  napping: boolean; // the farmer is asleep at home
  napAt: number;
  story: { ch: number; part: 'intro' | 'outro'; i: number } | null; // a story chapter being told
  say: { text: string; until: number } | null; // the farmer's speech bubble
}

export class GameStore {
  s: GameState;
  ui: UIState;
  version = 0;
  objVersion = 0;
  fx: Fx[] = [];
  flyers: Flyer[] = [];
  toScreen: (gx: number, gy: number, z: number) => { x: number; y: number } | null = () => null;
  toasts: Toast[] = [];
  sound: (n: Sfx) => void = () => {};
  viewCenter: () => { x: number; y: number } = () => ({ x: GRID / 2, y: GRID / 2 });
  private listeners = new Set<() => void>();
  private saveT: ReturnType<typeof setTimeout> | null = null;
  private toastId = 0;

  constructor(s: GameState) {
    this.s = s;
    this.ui = { selectedId: null, placing: null, tool: null, panel: null, storageTab: 'silo', expand: null, levelUp: null, daily: false, napping: false, napAt: 0, story: null, say: null };
    this.ensureOrders();
    this.ui.daily = this.canDaily();
    this.giveStarterWell();
    this.makeRoomForLake();
  }

  // farms from before the lake: its land goes back to nature. Bought chunks there are paid
  // back, and anything standing on it moves to a free spot (or is sold, if there is none).
  private makeRoomForLake() {
    const s = this.s;
    if (s.lake === 5) return;
    s.lake = 5;
    const before = s.chunks.length;
    s.chunks = s.chunks.filter((k) => { const [cx, cy] = k.split(',').map(Number); return !isLakeChunk(cx, cy); });
    if (s.chunks.length < before) s.coins += (before - s.chunks.length) * 2000;
    const on = (o: FarmObject) => {
      const d = BUILDING[o.type];
      for (let i = 0; i < d.w; i++) for (let j = 0; j < d.h; j++) if (isLakeTile(o.x + i, o.y + j)) return true;
      return false;
    };
    for (const o of [...s.objects]) {
      if (!on(o)) continue;
      const sp = this.findSpot(o.type, LAKE.x - 12, LAKE.z, o.id);
      if (sp.ok) { o.x = sp.x; o.y = sp.y; } else { s.objects = s.objects.filter((x) => x !== o); s.coins += BUILDING[o.type].cost; }
    }
    this.objVersion++;
  }

  // farms from before the bucket get their free well beside the fields, once
  private giveStarterWell() {
    if (this.s.starterWell) return;
    this.s.starterWell = true;
    if (this.s.objects.some((o) => o.type === 'well')) return;
    const plot = this.s.objects.find((o) => o.type === 'plot') ?? this.s.objects.find((o) => o.type === 'house');
    const spot = this.findSpot('well', plot ? plot.x + 1 : GRID / 2, plot ? plot.y + 1 : GRID / 2);
    if (spot.ok) this.s.objects.push({ id: this.s.nextId++, type: 'well', x: spot.x, y: spot.y });
  }

  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
  getVersion = () => this.version;

  emit(save = true) {
    this.checkTutorial();
    if (this.checkStory()) save = true;
    this.version++;
    this.listeners.forEach((l) => l());
    if (save) this.scheduleSave();
  }

  // saves wait for a quiet moment, but never longer than a few seconds during nonstop play
  scheduleSave() {
    if (this.saveT) clearTimeout(this.saveT);
    const now = Date.now();
    if (!this.saveDue) this.saveDue = now + 4000;
    if (now >= this.saveDue) { this.saveNow(); return; }
    this.saveT = setTimeout(() => this.saveNow(), 800);
  }

  private saveDue = 0;
  saveNow = () => {
    if (this.saveT) { clearTimeout(this.saveT); this.saveT = null; }
    this.saveDue = 0;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); } catch { /* storage full or blocked */ }
  };

  // ------------------------------------------------ feedback

  toast(text: string, tone: Toast['tone'] = 'info') {
    const now = Date.now();
    if (this.toasts.some((t) => t.text === text && now - t.at < 1500)) return;
    const t = { id: ++this.toastId, text, tone, at: now };
    this.toasts = [...this.toasts.slice(-3), t];
    if (tone === 'bad') this.sound('error');
    setTimeout(() => { this.toasts = this.toasts.filter((x) => x.id !== t.id); this.emit(false); }, 2600);
    this.emit(false);
  }

  fly(o: { x: number; y: number; type: string }, icon: string, target: Flyer['target'], z = 30) {
    const d = BUILDING[o.type];
    if (this.flyers.length < 40) this.flyers.push({ icon, gx: o.x + d.w / 2, gy: o.y + d.h / 2, z, target });
  }

  float(o: { x: number; y: number; type: string }, text: string, color = '#ffffff', z = 40) {
    const d = BUILDING[o.type];
    this.fx.push({ kind: 'float', gx: o.x + d.w / 2, gy: o.y + d.h / 2, text, color, z });
  }

  burst(o: { x: number; y: number; type: string }, color: string) {
    const d = BUILDING[o.type];
    this.fx.push({ kind: 'burst', gx: o.x + d.w / 2, gy: o.y + d.h / 2, color, z: 10 });
  }

  stat(k: string, n = 1) { this.s.stats[k] = (this.s.stats[k] ?? 0) + n; }

  earn(n: number) { this.s.coins += n; this.stat('earned', n); }

  addXp(n: number) {
    const s = this.s;
    s.xp += n;
    while (s.xp >= xpNeed(s.level)) {
      s.xp -= xpNeed(s.level);
      s.level++;
      s.gems += 3;
      s.coins += s.level * 15;
      this.ui.levelUp = s.level;
      this.sound('levelup');
    }
    this.ensureOrders();
  }

  // ------------------------------------------------ lookups

  obj(id: number | null) { return id === null ? undefined : this.s.objects.find((o) => o.id === id); }

  objectAt(x: number, y: number) {
    return this.s.objects.find((o) => {
      const d = BUILDING[o.type];
      return x >= o.x && x < o.x + d.w && y >= o.y && y < o.y + d.h;
    });
  }

  countType(type: string) { return this.s.objects.filter((o) => o.type === type).length; }

  maxOf(d: BuildingDef) { return d.kind === 'plot' ? maxPlots(this.s.level) : d.max; }

  costOf(d: BuildingDef) {
    if (d.kind === 'plot') return Math.round(10 * Math.pow(1.1, Math.max(0, this.countType('plot') - 6)));
    return d.cost;
  }

  // the renderer asks this for every tile, so the chunk list is kept as a set
  private chunkSet = new Set<string>();
  private chunkSrc: string[] | null = null;
  private chunkN = -1;
  isUnlocked(x: number, y: number) {
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return false;
    const c = this.s.chunks;
    if (c !== this.chunkSrc || c.length !== this.chunkN) { this.chunkSet = new Set(c); this.chunkSrc = c; this.chunkN = c.length; }
    return isBeachTile(x, y) || isLakeTile(x, y) || this.chunkSet.has(`${Math.floor(x / CHUNK)},${Math.floor(y / CHUNK)}`);
  }

  canPlace(type: string, x: number, y: number, ignoreId?: number) {
    const d = BUILDING[type];
    for (let i = 0; i < d.w; i++) for (let j = 0; j < d.h; j++) {
      if (!this.isUnlocked(x + i, y + j) || isLakeTile(x + i, y + j)) return false;
      // the sand takes beach things only: deck chairs, sandcastles, palms...
      if (isBeachTile(x + i, y + j) && !d.beach) return false;
      const o = this.objectAt(x + i, y + j);
      if (o && o.id !== ignoreId) return false;
    }
    return true;
  }

  findSpot(type: string, cx: number, cy: number, ignoreId?: number) {
    for (let r = 0; r < GRID; r++) {
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (this.canPlace(type, cx + dx, cy + dy, ignoreId)) return { x: cx + dx, y: cy + dy, ok: true };
      }
    }
    return { x: cx, y: cy, ok: false };
  }

  hasItems(inputs: Record<string, number>) {
    return Object.entries(inputs).every(([id, n]) => (this.s.inv[id] ?? 0) >= n);
  }

  canStore(id: string, qty: number) {
    const k = ITEMS[id].storage;
    return storageUsed(this.s, k) + qty <= storageCap(this.s, k);
  }

  private add(id: string, qty: number) { this.s.inv[id] = (this.s.inv[id] ?? 0) + qty; }
  private take(id: string, qty: number) { this.s.inv[id] = (this.s.inv[id] ?? 0) - qty; if (this.s.inv[id] <= 0) delete this.s.inv[id]; }

  private fullToast(id: string) {
    this.toast(ITEMS[id].storage === 'silo' ? 'Silo is full. Sell or use crops, or upgrade it.' : 'Barn is full. Sell or use goods, or upgrade it.', 'bad');
  }

  // ------------------------------------------------ ui

  select(id: number | null) {
    this.ui.selectedId = id;
    this.ui.tool = null;
    this.emit(false);
  }

  openPanel(p: Panel) {
    this.ui.panel = p;
    this.ui.selectedId = null;
    this.ui.tool = null;
    this.sound('click');
    this.emit(false);
  }

  cancelAll() {
    this.ui.placing = null;
    this.ui.tool = null;
    this.ui.selectedId = null;
    this.ui.panel = null;
    this.ui.expand = null;
    this.emit(false);
  }

  setTool(t: Tool | null) {
    this.ui.tool = t;
    this.emit(false);
  }

  tapObject(o: FarmObject) {
    const d = BUILDING[o.type];
    const now = Date.now();
    this.sound('click');
    switch (d.kind) {
      case 'plot':
        if (!o.plot?.crop && this.ui.tool) { this.plant(o, this.ui.tool.crop); return; }
        this.select(o.id);
        return;
      case 'production':
        if (prodInfo(o, now).done.length) this.collectProd(o);
        this.select(o.id);
        return;
      case 'pen': {
        const pi = penInfo(o, now);
        // collect when ready; feeding is the player's choice (the Feed button), so animals that
        // came home hungry from grazing are not fed behind their back
        if (pi.ready) this.collectPen(o);
        this.select(o.id);
        return;
      }
      case 'barn': this.ui.storageTab = 'barn'; this.openPanel('storage'); return;
      case 'silo': this.ui.storageTab = 'silo'; this.openPanel('storage'); return;
      case 'board': this.openPanel('orders'); return;
      case 'house': this.openPanel('home'); return;
      case 'tree':
        if (treeInfo(o, now).ready) this.collectTree(o);
        this.select(o.id);
        return;
      case 'stall': this.openPanel('stall'); return;
      case 'dock': this.openPanel('boat'); return;
      default:
        if (o.type === 'well') this.fillBucket(o);
        this.select(o.id);
    }
  }

  // fill the bucket to the brim at a well
  fillBucket(o: FarmObject) {
    const wi = waterInfo(this.s);
    if (wi.n >= wi.max) { this.toast('Your bucket is already full. Tap a growing field to water it.', 'info'); return; }
    this.s.water = { n: wi.max, at: Date.now() };
    this.sound('collect');
    this.burst(o, '#6fc8ff');
    this.float(o, `🪣 ${wi.max}/${wi.max}`, '#dff4ff', 30);
    this.emit();
  }

  // ------------------------------------------------ fishing spot

  tapFishing() {
    this.sound('click');
    if (fishingInfo(this.s, Date.now()).state === 'ready') { this.reelIn(); return; }
    this.openPanel('fishing');
  }

  buyFishing() {
    if (this.s.fishing?.open) return;
    if (this.s.level < FISHING.level) { this.toast(`The fishing spot opens at level ${FISHING.level}.`, 'bad'); return; }
    if (this.s.coins < FISHING.cost) { this.toast('Not enough coins.', 'bad'); return; }
    this.s.coins -= FISHING.cost;
    this.s.fishing = { open: true, castAt: null, catchAt: null };
    this.sound('build');
    this.fx.push({ kind: 'burst', gx: FISH_SPOT.x, gy: FISH_SPOT.y, color: '#8fd3ff', z: 10 });
    this.fx.push({ kind: 'float', gx: FISH_SPOT.x, gy: FISH_SPOT.y, text: 'Fishing spot open!', color: '#e6f7ff', z: 30 });
    this.emit();
  }

  castLine() {
    const f = this.s.fishing;
    if (!f?.open || f.castAt !== null) return;
    const now = Date.now();
    f.castAt = now;
    f.catchAt = now + FISHING.time * 1000;
    this.sound('plant');
    this.emit();
  }

  reelIn() {
    const f = this.s.fishing;
    const now = Date.now();
    if (!f || fishingInfo(this.s, now).state !== 'ready') return;
    // what bites depends on luck and level: plain fish most often, rarer catches as you grow
    const id = pickCatch(this.s.level, Math.random());
    const lobster = id !== 'fish';
    const qty = lobster ? 1 : 1 + (Math.random() < 0.4 ? 1 : 0);
    if (!this.canStore(id, qty)) { this.fullToast(id); return; }
    this.add(id, qty);
    f.castAt = null;
    f.catchAt = null;
    this.stat('fish', qty);
    this.addXp(lobster ? 4 + Math.floor(ITEMS[id].sell / 40) : 3);
    this.sound('collect');
    if (this.flyers.length < 40) this.flyers.push({ icon: ITEMS[id].icon, gx: FISH_SPOT.x, gy: FISH_SPOT.y, z: 20, target: 'storage' });
    this.fx.push({ kind: 'float', gx: FISH_SPOT.x, gy: FISH_SPOT.y, text: `+${qty} ${ITEMS[id].icon}`, color: '#ffffff', z: 40 });
    this.fx.push({ kind: 'burst', gx: FISH_SPOT.x, gy: FISH_SPOT.y, color: '#bfe9ff', z: 5 });
    this.emit();
  }

  tapTile(x: number, y: number) {
    this.ui.selectedId = null;
    this.ui.tool = null;
    if (x >= 0 && y >= 0 && x < GRID && y < GRID) {
      const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
      const cs = chunkState(this.s, cx, cy);
      if (cs === 'buyable') { this.ui.expand = { cx, cy }; this.sound('click'); }
      else if (cs === 'locked') this.toast('Expand the land next to this area first.');
    }
    this.emit(false);
  }

  // ------------------------------------------------ crops

  plant(o: FarmObject, cropId: string, quiet = false) {
    const c = CROP[cropId];
    if (!o.plot || o.plot.crop || !c) return false;
    if (this.s.level < c.level) { this.toast(`${ITEMS[cropId].name} unlocks at level ${c.level}.`, 'bad'); return false; }
    if ((this.s.inv[cropId] ?? 0) > 0) this.take(cropId, 1);
    else if (this.s.coins >= c.seedCost) this.s.coins -= c.seedCost;
    else { if (!quiet) this.toast('Not enough coins for seeds.', 'bad'); else this.toast('Out of seeds.', 'bad'); this.ui.tool = null; this.emit(); return false; }
    o.plot.crop = cropId;
    o.plot.plantedAt = Date.now();
    o.plot.watered = false;
    this.stat('plant');
    this.sound('plant');
    this.burst(o, '#8a5a34');
    this.emit();
    return true;
  }

  harvest(o: FarmObject, quiet = false) {
    const pp = plotProgress(o, Date.now());
    if (!pp.ready || !pp.crop || !o.plot) return false;
    if (!this.canStore(pp.crop, 2)) { this.fullToast(pp.crop); return false; }
    const c = CROP[pp.crop];
    this.add(pp.crop, 2);
    this.stat('harvest', 2);
    this.stat(`harvest:${pp.crop}`, 2);
    o.plot.crop = null;
    o.plot.watered = false;
    this.addXp(c.xp);
    this.float(o, `+2 ${ITEMS[c.id].icon}`, '#fff6c8', 30);
    this.fly(o, ITEMS[c.id].icon, 'storage');
    this.burst(o, c.fruit);
    this.sound('harvest');
    if (!quiet) { /* reserved for future single tap feedback */ }
    this.emit();
    return true;
  }

  // A drink for a growing crop: the rest of its growing time shrinks by 30%. `free` is rain or a
  // sprinkler; by hand it takes one pour from the bucket.
  // `quiet` leaves the redraw to the caller (rain waters many fields at once)
  waterPlot(o: FarmObject, free = false, quiet = false) {
    const now = Date.now();
    if (!o.plot || !needsWater(o, now)) return false;
    if (!free) {
      const wi = waterInfo(this.s);
      if (wi.n <= 0) {
        this.toast(wi.wells ? 'Your bucket is empty. Tap a well to fill it.' : 'Your bucket is empty. Build a well to fill it.', 'bad');
        return false;
      }
      this.s.water = { n: wi.n - 1, at: this.s.water?.at ?? Date.now() };
      this.stat('water');
      this.sound('plant');
    }
    const rem = plotProgress(o, now).remaining;
    o.plot.plantedAt -= rem * WATER.boost;
    o.plot.watered = true;
    this.burst(o, '#6fc8ff');
    if (!free) this.float(o, '💧', '#dff4ff', 20);
    if (!quiet) this.emit();
    return true;
  }

  speedPlot(o: FarmObject) {
    const pp = plotProgress(o, Date.now());
    if (!pp.crop || pp.ready || !o.plot) return;
    const cost = gemCost(pp.remaining);
    if (this.s.gems < cost) { this.toast('Not enough gems.', 'bad'); return; }
    this.s.gems -= cost;
    o.plot.plantedAt = Date.now() - CROP[pp.crop].time * 1000;
    this.sound('coin');
    this.emit();
  }

  // ------------------------------------------------ production

  queueRecipe(o: FarmObject, recipeId: string) {
    const r = RECIPE[recipeId];
    if (!o.prod || !r) return;
    const now = Date.now();
    if (this.s.level < r.level) { this.toast(`Unlocks at level ${r.level}.`, 'bad'); return; }
    if (o.prod.queue.length >= o.prod.slots) { this.toast('Queue is full. Collect goods or add a slot.', 'bad'); return; }
    if (!this.hasItems(r.inputs)) { this.toast('Missing ingredients.', 'bad'); return; }
    for (const [id, n] of Object.entries(r.inputs)) this.take(id, n);
    const last = o.prod.queue[o.prod.queue.length - 1];
    const start = Math.max(now, last ? last.endsAt : now);
    o.prod.queue.push({ recipe: recipeId, startAt: start, endsAt: start + r.time * 1000 });
    this.sound('click');
    this.emit();
  }

  collectProd(o: FarmObject) {
    if (!o.prod) return 0;
    const now = Date.now();
    let n = 0;
    while (o.prod.queue.length && o.prod.queue[0].endsAt <= now) {
      const e = o.prod.queue[0];
      const r = RECIPE[e.recipe];
      if (!this.canStore(r.id, r.qty)) { this.fullToast(r.id); break; }
      o.prod.queue.shift();
      this.add(r.id, r.qty);
      this.stat('make', r.qty);
      this.stat(`make:${r.id}`, r.qty);
      this.addXp(r.xp);
      this.float(o, `+${r.qty} ${ITEMS[r.id].icon}`, '#fff6c8', 70 + n * 16);
      this.fly(o, ITEMS[r.id].icon, 'storage', 60);
      n++;
    }
    if (n) { this.sound('collect'); this.burst(o, '#ffd84a'); this.emit(); }
    return n;
  }

  speedProd(o: FarmObject) {
    if (!o.prod) return;
    const now = Date.now();
    const cur = o.prod.queue.find((e) => e.endsAt > now);
    if (!cur) return;
    const rem = cur.endsAt - Math.max(now, cur.startAt);
    const cost = gemCost(cur.endsAt - now);
    if (this.s.gems < cost) { this.toast('Not enough gems.', 'bad'); return; }
    this.s.gems -= cost;
    const shift = cur.endsAt - now;
    for (const e of o.prod.queue) {
      if (e.endsAt < cur.endsAt) continue;
      if (e === cur) { e.endsAt = now; e.startAt = Math.min(e.startAt, now - 1); continue; }
      e.startAt -= shift; e.endsAt -= shift;
    }
    void rem;
    this.sound('coin');
    this.emit();
  }

  buySlot(o: FarmObject) {
    if (!o.prod) return;
    if (o.prod.slots >= MAX_SLOTS) return;
    const cost = slotCost(o.prod.slots);
    if (this.s.gems < cost) { this.toast('Not enough gems.', 'bad'); return; }
    this.s.gems -= cost;
    o.prod.slots++;
    this.sound('build');
    this.emit();
  }

  // ------------------------------------------------ animals

  buyAnimal(o: FarmObject) {
    const d = BUILDING[o.type];
    const an = ANIMAL[d.animal ?? ''];
    if (!o.pen || !an) return;
    if (this.s.level < an.level) { this.toast(`${an.name}s unlock at level ${an.level}.`, 'bad'); return; }
    if (o.pen.animals.length >= (d.capacity ?? 0)) { this.toast('This home is full.', 'bad'); return; }
    if (this.s.coins < an.cost) { this.toast('Not enough coins.', 'bad'); return; }
    this.s.coins -= an.cost;
    o.pen.animals.push({ id: this.s.nextId++, fedAt: null });
    this.addXp(2);
    this.float(o, `${an.icon} +1`, '#ffffff', 40);
    this.sound('build');
    this.emit();
  }

  feedPen(o: FarmObject) {
    const pi = penInfo(o, Date.now());
    if (!o.pen) return;
    let n = 0;
    for (const a of o.pen.animals) {
      if (a.fedAt !== null || a.graze) continue;
      if ((this.s.inv[pi.animal.feed] ?? 0) <= 0) break;
      this.take(pi.animal.feed, 1);
      a.fedAt = Date.now();
      n++;
    }
    if (n) { this.sound('plant'); this.float(o, `Fed ${n} ${pi.animal.icon}`, '#ffffff', 40); this.emit(); }
    else if (pi.hungry) this.toast(`You need ${ITEMS[pi.animal.feed].name}. ${feedHint(pi.animal.feed)}`, 'bad');
  }

  // Open the gate: every hungry animal walks out to graze (bees fly off to the flowers) and
  // comes home by itself once full, ready to produce.
  openGate(o: FarmObject) {
    if (!o.pen) return;
    const now = Date.now();
    let n = 0;
    for (const a of o.pen.animals) if (a.fedAt === null && !a.graze) { a.graze = { at: now }; n++; }
    const an = penInfo(o, now).animal;
    if (!n) { this.toast(`No hungry ${an.name.toLowerCase()}s to let out.`); return; }
    this.sound('click');
    this.float(o, an.id === 'bee' ? `🌼 ${n} off to the flowers` : `🌿 ${n} out to graze`, '#ffffff', 40);
    this.stat('graze', n);
    this.emit();
  }

  // Call them home early: they walk back and stay hungry (unless the meal was already done).
  recallPen(o: FarmObject) {
    if (!o.pen) return;
    const now = Date.now();
    let n = 0;
    const bee = penInfo(o, now).animal.id === 'bee';
    for (const a of o.pen.animals) {
      if (!a.graze || a.graze.back !== undefined) continue;
      const ph = grazePhase(a, now, bee).phase;
      if (ph === 'leaving' || ph === 'eating') { a.graze.back = now; n++; }
    }
    if (n) { this.sound('click'); this.float(o, `📣 ${n} coming home`, '#ffffff', 40); this.emit(); }
  }

  collectPen(o: FarmObject) {
    const now = Date.now();
    const pi = penInfo(o, now);
    if (!o.pen) return;
    let n = 0;
    for (const a of o.pen.animals) {
      if (!animalReady(a, pi.animal.time, now)) continue;
      if (!this.canStore(pi.animal.product, 1)) { this.fullToast(pi.animal.product); break; }
      this.add(pi.animal.product, 1);
      a.fedAt = null;
      this.stat(`collect:${pi.animal.product}`);
      this.addXp(pi.animal.xp);
      n++;
    }
    if (n) {
      this.float(o, `+${n} ${ITEMS[pi.animal.product].icon}`, '#fff6c8', 40);
      this.fly(o, ITEMS[pi.animal.product].icon, 'storage', 30);
      this.burst(o, '#ffffff');
      this.sound('collect');
      this.emit();
    }
  }

  speedPen(o: FarmObject) {
    const now = Date.now();
    const pi = penInfo(o, now);
    if (!o.pen || !pi.fed) return;
    let maxRem = 0;
    for (const a of o.pen.animals) if (a.fedAt !== null && !animalReady(a, pi.animal.time, now)) maxRem = Math.max(maxRem, a.fedAt + pi.animal.time * 1000 - now);
    const cost = gemCost(maxRem);
    if (this.s.gems < cost) { this.toast('Not enough gems.', 'bad'); return; }
    this.s.gems -= cost;
    for (const a of o.pen.animals) if (a.fedAt !== null) a.fedAt = Math.min(a.fedAt, now - pi.animal.time * 1000);
    this.sound('coin');
    this.emit();
  }

  // ------------------------------------------------ building and placing

  startBuy(type: string) {
    const d = BUILDING[type];
    if (this.s.level < d.level) { this.toast(`Unlocks at level ${d.level}.`, 'bad'); return; }
    if (this.countType(type) >= this.maxOf(d)) { this.toast(d.kind === 'plot' ? 'Field limit reached. Level up for more.' : 'You already own the maximum.', 'bad'); return; }
    if (this.s.coins < this.costOf(d)) { this.toast('Not enough coins.', 'bad'); return; }
    const c = this.viewCenter();
    const spot = this.findSpot(type, c.x - Math.floor(d.w / 2), c.y - Math.floor(d.h / 2));
    this.ui.placing = { type, x: spot.x, y: spot.y };
    this.ui.panel = null;
    this.ui.selectedId = null;
    this.ui.tool = null;
    this.sound('click');
    this.emit(false);
  }

  startMove(id: number) {
    const o = this.obj(id);
    if (!o) return;
    const d = BUILDING[o.type];
    if (d.kind === 'obstacle') return;
    this.ui.placing = { type: o.type, x: o.x, y: o.y, moveId: o.id };
    this.ui.selectedId = null;
    this.ui.panel = null;
    this.ui.tool = null;
    this.toast(`Moving ${d.name}. Drag it, then press the check mark.`);
    this.emit(false);
  }

  setPlacingPos(x: number, y: number) {
    const p = this.ui.placing;
    if (!p) return;
    const d = BUILDING[p.type];
    const nx = Math.max(0, Math.min(GRID - d.w, x));
    const ny = Math.max(0, Math.min(GRID - d.h, y));
    if (nx === p.x && ny === p.y) return;
    p.x = nx; p.y = ny;
    this.emit(false);
  }

  confirmPlace() {
    const p = this.ui.placing;
    if (!p) return;
    if (!this.canPlace(p.type, p.x, p.y, p.moveId)) { this.toast('You cannot place it there.', 'bad'); return; }
    const d = BUILDING[p.type];
    if (p.moveId !== undefined) {
      const o = this.obj(p.moveId);
      if (o) { o.x = p.x; o.y = p.y; }
      this.ui.placing = null;
      this.objVersion++;
      this.sound('build');
      this.emit();
      return;
    }
    const cost = this.costOf(d);
    if (this.s.coins < cost) { this.toast('Not enough coins.', 'bad'); this.ui.placing = null; this.emit(false); return; }
    if (this.countType(p.type) >= this.maxOf(d)) { this.ui.placing = null; this.emit(false); return; }
    this.s.coins -= cost;
    const o: FarmObject = { id: this.s.nextId++, type: p.type, x: p.x, y: p.y };
    if (d.kind === 'plot') o.plot = { crop: null, plantedAt: 0 };
    if (d.kind === 'production') o.prod = { queue: [], slots: 3 };
    if (d.kind === 'pen') o.pen = { animals: [] };
    if (d.kind === 'tree') o.tree = { startAt: Date.now() };
    if (d.kind === 'dock' && !this.s.boat) this.s.boat = genBoat(this.s, Date.now());
    this.s.objects.push(o);
    this.stat(`build:${p.type}`);
    this.addXp(d.xp);
    this.burst(o, '#ffffff');
    if (d.xp) this.float(o, `+${d.xp} XP`, '#b8f0ff', 50);
    this.sound('build');
    this.objVersion++;
    if ((d.kind === 'plot' || d.kind === 'tree') && this.countType(p.type) < this.maxOf(d) && this.s.coins >= this.costOf(d)) {
      const next = this.findSpot(p.type, p.x + 1, p.y);
      this.ui.placing = next.ok ? { type: p.type, x: next.x, y: next.y } : null;
    } else {
      this.ui.placing = null;
      if (d.kind === 'pen' || d.kind === 'production') this.ui.selectedId = o.id;
    }
    this.emit();
  }

  cancelPlace() {
    this.ui.placing = null;
    this.emit(false);
  }

  removeObject(id: number) {
    const o = this.obj(id);
    if (!o) return;
    const d = BUILDING[o.type];
    if (d.kind === 'plot' && o.plot?.crop) { this.toast('Harvest the field before removing it.', 'bad'); return; }
    if (d.kind !== 'plot' && !d.sellable) return;
    const refund = d.kind === 'plot' ? 0 : Math.floor(d.cost / 2);
    this.s.coins += refund;
    this.s.objects = this.s.objects.filter((x) => x.id !== id);
    this.ui.selectedId = null;
    this.objVersion++;
    this.sound('coin');
    if (refund) this.toast(`Sold ${d.name} for ${refund} coins.`, 'good');
    this.emit();
  }

  clearObstacle(id: number) {
    const o = this.obj(id);
    if (!o) return;
    const d = BUILDING[o.type];
    const cost = d.clearCost ?? 0;
    if (this.s.coins < cost) { this.toast('Not enough coins.', 'bad'); return; }
    this.s.coins -= cost;
    this.s.objects = this.s.objects.filter((x) => x.id !== id);
    this.stat('clear');
    this.addXp(d.xp);
    this.burst(o, o.type === 'rock_obs' ? '#9a9a9a' : '#5e9e3a');
    let txt = `+${d.xp} XP`;
    if (Math.random() < 0.25) { this.s.gems += 1; txt += ' +1 💎'; }
    this.float(o, txt, '#b8f0ff', 40);
    this.ui.selectedId = null;
    this.objVersion++;
    this.sound('build');
    this.emit();
  }

  expand() {
    const e = this.ui.expand;
    if (!e) return;
    if (chunkState(this.s, e.cx, e.cy) !== 'buyable') { this.ui.expand = null; this.emit(false); return; }
    const info = expandInfo(this.s);
    if (this.s.level < info.level) { this.toast(`Reach level ${info.level} to expand.`, 'bad'); return; }
    if (this.s.coins < info.cost) { this.toast('Not enough coins.', 'bad'); return; }
    this.s.coins -= info.cost;
    this.s.chunks.push(`${e.cx},${e.cy}`);
    // new land comes with a few things to clear
    const kinds = ['tree_obs', 'bush_obs', 'rock_obs', 'tree_obs'];
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const x = e.cx * CHUNK + Math.floor(Math.random() * CHUNK);
      const y = e.cy * CHUNK + Math.floor(Math.random() * CHUNK);
      if (!this.objectAt(x, y)) this.s.objects.push({ id: this.s.nextId++, type: kinds[Math.floor(Math.random() * kinds.length)], x, y });
    }
    this.stat('expand');
    this.addXp(10);
    this.fx.push({ kind: 'burst', gx: e.cx * CHUNK + 2, gy: e.cy * CHUNK + 2, color: '#ffe066', z: 10 });
    this.fx.push({ kind: 'float', gx: e.cx * CHUNK + 2, gy: e.cy * CHUNK + 2, text: 'New land!', color: '#fff6c8', z: 30 });
    this.ui.expand = null;
    this.objVersion++;
    this.sound('levelup');
    this.emit();
  }

  // ------------------------------------------------ storage and market

  upgradeStorage(k: 'silo' | 'barn') {
    const lvl = k === 'silo' ? this.s.siloLevel : this.s.barnLevel;
    const cost = upgradeCost(lvl);
    if (this.s.coins < cost) { this.toast('Not enough coins.', 'bad'); return; }
    this.s.coins -= cost;
    if (k === 'silo') this.s.siloLevel++; else this.s.barnLevel++;
    this.addXp(5 + lvl * 2);
    this.toast(`${k === 'silo' ? 'Silo' : 'Barn'} upgraded to ${storageCap(this.s, k)}.`, 'good');
    this.sound('build');
    this.emit();
  }

  sellItem(id: string, qty: number) {
    const have = this.s.inv[id] ?? 0;
    const n = Math.min(have, qty);
    if (n <= 0) return;
    this.take(id, n);
    this.earn(ITEMS[id].sell * n);
    this.sound('coin');
    this.emit();
  }

  // ------------------------------------------------ orders

  ensureOrders() {
    const want = orderCount(this.s.level);
    while (this.s.orders.length < want) this.s.orders.push(genOrder(this.s, Date.now()));
  }

  fulfillOrder(id: number) {
    const o = this.s.orders.find((x) => x.id === id);
    if (!o) return;
    if (!canFulfill(this.s, o, Date.now())) { this.toast('You do not have everything for this order yet.', 'bad'); return; }
    for (const it of o.items) this.take(it.id, it.qty);
    const coins = Math.round(o.coins * (1 + horseBonus(this.s)));
    this.earn(coins);
    this.s.gems += o.gems;
    this.stat('orders');
    this.addXp(o.xp);
    const board = this.s.objects.find((x) => x.type === 'board');
    if (board) { this.float(board, `+${coins} coins`, '#ffe066', 60); this.fly(board, '🪙', 'coins', 60); }
    this.s.orders = this.s.orders.map((x) => (x.id === id ? genOrder(this.s, Date.now() + 5000) : x));
    this.sound('coin');
    this.emit();
  }

  discardOrder(id: number) {
    this.s.orders = this.s.orders.map((x) => (x.id === id ? genOrder(this.s, Date.now() + 45000) : x));
    this.sound('click');
    this.emit();
  }

  // ------------------------------------------------ daily and quests

  canDaily() { return this.s.lastDaily !== todayKey(); }

  // ---- sleeping at home (the farmhouse, or the manor once built)
  canRest() { return this.s.restedOn !== todayKey(); }
  sleep() {
    if (this.ui.napping) return;
    this.ui.napping = true;
    // the nap clock starts when the farmer has walked home and gone in (homeArrived)
    this.ui.napAt = 0;
    this.ui.panel = null;
    this.ui.selectedId = null;
    this.sound('click');
    this.emit(false);
  }
  homeArrived() {
    if (!this.ui.napping || this.ui.napAt) return;
    this.ui.napAt = Date.now();
    this.emit(false);
  }
  // the first nap of each day that lasts NAP_MS earns a small rested bonus
  wake() {
    if (!this.ui.napping) return;
    this.ui.napping = false;
    const s = this.s;
    if (this.canRest()) {
      if (this.ui.napAt && Date.now() - this.ui.napAt >= NAP_MS) {
        s.restedOn = todayKey();
        const coins = restBonus(s.level);
        this.earn(coins);
        this.addXp(10);
        this.sound('levelup');
        this.toast(`Well rested! +${coins} coins, +10 XP`, 'good');
      } else this.toast('Up already? Sleep a little longer for the rested bonus.');
    }
    this.emit();
  }

  claimDaily() {
    if (!this.canDaily()) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    this.s.streak = this.s.lastDaily === todayKey(y) ? this.s.streak + 1 : 1;
    this.s.lastDaily = todayKey();
    const r = dailyReward(this.s.streak);
    this.earn(r.coins);
    this.s.gems += r.gems;
    this.ui.daily = false;
    this.sound('coin');
    this.toast(`Daily reward: ${r.coins} coins${r.gems ? ` and ${r.gems} gems` : ''}.`, 'good');
    this.emit();
  }

  claimQuest(id: string) {
    const q = QUESTS.find((x) => x.id === id);
    if (!q || this.s.quests.includes(id) || q.progress(this.s) < q.target) return;
    this.s.quests.push(id);
    this.earn(q.coins);
    this.s.gems += q.gems;
    if (q.xp) this.addXp(q.xp);
    this.sound('coin');
    this.toast(`Goal complete: ${q.text}!`, 'good');
    this.emit();
  }


  // ------------------------------------------------ fruit trees

  collectTree(o: FarmObject) {
    const ti = treeInfo(o, Date.now());
    if (!ti.ready || !o.tree) return false;
    if (!this.canStore(ti.fruit, 2)) { this.fullToast(ti.fruit); return false; }
    const d = BUILDING[o.type];
    this.add(ti.fruit, 2);
    this.stat('fruit', 2);
    this.stat(`harvest:${ti.fruit}`, 2);
    o.tree.startAt = Date.now();
    this.addXp(Math.max(2, Math.round(d.xp / 2)));
    this.float(o, `+2 ${ITEMS[ti.fruit].icon}`, '#fff6c8', 70);
    this.fly(o, ITEMS[ti.fruit].icon, 'storage', 60);
    this.burst(o, '#7ccf4f');
    this.sound('harvest');
    this.emit();
    return true;
  }

  speedTree(o: FarmObject) {
    const ti = treeInfo(o, Date.now());
    if (ti.ready || !o.tree) return;
    const cost = gemCost(ti.remaining);
    if (this.s.gems < cost) { this.toast('Not enough gems.', 'bad'); return; }
    this.s.gems -= cost;
    o.tree.startAt = Date.now() - (BUILDING[o.type].growTime ?? 60) * 1000;
    this.sound('coin');
    this.emit();
  }

  // ------------------------------------------------ roadside stall

  listItem(slot: number, item: string, qty: number, price: number) {
    const sl = this.s.stall[slot];
    if (!sl || sl.item) return;
    const have = this.s.inv[item] ?? 0;
    if (!ITEMS[item] || qty < 1 || have < qty) { this.toast('You do not have that many.', 'bad'); return; }
    const base = stallValue(item, qty);
    const pr = Math.max(1, Math.min(base * 2, Math.round(price)));
    const ratio = pr / base;
    const now = Date.now();
    const wait = (20 + Math.pow(Math.max(0.5, ratio), 2.2) * 80) * (0.7 + Math.random() * 0.6) * 1000;
    this.take(item, qty);
    this.s.stall[slot] = { item, qty, price: pr, listedAt: now, soldAt: now + wait };
    this.sound('click');
    this.emit();
  }

  collectSale(slot: number) {
    const sl = this.s.stall[slot];
    if (!sl || !sl.item || sl.soldAt > Date.now()) return;
    this.earn(sl.price);
    this.stat('stall');
    this.addXp(Math.max(1, Math.round(sl.price / 25)));
    const stall = this.s.objects.find((x) => x.type === 'stall');
    if (stall) { this.float(stall, `+${sl.price} coins`, '#ffe066', 50); this.fly(stall, '🪙', 'coins', 50); }
    this.s.stall[slot] = emptySlot();
    this.sound('coin');
    this.emit();
  }

  cancelListing(slot: number) {
    const sl = this.s.stall[slot];
    if (!sl || !sl.item || sl.soldAt <= Date.now()) return;
    if (!this.canStore(sl.item, sl.qty)) { this.fullToast(sl.item); return; }
    this.add(sl.item, sl.qty);
    this.s.stall[slot] = emptySlot();
    this.sound('click');
    this.emit();
  }

  // ------------------------------------------------ boat

  fillCrate(i: number) {
    const b = this.s.boat;
    const now = Date.now();
    if (!b || boatState(this.s, now) !== 'docked') return;
    const c = b.crates[i];
    if (!c || c.filled) return;
    if ((this.s.inv[c.item] ?? 0) < c.qty) { this.toast(`You need ${c.qty} ${ITEMS[c.item].name}.`, 'bad'); return; }
    this.take(c.item, c.qty);
    c.filled = true;
    this.earn(c.coins);
    this.addXp(c.xp);
    const dock = this.s.objects.find((x) => x.type === 'dock');
    if (dock) { this.float(dock, `+${c.coins} coins`, '#ffe066', 50); this.fly(dock, '🪙', 'coins', 40); }
    this.sound('coin');
    this.emit();
  }

  sendBoat() {
    const b = this.s.boat;
    if (!b || !b.crates.length || !b.crates.every((c) => c.filled)) return;
    this.earn(b.bonusCoins);
    this.s.gems += b.bonusGems;
    this.stat('boat');
    this.addXp(20);
    this.toast(`Boat sent! Bonus ${b.bonusCoins} coins and ${b.bonusGems} gems.`, 'good');
    this.s.boat = { ...b, crates: [], returnAt: Date.now() + 8 * 60e3 };
    this.sound('levelup');
    this.emit();
  }

  // called every second
  private rainNoteAt = 0;

  // grazing animals that finished their trip: home and fed (or home and still hungry if called back)
  private settleGrazing(now: number) {
    let changed = false;
    for (const o of this.s.objects) {
      if (!o.pen) continue;
      const bee = BUILDING[o.type].animal === 'bee';
      let fedN = 0, hungryN = 0;
      for (const a of o.pen.animals) {
        if (!a.graze) continue;
        const gp = grazePhase(a, now, bee);
        // called back before the meal was over: home, but still hungry
        if (gp.phase === 'home') { delete a.graze; hungryN++; changed = true; }
        else if (gp.phase === 'full') { a.fedAt = gp.doneAt; delete a.graze; fedN++; changed = true; }
      }
      if (fedN) this.float(o, bee ? `🍯 ${fedN} bees full of nectar` : `😋 ${fedN} full and home`, '#ffffff', 40);
      if (hungryN) this.float(o, `🍽️ ${hungryN} home, still hungry`, '#ffffff', 40);
    }
    return changed;
  }

  tick() {
    const now = Date.now();
    topUp(this.s); // TEMP test mode
    if (this.settleGrazing(now)) this.emit();
    this.storyTick(now);
    // rain and sprinklers water thirsty fields for free
    const thirsty = this.s.objects.filter((o) => o.type === 'plot' && needsWater(o, now));
    if (thirsty.length) {
      const rain = this.s.settings.weather && isRaining(now);
      const sprinklers = this.s.objects.filter((o) => o.type === 'sprinkler');
      const r = WATER.sprinklerRange;
      let rained = 0, watered = 0;
      for (const o of thirsty) {
        if (rain) { if (this.waterPlot(o, true, true)) { rained++; watered++; } }
        else if (sprinklers.some((sp) => Math.abs(sp.x - o.x) <= r && Math.abs(sp.y - o.y) <= r) && this.waterPlot(o, true, true)) watered++;
      }
      if (watered) this.scheduleSave();
      // one note per shower, not one per field
      if (rained && now - this.rainNoteAt > 5 * 60e3) {
        this.rainNoteAt = now;
        this.toast('Rain is watering your fields! 🌧️', 'good');
      }
    }
    const b = this.s.boat;
    if (b && this.countType('dock') > 0) {
      if (b.crates.length && now >= b.leavesAt) {
        this.s.boat = { ...b, crates: [], returnAt: now + 8 * 60e3 };
        this.toast('The boat left the dock. It will be back soon.');
      } else if (!b.crates.length && now >= b.returnAt) {
        this.s.boat = genBoat(this.s, now);
        this.toast('A cargo boat arrived at your dock!', 'good');
      }
    }
    this.emit(false);
  }

  // ------------------------------------------------ story

  chapter() { return chapterAt(this.s.story?.ch ?? 1); }
  // the chapter on now can be played: the story is not over and the level has caught up with it
  storyOn() {
    const st = this.s.story;
    return !!st && st.ch <= LAST_CHAPTER && this.s.level >= st.ch;
  }
  chapterReady() { return this.storyOn() && this.chapter().tasks.every((t) => taskProgress(t, this.s) >= t.target); }

  // begins the chapter on now (counters start from here) and tells it once no window is open
  private checkStory() {
    const st = this.s.story;
    if (!st || !this.storyOn()) return false;
    let changed = false;
    if (st.started !== st.ch) {
      st.started = st.ch;
      st.base = {};
      for (const t of chapterAt(st.ch).tasks) if (t.kind === 'stat') st.base[t.key] = this.s.stats[t.key] ?? 0;
      changed = true;
    }
    const ui = this.ui;
    if (st.seen < st.ch && !ui.story && ui.levelUp === null && !ui.daily && !ui.panel && !ui.placing && !ui.tool && !ui.expand && !ui.napping && ui.selectedId === null) {
      st.seen = st.ch;
      ui.story = { ch: st.ch, part: 'intro', i: 0 };
      changed = true;
    }
    return changed;
  }

  storyNext() {
    const d = this.ui.story;
    if (!d) return;
    const ch = chapterAt(d.ch);
    const lines = d.part === 'intro' ? ch.intro : [ch.outro];
    this.sound('click');
    if (d.i + 1 < lines.length) { d.i++; this.emit(false); return; }
    this.ui.story = null;
    if (d.part === 'intro') {
      const t = ch.tasks.find((x) => taskProgress(x, this.s) < x.target);
      if (t) { this.say(`${t.icon} ${t.text}`, 5000); this.hintAt = Date.now() + 60e3; }
    }
    this.emit(false);
  }

  // the chapter's teller, visiting the farm: hands out the reward when the chapter is done,
  // otherwise tells it again
  tapVisitor() {
    if (this.chapterReady()) this.finishChapter();
    else this.replayStory();
  }

  replayStory() {
    if (!this.storyOn()) return;
    this.ui.panel = null;
    this.ui.story = { ch: this.chapter().n, part: 'intro', i: 0 };
    this.sound('click');
    this.emit(false);
  }

  finishChapter() {
    if (!this.chapterReady()) return;
    const st = this.s.story!;
    const n = st.ch;
    const r = storyReward(n);
    st.ch = n + 1;
    this.earn(r.coins);
    this.s.gems += r.gems;
    this.stat('chapters');
    this.ui.panel = null;
    this.ui.say = null;
    this.ui.story = { ch: n, part: 'outro', i: 0 };
    this.toast(`Chapter ${n} complete! +${fmtNum(r.coins)} coins${r.gems ? `, +${r.gems} gems` : ''}`, 'good');
    this.sound('levelup');
    this.addXp(r.xp);
    this.emit();
  }

  // the farmer says something in a speech bubble over their head
  say(text: string, ms = 4500) {
    this.ui.say = { text, until: Date.now() + ms };
  }

  // cheers when a task gets done, and now and then a reminder of what the story asks for next
  private told = new Set<string>();
  private toldReady = false;
  private hintAt = 0;
  private storyTick(now: number) {
    if (!this.storyOn() || this.ui.story) return;
    const ch = this.chapter();
    const done = ch.tasks.filter((t) => taskProgress(t, this.s) >= t.target);
    if (!this.toldReady) { for (const t of done) this.told.add(t.id); this.toldReady = true; this.hintAt = now + 25e3; return; }
    for (const t of done) {
      if (this.told.has(t.id)) continue;
      this.told.add(t.id);
      this.say(`✅ ${t.text}`, 4000);
      this.toast(`Story task done: ${t.text}`, 'good');
      this.hintAt = now + 30e3;
    }
    if (now < this.hintAt || this.ui.napping) return;
    const next = ch.tasks.find((t) => taskProgress(t, this.s) < t.target);
    if (next) this.say(`${next.icon} ${next.text}  ${taskProgress(next, this.s)}/${next.target}`, 5000);
    else this.say(`📖 Chapter ${ch.n} is done! Open Goals for your reward.`, 5000);
    this.hintAt = now + 90e3;
  }

  // ------------------------------------------------ badges and tutorial

  claimBadge(id: string) {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    const k = this.s.achievements[id] ?? 0;
    if (k >= a.tiers.length || a.progress(this.s) < a.tiers[k]) return;
    this.s.achievements[id] = k + 1;
    this.s.gems += BADGE_GEMS[k];
    this.sound('levelup');
    this.toast(`${a.name} badge ${['bronze', 'silver', 'gold'][k]}! +${BADGE_GEMS[k]} gems`, 'good');
    this.emit();
  }

  private checkTutorial() {
    const s = this.s;
    let changed = false;
    while (s.tutorial < TUTORIAL.length && TUTORIAL[s.tutorial].done(s)) { s.tutorial++; changed = true; }
    if (s.tutorial === TUTORIAL.length) {
      s.tutorial = TUTORIAL_DONE;
      s.coins += 50;
      s.gems += 2;
      const t = { id: ++this.toastId, text: 'Tutorial complete! +50 coins and 2 gems.', tone: 'good' as const, at: Date.now() };
      this.toasts = [...this.toasts.slice(-3), t];
      setTimeout(() => { this.toasts = this.toasts.filter((x) => x.id !== t.id); this.emit(false); }, 3000);
    } else if (changed) this.sound('collect');
  }

  skipTutorial() {
    this.s.tutorial = TUTORIAL_DONE;
    this.emit();
  }

  // ------------------------------------------------ save management

  exportSave() {
    const json = JSON.stringify(this.s);
    return btoa(unescape(encodeURIComponent(json)));
  }

  importSave(code: string) {
    try {
      const json = decodeURIComponent(escape(atob(code.trim())));
      const d = JSON.parse(json);
      if (!d || d.v !== 1) throw new Error('bad');
      this.replace(migrate(d));
      this.toast('Farm loaded.', 'good');
      return true;
    } catch {
      this.toast('That save code is not valid.', 'bad');
      return false;
    }
  }

  reset() {
    this.replace(newGame());
    this.toast('A fresh farm is ready.', 'good');
  }

  private replace(s: GameState) {
    this.s = testBoost(s); // TEMP test mode
    this.ui = { selectedId: null, placing: null, tool: null, panel: null, storageTab: 'silo', expand: null, levelUp: null, daily: this.canDaily(), napping: false, napAt: 0, story: null, say: null };
    this.ensureOrders();
    this.giveStarterWell();
    this.makeRoomForLake();
    this.objVersion++;
    this.emit();
    this.saveNow();
  }
}
