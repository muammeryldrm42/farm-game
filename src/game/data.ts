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
  beach?: boolean; // may stand on the beach round the island
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
item('garlic', 'Garlic', '🧄', 'silo', 16, 6);
item('spinach', 'Spinach', '@spinach', 'silo', 18, 7);
item('beet', 'Beetroot', '@beet', 'silo', 20, 9);
item('pea', 'Peas', '@pea', 'silo', 26, 10);
item('zucchini', 'Zucchini', '@zucchini', 'silo', 30, 13);
item('sweet_potato', 'Sweet Potato', '🍠', 'silo', 36, 15);
item('oat', 'Oats', '@oat', 'silo', 8, 3);
item('barley', 'Barley', '@barley', 'silo', 12, 6);
item('soybean', 'Soybeans', '@soybean', 'silo', 22, 8);
item('tulip', 'Tulip', '🌷', 'silo', 26, 7);
item('rose', 'Rose', '🌹', 'silo', 38, 11);
item('lavender', 'Lavender', '@lavender', 'silo', 34, 12);

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
item('apricot', 'Apricot', '@apricot', 'silo', 32, 9);
item('lime', 'Lime', '@lime', 'silo', 38, 14);
item('fig', 'Fig', '@fig', 'silo', 46, 16);
item('olive', 'Olive', '🫒', 'silo', 42, 17);
item('walnut', 'Walnut', '@walnut', 'silo', 54, 20);

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
item('horseshoe', 'Mare Milk', '🥛', 'barn', 95, 15);
item('goose_egg', 'Goose Egg', '🪺', 'barn', 55, 11);
item('gobbler_feather', 'Gobbler Feather', '@gobbler_feather', 'barn', 45, 10);
item('donkey_milk', 'Donkey Milk', '@donkey_milk', 'barn', 60, 13);
item('buffalo_milk', 'Buffalo Milk', '@buffalo_milk', 'barn', 75, 15);
item('peacock_feather', 'Peacock Feather', '@peacock_feather', 'barn', 95, 17);
item('ostrich_egg', 'Ostrich Egg', '@ostrich_egg', 'barn', 110, 19);
item('quail_egg', 'Quail Eggs', '@quail_egg', 'barn', 40, 9);
item('yak_wool', 'Yak Wool', '@yak_wool', 'barn', 100, 18);
item('camel_milk', 'Camel Milk', '@camel_milk', 'barn', 120, 20);
item('salmon', 'Salmon', '@salmon', 'barn', 70, 10);
item('crab', 'Crab', '🦀', 'barn', 85, 14);
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
// ---- late game: animals, fish and orchard fruit all the way to level 200
item('speckled_egg', 'Speckled Egg', '@speckled_egg', 'barn', 70, 22);
item('pheasant_feather', 'Pheasant Feather', '@pheasant_feather', 'barn', 95, 30);
item('fresh_cream', 'Fresh Cream', '@fresh_cream', 'barn', 120, 38);
item('swan_down', 'Swan Down', '@swan_down', 'barn', 150, 47);
item('emu_egg', 'Emu Egg', '@emu_egg', 'barn', 180, 56);
item('reindeer_milk', 'Reindeer Milk', '@reindeer_milk', 'barn', 220, 68);
item('bison_wool', 'Bison Wool', '@bison_wool', 'barn', 270, 82);
item('pink_feather', 'Pink Feather', '@pink_feather', 'barn', 320, 96);
item('llama_wool', 'Llama Wool', '@llama_wool', 'barn', 390, 118);
item('golden_egg', 'Golden Egg', '@golden_egg', 'barn', 800, 200);
// ---- more farm animals, spread between levels 21 and 182
item('silkie_egg', 'Silkie Egg', '@silkie_egg', 'barn', 116, 21);
item('rosette', 'Pony Milk', '🥛', 'barn', 125, 24);
item('black_wool', 'Black Wool', '@black_wool', 'barn', 130, 26);
item('jersey_milk', 'Jersey Milk', '@jersey_milk', 'barn', 136, 28);
item('muscovy_egg', 'Muscovy Egg', '@muscovy_egg', 'barn', 142, 30);
item('nubian_milk', 'Nubian Goat Milk', '@nubian_milk', 'barn', 151, 33);
item('silk', 'Silk Thread', '@silk', 'barn', 159, 36);
item('mohair', 'Mohair', '@mohair', 'barn', 168, 39);
item('mandarin_feather', 'Mandarin Feather', '@mandarin_feather', 'barn', 180, 43);
item('acorn', 'Acorns', '🌰', 'barn', 188, 46);
item('merino_wool', 'Merino Wool', '@merino_wool', 'barn', 197, 49);
item('parrot_feather', 'Parrot Feather', '@parrot_feather', 'barn', 209, 53);
item('galloway_milk', 'Galloway Milk', '@galloway_milk', 'barn', 223, 58);
item('moose_milk', 'Moose Milk', '@moose_milk', 'barn', 238, 63);
item('cashmere', 'Cashmere', '@cashmere', 'barn', 249, 67);
item('rhea_egg', 'Rhea Egg', '@rhea_egg', 'barn', 261, 71);
item('camel_wool', 'Camel Wool', '@camel_wool', 'barn', 275, 76);
item('timber', 'Timber', '🪵', 'barn', 287, 80);
item('jacob_wool', 'Spotted Wool', '@jacob_wool', 'barn', 304, 86);
item('shed_antler', 'Shed Antler', '@shed_antler', 'barn', 322, 92);
item('crane_feather', 'Crane Feather', '@crane_feather', 'barn', 339, 98);
item('zebu_milk', 'Zebu Milk', '@zebu_milk', 'barn', 357, 104);
item('qiviut', 'Qiviut Wool', '@qiviut', 'barn', 380, 112);
item('black_down', 'Black Swan Down', '@black_down', 'barn', 403, 120);
item('cassowary_egg', 'Cassowary Egg', '@cassowary_egg', 'barn', 426, 128);
item('watusi_milk', 'Watusi Milk', '@watusi_milk', 'barn', 449, 136);
item('chinchilla_fluff', 'Chinchilla Fluff', '@chinchilla_fluff', 'barn', 476, 145);
item('owl_feather', 'Owl Feather', '@owl_feather', 'barn', 504, 155);
item('kiwi_egg', 'Kiwi Egg', '@kiwi_egg', 'barn', 542, 168);
item('vicuna_wool', 'Vicuna Wool', '@vicuna_wool', 'barn', 583, 182);
item('trout', 'Trout', '@trout', 'barn', 90, 22);
item('tuna', 'Tuna', '@tuna', 'barn', 120, 31);
item('shrimp', 'Shrimp', '🦐', 'barn', 140, 40);
item('squid', 'Squid', '🦑', 'barn', 170, 52);
item('octopus', 'Octopus', '🐙', 'barn', 210, 64);
item('swordfish', 'Swordfish', '@swordfish', 'barn', 250, 78);
item('eel', 'Eel', '@eel', 'barn', 290, 92);
item('pufferfish', 'Pufferfish', '🐡', 'barn', 330, 108);
item('stingray', 'Stingray', '@stingray', 'barn', 380, 125);
item('marlin', 'Marlin', '@marlin', 'barn', 440, 145);
item('pearl', 'Pearl Oyster', '@pearl', 'barn', 520, 170);
item('golden_fish', 'Golden Fish', '@golden_fish', 'barn', 700, 195);
item('quince', 'Quince', '@quince', 'silo', 48, 23);
item('almond', 'Almond', '@almond', 'silo', 55, 27);
item('mulberry', 'Mulberry', '@mulberry', 'silo', 62, 34);
item('grapefruit', 'Grapefruit', '@grapefruit', 'silo', 72, 41);
item('persimmon', 'Persimmon', '@persimmon', 'silo', 85, 50);
item('date', 'Dates', '@date', 'silo', 98, 60);
item('lychee', 'Lychee', '@lychee', 'silo', 115, 72);
item('hazelnut', 'Hazelnut', '@hazelnut', 'silo', 130, 84);
item('starfruit', 'Starfruit', '@starfruit', 'silo', 150, 98);
item('maple_syrup', 'Maple Syrup', '@maple_syrup', 'silo', 175, 112);
item('cocoa_pod', 'Cocoa Pod', '@cocoa_pod', 'silo', 205, 132);
item('sakura', 'Cherry Blossom', '@sakura', 'silo', 250, 165);
item('golden_apple', 'Golden Apple', '@golden_apple', 'silo', 330, 195);

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
item('olive_oil', 'Olive Oil', '@olive_oil', 'barn', 190, 17);
item('pesto', 'Pesto', '@pesto', 'barn', 260, 17);
item('apricot_jam', 'Apricot Jam', '@apricot_jam', 'barn', 120, 9);
item('fig_jam', 'Fig Jam', '@fig_jam', 'barn', 170, 16);
item('limeade', 'Limeade', '@limeade', 'barn', 150, 14);
item('walnut_cookie', 'Walnut Cookies', '@walnut_cookie', 'barn', 240, 20);
item('greek_salad', 'Greek Salad', '@greek_salad', 'barn', 250, 17);
item('roast_veggies', 'Roast Vegetables', '@roast_veggies', 'barn', 210, 15);
item('quail_quiche', 'Quail Quiche', '@quail_quiche', 'barn', 180, 9);
item('yak_blanket', 'Yak Blanket', '@yak_blanket', 'barn', 320, 18);
item('camel_cheese', 'Camel Cheese', '@camel_cheese', 'barn', 330, 20);
item('bouquet', 'Bouquet', '💐', 'barn', 160, 11);
item('lavender_sachet', 'Lavender Sachet', '@lavender_sachet', 'barn', 150, 12);
item('flower_crown', 'Flower Crown', '@flower_crown', 'barn', 210, 13);
item('oat_cookie', 'Oat Cookies', '@oat_cookie', 'barn', 90, 4);
item('barley_bread', 'Barley Loaf', '@barley_bread', 'barn', 110, 6);
item('soy_milk', 'Soy Milk', '@soy_milk', 'barn', 95, 8);
item('salmon_roll', 'Salmon Roll', '@salmon_roll', 'barn', 240, 13);
item('crab_cake', 'Crab Cakes', '@crab_cake', 'barn', 260, 14);

// ---- levels 19 to 200: every level brings something new (crops, fruit, dishes, animal goods)
item('rye', 'Rye', '🌾', 'silo', 73, 25);
item('tangerine', 'Tangerine', '🍊', 'silo', 62, 29);
item('cherry_tomato', 'Cherry Tomatoes', '🍅', 'silo', 89, 32);
item('cherry_tomato_pizza', 'Cherry Tomato Pizza', '🍕', 'barn', 432, 35);
item('kale', 'Kale', '🥬', 'silo', 100, 37);
item('nectarine', 'Nectarine', '🍑', 'silo', 76, 42);
item('nectarine_sorbet', 'Nectarine Sorbet', '🍨', 'barn', 293, 44);
item('farm_butter', 'Farm Butter', '🧈', 'barn', 150, 45);
item('peanut', 'Peanuts', '🥜', 'silo', 124, 48);
item('chestnut', 'Chestnut', '🌰', 'silo', 86, 51);
item('cantaloupe', 'Cantaloupe', '🍈', 'silo', 137, 54);
item('cantaloupe_juice', 'Cantaloupe Juice', '🧃', 'barn', 441, 55);
item('basil', 'Basil', '🌿', 'silo', 144, 57);
item('papaya', 'Papaya', '🍈', 'silo', 97, 61);
item('papaya_jam', 'Papaya Jam', '🫙', 'barn', 325, 62);
item('suffolk_wool', 'Suffolk Wool', '🧶', 'barn', 188, 64);
item('marigold', 'Marigold', '🌼', 'silo', 161, 65);
item('kumquat', 'Kumquat', '🍊', 'silo', 103, 66);
item('ginger', 'Ginger', '🫚', 'silo', 172, 70);
item('grilled_ginger', 'Grilled Ginger', '🍢', 'barn', 600, 73);
item('quinoa', 'Quinoa', '🌾', 'silo', 181, 74);
item('guava', 'Guava', '🍐', 'silo', 115, 77);
item('guava_juice', 'Guava Juice', '🧃', 'barn', 377, 78);
item('bronze_feather', 'Bronze Feather', '🪶', 'barn', 218, 79);
item('jalapeno', 'Jalapeno', '🌶️', 'silo', 197, 81);
item('pistachio', 'Pistachio', '🥜', 'silo', 121, 83);
item('green_bean', 'Green Beans', '🫛', 'silo', 210, 87);
item('green_bean_pizza', 'Green Bean Pizza', '🍕', 'barn', 783, 88);
item('mint', 'Mint', '🌿', 'silo', 214, 89);
item('elderberry', 'Elderberry', '🫐', 'silo', 130, 91);
item('elderberry_sorbet', 'Elderberry Sorbet', '🍨', 'barn', 450, 93);
item('saanen_milk', 'Saanen Milk', '🥛', 'barn', 248, 94);
item('cauliflower', 'Cauliflower', '🥦', 'silo', 227, 95);
item('dragon_fruit', 'Dragon Fruit', '🐉', 'silo', 137, 97);
item('chamomile', 'Chamomile', '🌼', 'silo', 238, 100);
item('chamomile_wreath', 'Chamomile Wreath', '💐', 'barn', 766, 101);
item('parsnip', 'Parsnip', '🥕', 'silo', 243, 102);
item('pecan', 'Pecan', '🌰', 'silo', 146, 105);
item('pecan_pie', 'Pecan Pie', '🥧', 'barn', 447, 106);
item('black_egg', 'Black Egg', '🥚', 'barn', 274, 107);
item('honeydew', 'Honeydew', '🍈', 'silo', 256, 108);
item('blood_orange', 'Blood Orange', '🍊', 'silo', 150, 109);
item('leek', 'Leek', '🧅', 'silo', 263, 111);
item('grilled_leek', 'Grilled Leek', '🍢', 'barn', 864, 113);
item('sorghum', 'Sorghum', '🌾', 'silo', 269, 114);
item('jackfruit', 'Jackfruit', '🍈', 'silo', 158, 116);
item('jackfruit_juice', 'Jackfruit Juice', '🧃', 'barn', 502, 117);
item('heron_plume', 'Heron Plume', '🪶', 'barn', 298, 119);
item('chickpea', 'Chickpeas', '🫘', 'silo', 285, 121);
item('macadamia', 'Macadamia', '🥜', 'silo', 164, 122);
item('hibiscus', 'Hibiscus', '🌺', 'silo', 291, 124);
item('hibiscus_wreath', 'Hibiscus Wreath', '💐', 'barn', 919, 125);
item('bok_choy', 'Bok Choy', '🥬', 'silo', 296, 126);
item('yuzu', 'Yuzu', '🍋', 'silo', 172, 129);
item('yuzu_sorbet', 'Yuzu Sorbet', '🍨', 'barn', 571, 130);
item('butternut', 'Butternut Squash', '🎃', 'silo', 307, 131);
item('passion_fruit', 'Passion Fruit', '🟣', 'silo', 176, 133);
item('flax', 'Flax', '🌾', 'silo', 315, 135);
item('flax_linen', 'Flax Linen', '🧵', 'barn', 914, 137);
item('cranberry', 'Cranberries', '🍒', 'silo', 322, 138);
item('cashew', 'Cashew', '🥜', 'silo', 184, 140);
item('cashew_pie', 'Cashew Pie', '🥧', 'barn', 557, 141);
item('shallot', 'Shallots', '🧅', 'silo', 331, 142);
item('white_peach', 'White Peach', '🍑', 'silo', 187, 143);
item('saffron', 'Saffron', '🪻', 'silo', 340, 146);
item('saffron_wreath', 'Saffron Wreath', '💐', 'barn', 1061, 147);
item('lentil', 'Lentils', '🫘', 'silo', 344, 148);
item('loquat', 'Loquat', '🍑', 'silo', 195, 150);
item('loquat_juice', 'Loquat Juice', '🧃', 'barn', 609, 151);
item('romanesco', 'Romanesco', '🥦', 'silo', 353, 152);
item('crabapple', 'Crabapple', '🍎', 'silo', 198, 153);
item('tea', 'Tea Leaves', '🍵', 'silo', 362, 156);
item('green_yogurt', 'Green Yogurt', '🥛', 'barn', 1108, 157);
item('gooseberry', 'Gooseberries', '🫐', 'silo', 366, 158);
item('cinnamon', 'Cinnamon', '🟤', 'silo', 206, 160);
item('cinnamon_tea', 'Cinnamon Tea', '🍵', 'barn', 641, 161);
item('peony', 'Peony', '🌸', 'silo', 375, 162);
item('mangosteen', 'Mangosteen', '🟣', 'silo', 209, 163);
item('turmeric', 'Turmeric', '🫚', 'silo', 379, 164);
item('turmeric_salad', 'Turmeric Salad', '🥗', 'barn', 1116, 166);
item('millet', 'Millet', '🌾', 'silo', 386, 167);
item('durian', 'Durian', '🌰', 'silo', 216, 169);
item('durian_jam', 'Durian Jam', '🫙', 'barn', 670, 170);
item('vanilla', 'Vanilla', '🌿', 'silo', 395, 171);
item('black_cherry', 'Black Cherry', '🍒', 'silo', 219, 172);
item('okra', 'Okra', '🥒', 'silo', 399, 173);
item('grilled_okra', 'Grilled Okra', '🍢', 'barn', 1259, 174);
item('orchid', 'Orchid', '🌸', 'silo', 403, 175);
item('silver_pear', 'Silver Pear', '🍐', 'silo', 224, 176);
item('silver_pear_juice', 'Silver Pear Juice', '🧃', 'barn', 693, 177);
item('hops', 'Hops', '🌿', 'silo', 410, 178);
item('artichoke', 'Artichoke', '🥦', 'silo', 412, 179);
item('artichoke_pizza', 'Artichoke Pizza', '🍕', 'barn', 1369, 180);
item('goji', 'Goji Berries', '🍒', 'silo', 417, 181);
item('goji_sorbet', 'Goji Sorbet', '🍨', 'barn', 1282, 183);
item('dahlia', 'Dahlia', '🌺', 'silo', 423, 184);
item('wasabi', 'Wasabi', '🌿', 'silo', 425, 185);
item('wasabi_salad', 'Wasabi Salad', '🥗', 'barn', 1250, 186);
item('black_bean', 'Black Beans', '🫘', 'silo', 430, 187);
item('black_bean_pie', 'Black Bean Pie', '🥧', 'barn', 1270, 188);
item('lotus', 'Lotus', '🪷', 'silo', 434, 189);
item('aloe', 'Aloe Vera', '🌵', 'silo', 436, 190);
item('aloe_yogurt', 'Aloe Yogurt', '🥛', 'barn', 1322, 191);
item('aloe_tea', 'Aloe Tea', '🍵', 'barn', 1308, 192);
item('lotus_wreath', 'Lotus Wreath', '💐', 'barn', 1334, 193);
item('lotus_bouquet', 'Lotus Bouquet', '💐', 'barn', 1314, 194);
item('black_bean_oil', 'Black Bean Oil', '🫙', 'barn', 1247, 196);
item('black_bean_brittle', 'Black Bean Brittle', '🍬', 'barn', 1334, 197);
item('grilled_wasabi', 'Grilled Wasabi', '🍢', 'barn', 1334, 198);
item('wasabi_pizza', 'Wasabi Pizza', '🍕', 'barn', 1406, 199);

// ---- second wave: one more new thing on every level (fish, crops, fruit, animal goods, dishes)
item('celery', 'Celery', '🥬', 'silo', 7, 1);
item('sardine', 'Sardine', '@sardine', 'barn', 33, 2);
item('damson', 'Damson', '🫐', 'silo', 17, 3);
item('damson_tart', 'Damson Tart', '🥧', 'barn', 72, 5);
item('pekin_down', 'Pekin Down', '🪶', 'barn', 33, 6);
item('turnip', 'Turnip', '🟣', 'silo', 24, 7);
item('turnip_soup', 'Turnip Soup', '🍲', 'barn', 99, 8);
item('anchovy', 'Anchovy', '@anchovy', 'barn', 51, 9);
item('greengage', 'Greengage', '🟢', 'silo', 38, 10);
item('chives', 'Chives', '🌿', 'silo', 38, 12);
item('chives_tea', 'Chives Tea', '🍵', 'barn', 154, 13);
item('carp', 'Carp', '@carp', 'barn', 64, 14);
item('sour_cherry', 'Sour Cherry', '🍒', 'silo', 53, 15);
item('brown_egg', 'Brown Egg', '🥚', 'barn', 55, 16);
item('sour_cherry_juice', 'Sour Cherry Juice', '🧃', 'barn', 197, 17);
item('parsley', 'Parsley', '🌿', 'silo', 54, 18);
item('perch', 'Perch', '@perch', 'barn', 80, 20);
item('nashi', 'Nashi Pear', '🍐', 'silo', 53, 21);
item('nashi_pear_jam', 'Nashi Pear Jam', '🫙', 'barn', 197, 22);
item('arugula', 'Arugula', '🥬', 'silo', 69, 23);
item('lop_fluff', 'Lop Fluff', '🧶', 'barn', 73, 24);
item('arugula_pizza', 'Arugula Pizza', '🍕', 'barn', 374, 25);
item('mackerel', 'Mackerel', '@mackerel', 'barn', 96, 26);
item('medlar', 'Medlar', '🟤', 'silo', 60, 27);
item('buckwheat', 'Buckwheat', '🌾', 'silo', 82, 29);
item('buckwheat_cookies', 'Buckwheat Cookies', '🍪', 'barn', 296, 30);
item('tilapia', 'Tilapia', '@tilapia', 'barn', 109, 31);
item('hawthorn', 'Haw Berry', '🍒', 'silo', 65, 32);
item('daikon', 'Daikon', '🥕', 'silo', 91, 33);
item('daikon_salad', 'Daikon Salad', '🥗', 'barn', 281, 34);
item('pygmy_milk', 'Pygmy Goat Milk', '🥛', 'barn', 99, 36);
item('dill', 'Dill', '🌿', 'silo', 100, 37);
item('catfish', 'Catfish', '@catfish', 'barn', 127, 38);
item('rowan', 'Rowan Berry', '🍒', 'silo', 73, 39);
item('rowan_jam', 'Rowan Jam', '🫙', 'barn', 255, 40);
item('fava_bean', 'Fava Beans', '🫛', 'silo', 111, 42);
item('fava_brittle', 'Fava Brittle', '🍬', 'barn', 409, 43);
item('sea_bream', 'Sea Bream', '@sea_bream', 'barn', 142, 44);
item('sloe', 'Sloe', '🫐', 'silo', 80, 45);
item('brahma_egg', 'Brahma Egg', '🥚', 'barn', 121, 46);
item('sloe_tart', 'Sloe Tart', '🥧', 'barn', 255, 47);
item('poppy', 'Poppy', '🌺', 'silo', 124, 48);
item('sea_bass', 'Sea Bass', '@sea_bass', 'barn', 158, 50);
item('pomelo', 'Pomelo', '🍈', 'silo', 86, 51);
item('pomelo_juice', 'Pomelo Juice', '🧃', 'barn', 293, 52);
item('kohlrabi', 'Kohlrabi', '🥬', 'silo', 135, 53);
item('toulouse_down', 'Toulouse Down', '🪶', 'barn', 139, 54);
item('red_mullet', 'Red Mullet', '@red_mullet', 'barn', 171, 55);
item('citron', 'Citron', '🍋', 'silo', 92, 56);
item('citron_jam', 'Citron Jam', '🫙', 'barn', 310, 57);
item('cilantro', 'Cilantro', '🌿', 'silo', 146, 58);
item('cilantro_dressing', 'Cilantro Dressing', '🫙', 'barn', 423, 60);
item('cod', 'Cod', '@cod', 'barn', 187, 61);
item('bergamot', 'Bergamot', '🍋', 'silo', 98, 62);
item('fennel', 'Fennel', '🥬', 'silo', 157, 63);
item('fennel_soup', 'Fennel Soup', '🍲', 'barn', 484, 64);
item('buttermilk', 'Buttermilk', '🥛', 'barn', 163, 65);
item('blackberry', 'Blackberries', '🫐', 'silo', 166, 67);
item('pike', 'Pike', '@pike', 'barn', 205, 68);
item('jujube', 'Jujube', '🟤', 'silo', 106, 69);
item('jujube_juice', 'Jujube Juice', '🧃', 'barn', 351, 70);
item('spelt', 'Spelt', '🌾', 'silo', 175, 71);
item('spelt_porridge', 'Spelt Porridge', '🥣', 'barn', 536, 73);
item('haddock', 'Haddock', '@haddock', 'barn', 220, 74);
item('feijoa', 'Feijoa', '🟢', 'silo', 112, 75);
item('crest_feather', 'Crest Feather', '🪶', 'barn', 187, 76);
item('rutabaga', 'Rutabaga', '🟡', 'silo', 188, 77);
item('rutabaga_pizza', 'Rutabaga Pizza', '🍕', 'barn', 719, 78);
item('flounder', 'Flounder', '@flounder', 'barn', 233, 79);
item('acerola', 'Acerola', '🍒', 'silo', 118, 80);
item('acerola_tart', 'Acerola Tart', '🥧', 'barn', 365, 82);
item('daffodil', 'Daffodil', '🌼', 'silo', 201, 83);
item('valais_wool', 'Valais Wool', '🧶', 'barn', 205, 84);
item('koi', 'Koi', '@koi', 'barn', 249, 85);
item('carob', 'Carob', '🟤', 'silo', 125, 86);
item('carob_oil', 'Carob Oil', '🫙', 'barn', 362, 87);
item('oregano', 'Oregano', '🌿', 'silo', 212, 88);
item('oregano_tea', 'Oregano Tea', '🍵', 'barn', 658, 90);
item('arctic_char', 'Arctic Char', '@arctic_char', 'barn', 265, 91);
item('hickory', 'Hickory Nut', '🌰', 'silo', 131, 92);
item('brussels_sprout', 'Brussels Sprouts', '🥬', 'silo', 223, 93);
item('runner_egg', 'Runner Egg', '🥚', 'barn', 227, 94);
item('sprout_pizza', 'Sprout Pizza', '🍕', 'barn', 821, 95);
item('grayling', 'Grayling', '@grayling', 'barn', 280, 97);
item('kiwifruit', 'Kiwi Fruit', '🥝', 'silo', 138, 98);
item('mung_bean', 'Mung Beans', '🫘', 'silo', 236, 99);
item('mung_bean_stew', 'Mung Bean Stew', '🍲', 'barn', 699, 100);
item('asparagus', 'Asparagus', '🌿', 'silo', 241, 101);
item('sole', 'Sole', '@sole', 'barn', 293, 102);
item('plantain', 'Plantain', '🍌', 'silo', 143, 103);
item('plantain_juice', 'Plantain Juice', '🧃', 'barn', 458, 105);
item('boer_milk', 'Boer Milk', '🥛', 'barn', 253, 106);
item('iris', 'Iris', '🪻', 'silo', 254, 107);
item('iris_wreath', 'Iris Wreath', '💐', 'barn', 812, 108);
item('yellowtail', 'Yellowtail', '@yellowtail', 'barn', 311, 109);
item('pine_nut', 'Pine Nut', '🌰', 'silo', 151, 110);
item('currant', 'Red Currants', '🍒', 'silo', 265, 112);
item('currant_sorbet', 'Currant Sorbet', '🍨', 'barn', 841, 113);
item('red_snapper', 'Red Snapper', '@red_snapper', 'barn', 324, 114);
item('tamarind', 'Tamarind', '🟤', 'silo', 156, 115);
item('dorper_fleece', 'Dorper Fleece', '🧶', 'barn', 275, 116);
item('tamarind_tart', 'Tamarind Tart', '🥧', 'barn', 476, 117);
item('celeriac', 'Celeriac', '🥔', 'silo', 278, 118);
item('bonito', 'Bonito', '@bonito', 'barn', 340, 120);
item('pawpaw', 'Pawpaw', '🥭', 'silo', 163, 121);
item('pawpaw_juice', 'Pawpaw Juice', '🧃', 'barn', 516, 122);
item('rosemary', 'Rosemary', '🌿', 'silo', 289, 123);
item('creamy_milk', 'Creamy Milk', '🥛', 'barn', 293, 124);
item('rosemary_dressing', 'Rosemary Dressing', '🫙', 'barn', 838, 125);
item('halibut', 'Halibut', '@halibut', 'barn', 356, 126);
item('longan', 'Longan', '🟤', 'silo', 170, 127);
item('tomatillo', 'Tomatillo', '🟢', 'silo', 302, 129);
item('tomatillo_pizza', 'Tomatillo Pizza', '🍕', 'barn', 1050, 130);
item('turbot', 'Turbot', '@turbot', 'barn', 369, 131);
item('rambutan', 'Rambutan', '🔴', 'silo', 175, 132);
item('amaranth', 'Amaranth', '🌾', 'silo', 311, 133);
item('amaranth_cookies', 'Amaranth Cookies', '🍪', 'barn', 960, 134);
item('angora_fiber', 'Angora Fiber', '🧶', 'barn', 319, 136);
item('carnation', 'Carnation', '🌸', 'silo', 320, 137);
item('mahi_mahi', 'Mahi Mahi', '@mahi_mahi', 'barn', 387, 138);
item('sea_buckthorn', 'Sea Buckthorn', '🟠', 'silo', 183, 139);
item('sea_buckthorn_juice', 'Sea Buckthorn Juice', '🧃', 'barn', 574, 140);
item('horseradish', 'Horseradish', '🥕', 'silo', 331, 142);
item('roast_horseradish', 'Roast Horseradish', '🍢', 'barn', 1061, 143);
item('barracuda', 'Barracuda', '@barracuda', 'barn', 402, 144);
item('finger_lime', 'Finger Lime', '🟢', 'silo', 190, 145);
item('white_plume', 'White Plume', '🪶', 'barn', 341, 146);
item('finger_lime_sorbet', 'Finger Lime Sorbet', '🍨', 'barn', 624, 147);
item('lemongrass', 'Lemongrass', '🌿', 'silo', 344, 148);
item('grouper', 'Grouper', '@grouper', 'barn', 418, 150);
item('sapodilla', 'Sapodilla', '🟤', 'silo', 196, 151);
item('sapodilla_tart', 'Sapodilla Tart', '🥧', 'barn', 592, 152);
item('habanero', 'Habanero', '🌶️', 'silo', 355, 153);
item('show_ribbon', 'Appaloosa Milk', '🥛', 'barn', 359, 154);
item('clownfish', 'Clownfish', '@clownfish', 'barn', 431, 155);
item('soursop', 'Soursop', '🟢', 'silo', 202, 156);
item('soursop_juice', 'Soursop Juice', '🧃', 'barn', 629, 157);
item('sesame', 'Sesame', '🌾', 'silo', 366, 158);
item('sesame_cookies', 'Sesame Cookies', '🍪', 'barn', 1119, 160);
item('angelfish', 'Angelfish', '@angelfish', 'barn', 447, 161);
item('jabuticaba', 'Jabuticaba', '🫐', 'silo', 208, 162);
item('lily', 'Lily', '🌷', 'silo', 377, 163);
item('lily_posy', 'Lily Posy', '💐', 'barn', 1093, 164);
item('hauled_timber', 'Hauled Timber', '🪵', 'barn', 383, 165);
item('yam', 'Yam', '🍠', 'silo', 386, 167);
item('parrotfish', 'Parrotfish', '@parrotfish', 'barn', 465, 168);
item('breadfruit', 'Breadfruit', '🟢', 'silo', 216, 169);
item('breadfruit_tart', 'Breadfruit Tart', '🥧', 'barn', 650, 170);
item('sage', 'Sage', '🌿', 'silo', 395, 171);
item('sage_cheese', 'Sage Cheese', '🧀', 'barn', 1204, 173);
item('wahoo', 'Wahoo', '@wahoo', 'barn', 480, 174);
item('cherimoya', 'Cherimoya', '🟢', 'silo', 223, 175);
item('ranch_cream', 'Ranch Cream', '🥛', 'barn', 407, 176);
item('bitter_melon', 'Bitter Melon', '🥒', 'silo', 408, 177);
item('roast_bitter_melon', 'Roast Bitter Melon', '🍢', 'barn', 1285, 178);
item('lionfish', 'Lionfish', '@lionfish', 'barn', 493, 179);
item('mamey', 'Mamey', '🟤', 'silo', 228, 180);
item('mamey_sorbet', 'Mamey Sorbet', '🍨', 'barn', 734, 182);
item('gerbera', 'Gerbera', '🌼', 'silo', 421, 183);
item('draft_rosette', 'Clydesdale Milk', '🥛', 'barn', 425, 184);
item('sturgeon', 'Sturgeon', '@sturgeon', 'barn', 509, 185);
item('salak', 'Snake Fruit', '🟤', 'silo', 235, 186);
item('snake_fruit_tart', 'Snake Fruit Tart', '🥧', 'barn', 705, 187);
item('taro', 'Taro', '🥔', 'silo', 432, 188);
item('taro_salad', 'Taro Salad', '🥗', 'barn', 1270, 190);
item('sunfish', 'Ocean Sunfish', '@sunfish', 'barn', 525, 191);
item('brazil_nut', 'Brazil Nut', '🌰', 'silo', 241, 192);
item('cornflower', 'Cornflower', '🌸', 'silo', 443, 193);
item('elk_antler', 'Elk Antler', '🦌', 'barn', 447, 194);
item('cornflower_bouquet', 'Cornflower Bouquet', '💐', 'barn', 1340, 195);
item('anglerfish', 'Anglerfish', '@anglerfish', 'barn', 540, 197);
item('nutmeg', 'Nutmeg', '🟤', 'silo', 248, 198);
item('cassava', 'Cassava', '🥔', 'silo', 456, 199);
item('cassava_pizza', 'Cassava Pizza', '🍕', 'barn', 1496, 200);

// ---- third wave: every level gets at least four new things (workshops, dishes, animals, fish...)
item('herring', 'Herring', '@herring', 'barn', 88, 23);
item('white_egg', 'White Egg', '🥚', 'barn', 77, 26);
item('swiss_chard', 'Swiss Chard', '🥬', 'silo', 80, 28);
item('clementine', 'Clementine', '🍊', 'silo', 67, 34);
item('sprat', 'Sprat', '@sprat', 'barn', 127, 38);
item('campbell_egg', 'Campbell Egg', '🥚', 'barn', 108, 40);
item('zander', 'Zander', '@zander', 'barn', 137, 42);
item('watercress', 'Watercress', '🌿', 'silo', 117, 45);
item('mirabelle', 'Mirabelle', '🟡', 'silo', 86, 51);
item('dutch_fluff', 'Dutch Fluff', '🧶', 'barn', 137, 53);
item('tench', 'Tench', '@tench', 'barn', 171, 55);
item('radicchio', 'Radicchio', '🥬', 'silo', 146, 58);
item('red_hen_egg', 'Speckled Egg', '🥚', 'barn', 156, 62);
item('roach', 'Roach', '@roach', 'barn', 200, 66);
item('chokecherry', 'Chokecherry', '🍒', 'silo', 105, 68);
item('rainbow_trout', 'Rainbow Trout', '@rainbow_trout', 'barn', 213, 71);
item('golden_milk', 'Golden Milk', '🥛', 'barn', 181, 73);
item('sorrel', 'Sorrel', '🌿', 'silo', 183, 75);
item('hake', 'Hake', '@hake', 'barn', 239, 81);
item('shetland_wool', 'Shetland Wool', '🧶', 'barn', 205, 84);
item('star_apple', 'Star Apple', '🟣', 'silo', 125, 86);
item('pollock', 'Pollock', '@pollock', 'barn', 257, 88);
item('sweet_pea', 'Sweet Pea', '🌸', 'silo', 219, 91);
item('call_duck_down', 'Call Duck Down', '🪶', 'barn', 233, 97);
item('whiting', 'Whiting', '@whiting', 'barn', 291, 101);
item('wax_apple', 'Wax Apple', '🔔', 'silo', 143, 103);
item('endive', 'Endive', '🥬', 'silo', 252, 106);
item('alpine_milk', 'Alpine Milk', '🥛', 'barn', 262, 110);
item('garfish', 'Garfish', '@garfish', 'barn', 324, 114);
item('john_dory', 'John Dory', '@john_dory', 'barn', 330, 116);
item('laced_feather', 'Laced Feather', '🪶', 'barn', 282, 119);
item('zinnia', 'Zinnia', '🌼', 'silo', 285, 121);
item('lucuma', 'Lucuma', '🟢', 'silo', 169, 126);
item('amberjack', 'Amberjack', '@amberjack', 'barn', 361, 128);
item('swiss_cream', 'Alpine Cream', '🥛', 'barn', 308, 131);
item('tarpon', 'Tarpon', '@tarpon', 'barn', 374, 133);
item('sunchoke', 'Sunchoke', '🌻', 'silo', 315, 135);
item('marula', 'Marula', '🟡', 'silo', 185, 141);
item('emden_down', 'Emden Down', '🪶', 'barn', 335, 143);
item('snook', 'Snook', '@snook', 'barn', 410, 147);
item('snapdragon', 'Snapdragon', '🌸', 'silo', 346, 149);
item('karakul_wool', 'Karakul Wool', '🧶', 'barn', 359, 154);
item('cobia', 'Cobia', '@cobia', 'barn', 434, 156);
item('ackee', 'Ackee', '🔴', 'silo', 205, 159);
item('triggerfish', 'Triggerfish', '@triggerfish', 'barn', 447, 161);
item('golden_ribbon', 'Palomino Milk', '🥛', 'barn', 381, 164);
item('salsify', 'Salsify', '🥕', 'silo', 384, 166);
item('butterflyfish', 'Butterflyfish', '@butterflyfish', 'barn', 473, 171);
item('chocolate_egg', 'Chocolate Egg', '🥚', 'barn', 401, 173);
item('black_sapote', 'Black Sapote', '🟢', 'silo', 223, 175);
item('blue_tang', 'Blue Tang', '@blue_tang', 'barn', 491, 178);
item('cosmos', 'Cosmos', '🌸', 'silo', 414, 180);
item('dexter_butter', 'Dexter Butter', '🧈', 'barn', 427, 185);
item('boxfish', 'Boxfish', '@boxfish', 'barn', 514, 187);
item('ugli_fruit', 'Ugli Fruit', '🍊', 'silo', 239, 190);
item('lupin', 'Lupin', '🪻', 'silo', 441, 192);
item('black_plume', 'Friesian Milk', '🥛', 'barn', 453, 197);
item('sailfish', 'Sailfish', '@sailfish', 'barn', 545, 199);
// more catches: fish of the lake and fish of the sea
item('bluegill', 'Bluegill', '@bluegill', 'barn', 45, 4);
item('largemouth_bass', 'Largemouth Bass', '@largemouth_bass', 'barn', 52, 6);
item('crayfish', 'Crayfish', '@crayfish', 'barn', 68, 12);
item('crappie', 'Crappie', '@crappie', 'barn', 78, 17);
item('chub', 'Chub', '@chub', 'barn', 108, 29);
item('whitefish', 'Whitefish', '@whitefish', 'barn', 150, 47);
item('bream', 'Bream', '@bream', 'barn', 178, 58);
item('walleye', 'Walleye', '@walleye', 'barn', 236, 83);
item('muskie', 'Muskie', '@muskie', 'barn', 378, 140);
item('paddlefish', 'Paddlefish', '@paddlefish', 'barn', 488, 182);
item('plaice', 'Plaice', '@plaice', 'barn', 80, 18);
item('bluefish', 'Bluefish', '@bluefish', 'barn', 150, 47);
item('pompano', 'Pompano', '@pompano', 'barn', 190, 64);
item('skate', 'Skate', '@skate', 'barn', 262, 93);
item('moray_eel', 'Moray Eel', '@moray_eel', 'barn', 430, 160);
item('chili_pepper_latte', 'Chili Pepper Latte', '☕', 'barn', 170, 21);
item('chili_pepper_chai', 'Chili Pepper Chai', '☕', 'barn', 147, 25);
item('iced_lemon_tea', 'Iced Lemon Tea', '🧋', 'barn', 136, 25);
item('quince_smoothie', 'Quince Smoothie', '🥤', 'barn', 172, 27);
item('coconut_shake', 'Coconut Shake', '🥛', 'barn', 220, 29);
item('lavender_tea', 'Lavender Tea', '🍵', 'barn', 189, 29);
item('tilapia_nigiri', 'Tilapia Nigiri', '🍣', 'barn', 247, 31);
item('mackerel_ravioli', 'Mackerel Ravioli', '🥟', 'barn', 399, 33);
item('arugula_lasagna', 'Arugula Lasagna', '🍝', 'barn', 340, 34);
item('daikon_pasta', 'Daikon Pasta', '🍝', 'barn', 291, 35);
item('daikon_calzone', 'Daikon Calzone', '🥟', 'barn', 385, 35);
item('tangerine_candy', 'Tangerine Candy', '🍬', 'barn', 268, 37);
item('rowan_gummies', 'Rowan Gummies', '🍬', 'barn', 340, 39);
item('candied_rowan', 'Candied Rowan', '🍭', 'barn', 256, 41);
item('mulberry_gelato', 'Mulberry Gelato', '🍨', 'barn', 254, 41);
item('kale_slaw', 'Kale Slaw', '🥗', 'barn', 304, 42);
item('clementine_nectar', 'Clementine Nectar', '🧃', 'barn', 304, 43);
item('nubian_goat_cheese', 'Nubian Goat Cheese', '🧀', 'barn', 644, 44);
item('dill_herb_cheese', 'Dill Herb Cheese', '🧀', 'barn', 234, 47);
item('watercress_skewers', 'Watercress Skewers', '🍢', 'barn', 304, 48);
item('nectarine_marmalade', 'Nectarine Marmalade', '🫙', 'barn', 265, 49);
item('clementine_yogurt', 'Clementine Yogurt', '🥛', 'barn', 262, 50);
item('persimmon_pie', 'Persimmon Pie', '🥧', 'barn', 354, 50);
item('sea_bass_noodles', 'Sea Bass Noodles', '🍜', 'barn', 536, 52);
item('sea_bream_ramen', 'Sea Bream Ramen', '🍜', 'barn', 430, 54);
item('cantaloupe_muffins', 'Cantaloupe Muffins', '🧁', 'barn', 416, 55);
item('zander_ramen', 'Zander Ramen', '🍜', 'barn', 228, 56);
item('kohlrabi_noodles', 'Kohlrabi Noodles', '🍜', 'barn', 472, 57);
item('basil_herb_cheese', 'Basil Herb Cheese', '🧀', 'barn', 296, 57);
item('smoked_zander', 'Smoked Zander', '🐟', 'barn', 206, 59);
item('smoked_zander_pate', 'Smoked Zander Pate', '🥫', 'barn', 206, 60);
item('smoked_catfish_pate', 'Smoked Catfish Pate', '🥫', 'barn', 286, 61);
item('smoked_cod', 'Smoked Cod', '🐟', 'barn', 534, 61);
item('galloway_cheese', 'Galloway Cheese', '🧀', 'barn', 947, 62);
item('mirabelle_gummies', 'Mirabelle Gummies', '🍬', 'barn', 332, 63);
item('candied_papaya', 'Candied Papaya', '🍭', 'barn', 324, 65);
item('basil_spice_rub', 'Basil Spice Rub', '🧂', 'barn', 436, 67);
item('basil_powder', 'Basil Powder', '🧂', 'barn', 615, 69);
item('dill_spice_rub', 'Dill Spice Rub', '🧂', 'barn', 312, 69);
item('ginger_powder', 'Ginger Powder', '🧂', 'barn', 732, 70);
item('kumquat_candy', 'Kumquat Candy', '🍬', 'barn', 382, 70);
item('ginger_pasta', 'Ginger Pasta', '🍝', 'barn', 518, 72);
item('radicchio_lasagna', 'Radicchio Lasagna', '🍝', 'barn', 343, 72);
item('fennel_ravioli', 'Fennel Ravioli', '🥟', 'barn', 570, 73);
item('ginger_body_mist', 'Ginger Body Mist', '🧴', 'barn', 534, 74);
item('marigold_perfume', 'Marigold Perfume', '🧴', 'barn', 686, 75);
item('poppy_perfume', 'Poppy Perfume', '🧴', 'barn', 531, 77);
item('marigold_body_mist', 'Marigold Body Mist', '🧴', 'barn', 503, 77);
item('feijoa_smoothie', 'Feijoa Smoothie', '🥤', 'barn', 352, 78);
item('guava_shake', 'Guava Shake', '🥛', 'barn', 402, 80);
item('ginger_tea', 'Ginger Tea', '🍵', 'barn', 576, 81);
item('iced_sorrel_tea', 'Iced Sorrel Tea', '🧋', 'barn', 248, 82);
item('marigold_soap', 'Marigold Soap', '🧼', 'barn', 517, 83);
item('golden_milk_soap', 'Golden Milk Soap', '🧼', 'barn', 290, 85);
item('daffodil_soap', 'Daffodil Soap', '🧼', 'barn', 629, 85);
item('reindeer_milk_soap', 'Reindeer Milk Soap', '🧼', 'barn', 710, 87);
item('ginger_chai', 'Ginger Chai', '☕', 'barn', 321, 87);
item('hazelnut_latte', 'Hazelnut Latte', '☕', 'barn', 284, 88);
item('pollock_nigiri', 'Pollock Nigiri', '🍣', 'barn', 192, 89);
item('green_bean_calzone', 'Green Bean Calzone', '🥟', 'barn', 718, 89);
item('pistachio_gelato', 'Pistachio Gelato', '🍨', 'barn', 419, 90);
item('green_bean_slaw', 'Green Bean Slaw', '🥗', 'barn', 612, 90);
item('elderberry_nectar', 'Elderberry Nectar', '🧃', 'barn', 556, 91);
item('oregano_candle', 'Oregano Candle', '🕯️', 'barn', 772, 93);
item('mint_candle', 'Mint Candle', '🕯️', 'barn', 777, 95);
item('acerola_marmalade', 'Acerola Marmalade', '🫙', 'barn', 382, 96);
item('pollock_skewers', 'Pollock Skewers', '🍢', 'barn', 304, 97);
item('elderberry_yogurt', 'Elderberry Yogurt', '🥛', 'barn', 430, 99);
item('dragon_fruit_muffins', 'Dragon Fruit Muffins', '🧁', 'barn', 416, 99);
item('kiwi_fruit_pie', 'Kiwi Fruit Pie', '🥧', 'barn', 503, 100);
item('kiwi_fruit_candle', 'Kiwi Fruit Candle', '🕯️', 'barn', 564, 100);
item('saanen_milk_soap', 'Saanen Milk Soap', '🧼', 'barn', 788, 101);
item('chamomile_soap', 'Chamomile Soap', '🧼', 'barn', 732, 102);
item('chamomile_body_mist', 'Chamomile Body Mist', '🧴', 'barn', 718, 102);
item('chamomile_perfume', 'Chamomile Perfume', '🧴', 'barn', 1010, 103);
item('oregano_powder', 'Oregano Powder', '🧂', 'barn', 900, 104);
item('jalapeno_spice_rub', 'Jalapeno Spice Rub', '🧂', 'barn', 584, 105);
item('smoked_sole', 'Smoked Sole', '🐟', 'barn', 830, 105);
item('smoked_sole_pate', 'Smoked Sole Pate', '🥫', 'barn', 518, 107);
item('yellowtail_noodles', 'Yellowtail Noodles', '🍜', 'barn', 965, 109);
item('whiting_ramen', 'Whiting Ramen', '🍜', 'barn', 228, 109);
item('saanen_cheese', 'Saanen Cheese', '🧀', 'barn', 1052, 110);
item('chamomile_herb_cheese', 'Chamomile Herb Cheese', '🧀', 'barn', 427, 111);
item('pecan_candy', 'Pecan Candy', '🍬', 'barn', 503, 111);
item('candied_honeydew', 'Candied Honeydew', '🍭', 'barn', 769, 113);
item('kiwi_fruit_gummies', 'Kiwi Fruit Gummies', '🍬', 'barn', 522, 113);
item('leek_ravioli', 'Leek Ravioli', '🥟', 'barn', 867, 114);
item('leek_lasagna', 'Leek Lasagna', '🍝', 'barn', 884, 115);
item('endive_pasta', 'Endive Pasta', '🍝', 'barn', 233, 115);
item('currant_smoothie', 'Currant Smoothie', '🥤', 'barn', 780, 117);
item('jackfruit_shake', 'Jackfruit Shake', '🥛', 'barn', 522, 117);
item('chamomile_tea', 'Chamomile Tea', '🍵', 'barn', 760, 118);
item('chamomile_chai', 'Chamomile Chai', '☕', 'barn', 413, 120);
item('iced_kiwi_fruit_tea', 'Iced Kiwi Fruit Tea', '🧋', 'barn', 438, 121);
item('macadamia_latte', 'Macadamia Latte', '☕', 'barn', 332, 122);
item('red_snapper_nigiri', 'Red Snapper Nigiri', '🍣', 'barn', 548, 122);
item('endive_calzone', 'Endive Calzone', '🥟', 'barn', 326, 123);
item('macadamia_gelato', 'Macadamia Gelato', '🍨', 'barn', 539, 124);
item('celeriac_slaw', 'Celeriac Slaw', '🥗', 'barn', 802, 125);
item('lucuma_nectar', 'Lucuma Nectar', '🧃', 'barn', 304, 126);
item('halibut_skewers', 'Halibut Skewers', '🍢', 'barn', 1105, 127);
item('longan_marmalade', 'Longan Marmalade', '🫙', 'barn', 528, 127);
item('pawpaw_yogurt', 'Pawpaw Yogurt', '🥛', 'barn', 522, 129);
item('pawpaw_pie', 'Pawpaw Pie', '🥧', 'barn', 573, 129);
item('longan_muffins', 'Longan Muffins', '🧁', 'barn', 508, 130);
item('rosemary_candle', 'Rosemary Candle', '🕯️', 'barn', 987, 130);
item('hibiscus_soap', 'Hibiscus Soap', '🧼', 'barn', 881, 131);
item('creamy_milk_soap', 'Creamy Milk Soap', '🧼', 'barn', 914, 132);
item('hibiscus_perfume', 'Hibiscus Perfume', '🧴', 'barn', 1232, 132);
item('hibiscus_body_mist', 'Hibiscus Body Mist', '🧴', 'barn', 867, 133);
item('passion_fruit_bonbon', 'Passion Fruit Bonbon', '🍬', 'barn', 508, 134);
item('yuzu_chocolate', 'Yuzu Chocolate', '🍫', 'barn', 744, 135);
item('macadamia_truffle', 'Macadamia Truffle', '🍫', 'barn', 520, 137);
item('lucuma_bonbon', 'Lucuma Bonbon', '🍬', 'barn', 360, 137);
item('kiwi_fruit_truffle', 'Kiwi Fruit Truffle', '🍫', 'barn', 483, 138);
item('cranberry_chocolate', 'Cranberry Chocolate', '🍫', 'barn', 1164, 138);
item('sea_buckthorn_chocolate', 'Sea Buckthorn Chocolate', '🍫', 'barn', 774, 139);
item('sea_buckthorn_bonbon', 'Sea Buckthorn Bonbon', '🍬', 'barn', 518, 140);
item('cashew_truffle', 'Cashew Truffle', '🍫', 'barn', 548, 140);
item('pine_nut_truffle', 'Pine Nut Truffle', '🍫', 'barn', 501, 141);
item('marula_bonbon', 'Marula Bonbon', '🍬', 'barn', 360, 142);
item('marula_chocolate', 'Marula Chocolate', '🍫', 'barn', 458, 142);
item('horseradish_spice_rub', 'Horseradish Spice Rub', '🧂', 'barn', 959, 143);
item('horseradish_powder', 'Horseradish Powder', '🧂', 'barn', 1400, 144);
item('smoked_mahi_mahi_pate', 'Smoked Mahi Mahi Pate', '🥫', 'barn', 650, 144);
item('smoked_amberjack', 'Smoked Amberjack', '🐟', 'barn', 206, 146);
item('turbot_noodles', 'Turbot Noodles', '🍜', 'barn', 1127, 147);
item('snook_ramen', 'Snook Ramen', '🍜', 'barn', 228, 148);
item('hibiscus_herb_cheese', 'Hibiscus Herb Cheese', '🧀', 'barn', 501, 148);
item('watusi_cheese', 'Watusi Cheese', '🧀', 'barn', 1896, 149);
item('loquat_gummies', 'Loquat Gummies', '🍬', 'barn', 682, 150);
item('white_peach_candy', 'White Peach Candy', '🍬', 'barn', 618, 150);
item('candied_cranberry', 'Candied Cranberry', '🍭', 'barn', 954, 151);
item('tomatillo_ravioli', 'Tomatillo Ravioli', '🥟', 'barn', 976, 151);
item('romanesco_pasta', 'Romanesco Pasta', '🍝', 'barn', 1025, 152);
item('romanesco_lasagna', 'Romanesco Lasagna', '🍝', 'barn', 1136, 153);
item('loquat_smoothie', 'Loquat Smoothie', '🥤', 'barn', 584, 153);
item('marula_shake', 'Marula Shake', '🥛', 'barn', 276, 155);
item('iced_saffron_tea', 'Iced Saffron Tea', '🧋', 'barn', 1004, 156);
item('green_tea', 'Green Tea', '🍵', 'barn', 1108, 157);
item('green_chai', 'Green Chai', '☕', 'barn', 587, 157);
item('habanero_latte', 'Habanero Latte', '☕', 'barn', 599, 158);
item('mahi_mahi_nigiri', 'Mahi Mahi Nigiri', '🍣', 'barn', 636, 158);
item('romanesco_calzone', 'Romanesco Calzone', '🥟', 'barn', 1119, 159);
item('loquat_gelato', 'Loquat Gelato', '🍨', 'barn', 626, 160);
item('romanesco_slaw', 'Romanesco Slaw', '🥗', 'barn', 1012, 160);
item('soursop_nectar', 'Soursop Nectar', '🧃', 'barn', 858, 161);
item('romanesco_skewers', 'Romanesco Skewers', '🍢', 'barn', 1096, 162);
item('gooseberry_marmalade', 'Gooseberry Marmalade', '🫙', 'barn', 1077, 162);
item('mangosteen_yogurt', 'Mangosteen Yogurt', '🥛', 'barn', 651, 163);
item('loquat_pie', 'Loquat Pie', '🥧', 'barn', 662, 163);
item('mangosteen_muffins', 'Mangosteen Muffins', '🧁', 'barn', 618, 164);
item('soursop_chocolate', 'Soursop Chocolate', '🍫', 'barn', 828, 165);
item('pecan_truffle', 'Pecan Truffle', '🍫', 'barn', 494, 166);
item('soursop_bonbon', 'Soursop Bonbon', '🍬', 'barn', 545, 167);
item('lily_candle', 'Lily Candle', '🕯️', 'barn', 1234, 167);
item('watusi_milk_soap', 'Watusi Milk Soap', '🧼', 'barn', 1351, 169);
item('green_soap', 'Green Soap', '🧼', 'barn', 1080, 169);
item('lily_body_mist', 'Lily Body Mist', '🧴', 'barn', 1108, 170);
item('peony_perfume', 'Peony Perfume', '🧴', 'barn', 1585, 171);
item('sage_powder', 'Sage Powder', '🧂', 'barn', 1669, 172);
item('sesame_spice_rub', 'Sesame Spice Rub', '🧂', 'barn', 1057, 172);
item('smoked_cobia_pate', 'Smoked Cobia Pate', '🥫', 'barn', 206, 173);
item('smoked_cobia', 'Smoked Cobia', '🐟', 'barn', 206, 174);
item('cobia_ramen', 'Cobia Ramen', '🍜', 'barn', 228, 174);
item('salsify_noodles', 'Salsify Noodles', '🍜', 'barn', 290, 175);
item('creamy_cheese', 'Creamy Cheese', '🧀', 'barn', 1241, 176);
item('sage_herb_cheese', 'Sage Herb Cheese', '🧀', 'barn', 647, 177);
item('candied_cherimoya', 'Candied Cherimoya', '🍭', 'barn', 676, 177);
item('cherimoya_candy', 'Cherimoya Candy', '🍬', 'barn', 718, 178);
item('cherimoya_gummies', 'Cherimoya Gummies', '🍬', 'barn', 760, 179);
item('okra_ravioli', 'Okra Ravioli', '🥟', 'barn', 1248, 179);
item('bitter_melon_lasagna', 'Bitter Melon Lasagna', '🍝', 'barn', 1290, 180);
item('sage_pasta', 'Sage Pasta', '🍝', 'barn', 1143, 181);
item('black_sapote_shake', 'Black Sapote Shake', '🥛', 'barn', 276, 181);
item('cherimoya_smoothie', 'Cherimoya Smoothie', '🥤', 'barn', 662, 182);
item('sesame_chai', 'Sesame Chai', '☕', 'barn', 592, 183);
item('hops_tea', 'Hops Tea', '🍵', 'barn', 1242, 184);
item('iced_vanilla_tea', 'Iced Vanilla Tea', '🧋', 'barn', 1158, 185);
item('sturgeon_nigiri', 'Sturgeon Nigiri', '🍣', 'barn', 807, 186);
item('turmeric_latte', 'Turmeric Latte', '☕', 'barn', 633, 186);
item('artichoke_calzone', 'Artichoke Calzone', '🥟', 'barn', 1284, 187);
item('black_sapote_gelato', 'Black Sapote Gelato', '🍨', 'barn', 276, 188);
item('taro_slaw', 'Taro Slaw', '🥗', 'barn', 1234, 188);
item('goji_nectar', 'Goji Nectar', '🧃', 'barn', 1761, 189);
item('taro_skewers', 'Taro Skewers', '🍢', 'barn', 1318, 189);
item('ugli_fruit_marmalade', 'Ugli Fruit Marmalade', '🫙', 'barn', 248, 190);
item('ugli_fruit_yogurt', 'Ugli Fruit Yogurt', '🥛', 'barn', 262, 191);
item('ugli_fruit_pie', 'Ugli Fruit Pie', '🥧', 'barn', 312, 191);
item('brazil_nut_muffins', 'Brazil Nut Muffins', '🧁', 'barn', 707, 192);
item('goji_bonbon', 'Goji Bonbon', '🍬', 'barn', 846, 193);
item('brazil_nut_truffle', 'Brazil Nut Truffle', '🍫', 'barn', 627, 193);
item('brazil_nut_chocolate', 'Brazil Nut Chocolate', '🍫', 'barn', 937, 194);
item('lotus_candle', 'Lotus Candle', '🕯️', 'barn', 1393, 196);
item('aloe_soap', 'Aloe Soap', '🧼', 'barn', 1287, 196);
item('zebu_milk_soap', 'Zebu Milk Soap', '🧼', 'barn', 1094, 197);
item('cornflower_body_mist', 'Cornflower Body Mist', '🧴', 'barn', 1292, 198);
item('lotus_perfume', 'Lotus Perfume', '🧴', 'barn', 1833, 198);
item('nutmeg_spice_rub', 'Nutmeg Spice Rub', '🧂', 'barn', 727, 199);
item('wasabi_powder', 'Wasabi Powder', '🧂', 'barn', 1795, 200);
// fill ins for the levels that lost a decoration
item('honey_cake', 'Honey Cake', '🍰', 'barn', 420, 69);
item('fruit_basket', 'Fruit Basket', '🧺', 'barn', 900, 172);
item('butter_cookies', 'Butter Cookies', '🍪', 'barn', 820, 181);

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
  { id: 'garlic', time: 100, xp: 3, seedCost: 5, level: 6, shape: 'bulb', leaf: '#7ab85a', fruit: '#f2ede2' },
  { id: 'spinach', time: 110, xp: 3, seedCost: 5, level: 7, shape: 'leafy', leaf: '#3f8a2e', fruit: '#4f9a36' },
  { id: 'beet', time: 240, xp: 5, seedCost: 9, level: 9, shape: 'bulb', leaf: '#4f8a3a', fruit: '#7a1238' },
  { id: 'pea', time: 300, xp: 6, seedCost: 11, level: 10, shape: 'trellis', leaf: '#6ab84a', fruit: '#7ac850' },
  { id: 'zucchini', time: 380, xp: 7, seedCost: 13, level: 13, shape: 'vine', leaf: '#4f9a3a', fruit: '#2f6a24' },
  { id: 'sweet_potato', time: 500, xp: 9, seedCost: 16, level: 15, shape: 'root', leaf: '#5a9a3a', fruit: '#c0603a' },
  { id: 'oat', time: 30, xp: 1, seedCost: 2, level: 3, shape: 'grain', leaf: '#8cbf4a', fruit: '#e6d9a0' },
  { id: 'barley', time: 150, xp: 4, seedCost: 6, level: 6, shape: 'grain', leaf: '#86b848', fruit: '#e0c870' },
  { id: 'tulip', time: 160, xp: 4, seedCost: 7, level: 7, shape: 'flower', leaf: '#5aa83a', fruit: '#e8305a' },
  { id: 'soybean', time: 260, xp: 6, seedCost: 10, level: 8, shape: 'bush', leaf: '#5a9a3a', fruit: '#9ab85a' },
  { id: 'rose', time: 400, xp: 8, seedCost: 14, level: 11, shape: 'flower', leaf: '#3f7f32', fruit: '#c8102e' },
  { id: 'lavender', time: 460, xp: 9, seedCost: 15, level: 12, shape: 'flower', leaf: '#7a9a6a', fruit: '#8a6ad0' },
  { id: 'coffee_bean', time: 1020, xp: 16, seedCost: 28, level: 17, shape: 'bush', leaf: '#2f6f35', fruit: '#b0282a' },
  // late game crops, one after another up to level 200
  { id: 'rye', time: 1178, xp: 21, seedCost: 38, level: 25, shape: 'grain', leaf: '#8ab848', fruit: '#d8b860' },
  { id: 'cherry_tomato', time: 1276, xp: 25, seedCost: 47, level: 32, shape: 'bush', leaf: '#3f8f37', fruit: '#e8302e' },
  { id: 'kale', time: 1346, xp: 28, seedCost: 53, level: 37, shape: 'leafy', leaf: '#2f6f3a', fruit: '#3a7a44' },
  { id: 'peanut', time: 1500, xp: 35, seedCost: 66, level: 48, shape: 'bush', leaf: '#5a9a3a', fruit: '#c89a5a' },
  { id: 'cantaloupe', time: 1584, xp: 39, seedCost: 73, level: 54, shape: 'vine', leaf: '#4d9a3c', fruit: '#e8b060' },
  { id: 'basil', time: 1626, xp: 40, seedCost: 77, level: 57, shape: 'leafy', leaf: '#3a9a3a', fruit: '#4aaa44' },
  { id: 'marigold', time: 1738, xp: 45, seedCost: 86, level: 65, shape: 'flower', leaf: '#4f9e36', fruit: '#f5a01a' },
  { id: 'ginger', time: 1808, xp: 48, seedCost: 92, level: 70, shape: 'root', leaf: '#5a9a3a', fruit: '#d8b070' },
  { id: 'quinoa', time: 1864, xp: 51, seedCost: 97, level: 74, shape: 'grain', leaf: '#7aa844', fruit: '#c8603a' },
  { id: 'jalapeno', time: 1962, xp: 55, seedCost: 106, level: 81, shape: 'bush', leaf: '#3f8f37', fruit: '#2f8a2a' },
  { id: 'green_bean', time: 2046, xp: 58, seedCost: 113, level: 87, shape: 'trellis', leaf: '#5aa83a', fruit: '#5ab83a' },
  { id: 'mint', time: 2074, xp: 60, seedCost: 115, level: 89, shape: 'leafy', leaf: '#3fa84a', fruit: '#5ac05a' },
  { id: 'cauliflower', time: 2158, xp: 63, seedCost: 122, level: 95, shape: 'head', leaf: '#6a9a5a', fruit: '#f4f0e0' },
  { id: 'chamomile', time: 2228, xp: 66, seedCost: 128, level: 100, shape: 'flower', leaf: '#6aa84a', fruit: '#ffffff' },
  { id: 'parsnip', time: 2256, xp: 67, seedCost: 131, level: 102, shape: 'root', leaf: '#5a9a3a', fruit: '#f0e0b0' },
  { id: 'honeydew', time: 2340, xp: 71, seedCost: 138, level: 108, shape: 'vine', leaf: '#4d9a3c', fruit: '#c8e090' },
  { id: 'leek', time: 2382, xp: 73, seedCost: 142, level: 111, shape: 'bulb', leaf: '#5a9a4a', fruit: '#e8f0d0' },
  { id: 'sorghum', time: 2424, xp: 75, seedCost: 145, level: 114, shape: 'grain', leaf: '#8a9a44', fruit: '#a83a2a' },
  { id: 'chickpea', time: 2522, xp: 79, seedCost: 154, level: 121, shape: 'bush', leaf: '#6aa84a', fruit: '#e0c890' },
  { id: 'hibiscus', time: 2564, xp: 81, seedCost: 157, level: 124, shape: 'flower', leaf: '#3f8a3a', fruit: '#e8304a' },
  { id: 'bok_choy', time: 2592, xp: 82, seedCost: 160, level: 126, shape: 'leafy', leaf: '#6ab84a', fruit: '#e8f4d8' },
  { id: 'butternut', time: 2662, xp: 85, seedCost: 166, level: 131, shape: 'vine', leaf: '#4d9a3c', fruit: '#e8a850' },
  { id: 'flax', time: 2718, xp: 87, seedCost: 170, level: 135, shape: 'grain', leaf: '#6a9a5a', fruit: '#6a8ad8' },
  { id: 'cranberry', time: 2760, xp: 89, seedCost: 174, level: 138, shape: 'bush', leaf: '#3a7a3a', fruit: '#b0102a' },
  { id: 'shallot', time: 2816, xp: 91, seedCost: 179, level: 142, shape: 'bulb', leaf: '#6cb84a', fruit: '#b85a6a' },
  { id: 'saffron', time: 2872, xp: 94, seedCost: 184, level: 146, shape: 'flower', leaf: '#6a9a4a', fruit: '#8a5ad8' },
  { id: 'lentil', time: 2900, xp: 95, seedCost: 186, level: 148, shape: 'bush', leaf: '#6aa84a', fruit: '#c8702a' },
  { id: 'romanesco', time: 2956, xp: 97, seedCost: 191, level: 152, shape: 'head', leaf: '#5a8a4a', fruit: '#9ad05a' },
  { id: 'tea', time: 3012, xp: 100, seedCost: 196, level: 156, shape: 'bush', leaf: '#2f7a35', fruit: '#4a9a3a' },
  { id: 'gooseberry', time: 3040, xp: 101, seedCost: 198, level: 158, shape: 'bush', leaf: '#3f8a3a', fruit: '#9ad06a' },
  { id: 'peony', time: 3096, xp: 103, seedCost: 203, level: 162, shape: 'flower', leaf: '#3f8a3a', fruit: '#f080a8' },
  { id: 'turmeric', time: 3124, xp: 105, seedCost: 205, level: 164, shape: 'root', leaf: '#5a9a3a', fruit: '#f0a020' },
  { id: 'millet', time: 3166, xp: 106, seedCost: 209, level: 167, shape: 'grain', leaf: '#8ab848', fruit: '#e8d890' },
  { id: 'vanilla', time: 3222, xp: 109, seedCost: 214, level: 171, shape: 'trellis', leaf: '#3a8a3a', fruit: '#f0e6c0' },
  { id: 'okra', time: 3250, xp: 110, seedCost: 216, level: 173, shape: 'bush', leaf: '#4a9a3a', fruit: '#6ac04a' },
  { id: 'orchid', time: 3278, xp: 111, seedCost: 218, level: 175, shape: 'flower', leaf: '#3a8a3a', fruit: '#c870d8' },
  { id: 'hops', time: 3320, xp: 113, seedCost: 222, level: 178, shape: 'trellis', leaf: '#5aa83a', fruit: '#b8d870' },
  { id: 'artichoke', time: 3334, xp: 114, seedCost: 223, level: 179, shape: 'head', leaf: '#6a9a7a', fruit: '#6a9a6a' },
  { id: 'goji', time: 3362, xp: 115, seedCost: 226, level: 181, shape: 'bush', leaf: '#4a8a3a', fruit: '#e0401a' },
  { id: 'dahlia', time: 3404, xp: 117, seedCost: 229, level: 184, shape: 'flower', leaf: '#3f8a3a', fruit: '#d8304a' },
  { id: 'wasabi', time: 3418, xp: 117, seedCost: 230, level: 185, shape: 'root', leaf: '#4a9a3a', fruit: '#9ad08a' },
  { id: 'black_bean', time: 3446, xp: 118, seedCost: 233, level: 187, shape: 'bush', leaf: '#4a8a3a', fruit: '#2a2a30' },
  { id: 'lotus', time: 3474, xp: 120, seedCost: 235, level: 189, shape: 'flower', leaf: '#4a9a4a', fruit: '#f8a0c0' },
  { id: 'aloe', time: 3488, xp: 120, seedCost: 236, level: 190, shape: 'rosette', leaf: '#6a9a6a', fruit: '#8ac080' },
  // second wave
  { id: 'celery', time: 60, xp: 1, seedCost: 2, level: 1, shape: 'leafy', leaf: '#6ab84a', fruit: '#b8e08a' },
  { id: 'turnip', time: 420, xp: 7, seedCost: 11, level: 7, shape: 'root', leaf: '#5aa83a', fruit: '#e8d8f0' },
  { id: 'chives', time: 720, xp: 11, seedCost: 19, level: 12, shape: 'leafy', leaf: '#3a9a3a', fruit: '#b888e0' },
  { id: 'parsley', time: 1080, xp: 17, seedCost: 29, level: 18, shape: 'leafy', leaf: '#2f8a2f', fruit: '#3fa83f' },
  { id: 'arugula', time: 1150, xp: 20, seedCost: 36, level: 23, shape: 'leafy', leaf: '#3a8a3a', fruit: '#4a9a3a' },
  { id: 'buckwheat', time: 1234, xp: 24, seedCost: 43, level: 29, shape: 'grain', leaf: '#6a9a3a', fruit: '#f4e8f0' },
  { id: 'daikon', time: 1290, xp: 26, seedCost: 48, level: 33, shape: 'root', leaf: '#5aa83a', fruit: '#f4f4ee' },
  { id: 'dill', time: 1346, xp: 28, seedCost: 53, level: 37, shape: 'leafy', leaf: '#6aa84a', fruit: '#e8d040' },
  { id: 'fava_bean', time: 1416, xp: 31, seedCost: 59, level: 42, shape: 'bush', leaf: '#5a9a4a', fruit: '#8ac060' },
  { id: 'poppy', time: 1500, xp: 35, seedCost: 66, level: 48, shape: 'flower', leaf: '#6a9a4a', fruit: '#e8281a' },
  { id: 'kohlrabi', time: 1570, xp: 38, seedCost: 72, level: 53, shape: 'root', leaf: '#6a9a6a', fruit: '#b8e0a0' },
  { id: 'cilantro', time: 1640, xp: 41, seedCost: 78, level: 58, shape: 'leafy', leaf: '#4aa84a', fruit: '#5ab85a' },
  { id: 'fennel', time: 1710, xp: 44, seedCost: 84, level: 63, shape: 'leafy', leaf: '#7ab85a', fruit: '#e8f0d0' },
  { id: 'blackberry', time: 1766, xp: 46, seedCost: 89, level: 67, shape: 'bush', leaf: '#3a7a3a', fruit: '#2a1a3a' },
  { id: 'spelt', time: 1822, xp: 49, seedCost: 94, level: 71, shape: 'grain', leaf: '#8ab848', fruit: '#d8b068' },
  { id: 'rutabaga', time: 1906, xp: 52, seedCost: 101, level: 77, shape: 'root', leaf: '#5a9a4a', fruit: '#e8c880' },
  { id: 'daffodil', time: 1990, xp: 56, seedCost: 108, level: 83, shape: 'flower', leaf: '#5a9a3a', fruit: '#f8d820' },
  { id: 'oregano', time: 2060, xp: 59, seedCost: 114, level: 88, shape: 'leafy', leaf: '#4a8a3a', fruit: '#6a9a4a' },
  { id: 'brussels_sprout', time: 2130, xp: 62, seedCost: 120, level: 93, shape: 'bush', leaf: '#5a8a4a', fruit: '#8ac060' },
  { id: 'mung_bean', time: 2214, xp: 66, seedCost: 127, level: 99, shape: 'bush', leaf: '#5aa83a', fruit: '#4a8a3a' },
  { id: 'asparagus', time: 2242, xp: 67, seedCost: 130, level: 101, shape: 'leafy', leaf: '#6aa84a', fruit: '#7ab85a' },
  { id: 'iris', time: 2326, xp: 70, seedCost: 137, level: 107, shape: 'flower', leaf: '#4a8a5a', fruit: '#6a4ad8' },
  { id: 'currant', time: 2396, xp: 73, seedCost: 143, level: 112, shape: 'bush', leaf: '#4a8a3a', fruit: '#d81a2a' },
  { id: 'celeriac', time: 2480, xp: 77, seedCost: 150, level: 118, shape: 'root', leaf: '#5aa83a', fruit: '#e8dcc0' },
  { id: 'rosemary', time: 2550, xp: 80, seedCost: 156, level: 123, shape: 'leafy', leaf: '#4a7a5a', fruit: '#5a8a6a' },
  { id: 'tomatillo', time: 2634, xp: 84, seedCost: 163, level: 129, shape: 'bush', leaf: '#4a8a3a', fruit: '#a8d060' },
  { id: 'amaranth', time: 2690, xp: 86, seedCost: 168, level: 133, shape: 'grain', leaf: '#6a8a3a', fruit: '#b8203a' },
  { id: 'carnation', time: 2746, xp: 88, seedCost: 173, level: 137, shape: 'flower', leaf: '#6a9a8a', fruit: '#e84a7a' },
  { id: 'horseradish', time: 2816, xp: 91, seedCost: 179, level: 142, shape: 'root', leaf: '#4a9a3a', fruit: '#e8e0c8' },
  { id: 'lemongrass', time: 2900, xp: 95, seedCost: 186, level: 148, shape: 'leafy', leaf: '#7ab84a', fruit: '#c8e080' },
  { id: 'habanero', time: 2970, xp: 98, seedCost: 192, level: 153, shape: 'bush', leaf: '#3f8f37', fruit: '#f07a10' },
  { id: 'sesame', time: 3040, xp: 101, seedCost: 198, level: 158, shape: 'grain', leaf: '#5a9a3a', fruit: '#f0e6d0' },
  { id: 'lily', time: 3110, xp: 104, seedCost: 204, level: 163, shape: 'flower', leaf: '#4a8a3a', fruit: '#f8f4f0' },
  { id: 'yam', time: 3166, xp: 106, seedCost: 209, level: 167, shape: 'root', leaf: '#4a8a3a', fruit: '#8a5a3a' },
  { id: 'sage', time: 3222, xp: 109, seedCost: 214, level: 171, shape: 'leafy', leaf: '#7a9a7a', fruit: '#8aa88a' },
  { id: 'bitter_melon', time: 3306, xp: 112, seedCost: 221, level: 177, shape: 'vine', leaf: '#4a9a3a', fruit: '#7ab84a' },
  { id: 'gerbera', time: 3390, xp: 116, seedCost: 228, level: 183, shape: 'flower', leaf: '#4a8a3a', fruit: '#f86a2a' },
  { id: 'taro', time: 3460, xp: 119, seedCost: 234, level: 188, shape: 'root', leaf: '#3a8a4a', fruit: '#a88a7a' },
  { id: 'cornflower', time: 3530, xp: 122, seedCost: 240, level: 193, shape: 'flower', leaf: '#6a9a7a', fruit: '#3a6ae8' },
  { id: 'cassava', time: 3614, xp: 126, seedCost: 247, level: 199, shape: 'root', leaf: '#5a8a3a', fruit: '#c89a6a' },
  // third wave
  { id: 'swiss_chard', time: 1220, xp: 23, seedCost: 42, level: 28, shape: 'leafy', leaf: '#3a8a3a', fruit: '#e8403a' },
  { id: 'watercress', time: 1458, xp: 33, seedCost: 62, level: 45, shape: 'leafy', leaf: '#3a9a3a', fruit: '#4aaa3a' },
  { id: 'radicchio', time: 1640, xp: 41, seedCost: 78, level: 58, shape: 'head', leaf: '#5a8a4a', fruit: '#9a1a3a' },
  { id: 'sorrel', time: 1878, xp: 51, seedCost: 98, level: 75, shape: 'leafy', leaf: '#4a9a3a', fruit: '#5aa83a' },
  { id: 'sweet_pea', time: 2102, xp: 61, seedCost: 118, level: 91, shape: 'trellis', leaf: '#5aa83a', fruit: '#e880c0' },
  { id: 'endive', time: 2312, xp: 70, seedCost: 136, level: 106, shape: 'leafy', leaf: '#7ab84a', fruit: '#e8f0c0' },
  { id: 'zinnia', time: 2522, xp: 79, seedCost: 154, level: 121, shape: 'flower', leaf: '#4a8a3a', fruit: '#f04a6a' },
  { id: 'sunchoke', time: 2718, xp: 87, seedCost: 170, level: 135, shape: 'root', leaf: '#4a8a3a', fruit: '#c8a070' },
  { id: 'snapdragon', time: 2914, xp: 96, seedCost: 187, level: 149, shape: 'flower', leaf: '#5a9a4a', fruit: '#f0a020' },
  { id: 'salsify', time: 3152, xp: 106, seedCost: 208, level: 166, shape: 'root', leaf: '#6a9a6a', fruit: '#e0d4b8' },
  { id: 'cosmos', time: 3348, xp: 114, seedCost: 224, level: 180, shape: 'flower', leaf: '#5aa84a', fruit: '#e878b8' },
  { id: 'lupin', time: 3516, xp: 121, seedCost: 239, level: 192, shape: 'flower', leaf: '#5a9a5a', fruit: '#7a5ad8' },
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

recipe('quill', 'loom', { gobbler_feather: 2 }, 240, 11, 10);
recipe('soap', 'dairy', { donkey_milk: 1, lemon: 1 }, 300, 13, 13);
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
recipe('olive_oil', 'oil_press', { olive: 3 }, 240, 12, 17);
recipe('pesto', 'oil_press', { spinach: 2, garlic: 1, olive_oil: 1 }, 300, 15, 17);
recipe('apricot_jam', 'jam_maker', { apricot: 3 }, 200, 10, 9);
recipe('fig_jam', 'jam_maker', { fig: 3 }, 280, 14, 16);
recipe('limeade', 'juice_press', { lime: 3, sugar: 1 }, 200, 10, 14);
recipe('walnut_cookie', 'bakery', { walnut: 2, wheat: 2, egg: 1 }, 330, 17, 20);
recipe('greek_salad', 'salad_bar', { cucumber: 1, tomato: 1, olive: 2, onion: 1 }, 270, 14, 17);
recipe('roast_veggies', 'bbq_grill', { zucchini: 1, sweet_potato: 1, beet: 1 }, 270, 14, 15);
recipe('quail_quiche', 'bakery', { quail_egg: 3, spinach: 1, wheat: 1 }, 240, 12, 9);
recipe('yak_blanket', 'loom', { yak_wool: 2 }, 390, 19, 18);
recipe('camel_cheese', 'dairy', { camel_milk: 2 }, 360, 19, 20);
recipe('bouquet', 'florist', { rose: 3, tulip: 2 }, 240, 12, 11);
recipe('lavender_sachet', 'florist', { lavender: 2, wool: 1 }, 270, 13, 12);
recipe('flower_crown', 'florist', { rose: 1, lavender: 1, tulip: 2 }, 330, 16, 13);
recipe('oat_cookie', 'bakery', { oat: 3, egg: 1 }, 120, 6, 4);
recipe('barley_bread', 'bakery', { barley: 3 }, 150, 7, 6);
recipe('soy_milk', 'dairy', { soybean: 3 }, 150, 8, 8);
recipe('salmon_roll', 'sushi_bar', { salmon: 1, rice: 2 }, 300, 15, 13);
recipe('crab_cake', 'bbq_grill', { crab: 1, bread: 1, egg: 1 }, 300, 16, 14);
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


// late game dishes from the new crops and fruit
recipe('cherry_tomato_pizza', 'pizzeria', { cherry_tomato: 2, cheese: 1, bread: 1 }, 950, 18, 35);
recipe('nectarine_sorbet', 'ice_cream', { nectarine: 2, cream: 1 }, 1040, 22, 44);
recipe('cantaloupe_juice', 'juice_press', { cantaloupe: 2, sugar: 1 }, 1150, 28, 55);
recipe('papaya_jam', 'jam_maker', { papaya: 2, sugar: 1 }, 1220, 31, 62);
recipe('grilled_ginger', 'bbq_grill', { ginger: 2, butter: 1 }, 1330, 36, 73);
recipe('guava_juice', 'juice_press', { guava: 2, sugar: 1 }, 1380, 39, 78);
recipe('green_bean_pizza', 'pizzeria', { green_bean: 2, cheese: 1, bread: 1 }, 1480, 44, 88);
recipe('elderberry_sorbet', 'ice_cream', { elderberry: 2, cream: 1 }, 1530, 46, 93);
recipe('chamomile_wreath', 'florist', { chamomile: 2, tulip: 2 }, 1610, 50, 101);
recipe('pecan_pie', 'bakery', { pecan: 2, wheat: 2, egg: 1 }, 1660, 53, 106);
recipe('grilled_leek', 'bbq_grill', { leek: 2, butter: 1 }, 1730, 56, 113);
recipe('jackfruit_juice', 'juice_press', { jackfruit: 2, sugar: 1 }, 1770, 58, 117);
recipe('hibiscus_wreath', 'florist', { hibiscus: 2, tulip: 2 }, 1850, 62, 125);
recipe('yuzu_sorbet', 'ice_cream', { yuzu: 2, cream: 1 }, 1900, 65, 130);
recipe('flax_linen', 'loom', { flax: 2 }, 1970, 68, 137);
recipe('cashew_pie', 'bakery', { cashew: 2, wheat: 2, egg: 1 }, 2010, 70, 141);
recipe('saffron_wreath', 'florist', { saffron: 2, tulip: 2 }, 2070, 74, 147);
recipe('loquat_juice', 'juice_press', { loquat: 2, sugar: 1 }, 2110, 76, 151);
recipe('green_yogurt', 'dairy', { tea: 2, milk: 2 }, 2170, 78, 157);
recipe('cinnamon_tea', 'coffee_kiosk', { cinnamon: 2, sugar: 1 }, 2210, 80, 161);
recipe('turmeric_salad', 'salad_bar', { turmeric: 2, lettuce: 1 }, 2260, 83, 166);
recipe('durian_jam', 'jam_maker', { durian: 2, sugar: 1 }, 2300, 85, 170);
recipe('grilled_okra', 'bbq_grill', { okra: 2, butter: 1 }, 2340, 87, 174);
recipe('silver_pear_juice', 'juice_press', { silver_pear: 2, sugar: 1 }, 2370, 88, 177);
recipe('artichoke_pizza', 'pizzeria', { artichoke: 2, cheese: 1, bread: 1 }, 2400, 90, 180);
recipe('goji_sorbet', 'ice_cream', { goji: 2, cream: 1 }, 2430, 92, 183);
recipe('wasabi_salad', 'salad_bar', { wasabi: 2, lettuce: 1 }, 2460, 93, 186);
recipe('black_bean_pie', 'bakery', { black_bean: 2, wheat: 2, egg: 1 }, 2480, 94, 188);
recipe('aloe_yogurt', 'dairy', { aloe: 2, milk: 2 }, 2510, 96, 191);
recipe('aloe_tea', 'coffee_kiosk', { aloe: 2, sugar: 1 }, 2520, 96, 192);
recipe('lotus_wreath', 'florist', { lotus: 2, tulip: 2 }, 2530, 96, 193);
recipe('lotus_bouquet', 'florist', { lotus: 2, rose: 1 }, 2540, 97, 194);
recipe('black_bean_oil', 'oil_press', { black_bean: 2 }, 2560, 98, 196);
recipe('black_bean_brittle', 'sugar_mill', { black_bean: 2, sugar: 2 }, 2570, 98, 197);
recipe('grilled_wasabi', 'bbq_grill', { wasabi: 2, butter: 1 }, 2580, 99, 198);
recipe('wasabi_pizza', 'pizzeria', { wasabi: 2, cheese: 1, bread: 1 }, 2590, 100, 199);

// second wave dishes
recipe('damson_tart', 'bakery', { damson: 2, wheat: 2, egg: 1 }, 200, 2, 5);
recipe('turnip_soup', 'bakery', { turnip: 2, milk: 1 }, 320, 4, 8);
recipe('chives_tea', 'coffee_kiosk', { chives: 2, sugar: 1 }, 520, 6, 13);
recipe('sour_cherry_juice', 'juice_press', { sour_cherry: 2, sugar: 1 }, 680, 8, 17);
recipe('nashi_pear_jam', 'jam_maker', { nashi: 2, sugar: 1 }, 820, 11, 22);
recipe('arugula_pizza', 'pizzeria', { arugula: 2, cheese: 1, bread: 1 }, 850, 12, 25);
recipe('buckwheat_cookies', 'bakery', { buckwheat: 2, sugar: 1, egg: 1 }, 900, 15, 30);
recipe('daikon_salad', 'salad_bar', { daikon: 2, lettuce: 1 }, 940, 17, 34);
recipe('rowan_jam', 'jam_maker', { rowan: 2, sugar: 1 }, 1000, 20, 40);
recipe('fava_brittle', 'sugar_mill', { fava_bean: 2, sugar: 2 }, 1030, 22, 43);
recipe('sloe_tart', 'bakery', { sloe: 2, wheat: 2, egg: 1 }, 1070, 24, 47);
recipe('pomelo_juice', 'juice_press', { pomelo: 2, sugar: 1 }, 1120, 26, 52);
recipe('citron_jam', 'jam_maker', { citron: 2, sugar: 1 }, 1170, 28, 57);
recipe('cilantro_dressing', 'salad_bar', { cilantro: 2 }, 1200, 30, 60);
recipe('fennel_soup', 'bakery', { fennel: 2, milk: 1 }, 1240, 32, 64);
recipe('jujube_juice', 'juice_press', { jujube: 2, sugar: 1 }, 1300, 35, 70);
recipe('spelt_porridge', 'bakery', { spelt: 2, milk: 1 }, 1330, 36, 73);
recipe('rutabaga_pizza', 'pizzeria', { rutabaga: 2, cheese: 1, bread: 1 }, 1380, 39, 78);
recipe('acerola_tart', 'bakery', { acerola: 2, wheat: 2, egg: 1 }, 1420, 41, 82);
recipe('carob_oil', 'oil_press', { carob: 2 }, 1470, 44, 87);
recipe('oregano_tea', 'coffee_kiosk', { oregano: 2, sugar: 1 }, 1500, 45, 90);
recipe('sprout_pizza', 'pizzeria', { brussels_sprout: 2, cheese: 1, bread: 1 }, 1550, 48, 95);
recipe('mung_bean_stew', 'bakery', { mung_bean: 2, carrot: 1 }, 1600, 50, 100);
recipe('plantain_juice', 'juice_press', { plantain: 2, sugar: 1 }, 1650, 52, 105);
recipe('iris_wreath', 'florist', { iris: 2, tulip: 2 }, 1680, 54, 108);
recipe('currant_sorbet', 'ice_cream', { currant: 2, cream: 1 }, 1730, 56, 113);
recipe('tamarind_tart', 'bakery', { tamarind: 2, wheat: 2, egg: 1 }, 1770, 58, 117);
recipe('pawpaw_juice', 'juice_press', { pawpaw: 2, sugar: 1 }, 1820, 61, 122);
recipe('rosemary_dressing', 'salad_bar', { rosemary: 2 }, 1850, 62, 125);
recipe('tomatillo_pizza', 'pizzeria', { tomatillo: 2, cheese: 1, bread: 1 }, 1900, 65, 130);
recipe('amaranth_cookies', 'bakery', { amaranth: 2, sugar: 1, egg: 1 }, 1940, 67, 134);
recipe('sea_buckthorn_juice', 'juice_press', { sea_buckthorn: 2, sugar: 1 }, 2000, 70, 140);
recipe('roast_horseradish', 'bbq_grill', { horseradish: 2, butter: 1 }, 2030, 72, 143);
recipe('finger_lime_sorbet', 'ice_cream', { finger_lime: 2, cream: 1 }, 2070, 74, 147);
recipe('sapodilla_tart', 'bakery', { sapodilla: 2, wheat: 2, egg: 1 }, 2120, 76, 152);
recipe('soursop_juice', 'juice_press', { soursop: 2, sugar: 1 }, 2170, 78, 157);
recipe('sesame_cookies', 'bakery', { sesame: 2, sugar: 1, egg: 1 }, 2200, 80, 160);
recipe('lily_posy', 'florist', { lily: 2 }, 2240, 82, 164);
recipe('breadfruit_tart', 'bakery', { breadfruit: 2, wheat: 2, egg: 1 }, 2300, 85, 170);
recipe('sage_cheese', 'dairy', { sage: 2, milk: 2 }, 2330, 86, 173);
recipe('roast_bitter_melon', 'bbq_grill', { bitter_melon: 2, butter: 1 }, 2380, 89, 178);
recipe('mamey_sorbet', 'ice_cream', { mamey: 2, cream: 1 }, 2420, 91, 182);
recipe('snake_fruit_tart', 'bakery', { salak: 2, wheat: 2, egg: 1 }, 2470, 94, 187);
recipe('taro_salad', 'salad_bar', { taro: 2, lettuce: 1 }, 2500, 95, 190);
recipe('cornflower_bouquet', 'florist', { cornflower: 2, rose: 1 }, 2550, 98, 195);
recipe('cassava_pizza', 'pizzeria', { cassava: 2, cheese: 1, bread: 1 }, 2600, 100, 200);

// third wave dishes
recipe('chili_pepper_latte', 'coffee_kiosk', { chili: 1, coffee_bean: 1, milk: 1 }, 810, 10, 21);
recipe('chili_pepper_chai', 'tea_house', { chili: 1, milk: 1, sugar: 1 }, 850, 12, 25);
recipe('iced_lemon_tea', 'tea_house', { lemon: 2, sugar: 1 }, 850, 12, 25);
recipe('quince_smoothie', 'smoothie_bar', { quince: 2, milk: 1 }, 870, 14, 27);
recipe('coconut_shake', 'smoothie_bar', { coconut: 2, cream: 1 }, 890, 14, 29);
recipe('lavender_tea', 'tea_house', { lavender: 2, honey: 1 }, 890, 14, 29);
recipe('tilapia_nigiri', 'sushi_bar', { tilapia: 1, rice: 2 }, 910, 16, 31);
recipe('mackerel_ravioli', 'pasta_maker', { mackerel: 2, wheat: 2, cheese: 1 }, 930, 16, 33);
recipe('arugula_lasagna', 'pasta_maker', { arugula: 2, wheat: 2, cheese: 1, tomato: 1 }, 940, 17, 34);
recipe('daikon_pasta', 'pasta_maker', { daikon: 2, wheat: 3, egg: 1 }, 950, 18, 35);
recipe('daikon_calzone', 'pizzeria', { daikon: 2, wheat: 2, cheese: 1 }, 950, 18, 35);
recipe('tangerine_candy', 'candy_shop', { tangerine: 2, sugar: 2 }, 970, 18, 37);
recipe('rowan_gummies', 'candy_shop', { rowan: 2, sugar: 1, honey: 1 }, 990, 20, 39);
recipe('candied_rowan', 'candy_shop', { rowan: 2, sugar: 1 }, 1010, 20, 41);
recipe('mulberry_gelato', 'ice_cream', { mulberry: 2, milk: 1, sugar: 1 }, 1010, 20, 41);
recipe('kale_slaw', 'salad_bar', { kale: 2, egg: 1 }, 1020, 21, 42);
recipe('clementine_nectar', 'juice_press', { clementine: 3 }, 1030, 22, 43);
recipe('nubian_goat_cheese', 'cheese_cave', { nubian_milk: 3 }, 1040, 22, 44);
recipe('dill_herb_cheese', 'cheese_cave', { dill: 1, milk: 3 }, 1070, 24, 47);
recipe('watercress_skewers', 'bbq_grill', { watercress: 2, butter: 1 }, 1080, 24, 48);
recipe('nectarine_marmalade', 'jam_maker', { nectarine: 2, sugar: 1 }, 1090, 24, 49);
recipe('clementine_yogurt', 'dairy', { clementine: 2, milk: 2 }, 1100, 25, 50);
recipe('persimmon_pie', 'bakery', { persimmon: 2, wheat: 2, butter: 1 }, 1100, 25, 50);
recipe('sea_bass_noodles', 'noodle_bar', { sea_bass: 2, rice: 2 }, 1120, 26, 52);
recipe('sea_bream_ramen', 'noodle_bar', { sea_bream: 2, wheat: 2, egg: 1 }, 1140, 27, 54);
recipe('cantaloupe_muffins', 'bakery', { cantaloupe: 2, wheat: 2, egg: 1 }, 1150, 28, 55);
recipe('zander_ramen', 'noodle_bar', { zander: 2, wheat: 2, egg: 1 }, 1160, 28, 56);
recipe('kohlrabi_noodles', 'noodle_bar', { kohlrabi: 2, rice: 2 }, 1170, 28, 57);
recipe('basil_herb_cheese', 'cheese_cave', { basil: 1, milk: 3 }, 1170, 28, 57);
recipe('smoked_zander', 'smokehouse', { zander: 2 }, 1190, 30, 59);
recipe('smoked_zander_pate', 'smokehouse', { zander: 1, butter: 1 }, 1200, 30, 60);
recipe('smoked_catfish_pate', 'smokehouse', { catfish: 1, butter: 1 }, 1210, 30, 61);
recipe('smoked_cod', 'smokehouse', { cod: 2 }, 1210, 30, 61);
recipe('galloway_cheese', 'cheese_cave', { galloway_milk: 3 }, 1220, 31, 62);
recipe('mirabelle_gummies', 'candy_shop', { mirabelle: 2, sugar: 1, honey: 1 }, 1230, 32, 63);
recipe('candied_papaya', 'candy_shop', { papaya: 2, sugar: 1 }, 1250, 32, 65);
recipe('basil_spice_rub', 'spice_mill', { basil: 2, garlic: 1 }, 1270, 34, 67);
recipe('basil_powder', 'spice_mill', { basil: 3 }, 1290, 34, 69);
recipe('dill_spice_rub', 'spice_mill', { dill: 2, garlic: 1 }, 1290, 34, 69);
recipe('ginger_powder', 'spice_mill', { ginger: 3 }, 1300, 35, 70);
recipe('kumquat_candy', 'candy_shop', { kumquat: 2, sugar: 2 }, 1300, 35, 70);
recipe('ginger_pasta', 'pasta_maker', { ginger: 2, wheat: 3, egg: 1 }, 1320, 36, 72);
recipe('radicchio_lasagna', 'pasta_maker', { radicchio: 2, wheat: 2, cheese: 1, tomato: 1 }, 1320, 36, 72);
recipe('fennel_ravioli', 'pasta_maker', { fennel: 2, wheat: 2, cheese: 1 }, 1330, 36, 73);
recipe('ginger_body_mist', 'perfumery', { ginger: 2, lemon: 1 }, 1340, 37, 74);
recipe('marigold_perfume', 'perfumery', { marigold: 3 }, 1350, 38, 75);
recipe('poppy_perfume', 'perfumery', { poppy: 3 }, 1370, 38, 77);
recipe('marigold_body_mist', 'perfumery', { marigold: 2, lemon: 1 }, 1370, 38, 77);
recipe('feijoa_smoothie', 'smoothie_bar', { feijoa: 2, milk: 1 }, 1380, 39, 78);
recipe('guava_shake', 'smoothie_bar', { guava: 2, cream: 1 }, 1400, 40, 80);
recipe('ginger_tea', 'tea_house', { ginger: 2, honey: 1 }, 1410, 40, 81);
recipe('iced_sorrel_tea', 'tea_house', { sorrel: 2, sugar: 1 }, 1420, 41, 82);
recipe('marigold_soap', 'soap_maker', { marigold: 2, goat_milk: 1 }, 1430, 42, 83);
recipe('golden_milk_soap', 'soap_maker', { golden_milk: 2, honey: 1 }, 1450, 42, 85);
recipe('daffodil_soap', 'soap_maker', { daffodil: 2, goat_milk: 1 }, 1450, 42, 85);
recipe('reindeer_milk_soap', 'soap_maker', { reindeer_milk: 2, honey: 1 }, 1470, 44, 87);
recipe('ginger_chai', 'tea_house', { ginger: 1, milk: 1, sugar: 1 }, 1470, 44, 87);
recipe('hazelnut_latte', 'coffee_kiosk', { hazelnut: 1, coffee_bean: 1, milk: 1 }, 1480, 44, 88);
recipe('pollock_nigiri', 'sushi_bar', { pollock: 1, rice: 2 }, 1490, 44, 89);
recipe('green_bean_calzone', 'pizzeria', { green_bean: 2, wheat: 2, cheese: 1 }, 1490, 44, 89);
recipe('pistachio_gelato', 'ice_cream', { pistachio: 2, milk: 1, sugar: 1 }, 1500, 45, 90);
recipe('green_bean_slaw', 'salad_bar', { green_bean: 2, egg: 1 }, 1500, 45, 90);
recipe('elderberry_nectar', 'juice_press', { elderberry: 3 }, 1510, 46, 91);
recipe('oregano_candle', 'candle_shop', { oregano: 2, honey: 2 }, 1530, 46, 93);
recipe('mint_candle', 'candle_shop', { mint: 2, honey: 2 }, 1550, 48, 95);
recipe('acerola_marmalade', 'jam_maker', { acerola: 2, sugar: 1 }, 1560, 48, 96);
recipe('pollock_skewers', 'bbq_grill', { pollock: 2, butter: 1 }, 1570, 48, 97);
recipe('elderberry_yogurt', 'dairy', { elderberry: 2, milk: 2 }, 1590, 50, 99);
recipe('dragon_fruit_muffins', 'bakery', { dragon_fruit: 2, wheat: 2, egg: 1 }, 1590, 50, 99);
recipe('kiwi_fruit_pie', 'bakery', { kiwifruit: 2, wheat: 2, butter: 1 }, 1600, 50, 100);
recipe('kiwi_fruit_candle', 'candle_shop', { kiwifruit: 2, honey: 2 }, 1600, 50, 100);
recipe('saanen_milk_soap', 'soap_maker', { saanen_milk: 2, honey: 1 }, 1610, 50, 101);
recipe('chamomile_soap', 'soap_maker', { chamomile: 2, goat_milk: 1 }, 1620, 51, 102);
recipe('chamomile_body_mist', 'perfumery', { chamomile: 2, lemon: 1 }, 1620, 51, 102);
recipe('chamomile_perfume', 'perfumery', { chamomile: 3 }, 1630, 52, 103);
recipe('oregano_powder', 'spice_mill', { oregano: 3 }, 1640, 52, 104);
recipe('jalapeno_spice_rub', 'spice_mill', { jalapeno: 2, garlic: 1 }, 1650, 52, 105);
recipe('smoked_sole', 'smokehouse', { sole: 2 }, 1650, 52, 105);
recipe('smoked_sole_pate', 'smokehouse', { sole: 1, butter: 1 }, 1670, 54, 107);
recipe('yellowtail_noodles', 'noodle_bar', { yellowtail: 2, rice: 2 }, 1690, 54, 109);
recipe('whiting_ramen', 'noodle_bar', { whiting: 2, wheat: 2, egg: 1 }, 1690, 54, 109);
recipe('saanen_cheese', 'cheese_cave', { saanen_milk: 3 }, 1700, 55, 110);
recipe('chamomile_herb_cheese', 'cheese_cave', { chamomile: 1, milk: 3 }, 1710, 56, 111);
recipe('pecan_candy', 'candy_shop', { pecan: 2, sugar: 2 }, 1710, 56, 111);
recipe('candied_honeydew', 'candy_shop', { honeydew: 2, sugar: 1 }, 1730, 56, 113);
recipe('kiwi_fruit_gummies', 'candy_shop', { kiwifruit: 2, sugar: 1, honey: 1 }, 1730, 56, 113);
recipe('leek_ravioli', 'pasta_maker', { leek: 2, wheat: 2, cheese: 1 }, 1740, 57, 114);
recipe('leek_lasagna', 'pasta_maker', { leek: 2, wheat: 2, cheese: 1, tomato: 1 }, 1750, 58, 115);
recipe('endive_pasta', 'pasta_maker', { endive: 2, wheat: 3, egg: 1 }, 1750, 58, 115);
recipe('currant_smoothie', 'smoothie_bar', { currant: 2, milk: 1 }, 1770, 58, 117);
recipe('jackfruit_shake', 'smoothie_bar', { jackfruit: 2, cream: 1 }, 1770, 58, 117);
recipe('chamomile_tea', 'tea_house', { chamomile: 2, honey: 1 }, 1780, 59, 118);
recipe('chamomile_chai', 'tea_house', { chamomile: 1, milk: 1, sugar: 1 }, 1800, 60, 120);
recipe('iced_kiwi_fruit_tea', 'tea_house', { kiwifruit: 2, sugar: 1 }, 1810, 60, 121);
recipe('macadamia_latte', 'coffee_kiosk', { macadamia: 1, coffee_bean: 1, milk: 1 }, 1820, 61, 122);
recipe('red_snapper_nigiri', 'sushi_bar', { red_snapper: 1, rice: 2 }, 1820, 61, 122);
recipe('endive_calzone', 'pizzeria', { endive: 2, wheat: 2, cheese: 1 }, 1830, 62, 123);
recipe('macadamia_gelato', 'ice_cream', { macadamia: 2, milk: 1, sugar: 1 }, 1840, 62, 124);
recipe('celeriac_slaw', 'salad_bar', { celeriac: 2, egg: 1 }, 1850, 62, 125);
recipe('lucuma_nectar', 'juice_press', { lucuma: 3 }, 1860, 63, 126);
recipe('halibut_skewers', 'bbq_grill', { halibut: 2, butter: 1 }, 1870, 64, 127);
recipe('longan_marmalade', 'jam_maker', { longan: 2, sugar: 1 }, 1870, 64, 127);
recipe('pawpaw_yogurt', 'dairy', { pawpaw: 2, milk: 2 }, 1890, 64, 129);
recipe('pawpaw_pie', 'bakery', { pawpaw: 2, wheat: 2, butter: 1 }, 1890, 64, 129);
recipe('longan_muffins', 'bakery', { longan: 2, wheat: 2, egg: 1 }, 1900, 65, 130);
recipe('rosemary_candle', 'candle_shop', { rosemary: 2, honey: 2 }, 1900, 65, 130);
recipe('hibiscus_soap', 'soap_maker', { hibiscus: 2, goat_milk: 1 }, 1910, 66, 131);
recipe('creamy_milk_soap', 'soap_maker', { creamy_milk: 2, honey: 1 }, 1920, 66, 132);
recipe('hibiscus_perfume', 'perfumery', { hibiscus: 3 }, 1920, 66, 132);
recipe('hibiscus_body_mist', 'perfumery', { hibiscus: 2, lemon: 1 }, 1930, 66, 133);
recipe('passion_fruit_bonbon', 'chocolatier', { passion_fruit: 1, cocoa_pod: 1, sugar: 1 }, 1940, 67, 134);
recipe('yuzu_chocolate', 'chocolatier', { yuzu: 2, cocoa_pod: 1, sugar: 1 }, 1950, 68, 135);
recipe('macadamia_truffle', 'chocolatier', { macadamia: 1, cocoa_pod: 1, cream: 1 }, 1970, 68, 137);
recipe('lucuma_bonbon', 'chocolatier', { lucuma: 1, cocoa_pod: 1, sugar: 1 }, 1970, 68, 137);
recipe('kiwi_fruit_truffle', 'chocolatier', { kiwifruit: 1, cocoa_pod: 1, cream: 1 }, 1980, 69, 138);
recipe('cranberry_chocolate', 'chocolatier', { cranberry: 2, cocoa_pod: 1, sugar: 1 }, 1980, 69, 138);
recipe('sea_buckthorn_chocolate', 'chocolatier', { sea_buckthorn: 2, cocoa_pod: 1, sugar: 1 }, 1990, 70, 139);
recipe('sea_buckthorn_bonbon', 'chocolatier', { sea_buckthorn: 1, cocoa_pod: 1, sugar: 1 }, 2000, 70, 140);
recipe('cashew_truffle', 'chocolatier', { cashew: 1, cocoa_pod: 1, cream: 1 }, 2000, 70, 140);
recipe('pine_nut_truffle', 'chocolatier', { pine_nut: 1, cocoa_pod: 1, cream: 1 }, 2010, 70, 141);
recipe('marula_bonbon', 'chocolatier', { marula: 1, cocoa_pod: 1, sugar: 1 }, 2020, 71, 142);
recipe('marula_chocolate', 'chocolatier', { marula: 2, cocoa_pod: 1, sugar: 1 }, 2020, 71, 142);
recipe('horseradish_spice_rub', 'spice_mill', { horseradish: 2, garlic: 1 }, 2030, 72, 143);
recipe('horseradish_powder', 'spice_mill', { horseradish: 3 }, 2040, 72, 144);
recipe('smoked_mahi_mahi_pate', 'smokehouse', { mahi_mahi: 1, butter: 1 }, 2040, 72, 144);
recipe('smoked_amberjack', 'smokehouse', { amberjack: 2 }, 2060, 73, 146);
recipe('turbot_noodles', 'noodle_bar', { turbot: 2, rice: 2 }, 2070, 74, 147);
recipe('snook_ramen', 'noodle_bar', { snook: 2, wheat: 2, egg: 1 }, 2080, 74, 148);
recipe('hibiscus_herb_cheese', 'cheese_cave', { hibiscus: 1, milk: 3 }, 2080, 74, 148);
recipe('watusi_cheese', 'cheese_cave', { watusi_milk: 3 }, 2090, 74, 149);
recipe('loquat_gummies', 'candy_shop', { loquat: 2, sugar: 1, honey: 1 }, 2100, 75, 150);
recipe('white_peach_candy', 'candy_shop', { white_peach: 2, sugar: 2 }, 2100, 75, 150);
recipe('candied_cranberry', 'candy_shop', { cranberry: 2, sugar: 1 }, 2110, 76, 151);
recipe('tomatillo_ravioli', 'pasta_maker', { tomatillo: 2, wheat: 2, cheese: 1 }, 2110, 76, 151);
recipe('romanesco_pasta', 'pasta_maker', { romanesco: 2, wheat: 3, egg: 1 }, 2120, 76, 152);
recipe('romanesco_lasagna', 'pasta_maker', { romanesco: 2, wheat: 2, cheese: 1, tomato: 1 }, 2130, 76, 153);
recipe('loquat_smoothie', 'smoothie_bar', { loquat: 2, milk: 1 }, 2130, 76, 153);
recipe('marula_shake', 'smoothie_bar', { marula: 2, cream: 1 }, 2150, 78, 155);
recipe('iced_saffron_tea', 'tea_house', { saffron: 2, sugar: 1 }, 2160, 78, 156);
recipe('green_tea', 'tea_house', { tea: 2, honey: 1 }, 2170, 78, 157);
recipe('green_chai', 'tea_house', { tea: 1, milk: 1, sugar: 1 }, 2170, 78, 157);
recipe('habanero_latte', 'coffee_kiosk', { habanero: 1, coffee_bean: 1, milk: 1 }, 2180, 79, 158);
recipe('mahi_mahi_nigiri', 'sushi_bar', { mahi_mahi: 1, rice: 2 }, 2180, 79, 158);
recipe('romanesco_calzone', 'pizzeria', { romanesco: 2, wheat: 2, cheese: 1 }, 2190, 80, 159);
recipe('loquat_gelato', 'ice_cream', { loquat: 2, milk: 1, sugar: 1 }, 2200, 80, 160);
recipe('romanesco_slaw', 'salad_bar', { romanesco: 2, egg: 1 }, 2200, 80, 160);
recipe('soursop_nectar', 'juice_press', { soursop: 3 }, 2210, 80, 161);
recipe('romanesco_skewers', 'bbq_grill', { romanesco: 2, butter: 1 }, 2220, 81, 162);
recipe('gooseberry_marmalade', 'jam_maker', { gooseberry: 2, sugar: 1 }, 2220, 81, 162);
recipe('mangosteen_yogurt', 'dairy', { mangosteen: 2, milk: 2 }, 2230, 82, 163);
recipe('loquat_pie', 'bakery', { loquat: 2, wheat: 2, butter: 1 }, 2230, 82, 163);
recipe('mangosteen_muffins', 'bakery', { mangosteen: 2, wheat: 2, egg: 1 }, 2240, 82, 164);
recipe('soursop_chocolate', 'chocolatier', { soursop: 2, cocoa_pod: 1, sugar: 1 }, 2250, 82, 165);
recipe('pecan_truffle', 'chocolatier', { pecan: 1, cocoa_pod: 1, cream: 1 }, 2260, 83, 166);
recipe('soursop_bonbon', 'chocolatier', { soursop: 1, cocoa_pod: 1, sugar: 1 }, 2270, 84, 167);
recipe('lily_candle', 'candle_shop', { lily: 2, honey: 2 }, 2270, 84, 167);
recipe('watusi_milk_soap', 'soap_maker', { watusi_milk: 2, honey: 1 }, 2290, 84, 169);
recipe('green_soap', 'soap_maker', { tea: 2, goat_milk: 1 }, 2290, 84, 169);
recipe('lily_body_mist', 'perfumery', { lily: 2, lemon: 1 }, 2300, 85, 170);
recipe('peony_perfume', 'perfumery', { peony: 3 }, 2310, 86, 171);
recipe('sage_powder', 'spice_mill', { sage: 3 }, 2320, 86, 172);
recipe('sesame_spice_rub', 'spice_mill', { sesame: 2, garlic: 1 }, 2320, 86, 172);
recipe('smoked_cobia_pate', 'smokehouse', { cobia: 1, butter: 1 }, 2330, 86, 173);
recipe('smoked_cobia', 'smokehouse', { cobia: 2 }, 2340, 87, 174);
recipe('cobia_ramen', 'noodle_bar', { cobia: 2, wheat: 2, egg: 1 }, 2340, 87, 174);
recipe('salsify_noodles', 'noodle_bar', { salsify: 2, rice: 2 }, 2350, 88, 175);
recipe('creamy_cheese', 'cheese_cave', { creamy_milk: 3 }, 2360, 88, 176);
recipe('sage_herb_cheese', 'cheese_cave', { sage: 1, milk: 3 }, 2370, 88, 177);
recipe('candied_cherimoya', 'candy_shop', { cherimoya: 2, sugar: 1 }, 2370, 88, 177);
recipe('cherimoya_candy', 'candy_shop', { cherimoya: 2, sugar: 2 }, 2380, 89, 178);
recipe('cherimoya_gummies', 'candy_shop', { cherimoya: 2, sugar: 1, honey: 1 }, 2390, 90, 179);
recipe('okra_ravioli', 'pasta_maker', { okra: 2, wheat: 2, cheese: 1 }, 2390, 90, 179);
recipe('bitter_melon_lasagna', 'pasta_maker', { bitter_melon: 2, wheat: 2, cheese: 1, tomato: 1 }, 2400, 90, 180);
recipe('sage_pasta', 'pasta_maker', { sage: 2, wheat: 3, egg: 1 }, 2410, 90, 181);
recipe('black_sapote_shake', 'smoothie_bar', { black_sapote: 2, cream: 1 }, 2410, 90, 181);
recipe('cherimoya_smoothie', 'smoothie_bar', { cherimoya: 2, milk: 1 }, 2420, 91, 182);
recipe('sesame_chai', 'tea_house', { sesame: 1, milk: 1, sugar: 1 }, 2430, 92, 183);
recipe('hops_tea', 'tea_house', { hops: 2, honey: 1 }, 2440, 92, 184);
recipe('iced_vanilla_tea', 'tea_house', { vanilla: 2, sugar: 1 }, 2450, 92, 185);
recipe('sturgeon_nigiri', 'sushi_bar', { sturgeon: 1, rice: 2 }, 2460, 93, 186);
recipe('turmeric_latte', 'coffee_kiosk', { turmeric: 1, coffee_bean: 1, milk: 1 }, 2460, 93, 186);
recipe('artichoke_calzone', 'pizzeria', { artichoke: 2, wheat: 2, cheese: 1 }, 2470, 94, 187);
recipe('black_sapote_gelato', 'ice_cream', { black_sapote: 2, milk: 1, sugar: 1 }, 2480, 94, 188);
recipe('taro_slaw', 'salad_bar', { taro: 2, egg: 1 }, 2480, 94, 188);
recipe('goji_nectar', 'juice_press', { goji: 3 }, 2490, 94, 189);
recipe('taro_skewers', 'bbq_grill', { taro: 2, butter: 1 }, 2490, 94, 189);
recipe('ugli_fruit_marmalade', 'jam_maker', { ugli_fruit: 2, sugar: 1 }, 2500, 95, 190);
recipe('ugli_fruit_yogurt', 'dairy', { ugli_fruit: 2, milk: 2 }, 2510, 96, 191);
recipe('ugli_fruit_pie', 'bakery', { ugli_fruit: 2, wheat: 2, butter: 1 }, 2510, 96, 191);
recipe('brazil_nut_muffins', 'bakery', { brazil_nut: 2, wheat: 2, egg: 1 }, 2520, 96, 192);
recipe('goji_bonbon', 'chocolatier', { goji: 1, cocoa_pod: 1, sugar: 1 }, 2530, 96, 193);
recipe('brazil_nut_truffle', 'chocolatier', { brazil_nut: 1, cocoa_pod: 1, cream: 1 }, 2530, 96, 193);
recipe('brazil_nut_chocolate', 'chocolatier', { brazil_nut: 2, cocoa_pod: 1, sugar: 1 }, 2540, 97, 194);
recipe('lotus_candle', 'candle_shop', { lotus: 2, honey: 2 }, 2560, 98, 196);
recipe('aloe_soap', 'soap_maker', { aloe: 2, goat_milk: 1 }, 2560, 98, 196);
recipe('zebu_milk_soap', 'soap_maker', { zebu_milk: 2, honey: 1 }, 2570, 98, 197);
recipe('cornflower_body_mist', 'perfumery', { cornflower: 2, lemon: 1 }, 2580, 99, 198);
recipe('lotus_perfume', 'perfumery', { lotus: 3 }, 2580, 99, 198);
recipe('nutmeg_spice_rub', 'spice_mill', { nutmeg: 2, garlic: 1 }, 2590, 100, 199);
recipe('wasabi_powder', 'spice_mill', { wasabi: 3 }, 2600, 100, 200);
recipe('honey_cake', 'bakery', { honey: 2, wheat: 2, egg: 1 }, 1290, 34, 69);
recipe('fruit_basket', 'florist', { apple: 3, pear: 2, peach: 2 }, 2320, 86, 172);
recipe('butter_cookies', 'bakery', { butter: 2, wheat: 3, sugar: 2 }, 2410, 90, 181);

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
  { id: 'gobbler', name: 'Gobbler', icon: '🦃', house: 'gobbler_run', feed: 'chicken_feed', product: 'gobbler_feather', time: 200, xp: 5, cost: 140, level: 10 },
  { id: 'donkey', name: 'Donkey', icon: '🫏', house: 'donkey_paddock', feed: 'carrot', product: 'donkey_milk', time: 280, xp: 6, cost: 260, level: 13 },
  { id: 'buffalo', name: 'Water Buffalo', icon: '🐃', house: 'buffalo_wallow', feed: 'cow_feed', product: 'buffalo_milk', time: 330, xp: 8, cost: 360, level: 15 },
  { id: 'peacock', name: 'Peacock', icon: '🦚', house: 'peacock_garden', feed: 'corn', product: 'peacock_feather', time: 360, xp: 9, cost: 420, level: 17 },
  { id: 'ostrich', name: 'Ostrich', icon: '🦤', house: 'ostrich_ranch', feed: 'wheat', product: 'ostrich_egg', time: 420, xp: 10, cost: 480, level: 19 },
  { id: 'quail', name: 'Quail', icon: '🐦', house: 'quail_coop', feed: 'chicken_feed', product: 'quail_egg', time: 100, xp: 3, cost: 70, level: 9 },
  { id: 'yak', name: 'Yak', icon: '🐂', house: 'yak_pasture', feed: 'cow_feed', product: 'yak_wool', time: 380, xp: 9, cost: 450, level: 18 },
  { id: 'camel', name: 'Camel', icon: '🐪', house: 'camel_corral', feed: 'wheat', product: 'camel_milk', time: 440, xp: 11, cost: 520, level: 20 },
  { id: 'horse', name: 'Horse', icon: '🐎', house: 'stable', feed: 'carrot', product: 'horseshoe', time: 360, xp: 8, cost: 400, level: 15 },
  { id: 'guinea_fowl', name: 'Guinea Fowl', icon: '@guinea_fowl', house: 'guinea_run', feed: 'chicken_feed', product: 'speckled_egg', time: 240, xp: 7, cost: 300, level: 22 },
  { id: 'pheasant', name: 'Pheasant', icon: '@pheasant', house: 'pheasant_run', feed: 'corn', product: 'pheasant_feather', time: 300, xp: 9, cost: 520, level: 30 },
  { id: 'highland_cow', name: 'Highland Cow', icon: '@highland_cow', house: 'highland_pasture', feed: 'cow_feed', product: 'fresh_cream', time: 400, xp: 12, cost: 700, level: 38 },
  { id: 'swan', name: 'Swan', icon: '🦢', house: 'swan_lake', feed: 'duck_feed', product: 'swan_down', time: 450, xp: 14, cost: 900, level: 47 },
  { id: 'emu', name: 'Emu', icon: '@emu', house: 'emu_ranch', feed: 'wheat', product: 'emu_egg', time: 500, xp: 16, cost: 1100, level: 56 },
  { id: 'reindeer', name: 'Reindeer', icon: '🦌', house: 'reindeer_lodge', feed: 'carrot', product: 'reindeer_milk', time: 560, xp: 19, cost: 1400, level: 68 },
  { id: 'bison', name: 'Bison', icon: '🦬', house: 'bison_range', feed: 'cow_feed', product: 'bison_wool', time: 620, xp: 22, cost: 1800, level: 82 },
  { id: 'flamingo', name: 'Flamingo', icon: '🦩', house: 'flamingo_lagoon', feed: 'duck_feed', product: 'pink_feather', time: 680, xp: 25, cost: 2200, level: 96 },
  { id: 'llama', name: 'Llama', icon: '@llama', house: 'llama_ranch', feed: 'wheat', product: 'llama_wool', time: 760, xp: 29, cost: 2800, level: 118 },
  { id: 'silkie_chicken', name: 'Silkie Chicken', icon: '@silkie_chicken', house: 'silkie_coop', feed: 'chicken_feed', product: 'silkie_egg', time: 294, xp: 10, cost: 840, level: 21 },
  { id: 'pony', name: 'Pony', icon: '🐴', house: 'pony_paddock', feed: 'carrot', product: 'rosette', time: 308, xp: 10, cost: 920, level: 24 },
  { id: 'black_sheep', name: 'Black Sheep', icon: '@black_sheep', house: 'black_sheepfold', feed: 'sheep_feed', product: 'black_wool', time: 317, xp: 11, cost: 980, level: 26 },
  { id: 'jersey_cow', name: 'Jersey Cow', icon: '🐮', house: 'jersey_pasture', feed: 'cow_feed', product: 'jersey_milk', time: 326, xp: 11, cost: 1030, level: 28 },
  { id: 'muscovy_duck', name: 'Muscovy Duck', icon: '@muscovy_duck', house: 'muscovy_pond', feed: 'duck_feed', product: 'muscovy_egg', time: 335, xp: 12, cost: 1090, level: 30 },
  { id: 'nubian_goat', name: 'Nubian Goat', icon: '@nubian_goat', house: 'nubian_yard', feed: 'goat_feed', product: 'nubian_milk', time: 348, xp: 12, cost: 1170, level: 33 },
  { id: 'silkworm', name: 'Silkworm', icon: '🐛', house: 'silk_house', feed: 'mulberry', product: 'silk', time: 362, xp: 13, cost: 1260, level: 36 },
  { id: 'angora_goat', name: 'Angora Goat', icon: '@angora_goat', house: 'angora_yard', feed: 'goat_feed', product: 'mohair', time: 376, xp: 14, cost: 1340, level: 39 },
  { id: 'mandarin_duck', name: 'Mandarin Duck', icon: '@mandarin_duck', house: 'mandarin_pond', feed: 'duck_feed', product: 'mandarin_feather', time: 394, xp: 14, cost: 1450, level: 43 },
  { id: 'squirrel', name: 'Squirrel', icon: '🐿️', house: 'squirrel_grove', feed: 'walnut', product: 'acorn', time: 407, xp: 15, cost: 1540, level: 46 },
  { id: 'merino_sheep', name: 'Merino Sheep', icon: '@merino_sheep', house: 'merino_fold', feed: 'sheep_feed', product: 'merino_wool', time: 420, xp: 16, cost: 1620, level: 49 },
  { id: 'parrot', name: 'Parrot', icon: '🦜', house: 'parrot_aviary', feed: 'banana', product: 'parrot_feather', time: 438, xp: 17, cost: 1730, level: 53 },
  { id: 'belted_galloway', name: 'Belted Galloway', icon: '@belted_galloway', house: 'galloway_pasture', feed: 'cow_feed', product: 'galloway_milk', time: 461, xp: 18, cost: 1870, level: 58 },
  { id: 'moose', name: 'Moose', icon: '@moose', house: 'moose_woods', feed: 'carrot', product: 'moose_milk', time: 484, xp: 19, cost: 2010, level: 63 },
  { id: 'cashmere_goat', name: 'Cashmere Goat', icon: '@cashmere_goat', house: 'cashmere_yard', feed: 'goat_feed', product: 'cashmere', time: 502, xp: 20, cost: 2130, level: 67 },
  { id: 'rhea', name: 'Rhea', icon: '@rhea', house: 'rhea_ranch', feed: 'wheat', product: 'rhea_egg', time: 520, xp: 21, cost: 2240, level: 71 },
  { id: 'bactrian_camel', name: 'Bactrian Camel', icon: '🐫', house: 'bactrian_corral', feed: 'wheat', product: 'camel_wool', time: 542, xp: 22, cost: 2380, level: 76 },
  { id: 'beaver', name: 'Beaver', icon: '🦫', house: 'beaver_pond', feed: 'carrot', product: 'timber', time: 560, xp: 23, cost: 2490, level: 80 },
  { id: 'jacob_sheep', name: 'Jacob Sheep', icon: '@jacob_sheep', house: 'jacob_fold', feed: 'sheep_feed', product: 'jacob_wool', time: 587, xp: 24, cost: 2660, level: 86 },
  { id: 'spotted_deer', name: 'Spotted Deer', icon: '@spotted_deer', house: 'deer_park', feed: 'carrot', product: 'shed_antler', time: 614, xp: 25, cost: 2830, level: 92 },
  { id: 'crane', name: 'Crane', icon: '@crane', house: 'crane_marsh', feed: 'corn', product: 'crane_feather', time: 641, xp: 27, cost: 2990, level: 98 },
  { id: 'zebu', name: 'Zebu', icon: '@zebu', house: 'zebu_pasture', feed: 'cow_feed', product: 'zebu_milk', time: 668, xp: 28, cost: 3160, level: 104 },
  { id: 'musk_ox', name: 'Musk Ox', icon: '@musk_ox', house: 'musk_ox_range', feed: 'cow_feed', product: 'qiviut', time: 704, xp: 30, cost: 3390, level: 112 },
  { id: 'black_swan', name: 'Black Swan', icon: '@black_swan', house: 'black_swan_lake', feed: 'duck_feed', product: 'black_down', time: 740, xp: 31, cost: 3610, level: 120 },
  { id: 'cassowary', name: 'Cassowary', icon: '@cassowary', house: 'cassowary_ranch', feed: 'wheat', product: 'cassowary_egg', time: 776, xp: 33, cost: 3830, level: 128 },
  { id: 'watusi', name: 'Watusi Cattle', icon: '@watusi', house: 'watusi_ranch', feed: 'cow_feed', product: 'watusi_milk', time: 812, xp: 35, cost: 4060, level: 136 },
  { id: 'chinchilla', name: 'Chinchilla', icon: '@chinchilla', house: 'chinchilla_hutch', feed: 'wheat', product: 'chinchilla_fluff', time: 852, xp: 37, cost: 4310, level: 145 },
  { id: 'barn_owl', name: 'Barn Owl', icon: '🦉', house: 'owl_barn', feed: 'chicken_feed', product: 'owl_feather', time: 898, xp: 39, cost: 4590, level: 155 },
  { id: 'kiwi_bird', name: 'Kiwi Bird', icon: '@kiwi_bird', house: 'kiwi_burrow', feed: 'chicken_feed', product: 'kiwi_egg', time: 956, xp: 42, cost: 4950, level: 168 },
  { id: 'vicuna', name: 'Vicuna', icon: '@vicuna', house: 'vicuna_ranch', feed: 'wheat', product: 'vicuna_wool', time: 1019, xp: 45, cost: 5350, level: 182 },
  { id: 'golden_goose', name: 'Golden Goose', icon: '@golden_goose', house: 'golden_nest', feed: 'corn', product: 'golden_egg', time: 1200, xp: 50, cost: 6000, level: 200 },
  { id: 'hereford', name: 'Hereford Cow', icon: '🐄', house: 'hereford_ranch', feed: 'cow_feed', product: 'farm_butter', time: 735, xp: 11, cost: 1260, level: 45 },
  { id: 'suffolk_sheep', name: 'Suffolk Sheep', icon: '🐑', house: 'suffolk_fold', feed: 'sheep_feed', product: 'suffolk_wool', time: 792, xp: 16, cost: 1792, level: 64 },
  { id: 'bronze_turkey', name: 'Bronze Gobbler', icon: '🦃', house: 'turkey_run', feed: 'chicken_feed', product: 'bronze_feather', time: 837, xp: 20, cost: 2212, level: 79 },
  { id: 'saanen_goat', name: 'Saanen Goat', icon: '🐐', house: 'saanen_yard', feed: 'goat_feed', product: 'saanen_milk', time: 882, xp: 24, cost: 2632, level: 94 },
  { id: 'ayam_cemani', name: 'Ayam Cemani', icon: '🐓', house: 'cemani_coop', feed: 'chicken_feed', product: 'black_egg', time: 921, xp: 27, cost: 2996, level: 107 },
  { id: 'grey_heron', name: 'Grey Heron', icon: '🪿', house: 'heron_marsh', feed: 'duck_feed', product: 'heron_plume', time: 957, xp: 30, cost: 3332, level: 119 },
  // second wave
  { id: 'pekin_duck', name: 'Pekin Duck', icon: '🦆', house: 'pekin_pond', feed: 'duck_feed', product: 'pekin_down', time: 150, xp: 3, cost: 168, level: 6 },
  { id: 'orpington', name: 'Orpington Hen', icon: '🐔', house: 'orpington_coop', feed: 'chicken_feed', product: 'brown_egg', time: 400, xp: 4, cost: 448, level: 16 },
  { id: 'lop_rabbit', name: 'Lop Rabbit', icon: '🐇', house: 'lop_hutch', feed: 'carrot', product: 'lop_fluff', time: 600, xp: 6, cost: 672, level: 24 },
  { id: 'pygmy_goat', name: 'Pygmy Goat', icon: '🐐', house: 'pygmy_yard', feed: 'goat_feed', product: 'pygmy_milk', time: 708, xp: 9, cost: 1008, level: 36 },
  { id: 'brahma_chicken', name: 'Brahma Chicken', icon: '🐓', house: 'brahma_coop', feed: 'chicken_feed', product: 'brahma_egg', time: 738, xp: 12, cost: 1288, level: 46 },
  { id: 'toulouse_goose', name: 'Toulouse Goose', icon: '🪿', house: 'toulouse_pen', feed: 'duck_feed', product: 'toulouse_down', time: 762, xp: 14, cost: 1512, level: 54 },
  { id: 'angus_cow', name: 'Angus Cow', icon: '🐄', house: 'angus_ranch', feed: 'cow_feed', product: 'buttermilk', time: 795, xp: 16, cost: 1820, level: 65 },
  { id: 'polish_chicken', name: 'Polish Chicken', icon: '🐓', house: 'polish_coop', feed: 'chicken_feed', product: 'crest_feather', time: 828, xp: 19, cost: 2128, level: 76 },
  { id: 'valais_blacknose', name: 'Valais Blacknose', icon: '🐑', house: 'valais_fold', feed: 'sheep_feed', product: 'valais_wool', time: 852, xp: 21, cost: 2352, level: 84 },
  { id: 'indian_runner', name: 'Indian Runner Duck', icon: '🦆', house: 'runner_pen', feed: 'duck_feed', product: 'runner_egg', time: 882, xp: 24, cost: 2632, level: 94 },
  { id: 'boer_goat', name: 'Boer Goat', icon: '🐐', house: 'boer_yard', feed: 'goat_feed', product: 'boer_milk', time: 918, xp: 26, cost: 2968, level: 106 },
  { id: 'dorper', name: 'Dorper Sheep', icon: '🐑', house: 'dorper_fold', feed: 'sheep_feed', product: 'dorper_fleece', time: 948, xp: 29, cost: 3248, level: 116 },
  { id: 'charolais', name: 'Charolais Cow', icon: '🐄', house: 'charolais_pasture', feed: 'cow_feed', product: 'creamy_milk', time: 972, xp: 31, cost: 3472, level: 124 },
  { id: 'angora_rabbit', name: 'Angora Rabbit', icon: '🐇', house: 'angora_hutch', feed: 'carrot', product: 'angora_fiber', time: 1008, xp: 34, cost: 3808, level: 136 },
  { id: 'white_peacock', name: 'White Peacock', icon: '🦚', house: 'white_peacock_garden', feed: 'corn', product: 'white_plume', time: 1038, xp: 36, cost: 4088, level: 146 },
  { id: 'appaloosa', name: 'Appaloosa', icon: '🐎', house: 'appaloosa_stable', feed: 'carrot', product: 'show_ribbon', time: 1062, xp: 38, cost: 4312, level: 154 },
  { id: 'mule', name: 'Mule', icon: '🫏', house: 'mule_paddock', feed: 'carrot', product: 'hauled_timber', time: 1095, xp: 41, cost: 4620, level: 165 },
  { id: 'texas_longhorn', name: 'Texas Longhorn', icon: '🐂', house: 'longhorn_ranch', feed: 'cow_feed', product: 'ranch_cream', time: 1128, xp: 44, cost: 4928, level: 176 },
  { id: 'clydesdale', name: 'Clydesdale', icon: '🐴', house: 'clydesdale_stable', feed: 'carrot', product: 'draft_rosette', time: 1152, xp: 46, cost: 5152, level: 184 },
  { id: 'elk', name: 'Elk', icon: '🦌', house: 'elk_woods', feed: 'carrot', product: 'elk_antler', time: 1182, xp: 48, cost: 5432, level: 194 },
  // third wave
  { id: 'leghorn', name: 'Leghorn Hen', icon: '🐔', house: 'leghorn_coop', feed: 'chicken_feed', product: 'white_egg', time: 678, xp: 6, cost: 728, level: 26 },
  { id: 'khaki_campbell', name: 'Khaki Campbell', icon: '🦆', house: 'campbell_pond', feed: 'duck_feed', product: 'campbell_egg', time: 720, xp: 10, cost: 1120, level: 40 },
  { id: 'dutch_rabbit', name: 'Dutch Rabbit', icon: '🐇', house: 'dutch_hutch', feed: 'carrot', product: 'dutch_fluff', time: 759, xp: 13, cost: 1484, level: 53 },
  { id: 'rhode_island_red', name: 'Rhode Island Red', icon: '🐓', house: 'rhode_coop', feed: 'chicken_feed', product: 'red_hen_egg', time: 786, xp: 16, cost: 1736, level: 62 },
  { id: 'guernsey', name: 'Guernsey Cow', icon: '🐄', house: 'guernsey_pasture', feed: 'cow_feed', product: 'golden_milk', time: 819, xp: 18, cost: 2044, level: 73 },
  { id: 'shetland_sheep', name: 'Shetland Sheep', icon: '🐑', house: 'shetland_fold', feed: 'sheep_feed', product: 'shetland_wool', time: 852, xp: 21, cost: 2352, level: 84 },
  { id: 'call_duck', name: 'Call Duck', icon: '🦆', house: 'call_duck_pond', feed: 'duck_feed', product: 'call_duck_down', time: 891, xp: 24, cost: 2716, level: 97 },
  { id: 'alpine_goat', name: 'Alpine Goat', icon: '🐐', house: 'alpine_yard', feed: 'goat_feed', product: 'alpine_milk', time: 930, xp: 28, cost: 3080, level: 110 },
  { id: 'wyandotte', name: 'Wyandotte Hen', icon: '🐔', house: 'wyandotte_coop', feed: 'chicken_feed', product: 'laced_feather', time: 957, xp: 30, cost: 3332, level: 119 },
  { id: 'brown_swiss', name: 'Brown Swiss Cow', icon: '🐄', house: 'swiss_pasture', feed: 'cow_feed', product: 'swiss_cream', time: 993, xp: 33, cost: 3668, level: 131 },
  { id: 'emden_goose', name: 'Emden Goose', icon: '🪿', house: 'emden_pen', feed: 'duck_feed', product: 'emden_down', time: 1029, xp: 36, cost: 4004, level: 143 },
  { id: 'karakul', name: 'Karakul Sheep', icon: '🐑', house: 'karakul_fold', feed: 'sheep_feed', product: 'karakul_wool', time: 1062, xp: 38, cost: 4312, level: 154 },
  { id: 'palomino', name: 'Palomino', icon: '🐎', house: 'palomino_stable', feed: 'carrot', product: 'golden_ribbon', time: 1092, xp: 41, cost: 4592, level: 164 },
  { id: 'marans', name: 'Marans Hen', icon: '🐔', house: 'marans_coop', feed: 'chicken_feed', product: 'chocolate_egg', time: 1119, xp: 43, cost: 4844, level: 173 },
  { id: 'dexter', name: 'Dexter Cow', icon: '🐄', house: 'dexter_pasture', feed: 'cow_feed', product: 'dexter_butter', time: 1155, xp: 46, cost: 5180, level: 185 },
  { id: 'friesian', name: 'Friesian Horse', icon: '🐴', house: 'friesian_stable', feed: 'carrot', product: 'black_plume', time: 1191, xp: 49, cost: 5516, level: 197 },
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

  b({ id: 'house', name: 'Farmhouse', icon: '🏡', kind: 'house', w: 2, h: 2, buyable: false, height: 58, wall: '#f7f4ee', roof: '#7a4a2e', desc: 'Your home. Open it to see your goals.' }),
  b({ id: 'manor', name: 'Manor', icon: '🏰', kind: 'house', w: 3, h: 3, cost: 4000, level: 8, xp: 80, height: 92, wall: '#f4ead8', roof: '#3f5f8a', desc: 'A grand home for your farmer, who rests here at night.' }),
  b({ id: 'barn', name: 'Barn', icon: '🏚️', kind: 'barn', w: 2, h: 2, cost: 5000, level: 8, xp: 60, height: 64, wall: '#c0392b', roof: '#5d3a1f', desc: 'Stores goods and animal products. Each extra barn adds half your barn space again.' }),
  b({ id: 'silo', name: 'Silo', icon: '🌾', kind: 'silo', cost: 5000, level: 8, xp: 60, height: 88, wall: '#d7dbe0', roof: '#c0392b', desc: 'Stores crops. Each extra silo adds half your silo space again.' }),
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

  b({ id: 'apple_tree', name: 'Apple Tree', icon: '🍎', kind: 'tree', cost: 150, level: 6, max: 12, xp: 5, height: 64, sellable: true, fruit: 'apple', growTime: 240, desc: 'Gives 2 apples again and again.' }),
  b({ id: 'cherry_tree', name: 'Cherry Tree', icon: '🍒', kind: 'tree', cost: 300, level: 9, max: 12, xp: 8, height: 64, sellable: true, fruit: 'cherry', growTime: 360, desc: 'Gives 2 cherries again and again.' }),
  b({ id: 'peach_tree', name: 'Peach Tree', icon: '🍑', kind: 'tree', cost: 380, level: 10, max: 12, xp: 9, height: 64, sellable: true, fruit: 'peach', growTime: 420, desc: 'Gives 2 peaches again and again.' }),
  b({ id: 'lemon_tree', name: 'Lemon Tree', icon: '🍋', kind: 'tree', cost: 520, level: 13, max: 12, xp: 11, height: 64, sellable: true, fruit: 'lemon', growTime: 540, desc: 'Gives 2 lemons again and again.' }),
  b({ id: 'coconut_palm', name: 'Coconut Palm', icon: '🥥', kind: 'tree', beach: true, cost: 700, level: 16, max: 10, xp: 14, height: 80, sellable: true, fruit: 'coconut', growTime: 660, desc: 'A tall palm that gives 2 coconuts again and again.' }),
  b({ id: 'pear_tree', name: 'Pear Tree', icon: '🍐', kind: 'tree', cost: 260, level: 8, max: 12, xp: 7, height: 64, sellable: true, fruit: 'pear', growTime: 330, desc: 'Gives 2 pears again and again.' }),
  b({ id: 'plum_tree', name: 'Plum Tree', icon: '@plum', kind: 'tree', cost: 480, level: 12, max: 12, xp: 10, height: 64, sellable: true, fruit: 'plum', growTime: 500, desc: 'Gives 2 plums again and again.' }),
  b({ id: 'banana_tree', name: 'Banana Tree', icon: '🍌', kind: 'tree', cost: 620, level: 15, max: 10, xp: 13, height: 80, sellable: true, fruit: 'banana', growTime: 600, desc: 'Big leaves and a heavy bunch of bananas.' }),
  b({ id: 'mango_tree', name: 'Mango Tree', icon: '🥭', kind: 'tree', cost: 760, level: 17, max: 10, xp: 15, height: 70, sellable: true, fruit: 'mango', growTime: 700, desc: 'Gives 2 mangoes again and again.' }),
  b({ id: 'avocado_tree', name: 'Avocado Tree', icon: '🥑', kind: 'tree', cost: 820, level: 18, max: 10, xp: 16, height: 70, sellable: true, fruit: 'avocado', growTime: 760, desc: 'Gives 2 avocados again and again.' }),
  b({ id: 'pomegranate_tree', name: 'Pomegranate Tree', icon: '@pomegranate', kind: 'tree', cost: 900, level: 19, max: 10, xp: 17, height: 66, sellable: true, fruit: 'pomegranate', growTime: 820, desc: 'Gives 2 pomegranates again and again.' }),
  b({ id: 'apricot_tree', name: 'Apricot Tree', icon: '@apricot', kind: 'tree', cost: 340, level: 9, max: 12, xp: 8, height: 64, sellable: true, fruit: 'apricot', growTime: 380, desc: 'Gives 2 apricots again and again.' }),
  b({ id: 'lime_tree', name: 'Lime Tree', icon: '@lime', kind: 'tree', cost: 560, level: 14, max: 12, xp: 12, height: 64, sellable: true, fruit: 'lime', growTime: 560, desc: 'Gives 2 limes again and again.' }),
  b({ id: 'fig_tree', name: 'Fig Tree', icon: '@fig', kind: 'tree', cost: 680, level: 16, max: 10, xp: 14, height: 66, sellable: true, fruit: 'fig', growTime: 640, desc: 'Gives 2 figs again and again.' }),
  b({ id: 'olive_tree', name: 'Olive Tree', icon: '🫒', kind: 'tree', cost: 740, level: 17, max: 10, xp: 15, height: 66, sellable: true, fruit: 'olive', growTime: 680, desc: 'A silvery old tree that gives 2 olives again and again.' }),
  b({ id: 'walnut_tree', name: 'Walnut Tree', icon: '@walnut', kind: 'tree', cost: 980, level: 20, max: 10, xp: 18, height: 78, sellable: true, fruit: 'walnut', growTime: 900, desc: 'A tall tree that gives 2 walnuts again and again.' }),
  b({ id: 'quince_tree', name: 'Quince Tree', icon: '@quince', kind: 'tree', cost: 1100, level: 23, max: 8, xp: 19, height: 70, sellable: true, fruit: 'quince', growTime: 960, desc: 'Gives 2 fragrant golden quinces again and again.' }),
  b({ id: 'almond_tree', name: 'Almond Tree', icon: '@almond', kind: 'tree', cost: 1300, level: 27, max: 8, xp: 21, height: 70, sellable: true, fruit: 'almond', growTime: 1000, desc: 'Gives 2 almonds again and again.' }),
  b({ id: 'mulberry_tree', name: 'Mulberry Tree', icon: '@mulberry', kind: 'tree', cost: 1600, level: 34, max: 8, xp: 24, height: 70, sellable: true, fruit: 'mulberry', growTime: 1080, desc: 'Gives 2 handfuls of mulberries again and again.' }),
  b({ id: 'grapefruit_tree', name: 'Grapefruit Tree', icon: '@grapefruit', kind: 'tree', cost: 1900, level: 41, max: 8, xp: 27, height: 70, sellable: true, fruit: 'grapefruit', growTime: 1150, desc: 'Gives 2 big grapefruits again and again.' }),
  b({ id: 'persimmon_tree', name: 'Persimmon Tree', icon: '@persimmon', kind: 'tree', cost: 2400, level: 50, max: 8, xp: 31, height: 70, sellable: true, fruit: 'persimmon', growTime: 1240, desc: 'Gives 2 sweet persimmons again and again.' }),
  b({ id: 'date_palm', name: 'Date Palm', icon: '@date', kind: 'tree', beach: true, cost: 3000, level: 60, max: 8, xp: 35, height: 80, sellable: true, fruit: 'date', growTime: 1320, desc: 'A desert palm heavy with sticky dates.' }),
  b({ id: 'lychee_tree', name: 'Lychee Tree', icon: '@lychee', kind: 'tree', cost: 3800, level: 72, max: 8, xp: 40, height: 70, sellable: true, fruit: 'lychee', growTime: 1420, desc: 'Gives 2 bunches of lychees again and again.' }),
  b({ id: 'hazelnut_tree', name: 'Hazelnut Tree', icon: '@hazelnut', kind: 'tree', cost: 4700, level: 84, max: 8, xp: 45, height: 70, sellable: true, fruit: 'hazelnut', growTime: 1520, desc: 'Gives 2 hazelnuts again and again.' }),
  b({ id: 'starfruit_tree', name: 'Starfruit Tree', icon: '@starfruit', kind: 'tree', cost: 5800, level: 98, max: 8, xp: 51, height: 70, sellable: true, fruit: 'starfruit', growTime: 1640, desc: 'Gives 2 star shaped fruits again and again.' }),
  b({ id: 'maple_tree', name: 'Maple Tree', icon: '@maple_syrup', kind: 'tree', cost: 7200, level: 112, max: 8, xp: 57, height: 70, sellable: true, fruit: 'maple_syrup', growTime: 1760, desc: 'A blazing red maple. Tap it for sweet syrup.' }),
  b({ id: 'cocoa_tree', name: 'Cocoa Tree', icon: '@cocoa_pod', kind: 'tree', cost: 9500, level: 132, max: 8, xp: 65, height: 70, sellable: true, fruit: 'cocoa_pod', growTime: 1900, desc: 'Ribbed cocoa pods grow right on the trunk.' }),
  b({ id: 'sakura_tree', name: 'Cherry Blossom Tree', icon: '@sakura', kind: 'tree', cost: 13000, level: 165, max: 8, xp: 78, height: 70, sellable: true, fruit: 'sakura', growTime: 2100, desc: 'A dream in pink. Gives 2 blossom sprays again and again.' }),
  b({ id: 'golden_apple_tree', name: 'Golden Apple Tree', icon: '@golden_apple', kind: 'tree', cost: 20000, level: 195, max: 8, xp: 95, height: 70, sellable: true, fruit: 'golden_apple', growTime: 2400, desc: 'A legendary tree that grows apples of pure gold.' }),
  b({ id: 'orange_tree', name: 'Orange Tree', icon: '🍊', kind: 'tree', cost: 450, level: 11, max: 12, xp: 10, height: 64, sellable: true, fruit: 'orange', growTime: 480, desc: 'Gives 2 oranges again and again.' }),

  b({ id: 'guinea_run', name: 'Guinea Fowl Run', icon: '@guinea_fowl', kind: 'pen', w: 2, h: 2, cost: 2800, level: 22, xp: 70, height: 26, wall: '#c9a46a', roof: '#6b8a3a', animal: 'guinea_fowl', capacity: 6, desc: 'Busy spotted birds that lay speckled eggs.' }),
  b({ id: 'pheasant_run', name: 'Pheasant Run', icon: '@pheasant', kind: 'pen', w: 3, h: 2, cost: 4200, level: 30, xp: 90, height: 26, wall: '#8fc45a', roof: '#8a3a2a', animal: 'pheasant', capacity: 5, desc: 'Handsome pheasants with long copper tail feathers.' }),
  b({ id: 'highland_pasture', name: 'Highland Pasture', icon: '@highland_cow', kind: 'pen', w: 3, h: 2, cost: 5500, level: 38, xp: 110, height: 26, wall: '#86c24f', roof: '#5a3a24', animal: 'highland_cow', capacity: 5, desc: 'Shaggy ginger cattle that give rich fresh cream.' }),
  b({ id: 'swan_lake', name: 'Swan Lake', icon: '🦢', kind: 'pen', w: 3, h: 2, cost: 7000, level: 47, xp: 130, height: 26, wall: '#8fc45a', roof: '#f4efe6', animal: 'swan', capacity: 4, desc: 'Graceful swans glide on the lake and shed soft down.' }),
  b({ id: 'emu_ranch', name: 'Emu Ranch', icon: '@emu', kind: 'pen', w: 3, h: 2, cost: 8500, level: 56, xp: 150, height: 26, wall: '#d8c38e', roof: '#7a5a3a', animal: 'emu', capacity: 4, desc: 'Curious emus lay deep green eggs.' }),
  b({ id: 'reindeer_lodge', name: 'Reindeer Lodge', icon: '🦌', kind: 'pen', w: 3, h: 2, cost: 11000, level: 68, xp: 180, height: 26, wall: '#e8f0f4', roof: '#8a2a2a', animal: 'reindeer', capacity: 4, desc: 'A snowy lodge for reindeer. They love carrots.' }),
  b({ id: 'bison_range', name: 'Bison Range', icon: '🦬', kind: 'pen', w: 3, h: 2, cost: 14000, level: 82, xp: 210, height: 26, wall: '#b8a46c', roof: '#4a3424', animal: 'bison', capacity: 4, desc: 'Mighty bison grow thick warm wool.' }),
  b({ id: 'flamingo_lagoon', name: 'Flamingo Lagoon', icon: '🦩', kind: 'pen', w: 3, h: 2, cost: 18000, level: 96, xp: 240, height: 26, wall: '#8fc45a', roof: '#f28ab0', animal: 'flamingo', capacity: 4, desc: 'Pink flamingos wade in a warm lagoon.' }),
  b({ id: 'llama_ranch', name: 'Llama Ranch', icon: '@llama', kind: 'pen', w: 3, h: 2, cost: 23000, level: 118, xp: 280, height: 26, wall: '#8fc45a', roof: '#c0392b', animal: 'llama', capacity: 4, desc: 'Proud llamas in bright tassels grow fine wool.' }),
  b({ id: 'silkie_coop', name: 'Silkie Coop', icon: '@silkie_chicken', kind: 'pen', w: 2, h: 2, cost: 6700, level: 21, xp: 98, height: 26, wall: '#e3cf94', roof: '#e88aa8', animal: 'silkie_chicken', capacity: 6, desc: 'Fluffy silkie hens lay small cream eggs.' }),
  b({ id: 'pony_paddock', name: 'Pony Paddock', icon: '🐴', kind: 'pen', w: 3, h: 2, cost: 7300, level: 24, xp: 103, height: 26, wall: '#9ccc5a', roof: '#c0392b', animal: 'pony', capacity: 4, desc: 'Shetland ponies give creamy milk. They love carrots.' }),
  b({ id: 'black_sheepfold', name: 'Black Sheep Fold', icon: '@black_sheep', kind: 'pen', w: 3, h: 2, cost: 7700, level: 26, xp: 107, height: 26, wall: '#9ccc5a', roof: '#34495e', animal: 'black_sheep', capacity: 5, desc: 'Every flock needs one. Gives soft black wool.' }),
  b({ id: 'jersey_pasture', name: 'Jersey Pasture', icon: '🐮', kind: 'pen', w: 3, h: 2, cost: 8100, level: 28, xp: 110, height: 26, wall: '#86c24f', roof: '#8a5a34', animal: 'jersey_cow', capacity: 5, desc: 'Gentle fawn cows with big eyes and rich milk.' }),
  b({ id: 'muscovy_pond', name: 'Muscovy Pond', icon: '@muscovy_duck', kind: 'pen', w: 3, h: 2, cost: 8500, level: 30, xp: 114, height: 26, wall: '#8fc45a', roof: '#2e6da4', animal: 'muscovy_duck', capacity: 5, desc: 'Hardy ducks with red faces. They lay big eggs.' }),
  b({ id: 'nubian_yard', name: 'Nubian Goat Yard', icon: '@nubian_goat', kind: 'pen', w: 3, h: 2, cost: 9100, level: 33, xp: 119, height: 26, wall: '#b8a46c', roof: '#8a3a2a', animal: 'nubian_goat', capacity: 5, desc: 'Long eared goats with creamy milk.' }),
  b({ id: 'silk_house', name: 'Silk House', icon: '🐛', kind: 'pen', w: 2, h: 2, cost: 9700, level: 36, xp: 125, height: 26, wall: '#f4efe6', roof: '#b5452c', animal: 'silkworm', capacity: 6, desc: 'Silkworms munch mulberry leaves and spin silk.' }),
  b({ id: 'angora_yard', name: 'Angora Goat Yard', icon: '@angora_goat', kind: 'pen', w: 3, h: 2, cost: 10300, level: 39, xp: 130, height: 26, wall: '#b8a46c', roof: '#6b4226', animal: 'angora_goat', capacity: 5, desc: 'Curly locked goats that grow shiny mohair.' }),
  b({ id: 'mandarin_pond', name: 'Mandarin Pond', icon: '@mandarin_duck', kind: 'pen', w: 3, h: 2, cost: 11100, level: 43, xp: 137, height: 26, wall: '#8fc45a', roof: '#c0392b', animal: 'mandarin_duck', capacity: 5, desc: 'The most colorful duck on the water.' }),
  b({ id: 'squirrel_grove', name: 'Squirrel Grove', icon: '🐿️', kind: 'pen', w: 2, h: 2, cost: 11700, level: 46, xp: 143, height: 26, wall: '#86c24f', roof: '#6b4226', animal: 'squirrel', capacity: 4, desc: 'Busy squirrels gather acorns. They love walnuts.' }),
  b({ id: 'merino_fold', name: 'Merino Fold', icon: '@merino_sheep', kind: 'pen', w: 3, h: 2, cost: 12300, level: 49, xp: 148, height: 26, wall: '#9ccc5a', roof: '#5a7a9a', animal: 'merino_sheep', capacity: 5, desc: 'The finest wool in the world grows on merinos.' }),
  b({ id: 'parrot_aviary', name: 'Parrot Aviary', icon: '🦜', kind: 'pen', w: 2, h: 2, cost: 13100, level: 53, xp: 155, height: 26, wall: '#8fc45a', roof: '#2a8a5a', animal: 'parrot', capacity: 4, desc: 'Chatty parrots drop bright feathers. They love bananas.' }),
  b({ id: 'galloway_pasture', name: 'Galloway Pasture', icon: '@belted_galloway', kind: 'pen', w: 3, h: 2, cost: 14100, level: 58, xp: 164, height: 26, wall: '#86c24f', roof: '#34495e', animal: 'belted_galloway', capacity: 5, desc: 'Fluffy black cattle with a white belt.' }),
  b({ id: 'moose_woods', name: 'Moose Woods', icon: '@moose', kind: 'pen', w: 3, h: 2, cost: 15100, level: 63, xp: 173, height: 26, wall: '#86c24f', roof: '#5a3a24', animal: 'moose', capacity: 4, desc: 'Giant gentle moose. Their milk makes rare cheese.' }),
  b({ id: 'cashmere_yard', name: 'Cashmere Goat Yard', icon: '@cashmere_goat', kind: 'pen', w: 3, h: 2, cost: 15900, level: 67, xp: 181, height: 26, wall: '#b8a46c', roof: '#8a6a4a', animal: 'cashmere_goat', capacity: 5, desc: 'Mountain goats with the softest undercoat.' }),
  b({ id: 'rhea_ranch', name: 'Rhea Ranch', icon: '@rhea', kind: 'pen', w: 3, h: 2, cost: 16700, level: 71, xp: 188, height: 26, wall: '#d8c38e', roof: '#7a5a3a', animal: 'rhea', capacity: 4, desc: 'Big grey birds from the pampas lay huge eggs.' }),
  b({ id: 'bactrian_corral', name: 'Bactrian Corral', icon: '🐫', kind: 'pen', w: 3, h: 2, cost: 17700, level: 76, xp: 197, height: 26, wall: '#e2cf98', roof: '#b5452c', animal: 'bactrian_camel', capacity: 4, desc: 'Two humps and a thick winter coat of wool.' }),
  b({ id: 'beaver_pond', name: 'Beaver Pond', icon: '🦫', kind: 'pen', w: 3, h: 2, cost: 18500, level: 80, xp: 204, height: 26, wall: '#8fc45a', roof: '#6b4226', animal: 'beaver', capacity: 4, desc: 'Hard working beavers cut timber by their dam.' }),
  b({ id: 'jacob_fold', name: 'Jacob Fold', icon: '@jacob_sheep', kind: 'pen', w: 3, h: 2, cost: 19700, level: 86, xp: 215, height: 26, wall: '#9ccc5a', roof: '#6b4226', animal: 'jacob_sheep', capacity: 5, desc: 'Spotted sheep with four curling horns.' }),
  b({ id: 'deer_park', name: 'Deer Park', icon: '@spotted_deer', kind: 'pen', w: 3, h: 2, cost: 20900, level: 92, xp: 226, height: 26, wall: '#86c24f', roof: '#5a3a24', animal: 'spotted_deer', capacity: 4, desc: 'Graceful deer shed their antlers each year.' }),
  b({ id: 'crane_marsh', name: 'Crane Marsh', icon: '@crane', kind: 'pen', w: 3, h: 2, cost: 22100, level: 98, xp: 236, height: 26, wall: '#8fc45a', roof: '#f4efe6', animal: 'crane', capacity: 4, desc: 'Elegant cranes dance in the marsh.' }),
  b({ id: 'zebu_pasture', name: 'Zebu Pasture', icon: '@zebu', kind: 'pen', w: 3, h: 2, cost: 23300, level: 104, xp: 247, height: 26, wall: '#c9b27a', roof: '#b5452c', animal: 'zebu', capacity: 4, desc: 'Humped cattle that thrive in the heat.' }),
  b({ id: 'musk_ox_range', name: 'Musk Ox Range', icon: '@musk_ox', kind: 'pen', w: 3, h: 2, cost: 24900, level: 112, xp: 262, height: 26, wall: '#eef3f6', roof: '#4a3424', animal: 'musk_ox', capacity: 4, desc: 'Shaggy arctic giants with priceless qiviut wool.' }),
  b({ id: 'black_swan_lake', name: 'Black Swan Lake', icon: '@black_swan', kind: 'pen', w: 3, h: 2, cost: 26500, level: 120, xp: 276, height: 26, wall: '#8fc45a', roof: '#34495e', animal: 'black_swan', capacity: 4, desc: 'Rare black swans with ruby red bills.' }),
  b({ id: 'cassowary_ranch', name: 'Cassowary Ranch', icon: '@cassowary', kind: 'pen', w: 3, h: 2, cost: 28100, level: 128, xp: 290, height: 26, wall: '#8fc45a', roof: '#2a6a8a', animal: 'cassowary', capacity: 4, desc: 'Striking birds with a helmet crest and bright green eggs.' }),
  b({ id: 'watusi_ranch', name: 'Watusi Ranch', icon: '@watusi', kind: 'pen', w: 3, h: 2, cost: 29700, level: 136, xp: 305, height: 26, wall: '#c9b27a', roof: '#8a3a2a', animal: 'watusi', capacity: 4, desc: 'Cattle with the biggest horns in the world.' }),
  b({ id: 'chinchilla_hutch', name: 'Chinchilla Hutch', icon: '@chinchilla', kind: 'pen', w: 2, h: 2, cost: 31500, level: 145, xp: 321, height: 26, wall: '#86c24f', roof: '#7a8aa0', animal: 'chinchilla', capacity: 5, desc: 'Round eared puffballs leave soft fluff after dust baths.' }),
  b({ id: 'owl_barn', name: 'Owl Barn', icon: '🦉', kind: 'pen', w: 2, h: 2, cost: 33500, level: 155, xp: 339, height: 26, wall: '#86c24f', roof: '#8a5a34', animal: 'barn_owl', capacity: 4, desc: 'Barn owls keep the farm free of mice.' }),
  b({ id: 'kiwi_burrow', name: 'Kiwi Burrow', icon: '@kiwi_bird', kind: 'pen', w: 2, h: 2, cost: 36100, level: 168, xp: 362, height: 26, wall: '#86c24f', roof: '#6b4226', animal: 'kiwi_bird', capacity: 4, desc: 'Shy round birds that lay enormous eggs.' }),
  b({ id: 'vicuna_ranch', name: 'Vicuna Ranch', icon: '@vicuna', kind: 'pen', w: 3, h: 2, cost: 38900, level: 182, xp: 388, height: 26, wall: '#d8c38e', roof: '#c0392b', animal: 'vicuna', capacity: 4, desc: 'Wild cousins of the llama. The rarest wool of all.' }),
  b({ id: 'golden_nest', name: 'Golden Nest', icon: '@golden_goose', kind: 'pen', w: 2, h: 2, cost: 50000, level: 200, xp: 500, height: 26, wall: '#e8c865', roof: '#d4a020', animal: 'golden_goose', capacity: 2, desc: 'The legend itself: a goose that lays golden eggs.' }),
  b({ id: 'coop', name: 'Chicken Coop', icon: '🐔', kind: 'pen', w: 2, h: 2, cost: 150, level: 2, xp: 10, height: 26, wall: '#e3cf94', roof: '#b5452c', animal: 'chicken', capacity: 6, desc: 'Home for up to 6 chickens.' }),
  b({ id: 'pasture', name: 'Cow Pasture', icon: '🐄', kind: 'pen', w: 3, h: 2, cost: 400, level: 5, xp: 20, height: 26, wall: '#9ccc5a', roof: '#6b4226', animal: 'cow', capacity: 5, desc: 'Home for up to 5 cows.' }),
  b({ id: 'sheepfold', name: 'Sheep Fold', icon: '🐑', kind: 'pen', w: 3, h: 2, cost: 1800, level: 10, xp: 50, height: 26, wall: '#b7d77a', roof: '#2e6da4', animal: 'sheep', capacity: 5, desc: 'Home for up to 5 sheep.' }),

  b({ id: 'duck_pond', name: 'Duck Pond', icon: '🦆', kind: 'pen', w: 3, h: 2, cost: 300, level: 6, xp: 15, height: 26, wall: '#8fc45a', roof: '#2e6da4', animal: 'duck', capacity: 5, desc: 'Home for up to 5 ducks.' }),
  b({ id: 'goat_yard', name: 'Goat Yard', icon: '🐐', kind: 'pen', w: 3, h: 2, cost: 1500, level: 12, xp: 45, height: 26, wall: '#b5a36a', roof: '#7a4b26', animal: 'goat', capacity: 5, desc: 'Home for up to 5 goats.' }),
  b({ id: 'beehive', name: 'Bee Garden', icon: '🐝', kind: 'pen', w: 2, h: 2, cost: 1600, level: 13, xp: 45, height: 26, wall: '#9ccc5a', roof: '#f5b92b', animal: 'bee', capacity: 4, desc: 'Up to 4 hives. Bees love sunflowers.' }),
  b({ id: 'rabbit_hutch', name: 'Rabbit Hutch', icon: '🐇', kind: 'pen', w: 2, h: 2, cost: 900, level: 9, xp: 35, height: 26, wall: '#d9b98a', roof: '#c0392b', animal: 'rabbit', capacity: 5, desc: 'Fluffy rabbits give soft angora fur. They love carrots.' }),
  b({ id: 'alpaca_ranch', name: 'Alpaca Ranch', icon: '🦙', kind: 'pen', w: 3, h: 2, cost: 2200, level: 14, xp: 55, height: 26, wall: '#a8cf6a', roof: '#7d5ba6', animal: 'alpaca', capacity: 5, desc: 'Alpacas grow warm wool. Feed them wheat.' }),
  b({ id: 'goose_pen', name: 'Goose Green', icon: '🪿', kind: 'pen', w: 2, h: 2, cost: 1200, level: 11, xp: 40, height: 26, wall: '#9ccc5a', roof: '#3f7fbf', animal: 'goose', capacity: 5, desc: 'Geese lay big eggs for tarts and cakes. They eat duck feed.' }),
  b({ id: 'gobbler_run', name: 'Gobbler Run', icon: '🦃', kind: 'pen', w: 2, h: 2, cost: 1100, level: 10, xp: 40, height: 26, wall: '#c9a46a', roof: '#8e4a2b', animal: 'gobbler', capacity: 5, desc: 'Gobblers shed fine feathers for quill pens. They eat chicken feed.' }),
  b({ id: 'donkey_paddock', name: 'Donkey Paddock', icon: '🫏', kind: 'pen', w: 3, h: 2, cost: 1900, level: 13, xp: 50, height: 26, wall: '#b8a46c', roof: '#6b4226', animal: 'donkey', capacity: 5, desc: 'Gentle donkeys give milk for soap. They love carrots.' }),
  b({ id: 'buffalo_wallow', name: 'Buffalo Wallow', icon: '🐃', kind: 'pen', w: 3, h: 2, cost: 2600, level: 15, xp: 60, height: 26, wall: '#8a6a44', roof: '#4a6a3a', animal: 'buffalo', capacity: 5, desc: 'Water buffalo give rich milk for mozzarella.' }),
  b({ id: 'peacock_garden', name: 'Peacock Garden', icon: '🦚', kind: 'pen', w: 2, h: 2, cost: 3000, level: 17, xp: 65, height: 26, wall: '#9ccc5a', roof: '#2e7d8a', animal: 'peacock', capacity: 4, desc: 'Peacocks drop dazzling feathers. They eat corn.' }),
  b({ id: 'ostrich_ranch', name: 'Ostrich Ranch', icon: '🦤', kind: 'pen', w: 3, h: 2, cost: 3500, level: 19, xp: 75, height: 26, wall: '#d8c38e', roof: '#b5452c', animal: 'ostrich', capacity: 4, desc: 'Ostriches lay giant eggs. They eat wheat.' }),
  b({ id: 'quail_coop', name: 'Quail Coop', icon: '🐦', kind: 'pen', w: 2, h: 2, cost: 950, level: 9, xp: 35, height: 26, wall: '#e8d8b0', roof: '#6b8a3a', animal: 'quail', capacity: 6, desc: 'Tiny quails lay speckled eggs. They eat chicken feed.' }),
  b({ id: 'yak_pasture', name: 'Yak Pasture', icon: '🐂', kind: 'pen', w: 3, h: 2, cost: 3200, level: 18, xp: 70, height: 26, wall: '#9ccc5a', roof: '#5a3a2a', animal: 'yak', capacity: 4, desc: 'Shaggy yaks grow thick wool for warm blankets.' }),
  b({ id: 'camel_corral', name: 'Camel Corral', icon: '🐪', kind: 'pen', w: 3, h: 2, cost: 3800, level: 20, xp: 80, height: 26, wall: '#e2cf98', roof: '#c0602a', animal: 'camel', capacity: 4, desc: 'Camels give creamy milk for a rare cheese. They eat wheat.' }),
  b({ id: 'stable', name: 'Stable', icon: '🐎', kind: 'pen', w: 3, h: 2, cost: 2500, level: 15, xp: 60, height: 26, wall: '#c2a36b', roof: '#8e2c20', animal: 'horse', capacity: 5, desc: 'Up to 5 horses. Each horse adds 5% to order coins.' }),
  b({ id: 'salad_bar', name: 'Salad Bar', icon: '🥙', kind: 'production', w: 2, h: 2, cost: 1300, level: 10, xp: 45, height: 52, wall: '#e9f7dc', roof: '#5aa83a', desc: 'Tosses fresh garden and fruit salads.' }),
  b({ id: 'pizzeria', name: 'Pizzeria', icon: '🍕', kind: 'production', w: 2, h: 2, cost: 2400, level: 12, xp: 60, height: 58, wall: '#f7e1c4', roof: '#c0392b', desc: 'A wood fired oven for pizzas.' }),
  b({ id: 'coffee_kiosk', name: 'Coffee Kiosk', icon: '☕', kind: 'production', w: 2, h: 2, cost: 2800, level: 13, xp: 65, height: 54, wall: '#efe0cf', roof: '#6b4226', desc: 'Brews lemonade, espresso and lattes.' }),
  b({ id: 'oil_press', name: 'Olive Press', icon: '@olive_oil', kind: 'production', w: 2, h: 2, cost: 3400, level: 17, xp: 70, height: 56, wall: '#efe4cc', roof: '#6a7a3a', desc: 'Presses olives into oil and blends pesto.' }),
  b({ id: 'florist', name: 'Flower Shop', icon: '💐', kind: 'production', w: 2, h: 2, cost: 1600, level: 11, xp: 50, height: 54, wall: '#fbe8ef', roof: '#d8568a', desc: 'Ties bouquets, sachets and flower crowns.' }),
  b({ id: 'workshop', name: 'Workshop', icon: '🛠️', kind: 'production', w: 2, h: 2, cost: 3000, level: 16, xp: 70, height: 58, wall: '#e8d3a8', roof: '#4a6a8a', desc: 'Crafts candles and pillows.' }),

  b({ id: 'hay_bale', name: 'Hay Bale', icon: '🌾', kind: 'deco', cost: 15, level: 1, max: 30, xp: 1, height: 18, sellable: true, desc: 'A cozy stack of hay.' }),
  b({ id: 'oak', name: 'Oak Tree', icon: '🌳', kind: 'deco', cost: 25, level: 1, max: 30, xp: 2, height: 62, sellable: true, desc: 'Shade for a sunny farm.' }),
  b({ id: 'picket_fence', name: 'Picket Fence', icon: '🤍', kind: 'deco', cost: 10, level: 2, max: 80, xp: 1, height: 16, sellable: true, desc: 'A white picket fence panel.' }),
  b({ id: 'dirt_path', name: 'Dirt Path', icon: '🟫', kind: 'deco', cost: 5, level: 1, max: 300, xp: 1, height: 1, sellable: true, desc: 'A packed earth path. Joins up with the path tiles next to it.' }),
  b({ id: 'stone_path', name: 'Stone Path', icon: '🪨', kind: 'deco', cost: 8, level: 2, max: 120, xp: 1, height: 2, sellable: true, desc: 'Stepping stones for a tidy path.' }),
  b({ id: 'bird_house', name: 'Bird House', icon: '🐦', kind: 'deco', cost: 50, level: 4, max: 10, xp: 3, height: 50, sellable: true, desc: 'Little birds come and go all day.' }),
  b({ id: 'pumpkin_pile', name: 'Pumpkin Pile', icon: '🎃', kind: 'deco', cost: 40, level: 5, max: 20, xp: 2, height: 20, sellable: true, desc: 'A cheerful harvest heap.' }),
  b({ id: 'birdbath', name: 'Bird Bath', icon: '🕊️', kind: 'deco', cost: 90, level: 6, max: 6, xp: 4, height: 30, sellable: true, desc: 'Birds stop by for a splash.' }),
  b({ id: 'topiary', name: 'Topiary', icon: '🌳', kind: 'deco', cost: 110, level: 8, max: 12, xp: 5, height: 50, sellable: true, desc: 'A neatly clipped hedge sculpture.' }),
  b({ id: 'well', name: 'Water Well', icon: '🪣', kind: 'deco', cost: 220, level: 1, max: 3, xp: 8, height: 60, sellable: true, desc: 'Tap it to fill your bucket, then water your fields. Every farm gets one.' }),
  b({ id: 'sprinkler', name: 'Sprinkler', icon: '💦', kind: 'deco', cost: 1500, level: 18, max: 8, xp: 25, height: 30, sellable: true, desc: 'Waters every field within two tiles, all by itself.' }),
  b({ id: 'flower_arch', name: 'Flower Arch', icon: '🌸', kind: 'deco', cost: 260, level: 10, max: 4, xp: 10, height: 70, sellable: true, desc: 'A rose covered garden arch.' }),
  b({ id: 'hay_wagon', name: 'Hay Wagon', icon: '🛒', kind: 'deco', w: 2, h: 1, cost: 380, level: 12, max: 3, xp: 14, height: 44, sellable: true, desc: 'A wooden wagon piled with hay.' }),
  b({ id: 'tractor', name: 'Tractor', icon: '🚜', kind: 'deco', w: 2, h: 2, cost: 1500, level: 15, max: 1, xp: 45, height: 60, sellable: true, desc: 'A shiny red farm tractor.' }),
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
  b({ id: 'tangerine_tree', name: 'Tangerine Tree', icon: '🍊', kind: 'tree', cost: 2610, level: 29, max: 8, xp: 13, height: 64, sellable: true, fruit: 'tangerine', growTime: 1374, desc: 'Gives 2 tangerines again and again.' }),
  b({ id: 'sundial', name: 'Sundial', icon: '☀️', kind: 'deco', w: 1, h: 1, cost: 1860, level: 31, max: 4, xp: 9, height: 34, sellable: true, desc: 'Tells the time by the sun.' }),
  b({ id: 'bird_feeder', name: 'Bird Feeder', icon: '🐦', kind: 'deco', w: 1, h: 1, cost: 2400, level: 40, max: 4, xp: 12, height: 60, sellable: true, desc: 'Little birds drop by for seeds.' }),
  b({ id: 'nectarine_tree', name: 'Nectarine Tree', icon: '🍑', kind: 'tree', cost: 3780, level: 42, max: 8, xp: 19, height: 64, sellable: true, fruit: 'nectarine', growTime: 1452, desc: 'Gives 2 nectarines again and again.' }),
  b({ id: 'hereford_ranch', name: 'Hereford Ranch', icon: '🐄', kind: 'pen', w: 3, h: 2, cost: 9000, level: 45, xp: 68, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'hereford', capacity: 5, desc: 'Home for up to 5 hereford cows.' }),
  b({ id: 'chestnut_tree', name: 'Chestnut Tree', icon: '🌰', kind: 'tree', cost: 4590, level: 51, max: 8, xp: 23, height: 64, sellable: true, fruit: 'chestnut', growTime: 1506, desc: 'Gives 2 chestnuts again and again.' }),
  b({ id: 'garden_swing', name: 'Garden Swing', icon: '🪢', kind: 'deco', w: 1, h: 1, cost: 3120, level: 52, max: 4, xp: 16, height: 54, sellable: true, desc: 'A wooden swing under a little frame.' }),
  b({ id: 'bonfire', name: 'Bonfire', icon: '🔥', kind: 'deco', w: 1, h: 1, cost: 3540, level: 59, max: 4, xp: 18, height: 24, sellable: true, desc: 'A crackling campfire ringed with stones.' }),
  b({ id: 'papaya_tree', name: 'Papaya Tree', icon: '🍈', kind: 'tree', cost: 5490, level: 61, max: 8, xp: 27, height: 64, sellable: true, fruit: 'papaya', growTime: 1566, desc: 'Gives 2 papayas again and again.' }),
  b({ id: 'suffolk_fold', name: 'Suffolk Fold', icon: '🐑', kind: 'pen', w: 3, h: 2, cost: 12800, level: 64, xp: 96, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'suffolk_sheep', capacity: 5, desc: 'Home for up to 5 suffolk sheep.' }),
  b({ id: 'kumquat_tree', name: 'Kumquat Tree', icon: '🍊', kind: 'tree', cost: 5940, level: 66, max: 8, xp: 30, height: 64, sellable: true, fruit: 'kumquat', growTime: 1596, desc: 'Gives 2 kumquats again and again.' }),
  b({ id: 'picnic_spot', name: 'Picnic Spot', icon: '🧺', kind: 'deco', w: 1, h: 1, cost: 4500, level: 75, max: 4, xp: 22, height: 14, sellable: true, desc: 'A checked blanket and a basket of treats.' }),
  b({ id: 'guava_tree', name: 'Guava Tree', icon: '🍐', kind: 'tree', cost: 6930, level: 77, max: 8, xp: 35, height: 64, sellable: true, fruit: 'guava', growTime: 1662, desc: 'Gives 2 guavas again and again.' }),
  b({ id: 'turkey_run', name: 'Bronze Gobbler Run', icon: '🦃', kind: 'pen', w: 2, h: 2, cost: 15800, level: 79, xp: 118, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'bronze_turkey', capacity: 6, desc: 'Home for up to 6 bronze gobblers.' }),
  b({ id: 'pistachio_tree', name: 'Pistachio Tree', icon: '🥜', kind: 'tree', cost: 7470, level: 83, max: 8, xp: 37, height: 64, sellable: true, fruit: 'pistachio', growTime: 1698, desc: 'Gives 2 pistachios again and again.' }),
  b({ id: 'wind_turbine', name: 'Wind Turbine', icon: '🌬️', kind: 'deco', w: 1, h: 1, cost: 5100, level: 85, max: 4, xp: 26, height: 170, sellable: true, desc: 'Clean power from the breeze.' }),
  b({ id: 'stone_bridge', name: 'Stone Bridge', icon: '🌉', kind: 'deco', w: 2, h: 1, cost: 5400, level: 90, max: 2, xp: 27, height: 24, sellable: true, desc: 'An arched bridge over a little brook.' }),
  b({ id: 'elderberry_tree', name: 'Elderberry Tree', icon: '🫐', kind: 'tree', cost: 8190, level: 91, max: 8, xp: 41, height: 64, sellable: true, fruit: 'elderberry', growTime: 1746, desc: 'Gives 2 elderberrys again and again.' }),
  b({ id: 'saanen_yard', name: 'Saanen Yard', icon: '🐐', kind: 'pen', w: 3, h: 2, cost: 18800, level: 94, xp: 141, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'saanen_goat', capacity: 5, desc: 'Home for up to 5 saanen goats.' }),
  b({ id: 'dragon_fruit_tree', name: 'Dragon Fruit Tree', icon: '🐉', kind: 'tree', cost: 8730, level: 97, max: 8, xp: 44, height: 64, sellable: true, fruit: 'dragon_fruit', growTime: 1782, desc: 'Gives 2 dragon fruits again and again.' }),
  b({ id: 'pergola', name: 'Pergola', icon: '🏛️', kind: 'deco', w: 2, h: 2, cost: 5940, level: 99, max: 2, xp: 30, height: 72, sellable: true, desc: 'Vines climbing over white beams.' }),
  b({ id: 'horse_statue', name: 'Horse Statue', icon: '🐎', kind: 'deco', w: 1, h: 1, cost: 6180, level: 103, max: 4, xp: 31, height: 68, sellable: true, desc: 'A bronze horse on a stone plinth.' }),
  b({ id: 'pecan_tree', name: 'Pecan Tree', icon: '🌰', kind: 'tree', cost: 9450, level: 105, max: 8, xp: 47, height: 64, sellable: true, fruit: 'pecan', growTime: 1830, desc: 'Gives 2 pecans again and again.' }),
  b({ id: 'cemani_coop', name: 'Cemani Coop', icon: '🐓', kind: 'pen', w: 2, h: 2, cost: 21400, level: 107, xp: 160, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'ayam_cemani', capacity: 6, desc: 'Home for up to 6 ayam cemani hens.' }),
  b({ id: 'blood_orange_tree', name: 'Blood Orange Tree', icon: '🍊', kind: 'tree', cost: 9810, level: 109, max: 8, xp: 49, height: 64, sellable: true, fruit: 'blood_orange', growTime: 1854, desc: 'Gives 2 blood oranges again and again.' }),
  b({ id: 'zen_garden', name: 'Sand Garden', icon: '🪨', kind: 'deco', w: 2, h: 2, cost: 6900, level: 115, max: 2, xp: 34, height: 16, sellable: true, desc: 'Raked sand and quiet stones.' }),
  b({ id: 'jackfruit_tree', name: 'Jackfruit Tree', icon: '🍈', kind: 'tree', cost: 10440, level: 116, max: 8, xp: 52, height: 64, sellable: true, fruit: 'jackfruit', growTime: 1896, desc: 'Gives 2 jackfruits again and again.' }),
  b({ id: 'heron_marsh', name: 'Heron Marsh', icon: '🪿', kind: 'pen', w: 3, h: 2, cost: 23800, level: 119, xp: 178, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'grey_heron', capacity: 4, desc: 'Home for up to 4 grey herons.' }),
  b({ id: 'macadamia_tree', name: 'Macadamia Tree', icon: '🥜', kind: 'tree', cost: 10980, level: 122, max: 8, xp: 55, height: 64, sellable: true, fruit: 'macadamia', growTime: 1932, desc: 'Gives 2 macadamias again and again.' }),
  b({ id: 'treehouse', name: 'Treehouse', icon: '🏡', kind: 'deco', w: 2, h: 2, cost: 7380, level: 123, max: 2, xp: 37, height: 130, sellable: true, desc: 'A little house up in an old oak.' }),
  b({ id: 'greenhouse', name: 'Greenhouse', icon: '🪴', kind: 'deco', w: 2, h: 2, cost: 7620, level: 127, max: 2, xp: 38, height: 64, sellable: true, desc: 'Glass walls full of green.' }),
  b({ id: 'yuzu_tree', name: 'Yuzu Tree', icon: '🍋', kind: 'tree', cost: 11610, level: 129, max: 8, xp: 58, height: 64, sellable: true, fruit: 'yuzu', growTime: 1974, desc: 'Gives 2 yuzus again and again.' }),
  b({ id: 'passion_fruit_tree', name: 'Passion Fruit Tree', icon: '🟣', kind: 'tree', cost: 11970, level: 133, max: 8, xp: 60, height: 64, sellable: true, fruit: 'passion_fruit', growTime: 1998, desc: 'Gives 2 passion fruits again and again.' }),
  b({ id: 'water_tower', name: 'Water Tower', icon: '🗼', kind: 'deco', w: 2, h: 2, cost: 8040, level: 134, max: 2, xp: 40, height: 145, sellable: true, desc: 'A tall wooden tank on stilts.' }),
  b({ id: 'carousel', name: 'Carousel', icon: '🎠', kind: 'deco', w: 2, h: 2, cost: 8340, level: 139, max: 2, xp: 42, height: 90, sellable: true, desc: 'Painted horses going round and round.' }),
  b({ id: 'cashew_tree', name: 'Cashew Tree', icon: '🥜', kind: 'tree', cost: 12600, level: 140, max: 8, xp: 63, height: 64, sellable: true, fruit: 'cashew', growTime: 2040, desc: 'Gives 2 cashews again and again.' }),
  b({ id: 'white_peach_tree', name: 'White Peach Tree', icon: '🍑', kind: 'tree', cost: 12870, level: 143, max: 8, xp: 64, height: 64, sellable: true, fruit: 'white_peach', growTime: 2058, desc: 'Gives 2 white peachs again and again.' }),
  b({ id: 'lighthouse', name: 'Lighthouse', icon: '🗼', kind: 'deco', w: 2, h: 2, cost: 8640, level: 144, max: 2, xp: 43, height: 165, sellable: true, desc: 'Its lamp sweeps the sea at night.' }),
  b({ id: 'clock_tower', name: 'Clock Tower', icon: '🕰️', kind: 'deco', w: 2, h: 2, cost: 8940, level: 149, max: 2, xp: 45, height: 185, sellable: true, desc: 'Rings in every new hour.' }),
  b({ id: 'loquat_tree', name: 'Loquat Tree', icon: '🍑', kind: 'tree', cost: 13500, level: 150, max: 8, xp: 68, height: 64, sellable: true, fruit: 'loquat', growTime: 2100, desc: 'Gives 2 loquats again and again.' }),
  b({ id: 'crabapple_tree', name: 'Crabapple Tree', icon: '🍎', kind: 'tree', cost: 13770, level: 153, max: 8, xp: 69, height: 64, sellable: true, fruit: 'crabapple', growTime: 2118, desc: 'Gives 2 crabapples again and again.' }),
  b({ id: 'hot_air_balloon', name: 'Hot Air Balloon', icon: '🎈', kind: 'deco', w: 2, h: 2, cost: 9240, level: 154, max: 2, xp: 46, height: 130, sellable: true, desc: 'Tethered and ready for a ride.' }),
  b({ id: 'golden_farmer', name: 'Golden Farmer Statue', icon: '🏆', kind: 'deco', w: 1, h: 1, cost: 9540, level: 159, max: 4, xp: 48, height: 72, sellable: true, desc: 'For the farmer who did it all.' }),
  b({ id: 'cinnamon_tree', name: 'Cinnamon Tree', icon: '🟤', kind: 'tree', cost: 14400, level: 160, max: 8, xp: 72, height: 64, sellable: true, fruit: 'cinnamon', growTime: 2160, desc: 'Gives 2 cinnamons again and again.' }),
  b({ id: 'mangosteen_tree', name: 'Mangosteen Tree', icon: '🟣', kind: 'tree', cost: 14670, level: 163, max: 8, xp: 73, height: 64, sellable: true, fruit: 'mangosteen', growTime: 2178, desc: 'Gives 2 mangosteens again and again.' }),
  b({ id: 'durian_tree', name: 'Durian Tree', icon: '🌰', kind: 'tree', cost: 15210, level: 169, max: 8, xp: 76, height: 64, sellable: true, fruit: 'durian', growTime: 2214, desc: 'Gives 2 durians again and again.' }),
  b({ id: 'black_cherry_tree', name: 'Black Cherry Tree', icon: '🍒', kind: 'tree', cost: 15480, level: 172, max: 8, xp: 77, height: 64, sellable: true, fruit: 'black_cherry', growTime: 2232, desc: 'Gives 2 black cherrys again and again.' }),
  b({ id: 'silver_pear_tree', name: 'Silver Pear Tree', icon: '🍐', kind: 'tree', cost: 15840, level: 176, max: 8, xp: 79, height: 64, sellable: true, fruit: 'silver_pear', growTime: 2256, desc: 'Gives 2 silver pears again and again.' }),
  // second wave
  b({ id: 'damson_tree', name: 'Damson Tree', icon: '🫐', kind: 'tree', cost: 135, level: 3, max: 8, xp: 3, height: 66, sellable: true, fruit: 'damson', growTime: 200, desc: 'Gives 2 damsons again and again.' }),
  b({ id: 'garden_gnome', name: 'Garden Gnome', icon: '🧙', kind: 'deco', w: 1, h: 1, cost: 240, level: 4, max: 4, xp: 2, height: 30, sellable: true, desc: 'A cheerful little gnome with a red hat.' }),
  b({ id: 'pekin_pond', name: 'Pekin Pond', icon: '🦆', kind: 'pen', w: 3, h: 2, cost: 1080, level: 6, xp: 10, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'pekin_duck', capacity: 5, desc: 'Home for up to 5 pekin ducks.' }),
  b({ id: 'greengage_tree', name: 'Greengage Tree', icon: '🟢', kind: 'tree', cost: 450, level: 10, max: 8, xp: 4, height: 66, sellable: true, fruit: 'greengage', growTime: 400, desc: 'Gives 2 greengages again and again.' }),
  b({ id: 'wheelbarrow', name: 'Wheelbarrow', icon: '🛒', kind: 'deco', w: 1, h: 1, cost: 660, level: 11, max: 4, xp: 3, height: 26, sellable: true, desc: 'Piled high with fresh soil.' }),
  b({ id: 'sour_cherry_tree', name: 'Sour Cherry Tree', icon: '🍒', kind: 'tree', cost: 675, level: 15, max: 8, xp: 7, height: 66, sellable: true, fruit: 'sour_cherry', growTime: 600, desc: 'Gives 2 sour cherrys again and again.' }),
  b({ id: 'orpington_coop', name: 'Orpington Coop', icon: '🐔', kind: 'pen', w: 2, h: 2, cost: 2880, level: 16, xp: 24, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'orpington', capacity: 6, desc: 'Home for up to 6 orpington hens.' }),
  b({ id: 'rain_barrel', name: 'Rain Barrel', icon: '🛢️', kind: 'deco', w: 1, h: 1, cost: 1140, level: 19, max: 4, xp: 6, height: 34, sellable: true, desc: 'Catches the rain for thirsty days.' }),
  b({ id: 'nashi_tree', name: 'Nashi Pear Tree', icon: '🍐', kind: 'tree', cost: 1890, level: 21, max: 8, xp: 9, height: 66, sellable: true, fruit: 'nashi', growTime: 1326, desc: 'Gives 2 nashi pears again and again.' }),
  b({ id: 'lop_hutch', name: 'Lop Hutch', icon: '🐇', kind: 'pen', w: 2, h: 2, cost: 4320, level: 24, xp: 36, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'lop_rabbit', capacity: 6, desc: 'Home for up to 6 lop rabbits.' }),
  b({ id: 'medlar_tree', name: 'Medlar Tree', icon: '🟤', kind: 'tree', cost: 2430, level: 27, max: 8, xp: 12, height: 66, sellable: true, fruit: 'medlar', growTime: 1362, desc: 'Gives 2 medlars again and again.' }),
  b({ id: 'flower_cart', name: 'Flower Cart', icon: '🌷', kind: 'deco', w: 1, h: 1, cost: 1680, level: 28, max: 4, xp: 8, height: 40, sellable: true, desc: 'A little cart bursting with blooms.' }),
  b({ id: 'hawthorn_tree', name: 'Haw Berry Tree', icon: '🍒', kind: 'tree', cost: 2880, level: 32, max: 8, xp: 14, height: 66, sellable: true, fruit: 'hawthorn', growTime: 1392, desc: 'Gives 2 haw berrys again and again.' }),
  b({ id: 'compost_bin', name: 'Compost Bin', icon: '♻️', kind: 'deco', w: 1, h: 1, cost: 2100, level: 35, max: 4, xp: 10, height: 30, sellable: true, desc: 'Scraps turn into rich soil.' }),
  b({ id: 'pygmy_yard', name: 'Pygmy Yard', icon: '🐐', kind: 'pen', w: 3, h: 2, cost: 6480, level: 36, xp: 54, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'pygmy_goat', capacity: 5, desc: 'Home for up to 5 pygmy goats.' }),
  b({ id: 'rowan_tree', name: 'Rowan Berry Tree', icon: '🍒', kind: 'tree', cost: 3510, level: 39, max: 8, xp: 18, height: 66, sellable: true, fruit: 'rowan', growTime: 1434, desc: 'Gives 2 rowan berrys again and again.' }),
  b({ id: 'mushroom_ring', name: 'Mushroom Ring', icon: '🍄', kind: 'deco', w: 1, h: 1, cost: 2460, level: 41, max: 4, xp: 12, height: 14, sellable: true, desc: 'A fairy ring of spotted toadstools.' }),
  b({ id: 'sloe_tree', name: 'Sloe Tree', icon: '🫐', kind: 'tree', cost: 4050, level: 45, max: 8, xp: 20, height: 66, sellable: true, fruit: 'sloe', growTime: 1470, desc: 'Gives 2 sloes again and again.' }),
  b({ id: 'brahma_coop', name: 'Brahma Coop', icon: '🐓', kind: 'pen', w: 2, h: 2, cost: 8280, level: 46, xp: 69, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'brahma_chicken', capacity: 6, desc: 'Home for up to 6 brahma chickens.' }),
  b({ id: 'stone_lantern', name: 'Stone Lantern', icon: '🏮', kind: 'deco', w: 1, h: 1, cost: 2940, level: 49, max: 4, xp: 15, height: 44, sellable: true, desc: 'Glows softly after dark.' }),
  b({ id: 'pomelo_tree', name: 'Pomelo Tree', icon: '🍈', kind: 'tree', cost: 4590, level: 51, max: 8, xp: 23, height: 66, sellable: true, fruit: 'pomelo', growTime: 1506, desc: 'Gives 2 pomelos again and again.' }),
  b({ id: 'toulouse_pen', name: 'Toulouse Pen', icon: '🪿', kind: 'pen', w: 2, h: 2, cost: 9720, level: 54, xp: 81, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'toulouse_goose', capacity: 6, desc: 'Home for up to 6 toulouse gooses.' }),
  b({ id: 'citron_tree', name: 'Citron Tree', icon: '🍋', kind: 'tree', cost: 5040, level: 56, max: 8, xp: 25, height: 66, sellable: true, fruit: 'citron', growTime: 1536, desc: 'Gives 2 citrons again and again.' }),
  b({ id: 'bamboo_grove', name: 'Bamboo Grove', icon: '🎋', kind: 'deco', w: 1, h: 1, cost: 3540, level: 59, max: 4, xp: 18, height: 90, sellable: true, desc: 'Tall green canes rustling in the wind.' }),
  b({ id: 'bergamot_tree', name: 'Bergamot Tree', icon: '🍋', kind: 'tree', cost: 5580, level: 62, max: 8, xp: 28, height: 66, sellable: true, fruit: 'bergamot', growTime: 1572, desc: 'Gives 2 bergamots again and again.' }),
  b({ id: 'angus_ranch', name: 'Angus Ranch', icon: '🐄', kind: 'pen', w: 3, h: 2, cost: 11700, level: 65, xp: 98, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'angus_cow', capacity: 5, desc: 'Home for up to 5 angus cows.' }),
  b({ id: 'fairy_house', name: 'Fairy House', icon: '🍄', kind: 'deco', w: 1, h: 1, cost: 3960, level: 66, max: 4, xp: 20, height: 40, sellable: true, desc: 'A tiny door in a giant mushroom.' }),
  b({ id: 'jujube_tree', name: 'Jujube Tree', icon: '🟤', kind: 'tree', cost: 6210, level: 69, max: 8, xp: 31, height: 66, sellable: true, fruit: 'jujube', growTime: 1614, desc: 'Gives 2 jujubes again and again.' }),
  b({ id: 'snowman', name: 'Snowman', icon: '⛄', kind: 'deco', w: 1, h: 1, cost: 4320, level: 72, max: 4, xp: 22, height: 50, sellable: true, desc: 'Never melts on this farm.' }),
  b({ id: 'feijoa_tree', name: 'Feijoa Tree', icon: '🟢', kind: 'tree', cost: 6750, level: 75, max: 8, xp: 34, height: 66, sellable: true, fruit: 'feijoa', growTime: 1650, desc: 'Gives 2 feijoas again and again.' }),
  b({ id: 'polish_coop', name: 'Polish Coop', icon: '🐓', kind: 'pen', w: 2, h: 2, cost: 13680, level: 76, xp: 114, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'polish_chicken', capacity: 6, desc: 'Home for up to 6 polish chickens.' }),
  b({ id: 'acerola_tree', name: 'Acerola Tree', icon: '🍒', kind: 'tree', cost: 7200, level: 80, max: 8, xp: 36, height: 66, sellable: true, fruit: 'acerola', growTime: 1680, desc: 'Gives 2 acerolas again and again.' }),
  b({ id: 'sun_lounger', name: 'Sun Lounger', icon: '🏖️', kind: 'deco', beach: true, w: 1, h: 1, cost: 480, level: 8, max: 12, xp: 4, height: 20, sellable: true, desc: 'A striped deck chair for lazy beach days.' }),
  b({ id: 'beach_umbrella', name: 'Beach Umbrella', icon: '⛱️', kind: 'deco', beach: true, w: 1, h: 1, cost: 520, level: 8, max: 12, xp: 4, height: 50, sellable: true, desc: 'Bright stripes of shade on the sand.' }),
  b({ id: 'lifeguard_tower', name: 'Lifeguard Tower', icon: '🛟', kind: 'deco', beach: true, w: 1, h: 1, cost: 1800, level: 30, max: 4, xp: 12, height: 90, sellable: true, desc: 'Someone keeps an eye on the swimmers.' }),
  b({ id: 'surfboard_rack', name: 'Surfboard Rack', icon: '🏄', kind: 'deco', beach: true, w: 1, h: 1, cost: 2700, level: 45, max: 4, xp: 16, height: 60, sellable: true, desc: 'Colorful boards waiting for the next wave.' }),
  b({ id: 'sandcastle', name: 'Sandcastle', icon: '🏰', kind: 'deco', beach: true, w: 1, h: 1, cost: 4860, level: 81, max: 4, xp: 24, height: 30, sellable: true, desc: 'Towers, walls and a little flag.' }),
  // sand sculptures for the beach
  b({ id: 'sand_turtle', name: 'Sand Turtle', icon: '🐢', kind: 'deco', beach: true, w: 1, h: 1, cost: 720, level: 12, max: 4, xp: 5, height: 25, sellable: true, desc: 'A sea turtle sculpted in sand, its shell carved into plates.' }),
  b({ id: 'sand_dolphin', name: 'Sand Dolphin', icon: '🐬', kind: 'deco', beach: true, w: 1, h: 1, cost: 1320, level: 22, max: 4, xp: 7, height: 40, sellable: true, desc: 'A dolphin leaping out of the sand.' }),
  b({ id: 'sand_crab', name: 'Sand Crab', icon: '🦀', kind: 'deco', beach: true, w: 1, h: 1, cost: 2040, level: 34, max: 4, xp: 10, height: 25, sellable: true, desc: 'A giant sand crab with its claws up.' }),
  b({ id: 'sand_octopus', name: 'Sand Octopus', icon: '🐙', kind: 'deco', beach: true, w: 1, h: 1, cost: 3000, level: 50, max: 4, xp: 15, height: 40, sellable: true, desc: 'Eight curling arms set with shell suckers.' }),
  b({ id: 'sand_starfish', name: 'Sand Starfish', icon: '⭐', kind: 'deco', beach: true, w: 1, h: 1, cost: 3960, level: 66, max: 4, xp: 20, height: 20, sellable: true, desc: 'A big starfish studded with shells.' }),
  b({ id: 'sand_pyramid', name: 'Sand Pyramid', icon: '🔺', kind: 'deco', beach: true, w: 1, h: 1, cost: 5280, level: 88, max: 4, xp: 26, height: 45, sellable: true, desc: 'A stepped pyramid, patted smooth.' }),
  b({ id: 'sand_tower', name: 'Sand Tower', icon: '🏰', kind: 'deco', beach: true, w: 1, h: 1, cost: 6360, level: 106, max: 4, xp: 31, height: 70, sellable: true, desc: 'A tall tower with a ramp winding up to its flag.' }),
  b({ id: 'sand_car', name: 'Sand Race Car', icon: '🏎️', kind: 'deco', beach: true, w: 1, h: 1, cost: 7560, level: 126, max: 4, xp: 37, height: 25, sellable: true, desc: 'A sand racer, number one on the nose.' }),
  b({ id: 'sand_serpent', name: 'Sand Sea Serpent', icon: '🐉', kind: 'deco', beach: true, w: 1, h: 1, cost: 9000, level: 150, max: 4, xp: 44, height: 35, sellable: true, desc: 'A sea serpent looping in and out of the sand.' }),
  b({ id: 'sand_whale', name: 'Sand Whale', icon: '🐋', kind: 'deco', beach: true, w: 1, h: 1, cost: 10440, level: 174, max: 4, xp: 51, height: 30, sellable: true, desc: 'A whale with its tail raised, stranded in sand.' }),
  b({ id: 'valais_fold', name: 'Valais Fold', icon: '🐑', kind: 'pen', w: 3, h: 2, cost: 15120, level: 84, xp: 126, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'valais_blacknose', capacity: 5, desc: 'Home for up to 5 valais blacknose.' }),
  b({ id: 'carob_tree', name: 'Carob Tree', icon: '🟤', kind: 'tree', cost: 7740, level: 86, max: 8, xp: 39, height: 66, sellable: true, fruit: 'carob', growTime: 1716, desc: 'Gives 2 carobs again and again.' }),
  b({ id: 'seesaw', name: 'Seesaw', icon: '🎢', kind: 'deco', w: 1, h: 1, cost: 5340, level: 89, max: 4, xp: 27, height: 24, sellable: true, desc: 'Up and down, all day long.' }),
  b({ id: 'hickory_tree', name: 'Hickory Nut Tree', icon: '🌰', kind: 'tree', cost: 8280, level: 92, max: 8, xp: 41, height: 66, sellable: true, fruit: 'hickory', growTime: 1752, desc: 'Gives 2 hickory nuts again and again.' }),
  b({ id: 'runner_pen', name: 'Runner Pen', icon: '🦆', kind: 'pen', w: 2, h: 2, cost: 16920, level: 94, xp: 141, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'indian_runner', capacity: 6, desc: 'Home for up to 6 indian runner ducks.' }),
  b({ id: 'outdoor_oven', name: 'Outdoor Oven', icon: '🔥', kind: 'deco', w: 1, h: 1, cost: 5760, level: 96, max: 4, xp: 29, height: 50, sellable: true, desc: 'A domed clay oven for pizza nights.' }),
  b({ id: 'kiwifruit_tree', name: 'Kiwi Fruit Tree', icon: '🥝', kind: 'tree', cost: 8820, level: 98, max: 8, xp: 44, height: 66, sellable: true, fruit: 'kiwifruit', growTime: 1788, desc: 'Gives 2 kiwi fruits again and again.' }),
  b({ id: 'plantain_tree', name: 'Plantain Tree', icon: '🍌', kind: 'tree', cost: 9270, level: 103, max: 8, xp: 46, height: 66, sellable: true, fruit: 'plantain', growTime: 1818, desc: 'Gives 2 plantains again and again.' }),
  b({ id: 'telescope', name: 'Telescope', icon: '🔭', kind: 'deco', w: 1, h: 1, cost: 6240, level: 104, max: 4, xp: 31, height: 50, sellable: true, desc: 'For counting the stars.' }),
  b({ id: 'boer_yard', name: 'Boer Yard', icon: '🐐', kind: 'pen', w: 3, h: 2, cost: 19080, level: 106, xp: 159, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'boer_goat', capacity: 5, desc: 'Home for up to 5 boer goats.' }),
  b({ id: 'pine_nut_tree', name: 'Pine Nut Tree', icon: '🌰', kind: 'tree', cost: 9900, level: 110, max: 8, xp: 50, height: 66, sellable: true, fruit: 'pine_nut', growTime: 1860, desc: 'Gives 2 pine nuts again and again.' }),
  b({ id: 'obelisk', name: 'Obelisk', icon: '🗿', kind: 'deco', w: 1, h: 1, cost: 6660, level: 111, max: 4, xp: 33, height: 110, sellable: true, desc: 'A tall stone needle.' }),
  b({ id: 'tamarind_tree', name: 'Tamarind Tree', icon: '🟤', kind: 'tree', cost: 10350, level: 115, max: 8, xp: 52, height: 66, sellable: true, fruit: 'tamarind', growTime: 1890, desc: 'Gives 2 tamarinds again and again.' }),
  b({ id: 'dorper_fold', name: 'Dorper Fold', icon: '🐑', kind: 'pen', w: 3, h: 2, cost: 20880, level: 116, xp: 174, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'dorper', capacity: 5, desc: 'Home for up to 5 dorper sheep.' }),
  b({ id: 'hammock', name: 'Hammock', icon: '🏝️', kind: 'deco', beach: true, w: 2, h: 1, cost: 7140, level: 119, max: 2, xp: 36, height: 40, sellable: true, desc: 'Strung between two palms.' }),
  b({ id: 'pawpaw_tree', name: 'Pawpaw Tree', icon: '🥭', kind: 'tree', cost: 10890, level: 121, max: 8, xp: 54, height: 66, sellable: true, fruit: 'pawpaw', growTime: 1926, desc: 'Gives 2 pawpaws again and again.' }),
  b({ id: 'charolais_pasture', name: 'Charolais Pasture', icon: '🐄', kind: 'pen', w: 3, h: 2, cost: 22320, level: 124, xp: 186, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'charolais', capacity: 5, desc: 'Home for up to 5 charolais cows.' }),
  b({ id: 'longan_tree', name: 'Longan Tree', icon: '🟤', kind: 'tree', cost: 11430, level: 127, max: 8, xp: 57, height: 66, sellable: true, fruit: 'longan', growTime: 1962, desc: 'Gives 2 longans again and again.' }),
  b({ id: 'water_wheel', name: 'Water Wheel', icon: '🎡', kind: 'deco', w: 2, h: 1, cost: 7680, level: 128, max: 2, xp: 38, height: 70, sellable: true, desc: 'Turns slowly in its little stream.' }),
  b({ id: 'rambutan_tree', name: 'Rambutan Tree', icon: '🔴', kind: 'tree', cost: 11880, level: 132, max: 8, xp: 59, height: 66, sellable: true, fruit: 'rambutan', growTime: 1992, desc: 'Gives 2 rambutans again and again.' }),
  b({ id: 'koi_pond', name: 'Koi Pond', icon: '🐟', kind: 'deco', w: 2, h: 2, cost: 8100, level: 135, max: 2, xp: 40, height: 16, sellable: true, desc: 'Bright fish under lily pads.' }),
  b({ id: 'angora_hutch', name: 'Angora Hutch', icon: '🐇', kind: 'pen', w: 2, h: 2, cost: 24480, level: 136, xp: 204, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'angora_rabbit', capacity: 6, desc: 'Home for up to 6 angora rabbits.' }),
  b({ id: 'sea_buckthorn_tree', name: 'Sea Buckthorn Tree', icon: '🟠', kind: 'tree', cost: 12510, level: 139, max: 8, xp: 63, height: 66, sellable: true, fruit: 'sea_buckthorn', growTime: 2034, desc: 'Gives 2 sea buckthorns again and again.' }),
  b({ id: 'camping_tent', name: 'Camping Tent', icon: '⛺', kind: 'deco', w: 2, h: 2, cost: 8460, level: 141, max: 2, xp: 42, height: 50, sellable: true, desc: 'Ready for a night under the stars.' }),
  b({ id: 'finger_lime_tree', name: 'Finger Lime Tree', icon: '🟢', kind: 'tree', cost: 13050, level: 145, max: 8, xp: 65, height: 66, sellable: true, fruit: 'finger_lime', growTime: 2070, desc: 'Gives 2 finger limes again and again.' }),
  b({ id: 'white_peacock_garden', name: 'White Peacock Garden', icon: '🦚', kind: 'pen', w: 2, h: 2, cost: 26280, level: 146, xp: 219, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'white_peacock', capacity: 6, desc: 'Home for up to 6 white peacocks.' }),
  b({ id: 'beach_hut', name: 'Beach Hut', icon: '🛖', kind: 'deco', beach: true, w: 2, h: 2, cost: 8940, level: 149, max: 2, xp: 45, height: 70, sellable: true, desc: 'Striped planks and a sunny porch.' }),
  b({ id: 'sapodilla_tree', name: 'Sapodilla Tree', icon: '🟤', kind: 'tree', cost: 13590, level: 151, max: 8, xp: 68, height: 66, sellable: true, fruit: 'sapodilla', growTime: 2106, desc: 'Gives 2 sapodillas again and again.' }),
  b({ id: 'appaloosa_stable', name: 'Appaloosa Stable', icon: '🐎', kind: 'pen', w: 3, h: 2, cost: 27720, level: 154, xp: 231, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'appaloosa', capacity: 5, desc: 'Home for up to 5 appaloosas.' }),
  b({ id: 'soursop_tree', name: 'Soursop Tree', icon: '🟢', kind: 'tree', cost: 14040, level: 156, max: 8, xp: 70, height: 66, sellable: true, fruit: 'soursop', growTime: 2136, desc: 'Gives 2 soursops again and again.' }),
  b({ id: 'log_cabin', name: 'Log Cabin', icon: '🛖', kind: 'deco', w: 2, h: 2, cost: 9540, level: 159, max: 2, xp: 48, height: 80, sellable: true, desc: 'A snug cabin with a stone chimney.' }),
  b({ id: 'jabuticaba_tree', name: 'Jabuticaba Tree', icon: '🫐', kind: 'tree', cost: 14580, level: 162, max: 8, xp: 73, height: 66, sellable: true, fruit: 'jabuticaba', growTime: 2172, desc: 'Gives 2 jabuticabas again and again.' }),
  b({ id: 'mule_paddock', name: 'Mule Paddock', icon: '🫏', kind: 'pen', w: 3, h: 2, cost: 29700, level: 165, xp: 248, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'mule', capacity: 5, desc: 'Home for up to 5 mules.' }),
  b({ id: 'playground_slide', name: 'Playground', icon: '🛝', kind: 'deco', w: 2, h: 2, cost: 9960, level: 166, max: 2, xp: 50, height: 60, sellable: true, desc: 'A slide, a ladder and a swing.' }),
  b({ id: 'breadfruit_tree', name: 'Breadfruit Tree', icon: '🟢', kind: 'tree', cost: 15210, level: 169, max: 8, xp: 76, height: 66, sellable: true, fruit: 'breadfruit', growTime: 2214, desc: 'Gives 2 breadfruits again and again.' }),
  b({ id: 'cherimoya_tree', name: 'Cherimoya Tree', icon: '🟢', kind: 'tree', cost: 15750, level: 175, max: 8, xp: 79, height: 66, sellable: true, fruit: 'cherimoya', growTime: 2250, desc: 'Gives 2 cherimoyas again and again.' }),
  b({ id: 'longhorn_ranch', name: 'Longhorn Ranch', icon: '🐂', kind: 'pen', w: 3, h: 2, cost: 31680, level: 176, xp: 264, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'texas_longhorn', capacity: 5, desc: 'Home for up to 5 texas longhorns.' }),
  b({ id: 'mamey_tree', name: 'Mamey Tree', icon: '🟤', kind: 'tree', cost: 16200, level: 180, max: 8, xp: 81, height: 66, sellable: true, fruit: 'mamey', growTime: 2280, desc: 'Gives 2 mameys again and again.' }),
  b({ id: 'clydesdale_stable', name: 'Clydesdale Stable', icon: '🐴', kind: 'pen', w: 3, h: 2, cost: 33120, level: 184, xp: 276, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'clydesdale', capacity: 5, desc: 'Home for up to 5 clydesdales.' }),
  b({ id: 'salak_tree', name: 'Snake Fruit Tree', icon: '🟤', kind: 'tree', cost: 16740, level: 186, max: 8, xp: 84, height: 66, sellable: true, fruit: 'salak', growTime: 2316, desc: 'Gives 2 snake fruits again and again.' }),
  b({ id: 'observatory', name: 'Observatory', icon: '🔭', kind: 'deco', w: 2, h: 2, cost: 11340, level: 189, max: 2, xp: 57, height: 110, sellable: true, desc: 'Its dome opens to the night sky.' }),
  b({ id: 'brazil_nut_tree', name: 'Brazil Nut Tree', icon: '🌰', kind: 'tree', cost: 17280, level: 192, max: 8, xp: 86, height: 66, sellable: true, fruit: 'brazil_nut', growTime: 2352, desc: 'Gives 2 brazil nuts again and again.' }),
  b({ id: 'elk_woods', name: 'Elk Woods', icon: '🦌', kind: 'pen', w: 3, h: 2, cost: 34920, level: 194, xp: 291, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'elk', capacity: 5, desc: 'Home for up to 5 elk.' }),
  b({ id: 'ferris_wheel', name: 'Ferris Wheel', icon: '🎡', kind: 'deco', w: 2, h: 2, cost: 11760, level: 196, max: 2, xp: 59, height: 170, sellable: true, desc: 'Round and round above the farm.' }),
  b({ id: 'nutmeg_tree', name: 'Nutmeg Tree', icon: '🟤', kind: 'tree', cost: 17820, level: 198, max: 8, xp: 89, height: 66, sellable: true, fruit: 'nutmeg', growTime: 2388, desc: 'Gives 2 nutmegs again and again.' }),
  // third wave
  b({ id: 'tea_house', name: 'Tea House', icon: '🫖', kind: 'production', w: 2, h: 2, cost: 3450, level: 23, xp: 34, height: 56, wall: '#e8f0d8', roof: '#4a7a3a', desc: 'Brews herbal teas and spiced chai.' }),
  b({ id: 'leghorn_coop', name: 'Leghorn Coop', icon: '🐔', kind: 'pen', w: 2, h: 2, cost: 4680, level: 26, xp: 39, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'leghorn', capacity: 6, desc: 'Home for up to 6 leghorn hens.' }),
  b({ id: 'smoothie_bar', name: 'Smoothie Bar', icon: '🥤', kind: 'production', w: 2, h: 2, cost: 4050, level: 27, xp: 40, height: 56, wall: '#fbe0ec', roof: '#e84a8a', desc: 'Blends fruit into thick smoothies.' }),
  b({ id: 'hay_stack', name: 'Haystack', icon: '🌾', kind: 'deco', w: 1, h: 1, cost: 1920, level: 32, max: 4, xp: 10, height: 60, sellable: true, desc: 'A tall stack of golden hay.' }),
  b({ id: 'pasta_maker', name: 'Pasta Maker', icon: '🍝', kind: 'production', w: 2, h: 2, cost: 4800, level: 32, xp: 48, height: 56, wall: '#f8ecd0', roof: '#c83a2a', desc: 'Rolls and cuts fresh pasta.' }),
  b({ id: 'clementine_tree', name: 'Clementine Tree', icon: '🍊', kind: 'tree', cost: 3060, level: 34, max: 8, xp: 15, height: 66, sellable: true, fruit: 'clementine', growTime: 1404, desc: 'Gives 2 clementines again and again.' }),
  b({ id: 'candy_shop', name: 'Candy Shop', icon: '🍭', kind: 'production', w: 2, h: 2, cost: 5550, level: 37, xp: 56, height: 56, wall: '#fde4f0', roof: '#e85aa8', desc: 'Boils sugar into sweets and candied fruit.' }),
  b({ id: 'campbell_pond', name: 'Campbell Pond', icon: '🦆', kind: 'pen', w: 3, h: 2, cost: 7200, level: 40, xp: 60, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'khaki_campbell', capacity: 5, desc: 'Home for up to 5 khaki campbells.' }),
  b({ id: 'cheese_cave', name: 'Cheese Cave', icon: '🧀', kind: 'production', w: 2, h: 2, cost: 6600, level: 44, xp: 66, height: 56, wall: '#e8dcc0', roof: '#8a6a3a', desc: 'Ripens wheels of farmhouse cheese.' }),
  b({ id: 'picnic_table', name: 'Picnic Table', icon: '🪑', kind: 'deco', w: 1, h: 1, cost: 2880, level: 48, max: 4, xp: 14, height: 30, sellable: true, desc: 'Benches for a lunch outdoors.' }),
  b({ id: 'mirabelle_tree', name: 'Mirabelle Tree', icon: '🟡', kind: 'tree', cost: 4590, level: 51, max: 8, xp: 23, height: 66, sellable: true, fruit: 'mirabelle', growTime: 1506, desc: 'Gives 2 mirabelles again and again.' }),
  b({ id: 'noodle_bar', name: 'Noodle Bar', icon: '🍜', kind: 'production', w: 2, h: 2, cost: 7650, level: 51, xp: 76, height: 56, wall: '#fff0d8', roof: '#d8302a', desc: 'Serves steaming noodle bowls.' }),
  b({ id: 'dutch_hutch', name: 'Dutch Hutch', icon: '🐇', kind: 'pen', w: 2, h: 2, cost: 9540, level: 53, xp: 80, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'dutch_rabbit', capacity: 6, desc: 'Home for up to 6 dutch rabbits.' }),
  b({ id: 'smokehouse', name: 'Smokehouse', icon: '🏚️', kind: 'production', w: 2, h: 2, cost: 8850, level: 59, xp: 88, height: 56, wall: '#c8b090', roof: '#5a3a2a', desc: 'Smokes fish slowly over oak.' }),
  b({ id: 'lemonade_stand', name: 'Lemonade Stand', icon: '🍋', kind: 'deco', w: 1, h: 1, cost: 3600, level: 60, max: 4, xp: 18, height: 50, sellable: true, desc: 'Ice cold lemonade, one coin a cup.' }),
  b({ id: 'rhode_coop', name: 'Rhode Island Coop', icon: '🐓', kind: 'pen', w: 2, h: 2, cost: 11160, level: 62, xp: 93, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'rhode_island_red', capacity: 6, desc: 'Home for up to 6 rhode island reds.' }),
  b({ id: 'spice_mill', name: 'Spice Mill', icon: '🌶️', kind: 'production', w: 2, h: 2, cost: 9900, level: 66, xp: 99, height: 56, wall: '#f0d8b0', roof: '#c0602a', desc: 'Grinds spices into blends and rubs.' }),
  b({ id: 'chokecherry_tree', name: 'Chokecherry Tree', icon: '🍒', kind: 'tree', cost: 6120, level: 68, max: 8, xp: 31, height: 66, sellable: true, fruit: 'chokecherry', growTime: 1608, desc: 'Gives 2 chokecherrys again and again.' }),
  b({ id: 'guernsey_pasture', name: 'Guernsey Pasture', icon: '🐄', kind: 'pen', w: 3, h: 2, cost: 13140, level: 73, xp: 110, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'guernsey', capacity: 5, desc: 'Home for up to 5 guernsey cows.' }),
  b({ id: 'perfumery', name: 'Perfumery', icon: '🌸', kind: 'production', w: 2, h: 2, cost: 11100, level: 74, xp: 111, height: 56, wall: '#f4e8f8', roof: '#9a5ac8', desc: 'Distills flowers into perfume.' }),
  b({ id: 'insect_hotel', name: 'Insect Hotel', icon: '🐞', kind: 'deco', w: 1, h: 1, cost: 4740, level: 79, max: 4, xp: 24, height: 50, sellable: true, desc: 'Snug rooms for bees and ladybirds.' }),
  b({ id: 'soap_maker', name: 'Soap Maker', icon: '🧼', kind: 'production', w: 2, h: 2, cost: 12450, level: 83, xp: 124, height: 56, wall: '#e0f0f4', roof: '#3a8ab0', desc: 'Makes soaps with milk, oils and herbs.' }),
  b({ id: 'shetland_fold', name: 'Shetland Fold', icon: '🐑', kind: 'pen', w: 3, h: 2, cost: 15120, level: 84, xp: 126, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'shetland_sheep', capacity: 5, desc: 'Home for up to 5 shetland sheep.' }),
  b({ id: 'star_apple_tree', name: 'Star Apple Tree', icon: '🟣', kind: 'tree', cost: 7740, level: 86, max: 8, xp: 39, height: 66, sellable: true, fruit: 'star_apple', growTime: 1716, desc: 'Gives 2 star apples again and again.' }),
  b({ id: 'candle_shop', name: 'Candle Shop', icon: '🕯️', kind: 'production', w: 2, h: 2, cost: 13950, level: 93, xp: 140, height: 56, wall: '#f8ecc8', roof: '#b8862a', desc: 'Pours scented beeswax candles.' }),
  b({ id: 'weathervane', name: 'Weathervane', icon: '🐓', kind: 'deco', w: 1, h: 1, cost: 5700, level: 95, max: 4, xp: 28, height: 80, sellable: true, desc: 'A copper rooster that turns with the wind.' }),
  b({ id: 'call_duck_pond', name: 'Call Duck Pond', icon: '🦆', kind: 'pen', w: 3, h: 2, cost: 17460, level: 97, xp: 146, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'call_duck', capacity: 5, desc: 'Home for up to 5 call ducks.' }),
  b({ id: 'wax_apple_tree', name: 'Wax Apple Tree', icon: '🔔', kind: 'tree', cost: 9270, level: 103, max: 8, xp: 46, height: 66, sellable: true, fruit: 'wax_apple', growTime: 1818, desc: 'Gives 2 wax apples again and again.' }),
  b({ id: 'rock_garden', name: 'Rock Garden', icon: '🪨', kind: 'deco', w: 1, h: 1, cost: 6480, level: 108, max: 4, xp: 32, height: 24, sellable: true, desc: 'Stones and hardy little alpines.' }),
  b({ id: 'alpine_yard', name: 'Alpine Yard', icon: '🐐', kind: 'pen', w: 3, h: 2, cost: 19800, level: 110, xp: 165, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'alpine_goat', capacity: 5, desc: 'Home for up to 5 alpine goats.' }),
  b({ id: 'wyandotte_coop', name: 'Wyandotte Coop', icon: '🐔', kind: 'pen', w: 2, h: 2, cost: 21420, level: 119, xp: 178, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'wyandotte', capacity: 6, desc: 'Home for up to 6 wyandotte hens.' }),
  b({ id: 'veggie_stand', name: 'Veggie Stand', icon: '🥕', kind: 'deco', w: 1, h: 1, cost: 7380, level: 123, max: 4, xp: 37, height: 50, sellable: true, desc: 'Baskets of fresh picked vegetables.' }),
  b({ id: 'lucuma_tree', name: 'Lucuma Tree', icon: '🟢', kind: 'tree', cost: 11340, level: 126, max: 8, xp: 57, height: 66, sellable: true, fruit: 'lucuma', growTime: 1956, desc: 'Gives 2 lucumas again and again.' }),
  b({ id: 'swiss_pasture', name: 'Swiss Pasture', icon: '🐄', kind: 'pen', w: 3, h: 2, cost: 23580, level: 131, xp: 196, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'brown_swiss', capacity: 5, desc: 'Home for up to 5 brown swiss cows.' }),
  b({ id: 'chocolatier', name: 'Chocolatier', icon: '🍫', kind: 'production', w: 2, h: 2, cost: 20100, level: 134, xp: 201, height: 56, wall: '#f0dcc8', roof: '#6a3a1e', desc: 'Makes chocolates, truffles and bonbons.' }),
  b({ id: 'windchime', name: 'Wind Chime', icon: '🎐', kind: 'deco', w: 1, h: 1, cost: 8340, level: 139, max: 4, xp: 42, height: 60, sellable: true, desc: 'Tinkles softly in the breeze.' }),
  b({ id: 'marula_tree', name: 'Marula Tree', icon: '🟡', kind: 'tree', cost: 12690, level: 141, max: 8, xp: 63, height: 66, sellable: true, fruit: 'marula', growTime: 2046, desc: 'Gives 2 marulas again and again.' }),
  b({ id: 'emden_pen', name: 'Emden Pen', icon: '🪿', kind: 'pen', w: 2, h: 2, cost: 25740, level: 143, xp: 214, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'emden_goose', capacity: 6, desc: 'Home for up to 6 emden gooses.' }),
  b({ id: 'dovecote', name: 'Dovecote', icon: '🕊️', kind: 'deco', w: 1, h: 1, cost: 9120, level: 152, max: 4, xp: 46, height: 90, sellable: true, desc: 'A tall white home for doves.' }),
  b({ id: 'karakul_fold', name: 'Karakul Fold', icon: '🐑', kind: 'pen', w: 3, h: 2, cost: 27720, level: 154, xp: 231, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'karakul', capacity: 5, desc: 'Home for up to 5 karakul sheep.' }),
  b({ id: 'ackee_tree', name: 'Ackee Tree', icon: '🔴', kind: 'tree', cost: 14310, level: 159, max: 8, xp: 72, height: 66, sellable: true, fruit: 'ackee', growTime: 2154, desc: 'Gives 2 ackees again and again.' }),
  b({ id: 'palomino_stable', name: 'Palomino Stable', icon: '🐎', kind: 'pen', w: 3, h: 2, cost: 29520, level: 164, xp: 246, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'palomino', capacity: 5, desc: 'Home for up to 5 palominos.' }),
  b({ id: 'flag_pole', name: 'Flag Pole', icon: '🚩', kind: 'deco', w: 1, h: 1, cost: 10080, level: 168, max: 4, xp: 50, height: 110, sellable: true, desc: 'The farm flag flies high.' }),
  b({ id: 'marans_coop', name: 'Marans Coop', icon: '🐔', kind: 'pen', w: 2, h: 2, cost: 31140, level: 173, xp: 260, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'marans', capacity: 6, desc: 'Home for up to 6 marans hens.' }),
  b({ id: 'black_sapote_tree', name: 'Black Sapote Tree', icon: '🟢', kind: 'tree', cost: 15750, level: 175, max: 8, xp: 79, height: 66, sellable: true, fruit: 'black_sapote', growTime: 2250, desc: 'Gives 2 black sapotes again and again.' }),
  b({ id: 'ice_cream_cart', name: 'Ice Cream Cart', icon: '🍦', kind: 'deco', w: 1, h: 1, cost: 10980, level: 183, max: 4, xp: 55, height: 50, sellable: true, desc: 'Scoops of every flavor.' }),
  b({ id: 'dexter_pasture', name: 'Dexter Pasture', icon: '🐄', kind: 'pen', w: 3, h: 2, cost: 33300, level: 185, xp: 278, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'dexter', capacity: 5, desc: 'Home for up to 5 dexter cows.' }),
  b({ id: 'ugli_fruit_tree', name: 'Ugli Fruit Tree', icon: '🍊', kind: 'tree', cost: 17100, level: 190, max: 8, xp: 86, height: 66, sellable: true, fruit: 'ugli_fruit', growTime: 2340, desc: 'Gives 2 ugli fruits again and again.' }),
  b({ id: 'pumpkin_carriage', name: 'Pumpkin Carriage', icon: '🎃', kind: 'deco', w: 2, h: 2, cost: 11700, level: 195, max: 2, xp: 58, height: 80, sellable: true, desc: 'A fairy tale ride home by midnight.' }),
  // farmyard things
  b({ id: 'firewood_pile', name: 'Firewood Pile', icon: '🪵', kind: 'deco', w: 1, h: 1, cost: 960, level: 16, max: 4, xp: 6, height: 45, sellable: true, desc: 'Split logs stacked for winter, and a chopping block.' }),
  b({ id: 'milk_churns', name: 'Milk Churns', icon: '🥛', kind: 'deco', w: 1, h: 1, cost: 1440, level: 24, max: 4, xp: 8, height: 50, sellable: true, desc: 'Steel churns waiting at the lane for the dairy.' }),
  b({ id: 'apple_crates', name: 'Apple Crates', icon: '🍎', kind: 'deco', w: 1, h: 1, cost: 2160, level: 36, max: 4, xp: 11, height: 40, sellable: true, desc: 'Crates of red and green apples fresh from the orchard.' }),
  b({ id: 'tool_shed', name: 'Tool Shed', icon: '🛖', kind: 'deco', w: 1, h: 1, cost: 3200, level: 44, max: 2, xp: 14, height: 100, sellable: true, desc: 'A little plank shed for the rakes and spades.' }),
  b({ id: 'sunflower_patch', name: 'Sunflower Patch', icon: '🌻', kind: 'deco', w: 1, h: 1, cost: 3840, level: 64, max: 4, xp: 19, height: 90, sellable: true, desc: 'Tall sunflowers turning their faces to the sun.' }),
  b({ id: 'flower_bicycle', name: 'Flower Bicycle', icon: '🚲', kind: 'deco', w: 1, h: 1, cost: 5160, level: 86, max: 2, xp: 24, height: 60, sellable: true, desc: 'An old town bike with a basket full of flowers.' }),
  b({ id: 'friesian_stable', name: 'Friesian Stable', icon: '🐴', kind: 'pen', w: 3, h: 2, cost: 35460, level: 197, xp: 296, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'friesian', capacity: 5, desc: 'Home for up to 5 friesian horses.' }),
];
export const BUILDING: Record<string, BuildingDef> = Object.fromEntries(BUILDINGS.map((x) => [x.id, x]));

// Things unlocked at a given level, used by the level up screen
// what bites at the fishing spot: id, level it starts biting, how often (relative weight)
export const CATCHES: [string, number, number][] = [
  ['fish', 1, 40], ['salmon', 10, 20], ['lobster', 12, 14], ['crab', 14, 12], ['trout', 22, 12], ['tuna', 31, 10],
  ['shrimp', 40, 10], ['squid', 52, 8], ['octopus', 64, 7], ['swordfish', 78, 6], ['eel', 92, 6], ['pufferfish', 108, 5],
  ['stingray', 125, 4], ['marlin', 145, 3.5], ['pearl', 170, 3], ['golden_fish', 195, 1.5],
  ['sardine', 2, 8.9], ['anchovy', 9, 8.7], ['carp', 14, 8.5], ['perch', 20, 8.3], ['mackerel', 26, 8.1], ['tilapia', 31, 7.9], ['catfish', 38, 7.7], ['sea_bream', 44, 7.5], ['sea_bass', 50, 7.2], ['red_mullet', 55, 7.1], ['cod', 61, 6.9], ['pike', 68, 6.6], ['haddock', 74, 6.4], ['flounder', 79, 6.2], ['koi', 85, 6.0], ['arctic_char', 91, 5.8], ['grayling', 97, 5.6], ['sole', 102, 5.4], ['yellowtail', 109, 5.2], ['red_snapper', 114, 5.0], ['bonito', 120, 4.8], ['halibut', 126, 4.6], ['turbot', 131, 4.4], ['mahi_mahi', 138, 4.2], ['barracuda', 144, 4.0], ['grouper', 150, 3.7], ['clownfish', 155, 3.6], ['angelfish', 161, 3.4], ['parrotfish', 168, 3.1], ['wahoo', 174, 2.9], ['lionfish', 179, 2.7], ['sturgeon', 185, 2.5], ['sunfish', 191, 2.3], ['anglerfish', 197, 2.1],
  ['bluegill', 4, 8.8], ['largemouth_bass', 6, 8.6], ['crayfish', 12, 8.2], ['crappie', 17, 8.0], ['chub', 29, 7.4], ['whitefish', 47, 6.8], ['bream', 58, 6.4], ['walleye', 83, 5.6], ['muskie', 140, 3.8], ['paddlefish', 182, 2.6],
  ['plaice', 18, 8.0], ['bluefish', 47, 6.8], ['pompano', 64, 6.2], ['skate', 93, 5.2], ['moray_eel', 160, 3.4],
  ['herring', 23, 7.3], ['sprat', 38, 6.9], ['zander', 42, 6.7], ['tench', 55, 6.3], ['roach', 66, 6.0], ['rainbow_trout', 71, 5.9], ['hake', 81, 5.6], ['pollock', 88, 5.4], ['whiting', 101, 5.0], ['garfish', 114, 4.6], ['john_dory', 116, 4.5], ['amberjack', 128, 4.2], ['tarpon', 133, 4.0], ['snook', 147, 3.6], ['cobia', 156, 3.3], ['triggerfish', 161, 3.2], ['butterflyfish', 171, 2.9], ['blue_tang', 178, 2.7], ['boxfish', 187, 2.4], ['sailfish', 199, 2.0],
];

// what lives in fresh water bites at the lake; everything else is a sea catch. The plain fish
// bites at both.
export const FRESHWATER = new Set(['fish', 'carp', 'perch', 'trout', 'rainbow_trout', 'catfish', 'pike', 'zander', 'tench', 'roach', 'grayling', 'arctic_char',
  'koi', 'tilapia', 'sturgeon', 'eel', 'golden_fish', 'bluegill', 'largemouth_bass', 'crayfish', 'crappie', 'chub', 'whitefish', 'bream', 'walleye', 'muskie', 'paddlefish']);
export const LAKE_CATCHES = CATCHES.filter(([id]) => FRESHWATER.has(id));
export const SEA_CATCHES = CATCHES.filter(([id]) => id === 'fish' || !FRESHWATER.has(id));

export function unlocksAt(level: number): { icon: string; name: string; id?: string }[] {
  const out: { icon: string; name: string; id?: string }[] = [];
  for (const c of CROPS) if (c.level === level) out.push({ icon: ITEMS[c.id].icon, name: ITEMS[c.id].name });
  for (const a of ANIMALS) if (a.level === level) out.push({ icon: a.icon, name: a.name });
  for (const x of BUILDINGS) if (x.buyable && x.level === level && x.kind !== 'plot') out.push({ icon: x.icon, name: x.name, id: x.id });
  for (const r of RECIPES) if (r.level === level) out.push({ icon: ITEMS[r.id].icon, name: ITEMS[r.id].name });
  for (const [id, lv] of CATCHES) if (lv === level && id !== 'fish') out.push({ icon: ITEMS[id].icon, name: ITEMS[id].name });
  return out;
}
