# Blender models

Hand built models for the cartoon art style, made with Blender's Python API and loaded by the
game from `public/models/*.glb`.

## Setup

    pip install bpy        # Blender as a Python module (5.x)

## Build

    python3 tools/blender/build_all.py          # every model
    python3 tools/blender/farmhouse.py          # one model

Each script writes its `.glb` into `public/models/` plus preview renders next to the script
(ignored by git). `DEBUG=1 python3 tools/blender/farmhouse.py` renders a false color view
that shows which part a stray speck belongs to.

## How a model is made

1. Parts are modeled piece by piece (`common.py`: beveled boxes, cylinders, oriented boxes,
   gable walls, and `shingled_roof` for roofs of individual staggered shingles).
2. Colors are painted with procedural textures (`mat_paint`: noise mottling, wood grain).
3. `bake_and_export` joins everything, unwraps it, bakes the painted colors and ambient
   occlusion into one texture (with a saturation boost so colors stay vivid in the game), bakes
   an emission mask for windows and lamps, and exports a Draco compressed `.glb`.
4. The game (`render3d.ts`, `loadModel` / `swapInModel`) shows the procedural building until the
   model has loaded, keeps it if loading fails, and lights the emission mask up at night.

The Draco decoder the game needs is copied from three.js into `public/draco/`.
