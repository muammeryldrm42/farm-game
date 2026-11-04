// Goods that shared a picture with others of their kind, each given its own (drawn by icons.ts,
// applied to the items in data.ts). A spec is one of:
//   '<base> [<color>] [marks...]'  the base emoji (`=`: the good's own) recolored to the good's
//                                  own color, its shading kept (`!` after the color darkens,
//                                  `^` lightens), with marks: dots (speckles), stripes, small,
//                                  pair (two of it), flip (turned the other way)
//   'bottle <milk> <cap> <label>'  a milk bottle; 'skein <light> <dark>' a skein of wool;
//   'feather <light> <dark>', 'egg <light> <dark>' (marks too); '@' a picture of its own in
//                                  icons.ts
// The best known good of each kind (milk, egg, wheat, cherry...) keeps its plain emoji. Only
// emoji the game already shows are used: its emoji font holds no others (tools/emoji_font.py).
export const RAW_LOOKS: Record<string, string> = {
  // grains
  rye: '= #9aa36a', quinoa: '= #e8c27a dots', sorghum: '= #b5532e', flax: '= #8fa8d8', millet: '= #e9d36b dots',
  buckwheat: '= #8a6a4a', spelt: '= #d19a4a stripes', amaranth: '= #c0336a', sesame: '= #efe0b0 dots',
  // roots and tubers
  parsnip: '= #efe1b8', daikon: '= #f4f1ea^', horseradish: '= #c8b08a stripes', salsify: '= #5a4232!',
  celeriac: '= #d8c79a dots', taro: '= #8a6a7a stripes', cassava: '= #7a4a2a!', sunchoke: '🥔 #c58a6a small pair',
  yam: '= #7a4a8a', turnip: '🧅 #e6d2f0', rutabaga: '🧅 #d8c080', kohlrabi: '🧅 #8a4ab0', turmeric: '= #e89a1a',
  // vegetables
  cherry_tomato: '= - small pair', jalapeno: '= #3f8a2e', habanero: '= #ff8c1a small',
  kale: '= #2f6a3a stripes', bok_choy: '= #9ed36a stripes', celery: '= #a8d870 flip', arugula: '= #4a8a2a small pair',
  fennel: '🧅 #e8f2c8 stripes', brussels_sprout: '= #7ab84a small pair', swiss_chard: '= #3f7a2e flip', radicchio: '= #8a2a4a',
  endive: '= #f0f0c0', leek: '🧅 #a8d870 stripes', shallot: '= #b86a6a small pair', cauliflower: '= #f8f0dc^',
  romanesco: '= #a8d850 dots', artichoke: '= #6a8a5a stripes', okra: '= #7ab84a small pair', bitter_melon: '= #9ad06a dots',
  fava_bean: '= #a8c870 flip', coffee_bean: '= #4a2a1a!', chickpea: '= #e8c88a', lentil: '= #c86a3a small',
  black_bean: '= #2a2a2a!', mung_bean: '= #6aa83a small',
  // herbs
  mint: '= #3ab890', vanilla: '🫛 #3a2a1a!', hops: '🌰 #a8d870^', wasabi: '🥕 #7ab84a', chives: '= #4a9a3a stripes',
  parsley: '= #2a7a2a pair', dill: '= #9ad040 dots', cilantro: '= #2a8a2a flip', oregano: '= #6a8a3a small',
  asparagus: '🎋 #6aa83a', rosemary: '= #4a6a4a! stripes', lemongrass: '🌾 #a8c860', sage: '= #9ab08a', watercress: '🍀 #4aa83a',
  sorrel: '🥬 #5aa83a small',
  // flowers
  lily: '🌷 #ff9a3a', dahlia: '= #a020a0 flip', poppy: '= #e8201a', iris: '= #4a4ad8 flip', lupin: '= #d870c8',
  orchid: '= #c070e0 flip', carnation: '= #ff5a7a stripes', cornflower: '= #4a6ae8', sweet_pea: '= #f0a0d0^',
  snapdragon: '= #ff9a3a', cosmos: '= #e050a0 small', marigold: '= #ff9a1a', chamomile: '= #fffaf0^ small', daffodil: '= #ffe040',
  gerbera: '= #ff4a6a', zinnia: '= #e8402a flip',
  // fruit
  crabapple: '= - small pair', cranberry: '= #c8102e small', black_cherry: '= #3a0a1a!', goji: '= #ff5a1a small',
  sour_cherry: '= #ff3030 flip', hawthorn: '= #9a1a24 small', rowan: '= #ff7a1a', acerola: '= #ff4a3a dots',
  currant: '= #e8102a small pair', chokecherry: '= #4a1a4a!', tangerine: '= #ff7a1a flip', kumquat: '= #ffa020 small pair',
  blood_orange: '= #c82a1a', clementine: '= #ff9a2a small', ugli_fruit: '= #b8c840', nectarine: '= #e8402a',
  white_peach: '= #ffe8d8^', loquat: '= #ffb020 small pair', yuzu: '= #e8d020 dots', citron: '= #c8d830', bergamot: '= #a8c830 flip',
  guava: '= #9ad06a dots', silver_pear: '= #d8d8c0', nashi: '= #e0b860 dots', plantain: '= #7ab84a', pawpaw: '= #9ab84a',
  elderberry: '= #3a2a4a! small', gooseberry: '= #a8d870', damson: '= #5a2a6a', sloe: '= #3a4a7a dots', blackberry: '= #2a1a2a!',
  jabuticaba: '= #1a1a2a! pair', cantaloupe: '= #f0a050 dots', papaya: '🥭 #ff8a3a', jackfruit: '= #c8b040 dots',
  pomelo: '🍊 #f2e890^', passion_fruit: '🍎 #5a2a5a', mangosteen: '🍅 #4a1a3a!', star_apple: '🍑 #8a3a8a',
  cinnamon: '🪵 #a0522d', medlar: '🍎 #8a6a3a', jujube: '🍒 #8a2a1a', carob: '🫛 #7a4a22 stripes', tamarind: '🫛 #8a5a3a dots',
  longan: '🍇 #c8a06a', sapodilla: '🥔 #9a6a3a', mamey: '🥭 #b8603a', salak: '🍓 #6a2a1a', nutmeg: '🌰 #8a5a3a small',
  greengage: '🍑 #a8d040', feijoa: '🥑 #7aa83a small', tomatillo: '🍅 #9ad050', finger_lime: '🥒 #6a8a3a small',
  soursop: '🍈 #5a9a3a dots', breadfruit: '🍈 #a8c840 stripes', cherimoya: '🍐 #8ab850 dots', lucuma: '🥭 #d8b040',
  black_sapote: '🍅 #4a6a2a', mirabelle: '🍒 #f0d030^', marula: '🍋 #e8c030 small', rambutan: '🍓 #e8202a dots', ackee: '🫑 #e8402a',
  // nuts
  acorn: '= #b8862a', pecan: '= #8a4a2a stripes', durian: '🍈 #8a9a40 stripes', hickory: '= #c8a87a', pine_nut: '= #f0d8a8 small pair',
  brazil_nut: '= #6a3a1a! stripes', pistachio: '= #8ac040', macadamia: '= #e8d8b0', cashew: '= #f0d8a0 flip',
  // eggs
  black_egg: 'egg #5a5656 #1e1c1c', brown_egg: 'egg #d0905a #8a5428', brahma_egg: 'egg #ecc8a2 #b88a5e', runner_egg: 'egg #dcf2ee #9cc8c0',
  white_egg: 'egg #ffffff #dcdcdc', campbell_egg: 'egg #eaf4de #b4c8a4', red_hen_egg: 'egg #f2dcbc #c89a6a dots', chocolate_egg: 'egg #7a4428 #3a1e10',
  // milk
  horseshoe: 'bottle #fbf6ec #8a5a3a #e8d0b0', rosette: 'bottle #fffaf2 #e88ab8 #f8d8e8', saanen_milk: 'bottle #ffffff #6ab0e0 #d8ecf8',
  pygmy_milk: 'bottle #fffdf6 #a070c8 #e8d8f4', buttermilk: 'bottle #f8f0d0 #e8c040 #fff0b8', boer_milk: 'bottle #fffaf0 #c86a3a #f4d0b8',
  creamy_milk: 'bottle #fff4d8 #f0a040 #ffe0a8', show_ribbon: 'bottle #fffdf8 #4a4a4a #e0e0e0', ranch_cream: 'bottle #fff0c8 #3a8a3a #d8f0c8',
  draft_rosette: 'bottle #fffaf4 #2a5aa0 #cfe0f8', golden_milk: 'bottle #ffe08a #d8a020 #fff0b0', alpine_milk: 'bottle #ffffff #2a8ad0 #ffffff',
  swiss_cream: 'bottle #fff6e0 #d83a2a #ffffff', golden_ribbon: 'bottle #fff4e0 #e8b860 #fbe6c0', black_plume: 'bottle #fffdf8 #1a1a1a #f0f0f0',
  // wool
  suffolk_wool: 'skein #f4efe2 #cfc4ac', lop_fluff: 'skein #e2c6a2 #a8845a', valais_wool: 'skein #ffffff #d8d2c4',
  dorper_fleece: 'skein #b89470 #7a5a3e', angora_fiber: 'skein #fde8f0 #e0b8c8', dutch_fluff: 'skein #b0a698 #7a7064',
  shetland_wool: 'skein #8a6040 #5a3a22', karakul_wool: 'skein #4a4440 #1e1a18',
  // feathers and down
  bronze_feather: 'feather #d08a40 #7a4a1e', heron_plume: 'feather #c0d0e0 #7a8ca8', pekin_down: 'feather #fff8dc #e8d8a8',
  toulouse_down: 'feather #b0b0b0 #6a6a6a', crest_feather: 'feather #f06a4a #a0301e', white_plume: 'feather #ffffff #d8dce4',
  call_duck_down: 'feather #e8e4d8 #b8b0a0', laced_feather: 'feather #e8d0a0 #5a3a22', emden_down: 'feather #f4f4f4 #c8ccd4',
  // the rest
  farm_butter: '= #ffd860', dexter_butter: '= #e8b030 flip', hauled_timber: '= - pair',
  // sugar: a bowl of sugar cubes, not the candy it was drawn as (the candy maker's goods are candy)
  sugar: '@',
};
