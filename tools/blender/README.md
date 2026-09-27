# Blender models

Hand built models for the cartoon art style, made with Blender's Python API and loaded by the
game from `public/models/*.glb`.

## Setup

    pip install bpy        # Blender as a Python module (5.x)

## Build

    python3 tools/blender/build_all.py              # models whose script changed since their .glb
    python3 tools/blender/build_all.py --all -j 3   # everything, three at a time (after kit.py changes)
    python3 tools/blender/build_all.py barn manor   # just these
    python3 tools/blender/core.py silo              # one model straight from its script
    python3 tools/blender/core.py --list            # the models a script makes

Each model writes its `.glb` into `public/models/` and a preview render into
`tools/blender/previews/` (ignored by git). `DEBUG=1 python3 tools/blender/farmhouse.py` renders
a false color view that shows which part a stray speck belongs to.

## Scripts

- `common.py`: low level parts (beveled boxes, cylinders, oriented boxes, gable walls,
  `shingled_roof`) and painted materials (`mat_paint`: noise mottling, wood grain).
- `kit.py`: the building kit on top of it. A shared palette (`std`), wall faces (`Face`),
  walls in several styles, windows, doors, awnings, signs, chimneys, gable and gambrel roofs of
  staggered shingles, dormers, farm props (crates, barrels, sacks, hay bales, lanterns...), and
  `finish(name)`, which bakes and exports a model. `main(MODELS)` gives every script the same
  command line.
- `farmhouse.py`: the farmhouse (built with `common.py` directly).
- `core.py`: barn, silo, order board, roadside stall, boat dock, fishing pier and manor.
- `production.py`: the 16 workshops (one shop shell with four roof kinds, each with its own
  colors and signature piece: windmill sails, giant cone, brick oven...).
- `deco.py`: decorations, plus rock and bush obstacles in variants (`rock_obs0..2`).
- `deco2.py`: late game decorations (sundial to the golden farmer, levels 31 to 159).
- `pens.py`: every animal pen from one table: fence style, shelter kind and scenery.
- `trees.py`: fruit trees, palms, the oak and wild trees (`tree_obs0..1`).

## How a model is made

1. Parts are modeled piece by piece, built around the footprint center with the front facing
   -Y (the game's +z). One Blender unit is one farm tile.
2. `finish` joins everything, merges coplanar faces, unwraps it, bakes the painted colors and
   ambient occlusion into one texture (with a saturation boost so colors stay vivid in the
   game), bakes an emission mask for windows and lamps, and exports a Draco compressed `.glb`.
3. Empties mark spots the game fills in: `smoke*` (chimney smoke, always on or only while a
   building works), `glow*` (a pool of lamp light at night, added by `lantern`) and `badge` (the
   product icon, added by `sign`). Parts built inside `anim_group('spinY_fan', pivot)` or
   `sway...` are exported as their own node with the origin at the pivot and turned by the game
   (axes are the game's: Y is up). A tree's foliage is a node named `crown` that the game hangs
   in its swaying crown group, next to the fruit it grows.
4. The game (`render3d.ts`, `MODELS` / `useModel`) shows the procedural building until the model
   has loaded, keeps it if loading fails, and lights the emission mask up at night. Stand in
   parts the model does not cover (water, pen yards and herds, fruit, goods on display, the
   boat) are flagged `keep`. `variants: n` picks `<id><object id % n>`.

The Draco decoder the game needs is copied from three.js into `public/draco/`.
