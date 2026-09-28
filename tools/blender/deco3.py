# Second wave decorations: garden gnome, wheelbarrow, rain barrel, flower cart, compost bin,
# mushroom ring, stone lantern, bamboo grove, fairy house, snowman, sandcastle, seesaw, outdoor
# oven, telescope, obelisk, hammock, water wheel, koi pond, camping tent, beach hut, log cabin,
# playground, observatory and a ferris wheel.
# Run: python3 tools/blender/deco3.py [names...]   (see kit.main)
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import (anim_group, ball, bark_mat, box, clump, cyl, finish, glow, lantern, leaf_mats, main, marker, pm,  # noqa: E402,F401
                 prism, rock, std, torus, uid)
from common import obox  # noqa: E402

R90 = math.radians(90)


def tufts(m, pts, seed=1):
    for i, (x, y) in enumerate(pts):
        clump(x, y, 0.05, 0.07, [m['leaf'], pm('d3_l2', '#3f9030')], n=8, seed=seed + i, leaf=0.4)


def wheel(name, c, r, th, mat, spokes=8, axis='x', hub=None):
    rot = (0, R90, 0) if axis == 'x' else (R90, 0, 0)
    torus(uid(name), r, th, c, mat, rot=rot, segs=28, rsegs=6)
    for k in range(spokes):
        a = k * math.pi / spokes
        d = (0, math.cos(a), math.sin(a)) if axis == 'x' else (math.cos(a), 0, math.sin(a))
        obox(uid('spoke'), c, (d, (1, 0, 0) if axis == 'x' else (0, 1, 0), (0, -d[2], d[1]) if axis == 'x' else (-d[2], 0, d[0])), (r * 2, th * 0.8, th * 0.8), mat, bev=0)
    cyl(uid('hub'), th * 2.2, th * 3, c, hub or mat, verts=10, rot=rot)


# ---------------------------------------------------------------- small garden pieces

def garden_gnome():
    m = std()
    cyl(uid('base'), 0.14, 0.04, (0, 0, 0.02), m['stone'][1], verts=12)
    coat, hat, skin = pm('gn_coat', '#2a5ab0'), pm('gn_hat', '#d8281a'), pm('gn_skin', '#f0c0a0')
    beard, boots, belt = pm('gn_beard', '#f8f6f0'), pm('gn_boot', '#4a2a1a'), pm('gn_belt', '#2a1a10')
    for sx in (-1, 1):
        ball(uid('boot'), 0.04, (sx * 0.045, -0.01, 0.06), boots, scale=(0.9, 1.3, 0.7), segs=10)
    cyl(uid('body'), 0.09, 0.18, (0, 0, 0.16), coat, verts=16, r2=0.07)
    cyl(uid('belt'), 0.085, 0.025, (0, 0, 0.13), belt, verts=16, bev=0)
    box(uid('buckle'), (0.03, 0.01, 0.022), (0, -0.085, 0.13), m['brass'], bev=0)
    ball(uid('head'), 0.065, (0, 0, 0.3), skin, segs=14)
    ball(uid('nose'), 0.022, (0, -0.062, 0.3), pm('gn_nose', '#e89a8a'), segs=10)
    ball(uid('beard'), 0.07, (0, -0.035, 0.24), beard, scale=(1, 0.8, 1.2), segs=12)
    cyl(uid('hat'), 0.068, 0.2, (0, 0.01, 0.43), hat, verts=16, r2=0.0, rot=(0.15, 0, 0))
    for sx in (-1, 1):
        ball(uid('eye'), 0.008, (sx * 0.022, -0.058, 0.325), pm('gn_eye', '#1a1a1a'), segs=6)
        cyl(uid('arm'), 0.022, 0.1, (sx * 0.085, -0.02, 0.19), coat, verts=8, rot=(0.4, sx * 0.3, 0))
    # he holds a little shovel
    cyl(uid('shaft'), 0.008, 0.25, (0.1, -0.06, 0.16), m['wood_dark'], verts=6, rot=(0, 0.1, 0))
    box(uid('blade'), (0.045, 0.01, 0.06), (0.11, -0.06, 0.04), m['metal'], bev=0.004)
    tufts(m, [(0.28, -0.25), (-0.3, 0.2)], 1)
    finish('garden_gnome', tex=512)


def wheelbarrow():
    m = std()
    green = pm('wb_green', '#2f8a4a', '#3a9a58', scale=10)
    prism(uid('tray'), [(-0.18, 0.12), (0.2, 0.12), (0.26, 0.3), (-0.3, 0.3)], -0.16, 0.16, green)
    box(uid('soil'), (0.46, 0.28, 0.04), (0, -0.02, 0.29), m['soil'], bev=0.02)
    for i in range(3):
        ball(uid('clod'), 0.05, (-0.1 + i * 0.1, 0.0 + (i % 2) * 0.05, 0.31), m['soil'], scale=(1, 1, 0.6), segs=8)
    ball(uid('sprout'), 0.03, (0.05, 0.05, 0.34), m['leaf'], segs=8)
    for sy in (-1, 1):
        obox(uid('handle'), (0.0, sy * 0.13, 0.2), ((0.95, 0, 0.3), (0, 1, 0), (-0.3, 0, 0.95)), (0.8, 0.025, 0.025), m['wood'], bev=0.006)
        cyl(uid('leg'), 0.012, 0.14, (-0.18, sy * 0.12, 0.07), m['iron'], verts=6)
    cyl(uid('wheel'), 0.1, 0.05, (0.34, 0, 0.1), pm('wb_tyre', '#1e1e1e'), verts=20, rot=(R90, 0, 0))
    cyl(uid('rim'), 0.05, 0.055, (0.34, 0, 0.1), m['metal'], verts=12, rot=(R90, 0, 0))
    tufts(m, [(-0.35, 0.3), (0.35, -0.3)], 3)
    finish('wheelbarrow', tex=512)


def rain_barrel():
    m = std()
    stave = pm('rb_stave', '#8a5a30', '#a86e3e', scale=8, kind='wave', stretch=(1, 1, 8))
    cyl(uid('stand'), 0.2, 0.08, (0, 0, 0.04), m['stone'][0], verts=12)
    cyl(uid('barrel'), 0.17, 0.46, (0, 0, 0.31), stave, verts=20)
    ball(uid('bulge'), 0.19, (0, 0, 0.31), stave, scale=(1, 1, 1.25), segs=18)
    for z in (0.14, 0.31, 0.48):
        torus(uid('hoop'), 0.185 if z == 0.31 else 0.172, 0.012, (0, 0, z), m['iron'], segs=28, rsegs=4)
    cyl(uid('water'), 0.15, 0.01, (0, 0, 0.53), pm('rb_water', '#3a7ab0', rough=0.1), verts=18, bev=0)
    cyl(uid('spout'), 0.015, 0.08, (0, -0.2, 0.18), m['brass'], verts=8, rot=(R90, 0, 0))
    box(uid('tap'), (0.04, 0.01, 0.015), (0, -0.24, 0.2), m['brass'], bev=0)
    cyl(uid('pipe'), 0.025, 0.5, (0.12, 0.12, 0.8), m['metal'], verts=8)
    cyl(uid('bucket'), 0.07, 0.09, (-0.26, -0.2, 0.045), m['metal'], verts=14, r2=0.055)
    tufts(m, [(0.3, -0.3), (-0.3, 0.28)], 5)
    finish('rain_barrel', tex=512)


def flower_cart():
    m = std()
    red = pm('fc_red', '#c8302a', '#d8403a', scale=10)
    box(uid('bed'), (0.6, 0.38, 0.16), (0, 0, 0.3), red, bev=0.02)
    for sx in (-1, 1):
        wheel('wheel', (sx * 0.34, 0, 0.19), 0.17, 0.018, m['wood_dark'], spokes=6)
    cyl(uid('axle'), 0.015, 0.7, (0, 0, 0.19), m['iron'], verts=6, rot=(0, R90, 0))
    obox(uid('pull'), (0, -0.3, 0.28), ((0, -0.95, -0.3), (1, 0, 0), (0, 0.3, -0.95)), (0.34, 0.025, 0.025), m['wood'], bev=0)
    cols = ['#f06a9a', '#f0c020', '#ffffff', '#b058e0', '#f07a2a', '#e8303a']
    rnd = random.Random(4)
    for i in range(10):
        x, y = -0.24 + (i % 5) * 0.12, -0.1 + (i // 5) * 0.2
        cyl(uid('pot'), 0.05, 0.06, (x, y, 0.41), pm('fc_pot', '#b8582a'), verts=10, r2=0.04)
        clump(x, y, 0.47, 0.06, [m['leaf'], pm('fc_l2', '#3f9030')], n=6, seed=10 + i, leaf=0.35)
        for k in range(3):
            a = rnd.uniform(0, 6.28)
            ball(uid('bloom'), 0.022, (x + math.cos(a) * 0.035, y + math.sin(a) * 0.035, 0.51 + rnd.uniform(0, 0.03)), pm(f'fcb{i % 6}', cols[i % 6]), segs=8)
    for sx in (-1, 1):
        cyl(uid('post'), 0.012, 0.4, (sx * 0.28, 0.17, 0.55), m['wood_dark'], verts=6)
    box(uid('awning'), (0.64, 0.24, 0.02), (0, 0.08, 0.76), pm('fc_awn', '#f4efe6', '#e84a5a', scale=10), rot=(-0.3, 0, 0), bev=0.004)
    finish('flower_cart', tex=512)


def compost_bin():
    m = std()
    for i in range(6):
        z = 0.04 + i * 0.075
        for sy in (-1, 1):
            box(uid('slat'), (0.62, 0.035, 0.055), (0, sy * 0.28, z), m['wood_grey'], bev=0.006)
        box(uid('slat'), (0.035, 0.56, 0.055), (-0.3, 0, z), m['wood_grey'], bev=0.006)
        if i < 3:
            box(uid('slat'), (0.035, 0.56, 0.055), (0.3, 0, z), m['wood_grey'], bev=0.006)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('post'), (0.05, 0.05, 0.5), (sx * 0.31, sy * 0.29, 0.25), m['wood_dark'], bev=0.008)
    box(uid('heap'), (0.54, 0.5, 0.3), (0, 0, 0.18), m['soil'], bev=0.08)
    rnd = random.Random(8)
    for i in range(14):
        c = rnd.choice(['#e8a020', '#6a9a3a', '#c8502a', '#8a6a3a', '#f0d890'])
        ball(uid('scrap'), rnd.uniform(0.02, 0.035), (rnd.uniform(-0.2, 0.2), rnd.uniform(-0.18, 0.18), 0.33 + rnd.uniform(0, 0.03)), pm(uid('sc'), c), scale=(1.4, 1, 0.5), segs=8)
    cyl(uid('fork'), 0.01, 0.6, (0.22, -0.2, 0.4), m['wood'], verts=6, rot=(0.3, 0.2, 0))
    finish('compost_bin', tex=512)


def mushroom_ring():
    m = std()
    cap_r, dot, stem = pm('mr_cap', '#d8281a'), pm('mr_dot', '#fbf6ee'), pm('mr_stem', '#f4ecd8')
    moss = pm('mr_moss', '#4a8a2a', '#6aa83a', scale=30)
    ball(uid('moss'), 0.42, (0, 0, -0.02), moss, scale=(1, 1, 0.06), segs=18)
    rnd = random.Random(3)
    for i in range(9):
        a = i * 2 * math.pi / 9
        x, y = math.cos(a) * 0.32, math.sin(a) * 0.32
        s = 0.8 + rnd.uniform(0, 0.6)
        cyl(uid('st'), 0.018 * s, 0.07 * s, (x, y, 0.035 * s), stem, verts=10, r2=0.014 * s)
        ball(uid('cap'), 0.045 * s, (x, y, 0.075 * s), cap_r if i % 3 else pm('mr_cap2', '#c8844a'), scale=(1, 1, 0.55), segs=12)
        if i % 3:
            for k in range(4):
                b = k * 1.6 + i
                ball(uid('dot'), 0.007 * s, (x + math.cos(b) * 0.026 * s, y + math.sin(b) * 0.026 * s, 0.09 * s), dot, segs=6)
    for i in range(6):
        a = rnd.uniform(0, 6.28)
        ball(uid('fl'), 0.012, (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.02), pm('mr_fl', '#f8f0a0'), segs=6)
    finish('mushroom_ring', tex=512)


def stone_lantern():
    m = std()
    stone = pm('sl_stone', '#9a968c', '#b8b2a6', scale=18)
    cyl(uid('base'), 0.16, 0.06, (0, 0, 0.03), stone, verts=6)
    cyl(uid('post'), 0.055, 0.34, (0, 0, 0.23), stone, verts=6)
    cyl(uid('dish'), 0.14, 0.05, (0, 0, 0.42), stone, verts=6, r2=0.11)
    box(uid('light'), (0.15, 0.15, 0.14), (0, 0, 0.51), m['lamp'], bev=0.004)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('col'), (0.035, 0.035, 0.14), (sx * 0.07, sy * 0.07, 0.51), stone, bev=0.005)
    cyl(uid('roof'), 0.2, 0.1, (0, 0, 0.63), stone, verts=6, r2=0.06)
    ball(uid('jewel'), 0.035, (0, 0, 0.71), stone, segs=8)
    ball(uid('moss'), 0.06, (0.09, 0.05, 0.64), pm('sl_moss', '#4a7a2a'), scale=(1, 1, 0.3), segs=8)
    rock(uid('pebble'), 0.05, (0.2, -0.15, 0.02), m['stone'][0], seed=4)
    glow(0, 0, 1.3)
    finish('stone_lantern', tex=512, glow=('lamp',))


def bamboo_grove():
    m = std()
    cane = pm('bb_cane', '#6a9a3a', '#8ab04a', scale=10, kind='wave', stretch=(1, 1, 10))
    node = pm('bb_node', '#4a7a2a')
    leaves = leaf_mats('#4a9a3a', 'bbl')
    rnd = random.Random(6)
    # the canes stand still: the grove is one rigid clump, and swaying it whole looked wrong
    for i in range(9):
        x, y = rnd.uniform(-0.25, 0.25), rnd.uniform(-0.25, 0.25)
        h = rnd.uniform(1.6, 2.3)
        lean = (rnd.uniform(-0.08, 0.08), rnd.uniform(-0.08, 0.08))
        cyl(uid('cane'), 0.022, h, (x + lean[0] * h / 2, y + lean[1] * h / 2, h / 2), cane, verts=8, rot=(-lean[1], lean[0], 0))
        for k in range(1, int(h / 0.3)):
            z = k * 0.3
            torus(uid('node'), 0.023, 0.006, (x + lean[0] * z, y + lean[1] * z, z), node, segs=10, rsegs=4)
        for k in range(6):
            z = h * (0.55 + k * 0.08)
            a = rnd.uniform(0, 6.28)
            obox(uid('leaf'), (x + lean[0] * z + math.cos(a) * 0.08, y + lean[1] * z + math.sin(a) * 0.08, z),
                 ((math.cos(a), math.sin(a), -0.3), (-math.sin(a), math.cos(a), 0), (0.3, 0, 1)), (0.18, 0.035, 0.005), leaves[k % 3], bev=0)
    for i in range(5):
        ball(uid('shoot'), 0.03, (rnd.uniform(-0.35, 0.35), rnd.uniform(-0.35, 0.35), 0.03), pm('bb_shoot', '#c8b060'), scale=(1, 1, 2), segs=8)
    finish('bamboo_grove', tex=1024)


def fairy_house():
    m = std()
    stem = pm('fh_stem', '#f4ecd8', '#fbf6ea', scale=20)
    cap = pm('fh_cap', '#c8281a', '#e03a2a', scale=16)
    cyl(uid('house'), 0.18, 0.36, (0, 0, 0.18), stem, verts=20, r2=0.15)
    ball(uid('cap'), 0.3, (0, 0, 0.4), cap, scale=(1, 1, 0.55), segs=20)
    for k in range(10):
        a = k * 0.63
        ball(uid('spot'), 0.035, (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.5), pm('fh_dot', '#fbf6ee'), scale=(1, 1, 0.4), segs=8)
    ball(uid('door'), 0.07, (0, -0.16, 0.1), m['wood_dark'], scale=(0.8, 0.3, 1.2), segs=12)
    ball(uid('knob'), 0.01, (0.03, -0.18, 0.1), m['brass'], segs=6)
    for a in (0.9, -0.9):
        ball(uid('win'), 0.04, (math.sin(a) * 0.165, -math.cos(a) * 0.165, 0.25), m['lamp'], scale=(1, 0.4, 1), segs=10)
    for i in range(5):
        box(uid('step'), (0.1, 0.06, 0.02), (0, -0.24 - i * 0.07, 0.01), m['stone'][i % 3], rot=(0, 0, i * 0.3), bev=0.008)
    cyl(uid('chim'), 0.03, 0.1, (0.12, 0.08, 0.55), m['stone'][1], verts=8)
    marker('smoke', (0.12, 0.08, 0.62))
    tufts(m, [(0.3, 0.2), (-0.3, 0.15), (0.25, -0.3)], 9)
    glow(0, -0.2, 1.0)
    finish('fairy_house', tex=512, glow=('lamp',))


def snowman():
    m = std()
    snow = pm('sm_snow', '#f4f8fc', '#ffffff', scale=20)
    ball(uid('drift'), 0.34, (0, 0, -0.02), snow, scale=(1, 1, 0.12), segs=18)
    ball(uid('bottom'), 0.2, (0, 0, 0.17), snow, segs=18)
    ball(uid('mid'), 0.15, (0, 0, 0.44), snow, segs=16)
    ball(uid('head'), 0.11, (0, 0, 0.64), snow, segs=16)
    coal = pm('sm_coal', '#1a1a1e')
    for sx in (-1, 1):
        ball(uid('eye'), 0.014, (sx * 0.04, -0.1, 0.67), coal, segs=6)
    for k in range(5):
        a = (k - 2) * 0.25
        ball(uid('mouth'), 0.009, (math.sin(a) * 0.06, -0.1, 0.61 - math.cos(a) * 0.012 + 0.01), coal, segs=6)
    for z in (0.4, 0.46, 0.52):
        ball(uid('btn'), 0.014, (0, -0.145, z), coal, segs=6)
    cyl(uid('nose'), 0.02, 0.1, (0, -0.15, 0.65), pm('sm_carrot', '#f07a1a'), verts=8, r2=0.0, rot=(R90, 0, 0))
    scarf = pm('sm_scarf', '#d8281a', '#f4efe6', scale=12, kind='wave')
    torus(uid('scarf'), 0.1, 0.03, (0, 0, 0.54), scarf, segs=20, rsegs=6)
    box(uid('tail'), (0.05, 0.02, 0.16), (0.06, -0.1, 0.46), scarf, rot=(0, 0.2, 0), bev=0.008)
    hat = pm('sm_hat', '#1e1e24')
    cyl(uid('brim'), 0.12, 0.015, (0, 0, 0.73), hat, verts=18)
    cyl(uid('crown'), 0.075, 0.12, (0, 0, 0.8), hat, verts=16)
    cyl(uid('band'), 0.077, 0.02, (0, 0, 0.75), pm('sm_band', '#c8281a'), verts=16, bev=0)
    for sx in (-1, 1):
        cyl(uid('arm'), 0.01, 0.28, (sx * 0.23, 0, 0.5), bark_mat('sm_twig', '#5a3a22', '#6e4a2c'), verts=5, rot=(0, sx * 1.1, 0))
    finish('snowman', tex=512)


def sandcastle():
    m = std()
    sand = pm('sc_sand', '#e0c88a', '#ecd8a0', scale=30)
    box(uid('mound'), (0.7, 0.7, 0.06), (0, 0, 0.03), sand, bev=0.03)
    box(uid('keep'), (0.28, 0.28, 0.2), (0, 0, 0.16), sand, bev=0.02)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(uid('tower'), 0.07, 0.3, (sx * 0.2, sy * 0.2, 0.18), sand, verts=14)
            for k in range(6):
                a = k * math.pi / 3
                box(uid('cren'), (0.03, 0.03, 0.03), (sx * 0.2 + math.cos(a) * 0.06, sy * 0.2 + math.sin(a) * 0.06, 0.345), sand, bev=0.005)
    cyl(uid('top'), 0.08, 0.14, (0, 0, 0.33), sand, verts=14, r2=0.05)
    cyl(uid('pole'), 0.005, 0.18, (0, 0, 0.48), m['wood'], verts=5)
    box(uid('flag'), (0.08, 0.005, 0.05), (0.04, 0, 0.54), pm('sc_flag', '#e8303a'), bev=0)
    ball(uid('door'), 0.05, (0, -0.14, 0.1), pm('sc_dark', '#b8a068'), scale=(0.8, 0.2, 1.1), segs=10)
    for k in range(5):
        a = k * 1.2
        ball(uid('shell'), 0.02, (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.065), pm('sc_shell', '#f8d8c8'), scale=(1, 1, 0.4), segs=8)
    cyl(uid('pail'), 0.06, 0.09, (0.3, -0.28, 0.1), pm('sc_pail', '#2a7ad8'), verts=14, r2=0.05)
    box(uid('spade'), (0.04, 0.01, 0.16), (-0.3, -0.28, 0.1), pm('sc_spade', '#f0c020'), rot=(0.4, 0, 0.3), bev=0.004)
    finish('sandcastle', tex=512)


def seesaw():
    m = std()
    red, blue = pm('ss_red', '#d8302a'), pm('ss_blue', '#2a6ad8')
    prism(uid('stand'), [(-0.12, 0), (0.12, 0), (0.03, 0.2), (-0.03, 0.2)], -0.08, 0.08, pm('ss_stand', '#f0c020'))
    with anim_group('swayZ_plank', (0, 0, 0.2)):
        box(uid('plank'), (1.0, 0.12, 0.04), (0, 0, 0.21), pm('ss_plank', '#b8733a', '#d48f4e', scale=6, kind='wave', stretch=(8, 1, 1)), bev=0.01)
        for sx, mat in ((-1, red), (1, blue)):
            box(uid('seat'), (0.14, 0.14, 0.03), (sx * 0.42, 0, 0.24), mat, bev=0.01)
            cyl(uid('handle'), 0.01, 0.12, (sx * 0.34, 0, 0.29), m['metal'], verts=6)
            cyl(uid('grip'), 0.01, 0.12, (sx * 0.34, 0, 0.35), mat, verts=6, rot=(R90, 0, 0))
    box(uid('mat'), (1.1, 0.4, 0.01), (0, 0, 0.005), pm('ss_mat', '#8a5a3a', '#9a6a4a', scale=30), bev=0)
    finish('seesaw', tex=512)


def outdoor_oven():
    m = std()
    clay = pm('oo_clay', '#b8683a', '#d07a44', scale=18)
    box(uid('base'), (0.62, 0.62, 0.4), (0, 0, 0.2), m['stone'][0], bev=0.02)
    box(uid('slab'), (0.68, 0.68, 0.06), (0, 0, 0.43), m['stone'][1], bev=0.015)
    ball(uid('dome'), 0.28, (0, 0, 0.46), clay, scale=(1, 1, 0.9), segs=20)
    ball(uid('mouth'), 0.12, (0, -0.24, 0.52), pm('oo_dark', '#2a1a14'), scale=(1, 0.4, 0.8), segs=12)
    torus(uid('arch'), 0.12, 0.02, (0, -0.25, 0.53), m['brick'][1], rot=(R90, 0, 0), segs=18, rsegs=4)
    ball(uid('fire'), 0.06, (0, -0.16, 0.5), pm('oo_fire', '#ff9a20', emit=3.0), scale=(1.4, 1, 0.8), segs=8)
    cyl(uid('flue'), 0.04, 0.16, (0, 0.08, 0.78), m['brick'][0], verts=10)
    marker('smoke', (0, 0.08, 0.87))
    for i in range(4):
        cyl(uid('log'), 0.03, 0.26, (-0.2 + i * 0.07, 0.36, 0.05), bark_mat('oo_log', '#6e4526', '#8a5a34'), verts=8, rot=(R90, 0, 0.1 * i))
    cyl(uid('peel'), 0.01, 0.5, (0.3, -0.3, 0.3), m['wood'], verts=6, rot=(0.5, 0, 0.3))
    glow(0, -0.3, 1.2)
    finish('outdoor_oven', tex=512, glow=('oo_fire',))


def telescope():
    m = std()
    brass, black = m['brass'], pm('ts_black', '#1e1e24')
    top = (0, 0, 0.52)
    for k in range(3):
        a = k * 2.094 + 0.5
        foot = (math.cos(a) * 0.22, math.sin(a) * 0.22, 0.0)
        mid = tuple((foot[j] + top[j]) / 2 for j in range(3))
        d = [top[j] - foot[j] for j in range(3)]
        ln = math.sqrt(sum(v * v for v in d))
        d = [v / ln for v in d]
        side = (-math.sin(a), math.cos(a), 0)
        nrm = (d[1] * side[2] - d[2] * side[1], d[2] * side[0] - d[0] * side[2], d[0] * side[1] - d[1] * side[0])
        obox(uid('leg'), mid, (d, side, nrm), (ln, 0.028, 0.028), m['wood_dark'], bev=0.005)
    ball(uid('mount'), 0.045, top, brass, segs=10)
    # the tube tilts up toward the sky, pointing to the back
    ax = (0, 0.8, 0.6)
    c = (0, 0.04, 0.6)
    obox(uid('tube'), c, (ax, (1, 0, 0), (0, -0.6, 0.8)), (0.62, 0.1, 0.1), black, bev=0.04)
    for u, r in ((0.27, 0.065), (-0.27, 0.058)):
        p = tuple(c[j] + ax[j] * u for j in range(3))
        cyl(uid('ring'), r, 0.05, p, brass, verts=16, rot=(-0.93, 0, 0))
    lens = tuple(c[j] + ax[j] * 0.31 for j in range(3))
    cyl(uid('lens'), 0.05, 0.012, lens, pm('ts_glass', '#8ac0e8', rough=0.05), verts=14, rot=(-0.93, 0, 0))
    eye = tuple(c[j] - ax[j] * 0.34 for j in range(3))
    cyl(uid('eyepiece'), 0.02, 0.07, eye, brass, verts=10, rot=(-0.93, 0, 0))
    tufts(m, [(0.3, -0.3), (-0.3, 0.3)], 13)
    finish('telescope', tex=512)


def obelisk():
    m = std()
    stone = pm('ob_stone', '#c8b89a', '#dccca8', scale=16)
    box(uid('step'), (0.6, 0.6, 0.08), (0, 0, 0.04), m['stone'][1], bev=0.01)
    box(uid('plinth'), (0.4, 0.4, 0.22), (0, 0, 0.19), stone, bev=0.015)
    cyl(uid('shaft'), 0.13, 2.2, (0, 0, 1.4), stone, verts=4, r2=0.08, rot=(0, 0, math.radians(45)), bev=0)
    cyl(uid('tip'), 0.08, 0.16, (0, 0, 2.58), m['brass'], verts=4, r2=0.0, rot=(0, 0, math.radians(45)), bev=0)
    rnd = random.Random(2)
    for k in range(12):
        z = 0.5 + k * 0.15
        box(uid('glyph'), (0.04, 0.01, 0.05), (rnd.uniform(-0.04, 0.04), -0.12 + z * 0.02, z), pm('ob_glyph', '#9a8a6a'), bev=0)
    tufts(m, [(0.28, -0.28), (-0.28, 0.28)], 15)
    finish('obelisk', tex=512)


# ---------------------------------------------------------------- 2 x 1

def hammock():
    m = std()
    bark = bark_mat('hm_bark', '#8a6a44', '#a07e52')
    leaves = leaf_mats('#4c9a38', 'hml')
    for sx in (-1, 1):
        cyl(uid('trunk'), 0.06, 1.2, (sx * 0.85, 0.05, 0.6), bark, verts=10, r2=0.045, rot=(0, sx * 0.08, 0))
        for k in range(7):
            a = k * 0.9
            obox(uid('frond'), (sx * 0.85 + math.cos(a) * 0.28, 0.05 + math.sin(a) * 0.28, 1.15), ((math.cos(a), math.sin(a), -0.35), (-math.sin(a), math.cos(a), 0), (0.35, 0, 1)),
                 (0.6, 0.12, 0.01), leaves[k % 3], bev=0)
    with anim_group('swayX_net', (0, 0.05, 0.75)):
        cloth = pm('hm_cloth', '#e8403a', '#f4efe6', scale=10, kind='wave', stretch=(8, 1, 1))
        n = 12
        for i in range(n):
            u = i / (n - 1) - 0.5
            z = 0.42 + (u * u) * 0.9
            obox(uid('net'), (u * 1.5, 0.05, z), ((1, 0, u * 1.8), (0, 1, 0), (-u * 1.8, 0, 1)), (0.14, 0.32, 0.02), cloth, bev=0)
        for sx in (-1, 1):
            obox(uid('rope'), (sx * 0.8, 0.05, 0.68), ((1, 0, 0.8 * sx), (0, 1, 0), (-0.8 * sx, 0, 1)), (0.12, 0.01, 0.01), m['rope'], bev=0)
    ball(uid('coco'), 0.05, (-0.7, -0.25, 0.04), pm('hm_coco', '#7a4a26'), segs=10)
    finish('hammock', tex=1024)


def water_wheel():
    m = std()
    water = pm('ww_water', '#3a8ac0', '#5aa8d8', scale=12, rough=0.1)
    box(uid('stream'), (1.9, 0.5, 0.03), (0, 0, 0.015), water, bev=0)
    for sy in (-1, 1):
        box(uid('bank'), (1.9, 0.14, 0.08), (0, sy * 0.3, 0.04), m['stone'][1], bev=0.02)
    box(uid('house'), (0.5, 0.5, 0.6), (0.6, 0.0, 0.3), m['stone'][0], bev=0.02)
    for sy in (-1, 1):
        obox(uid('roof'), (0.6, sy * 0.14, 0.72), ((1, 0, 0), (0, math.cos(0.6), sy * math.sin(0.6)), (0, -sy * math.sin(0.6), math.cos(0.6))), (0.6, 0.34, 0.03),
             pm('ww_roof', '#8a3a2a', '#a04a34', scale=20), bev=0.006)
    box(uid('door'), (0.14, 0.02, 0.28), (0.6, -0.26, 0.14), m['wood_dark'], bev=0.006)
    cyl(uid('axle'), 0.03, 0.5, (-0.1, 0, 0.42), m['iron'], verts=8, rot=(R90, 0, 0))
    with anim_group('spinZ_wheel', (-0.25, 0, 0.42)):
        wood = m['wood_dark']
        for sy in (-1, 1):
            torus(uid('rim'), 0.36, 0.02, (-0.25, sy * 0.1, 0.42), wood, rot=(R90, 0, 0), segs=30, rsegs=5)
        for k in range(12):
            a = k * math.pi / 6
            d = (math.cos(a), 0, math.sin(a))
            obox(uid('paddle'), (-0.25 + d[0] * 0.33, 0, 0.42 + d[2] * 0.33), (d, (0, 1, 0), (-d[2], 0, d[0])), (0.12, 0.22, 0.02), m['wood'], bev=0.004)
            if k % 2 == 0:
                for sy in (-1, 1):
                    obox(uid('spoke'), (-0.25 + d[0] * 0.17, sy * 0.1, 0.42 + d[2] * 0.17), (d, (0, 1, 0), (-d[2], 0, d[0])), (0.34, 0.02, 0.02), wood, bev=0)
    finish('water_wheel', tex=1024)


# ---------------------------------------------------------------- 2 x 2

def koi_pond():
    m = std()
    water = pm('kp_water', '#2a6a8a', '#3a8aa8', scale=10, rough=0.08)
    cyl(uid('water'), 0.8, 0.04, (0, 0, 0.02), water, verts=28)
    for i in range(22):
        a = i * 2 * math.pi / 22
        rock(uid('edge'), 0.1 + (i % 3) * 0.02, (math.cos(a) * 0.86, math.sin(a) * 0.82, 0.05), m['stone'][i % 3], seed=i, squash=0.6)
    fish_c = [('#f4efe6', '#e84a1a'), ('#f07a1a', '#f4efe6'), ('#e8c020', '#f07a1a'), ('#f4efe6', '#1a1a1a')]
    for i, (a, b) in enumerate(fish_c):
        ang = i * 1.6 + 0.3
        x, y = math.cos(ang) * 0.35, math.sin(ang) * 0.3
        ball(uid('koi'), 0.06, (x, y, 0.045), pm(f'koi{i}a', a), scale=(1, 0.4, 0.25), segs=10).rotation_euler = (0, 0, ang + R90)
        ball(uid('spot'), 0.025, (x, y, 0.055), pm(f'koi{i}b', b), scale=(1, 0.8, 0.3), segs=8)
    for i in range(5):
        a = i * 1.3 + 0.5
        cyl(uid('pad'), 0.08, 0.008, (math.cos(a) * 0.55, math.sin(a) * 0.5, 0.045), m['leaf'], verts=14, bev=0)
        if i % 2 == 0:
            ball(uid('lotus'), 0.03, (math.cos(a) * 0.55, math.sin(a) * 0.5, 0.07), pm('kp_lotus', '#f8b8d0'), scale=(1, 1, 0.7), segs=8)
    clump(0.75, 0.7, 0.15, 0.18, leaf_mats('#3f8a3a', 'kpl'), n=14, seed=40, leaf=0.35)
    clump(-0.8, 0.6, 0.12, 0.14, leaf_mats('#4a9a3a', 'kpl2'), n=12, seed=41, leaf=0.35)
    finish('koi_pond', tex=1024)


def camping_tent():
    m = std()
    canvas = pm('ct_canvas', '#e87a2a', '#f08a3a', scale=10)
    prism(uid('tent'), [(-0.55, 0.02), (0.55, 0.02), (0, 0.66)], -0.6, 0.6, canvas)
    prism(uid('door'), [(-0.22, 0.02), (0.22, 0.02), (0, 0.4)], -0.62, -0.6, pm('ct_in', '#3a2a1a'))
    for sy in (-1, 1):
        prism(uid('flap'), [(sy * 0.05, 0.02), (sy * 0.3, 0.02), (sy * 0.04, 0.44)], -0.66, -0.62, pm('ct_flap', '#d86a1a'))
    cyl(uid('ridge'), 0.012, 1.3, (0, 0, 0.66), m['wood_dark'], verts=6, rot=(0, R90, 0))
    for sy in (-1, 1):
        for sx in (-1, 1):
            cyl(uid('peg'), 0.01, 0.05, (sx * 0.65, sy * 0.8, 0.02), m['metal'], verts=5)
            obox(uid('line'), (sx * 0.62, sy * 0.66, 0.2), ((0, sy * 0.35, -0.9), (1, 0, 0), (0, 0.9, 0.35 * sy)), (0.4, 0.006, 0.006), m['rope'], bev=0)
    # a campfire and a log seat out front
    for i in range(7):
        a = i * 0.9
        rock(uid('ring'), 0.045, (-1.0 + math.cos(a) * 0.14, -0.45 + math.sin(a) * 0.14, 0.02), m['stone'][i % 3], seed=i)
    ball(uid('fire'), 0.05, (-1.0, -0.45, 0.06), pm('ct_fire', '#ff9a20', emit=3.0), scale=(1, 1, 1.6), segs=8)
    marker('smoke', (-1.0, -0.45, 0.18))
    cyl(uid('seat'), 0.07, 0.4, (-1.0, 0.0, 0.07), bark_mat('ct_log', '#6e4526', '#8a5a34'), verts=10, rot=(0, R90, 0.3))
    lantern(0.7, -0.6, 0.0, m, post=0.3, light=1.2)
    glow(-1.0, -0.45, 1.6)
    finish('camping_tent', tex=1024, glow=('ct_fire', 'lamp'))


def beach_hut():
    m = std()
    stripes = [pm('bh_a', '#2a8ad8'), pm('bh_b', '#f4efe6')]
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(uid('stilt'), 0.04, 0.3, (sx * 0.5, sy * 0.5, 0.15), m['wood_grey'], verts=8)
    box(uid('deck'), (1.3, 1.3, 0.05), (0, -0.1, 0.32), m['wood'], bev=0.01)
    n = 10
    for i in range(n):
        x = -0.5 + (i + 0.5) / n
        box(uid('plank'), (1 / n, 0.9, 0.7), (x, 0.1, 0.7), stripes[i % 2], bev=0.004)
    for sy in (-1, 1):
        obox(uid('roof'), (0, 0.1 + sy * 0.26, 1.18), ((1, 0, 0), (0, math.cos(0.7), -sy * math.sin(0.7)), (0, sy * math.sin(0.7), math.cos(0.7))), (1.2, 0.66, 0.04),
             pm('bh_roof', '#d8302a', '#e8403a', scale=12), bev=0.01)
    prism(uid('gable'), [(-0.45, 1.05), (0.65, 1.05), (0.1, 1.42)], -0.5, 0.5, stripes[1])
    box(uid('door'), (0.3, 0.02, 0.5), (0, -0.36, 0.6), pm('bh_door', '#f0c020'), bev=0.006)
    for sx in (-1, 1):
        box(uid('win'), (0.16, 0.02, 0.16), (sx * 0.3, -0.36, 0.72), m['glass'], bev=0.004)
    for k in range(4):
        box(uid('step'), (0.4, 0.12, 0.03), (0, -0.7 - k * 0.1, 0.26 - k * 0.07), m['wood'], bev=0.005)
    # a striped deck chair and a beach ball
    obox(uid('chair'), (0.4, -0.55, 0.42), ((1, 0, 0), (0, 0.8, 0.6), (0, -0.6, 0.8)), (0.3, 0.4, 0.02), pm('bh_chair', '#f0c020', '#f4efe6', scale=10, kind='wave'), bev=0)
    ball(uid('ball'), 0.08, (-0.45, -0.6, 0.42), pm('bh_ball', '#e8303a', '#f4efe6', scale=6, kind='wave'), segs=12)
    finish('beach_hut', tex=1024)


def log_cabin():
    m = std()
    logm = bark_mat('lc_log', '#7a4a26', '#946038')
    end = pm('lc_end', '#d8a868')
    W, D = 1.4, 1.1
    for k in range(8):
        z = 0.08 + k * 0.1
        for sy in (-1, 1):
            cyl(uid('log'), 0.055, W + 0.16, (0, sy * D / 2, z + (0.05 if sy > 0 else 0)), logm, verts=10, rot=(0, R90, 0))
        for sx in (-1, 1):
            cyl(uid('log'), 0.055, D + 0.16, (sx * W / 2, 0, z + 0.05), logm, verts=10, rot=(R90, 0, 0))
    for sx in (-1, 1):
        for sy in (-1, 1):
            for k in range(8):
                cyl(uid('end'), 0.052, 0.01, (sx * (W / 2 + 0.08), sy * D / 2, 0.08 + k * 0.1), end, verts=10, rot=(0, R90, 0), bev=0)
    box(uid('floor'), (W, D, 0.9), (0, 0, 0.45), pm('lc_in', '#6a4424'), bev=0)
    rows = 6
    for sy in (-1, 1):
        obox(uid('roof'), (0, sy * 0.34, 1.12), ((1, 0, 0), (0, math.cos(0.62), -sy * math.sin(0.62)), (0, sy * math.sin(0.62), math.cos(0.62))), (W + 0.3, 0.86, 0.05),
             pm('lc_roof', '#4a5a3a', '#5a6a48', scale=20), bev=0.01)
    prism(uid('gable'), [(-D / 2, 0.88), (D / 2, 0.88), (0, 1.36)], -W / 2, W / 2, logm)
    box(uid('door'), (0.26, 0.03, 0.5), (0.2, -D / 2 - 0.05, 0.3), m['wood_dark'], bev=0.01)
    box(uid('win'), (0.24, 0.03, 0.22), (-0.35, -D / 2 - 0.05, 0.5), m['glass'], bev=0.006)
    box(uid('winf'), (0.3, 0.02, 0.28), (-0.35, -D / 2 - 0.04, 0.5), m['wood_dark'], bev=0.006)
    box(uid('porch'), (W + 0.2, 0.4, 0.04), (0, -D / 2 - 0.25, 0.04), m['wood'], bev=0.008)
    for x in (-0.6, 0.6):
        cyl(uid('pp'), 0.03, 0.8, (x, -D / 2 - 0.4, 0.44), logm, verts=8)
    obox(uid('porchroof'), (0, -D / 2 - 0.25, 0.86), ((1, 0, 0), (0, 0.95, -0.3), (0, 0.3, 0.95)), (W + 0.2, 0.5, 0.03), pm('lc_roof', '#4a5a3a', '#5a6a48', scale=20), bev=0.006)
    box(uid('chim'), (0.24, 0.24, 1.3), (W / 2 + 0.1, 0.2, 0.75), m['stone'][0], bev=0.02)
    marker('smoke', (W / 2 + 0.1, 0.2, 1.45))
    for i in range(6):
        cyl(uid('wood'), 0.04, 0.3, (-W / 2 - 0.2, -0.3 + i * 0.09, 0.05 + (i % 2) * 0.07), end, verts=8, rot=(0, R90, 0))
    glow(-0.35, -D / 2 - 0.3, 1.3)
    finish('log_cabin', tex=1024, glow=('glass',))


def playground_slide():
    m = std()
    red, blue, yellow = pm('pg_red', '#d8302a'), pm('pg_blue', '#2a6ad8'), pm('pg_yel', '#f0c020')
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('post'), (0.06, 0.06, 0.9), (0.3 + sx * 0.2, sy * 0.2, 0.45), blue, bev=0.01)
    box(uid('deck'), (0.46, 0.46, 0.05), (0.3, 0, 0.6), yellow, bev=0.01)
    obox(uid('roof'), (0.3, 0, 1.0), ((1, 0, 0), (0, 1, 0), (0, 0, 1)), (0.5, 0.5, 0.04), red, bev=0.01)
    cyl(uid('peak'), 0.33, 0.24, (0.3, 0, 1.14), red, verts=4, r2=0.0, rot=(0, 0, math.radians(45)), bev=0)
    for k in range(6):
        box(uid('rung'), (0.3, 0.03, 0.03), (0.3, 0.3, 0.1 + k * 0.1), yellow, bev=0)
    for sx in (-1, 1):
        box(uid('rail'), (0.03, 0.03, 0.62), (0.3 + sx * 0.15, 0.3, 0.31), yellow, bev=0)
    # the slide down to the left
    obox(uid('slide'), (-0.3, 0, 0.32), ((0.9, 0, -0.45), (0, 1, 0), (0.45, 0, 0.9)), (0.95, 0.3, 0.03), red, bev=0.01)
    for sy in (-1, 1):
        obox(uid('lip'), (-0.3, sy * 0.15, 0.36), ((0.9, 0, -0.45), (0, 1, 0), (0.45, 0, 0.9)), (0.95, 0.03, 0.08), red, bev=0.008)
    # and a swing to the right
    for sy in (-1, 1):
        obox(uid('sleg'), (0.85, sy * 0.35, 0.4), ((0, 0, 1), (1, 0, 0), (0, 1, 0)), (0.85, 0.04, 0.04), blue, bev=0.006)
    box(uid('sbar'), (0.05, 0.8, 0.05), (0.85, 0, 0.83), blue, bev=0.006)
    with anim_group('swayY_swing', (0.85, 0, 0.8)):
        for sy in (-1, 1):
            cyl(uid('chain'), 0.005, 0.55, (0.85, sy * 0.12, 0.53), m['metal'], verts=4, bev=0)
        box(uid('sseat'), (0.12, 0.3, 0.03), (0.85, 0, 0.25), red, bev=0.008)
    box(uid('sandpit'), (1.9, 1.6, 0.02), (0, 0, 0.01), pm('pg_sand', '#e0c88a', '#ecd8a0', scale=30), bev=0)
    finish('playground_slide', tex=1024)




def observatory():
    m = std()
    stone = pm('obs_stone', '#d8d0c0', '#e8e0d0', scale=16)
    cyl(uid('base'), 0.8, 0.1, (0, 0, 0.05), m['stone'][1], verts=24)
    cyl(uid('tower'), 0.62, 0.8, (0, 0, 0.5), stone, verts=28)
    torus(uid('band'), 0.63, 0.03, (0, 0, 0.9), m['stone'][0], segs=32, rsegs=5)
    dome = pm('obs_dome', '#b8c0c8', '#d0d8e0', scale=20, rough=0.35, metal=0.5)
    ball(uid('dome'), 0.64, (0, 0, 0.9), dome, scale=(1, 1, 0.9), segs=24)
    # the slot in the dome and the big telescope peeking out
    box(uid('slot'), (0.2, 0.7, 0.5), (0, -0.35, 1.3), pm('obs_dark', '#1e2230'), rot=(0.6, 0, 0), bev=0)
    obox(uid('scope'), (0, -0.48, 1.34), ((0, -0.7, 0.7), (1, 0, 0), (0, 0.7, 0.7)), (0.5, 0.12, 0.12), pm('obs_scope', '#f4efe6'), bev=0.04)
    box(uid('door'), (0.26, 0.04, 0.44), (0, -0.62, 0.32), m['wood_dark'], bev=0.01)
    for a in (0.8, -0.8, 2.4):
        box(uid('win'), (0.14, 0.03, 0.2), (math.sin(a) * 0.62, -math.cos(a) * 0.62, 0.6), m['glass'], rot=(0, 0, a), bev=0)
    for k in range(5):
        box(uid('step'), (0.4, 0.12, 0.03), (0, -0.72 - k * 0.1, 0.1 - k * 0.02), m['stone'][0], bev=0.005)
    lantern(-0.55, -0.7, 0.0, m, post=0.5, light=1.3)
    finish('observatory', tex=1024, glow=('glass', 'lamp'))


def ferris_wheel():
    m = std()
    white = pm('fw_white', '#f4f6f8', rough=0.4)
    for sy in (-1, 1):
        for sx in (-1, 1):
            obox(uid('leg'), (sx * 0.28, sy * 0.18, 0.66), ((-sx * 0.4, 0, 1), (0, 1, 0), (1, 0, sx * 0.4)), (1.42, 0.06, 0.06), white, bev=0.01)
    box(uid('base'), (1.4, 0.8, 0.08), (0, 0, 0.04), m['stone'][1], bev=0.015)
    box(uid('booth'), (0.3, 0.3, 0.36), (0.6, -0.2, 0.26), pm('fw_booth', '#d8302a', '#f4efe6', scale=10, kind='wave'), bev=0.01)
    cyl(uid('axle'), 0.05, 0.5, (0, 0, 1.3), m['metal'], verts=10, rot=(R90, 0, 0))
    cols = ['#d8302a', '#f0c020', '#2a6ad8', '#2aa05a', '#f07a1a', '#b058e0', '#e84a8a', '#2ab8c8']
    # the wheel turns about the axle (the game's z axis); the cabins are parts of their own,
    # hung from the rim, which the game carries round with it while they stay upright
    with anim_group('spinZ_wheel', (0, 0, 1.3)):
        for sy in (-1, 1):
            torus(uid('rim'), 0.95, 0.025, (0, sy * 0.14, 1.3), white, rot=(R90, 0, 0), segs=40, rsegs=5)
            for k in range(16):
                a = k * math.pi / 8
                d = (math.cos(a), 0, math.sin(a))
                obox(uid('spoke'), (d[0] * 0.47, sy * 0.14, 1.3 + d[2] * 0.47), (d, (0, 1, 0), (-d[2], 0, d[0])), (0.94, 0.015, 0.015), white, bev=0)
        for k in range(24):
            a = k * math.pi / 12
            ball(uid('bulb'), 0.02, (math.cos(a) * 0.95, -0.17, 1.3 + math.sin(a) * 0.95), m['lamp'], segs=6)
        for k in range(8):
            a = k * math.pi / 4
            cyl(uid('cbar'), 0.012, 0.32, (math.cos(a) * 0.95, 0, 1.3 + math.sin(a) * 0.95), m['metal'], verts=6, rot=(R90, 0, 0))
    for k in range(8):
        a = k * math.pi / 4
        cx, cz = math.cos(a) * 0.95, 1.3 + math.sin(a) * 0.95
        with anim_group(f'hang{k}', (cx, 0, cz)):
            box(uid('cab'), (0.2, 0.22, 0.16), (cx, 0, cz - 0.13), pm(f'fwc{k}', cols[k]), bev=0.03)
            box(uid('croof'), (0.22, 0.24, 0.03), (cx, 0, cz - 0.04), white, bev=0.01)
            cyl(uid('hook'), 0.008, 0.06, (cx, 0, cz - 0.015), m['metal'], verts=6, bev=0)
    glow(0, 0, 3.0)
    finish('ferris_wheel', tex=1024, glow=('lamp',))


# ---------------------------------------------------------------- third wave

def hay_stack():
    m = std()
    hay = m['hay']
    ball(uid('stack'), 0.34, (0, 0, 0.3), hay, scale=(1, 1, 1.3), segs=20)
    cyl(uid('base'), 0.34, 0.2, (0, 0, 0.1), hay, verts=20)
    cyl(uid('top'), 0.12, 0.2, (0, 0, 0.72), hay, verts=14, r2=0.02)
    cyl(uid('pole'), 0.02, 1.0, (0, 0, 0.5), m['wood_dark'], verts=6)
    rnd = random.Random(2)
    for i in range(16):
        a = rnd.uniform(0, 6.28)
        box(uid('wisp'), (0.14, 0.008, 0.006), (math.cos(a) * 0.36, math.sin(a) * 0.36, 0.01), hay, rot=(0, 0, a), bev=0)
    cyl(uid('fork'), 0.01, 0.7, (0.3, -0.25, 0.32), m['wood'], verts=6, rot=(0.25, -0.3, 0))
    finish('hay_stack', tex=512)


def picnic_table():
    m = std()
    wood = m['wood']
    box(uid('top'), (0.7, 0.32, 0.04), (0, 0, 0.36), wood, bev=0.008)
    for sy in (-1, 1):
        box(uid('bench'), (0.7, 0.12, 0.035), (0, sy * 0.3, 0.22), wood, bev=0.008)
    for sx in (-1, 1):
        for k in (-1, 1):
            obox(uid('leg'), (sx * 0.28, k * 0.14, 0.18), ((1, 0, 0), (0, math.cos(0.5), k * math.sin(0.5)), (0, -k * math.sin(0.5), math.cos(0.5))), (0.04, 0.04, 0.44), m['wood_dark'], bev=0.005)
        box(uid('brace'), (0.04, 0.66, 0.035), (sx * 0.28, 0, 0.2), m['wood_dark'], bev=0.005)
    check = pm('pt_check', '#2a6ad8', '#f6f2ea', scale=9, kind='checker')
    box(uid('cloth'), (0.5, 0.3, 0.008), (0, 0, 0.385), check, bev=0)
    cyl(uid('pitcher'), 0.035, 0.1, (-0.15, 0, 0.44), pm('pt_glass', '#f0e070', rough=0.1), verts=12)
    ball(uid('pie'), 0.07, (0.12, 0, 0.4), pm('pt_pie', '#d8904a'), scale=(1, 1, 0.3), segs=12)
    tufts(m, [(0.4, -0.35), (-0.4, 0.35)], 51)
    finish('picnic_table', tex=512)


def lemonade_stand():
    m = std()
    yellow = pm('ls_yel', '#f8d830')
    box(uid('counter'), (0.6, 0.3, 0.36), (0, 0, 0.18), m['wood'], bev=0.01)
    box(uid('front'), (0.62, 0.02, 0.2), (0, -0.16, 0.22), yellow, bev=0.005)
    for sx in (-1, 1):
        cyl(uid('post'), 0.018, 0.5, (sx * 0.28, 0.12, 0.6), m['wood_dark'], verts=6)
    box(uid('roof'), (0.7, 0.4, 0.03), (0, 0.02, 0.86), pm('ls_awn', '#f8d830', '#ffffff', scale=10, kind='wave', stretch=(8, 1, 1)), rot=(-0.2, 0, 0), bev=0.005)
    cyl(uid('jug'), 0.06, 0.16, (-0.12, 0, 0.44), pm('ls_jug', '#f8f070', rough=0.1), verts=14)
    for k in range(4):
        ball(uid('lemon'), 0.025, (0.08 + k * 0.04, -0.02 + (k % 2) * 0.04, 0.39), yellow, scale=(1.2, 1, 1), segs=8)
    for k in range(3):
        cyl(uid('cup'), 0.02, 0.04, (0.2, 0.08 - k * 0.05, 0.38), pm('ls_cup', '#ffffff'), verts=8)
    box(uid('sign'), (0.3, 0.02, 0.1), (0, -0.18, 0.28), pm('ls_sign', '#f8f4ea'), bev=0.004)
    finish('lemonade_stand', tex=512)


def insect_hotel():
    m = std()
    frame = m['wood_dark']
    box(uid('back'), (0.5, 0.04, 0.6), (0, 0.1, 0.4), frame, bev=0.01)
    for sx in (-1, 1):
        box(uid('side'), (0.04, 0.24, 0.6), (sx * 0.25, 0, 0.4), frame, bev=0.008)
    for z in (0.1, 0.3, 0.5, 0.7):
        box(uid('shelf'), (0.5, 0.24, 0.03), (0, 0, z), frame, bev=0.006)
    prism(uid('roof'), [(-0.18, 0.72), (0.18, 0.72), (0, 0.88)], -0.3, 0.3, pm('ih_roof', '#8a3a2a'))
    bark = bark_mat('ih_bark', '#8a6a44', '#a07e52')
    rnd = random.Random(5)
    for row, z in enumerate((0.2, 0.4, 0.6)):
        for k in range(7):
            x = -0.2 + k * 0.066
            cyl(uid('tube'), 0.028, 0.2, (x, -0.0, z), bark if row != 1 else pm('ih_bam', '#c8b060'), verts=8, rot=(R90, 0, 0))
            cyl(uid('hole'), 0.015, 0.01, (x, -0.1, z), pm('ih_hole', '#2a1a10'), verts=8, rot=(R90, 0, 0), bev=0)
    box(uid('leg'), (0.05, 0.05, 0.1), (0, 0.05, 0.05), frame, bev=0)
    ball(uid('bee'), 0.02, (0.15, -0.15, 0.52), pm('ih_bee', '#f0c020'), scale=(1.3, 1, 1), segs=8)
    ball(uid('bug'), 0.022, (-0.12, -0.14, 0.33), pm('ih_bug', '#d8201a'), scale=(1, 1.2, 0.6), segs=8)
    tufts(m, [(0.35, -0.3), (-0.35, -0.25)], 52)
    finish('insect_hotel', tex=512)


def weathervane():
    m = std()
    copper = pm('wv_copper', '#3a8a70', '#5aa888', scale=16, rough=0.4, metal=0.5)
    cyl(uid('base'), 0.12, 0.08, (0, 0, 0.04), m['stone'][0], verts=10)
    cyl(uid('post'), 0.02, 1.4, (0, 0, 0.75), m['iron'], verts=8)
    for k, (dx, dy, lbl) in enumerate(((1, 0, 'E'), (-1, 0, 'W'), (0, 1, 'N'), (0, -1, 'S'))):
        box(uid('arm'), (0.3 if dx else 0.015, 0.3 if dy else 0.015, 0.015), (dx * 0.15, dy * 0.15, 1.2), m['iron'], bev=0)
        ball(uid('ltr'), 0.025, (dx * 0.3, dy * 0.3, 1.2), m['brass'], segs=8)
    with anim_group('spinY_vane', (0, 0, 1.3)):
        ball(uid('body'), 0.1, (0, 0, 1.38), copper, scale=(1.2, 0.35, 0.9), segs=12)
        ball(uid('head'), 0.05, (0.12, 0, 1.47), copper, scale=(1, 0.35, 1), segs=10)
        cyl(uid('beak'), 0.018, 0.05, (0.18, 0, 1.47), copper, verts=6, r2=0.0, rot=(0, R90, 0))
        box(uid('comb'), (0.05, 0.02, 0.04), (0.12, 0, 1.53), copper, bev=0.005)
        for k in range(4):
            obox(uid('tail'), (-0.14 - k * 0.02, 0, 1.44 + k * 0.03), ((0.4, 0, 1), (0, 1, 0), (-1, 0, 0.4)), (0.12, 0.02, 0.05), copper, bev=0.005)
        box(uid('arrow'), (0.5, 0.012, 0.012), (0, 0, 1.3), copper, bev=0)
        cyl(uid('tip'), 0.03, 0.06, (0.27, 0, 1.3), copper, verts=4, r2=0.0, rot=(0, R90, 0))
    tufts(m, [(0.3, -0.3), (-0.3, 0.3)], 53)
    finish('weathervane', tex=512)


def rock_garden():
    m = std()
    gravel = pm('rg_gravel', '#b8b2a6', '#cfc8bc', scale=60)
    cyl(uid('bed'), 0.44, 0.04, (0, 0, 0.02), gravel, verts=20)
    for i, (x, y, r) in enumerate(((0.1, 0.05, 0.16), (-0.18, -0.08, 0.11), (0.2, -0.2, 0.08), (-0.12, 0.22, 0.09), (0.28, 0.2, 0.07))):
        rock(uid('rock'), r, (x, y, r * 0.5), m['stone'][i % 3], seed=i + 3, squash=0.7)
    flowers = [pm('rg_f1', '#f06a9a'), pm('rg_f2', '#ffffff'), pm('rg_f3', '#b058e0'), pm('rg_f4', '#f0c020')]
    rnd = random.Random(8)
    for i in range(9):
        a = rnd.uniform(0, 6.28)
        rr = rnd.uniform(0.15, 0.38)
        clump(math.cos(a) * rr, math.sin(a) * rr, 0.04, 0.05, [pm('rg_l', '#5a8a4a'), pm('rg_l2', '#7aa060')], n=6, seed=60 + i, leaf=0.35, squash=0.6)
        for k in range(3):
            ball(uid('fl'), 0.012, (math.cos(a) * rr + rnd.uniform(-0.03, 0.03), math.sin(a) * rr + rnd.uniform(-0.03, 0.03), 0.08), flowers[i % 4], segs=6)
    finish('rock_garden', tex=512)


def veggie_stand():
    m = std()
    box(uid('table'), (0.62, 0.34, 0.04), (0, 0, 0.36), m['wood'], bev=0.008)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('leg'), (0.04, 0.04, 0.36), (sx * 0.27, sy * 0.13, 0.18), m['wood_dark'], bev=0)
        cyl(uid('post'), 0.015, 0.45, (sx * 0.28, 0.15, 0.6), m['wood_dark'], verts=6)
    box(uid('awn'), (0.68, 0.36, 0.02), (0, 0.05, 0.84), pm('vs_awn', '#2f8a4a', '#f6f2ea', scale=10, kind='wave', stretch=(8, 1, 1)), rot=(-0.2, 0, 0), bev=0.004)
    veg = [('#f07a1a', 'carrot'), ('#e8302e', 'tomato'), ('#6a9a3a', 'cabbage'), ('#8a4a8a', 'eggplant'), ('#f0c020', 'corn'), ('#d8a060', 'potato')]
    for k, (c, _n) in enumerate(veg):
        x, y = -0.2 + (k % 3) * 0.2, -0.07 + (k // 3) * 0.14
        box(uid('crate'), (0.17, 0.12, 0.05), (x, y, 0.41), m['wood_grey'], bev=0.006)
        for j in range(4):
            ball(uid('v'), 0.028, (x - 0.04 + (j % 2) * 0.08, y - 0.02 + (j // 2) * 0.04, 0.45), pm(f'vs_{k}', c), scale=(1, 1, 1.1), segs=8)
    box(uid('sign'), (0.3, 0.02, 0.12), (0, -0.18, 0.26), pm('vs_sign', '#f8f4ea'), bev=0.004)
    finish('veggie_stand', tex=512)


def windchime():
    m = std()
    bark = bark_mat('wc_bark', '#7a5a3a', '#946e48')
    cyl(uid('post'), 0.03, 1.0, (0, 0, 0.5), bark, verts=8)
    box(uid('arm'), (0.4, 0.03, 0.03), (0.15, 0, 0.98), bark, bev=0.005)
    with anim_group('swayX_chime', (0.3, 0, 0.96)):
        torus(uid('ring'), 0.08, 0.008, (0.3, 0, 0.9), m['brass'], segs=16, rsegs=4)
        for k in range(6):
            a = k * math.pi / 3
            x, y = 0.3 + math.cos(a) * 0.07, math.sin(a) * 0.07
            cyl(uid('tube'), 0.012, 0.18 + (k % 3) * 0.05, (x, y, 0.78 - (k % 3) * 0.025), pm('wc_tube', '#c8ccd0', rough=0.25, metal=0.8), verts=8)
        cyl(uid('striker'), 0.03, 0.01, (0.3, 0, 0.72), m['wood'], verts=10)
        box(uid('sail'), (0.06, 0.005, 0.1), (0.3, 0, 0.6), pm('wc_sail', '#e84a8a'), bev=0)
    tufts(m, [(0.3, -0.3), (-0.3, 0.3)], 54)
    finish('windchime', tex=512)


def dovecote():
    m = std()
    white = pm('dc_white', '#f6f2ea', rough=0.6)
    cyl(uid('pole'), 0.035, 1.2, (0, 0, 0.6), m['wood_dark'], verts=10)
    cyl(uid('house'), 0.24, 0.4, (0, 0, 1.4), white, verts=8)
    cyl(uid('floor'), 0.3, 0.03, (0, 0, 1.2), m['wood'], verts=8)
    cyl(uid('mid'), 0.3, 0.03, (0, 0, 1.44), m['wood'], verts=8)
    cyl(uid('roof'), 0.32, 0.3, (0, 0, 1.75), pm('dc_roof', '#3a6a8a', '#4a7a9a', scale=20), verts=8, r2=0.02)
    ball(uid('fin'), 0.03, (0, 0, 1.92), m['brass'], segs=8)
    for k in range(8):
        a = k * math.pi / 4 + math.pi / 8
        z = 1.3 if k % 2 else 1.52
        ball(uid('hole'), 0.04, (math.cos(a) * 0.23, math.sin(a) * 0.23, z), pm('dc_hole', '#2a2020'), scale=(1, 1, 1.3), segs=10)
    dove = pm('dc_dove', '#f4f4f8')
    for k, a in enumerate((0.3, 2.4, 4.4)):
        x, y = math.cos(a) * 0.3, math.sin(a) * 0.3
        ball(uid('dove'), 0.035, (x, y, 1.24), dove, scale=(1.3, 0.9, 0.9), segs=10)
        ball(uid('dh'), 0.02, (x + math.cos(a) * 0.03, y + math.sin(a) * 0.03, 1.28), dove, segs=8)
    tufts(m, [(0.3, -0.3), (-0.3, 0.3)], 55)
    finish('dovecote', tex=512)


def flag_pole():
    m = std()
    cyl(uid('base'), 0.14, 0.1, (0, 0, 0.05), m['stone'][1], verts=12)
    cyl(uid('pole'), 0.025, 2.6, (0, 0, 1.35), pm('fp_pole', '#e8ecf0', rough=0.3, metal=0.6), verts=10, r2=0.018)
    ball(uid('knob'), 0.04, (0, 0, 2.68), m['brass'], segs=10)
    with anim_group('swayZ_flag', (0, 0, 2.4)):
        cloth = pm('fp_flag', '#2f8a4a', '#f0c020', scale=4, kind='wave', stretch=(4, 1, 1))
        for k in range(6):
            x = 0.05 + k * 0.08
            obox(uid('flag'), (x, 0, 2.43 + math.sin(k * 0.9) * 0.02), ((1, 0, 0), (0, 1, 0.3 * math.cos(k * 0.9)), (0, -0.3 * math.cos(k * 0.9), 1)), (0.085, 0.01, 0.3), cloth, bev=0)
    tufts(m, [(0.3, -0.3), (-0.3, 0.3)], 56)
    finish('flag_pole', tex=512)


def ice_cream_cart():
    m = std()
    white, pink = pm('ic_white', '#f8f6f0'), pm('ic_pink', '#f07aa8')
    box(uid('box'), (0.5, 0.3, 0.3), (0, 0, 0.35), white, bev=0.04)
    box(uid('stripe'), (0.51, 0.31, 0.06), (0, 0, 0.3), pink, bev=0.02)
    for sx in (-1, 1):
        cyl(uid('wheel'), 0.1, 0.03, (sx * 0.2, 0.17, 0.12), pm('ic_tyre', '#2a2a2a'), verts=18, rot=(R90, 0, 0))
    cyl(uid('umbrella_pole'), 0.012, 0.6, (0, 0, 0.8), m['metal'], verts=6)
    cyl(uid('umbrella'), 0.35, 0.15, (0, 0, 1.12), pm('ic_umb', '#f07aa8', '#ffffff', scale=6, kind='wave'), verts=12, r2=0.02)
    for k, c in enumerate(('#f8e8c8', '#6a3a1e', '#f07aa8')):
        ball(uid('scoop'), 0.05, (-0.12 + k * 0.12, 0, 0.53), pm(f'ic_s{k}', c), segs=10)
    cyl(uid('cone'), 0.035, 0.12, (0.28, -0.1, 0.62), pm('ic_cone', '#d8a060'), verts=8, r2=0.0, rot=(math.pi, 0, 0))
    ball(uid('topscoop'), 0.04, (0.28, -0.1, 0.7), pm('ic_s0', '#f8e8c8'), segs=10)
    box(uid('handle'), (0.04, 0.3, 0.03), (-0.3, 0, 0.55), m['metal'], bev=0.005)
    finish('ice_cream_cart', tex=512)


def pumpkin_carriage():
    m = std()
    orange = pm('pc_orange', '#e8701a', '#f08a2a', scale=12)
    gold = m['brass']
    # the pumpkin body with ribs, a door and little windows
    for k in range(10):
        a = k * math.pi / 5
        ball(uid('rib'), 0.42, (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.75), orange, scale=(0.55, 0.55, 0.85), segs=16)
    cyl(uid('stem'), 0.05, 0.16, (0, 0, 1.2), pm('pc_stem', '#5a7a2a'), verts=8, r2=0.03, rot=(0.2, 0, 0))
    ball(uid('leaf'), 0.12, (0.1, 0.05, 1.2), m['leaf'], scale=(1, 0.6, 0.15), segs=10)
    box(uid('door'), (0.26, 0.04, 0.36), (0, -0.5, 0.72), gold, bev=0.02)
    box(uid('win'), (0.18, 0.02, 0.18), (0, -0.53, 0.8), pm('pc_glass', '#bfe4f0', rough=0.1), bev=0.004)
    torus(uid('frame'), 0.46, 0.02, (0, 0, 0.4), gold, segs=28, rsegs=5)
    for sx in (-1, 1):
        for sy in (-1, 1):
            wheel('wheel', (sx * 0.52, sy * 0.35, 0.3), 0.28, 0.02, gold, spokes=8, axis='x')
    for sx in (-1, 1):
        obox(uid('curl'), (sx * 0.3, -0.62, 0.35), ((0, 1, 0.3), (1, 0, 0), (0, -0.3, 1)), (0.35, 0.02, 0.02), gold, bev=0)
    lantern(0.35, -0.6, 0.6, m, light=1.4)
    finish('pumpkin_carriage', tex=1024, glow=('lamp',))


# ---------------------------------------------------------------- the beach

def sun_lounger():
    m = std()
    wood = m['wood']
    cloth = pm('sl_cloth', '#e8403a', '#f6f2ea', scale=12, kind='wave', stretch=(1, 10, 1))
    # a low frame: the seat, then the back tipped up at the head end (+Y is the back of the tile)
    for sx in (-1, 1):
        box(uid('rail'), (0.04, 0.62, 0.04), (sx * 0.2, -0.08, 0.16), wood, bev=0.008)
        for y in (-0.36, 0.2):
            box(uid('leg'), (0.04, 0.04, 0.16), (sx * 0.2, y, 0.08), wood, bev=0.006)
    box(uid('seat'), (0.38, 0.6, 0.025), (0, -0.08, 0.19), cloth, bev=0.008)
    obox(uid('back'), (0, 0.33, 0.33), ((1, 0, 0), (0, 0.5, 0.87), (0, -0.87, 0.5)), (0.38, 0.36, 0.025), cloth, bev=0.008)
    for sx in (-1, 1):
        obox(uid('brail'), (sx * 0.2, 0.33, 0.33), ((1, 0, 0), (0, 0.5, 0.87), (0, -0.87, 0.5)), (0.04, 0.38, 0.04), wood, bev=0.006)
    box(uid('towel'), (0.3, 0.2, 0.012), (0, -0.2, 0.21), pm('sl_towel', '#2a9ad8'), bev=0.004)
    ball(uid('shades'), 0.03, (0.08, 0.1, 0.215), pm('sl_shades', '#1a1a20', rough=0.2), scale=(1.6, 0.6, 0.3), segs=10)
    finish('sun_lounger', tex=512)


def beach_umbrella():
    m = std()
    white = pm('bu_white', '#f6f4ee', rough=0.5)
    cyl(uid('pole'), 0.02, 1.0, (0, 0, 0.5), white, verts=10)
    canopy = pm('bu_canopy', '#f0c020', '#e8403a', scale=14, kind='wave', stretch=(1, 1, 1))
    cyl(uid('canopy'), 0.55, 0.22, (0, 0, 0.93), canopy, verts=16, r2=0.02, bev=0.01)
    ball(uid('tip'), 0.035, (0, 0, 1.06), white, segs=10)
    # a towel, a bucket and spade in its shade
    box(uid('towel'), (0.3, 0.55, 0.01), (0.12, -0.05, 0.005), pm('bu_towel', '#2aa0a8', '#f6f4ee', scale=10, kind='wave', stretch=(10, 1, 1)), bev=0.003)
    cyl(uid('bucket'), 0.06, 0.1, (-0.25, -0.25, 0.05), pm('bu_bucket', '#2a6ad8'), verts=14, r2=0.075)
    box(uid('spade'), (0.02, 0.2, 0.012), (-0.18, -0.3, 0.012), pm('bu_spade', '#f07a1a'), rot=(0, 0, 0.5), bev=0.003)
    ball(uid('ball'), 0.07, (0.3, 0.3, 0.07), pm('bu_ball', '#f6f4ee', '#e8403a', scale=8, kind='wave'), segs=14)
    finish('beach_umbrella', tex=512)


def lifeguard_tower():
    m = std()
    white = pm('lg_white', '#f4f2ec', rough=0.55)
    red = pm('lg_red', '#d8302a', rough=0.55)
    for sx in (-1, 1):
        for sy in (-1, 1):
            obox(uid('leg'), (sx * 0.28, sy * 0.24, 0.45), ((-sx * 0.12, 0, 1), (0, 1, 0), (1, 0, sx * 0.12)), (0.9, 0.05, 0.05), white, bev=0.01)
    box(uid('deck'), (0.62, 0.56, 0.05), (0, 0, 0.9), m['wood'], bev=0.01)
    box(uid('hut'), (0.5, 0.36, 0.34), (0, 0.08, 1.1), red, bev=0.015)
    box(uid('window'), (0.3, 0.02, 0.14), (0, -0.1, 1.15), m['glass'], bev=0)
    box(uid('roof'), (0.62, 0.5, 0.05), (0, 0.06, 1.3), white, rot=(0.12, 0, 0), bev=0.01)
    for sx in (-1, 1):
        box(uid('rail'), (0.03, 0.03, 0.18), (sx * 0.3, -0.26, 1.02), white, bev=0.004)
    box(uid('railb'), (0.62, 0.03, 0.03), (0, -0.26, 1.1), white, bev=0.004)
    for k in range(6):
        box(uid('rung'), (0.22, 0.03, 0.02), (0, -0.38 - k * 0.0, 0.12 + k * 0.14), m['wood'], rot=(-0.35, 0, 0), bev=0.003)
    for sx in (-1, 1):
        obox(uid('ladder'), (sx * 0.11, -0.42, 0.47), ((0, 0.35, 0.94), (1, 0, 0), (0, -0.94, 0.35)), (0.95, 0.03, 0.03), m['wood'], bev=0.004)
    torus(uid('buoy'), 0.09, 0.03, (0.26, -0.27, 1.0), pm('lg_buoy', '#e8403a', '#f6f2ea', scale=6, kind='wave'), rot=(R90, 0, 0), segs=20, rsegs=8)
    box(uid('flag'), (0.14, 0.01, 0.09), (-0.2, 0.08, 1.52), red, bev=0)
    cyl(uid('fpole'), 0.008, 0.24, (-0.27, 0.08, 1.44), white, verts=6, bev=0)
    finish('lifeguard_tower', tex=1024)


def surfboard_rack():
    m = std()
    wood = m['wood_dark']
    for sx in (-1, 1):
        obox(uid('post'), (sx * 0.3, 0.05, 0.3), ((sx * -0.15, 0, 1), (0, 1, 0), (1, 0, sx * 0.15)), (0.62, 0.05, 0.05), wood, bev=0.008)
    box(uid('bar'), (0.62, 0.05, 0.05), (0, 0.05, 0.3), wood, bev=0.008)
    box(uid('bar2'), (0.66, 0.05, 0.05), (0, 0.05, 0.08), wood, bev=0.008)
    cols = [('#2a9ad8', '#f6f2ea'), ('#f0c020', '#e8403a'), ('#2aa05a', '#f6f2ea')]
    for i, (a, b) in enumerate(cols):
        x = -0.18 + i * 0.18
        board = pm(f'sb{i}', a, b, scale=8, kind='wave', stretch=(1, 1, 10))
        ball(uid('board'), 0.5, (x, -0.04 + i * 0.01, 0.52), board, scale=(0.16, 0.035, 1.0), segs=20)
    finish('surfboard_rack', tex=512)


MODELS = {name: fn for name, fn in [
    ('garden_gnome', garden_gnome), ('wheelbarrow', wheelbarrow), ('rain_barrel', rain_barrel), ('flower_cart', flower_cart),
    ('compost_bin', compost_bin), ('mushroom_ring', mushroom_ring), ('stone_lantern', stone_lantern), ('bamboo_grove', bamboo_grove),
    ('fairy_house', fairy_house), ('snowman', snowman), ('sandcastle', sandcastle), ('seesaw', seesaw), ('outdoor_oven', outdoor_oven),
    ('telescope', telescope), ('obelisk', obelisk), ('hammock', hammock), ('water_wheel', water_wheel), ('koi_pond', koi_pond),
    ('camping_tent', camping_tent), ('beach_hut', beach_hut), ('log_cabin', log_cabin), ('playground_slide', playground_slide),
    ('observatory', observatory), ('ferris_wheel', ferris_wheel),
    ('hay_stack', hay_stack), ('picnic_table', picnic_table), ('lemonade_stand', lemonade_stand), ('insect_hotel', insect_hotel),
    ('weathervane', weathervane), ('rock_garden', rock_garden), ('veggie_stand', veggie_stand), ('windchime', windchime),
    ('dovecote', dovecote), ('flag_pole', flag_pole), ('ice_cream_cart', ice_cream_cart), ('pumpkin_carriage', pumpkin_carriage),
    ('sun_lounger', sun_lounger), ('beach_umbrella', beach_umbrella), ('lifeguard_tower', lifeguard_tower), ('surfboard_rack', surfboard_rack)]}

if __name__ == '__main__':
    main(MODELS)
