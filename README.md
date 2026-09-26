# Talons Farm

A cozy 3D farming game in the style of Hay Day and FarmVille, built with Next.js 14, TypeScript, Tailwind and three.js. Every model, texture and shader is generated in code, no asset files. No real money purchases. Everything is earned in game with coins, gems and XP.

By Talons Protocol.

## Features

- Real time 3D farm with sun shadows, drifting cloud shadows, day and night cycle with glowing windows, sea shimmer, chimney smoke and turning windmills
- Canvas generated textures with normal maps (roof tiles, boards, siding, stone, grass, soil, bark, sand, metal, straw), rounded animals, farmer and trees
- Wind blown instanced grass and wild flowers, animated water with shallows and surf, gradient sky with stars
- ACES tone mapping, soft shadows, ambient occlusion (GTAO) and bloom for night lights
- Harvest, planting, production, animal and tree animations
- A bigger 44 x 44 island (older saves are moved to the middle automatically)
- Fishing spot off the south shore: cast a line, wait for a bite, reel in fish and lobsters
- Manor for the farmer; tap free land to walk the farmer and dog there, at night they go home to sleep
- Butterflies, gulls, leaping fish and a sailboat on the horizon
- Rabbits (angora fur) and alpacas (alpaca wool) with new loom goods; straw skep beehives
- Realistic sculpted animals (jointed legs, lifelike eyes, breed colors) and painted produce: dimpled apples, cherry pairs, pitted oranges, blushing peaches, lemons, tomatoes, strawberries, chilies
- Hand painted canvas icons for goods without a fitting emoji; leaf card tree crowns; realistic Holstein cows; ruffled lettuce
- Sculpted signed distance field animals, rolling sea swell and a subtle tilt shift miniature look
- High and Low graphics quality in Settings (kept per device, outside the save)
- Free camera: drag to pan, pinch or scroll to zoom, twist with two fingers or press Q and E to rotate
- 9 crops (wheat to sunflower) with drag to plant and drag to harvest
- 7 production buildings (Bakery, Feed Mill, Dairy, Sugar Mill, BBQ Grill, Juice Press, Loom) with queues and extra slots
- Animal homes (chickens, cows, sheep and more) that need feed and give eggs, milk, wool and other goods
- Order board with rotating orders, rewards and discard cooldown
- Silo and barn storage with capacity upgrades and a market to sell goods
- Land expansion, obstacles to clear, 10 decorations
- Levels with unlocks, farm goals, 7 day daily gift streak
- Gems to finish timers early or add production slots (earned by leveling, goals, orders, clearing land)
- Offline progress (timers are timestamp based), autosave in the browser, save code export and import
- Mouse, touch and pinch controls, hold anything to move it, keyboard shortcuts (Esc, Enter, + and -)
- Sound effects and a soft generative background tune, all synthesized with WebAudio, no asset files needed
- A farmer and his dog walking around the farm, harvested goods flying into storage
- Weather and seasons (showers, winter snow, spring petals, autumn leaves), purely cosmetic
- 3 fruit trees (apple, cherry, orange) that keep giving fruit
- Fishing Pier, Jam Maker, Ice Cream Shop and Sushi Bar, 3 new crops (rice, cotton, chili) and 20 new goods
- Cargo boat with crates to fill for big bonus rewards
- Roadside stall where you set your own prices and villagers buy over time
- 11 badges with bronze, silver and gold tiers
- A 5 step tutorial for new players (older saves skip it)
- Animals: chickens, cows, sheep, ducks, geese, gobblers, quails, goats, rabbits, alpacas, donkeys, water buffalo, peacocks, ostriches, yaks, camels, bees and horses (each horse adds 5% to order coins)
- Workshop for candles and feather pillows, goat cheese at the dairy

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
