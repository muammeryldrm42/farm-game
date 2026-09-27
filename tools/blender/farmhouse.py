# Cartoon farmhouse: white clapboard walls on a stone base, a steep brown shingle roof with two
# dormers, a brick chimney, a front porch with a railing, shuttered windows and flower boxes.
import math
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
from common import reset, mat, box, cyl, sphere, gable_roof, gable_wall, finish_and_export, preview  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'models', 'farmhouse.glb')
reset()
white = mat('siding', '#f6f1e7', 0.8)
trim = mat('trim', '#ffffff', 0.6)
stone = mat('stone', '#a9a296', 0.95)
roof = mat('roof', '#8a4f2c', 0.85)
roof2 = mat('roof_dark', '#74402a', 0.85)
brick = mat('brick', '#b5553c', 0.9)
wood = mat('wood', '#b98049', 0.8)
door = mat('door', '#7a4726', 0.7)
shutter = mat('shutter', '#3f7f5a', 0.7)
glass = mat('glass', '#bfe2f2', 0.15, emit=0.15)
soil = mat('soil', '#6b4527', 0.95)
leaf = mat('leaf', '#4f9e36', 0.8)
flw = [mat('f1', '#ff6b8a', 0.6), mat('f2', '#ffd23a', 0.6), mat('f3', '#ffffff', 0.6)]
brass = mat('brass', '#e8c060', 0.35, 0.6)

W, D, H, B = 1.5, 1.4, 1.1, 0.12  # wall width, depth, height, base height
# stone base with individual blocks
box('base', (W + 0.12, D + 0.12, B), (0, 0, B / 2), stone, bev=0.03)
for i in range(9):
    x = -W / 2 + 0.08 + i * (W - 0.1) / 8
    box(f'blk{i}', (0.15, 0.03, 0.07), (x, -(D + 0.12) / 2 - 0.005, 0.06 + (i % 2) * 0.01), stone, bev=0.012)
# walls with overlapping clapboards
box('walls', (W, D, H), (0, 0, B + H / 2), white, bev=0.02)
for k in range(10):
    z = B + 0.06 + k * (H - 0.08) / 10
    for side, (sx, sy, lx, ly) in enumerate([(W + 0.02, 0.025, 0, -D / 2 - 0.005), (W + 0.02, 0.025, 0, D / 2 + 0.005), (0.025, D + 0.02, W / 2 + 0.005, 0), (0.025, D + 0.02, -W / 2 - 0.005, 0)]):
        box(f'board{k}_{side}', (sx, sy, 0.05), (lx, ly, z), white, bev=0.008)
# corner trim
for cx in (-1, 1):
    for cy in (-1, 1):
        box(f'corner{cx}{cy}', (0.07, 0.07, H), (cx * W / 2, cy * D / 2, B + H / 2), trim, bev=0.012)
# attic walls and a steep shingled roof, ridge along X
rise, over = 0.8, 0.16
Z = B + H
gable_wall('attic', 0, 0, Z, W, D, rise, white)
gable_roof('roof', 0, 0, Z, W, D, rise, over, roof, lip=roof2, rows=7)
cyl('ridge', 0.055, W + 2 * over + 0.04, (0, 0, Z + rise + 0.05), roof2, verts=12, rot=(0, math.radians(90), 0))
# chimney
box('chimney', (0.2, 0.2, 0.8), (W * 0.28, D * 0.18, Z + rise * 0.55), brick, bev=0.02)
box('chimcap', (0.26, 0.26, 0.06), (W * 0.28, D * 0.18, Z + rise * 0.55 + 0.42), stone, bev=0.02)
# two dormers poking out of the front slope, each with its own little gable roof
for dx in (-0.38, 0.38):
    yz = -D * 0.3
    zb = Z + rise * (1 - abs(yz) / (D / 2)) - 0.12
    box(f'dorm{dx}', (0.3, 0.36, 0.3), (dx, yz + 0.04, zb + 0.15), white, bev=0.015)
    gable_wall(f'dormg{dx}', dx, yz + 0.04, zb + 0.3, 0.36, 0.3, 0.15, white, axis='y')
    gable_roof(f'dormr{dx}', dx, yz + 0.04, zb + 0.3, 0.36, 0.3, 0.15, 0.05, roof, axis='y', thick=0.04)
    box(f'dwinf{dx}', (0.2, 0.025, 0.19), (dx, yz - 0.145, zb + 0.15), trim, bev=0.008)
    box(f'dwin{dx}', (0.15, 0.03, 0.14), (dx, yz - 0.15, zb + 0.15), glass, bev=0.005)

def window(x, z, facing_y=-1, side=False, flowers=True):
    y = facing_y * (D / 2 + 0.02)
    if side:
        return
    box(f'wf{x}{z}', (0.34, 0.03, 0.38), (x, y, z), trim, bev=0.01)
    box(f'wg{x}{z}', (0.27, 0.035, 0.31), (x, y - 0.005 * facing_y, z), glass, bev=0.005)
    box(f'wm{x}{z}', (0.02, 0.04, 0.31), (x, y - 0.008 * facing_y, z), trim, bev=0)
    box(f'wn{x}{z}', (0.27, 0.04, 0.02), (x, y - 0.008 * facing_y, z), trim, bev=0)
    for s in (-1, 1):
        sh = box(f'ws{x}{z}{s}', (0.1, 0.025, 0.36), (x + s * 0.24, y, z), shutter, bev=0.01)
        for k in range(4):
            box(f'wsl{x}{z}{s}{k}', (0.08, 0.03, 0.012), (x + s * 0.24, y - 0.01 * facing_y, z - 0.12 + k * 0.08), shutter, bev=0.004)
    if flowers:
        box(f'fb{x}{z}', (0.36, 0.1, 0.08), (x, y - 0.06 * facing_y, z - 0.24), wood, bev=0.012)
        box(f'fbs{x}{z}', (0.32, 0.08, 0.02), (x, y - 0.06 * facing_y, z - 0.195), soil, bev=0)
        for i in range(5):
            sphere(f'fl{x}{z}{i}', 0.035, (x - 0.13 + i * 0.065, y - 0.07 * facing_y, z - 0.17 + (i % 2) * 0.015), flw[i % 3], segs=10)
            sphere(f'lf{x}{z}{i}', 0.03, (x - 0.1 + i * 0.05, y - 0.05 * facing_y, z - 0.19), leaf, scale=(1.3, 1, 0.7), segs=8)


window(0.35, B + 0.5)
window(0.35, B + 0.5, facing_y=1)
window(-0.35, B + 0.5, facing_y=1)
# side windows
for sx in (-1, 1):
    x = sx * (W / 2 + 0.02)
    box(f'swf{sx}', (0.03, 0.34, 0.38), (x, 0.1, B + 0.55), trim, bev=0.01)
    box(f'swg{sx}', (0.035, 0.27, 0.31), (x + sx * 0.005, 0.1, B + 0.55), glass, bev=0.005)
# front door with frame, panels, knob and a stone step
dx = -0.32
box('doorframe', (0.4, 0.04, 0.74), (dx, -D / 2 - 0.02, B + 0.37), trim, bev=0.012)
box('door', (0.32, 0.05, 0.66), (dx, -D / 2 - 0.03, B + 0.33), door, bev=0.015)
for py in (0.18, 0.46):
    for px in (-0.07, 0.07):
        box(f'dp{py}{px}', (0.1, 0.06, 0.18), (dx + px, -D / 2 - 0.035, B + py), mat('door_panel', '#8a5530', 0.7), bev=0.012)
sphere('knob', 0.022, (dx + 0.1, -D / 2 - 0.07, B + 0.34), brass, segs=10)
# porch: deck, posts, roof and railing
PD = 0.3
py0 = -D / 2 - PD / 2 - 0.02
box('deck', (W + 0.1, PD, 0.08), (0, py0, B - 0.02), wood, bev=0.015)
for i in range(8):
    box(f'plank{i}', (0.02, PD, 0.085), (-W / 2 + 0.05 + i * W / 7, py0, B - 0.02), mat('wood_dark', '#9a6a3a', 0.8), bev=0)
for x in (-W / 2, 0.05, W / 2):
    cyl(f'post{x}', 0.035, 0.72, (x, py0 - PD / 2 + 0.04, B + 0.38), trim, verts=10)
box('porchroof', (W + 0.24, PD + 0.16, 0.05), (0, py0 - 0.02, B + 0.76), roof, rot=(math.radians(-12), 0, 0), bev=0.02)
box('rail', (W * 0.45, 0.04, 0.04), (0.42, py0 - PD / 2 + 0.04, B + 0.28), trim, bev=0.01)
for i in range(6):
    box(f'bal{i}', (0.025, 0.025, 0.2), (0.12 + i * 0.12, py0 - PD / 2 + 0.04, B + 0.16), trim, bev=0.005)
box('mat', (0.26, 0.14, 0.012), (dx, py0, B + 0.03), mat('mat', '#b5452c', 0.9), bev=0.004)
# a rocking chair on the porch
cx, cy = 0.45, py0 + 0.02
box('seat', (0.16, 0.14, 0.025), (cx, cy, B + 0.16), wood, bev=0.006)
box('back', (0.16, 0.025, 0.2), (cx, cy + 0.07, B + 0.27), wood, rot=(math.radians(-10), 0, 0), bev=0.006)
for s in (-1, 1):
    cyl(f'rock{s}', 0.12, 0.02, (cx + s * 0.07, cy, B + 0.12), wood, verts=20, rot=(0, math.radians(90), 0), bev=0)
# a lantern by the door
box('lamp', (0.06, 0.06, 0.09), (dx + 0.28, -D / 2 - 0.06, B + 0.55), mat('lamp', '#ffe7a3', 0.3, emit=1.5), bev=0.01)

finish_and_export(OUT)
preview(os.path.join(os.path.dirname(__file__), '..', '..', 'tools', 'blender', 'farmhouse_preview.png'))
print('done', os.path.abspath(OUT))
