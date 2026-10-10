// The farm museum: rare things that turn up now and then while the farm is worked, kept on show
// in sets, with a reward for every finished set. A field may hide a four leaf clover, a pen a
// golden egg, a fruit tree a wild honeycomb; clearing old land turns up relics, and the lake and
// the sea give up their lost things. A find is always one its set still lacks, and bad luck does
// not last: every time a source gives nothing, its next chance grows a little.

export type FindSource = 'harvest' | 'barn' | 'orchard' | 'relics' | 'lake' | 'sea';
export interface MuseumItem { id: string; name: string; icon: string }
export interface MuseumSet {
  id: FindSource; name: string; icon: string; how: string;
  // the chance of a find each time the source gives something (a harvest, a pen collected...)
  chance: number;
  items: MuseumItem[];
  reward: { coins: number; gems: number; xp: number };
}

export const MUSEUM: MuseumSet[] = [
  {
    id: 'harvest', name: 'Rare Harvest', icon: '🍀', how: 'Turn up now and then when you harvest fields.', chance: 0.012,
    items: [
      { id: 'rare_clover', name: 'Four Leaf Clover', icon: '🍀' },
      { id: 'rare_twin_carrot', name: 'Twin Carrot', icon: '🥕' },
      { id: 'rare_heart_potato', name: 'Heart Shaped Potato', icon: '🥔' },
      { id: 'rare_rainbow_corn', name: 'Rainbow Corn', icon: '🌽' },
      { id: 'rare_giant_melon', name: 'Giant Watermelon', icon: '🍉' },
      { id: 'rare_golden_ear', name: 'Golden Wheat Ear', icon: '🌾' },
    ],
    reward: { coins: 4000, gems: 30, xp: 400 },
  },
  {
    id: 'barn', name: 'Barnyard Treasures', icon: '🏵️', how: 'Turn up now and then when you collect from your pens.', chance: 0.02,
    items: [
      { id: 'rare_golden_egg', name: 'Solid Gold Egg', icon: '🥚' },
      { id: 'rare_rosette', name: 'Prize Rosette', icon: '🏵️' },
      { id: 'rare_farm_bell', name: 'Old Farm Bell', icon: '🛎️' },
      { id: 'rare_wren_nest', name: "Wren's Nest", icon: '🪺' },
      { id: 'rare_medal', name: 'First Prize Medal', icon: '🥇' },
      { id: 'rare_egg_basket', name: 'Old Egg Basket', icon: '🧺' },
    ],
    reward: { coins: 4000, gems: 30, xp: 400 },
  },
  {
    id: 'orchard', name: 'Orchard Finds', icon: '🍎', how: 'Turn up now and then when you pick fruit trees.', chance: 0.03,
    items: [
      { id: 'rare_golden_apple', name: 'Giant Apple', icon: '🍎' },
      { id: 'rare_honeycomb', name: 'Wild Honeycomb', icon: '🍯' },
      { id: 'rare_giant_acorn', name: 'Giant Acorn', icon: '🌰' },
      { id: 'rare_old_nest', name: "Old Bird's Nest", icon: '🪹' },
      { id: 'rare_ladybird', name: 'Lucky Ladybird', icon: '🐞' },
      { id: 'rare_kite', name: 'Tangled Kite', icon: '🪁' },
    ],
    reward: { coins: 3500, gems: 25, xp: 350 },
  },
  {
    id: 'relics', name: 'Old Farm Relics', icon: '🗝️', how: 'Dug up when you clear wild land and buy new land.', chance: 0.2,
    items: [
      { id: 'rare_rusty_key', name: 'Rusty Key', icon: '🗝️' },
      { id: 'rare_lantern', name: 'Old Lantern', icon: '🏮' },
      { id: 'rare_clock', name: 'Mantel Clock', icon: '🕰️' },
      { id: 'rare_map', name: 'Faded Farm Map', icon: '🗺️' },
      { id: 'rare_post_horn', name: 'Post Horn', icon: '📯' },
      { id: 'rare_mill_gear', name: 'Mill Gear', icon: '⚙️' },
    ],
    reward: { coins: 3500, gems: 25, xp: 350 },
  },
  {
    id: 'lake', name: 'Lake Finds', icon: '👑', how: 'Reeled in now and then at the lake.', chance: 0.06,
    items: [
      { id: 'rare_frog_crown', name: "Frog Prince's Crown", icon: '👑' },
      { id: 'rare_lost_ring', name: 'Lost Ring', icon: '💍' },
      { id: 'rare_teapot', name: 'Old Teapot', icon: '🫖' },
      { id: 'rare_soggy_boot', name: 'Soggy Boot', icon: '🥾' },
      { id: 'rare_marble', name: 'Glass Marble', icon: '🔵' },
      { id: 'rare_yoyo', name: 'Wooden Yo-yo', icon: '🪀' },
    ],
    reward: { coins: 3500, gems: 25, xp: 350 },
  },
  {
    id: 'sea', name: 'Sea Treasures', icon: '🦪', how: 'Reeled in now and then from the jetty on the shore.', chance: 0.06,
    items: [
      { id: 'rare_pearl', name: 'Black Pearl', icon: '🦪' },
      { id: 'rare_conch', name: 'Pink Conch', icon: '🐚' },
      { id: 'rare_anchor', name: 'Little Anchor', icon: '⚓' },
      { id: 'rare_bottle_note', name: 'Message in a Bottle', icon: '📜' },
      { id: 'rare_sea_star', name: 'Golden Sea Star', icon: '⭐' },
      { id: 'rare_spyglass', name: 'Old Spyglass', icon: '🔭' },
    ],
    reward: { coins: 4000, gems: 30, xp: 400 },
  },
];

export const museumSet = (id: string) => MUSEUM.find((m) => m.id === id);
export const museumItem = (id: string) => MUSEUM.flatMap((m) => m.items).find((i) => i.id === id);

// what the farm has found and taken: found item ids (when first found), finished sets whose
// reward was taken, and how many times each source has given nothing since its last find
export interface MuseumState { found: Record<string, number>; done: string[]; misses: Partial<Record<FindSource, number>> }
export const newMuseum = (): MuseumState => ({ found: {}, done: [], misses: {} });

// the chance of a find this time: a little better after every miss, so a find never stays away long
export const findChance = (set: MuseumSet, misses: number) => Math.min(1, set.chance * (1 + misses / 10));
