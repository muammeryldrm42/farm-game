# The world around the farm: forest trees for the locked land (light enough to draw hundreds
# of them as instances), the FOR SALE sign on buyable land, and the tilled soil of a crop plot.
# Run: python3 tools/blender/world.py [names...]   (see kit.main)
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from kit import ball, bark_mat, box, cyl, finish, leaf_mats, main, pm, rock, std, uid  # noqa: E402


def forest_pine():
    """A low poly pine for the forest: a stubby trunk and four jagged tiers. The game tints each
    copy a little differently, so the leaves are painted in light greens."""
    rnd = random.Random(4)
    bark = bark_mat('fp_bark', '#7a4a26', '#8e5a30')
    cyl(uid('t'), 0.07, 0.36, (0, 0, 0.18), bark, verts=8, r2=0.05, bev=0)
    greens = [pm('fp1', '#4a9a3a', '#5aaa44', scale=20), pm('fp2', '#55a642', '#62b24c', scale=20)]
    for i in range(4):
        k = i / 3
        r = 0.46 - 0.28 * k
        z = 0.28 + i * 0.3
        c = cyl(uid('tier'), r, 0.52, (0, 0, z + 0.26), greens[i % 2], verts=12, r2=0.0, bev=0, smooth=False)
        for v in c.data.vertices:
            if v.co.z < 0:
                a = math.atan2(v.co.y, v.co.x)
                # a zigzag hem, like layers of branches
                v.co.z += 0.04 * (1 if int((a + 4) * 12 / (2 * math.pi)) % 2 else -1)
                v.co.x *= 1 + (rnd.random() - 0.5) * 0.12
                v.co.y *= 1 + (rnd.random() - 0.5) * 0.12
    finish('forest_pine', tex=256, vivid=1.05, ao_min=0.55, preview=True)


def forest_round():
    """A low poly round tree: a trunk and a crown of a few big lobes."""
    rnd = random.Random(7)
    bark = bark_mat('fr_bark', '#7a4a26', '#8e5a30')
    cyl(uid('t'), 0.08, 0.5, (0, 0, 0.25), bark, verts=8, r2=0.06, bev=0)
    greens = [pm('fr1', '#4c9a36', '#5aa842', scale=20), pm('fr2', '#428e30', '#50a03c', scale=20)]
    ball(uid('core'), 0.36, (0, 0, 0.82), greens[0], scale=(1, 1, 0.9), segs=12)
    for i in range(7):
        a = i * 2.39996
        zf = 0.6 - i / 6 * 1.0
        rr = math.sqrt(max(0.0, 1 - zf * zf)) * 0.3
        ball(uid('lobe'), rnd.uniform(0.18, 0.22), (math.cos(a) * rr, math.sin(a) * rr, 0.82 + zf * 0.28), greens[i % 2], segs=10)
    finish('forest_round', tex=256, vivid=1.05, ao_min=0.55, preview=True)


def forsale_sign():
    """A wooden FOR SALE sign on a post, lettered on both faces."""
    m = std()
    board = pm('fs_board', '#c98a45', '#d89a52', scale=6, kind='wave', stretch=(1, 8, 1))
    frame = pm('fs_frame', '#6b4226', '#7a4c2c', scale=6, kind='wave', stretch=(1, 8, 1))
    letters = pm('fs_letters', '#fff6e2')
    box(uid('post'), (0.08, 0.08, 1.02), (0, 0.04, 0.51), frame, bev=0.015)
    ball(uid('cap'), 0.05, (0, 0.04, 1.03), frame, scale=(1, 1, 0.7), segs=10)
    box(uid('board'), (0.9, 0.05, 0.45), (0, 0, 0.95), board, bev=0.02)
    for z, h in ((1.165, 0.04), (0.735, 0.04)):
        box(uid('fr'), (0.94, 0.07, h), (0, 0, z), frame, bev=0.012)
    for sx in (-1, 1):
        box(uid('fr'), (0.04, 0.07, 0.47), (sx * 0.45, 0, 0.95), frame, bev=0.012)
    for sx in (-1, 1):
        box(uid('nail'), (0.02, 0.08, 0.02), (sx * 0.38, 0, 1.1), m['iron'], bev=0)
    for side in (-1, 1):
        bpy.ops.object.text_add(location=(0, side * 0.027, 0.95))
        t = bpy.context.active_object
        t.name = uid('text')
        t.data.body = 'FOR SALE'
        t.data.align_x = 'CENTER'
        t.data.align_y = 'CENTER'
        t.data.size = 0.16
        t.data.extrude = 0.006
        t.data.bevel_depth = 0.003
        t.rotation_euler = (math.radians(90), 0, math.radians(180) if side > 0 else 0)
        # heavy lettering: fatten the outline a little
        t.data.offset = 0.004
        bpy.ops.object.convert(target='MESH')
        t = bpy.context.active_object
        t.data.materials.clear()
        t.data.materials.append(letters)
    for i in range(5):
        a = i * 1.3
        ball(uid('tuft'), 0.05, (math.cos(a) * 0.1, math.sin(a) * 0.1 + 0.04, 0.02), m['leaf'], scale=(1.3, 1, 0.6), segs=8)
    finish('forsale_sign', tex=512, vivid=1.1)


def plot():
    """A tilled crop plot: a bed of dark soil with four raised furrows and a few clods."""
    rnd = random.Random(3)
    soil = pm('plot_soil', '#7a4a28', '#8e5a32', scale=24)
    furrow = pm('plot_furrow', '#6a3e20', '#7c4a28', scale=24)
    box(uid('bed'), (0.92, 0.92, 0.09), (0, 0, 0.045), soil, bev=0.035)
    for k in range(4):
        y = -0.3 + k * 0.2
        r = cyl(uid('row'), 0.075, 0.8, (0, y, 0.08), furrow, verts=16, rot=(0, math.radians(90), 0), bev=0.03)
        r.scale = (0.45, 1, 1)   # a low rounded mound, not a log (local x is up once turned)
    for i in range(14):
        x, y = rnd.uniform(-0.4, 0.4), rnd.uniform(-0.4, 0.4)
        rock(uid('clod'), rnd.uniform(0.012, 0.022), (x, y, 0.1), soil if i % 2 else furrow, seed=i, squash=0.6)
    finish('plot', tex=512, vivid=1.1)


MODELS = {'forest_pine': forest_pine, 'forest_round': forest_round, 'forsale_sign': forsale_sign, 'plot': plot}

if __name__ == '__main__':
    main(MODELS)
