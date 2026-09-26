// Talons Farm - static game data (items, crops, recipes, animals, buildings)

export type StorageKind = 'silo' | 'barn';

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  storage: StorageKind;
  sell: number;
  level: number;
}

export type CropShape = 'grain' | 'stalk' | 'root' | 'bush' | 'vine' | 'flower' | 'cane';

export interface CropDef {
  id: string;
  time: number; // seconds
  xp: number;
  seedCost: number; // coins, used when you have none of the crop left
  level: number;
  shape: CropShape;
  leaf: string;
  fruit: string;
}

export interface RecipeDef {
  id: string; // also the output item id
  building: string;
  inputs: Record<string, number>;
  time: number; // seconds
  xp: number;
  level: number;
  qty: number;
}

export interface AnimalDef {
  id: string;
  name: string;
  icon: string;
  house: string;
  feed: string;
  product: string;
  time: number;
  xp: number;
  cost: number;
  level: number;
}

export type BuildingKind = 'plot' | 'production' | 'pen' | 'barn' | 'silo' | 'house' | 'board' | 'deco' | 'obstacle' | 'tree' | 'stall' | 'dock';

export interface BuildingDef {
  id: string;
  name: string;
  icon: string;
  kind: BuildingKind;
  w: number;
  h: number;
  cost: number;
  level: number;
  max: number;
  xp: number;
  desc: string;
  wall: string;
  roof: string;
  height: number;
  buyable: boolean;
  sellable: boolean;
  animal?: string;
  capacity?: number;
  clearCost?: number;
  fruit?: string; // fruit trees
  growTime?: number; // fruit trees, seconds
}

// ---------------------------------------------------------------- items

export const ITEM_LIST: ItemDef[] = [];
function item(id: string, name: string, icon: string, storage: StorageKind, sell: number, level: number) {
  ITEM_LIST.push({ id, name, icon, storage, sell, level });
}

// crops (silo)
item('wheat', 'Wheat', '🌾', 'silo', 3, 1);
item('corn', 'Corn', '🌽', 'silo', 7, 2);
item('carrot', 'Carrot', '🥕', 'silo', 10, 3);
item('tomato', 'Tomato', '🍅', 'silo', 14, 4);
item('sugarcane', 'Sugarcane', '🎋', 'silo', 18, 6);
item('potato', 'Potato', '🥔', 'silo', 20, 7);
item('strawberry', 'Strawberry', '🍓', 'silo', 26, 9);
item('pumpkin', 'Pumpkin', '🎃', 'silo', 32, 11);
item('sunflower', 'Sunflower', '🌻', 'silo', 36, 12);
item('rice', 'Rice', '🍚', 'silo', 40, 13);
item('cotton', 'Cotton', '☁️', 'silo', 44, 14);
item('chili', 'Chili Pepper', '🌶️', 'silo', 48, 15);

// fruit (silo)
item('apple', 'Apple', '🍎', 'silo', 22, 6);
item('cherry', 'Cherry', '🍒', 'silo', 30, 9);
item('orange', 'Orange', '🍊', 'silo', 38, 11);

// feed (barn)
item('chicken_feed', 'Chicken Feed', '🥣', 'barn', 6, 2);
item('cow_feed', 'Cow Feed', '🥗', 'barn', 10, 5);
item('pig_feed', 'Pig Feed', '🍠', 'barn', 14, 8);
item('sheep_feed', 'Sheep Feed', '🍀', 'barn', 16, 10);
item('duck_feed', 'Duck Feed', '🌰', 'barn', 8, 6);
item('goat_feed', 'Goat Feed', '🌿', 'barn', 18, 12);

// animal goods (barn)
item('egg', 'Egg', '🥚', 'barn', 18, 2);
item('milk', 'Milk', '🥛', 'barn', 30, 5);
item('bacon', 'Bacon', '🥓', 'barn', 50, 8);
item('wool', 'Wool', '🧶', 'barn', 60, 10);
item('feather', 'Feather', '🪶', 'barn', 28, 6);
item('goat_milk', 'Goat Milk', '🍼', 'barn', 70, 12);
item('honey', 'Honey', '🍯', 'barn', 80, 13);
item('horseshoe', 'Lucky Horseshoe', '🧲', 'barn', 95, 15);
item('goat_cheese', 'Goat Cheese', '🫕', 'barn', 180, 12);
item('candle', 'Candle', '🕯️', 'barn', 190, 16);
item('feather_pillow', 'Feather Pillow', '🛏️', 'barn', 230, 16);

// crafted goods (barn)
item('bread', 'Bread', '🍞', 'barn', 16, 1);
item('corn_muffin', 'Corn Muffin', '🧁', 'barn', 60, 4);
item('cookie', 'Cookie', '🍪', 'barn', 75, 7);
item('pumpkin_pie', 'Pumpkin Pie', '🥧', 'barn', 140, 11);
item('cream', 'Cream', '🍦', 'barn', 45, 5);
item('butter', 'Butter', '🧈', 'barn', 75, 6);
item('cheese', 'Cheese', '🧀', 'barn', 110, 9);
item('sugar', 'Sugar', '🍬', 'barn', 30, 6);
item('syrup', 'Syrup', '🍁', 'barn', 55, 7);
item('bacon_eggs', 'Bacon and Eggs', '🍳', 'barn', 115, 8);
item('fries', 'Fries', '🍟', 'barn', 150, 8);
item('tomato_juice', 'Tomato Juice', '🥤', 'barn', 60, 9);
item('strawberry_juice', 'Berry Juice', '🧃', 'barn', 110, 9);
item('scarf', 'Scarf', '🧣', 'barn', 85, 10);
item('sweater', 'Sweater', '🧥', 'barn', 170, 10);
item('fish', 'Fish', '🐟', 'barn', 40, 7);
item('lobster', 'Lobster', '🦞', 'barn', 90, 12);
item('apple_pie', 'Apple Pie', '🥮', 'barn', 130, 7);
item('apple_juice', 'Apple Juice', '🧋', 'barn', 85, 9);
item('orange_juice', 'Orange Juice', '🍹', 'barn', 130, 11);
item('apple_jam', 'Apple Jam', '🫙', 'barn', 95, 8);
item('cherry_jam', 'Cherry Jam', '🥫', 'barn', 120, 10);
item('marmalade', 'Marmalade', '🏺', 'barn', 140, 12);
item('vanilla_ice', 'Vanilla Ice Cream', '🍨', 'barn', 110, 11);
item('berry_ice', 'Berry Ice Cream', '🍧', 'barn', 150, 13);
item('sushi', 'Sushi', '🍣', 'barn', 230, 13);
item('lobster_roll', 'Lobster Roll', '🥪', 'barn', 260, 14);
item('cotton_shirt', 'Cotton Shirt', '👕', 'barn', 150, 14);
item('hot_chili', 'Hot Chili', '🍲', 'barn', 240, 15);

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(ITEM_LIST.map((i) => [i.id, i]));

// ---------------------------------------------------------------- crops

export const CROPS: CropDef[] = [
  { id: 'wheat', time: 20, xp: 1, seedCost: 1, level: 1, shape: 'grain', leaf: '#7fb843', fruit: '#e8c14a' },
  { id: 'corn', time: 45, xp: 2, seedCost: 3, level: 2, shape: 'stalk', leaf: '#5fa83a', fruit: '#f5d53b' },
  { id: 'carrot', time: 90, xp: 3, seedCost: 5, level: 3, shape: 'root', leaf: '#4f9e36', fruit: '#f0862a' },
  { id: 'tomato', time: 120, xp: 4, seedCost: 7, level: 4, shape: 'bush', leaf: '#3f8f37', fruit: '#e8432e' },
  { id: 'sugarcane', time: 180, xp: 5, seedCost: 9, level: 6, shape: 'cane', leaf: '#8cc152', fruit: '#b5d86a' },
  { id: 'potato', time: 240, xp: 6, seedCost: 10, level: 7, shape: 'root', leaf: '#5c9a3a', fruit: '#c49a5a' },
  { id: 'strawberry', time: 300, xp: 7, seedCost: 13, level: 9, shape: 'bush', leaf: '#3d8a3f', fruit: '#ff3d5a' },
  { id: 'pumpkin', time: 420, xp: 9, seedCost: 16, level: 11, shape: 'vine', leaf: '#4d9a3c', fruit: '#f28c28' },
  { id: 'sunflower', time: 600, xp: 11, seedCost: 18, level: 12, shape: 'flower', leaf: '#4f9e36', fruit: '#ffd12b' },
  { id: 'rice', time: 720, xp: 12, seedCost: 20, level: 13, shape: 'grain', leaf: '#8cc152', fruit: '#f3ecc8' },
  { id: 'cotton', time: 840, xp: 13, seedCost: 22, level: 14, shape: 'bush', leaf: '#5c9a3a', fruit: '#ffffff' },
  { id: 'chili', time: 900, xp: 14, seedCost: 24, level: 15, shape: 'bush', leaf: '#3f8f37', fruit: '#d62828' },
];
export const CROP: Record<string, CropDef> = Object.fromEntries(CROPS.map((c) => [c.id, c]));

// ---------------------------------------------------------------- recipes

export const RECIPES: RecipeDef[] = [];
function recipe(id: string, building: string, inputs: Record<string, number>, time: number, xp: number, level: number, qty = 1) {
  RECIPES.push({ id, building, inputs, time, xp, level, qty });
}

recipe('bread', 'bakery', { wheat: 3 }, 45, 3, 1);
recipe('corn_muffin', 'bakery', { corn: 2, egg: 2 }, 120, 7, 4);
recipe('cookie', 'bakery', { wheat: 2, egg: 1, sugar: 1 }, 180, 9, 7);
recipe('pumpkin_pie', 'bakery', { pumpkin: 2, egg: 1, wheat: 2 }, 300, 14, 11);

recipe('chicken_feed', 'feed_mill', { wheat: 2, corn: 1 }, 20, 1, 2, 3);
recipe('cow_feed', 'feed_mill', { corn: 2, carrot: 1 }, 30, 2, 5, 3);
recipe('pig_feed', 'feed_mill', { carrot: 2, potato: 1 }, 45, 3, 8, 3);
recipe('sheep_feed', 'feed_mill', { wheat: 2, sugarcane: 1 }, 60, 3, 10, 3);
recipe('duck_feed', 'feed_mill', { wheat: 1, corn: 2 }, 30, 2, 6, 3);
recipe('goat_feed', 'feed_mill', { corn: 2, potato: 1 }, 50, 3, 12, 3);
recipe('goat_cheese', 'dairy', { goat_milk: 2 }, 240, 11, 12);
recipe('candle', 'workshop', { honey: 2 }, 300, 13, 16);
recipe('feather_pillow', 'workshop', { feather: 3, cotton: 2 }, 360, 16, 16);

recipe('cream', 'dairy', { milk: 1 }, 60, 4, 5);
recipe('butter', 'dairy', { milk: 2 }, 120, 6, 6);
recipe('cheese', 'dairy', { milk: 3 }, 240, 10, 9);

recipe('sugar', 'sugar_mill', { sugarcane: 1 }, 60, 3, 6);
recipe('syrup', 'sugar_mill', { sugarcane: 2 }, 120, 5, 7);

recipe('bacon_eggs', 'bbq_grill', { bacon: 1, egg: 2 }, 180, 9, 8);
recipe('fries', 'bbq_grill', { potato: 2, butter: 1 }, 200, 10, 8);

recipe('tomato_juice', 'juice_press', { tomato: 3 }, 120, 6, 9);
recipe('strawberry_juice', 'juice_press', { strawberry: 3 }, 200, 10, 9);

recipe('scarf', 'loom', { wool: 1 }, 180, 8, 10);
recipe('sweater', 'loom', { wool: 2 }, 300, 13, 10);
recipe('cotton_shirt', 'loom', { cotton: 3 }, 300, 14, 14);

recipe('apple_pie', 'bakery', { apple: 3, wheat: 2, egg: 1 }, 240, 12, 7);
recipe('apple_juice', 'juice_press', { apple: 3 }, 150, 8, 9);
recipe('orange_juice', 'juice_press', { orange: 3 }, 210, 11, 11);
recipe('hot_chili', 'bbq_grill', { chili: 3, tomato: 2, bacon: 1 }, 300, 16, 15);

recipe('fish', 'fishing_pier', { corn: 2 }, 120, 5, 7);
recipe('lobster', 'fishing_pier', { carrot: 3 }, 300, 10, 12);

recipe('apple_jam', 'jam_maker', { apple: 3 }, 180, 9, 8);
recipe('cherry_jam', 'jam_maker', { cherry: 3 }, 240, 11, 10);
recipe('marmalade', 'jam_maker', { orange: 3 }, 300, 13, 12);

recipe('vanilla_ice', 'ice_cream', { milk: 2, sugar: 1 }, 200, 10, 11);
recipe('berry_ice', 'ice_cream', { cream: 1, strawberry: 2 }, 260, 13, 13);

recipe('sushi', 'sushi_bar', { fish: 2, rice: 2 }, 300, 16, 13);
recipe('lobster_roll', 'sushi_bar', { lobster: 1, bread: 1, butter: 1 }, 360, 18, 14);

export const RECIPE: Record<string, RecipeDef> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// ---------------------------------------------------------------- animals

export const ANIMALS: AnimalDef[] = [
  { id: 'chicken', name: 'Chicken', icon: '🐔', house: 'coop', feed: 'chicken_feed', product: 'egg', time: 60, xp: 2, cost: 25, level: 2 },
  { id: 'cow', name: 'Cow', icon: '🐄', house: 'pasture', feed: 'cow_feed', product: 'milk', time: 150, xp: 4, cost: 90, level: 5 },
  { id: 'pig', name: 'Pig', icon: '🐖', house: 'pigpen', feed: 'pig_feed', product: 'bacon', time: 240, xp: 6, cost: 160, level: 8 },
  { id: 'sheep', name: 'Sheep', icon: '🐑', house: 'sheepfold', feed: 'sheep_feed', product: 'wool', time: 300, xp: 8, cost: 220, level: 10 },
  { id: 'duck', name: 'Duck', icon: '🦆', house: 'duck_pond', feed: 'duck_feed', product: 'feather', time: 120, xp: 3, cost: 60, level: 6 },
  { id: 'goat', name: 'Goat', icon: '🐐', house: 'goat_yard', feed: 'goat_feed', product: 'goat_milk', time: 200, xp: 5, cost: 180, level: 12 },
  { id: 'bee', name: 'Bee Colony', icon: '🐝', house: 'beehive', feed: 'sunflower', product: 'honey', time: 240, xp: 6, cost: 250, level: 13 },
  { id: 'horse', name: 'Horse', icon: '🐎', house: 'stable', feed: 'carrot', product: 'horseshoe', time: 360, xp: 8, cost: 400, level: 15 },
];
export const ANIMAL: Record<string, AnimalDef> = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));

// ---------------------------------------------------------------- buildings

function b(d: Partial<BuildingDef> & Pick<BuildingDef, 'id' | 'name' | 'icon' | 'kind'>): BuildingDef {
  return {
    w: 1, h: 1, cost: 0, level: 1, max: 1, xp: 0, desc: '',
    wall: '#e8d3a8', roof: '#b5452c', height: 50, buyable: true, sellable: false,
    ...d,
  };
}

export const BUILDINGS: BuildingDef[] = [
  b({ id: 'plot', name: 'Field', icon: '🟫', kind: 'plot', cost: 10, max: 60, xp: 1, height: 0, desc: 'Plant crops here. Harvest gives you two back.', wall: '#8a5a34' }),

  b({ id: 'house', name: 'Farmhouse', icon: '🏡', kind: 'house', w: 2, h: 2, buyable: false, height: 58, wall: '#f6e3c4', roof: '#d35400', desc: 'Your home. Open it to see your goals.' }),
  b({ id: 'manor', name: 'Manor', icon: '🏰', kind: 'house', w: 3, h: 3, cost: 4000, level: 8, xp: 80, height: 92, wall: '#f4ead8', roof: '#3f5f8a', desc: 'A grand home for your farmer, who rests here at night.' }),
  b({ id: 'barn', name: 'Barn', icon: '🏚️', kind: 'barn', w: 2, h: 2, buyable: false, height: 64, wall: '#c0392b', roof: '#5d3a1f', desc: 'Stores goods and animal products.' }),
  b({ id: 'silo', name: 'Silo', icon: '🌾', kind: 'silo', buyable: false, height: 88, wall: '#d7dbe0', roof: '#c0392b', desc: 'Stores crops.' }),
  b({ id: 'board', name: 'Order Board', icon: '📋', kind: 'board', buyable: false, height: 50, wall: '#a0692f', roof: '#6b4226', desc: 'Deliver orders for coins and XP.' }),

  b({ id: 'bakery', name: 'Bakery', icon: '🍞', kind: 'production', w: 2, h: 2, cost: 60, level: 1, xp: 10, height: 56, wall: '#f3d9a4', roof: '#c0392b', desc: 'Bakes bread, muffins, cookies and pies.' }),
  b({ id: 'feed_mill', name: 'Feed Mill', icon: '⚙️', kind: 'production', w: 2, h: 2, cost: 120, level: 2, xp: 12, height: 62, wall: '#d9c29a', roof: '#6d8a3a', desc: 'Turns crops into animal feed.' }),
  b({ id: 'dairy', name: 'Dairy', icon: '🥛', kind: 'production', w: 2, h: 2, cost: 500, level: 5, xp: 25, height: 56, wall: '#e8f1f8', roof: '#3a7bd5', desc: 'Makes cream, butter and cheese.' }),
  b({ id: 'sugar_mill', name: 'Sugar Mill', icon: '🍬', kind: 'production', w: 2, h: 2, cost: 800, level: 6, xp: 30, height: 60, wall: '#f6e7f0', roof: '#b04a8a', desc: 'Makes sugar and syrup.' }),
  b({ id: 'bbq_grill', name: 'BBQ Grill', icon: '🔥', kind: 'production', w: 2, h: 2, cost: 1200, level: 8, xp: 40, height: 52, wall: '#caa27a', roof: '#4a3a30', desc: 'Cooks hearty farm meals.' }),
  b({ id: 'juice_press', name: 'Juice Press', icon: '🧃', kind: 'production', w: 2, h: 2, cost: 1500, level: 9, xp: 45, height: 56, wall: '#fff0c9', roof: '#e67e22', desc: 'Presses fresh juices.' }),
  b({ id: 'loom', name: 'Loom', icon: '🧵', kind: 'production', w: 2, h: 2, cost: 2000, level: 10, xp: 55, height: 58, wall: '#efe2ff', roof: '#7d5ba6', desc: 'Weaves wool into clothes.' }),

  b({ id: 'fishing_pier', name: 'Fishing Pier', icon: '🎣', kind: 'production', w: 2, h: 2, cost: 700, level: 7, xp: 30, height: 30, wall: '#b98a52', roof: '#2e6da4', desc: 'Catch fish and lobsters with bait.' }),
  b({ id: 'jam_maker', name: 'Jam Maker', icon: '🫙', kind: 'production', w: 2, h: 2, cost: 1100, level: 8, xp: 40, height: 56, wall: '#ffe3e3', roof: '#c0392b', desc: 'Cooks fruit into jam.' }),
  b({ id: 'ice_cream', name: 'Ice Cream Shop', icon: '🍨', kind: 'production', w: 2, h: 2, cost: 1800, level: 11, xp: 50, height: 54, wall: '#e3f6ff', roof: '#ff8fb0', desc: 'Churns sweet frozen treats.' }),
  b({ id: 'sushi_bar', name: 'Sushi Bar', icon: '🍣', kind: 'production', w: 2, h: 2, cost: 2600, level: 13, xp: 65, height: 56, wall: '#f5ede0', roof: '#34495e', desc: 'Rolls fresh sushi and lobster rolls.' }),

  b({ id: 'stall', name: 'Roadside Stall', icon: '🏪', kind: 'stall', w: 2, h: 2, cost: 200, level: 4, xp: 15, height: 40, wall: '#c98a45', roof: '#e74c3c', desc: 'Set your own prices. Villagers stop by to buy.' }),
  b({ id: 'dock', name: 'Boat Dock', icon: '⛵', kind: 'dock', w: 2, h: 2, cost: 500, level: 6, xp: 25, height: 30, wall: '#9c6a35', roof: '#2e6da4', desc: 'A cargo boat visits. Fill its crates for big rewards.' }),

  b({ id: 'apple_tree', name: 'Apple Tree', icon: '🍎', kind: 'tree', cost: 150, level: 6, max: 12, xp: 5, height: 64, sellable: true, fruit: 'apple', growTime: 240, desc: 'Gives 2 apples again and again.' }),
  b({ id: 'cherry_tree', name: 'Cherry Tree', icon: '🍒', kind: 'tree', cost: 300, level: 9, max: 12, xp: 8, height: 64, sellable: true, fruit: 'cherry', growTime: 360, desc: 'Gives 2 cherries again and again.' }),
  b({ id: 'orange_tree', name: 'Orange Tree', icon: '🍊', kind: 'tree', cost: 450, level: 11, max: 12, xp: 10, height: 64, sellable: true, fruit: 'orange', growTime: 480, desc: 'Gives 2 oranges again and again.' }),

  b({ id: 'coop', name: 'Chicken Coop', icon: '🐔', kind: 'pen', w: 2, h: 2, cost: 150, level: 2, xp: 10, height: 26, wall: '#e3cf94', roof: '#b5452c', animal: 'chicken', capacity: 6, desc: 'Home for up to 6 chickens.' }),
  b({ id: 'pasture', name: 'Cow Pasture', icon: '🐄', kind: 'pen', w: 3, h: 3, cost: 400, level: 5, xp: 20, height: 26, wall: '#9ccc5a', roof: '#6b4226', animal: 'cow', capacity: 5, desc: 'Home for up to 5 cows.' }),
  b({ id: 'pigpen', name: 'Pig Pen', icon: '🐖', kind: 'pen', w: 3, h: 3, cost: 1000, level: 8, xp: 35, height: 26, wall: '#a88058', roof: '#8e44ad', animal: 'pig', capacity: 5, desc: 'Home for up to 5 pigs.' }),
  b({ id: 'sheepfold', name: 'Sheep Fold', icon: '🐑', kind: 'pen', w: 3, h: 3, cost: 1800, level: 10, xp: 50, height: 26, wall: '#b7d77a', roof: '#2e6da4', animal: 'sheep', capacity: 5, desc: 'Home for up to 5 sheep.' }),

  b({ id: 'duck_pond', name: 'Duck Pond', icon: '🦆', kind: 'pen', w: 3, h: 3, cost: 300, level: 6, xp: 15, height: 26, wall: '#8fc45a', roof: '#2e6da4', animal: 'duck', capacity: 5, desc: 'Home for up to 5 ducks.' }),
  b({ id: 'goat_yard', name: 'Goat Yard', icon: '🐐', kind: 'pen', w: 3, h: 3, cost: 1500, level: 12, xp: 45, height: 26, wall: '#b5a36a', roof: '#7a4b26', animal: 'goat', capacity: 5, desc: 'Home for up to 5 goats.' }),
  b({ id: 'beehive', name: 'Bee Garden', icon: '🐝', kind: 'pen', w: 2, h: 2, cost: 1600, level: 13, xp: 45, height: 26, wall: '#9ccc5a', roof: '#f5b92b', animal: 'bee', capacity: 4, desc: 'Up to 4 hives. Bees love sunflowers.' }),
  b({ id: 'stable', name: 'Stable', icon: '🐎', kind: 'pen', w: 3, h: 3, cost: 2500, level: 15, xp: 60, height: 26, wall: '#c2a36b', roof: '#8e2c20', animal: 'horse', capacity: 5, desc: 'Up to 5 horses. Each horse adds 5% to order coins.' }),
  b({ id: 'workshop', name: 'Workshop', icon: '🛠️', kind: 'production', w: 2, h: 2, cost: 3000, level: 16, xp: 70, height: 58, wall: '#e8d3a8', roof: '#4a6a8a', desc: 'Crafts candles and pillows.' }),

  b({ id: 'hay_bale', name: 'Hay Bale', icon: '🌾', kind: 'deco', cost: 15, level: 1, max: 30, xp: 1, height: 18, sellable: true, desc: 'A cozy stack of hay.' }),
  b({ id: 'oak', name: 'Oak Tree', icon: '🌳', kind: 'deco', cost: 25, level: 1, max: 30, xp: 2, height: 62, sellable: true, desc: 'Shade for a sunny farm.' }),
  b({ id: 'flowers', name: 'Flower Bed', icon: '🌷', kind: 'deco', cost: 30, level: 3, max: 30, xp: 2, height: 12, sellable: true, desc: 'A splash of color.' }),
  b({ id: 'bench', name: 'Bench', icon: '🪑', kind: 'deco', cost: 45, level: 4, max: 20, xp: 3, height: 20, sellable: true, desc: 'Sit and enjoy the view.' }),
  b({ id: 'lamp', name: 'Lamp Post', icon: '💡', kind: 'deco', cost: 60, level: 5, max: 20, xp: 3, height: 52, sellable: true, desc: 'Glows warmly at night.' }),
  b({ id: 'scarecrow', name: 'Scarecrow', icon: '🎩', kind: 'deco', cost: 80, level: 6, max: 10, xp: 4, height: 52, sellable: true, desc: 'Keeps the crows guessing.' }),
  b({ id: 'windmill', name: 'Windmill', icon: '🌀', kind: 'deco', w: 2, h: 2, cost: 450, level: 7, max: 3, xp: 20, height: 96, sellable: true, desc: 'Blades that turn all day.' }),
  b({ id: 'pond', name: 'Pond', icon: '💧', kind: 'deco', w: 2, h: 2, cost: 300, level: 9, max: 4, xp: 15, height: 8, sellable: true, desc: 'Calm water with lily pads.' }),
  b({ id: 'mailbox', name: 'Mailbox', icon: '📮', kind: 'deco', cost: 70, level: 5, max: 5, xp: 3, height: 34, sellable: true, desc: 'For letters from the city.' }),
  b({ id: 'gazebo', name: 'Gazebo', icon: '⛺', kind: 'deco', w: 2, h: 2, cost: 1200, level: 14, max: 2, xp: 50, height: 60, sellable: true, desc: 'A breezy spot for summer evenings.' }),
  b({ id: 'fountain', name: 'Fountain', icon: '⛲', kind: 'deco', w: 2, h: 2, cost: 900, level: 12, max: 2, xp: 40, height: 44, sellable: true, desc: 'A sparkling centerpiece.' }),

  b({ id: 'tree_obs', name: 'Old Tree', icon: '🌳', kind: 'obstacle', buyable: false, height: 64, clearCost: 20, xp: 5, desc: 'Clear it to free up space.' }),
  b({ id: 'rock_obs', name: 'Rock', icon: '🪨', kind: 'obstacle', buyable: false, height: 24, clearCost: 30, xp: 6, desc: 'Clear it to free up space.' }),
  b({ id: 'bush_obs', name: 'Bush', icon: '🌿', kind: 'obstacle', buyable: false, height: 22, clearCost: 8, xp: 3, desc: 'Clear it to free up space.' }),
];
export const BUILDING: Record<string, BuildingDef> = Object.fromEntries(BUILDINGS.map((x) => [x.id, x]));

// Things unlocked at a given level, used by the level up screen
export function unlocksAt(level: number): { icon: string; name: string }[] {
  const out: { icon: string; name: string }[] = [];
  for (const c of CROPS) if (c.level === level) out.push({ icon: ITEMS[c.id].icon, name: ITEMS[c.id].name });
  for (const a of ANIMALS) if (a.level === level) out.push({ icon: a.icon, name: a.name });
  for (const x of BUILDINGS) if (x.buyable && x.level === level && x.kind !== 'plot') out.push({ icon: x.icon, name: x.name });
  for (const r of RECIPES) if (r.level === level) out.push({ icon: ITEMS[r.id].icon, name: ITEMS[r.id].name });
  return out;
}
