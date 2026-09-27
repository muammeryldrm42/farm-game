# Crop plants, from the game's own crop kit (src/game/gfx/crops.ts, dumped with
# export_sculpts.mjs): Blender welds each plant, bakes its colors with soft ambient occlusion
# into one texture and exports the plant and its produce as two nodes, `plant` and `fruit`,
# so the game can still tint the produce green while it ripens.
# Run: python3 tools/blender/crops.py [names...]   (see kit.main)
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from animals import SCULPTS, part_mesh  # noqa: E402
from kit import anim_group, finish, main  # noqa: E402


def lin(hex_):
    h = hex_.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c]


def crop(cid):
    with open(os.path.join(SCULPTS, f'crop_{cid}.json')) as f:
        d = json.load(f)
    part_mesh('plant', d['plant'], (0, 0, 0), 4000)
    fruit = d['fruit']
    if fruit and fruit['p']:
        # ripe colors: the produce's own shading times the crop's fruit color
        tint = lin(d['meta']['fruit'])
        n = len(fruit['p']) // 3
        cols = fruit['c'] or [1.0] * (n * 3)
        fruit['c'] = [cols[k] * tint[k % 3] for k in range(n * 3)]
        with anim_group('fruit', (0, 0, 0)):
            part_mesh('fruitm', fruit, (0, 0, 0), 2500)
    finish(f'crop_{cid}', tex=256, vivid=1.08, ao_min=0.7, ao_dist=0.05, preview=True)


MODELS = {}
if os.path.isdir(SCULPTS):
    for f in sorted(os.listdir(SCULPTS)):
        if f.startswith('crop_') and f.endswith('.json'):
            cid = f[5:-5]
            MODELS[f'crop_{cid}'] = (lambda c=cid: crop(c))

if __name__ == '__main__':
    main(MODELS)
