# Cartoon farmhouse, built piece by piece: a stone foundation of individual stones, overlapping
# clapboard walls, a roof of individually laid staggered shingles, a brick chimney, two shingled
# dormers, a gabled entry porch, shuttered windows with flower boxes and potted plants.
# Colors are painted procedurally and baked together with ambient occlusion into one texture.
import math
import os
import random
import sys
sys.path.insert(0, os.path.dirname(__file__))
if '--list' in sys.argv:   # build_all asks each script for its models
    print('farmhouse')
    sys.exit()
from common import (reset, mat, mat_paint, box, cyl, sphere, gable_wall, join_all, shingled_roof,  # noqa: E402
                    bake_and_export, preview, debug_false_colors)

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, '..', '..', 'public', 'models', 'farmhouse.glb')
random.seed(7)
reset()

white = mat_paint('siding', '#f2ede2', '#fffdf8', scale=30, stretch=(1, 1, 8), kind='wave')
trim = mat('trim', '#fdfcf8', 0.6)
stones = [mat_paint(f'stone{i}', c1, c2, scale=18) for i, (c1, c2) in enumerate([('#a39c90', '#c8c0b2'), ('#b0a698', '#d6cdbd'), ('#968f84', '#bab3a6')])]
mortar = mat('mortar', '#7f786e', 0.95)
shingles = [mat_paint(f'sh{i}', c1, c2, scale=40) for i, (c1, c2) in enumerate([('#b8482a', '#d8603a'), ('#c85a30', '#e8764a'), ('#a83e24', '#c85436'), ('#d06a38', '#f08450')])]
roofbase = mat('roofbase', '#5a2a18', 0.9)
bricks = [mat_paint(f'brick{i}', c1, c2, scale=24) for i, (c1, c2) in enumerate([('#c0442a', '#e05a3e'), ('#a83a26', '#c84c34'), ('#d0543a', '#ec6c50')])]
wood = mat_paint('wood', '#c8843e', '#e8a458', scale=6, kind='wave', stretch=(1, 8, 1))
wood_dark = mat_paint('wood_dark', '#9a5a2a', '#b87038', scale=6, kind='wave', stretch=(1, 8, 1))
door_m = mat_paint('door', '#c0392b', '#e0503a', scale=5, kind='wave', stretch=(8, 1, 1))
shutter = mat_paint('shutter', '#1f8a4a', '#34b060', scale=10)
glass = mat('glass', '#8fd4f4', 0.1)
glass_hi = mat('glass_hi', '#e8f8ff', 0.1)
soil = mat('soil', '#5a3a22', 0.95)
leaf = mat_paint('leaf', '#3a9a2a', '#72d040', scale=30)
flowers = [mat('f1', '#ff3d7f', 0.5), mat('f2', '#ffd000', 0.5), mat('f3', '#ffffff', 0.5), mat('f4', '#a060ff', 0.5)]
brass = mat('brass', '#e8b84a', 0.35, 0.7)
pot = mat_paint('pot', '#d0643a', '#ec8050', scale=12)
lamp = mat('lamp', '#fff0b8', 0.3, emit=2.0)

W, D, H, B = 1.5, 1.3, 1.05, 0.14  # wall width (x), depth (y), wall height, foundation height
Z = B + H
FRONT = -D / 2

# ---- foundation: a core plus a skin of irregular stones
box('found', (W + 0.06, D + 0.06, B), (0, 0, B / 2), mortar, bev=0.02)
for face in range(4):
    along = W if face < 2 else D
    n = int(along / 0.13)
    for row in range(2):
        for i in range(n + 1):
            t = -along / 2 + (i + (0.5 if row else 0)) * along / n
            if abs(t) > along / 2 - 0.04:
                continue
            w = along / n * random.uniform(0.82, 0.95)
            h = B / 2 * random.uniform(0.8, 0.95)
            z = h / 2 + row * B / 2 + 0.005
            s = stones[random.randrange(3)]
            if face < 2:
                y = (FRONT - 0.035) if face == 0 else (D / 2 + 0.035)
                box(f'st{face}{row}{i}', (w, 0.05, h), (t, y, z), s, bev=0.018)
            else:
                x = (-W / 2 - 0.035) if face == 2 else (W / 2 + 0.035)
                box(f'st{face}{row}{i}', (0.05, w, h), (x, t, z), s, bev=0.018)

# ---- walls: a core and overlapping clapboards
box('walls', (W, D, H), (0, 0, B + H / 2), white, bev=0.01)
rows = 12
TOPGAP = 0.07  # boards and corner trims stop short of the roof so none pierce the shingles
bh = (H - TOPGAP) / rows
for k in range(rows):
    z = B + (k + 0.5) * bh
    tilt = math.radians(8)
    for face, (sx, sy, lx, ly, rot) in enumerate([
        (W + 0.02, 0.022, 0, FRONT - 0.008, (tilt, 0, 0)), (W + 0.02, 0.022, 0, D / 2 + 0.008, (-tilt, 0, 0)),
        (0.022, D + 0.02, -W / 2 - 0.008, 0, (0, -tilt, 0)), (0.022, D + 0.02, W / 2 + 0.008, 0, (0, tilt, 0))]):
        box(f'cb{face}_{k}', (sx, sy, bh * 1.05), (lx, ly, z), white, rot=rot, bev=0.006)
for cx in (-1, 1):
    for cy in (-1, 1):
        box(f'corner{cx}{cy}', (0.075, 0.075, H - TOPGAP), (cx * (W / 2 + 0.01), cy * (D / 2 + 0.01), B + (H - TOPGAP) / 2), trim, bev=0.015)

# ---- roof: attic, a dark base slab and staggered rows of individual shingles
rise, over = 0.78, 0.17
gable_wall('attic', 0, 0, Z, W, D, rise, white)
shingled_roof('roof', 0, 0, Z, W, D, rise, over, shingles, roofbase, trim, axis='x', rows=13, sw=0.13, seed=3)

# ---- chimney of individual bricks
chx, chy, chz0 = W * 0.3, D * 0.2, Z + rise * 0.35
chh = 0.95
box('chcore', (0.22, 0.22, chh), (chx, chy, chz0 + chh / 2 - 0.2), mortar, bev=0.01)
for r in range(int(chh / 0.06)):
    z = chz0 - 0.2 + (r + 0.5) * 0.06
    if z < Z + rise * (1 - abs(chy) / (D / 2)) - 0.02:
        continue
    for side in range(4):
        for i in range(2):
            off = (i - 0.5) * 0.11 + (0.055 if r % 2 else 0) - 0.0275
            b = bricks[random.randrange(3)]
            if side < 2:
                box(f'br{r}{side}{i}', (0.1, 0.03, 0.05), (chx + off, chy + (0.115 if side else -0.115), z), b, bev=0.008)
            else:
                box(f'br{r}{side}{i}', (0.03, 0.1, 0.05), (chx + (0.115 if side == 3 else -0.115), chy + off, z), b, bev=0.008)
box('chcap', (0.3, 0.3, 0.06), (chx, chy, chz0 + chh - 0.17), stones[0], bev=0.02)
cyl('pot1', 0.04, 0.12, (chx - 0.05, chy, chz0 + chh - 0.08), pot, verts=12)
cyl('pot2', 0.04, 0.1, (chx + 0.06, chy, chz0 + chh - 0.09), pot, verts=12)


# ---- windows
def window(name, x, y, z, facing, w=0.3, h=0.36, flower_box=True):
    """facing: -1 front (-y), 1 back, or 'l'/'r' for the sides."""
    if facing in (-1, 1):
        def B3(dx, dy, dz, sx, sy, sz, m, bev=0.008, rot=(0, 0, 0)):
            return box(name + str(random.random()), (sx, sy, sz), (x + dx, y + dy * facing, z + dz), m, bev=bev, rot=rot)
    else:
        f = -1 if facing == 'l' else 1

        def B3(dx, dy, dz, sx, sy, sz, m, bev=0.008, rot=(0, 0, 0)):
            return box(name + str(random.random()), (sy, sx, sz), (x + dy * f, y + dx, z + dz), m, bev=bev, rot=rot)
    B3(0, 0.02, 0, w + 0.08, 0.04, h + 0.08, trim, 0.012)
    B3(0, 0.03, 0, w, 0.03, h, glass, 0.004)
    B3(-w * 0.18, 0.042, h * 0.2, w * 0.18, 0.01, h * 0.25, glass_hi, 0.002)
    B3(0, 0.045, 0, 0.022, 0.03, h, trim, 0)
    B3(0, 0.045, 0, w, 0.03, 0.022, trim, 0)
    B3(0, 0.05, -h / 2 - 0.05, w + 0.14, 0.08, 0.035, trim, 0.01)
    for s in (-1, 1):
        B3(s * (w / 2 + 0.085), 0.03, 0, 0.12, 0.03, h + 0.06, shutter, 0.012)
        for k in range(5):
            B3(s * (w / 2 + 0.085), 0.045, -h / 2 + 0.06 + k * (h - 0.06) / 5, 0.1, 0.02, 0.018, shutter, 0.004, rot=(0.3, 0, 0))
    if flower_box:
        B3(0, 0.1, -h / 2 - 0.13, w + 0.1, 0.12, 0.1, wood, 0.015)
        B3(0, 0.1, -h / 2 - 0.08, w + 0.06, 0.09, 0.02, soil, 0)
        for i in range(7):
            lx = -w / 2 + 0.01 + i * (w + 0.02) / 6
            if facing in (-1, 1):
                sphere(name + f'lf{i}', 0.035, (x + lx, y + 0.1 * facing, z - h / 2 - 0.06), leaf, scale=(1.3, 1.1, 0.8), segs=10)
                sphere(name + f'fl{i}', 0.028, (x + lx + 0.015, y + 0.12 * facing, z - h / 2 - 0.03 + (i % 2) * 0.02), flowers[i % 4], segs=10)
            else:
                f = -1 if facing == 'l' else 1
                sphere(name + f'lf{i}', 0.035, (x + 0.1 * f, y + lx, z - h / 2 - 0.06), leaf, scale=(1.1, 1.3, 0.8), segs=10)
                sphere(name + f'fl{i}', 0.028, (x + 0.12 * f, y + lx + 0.015, z - h / 2 - 0.03 + (i % 2) * 0.02), flowers[i % 4], segs=10)


window('wf1', -0.45, FRONT - 0.01, B + 0.58, -1)
window('wf2', 0.45, FRONT - 0.01, B + 0.58, -1)
window('wb1', -0.35, D / 2 + 0.01, B + 0.58, 1, flower_box=False)
window('wb2', 0.35, D / 2 + 0.01, B + 0.58, 1, flower_box=False)
window('wl', -W / 2 - 0.01, 0, B + 0.58, 'l')
window('wr', W / 2 + 0.01, 0, B + 0.58, 'r')

# ---- dormers, each with a little shingled gable roof
for dx in (-0.4, 0.4):
    yz = -D * 0.26
    zb = Z + rise * (1 - abs(yz) / (D / 2)) - 0.14
    # the dormer body reaches down into the main roof so no gap shows under its front corners
    box(f'dorm{dx}', (0.34, 0.4, 0.5), (dx, yz + 0.05, zb + 0.05), white, bev=0.012)
    gable_wall(f'dormg{dx}', dx, yz + 0.05, zb + 0.3, 0.4, 0.34, 0.17, white, axis='y')
    shingled_roof(f'dr{dx}', dx, yz + 0.05, zb + 0.3, 0.4, 0.34, 0.17, 0.05, shingles, roofbase, trim, axis='y', rows=4, sw=0.1, base_thick=0.03, seed=int(dx * 10) + 20, rake_ends=(-1,), eave_trim=False)
    box(f'dtrim{dx}', (0.28, 0.03, 0.26), (dx, yz - 0.155, zb + 0.15), trim, bev=0.01)
    box(f'dglass{dx}', (0.2, 0.035, 0.19), (dx, yz - 0.16, zb + 0.15), glass, bev=0.004)
    box(f'dbar{dx}', (0.02, 0.04, 0.19), (dx, yz - 0.165, zb + 0.15), trim, bev=0)

# ---- entry porch: a deck, two posts and a little gabled roof over the door
dxp = 0.0
box('step1', (0.62, 0.36, 0.06), (dxp, FRONT - 0.2, 0.03), stones[1], bev=0.02)
box('deck', (0.72, 0.32, 0.06), (dxp, FRONT - 0.17, B - 0.02), wood, bev=0.015)
for i in range(6):
    box(f'plank{i}', (0.01, 0.32, 0.062), (dxp - 0.3 + i * 0.12, FRONT - 0.17, B - 0.02), wood_dark, bev=0)
for sx in (-1, 1):
    cyl(f'post{sx}', 0.03, 0.66, (dxp + sx * 0.3, FRONT - 0.3, B + 0.34), trim, verts=12)
    box(f'postcap{sx}', (0.08, 0.08, 0.04), (dxp + sx * 0.3, FRONT - 0.3, B + 0.67), trim, bev=0.01)
pz = B + 0.69
gable_wall('pgable', dxp, FRONT - 0.18, pz, 0.36, 0.76, 0.22, white, axis='y')
shingled_roof('proof', dxp, FRONT - 0.18, pz, 0.36, 0.76, 0.22, 0.06, shingles, roofbase, None, axis='y', rows=4, sw=0.1, base_thick=0.03, seed=40)
# the door itself
box('dframe', (0.4, 0.05, 0.72), (dxp, FRONT - 0.02, B + 0.36), trim, bev=0.012)
box('door', (0.32, 0.05, 0.64), (dxp, FRONT - 0.035, B + 0.32), door_m, bev=0.015)
for pzz in (0.17, 0.45):
    for px in (-0.07, 0.07):
        box(f'dp{pzz}{px}', (0.1, 0.03, 0.2), (dxp + px, FRONT - 0.06, B + pzz), door_m, bev=0.015)
box('dwin', (0.2, 0.03, 0.08), (dxp, FRONT - 0.062, B + 0.58), glass, bev=0.01)
sphere('knob', 0.02, (dxp + 0.1, FRONT - 0.08, B + 0.32), brass, segs=12)
box('mat', (0.3, 0.16, 0.012), (dxp, FRONT - 0.17, B + 0.012), mat_paint('matm', '#c8402c', '#e85a40', scale=40), bev=0.004)
# a lantern beside the door, potted plants on the step
box('lampbk', (0.05, 0.02, 0.1), (dxp + 0.28, FRONT - 0.02, B + 0.52), wood_dark, bev=0.005)
box('lampb', (0.07, 0.07, 0.1), (dxp + 0.28, FRONT - 0.07, B + 0.52), lamp, bev=0.01)
box('lamptop', (0.09, 0.09, 0.025), (dxp + 0.28, FRONT - 0.07, B + 0.585), wood_dark, bev=0.008)
for sx in (-1, 1):
    cyl(f'pot{sx}', 0.06, 0.1, (dxp + sx * 0.42, FRONT - 0.24, 0.11), pot, verts=16, r2=0.075)
    for i in range(6):
        a = i * 1.05
        sphere(f'pl{sx}{i}', 0.04, (dxp + sx * 0.42 + math.cos(a) * 0.035, FRONT - 0.24 + math.sin(a) * 0.035, 0.19 + (i % 2) * 0.02), leaf, segs=10)
    sphere(f'pf{sx}', 0.03, (dxp + sx * 0.42, FRONT - 0.24, 0.24), flowers[0 if sx < 0 else 1], segs=10)

if os.environ.get('DEBUG'):
    # trace stray specks: trim red, siding blue, glass yellow and orange, white flowers magenta
    debug_false_colors(os.path.join(HERE, 'farmhouse_debug.png'),
                       {'trim': (1, 0, 0), 'siding': (0, 0, 1), 'glass_hi': (1, 1, 0), 'glass': (1, 0.5, 0), 'f3': (1, 0, 1)},
                       cam_loc=(-1.6, -3.0, 1.6), target=(0, -0.5, 0.8))
    sys.exit(0)
ob = join_all('farmhouse')
bake_and_export(ob, OUT, tex_size=2048, glow=('glass', 'glass_hi', 'lamp'))
preview(os.path.join(HERE, 'farmhouse_preview.png'), cam_loc=(3.0, -3.6, 2.8), target=(0, 0, 0.8))
preview(os.path.join(HERE, 'farmhouse_front.png'), cam_loc=(-1.6, -3.0, 1.6), target=(0, -0.5, 0.8))
print('done', os.path.abspath(OUT))
