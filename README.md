# Talons Farm

A cozy 3D farming game in the style of Hay Day and FarmVille, built with Next.js 14, TypeScript, Tailwind and three.js. Every model, texture and shader is generated in code, no asset files. No real money purchases. Everything is earned in game with coins, gems and XP.

By Talons Protocol.

## Features

- In all today: 133 crops, 99 animals each with its own home, 98 fruit trees, 29 workshops with 369 recipes, 85 kinds of fish, 97 decorations in the shop (and 8 season event prizes), 40 goals, 13 badges, 6 album and 6 museum collections, a 200 chapter story and 21 languages. The lines below grew with the game, so their own counts are what each step added
- Real time 3D farm with sun shadows, drifting cloud shadows, day and night cycle with glowing windows, sea shimmer, chimney smoke and turning windmills
- Canvas generated textures with normal maps (roof tiles, boards, siding, stone, grass, soil, bark, sand, metal, straw), rounded animals, farmer and trees
- Wind blown instanced grass and wild flowers, animated water with shallows and surf, gradient sky with stars
- ACES tone mapping, soft shadows, ambient occlusion (GTAO) and bloom for night lights
- Harvest, planting, production, animal and tree animations
- A bigger 60 x 60 island with room for every workshop, pen and tree (older saves are moved to the middle automatically)
- Storage upgrades that grow as you go: each silo or barn upgrade adds 5 more room than the one before
- Compact 3 x 2 pens for the big animals
- Fishing spot off the south shore: cast a line, wait for a bite, reel in fish and lobsters
- Manor for the farmer; tap free land to walk the farmer and dog there, at night they go home to sleep
- Butterflies, gulls, leaping fish and a sailboat on the horizon
- Rabbits (angora fur) and alpacas (alpaca wool) with new loom goods; straw skep beehives
- Realistic sculpted animals (jointed legs, lifelike eyes, breed colors) and painted produce: dimpled apples, cherry pairs, pitted oranges, blushing peaches, lemons, tomatoes, strawberries, chilies
- Hand painted canvas icons for goods without a fitting emoji; leaf card tree crowns; realistic Holstein cows; ruffled lettuce
- Sculpted signed distance field animals, rolling sea swell, drawn at full sharpness
- High and Low graphics quality in Settings (kept per device, outside the save)
- Free camera: drag to pan, pinch or scroll to zoom, turn it with the rotate button or Q and E
- 9 crops (wheat to sunflower) with drag to plant and drag to harvest
- 7 production buildings (Bakery, Feed Mill, Dairy, Sugar Mill, BBQ Grill, Juice Press, Loom) with queues and extra slots
- Animal homes (chickens, cows, sheep and more) that need feed and give eggs, milk, wool and other goods
- Order board with rotating orders, rewards and discard cooldown
- Silo and barn storage with capacity upgrades and a market to sell goods
- Land expansion, obstacles to clear, 10 decorations
- Levels with unlocks, farm goals, 7 day daily gift streak
- Daily tasks from level 3: three small tasks a day made from what the farm can do, and a bonus chest for all three
- Festivals from level 4: every three days a two day festival comes to the farm with its own bonus (Harvest Festival: crops grow 25% faster; Craft Fair: workshops 25% faster; Animal Fair: an extra product one time in four; Market Days: orders pay 25% more; Fishing Festival: bites come twice as fast), only ones the farm can enjoy and never the same twice running
- The Valley Cup from level 6: a week long contest (Monday to Sunday) against four of the story's folk and their farms. Orders, daily tasks, the daily chest, story chapters and the stall's coins earn points; the rivals' points grow a few times a day and keep to the farm's level. At the week's end the place pays gems and coins in Goals (25, 12, 6, 3 or 1 gems), and a first week joined part way counts only the days left
- Season events from level 5, four a year on the same dates (Blossom Days from 1 April, Sunny Days from 10 July, Pumpkin Nights from 20 October, Winter Lights from 18 December), two weeks or so each: orders, daily tasks, harvests, goods made and animal goods earn the event's tokens (butterflies, seashells, candies, snowflakes) for a ten step prize track of coins, gems and two decorations made for the event (a jack-o'-lantern and a lantern arch, a festive pine and a gift sleigh, a blossom tree and a butterfly dome, lawn flamingos and a paddling pool; Blender models in tools/blender/deco5.py, the lanterns and lights glow at night). Prizes left unclaimed are given when the event ends; the decorations are the farm's for good, free to place and worth nothing when sold
- Gems to finish timers early or add production slots (earned by leveling, goals, orders, clearing land)
- Offline progress (timers are timestamp based), autosave in the browser, save code export and import
- Mouse, touch and pinch controls, hold anything to move it, keyboard shortcuts (Esc, Enter, + and -)
- Sound effects and a soft generative background tune, all synthesized with WebAudio, no asset files needed
- The farm's own sounds under the music (Nature sounds in Settings): birds singing by day, crickets and an owl by night, the rain during a shower, and a soft wind and sea, all synthesized
- A tap on a pen and its animals answer: a moo, a baa, a cluck, a quack, a honk, a neigh, a hee-haw or a gobble (synthesized too, a little different each time)
- A farmer and his dog walking around the farm, harvested goods flying into storage
- Weather and seasons (winter snow, spring petals, autumn leaves); showers come on some days only, not every day
- Grazing: open a pen's gate and the hungry animals walk out through it to graze on the grass near the pen (bees fly off to flower beds, flowering crops and fruit trees), then walk back by themselves once full and start producing. Call them back early any time; they always walk, never teleport. Feeding works as before
- Watering: tap a growing field to water it and it needs 30% less of its remaining time. The watering can (top bar) refills over time, faster with wells; rain waters every field for free and sprinklers water the fields around them. Unwatered crops grow as before
- 3 fruit trees (apple, cherry, orange) that keep giving fruit
- Fishing Pier, Jam Maker, Ice Cream Shop and Sushi Bar, 3 new crops (rice, cotton, chili) and 20 new goods
- Roadside stall where you set your own prices and villagers buy over time
- Neighbors' stalls in the stall window: the story's folk sell six goods at a time, the ones the orders on the board are short of first, new ones every three hours (or at once for 2 gems); two and a half times the storage price, so buying to sell again never pays. A short good on the order board that a neighbor sells carries a mark that leads there
- 13 badges with bronze, silver and gold tiers (Task Master, Festival Goer and Good Neighbor among them)
- A 5 step tutorial for new players (older saves skip it)
- Animals: chickens, cows, sheep, ducks, geese, gobblers, quails, goats, rabbits, alpacas, donkeys, water buffalo, peacocks, ostriches, yaks, camels, bees and horses (each horse adds 5% to order coins)
- Workshop for candles and feather pillows, goat cheese at the dairy
- Tap the farmhouse (or the manor once built) to send the farmer to bed and keep farming meanwhile; a nap of 20 seconds or more gives a once a day rested bonus
- Content all the way to level 200: 11 late game animals (guinea fowl, pheasant, highland cow, swan, emu, reindeer, bison, flamingo, llama and the golden goose at 200), 13 new orchard trees (quince to golden apple), 12 new catches at the fishing spot (trout to the golden fish) and goals up to level 200
- 30 more farm animals spread between levels 21 and 182: silkie chickens, ponies, black, merino and Jacob sheep, Jersey, Belted Galloway, zebu, Watusi and musk ox cattle, Nubian, angora and cashmere goats, Muscovy and Mandarin ducks, black swans, silkworms, squirrels, parrots, moose, spotted deer, rheas, cassowaries, kiwi birds, cranes, Bactrian camels, beavers, chinchillas, barn owls and vicunas, each with its own pen and product
- Something new at every level from 1 to 200: 43 more crops (leek to lotus), 24 more fruit trees (tangerine to silver pear), 6 more animals (Hereford cattle, Suffolk sheep, bronze turkeys, Saanen goats, Ayam Cemani hens and grey herons), 36 new dishes and 20 new decorations (sundial, wind turbine, torii gate, tree house, carousel, lighthouse, clock tower, hot air balloon, the golden farmer and more)
- A turtle beach: a wide sandy cove on the west shore where loggerhead sea turtles come ashore on their own, dig a nest, lay their eggs and head back to sea; later the hatchlings dig out and race down to the surf
- Animals in a cartoon style: chunky friendly sculpts with big eyes (the realistic style option was retired)
- Cartoon farmer, puffy cartoon trees and round garden bushes; a calico farm cat roams between the house and the farmer and curls up by the door at night
- Dirt paths that join up with their neighbors (new farms start with one), a porch, dormers and mailbox on the farmhouse, a cupola and weathervane on the barn, and meadow scatter of lupines, wild flowers and pebbles
- The cartoon farmhouse is a Blender model (tools/blender): individual stones, clapboards, a roof of staggered shingles, dormers, a porch and flower boxes, with painted colors and soft shadows baked into one texture; its windows glow at night and the procedural house stands in until it loads
- Animals use a light mesh from afar and a detailed one up close, built in idle time; zoomed far out they switch to a third, very light level (about a seventh of the full model's triangles, tools/blender/lod.py --far2)
- Performance: pen scenery is baked into a few meshes, cartoon eyes are single meshes, objects out of view animate rarely, the shadow map redraws every other frame, forests use light crowns, new animal kinds are sculpted one per frame, and the picture is always drawn sharp, at up to 1.5 pixels per screen point on phones (2 on High), with no resolution drop on slow devices
- Phones: low quality lights with the sky as a light probe instead of a sky map at every pixel (about a quarter less drawing, same look), model textures are sized to what the model can show on the screen (a crab gets a small one), and on phones with 2 GB of memory or less to 256 px at most (the farmhouse and manor aside), the game brings its own emoji on Android (Noto Color Emoji, SIL Open Font License, cut down to the 311 emoji the game shows by tools/emoji_font.py, 708 KB) so an older phone never shows an empty box for a newer emoji, nothing runs while the game is in the background, and the Android app opens without waiting for the internet's time when the phone has not restarted

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy

Push to GitHub, then import the repo on Vercel. No environment variables are needed.

## Project layout

- `src/game/data.ts` items, crops, recipes, animals, buildings
- `src/game/state.ts` game state, save and load, every player action
- `src/game/render3d.ts` three.js renderer, all 3D models and their animations
- `src/game/gfx` procedural textures, water, sky, wind grass and post processing
- `src/game/quality.ts` High and Low graphics quality preference
- `src/game/audio.ts` sound effects
- `src/components` React UI (canvas, HUD, panels)

The game logic lives in `src/game` and has no React dependency, so it can be moved to another frontend or a server later.

## Android app

The game is exported as static files (`out/`) and wrapped in an Android app with Capacitor
(`android/`). Everything, models included, is inside the app: no server or website is needed.

1. `npm install`
2. `npm run android` (builds the game and copies it into `android/`)
3. Open the `android` folder in Android Studio, then Run (or Build > Build APK(s))

Run `npm run android` again after every change to the game. The Android back button closes
the open panel; the app stays fullscreen and keeps the screen on while the farm is open.
