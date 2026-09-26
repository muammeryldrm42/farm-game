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

export type CropShape = 'grain' | 'stalk' | 'root' | 'bush' | 'vine' | 'flower' | 'cane' | 'leafy' | 'head' | 'bulb' | 'trellis' | 'rosette';

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
item('lettuce', 'Lettuce', '🥬', 'silo', 12, 5);
item('blueberry', 'Blueberry', '🫐', 'silo', 30, 10);
item('watermelon', 'Watermelon', '🍉', 'silo', 52, 16);
item('coffee_bean', 'Coffee Beans', '🫘', 'silo', 46, 17);
item('onion', 'Onion', '🧅', 'silo', 13, 5);
item('radish', 'Radish', '@radish', 'silo', 11, 4);
item('cabbage', 'Cabbage', '@cabbage', 'silo', 22, 8);
item('bell_pepper', 'Bell Pepper', '🫑', 'silo', 28, 9);
item('eggplant', 'Eggplant', '🍆', 'silo', 34, 11);
item('broccoli', 'Broccoli', '🥦', 'silo', 30, 12);
item('cucumber', 'Cucumber', '🥒', 'silo', 24, 8);
item('raspberry', 'Raspberry', '@raspberry', 'silo', 42, 14);
item('grape', 'Grapes', '🍇', 'silo', 50, 16);
item('pineapple', 'Pineapple', '🍍', 'silo', 58, 18);

// fruit (silo)
item('apple', 'Apple', '🍎', 'silo', 22, 6);
item('cherry', 'Cherry', '🍒', 'silo', 30, 9);
item('orange', 'Orange', '🍊', 'silo', 38, 11);
item('peach', 'Peach', '🍑', 'silo', 34, 10);
item('lemon', 'Lemon', '🍋', 'silo', 36, 13);
item('coconut', 'Coconut', '🥥', 'silo', 50, 16);
item('pear', 'Pear', '🍐', 'silo', 30, 8);
item('plum', 'Plum', '@plum', 'silo', 34, 12);
item('banana', 'Banana', '🍌', 'silo', 44, 15);
item('mango', 'Mango', '🥭', 'silo', 48, 17);
item('avocado', 'Avocado', '🥑', 'silo', 52, 18);
item('pomegranate', 'Pomegranate', '@pomegranate', 'silo', 56, 19);

// feed (barn)
item('chicken_feed', 'Chicken Feed', '🥣', 'barn', 6, 2);
item('cow_feed', 'Cow Feed', '🥗', 'barn', 10, 5);
item('sheep_feed', 'Sheep Feed', '🍀', 'barn', 16, 10);
item('duck_feed', 'Duck Feed', '🌰', 'barn', 8, 6);
item('goat_feed', 'Goat Feed', '🌿', 'barn', 18, 12);

// animal goods (barn)
item('egg', 'Egg', '🥚', 'barn', 18, 2);
item('milk', 'Milk', '🥛', 'barn', 30, 5);
item('wool', 'Wool', '🧶', 'barn', 60, 10);
item('feather', 'Feather', '🪶', 'barn', 28, 6);
item('goat_milk', 'Goat Milk', '🍼', 'barn', 70, 12);
item('honey', 'Honey', '🍯', 'barn', 80, 13);
item('horseshoe', 'Lucky Horseshoe', '🧲', 'barn', 95, 15);
item('goose_egg', 'Goose Egg', '🪺', 'barn', 55, 11);
item('turkey_feather', 'Turkey Feather', '@turkey_feather', 'barn', 45, 10);
item('donkey_milk', 'Donkey Milk', '@donkey_milk', 'barn', 60, 13);
item('buffalo_milk', 'Buffalo Milk', '@buffalo_milk', 'barn', 75, 15);
item('peacock_feather', 'Peacock Feather', '@peacock_feather', 'barn', 95, 17);
item('ostrich_egg', 'Ostrich Egg', '@ostrich_egg', 'barn', 110, 19);
item('angora', 'Angora Fur', '@angora', 'barn', 65, 9);
item('alpaca_wool', 'Alpaca Wool', '🦙', 'barn', 110, 14);
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
item('bacon_eggs', 'Veggie Omelette', '🍳', 'barn', 115, 8);
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
item('angora_hat', 'Angora Hat', '👒', 'barn', 170, 10);
item('poncho', 'Poncho', '@poncho', 'barn', 290, 14);
item('blueberry_muffin', 'Blueberry Muffin', '@blueberry_muffin', 'barn', 150, 10);
item('custard_tart', 'Custard Tart', '🍮', 'barn', 190, 12);
item('peach_jam', 'Peach Jam', '@peach_jam', 'barn', 125, 10);
item('peach_juice', 'Peach Juice', '@peach_juice', 'barn', 120, 10);
item('watermelon_juice', 'Melon Cooler', '🧉', 'barn', 150, 16);
item('garden_salad', 'Garden Salad', '@garden_salad', 'barn', 120, 10);
item('fruit_salad', 'Fruit Salad', '🍱', 'barn', 190, 13);
item('pizza', 'Pizza', '🍕', 'barn', 260, 12);
item('spicy_pizza', 'Spicy Pizza', '@spicy_pizza', 'barn', 300, 15);
item('lemonade', 'Lemonade', '@lemonade', 'barn', 120, 13);
item('espresso', 'Espresso', '☕', 'barn', 130, 17);
item('latte', 'Latte', '@latte', 'barn', 190, 17);
item('coconut_cake', 'Coconut Cake', '🎂', 'barn', 280, 16);
item('quill', 'Quill Pen', '🖋️', 'barn', 150, 10);
item('soap', 'Milk Soap', '🧼', 'barn', 190, 13);
item('mozzarella', 'Mozzarella', '@mozzarella', 'barn', 210, 15);
item('feather_fan', 'Feather Fan', '@feather_fan', 'barn', 290, 17);
item('big_omelette', 'Giant Omelette', '@big_omelette', 'barn', 320, 19);
item('grape_juice', 'Grape Juice', '@grape_juice', 'barn', 150, 16);
item('pineapple_juice', 'Pineapple Juice', '@pineapple_juice', 'barn', 170, 18);
item('plum_jam', 'Plum Jam', '@plum_jam', 'barn', 130, 12);
item('pickles', 'Pickles', '@pickles', 'barn', 90, 8);
item('stir_fry', 'Veggie Stir Fry', '🥘', 'barn', 170, 12);
item('banana_bread', 'Banana Bread', '@banana_bread', 'barn', 200, 15);
item('guacamole', 'Guacamole', '@guacamole', 'barn', 230, 18);

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
  { id: 'lettuce', time: 70, xp: 2, seedCost: 4, level: 5, shape: 'leafy', leaf: '#8ad05a', fruit: '#b9e27a' },
  { id: 'blueberry', time: 480, xp: 9, seedCost: 15, level: 10, shape: 'bush', leaf: '#3f7f3a', fruit: '#4a5bd4' },
  { id: 'watermelon', time: 960, xp: 15, seedCost: 26, level: 16, shape: 'vine', leaf: '#4d9a3c', fruit: '#6cc05a' },
  { id: 'radish', time: 60, xp: 2, seedCost: 3, level: 4, shape: 'bulb', leaf: '#5aa83a', fruit: '#d8264a' },
  { id: 'onion', time: 80, xp: 2, seedCost: 4, level: 5, shape: 'bulb', leaf: '#6cb84a', fruit: '#c98a4a' },
  { id: 'cabbage', time: 200, xp: 5, seedCost: 8, level: 8, shape: 'head', leaf: '#86c46a', fruit: '#b8e09a' },
  { id: 'cucumber', time: 220, xp: 5, seedCost: 8, level: 8, shape: 'vine', leaf: '#4f9e36', fruit: '#3f8a2a' },
  { id: 'bell_pepper', time: 330, xp: 7, seedCost: 12, level: 9, shape: 'bush', leaf: '#3f8f37', fruit: '#e0301e' },
  { id: 'eggplant', time: 450, xp: 9, seedCost: 15, level: 11, shape: 'bush', leaf: '#4a8a3c', fruit: '#4a1f5a' },
  { id: 'broccoli', time: 420, xp: 8, seedCost: 14, level: 12, shape: 'head', leaf: '#4f8f4a', fruit: '#3d7a2e' },
  { id: 'raspberry', time: 540, xp: 10, seedCost: 17, level: 14, shape: 'bush', leaf: '#3f7f3a', fruit: '#d4234f' },
  { id: 'grape', time: 780, xp: 13, seedCost: 22, level: 16, shape: 'trellis', leaf: '#5a9a3a', fruit: '#5a2a7a' },
  { id: 'pineapple', time: 1080, xp: 17, seedCost: 30, level: 18, shape: 'rosette', leaf: '#5a8a4a', fruit: '#e8b43a' },
  { id: 'coffee_bean', time: 1020, xp: 16, seedCost: 28, level: 17, shape: 'bush', leaf: '#2f6f35', fruit: '#b0282a' },
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

recipe('bacon_eggs', 'bbq_grill', { egg: 3, tomato: 1 }, 180, 9, 8);
recipe('fries', 'bbq_grill', { potato: 2, butter: 1 }, 200, 10, 8);

recipe('tomato_juice', 'juice_press', { tomato: 3 }, 120, 6, 9);
recipe('strawberry_juice', 'juice_press', { strawberry: 3 }, 200, 10, 9);

recipe('scarf', 'loom', { wool: 1 }, 180, 8, 10);
recipe('sweater', 'loom', { wool: 2 }, 300, 13, 10);
recipe('cotton_shirt', 'loom', { cotton: 3 }, 300, 14, 14);
recipe('angora_hat', 'loom', { angora: 2 }, 240, 11, 10);
recipe('poncho', 'loom', { alpaca_wool: 2, cotton: 1 }, 360, 17, 14);

recipe('apple_pie', 'bakery', { apple: 3, wheat: 2, egg: 1 }, 240, 12, 7);
recipe('apple_juice', 'juice_press', { apple: 3 }, 150, 8, 9);
recipe('orange_juice', 'juice_press', { orange: 3 }, 210, 11, 11);
recipe('hot_chili', 'bbq_grill', { chili: 3, tomato: 2, potato: 1 }, 300, 16, 15);

recipe('fish', 'fishing_pier', { corn: 2 }, 120, 5, 7);

recipe('quill', 'workshop', { turkey_feather: 2 }, 240, 11, 10);
recipe('soap', 'workshop', { donkey_milk: 1, lemon: 1 }, 300, 13, 13);
recipe('feather_fan', 'workshop', { peacock_feather: 2, cotton: 1 }, 360, 17, 17);
recipe('mozzarella', 'dairy', { buffalo_milk: 2 }, 270, 13, 15);
recipe('big_omelette', 'bbq_grill', { ostrich_egg: 1, onion: 1, bell_pepper: 1 }, 330, 18, 19);
recipe('stir_fry', 'bbq_grill', { broccoli: 1, bell_pepper: 1, onion: 1 }, 240, 12, 12);
recipe('grape_juice', 'juice_press', { grape: 2 }, 240, 12, 16);
recipe('pineapple_juice', 'juice_press', { pineapple: 1, sugar: 1 }, 270, 14, 18);
recipe('plum_jam', 'jam_maker', { plum: 3 }, 240, 12, 12);
recipe('pickles', 'jam_maker', { cucumber: 3 }, 150, 7, 8);
recipe('banana_bread', 'bakery', { banana: 2, wheat: 2, egg: 1 }, 300, 15, 15);
recipe('guacamole', 'salad_bar', { avocado: 2, tomato: 1, onion: 1 }, 270, 15, 18);
recipe('blueberry_muffin', 'bakery', { wheat: 2, blueberry: 2, egg: 1 }, 240, 12, 10);
recipe('custard_tart', 'bakery', { goose_egg: 1, milk: 1, sugar: 1 }, 270, 13, 12);
recipe('coconut_cake', 'bakery', { coconut: 2, wheat: 2, goose_egg: 1 }, 360, 17, 16);
recipe('peach_jam', 'jam_maker', { peach: 3 }, 200, 10, 10);
recipe('peach_juice', 'juice_press', { peach: 3 }, 180, 9, 10);
recipe('watermelon_juice', 'juice_press', { watermelon: 1, sugar: 1 }, 220, 12, 16);
recipe('garden_salad', 'salad_bar', { lettuce: 2, tomato: 1, carrot: 1 }, 150, 8, 10);
recipe('fruit_salad', 'salad_bar', { peach: 1, blueberry: 2, apple: 1 }, 240, 12, 13);
recipe('pizza', 'pizzeria', { wheat: 3, tomato: 2, cheese: 1 }, 300, 15, 12);
recipe('spicy_pizza', 'pizzeria', { bread: 1, chili: 2, cheese: 1 }, 330, 17, 15);
recipe('lemonade', 'coffee_kiosk', { lemon: 3, sugar: 1 }, 150, 8, 13);
recipe('espresso', 'coffee_kiosk', { coffee_bean: 2 }, 180, 10, 17);
recipe('latte', 'coffee_kiosk', { coffee_bean: 2, milk: 1 }, 240, 13, 17);
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
  { id: 'sheep', name: 'Sheep', icon: '🐑', house: 'sheepfold', feed: 'sheep_feed', product: 'wool', time: 300, xp: 8, cost: 220, level: 10 },
  { id: 'duck', name: 'Duck', icon: '🦆', house: 'duck_pond', feed: 'duck_feed', product: 'feather', time: 120, xp: 3, cost: 60, level: 6 },
  { id: 'goat', name: 'Goat', icon: '🐐', house: 'goat_yard', feed: 'goat_feed', product: 'goat_milk', time: 200, xp: 5, cost: 180, level: 12 },
  { id: 'bee', name: 'Bee Colony', icon: '🐝', house: 'beehive', feed: 'sunflower', product: 'honey', time: 240, xp: 6, cost: 250, level: 13 },
  { id: 'rabbit', name: 'Rabbit', icon: '🐇', house: 'rabbit_hutch', feed: 'carrot', product: 'angora', time: 180, xp: 4, cost: 120, level: 9 },
  { id: 'alpaca', name: 'Alpaca', icon: '🦙', house: 'alpaca_ranch', feed: 'wheat', product: 'alpaca_wool', time: 320, xp: 8, cost: 320, level: 14 },
  { id: 'goose', name: 'Goose', icon: '🪿', house: 'goose_pen', feed: 'duck_feed', product: 'goose_egg', time: 210, xp: 5, cost: 150, level: 11 },
  { id: 'turkey', name: 'Turkey', icon: '🦃', house: 'turkey_run', feed: 'chicken_feed', product: 'turkey_feather', time: 200, xp: 5, cost: 140, level: 10 },
  { id: 'donkey', name: 'Donkey', icon: '🫏', house: 'donkey_paddock', feed: 'carrot', product: 'donkey_milk', time: 280, xp: 6, cost: 260, level: 13 },
  { id: 'buffalo', name: 'Water Buffalo', icon: '🐃', house: 'buffalo_wallow', feed: 'cow_feed', product: 'buffalo_milk', time: 330, xp: 8, cost: 360, level: 15 },
  { id: 'peacock', name: 'Peacock', icon: '🦚', house: 'peacock_garden', feed: 'corn', product: 'peacock_feather', time: 360, xp: 9, cost: 420, level: 17 },
  { id: 'ostrich', name: 'Ostrich', icon: '🦤', house: 'ostrich_ranch', feed: 'wheat', product: 'ostrich_egg', time: 420, xp: 10, cost: 480, level: 19 },
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
  b({ id: 'peach_tree', name: 'Peach Tree', icon: '🍑', kind: 'tree', cost: 380, level: 10, max: 12, xp: 9, height: 64, sellable: true, fruit: 'peach', growTime: 420, desc: 'Gives 2 peaches again and again.' }),
  b({ id: 'lemon_tree', name: 'Lemon Tree', icon: '🍋', kind: 'tree', cost: 520, level: 13, max: 12, xp: 11, height: 64, sellable: true, fruit: 'lemon', growTime: 540, desc: 'Gives 2 lemons again and again.' }),
  b({ id: 'coconut_palm', name: 'Coconut Palm', icon: '🥥', kind: 'tree', cost: 700, level: 16, max: 10, xp: 14, height: 80, sellable: true, fruit: 'coconut', growTime: 660, desc: 'A tall palm that gives 2 coconuts again and again.' }),
  b({ id: 'pear_tree', name: 'Pear Tree', icon: '🍐', kind: 'tree', cost: 260, level: 8, max: 12, xp: 7, height: 64, sellable: true, fruit: 'pear', growTime: 330, desc: 'Gives 2 pears again and again.' }),
  b({ id: 'plum_tree', name: 'Plum Tree', icon: '@plum', kind: 'tree', cost: 480, level: 12, max: 12, xp: 10, height: 64, sellable: true, fruit: 'plum', growTime: 500, desc: 'Gives 2 plums again and again.' }),
  b({ id: 'banana_tree', name: 'Banana Tree', icon: '🍌', kind: 'tree', cost: 620, level: 15, max: 10, xp: 13, height: 80, sellable: true, fruit: 'banana', growTime: 600, desc: 'Big leaves and a heavy bunch of bananas.' }),
  b({ id: 'mango_tree', name: 'Mango Tree', icon: '🥭', kind: 'tree', cost: 760, level: 17, max: 10, xp: 15, height: 70, sellable: true, fruit: 'mango', growTime: 700, desc: 'Gives 2 mangoes again and again.' }),
  b({ id: 'avocado_tree', name: 'Avocado Tree', icon: '🥑', kind: 'tree', cost: 820, level: 18, max: 10, xp: 16, height: 70, sellable: true, fruit: 'avocado', growTime: 760, desc: 'Gives 2 avocados again and again.' }),
  b({ id: 'pomegranate_tree', name: 'Pomegranate Tree', icon: '@pomegranate', kind: 'tree', cost: 900, level: 19, max: 10, xp: 17, height: 66, sellable: true, fruit: 'pomegranate', growTime: 820, desc: 'Gives 2 pomegranates again and again.' }),
  b({ id: 'orange_tree', name: 'Orange Tree', icon: '🍊', kind: 'tree', cost: 450, level: 11, max: 12, xp: 10, height: 64, sellable: true, fruit: 'orange', growTime: 480, desc: 'Gives 2 oranges again and again.' }),

  b({ id: 'coop', name: 'Chicken Coop', icon: '🐔', kind: 'pen', w: 2, h: 2, cost: 150, level: 2, xp: 10, height: 26, wall: '#e3cf94', roof: '#b5452c', animal: 'chicken', capacity: 6, desc: 'Home for up to 6 chickens.' }),
  b({ id: 'pasture', name: 'Cow Pasture', icon: '🐄', kind: 'pen', w: 3, h: 3, cost: 400, level: 5, xp: 20, height: 26, wall: '#9ccc5a', roof: '#6b4226', animal: 'cow', capacity: 5, desc: 'Home for up to 5 cows.' }),
  b({ id: 'sheepfold', name: 'Sheep Fold', icon: '🐑', kind: 'pen', w: 3, h: 3, cost: 1800, level: 10, xp: 50, height: 26, wall: '#b7d77a', roof: '#2e6da4', animal: 'sheep', capacity: 5, desc: 'Home for up to 5 sheep.' }),

  b({ id: 'duck_pond', name: 'Duck Pond', icon: '🦆', kind: 'pen', w: 3, h: 3, cost: 300, level: 6, xp: 15, height: 26, wall: '#8fc45a', roof: '#2e6da4', animal: 'duck', capacity: 5, desc: 'Home for up to 5 ducks.' }),
  b({ id: 'goat_yard', name: 'Goat Yard', icon: '🐐', kind: 'pen', w: 3, h: 3, cost: 1500, level: 12, xp: 45, height: 26, wall: '#b5a36a', roof: '#7a4b26', animal: 'goat', capacity: 5, desc: 'Home for up to 5 goats.' }),
  b({ id: 'beehive', name: 'Bee Garden', icon: '🐝', kind: 'pen', w: 2, h: 2, cost: 1600, level: 13, xp: 45, height: 26, wall: '#9ccc5a', roof: '#f5b92b', animal: 'bee', capacity: 4, desc: 'Up to 4 hives. Bees love sunflowers.' }),
  b({ id: 'rabbit_hutch', name: 'Rabbit Hutch', icon: '🐇', kind: 'pen', w: 2, h: 2, cost: 900, level: 9, xp: 35, height: 26, wall: '#d9b98a', roof: '#c0392b', animal: 'rabbit', capacity: 5, desc: 'Fluffy rabbits give soft angora fur. They love carrots.' }),
  b({ id: 'alpaca_ranch', name: 'Alpaca Ranch', icon: '🦙', kind: 'pen', w: 3, h: 3, cost: 2200, level: 14, xp: 55, height: 26, wall: '#a8cf6a', roof: '#7d5ba6', animal: 'alpaca', capacity: 5, desc: 'Alpacas grow warm wool. Feed them wheat.' }),
  b({ id: 'goose_pen', name: 'Goose Green', icon: '🪿', kind: 'pen', w: 2, h: 2, cost: 1200, level: 11, xp: 40, height: 26, wall: '#9ccc5a', roof: '#3f7fbf', animal: 'goose', capacity: 5, desc: 'Geese lay big eggs for tarts and cakes. They eat duck feed.' }),
  b({ id: 'turkey_run', name: 'Turkey Run', icon: '🦃', kind: 'pen', w: 2, h: 2, cost: 1100, level: 10, xp: 40, height: 26, wall: '#c9a46a', roof: '#8e4a2b', animal: 'turkey', capacity: 5, desc: 'Turkeys shed fine feathers for quill pens. They eat chicken feed.' }),
  b({ id: 'donkey_paddock', name: 'Donkey Paddock', icon: '🫏', kind: 'pen', w: 3, h: 3, cost: 1900, level: 13, xp: 50, height: 26, wall: '#b8a46c', roof: '#6b4226', animal: 'donkey', capacity: 5, desc: 'Gentle donkeys give milk for soap. They love carrots.' }),
  b({ id: 'buffalo_wallow', name: 'Buffalo Wallow', icon: '🐃', kind: 'pen', w: 3, h: 3, cost: 2600, level: 15, xp: 60, height: 26, wall: '#8a6a44', roof: '#4a6a3a', animal: 'buffalo', capacity: 5, desc: 'Water buffalo give rich milk for mozzarella.' }),
  b({ id: 'peacock_garden', name: 'Peacock Garden', icon: '🦚', kind: 'pen', w: 2, h: 2, cost: 3000, level: 17, xp: 65, height: 26, wall: '#9ccc5a', roof: '#2e7d8a', animal: 'peacock', capacity: 4, desc: 'Peacocks drop dazzling feathers. They eat corn.' }),
  b({ id: 'ostrich_ranch', name: 'Ostrich Ranch', icon: '🦤', kind: 'pen', w: 3, h: 3, cost: 3500, level: 19, xp: 75, height: 26, wall: '#d8c38e', roof: '#b5452c', animal: 'ostrich', capacity: 4, desc: 'Ostriches lay giant eggs. They eat wheat.' }),
  b({ id: 'stable', name: 'Stable', icon: '🐎', kind: 'pen', w: 3, h: 3, cost: 2500, level: 15, xp: 60, height: 26, wall: '#c2a36b', roof: '#8e2c20', animal: 'horse', capacity: 5, desc: 'Up to 5 horses. Each horse adds 5% to order coins.' }),
  b({ id: 'salad_bar', name: 'Salad Bar', icon: '🥙', kind: 'production', w: 2, h: 2, cost: 1300, level: 10, xp: 45, height: 52, wall: '#e9f7dc', roof: '#5aa83a', desc: 'Tosses fresh garden and fruit salads.' }),
  b({ id: 'pizzeria', name: 'Pizzeria', icon: '🍕', kind: 'production', w: 2, h: 2, cost: 2400, level: 12, xp: 60, height: 58, wall: '#f7e1c4', roof: '#c0392b', desc: 'A wood fired oven for pizzas.' }),
  b({ id: 'coffee_kiosk', name: 'Coffee Kiosk', icon: '☕', kind: 'production', w: 2, h: 2, cost: 2800, level: 13, xp: 65, height: 54, wall: '#efe0cf', roof: '#6b4226', desc: 'Brews lemonade, espresso and lattes.' }),
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
