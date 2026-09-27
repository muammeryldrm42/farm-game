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
item('horseshoe', 'Lucky Horseshoe', '🧲', 'barn', 95, 15);
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
item('rosette', 'Show Rosette', '🏵️', 'barn', 125, 24);
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

recipe('quill', 'workshop', { gobbler_feather: 2 }, 240, 11, 10);
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
recipe('bouquet', 'florist', { rose: 2, tulip: 2, sunflower: 1 }, 240, 12, 11);
recipe('lavender_sachet', 'florist', { lavender: 2, cotton: 1 }, 270, 13, 12);
recipe('flower_crown', 'florist', { rose: 1, lavender: 1, tulip: 2 }, 330, 16, 13);
recipe('oat_cookie', 'bakery', { oat: 3, sugar: 1 }, 120, 6, 4);
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

export const RECIPE: Record<string, RecipeDef> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

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
  { id: 'bronze_turkey', name: 'Bronze Turkey', icon: '🦃', house: 'turkey_run', feed: 'chicken_feed', product: 'bronze_feather', time: 837, xp: 20, cost: 2212, level: 79 },
  { id: 'saanen_goat', name: 'Saanen Goat', icon: '🐐', house: 'saanen_yard', feed: 'goat_feed', product: 'saanen_milk', time: 882, xp: 24, cost: 2632, level: 94 },
  { id: 'ayam_cemani', name: 'Ayam Cemani', icon: '🐓', house: 'cemani_coop', feed: 'chicken_feed', product: 'black_egg', time: 921, xp: 27, cost: 2996, level: 107 },
  { id: 'grey_heron', name: 'Grey Heron', icon: '🪿', house: 'heron_marsh', feed: 'duck_feed', product: 'heron_plume', time: 957, xp: 30, cost: 3332, level: 119 },
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
  b({ id: 'date_palm', name: 'Date Palm', icon: '@date', kind: 'tree', cost: 3000, level: 60, max: 8, xp: 35, height: 80, sellable: true, fruit: 'date', growTime: 1320, desc: 'A desert palm heavy with sticky dates.' }),
  b({ id: 'lychee_tree', name: 'Lychee Tree', icon: '@lychee', kind: 'tree', cost: 3800, level: 72, max: 8, xp: 40, height: 70, sellable: true, fruit: 'lychee', growTime: 1420, desc: 'Gives 2 bunches of lychees again and again.' }),
  b({ id: 'hazelnut_tree', name: 'Hazelnut Tree', icon: '@hazelnut', kind: 'tree', cost: 4700, level: 84, max: 8, xp: 45, height: 70, sellable: true, fruit: 'hazelnut', growTime: 1520, desc: 'Gives 2 hazelnuts again and again.' }),
  b({ id: 'starfruit_tree', name: 'Starfruit Tree', icon: '@starfruit', kind: 'tree', cost: 5800, level: 98, max: 8, xp: 51, height: 70, sellable: true, fruit: 'starfruit', growTime: 1640, desc: 'Gives 2 star shaped fruits again and again.' }),
  b({ id: 'maple_tree', name: 'Maple Tree', icon: '@maple_syrup', kind: 'tree', cost: 7200, level: 112, max: 8, xp: 57, height: 70, sellable: true, fruit: 'maple_syrup', growTime: 1760, desc: 'A blazing red maple. Tap it for sweet syrup.' }),
  b({ id: 'cocoa_tree', name: 'Cocoa Tree', icon: '@cocoa_pod', kind: 'tree', cost: 9500, level: 132, max: 8, xp: 65, height: 70, sellable: true, fruit: 'cocoa_pod', growTime: 1900, desc: 'Ribbed cocoa pods grow right on the trunk.' }),
  b({ id: 'sakura_tree', name: 'Cherry Blossom Tree', icon: '@sakura', kind: 'tree', cost: 13000, level: 165, max: 8, xp: 78, height: 70, sellable: true, fruit: 'sakura', growTime: 2100, desc: 'A dream in pink. Gives 2 blossom sprays again and again.' }),
  b({ id: 'golden_apple_tree', name: 'Golden Apple Tree', icon: '@golden_apple', kind: 'tree', cost: 20000, level: 195, max: 8, xp: 95, height: 70, sellable: true, fruit: 'golden_apple', growTime: 2400, desc: 'A legendary tree that grows apples of pure gold.' }),
  b({ id: 'orange_tree', name: 'Orange Tree', icon: '🍊', kind: 'tree', cost: 450, level: 11, max: 12, xp: 10, height: 64, sellable: true, fruit: 'orange', growTime: 480, desc: 'Gives 2 oranges again and again.' }),

  b({ id: 'guinea_run', name: 'Guinea Fowl Run', icon: '@guinea_fowl', kind: 'pen', w: 2, h: 2, cost: 2800, level: 22, xp: 70, height: 26, wall: '#c9a46a', roof: '#6b8a3a', animal: 'guinea_fowl', capacity: 6, desc: 'Busy spotted birds that lay speckled eggs.' }),
  b({ id: 'pheasant_run', name: 'Pheasant Run', icon: '@pheasant', kind: 'pen', w: 3, h: 3, cost: 4200, level: 30, xp: 90, height: 26, wall: '#8fc45a', roof: '#8a3a2a', animal: 'pheasant', capacity: 5, desc: 'Handsome pheasants with long copper tail feathers.' }),
  b({ id: 'highland_pasture', name: 'Highland Pasture', icon: '@highland_cow', kind: 'pen', w: 3, h: 3, cost: 5500, level: 38, xp: 110, height: 26, wall: '#86c24f', roof: '#5a3a24', animal: 'highland_cow', capacity: 5, desc: 'Shaggy ginger cattle that give rich fresh cream.' }),
  b({ id: 'swan_lake', name: 'Swan Lake', icon: '🦢', kind: 'pen', w: 3, h: 3, cost: 7000, level: 47, xp: 130, height: 26, wall: '#8fc45a', roof: '#f4efe6', animal: 'swan', capacity: 4, desc: 'Graceful swans glide on the lake and shed soft down.' }),
  b({ id: 'emu_ranch', name: 'Emu Ranch', icon: '@emu', kind: 'pen', w: 3, h: 3, cost: 8500, level: 56, xp: 150, height: 26, wall: '#d8c38e', roof: '#7a5a3a', animal: 'emu', capacity: 4, desc: 'Curious emus lay deep green eggs.' }),
  b({ id: 'reindeer_lodge', name: 'Reindeer Lodge', icon: '🦌', kind: 'pen', w: 3, h: 3, cost: 11000, level: 68, xp: 180, height: 26, wall: '#e8f0f4', roof: '#8a2a2a', animal: 'reindeer', capacity: 4, desc: 'A snowy lodge for reindeer. They love carrots.' }),
  b({ id: 'bison_range', name: 'Bison Range', icon: '🦬', kind: 'pen', w: 3, h: 3, cost: 14000, level: 82, xp: 210, height: 26, wall: '#b8a46c', roof: '#4a3424', animal: 'bison', capacity: 4, desc: 'Mighty bison grow thick warm wool.' }),
  b({ id: 'flamingo_lagoon', name: 'Flamingo Lagoon', icon: '🦩', kind: 'pen', w: 3, h: 3, cost: 18000, level: 96, xp: 240, height: 26, wall: '#8fc45a', roof: '#f28ab0', animal: 'flamingo', capacity: 4, desc: 'Pink flamingos wade in a warm lagoon.' }),
  b({ id: 'llama_ranch', name: 'Llama Ranch', icon: '@llama', kind: 'pen', w: 3, h: 3, cost: 23000, level: 118, xp: 280, height: 26, wall: '#8fc45a', roof: '#c0392b', animal: 'llama', capacity: 4, desc: 'Proud llamas in bright tassels grow fine wool.' }),
  b({ id: 'silkie_coop', name: 'Silkie Coop', icon: '@silkie_chicken', kind: 'pen', w: 2, h: 2, cost: 6700, level: 21, xp: 98, height: 26, wall: '#e3cf94', roof: '#e88aa8', animal: 'silkie_chicken', capacity: 6, desc: 'Fluffy silkie hens lay small cream eggs.' }),
  b({ id: 'pony_paddock', name: 'Pony Paddock', icon: '🐴', kind: 'pen', w: 3, h: 3, cost: 7300, level: 24, xp: 103, height: 26, wall: '#9ccc5a', roof: '#c0392b', animal: 'pony', capacity: 4, desc: 'Shetland ponies win show rosettes. They love carrots.' }),
  b({ id: 'black_sheepfold', name: 'Black Sheep Fold', icon: '@black_sheep', kind: 'pen', w: 3, h: 3, cost: 7700, level: 26, xp: 107, height: 26, wall: '#9ccc5a', roof: '#34495e', animal: 'black_sheep', capacity: 5, desc: 'Every flock needs one. Gives soft black wool.' }),
  b({ id: 'jersey_pasture', name: 'Jersey Pasture', icon: '🐮', kind: 'pen', w: 3, h: 3, cost: 8100, level: 28, xp: 110, height: 26, wall: '#86c24f', roof: '#8a5a34', animal: 'jersey_cow', capacity: 5, desc: 'Gentle fawn cows with big eyes and rich milk.' }),
  b({ id: 'muscovy_pond', name: 'Muscovy Pond', icon: '@muscovy_duck', kind: 'pen', w: 3, h: 3, cost: 8500, level: 30, xp: 114, height: 26, wall: '#8fc45a', roof: '#2e6da4', animal: 'muscovy_duck', capacity: 5, desc: 'Hardy ducks with red faces. They lay big eggs.' }),
  b({ id: 'nubian_yard', name: 'Nubian Goat Yard', icon: '@nubian_goat', kind: 'pen', w: 3, h: 3, cost: 9100, level: 33, xp: 119, height: 26, wall: '#b8a46c', roof: '#8a3a2a', animal: 'nubian_goat', capacity: 5, desc: 'Long eared goats with creamy milk.' }),
  b({ id: 'silk_house', name: 'Silk House', icon: '🐛', kind: 'pen', w: 2, h: 2, cost: 9700, level: 36, xp: 125, height: 26, wall: '#f4efe6', roof: '#b5452c', animal: 'silkworm', capacity: 6, desc: 'Silkworms munch mulberry leaves and spin silk.' }),
  b({ id: 'angora_yard', name: 'Angora Goat Yard', icon: '@angora_goat', kind: 'pen', w: 3, h: 3, cost: 10300, level: 39, xp: 130, height: 26, wall: '#b8a46c', roof: '#6b4226', animal: 'angora_goat', capacity: 5, desc: 'Curly locked goats that grow shiny mohair.' }),
  b({ id: 'mandarin_pond', name: 'Mandarin Pond', icon: '@mandarin_duck', kind: 'pen', w: 3, h: 3, cost: 11100, level: 43, xp: 137, height: 26, wall: '#8fc45a', roof: '#c0392b', animal: 'mandarin_duck', capacity: 5, desc: 'The most colorful duck on the water.' }),
  b({ id: 'squirrel_grove', name: 'Squirrel Grove', icon: '🐿️', kind: 'pen', w: 2, h: 2, cost: 11700, level: 46, xp: 143, height: 26, wall: '#86c24f', roof: '#6b4226', animal: 'squirrel', capacity: 4, desc: 'Busy squirrels gather acorns. They love walnuts.' }),
  b({ id: 'merino_fold', name: 'Merino Fold', icon: '@merino_sheep', kind: 'pen', w: 3, h: 3, cost: 12300, level: 49, xp: 148, height: 26, wall: '#9ccc5a', roof: '#5a7a9a', animal: 'merino_sheep', capacity: 5, desc: 'The finest wool in the world grows on merinos.' }),
  b({ id: 'parrot_aviary', name: 'Parrot Aviary', icon: '🦜', kind: 'pen', w: 2, h: 2, cost: 13100, level: 53, xp: 155, height: 26, wall: '#8fc45a', roof: '#2a8a5a', animal: 'parrot', capacity: 4, desc: 'Chatty parrots drop bright feathers. They love bananas.' }),
  b({ id: 'galloway_pasture', name: 'Galloway Pasture', icon: '@belted_galloway', kind: 'pen', w: 3, h: 3, cost: 14100, level: 58, xp: 164, height: 26, wall: '#86c24f', roof: '#34495e', animal: 'belted_galloway', capacity: 5, desc: 'Fluffy black cattle with a white belt.' }),
  b({ id: 'moose_woods', name: 'Moose Woods', icon: '@moose', kind: 'pen', w: 3, h: 3, cost: 15100, level: 63, xp: 173, height: 26, wall: '#86c24f', roof: '#5a3a24', animal: 'moose', capacity: 4, desc: 'Giant gentle moose. Their milk makes rare cheese.' }),
  b({ id: 'cashmere_yard', name: 'Cashmere Goat Yard', icon: '@cashmere_goat', kind: 'pen', w: 3, h: 3, cost: 15900, level: 67, xp: 181, height: 26, wall: '#b8a46c', roof: '#8a6a4a', animal: 'cashmere_goat', capacity: 5, desc: 'Mountain goats with the softest undercoat.' }),
  b({ id: 'rhea_ranch', name: 'Rhea Ranch', icon: '@rhea', kind: 'pen', w: 3, h: 3, cost: 16700, level: 71, xp: 188, height: 26, wall: '#d8c38e', roof: '#7a5a3a', animal: 'rhea', capacity: 4, desc: 'Big grey birds from the pampas lay huge eggs.' }),
  b({ id: 'bactrian_corral', name: 'Bactrian Corral', icon: '🐫', kind: 'pen', w: 3, h: 3, cost: 17700, level: 76, xp: 197, height: 26, wall: '#e2cf98', roof: '#b5452c', animal: 'bactrian_camel', capacity: 4, desc: 'Two humps and a thick winter coat of wool.' }),
  b({ id: 'beaver_pond', name: 'Beaver Pond', icon: '🦫', kind: 'pen', w: 3, h: 3, cost: 18500, level: 80, xp: 204, height: 26, wall: '#8fc45a', roof: '#6b4226', animal: 'beaver', capacity: 4, desc: 'Hard working beavers cut timber by their dam.' }),
  b({ id: 'jacob_fold', name: 'Jacob Fold', icon: '@jacob_sheep', kind: 'pen', w: 3, h: 3, cost: 19700, level: 86, xp: 215, height: 26, wall: '#9ccc5a', roof: '#6b4226', animal: 'jacob_sheep', capacity: 5, desc: 'Spotted sheep with four curling horns.' }),
  b({ id: 'deer_park', name: 'Deer Park', icon: '@spotted_deer', kind: 'pen', w: 3, h: 3, cost: 20900, level: 92, xp: 226, height: 26, wall: '#86c24f', roof: '#5a3a24', animal: 'spotted_deer', capacity: 4, desc: 'Graceful deer shed their antlers each year.' }),
  b({ id: 'crane_marsh', name: 'Crane Marsh', icon: '@crane', kind: 'pen', w: 3, h: 3, cost: 22100, level: 98, xp: 236, height: 26, wall: '#8fc45a', roof: '#f4efe6', animal: 'crane', capacity: 4, desc: 'Elegant cranes dance in the marsh.' }),
  b({ id: 'zebu_pasture', name: 'Zebu Pasture', icon: '@zebu', kind: 'pen', w: 3, h: 3, cost: 23300, level: 104, xp: 247, height: 26, wall: '#c9b27a', roof: '#b5452c', animal: 'zebu', capacity: 4, desc: 'Humped cattle that thrive in the heat.' }),
  b({ id: 'musk_ox_range', name: 'Musk Ox Range', icon: '@musk_ox', kind: 'pen', w: 3, h: 3, cost: 24900, level: 112, xp: 262, height: 26, wall: '#eef3f6', roof: '#4a3424', animal: 'musk_ox', capacity: 4, desc: 'Shaggy arctic giants with priceless qiviut wool.' }),
  b({ id: 'black_swan_lake', name: 'Black Swan Lake', icon: '@black_swan', kind: 'pen', w: 3, h: 3, cost: 26500, level: 120, xp: 276, height: 26, wall: '#8fc45a', roof: '#34495e', animal: 'black_swan', capacity: 4, desc: 'Rare black swans with ruby red bills.' }),
  b({ id: 'cassowary_ranch', name: 'Cassowary Ranch', icon: '@cassowary', kind: 'pen', w: 3, h: 3, cost: 28100, level: 128, xp: 290, height: 26, wall: '#8fc45a', roof: '#2a6a8a', animal: 'cassowary', capacity: 4, desc: 'Striking birds with a helmet crest and bright green eggs.' }),
  b({ id: 'watusi_ranch', name: 'Watusi Ranch', icon: '@watusi', kind: 'pen', w: 3, h: 3, cost: 29700, level: 136, xp: 305, height: 26, wall: '#c9b27a', roof: '#8a3a2a', animal: 'watusi', capacity: 4, desc: 'Cattle with the biggest horns in the world.' }),
  b({ id: 'chinchilla_hutch', name: 'Chinchilla Hutch', icon: '@chinchilla', kind: 'pen', w: 2, h: 2, cost: 31500, level: 145, xp: 321, height: 26, wall: '#86c24f', roof: '#7a8aa0', animal: 'chinchilla', capacity: 5, desc: 'Round eared puffballs leave soft fluff after dust baths.' }),
  b({ id: 'owl_barn', name: 'Owl Barn', icon: '🦉', kind: 'pen', w: 2, h: 2, cost: 33500, level: 155, xp: 339, height: 26, wall: '#86c24f', roof: '#8a5a34', animal: 'barn_owl', capacity: 4, desc: 'Barn owls keep the farm free of mice.' }),
  b({ id: 'kiwi_burrow', name: 'Kiwi Burrow', icon: '@kiwi_bird', kind: 'pen', w: 2, h: 2, cost: 36100, level: 168, xp: 362, height: 26, wall: '#86c24f', roof: '#6b4226', animal: 'kiwi_bird', capacity: 4, desc: 'Shy round birds that lay enormous eggs.' }),
  b({ id: 'vicuna_ranch', name: 'Vicuna Ranch', icon: '@vicuna', kind: 'pen', w: 3, h: 3, cost: 38900, level: 182, xp: 388, height: 26, wall: '#d8c38e', roof: '#c0392b', animal: 'vicuna', capacity: 4, desc: 'Wild cousins of the llama. The rarest wool of all.' }),
  b({ id: 'golden_nest', name: 'Golden Nest', icon: '@golden_goose', kind: 'pen', w: 2, h: 2, cost: 50000, level: 200, xp: 500, height: 26, wall: '#e8c865', roof: '#d4a020', animal: 'golden_goose', capacity: 2, desc: 'The legend itself: a goose that lays golden eggs.' }),
  b({ id: 'coop', name: 'Chicken Coop', icon: '🐔', kind: 'pen', w: 2, h: 2, cost: 150, level: 2, xp: 10, height: 26, wall: '#e3cf94', roof: '#b5452c', animal: 'chicken', capacity: 6, desc: 'Home for up to 6 chickens.' }),
  b({ id: 'pasture', name: 'Cow Pasture', icon: '🐄', kind: 'pen', w: 3, h: 3, cost: 400, level: 5, xp: 20, height: 26, wall: '#9ccc5a', roof: '#6b4226', animal: 'cow', capacity: 5, desc: 'Home for up to 5 cows.' }),
  b({ id: 'sheepfold', name: 'Sheep Fold', icon: '🐑', kind: 'pen', w: 3, h: 3, cost: 1800, level: 10, xp: 50, height: 26, wall: '#b7d77a', roof: '#2e6da4', animal: 'sheep', capacity: 5, desc: 'Home for up to 5 sheep.' }),

  b({ id: 'duck_pond', name: 'Duck Pond', icon: '🦆', kind: 'pen', w: 3, h: 3, cost: 300, level: 6, xp: 15, height: 26, wall: '#8fc45a', roof: '#2e6da4', animal: 'duck', capacity: 5, desc: 'Home for up to 5 ducks.' }),
  b({ id: 'goat_yard', name: 'Goat Yard', icon: '🐐', kind: 'pen', w: 3, h: 3, cost: 1500, level: 12, xp: 45, height: 26, wall: '#b5a36a', roof: '#7a4b26', animal: 'goat', capacity: 5, desc: 'Home for up to 5 goats.' }),
  b({ id: 'beehive', name: 'Bee Garden', icon: '🐝', kind: 'pen', w: 2, h: 2, cost: 1600, level: 13, xp: 45, height: 26, wall: '#9ccc5a', roof: '#f5b92b', animal: 'bee', capacity: 4, desc: 'Up to 4 hives. Bees love sunflowers.' }),
  b({ id: 'rabbit_hutch', name: 'Rabbit Hutch', icon: '🐇', kind: 'pen', w: 2, h: 2, cost: 900, level: 9, xp: 35, height: 26, wall: '#d9b98a', roof: '#c0392b', animal: 'rabbit', capacity: 5, desc: 'Fluffy rabbits give soft angora fur. They love carrots.' }),
  b({ id: 'alpaca_ranch', name: 'Alpaca Ranch', icon: '🦙', kind: 'pen', w: 3, h: 3, cost: 2200, level: 14, xp: 55, height: 26, wall: '#a8cf6a', roof: '#7d5ba6', animal: 'alpaca', capacity: 5, desc: 'Alpacas grow warm wool. Feed them wheat.' }),
  b({ id: 'goose_pen', name: 'Goose Green', icon: '🪿', kind: 'pen', w: 2, h: 2, cost: 1200, level: 11, xp: 40, height: 26, wall: '#9ccc5a', roof: '#3f7fbf', animal: 'goose', capacity: 5, desc: 'Geese lay big eggs for tarts and cakes. They eat duck feed.' }),
  b({ id: 'gobbler_run', name: 'Gobbler Run', icon: '🦃', kind: 'pen', w: 2, h: 2, cost: 1100, level: 10, xp: 40, height: 26, wall: '#c9a46a', roof: '#8e4a2b', animal: 'gobbler', capacity: 5, desc: 'Gobblers shed fine feathers for quill pens. They eat chicken feed.' }),
  b({ id: 'donkey_paddock', name: 'Donkey Paddock', icon: '🫏', kind: 'pen', w: 3, h: 3, cost: 1900, level: 13, xp: 50, height: 26, wall: '#b8a46c', roof: '#6b4226', animal: 'donkey', capacity: 5, desc: 'Gentle donkeys give milk for soap. They love carrots.' }),
  b({ id: 'buffalo_wallow', name: 'Buffalo Wallow', icon: '🐃', kind: 'pen', w: 3, h: 3, cost: 2600, level: 15, xp: 60, height: 26, wall: '#8a6a44', roof: '#4a6a3a', animal: 'buffalo', capacity: 5, desc: 'Water buffalo give rich milk for mozzarella.' }),
  b({ id: 'peacock_garden', name: 'Peacock Garden', icon: '🦚', kind: 'pen', w: 2, h: 2, cost: 3000, level: 17, xp: 65, height: 26, wall: '#9ccc5a', roof: '#2e7d8a', animal: 'peacock', capacity: 4, desc: 'Peacocks drop dazzling feathers. They eat corn.' }),
  b({ id: 'ostrich_ranch', name: 'Ostrich Ranch', icon: '🦤', kind: 'pen', w: 3, h: 3, cost: 3500, level: 19, xp: 75, height: 26, wall: '#d8c38e', roof: '#b5452c', animal: 'ostrich', capacity: 4, desc: 'Ostriches lay giant eggs. They eat wheat.' }),
  b({ id: 'quail_coop', name: 'Quail Coop', icon: '🐦', kind: 'pen', w: 2, h: 2, cost: 950, level: 9, xp: 35, height: 26, wall: '#e8d8b0', roof: '#6b8a3a', animal: 'quail', capacity: 6, desc: 'Tiny quails lay speckled eggs. They eat chicken feed.' }),
  b({ id: 'yak_pasture', name: 'Yak Pasture', icon: '🐂', kind: 'pen', w: 3, h: 3, cost: 3200, level: 18, xp: 70, height: 26, wall: '#9ccc5a', roof: '#5a3a2a', animal: 'yak', capacity: 4, desc: 'Shaggy yaks grow thick wool for warm blankets.' }),
  b({ id: 'camel_corral', name: 'Camel Corral', icon: '🐪', kind: 'pen', w: 3, h: 3, cost: 3800, level: 20, xp: 80, height: 26, wall: '#e2cf98', roof: '#c0602a', animal: 'camel', capacity: 4, desc: 'Camels give creamy milk for a rare cheese. They eat wheat.' }),
  b({ id: 'stable', name: 'Stable', icon: '🐎', kind: 'pen', w: 3, h: 3, cost: 2500, level: 15, xp: 60, height: 26, wall: '#c2a36b', roof: '#8e2c20', animal: 'horse', capacity: 5, desc: 'Up to 5 horses. Each horse adds 5% to order coins.' }),
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
  b({ id: 'hereford_ranch', name: 'Hereford Ranch', icon: '🐄', kind: 'pen', w: 3, h: 3, cost: 9000, level: 45, xp: 68, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'hereford', capacity: 5, desc: 'Home for up to 5 hereford cows.' }),
  b({ id: 'chestnut_tree', name: 'Chestnut Tree', icon: '🌰', kind: 'tree', cost: 4590, level: 51, max: 8, xp: 23, height: 64, sellable: true, fruit: 'chestnut', growTime: 1506, desc: 'Gives 2 chestnuts again and again.' }),
  b({ id: 'garden_swing', name: 'Garden Swing', icon: '🪢', kind: 'deco', w: 1, h: 1, cost: 3120, level: 52, max: 4, xp: 16, height: 54, sellable: true, desc: 'A wooden swing under a little frame.' }),
  b({ id: 'bonfire', name: 'Bonfire', icon: '🔥', kind: 'deco', w: 1, h: 1, cost: 3540, level: 59, max: 4, xp: 18, height: 24, sellable: true, desc: 'A crackling campfire ringed with stones.' }),
  b({ id: 'papaya_tree', name: 'Papaya Tree', icon: '🍈', kind: 'tree', cost: 5490, level: 61, max: 8, xp: 27, height: 64, sellable: true, fruit: 'papaya', growTime: 1566, desc: 'Gives 2 papayas again and again.' }),
  b({ id: 'suffolk_fold', name: 'Suffolk Fold', icon: '🐑', kind: 'pen', w: 3, h: 3, cost: 12800, level: 64, xp: 96, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'suffolk_sheep', capacity: 5, desc: 'Home for up to 5 suffolk sheep.' }),
  b({ id: 'kumquat_tree', name: 'Kumquat Tree', icon: '🍊', kind: 'tree', cost: 5940, level: 66, max: 8, xp: 30, height: 64, sellable: true, fruit: 'kumquat', growTime: 1596, desc: 'Gives 2 kumquats again and again.' }),
  b({ id: 'totem_pole', name: 'Totem Pole', icon: '🗿', kind: 'deco', w: 1, h: 1, cost: 4140, level: 69, max: 4, xp: 21, height: 100, sellable: true, desc: 'Carved and painted by hand.' }),
  b({ id: 'picnic_spot', name: 'Picnic Spot', icon: '🧺', kind: 'deco', w: 1, h: 1, cost: 4500, level: 75, max: 4, xp: 22, height: 14, sellable: true, desc: 'A checked blanket and a basket of treats.' }),
  b({ id: 'guava_tree', name: 'Guava Tree', icon: '🍐', kind: 'tree', cost: 6930, level: 77, max: 8, xp: 35, height: 64, sellable: true, fruit: 'guava', growTime: 1662, desc: 'Gives 2 guavas again and again.' }),
  b({ id: 'turkey_run', name: 'Turkey Run', icon: '🦃', kind: 'pen', w: 2, h: 2, cost: 15800, level: 79, xp: 118, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'bronze_turkey', capacity: 6, desc: 'Home for up to 6 bronze turkeys.' }),
  b({ id: 'pistachio_tree', name: 'Pistachio Tree', icon: '🥜', kind: 'tree', cost: 7470, level: 83, max: 8, xp: 37, height: 64, sellable: true, fruit: 'pistachio', growTime: 1698, desc: 'Gives 2 pistachios again and again.' }),
  b({ id: 'wind_turbine', name: 'Wind Turbine', icon: '🌬️', kind: 'deco', w: 1, h: 1, cost: 5100, level: 85, max: 4, xp: 26, height: 170, sellable: true, desc: 'Clean power from the breeze.' }),
  b({ id: 'stone_bridge', name: 'Stone Bridge', icon: '🌉', kind: 'deco', w: 2, h: 1, cost: 5400, level: 90, max: 2, xp: 27, height: 24, sellable: true, desc: 'An arched bridge over a little brook.' }),
  b({ id: 'elderberry_tree', name: 'Elderberry Tree', icon: '🫐', kind: 'tree', cost: 8190, level: 91, max: 8, xp: 41, height: 64, sellable: true, fruit: 'elderberry', growTime: 1746, desc: 'Gives 2 elderberrys again and again.' }),
  b({ id: 'saanen_yard', name: 'Saanen Yard', icon: '🐐', kind: 'pen', w: 3, h: 3, cost: 18800, level: 94, xp: 141, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'saanen_goat', capacity: 5, desc: 'Home for up to 5 saanen goats.' }),
  b({ id: 'dragon_fruit_tree', name: 'Dragon Fruit Tree', icon: '🐉', kind: 'tree', cost: 8730, level: 97, max: 8, xp: 44, height: 64, sellable: true, fruit: 'dragon_fruit', growTime: 1782, desc: 'Gives 2 dragon fruits again and again.' }),
  b({ id: 'pergola', name: 'Pergola', icon: '🏛️', kind: 'deco', w: 2, h: 2, cost: 5940, level: 99, max: 2, xp: 30, height: 72, sellable: true, desc: 'Vines climbing over white beams.' }),
  b({ id: 'horse_statue', name: 'Horse Statue', icon: '🐎', kind: 'deco', w: 1, h: 1, cost: 6180, level: 103, max: 4, xp: 31, height: 68, sellable: true, desc: 'A bronze horse on a stone plinth.' }),
  b({ id: 'pecan_tree', name: 'Pecan Tree', icon: '🌰', kind: 'tree', cost: 9450, level: 105, max: 8, xp: 47, height: 64, sellable: true, fruit: 'pecan', growTime: 1830, desc: 'Gives 2 pecans again and again.' }),
  b({ id: 'cemani_coop', name: 'Cemani Coop', icon: '🐓', kind: 'pen', w: 2, h: 2, cost: 21400, level: 107, xp: 160, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'ayam_cemani', capacity: 6, desc: 'Home for up to 6 ayam cemani hens.' }),
  b({ id: 'blood_orange_tree', name: 'Blood Orange Tree', icon: '🍊', kind: 'tree', cost: 9810, level: 109, max: 8, xp: 49, height: 64, sellable: true, fruit: 'blood_orange', growTime: 1854, desc: 'Gives 2 blood oranges again and again.' }),
  b({ id: 'torii_gate', name: 'Torii Gate', icon: '⛩️', kind: 'deco', w: 2, h: 1, cost: 6600, level: 110, max: 2, xp: 33, height: 80, sellable: true, desc: 'A red gate from a faraway garden.' }),
  b({ id: 'zen_garden', name: 'Zen Garden', icon: '🪨', kind: 'deco', w: 2, h: 2, cost: 6900, level: 115, max: 2, xp: 34, height: 16, sellable: true, desc: 'Raked sand and quiet stones.' }),
  b({ id: 'jackfruit_tree', name: 'Jackfruit Tree', icon: '🍈', kind: 'tree', cost: 10440, level: 116, max: 8, xp: 52, height: 64, sellable: true, fruit: 'jackfruit', growTime: 1896, desc: 'Gives 2 jackfruits again and again.' }),
  b({ id: 'heron_marsh', name: 'Heron Marsh', icon: '🪿', kind: 'pen', w: 3, h: 3, cost: 23800, level: 119, xp: 178, height: 26, wall: '#8fc45a', roof: '#8a4a2a', animal: 'grey_heron', capacity: 4, desc: 'Home for up to 4 grey herons.' }),
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
