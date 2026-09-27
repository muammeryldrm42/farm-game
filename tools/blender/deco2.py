# Late game decorations (levels 31 to 159): sundial, bird feeder, garden swing, bonfire, totem pole,
# picnic spot, wind turbine, stone bridge, pergola, horse statue, torii gate, zen garden, tree house,
# greenhouse, water tower, carousel, lighthouse, clock tower, hot air balloon and the golden farmer.
# Run: python3 tools/blender/deco2.py [names...]   (see kit.main)
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import (anim_group, ball, bark_mat, box, clump, cyl, finish, glow, lantern, leaf_mats, main, marker, pm,  # noqa: E402,F401
                 prism, rock, std, torus, uid)
from common import obox  # noqa: E402
from animals import Blob  # noqa: E402
import bpy  # noqa: E402
import bmesh  # noqa: E402

R90 = math.radians(90)


def tufts(m, pts, seed=1):
    for i, (x, y) in enumerate(pts):
        clump(x, y, 0.05, 0.08, [m['leaf'], pm('d2_l2', '#3f9030')], n=8, seed=seed + i, leaf=0.4)


def sundial():
    m = std()
    stone = pm('sd_stone', '#b8b0a0', '#d4ccbc', scale=20)
    cyl(uid('step'), 0.36, 0.08, (0, 0, 0.04), m['stone'][1], verts=8)
    cyl(uid('ped'), 0.12, 0.5, (0, 0, 0.33), stone, verts=12, r2=0.09)
    for z in (0.12, 0.54):
        torus(uid('ring'), 0.12, 0.02, (0, 0, z), stone, segs=16, rsegs=5)
    cyl(uid('face'), 0.22, 0.04, (0, 0, 0.6), stone, verts=24)
    brass = m['brass']
    cyl(uid('dial'), 0.2, 0.012, (0, 0, 0.626), brass, verts=24, bev=0.003)
    for k in range(12):
        a = k * math.pi / 6
        box(uid('tick'), (0.04, 0.008, 0.004), (math.cos(a) * 0.16, math.sin(a) * 0.16, 0.634), pm('sd_ink', '#3a2a1a'), rot=(0, 0, a), bev=0)
    prism(uid('gnomon'), [(-0.13, 0.632), (0.12, 0.632), (-0.13, 0.78)], -0.008, 0.008, brass)
    tufts(m, [(0.32, -0.2), (-0.3, 0.25), (0.25, 0.3)], 11)
    finish('sundial', tex=512)


def bird_feeder():
    m = std()
    cyl(uid('post'), 0.03, 1.1, (0, 0, 0.55), m['wood_dark'], verts=8)
    box(uid('tray'), (0.34, 0.34, 0.03), (0, 0, 1.1), m['wood'], bev=0.008)
    for sx, sy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        box(uid('lip'), (0.34 if sy else 0.02, 0.02 if sy else 0.34, 0.04), (sx * 0.16, sy * 0.16, 1.13), m['wood_dark'], bev=0)
    glass = pm('bf_glass', '#bfe4f0', rough=0.1)
    cyl(uid('hopper'), 0.08, 0.2, (0, 0, 1.22), glass, verts=16)
    seed = pm('bf_seed', '#c8a050', '#8a6a30', scale=80)
    cyl(uid('seed'), 0.075, 0.15, (0, 0, 1.19), seed, verts=16, bev=0)
    rnd = random.Random(4)
    for _ in range(14):
        ball(uid('sd'), 0.012, (rnd.uniform(-0.13, 0.13), rnd.uniform(-0.13, 0.13), 1.125), seed, segs=6)
    roof = pm('bf_roof', '#a83a24', '#c44e36', scale=24)
    for sx in (-1, 1):
        obox(uid('roof'), (sx * 0.1, 0, 1.4), ((math.cos(0.6), 0, -sx * math.sin(0.6)), (0, 1, 0), (sx * math.sin(0.6), 0, math.cos(0.6))),
             (0.28, 0.42, 0.025), roof, bev=0.006)
    for sy in (-1, 1):
        cyl(uid('pole'), 0.012, 0.3, (0, sy * 0.15, 1.27), m['wood_dark'], verts=6)
    # two little birds on the tray edge
    for x, col in ((0.14, '#c8302a'), (-0.12, '#3a78c0')):
        b = pm(uid('bird'), col)
        ball(uid('bd'), 0.035, (x, -0.16, 1.16), b, scale=(0.9, 1.3, 0.9), segs=10)
        ball(uid('bh'), 0.024, (x, -0.2, 1.2), b, segs=8)
        ball(uid('bk'), 0.008, (x, -0.225, 1.2), pm('beak', '#f0b020'), scale=(1, 1.8, 1), segs=6)
    tufts(m, [(0.25, -0.25), (-0.28, 0.2)], 21)
    finish('bird_feeder', tex=512)


def garden_swing():
    m = std()
    wood = m['wood_warm']
    for sx in (-1, 1):
        for sy in (-1, 1):
            obox(uid('leg'), (sx * 0.4, sy * 0.14, 0.62), ((1, 0, 0), (0, math.cos(0.22), -sy * math.sin(0.22)), (0, sy * math.sin(0.22), math.cos(0.22))),
                 (0.07, 0.07, 1.28), wood, bev=0.01)
    box(uid('beam'), (0.98, 0.09, 0.09), (0, 0, 1.24), wood, bev=0.012)
    with anim_group('swayX_seat', (0, 0, 1.2)):
        for sx in (-1, 1):
            cyl(uid('rope'), 0.008, 0.72, (sx * 0.24, 0, 0.84), m['rope'], verts=6, bev=0)
        box(uid('seat'), (0.6, 0.24, 0.04), (0, 0, 0.47), m['wood'], bev=0.01)
        box(uid('back'), (0.6, 0.03, 0.24), (0, 0.11, 0.6), m['wood'], bev=0.01)
        box(uid('cush'), (0.54, 0.2, 0.04), (0, -0.01, 0.51), pm('sw_cush', '#c8302a', '#e04a3a', scale=12), bev=0.015)
    tufts(m, [(0.42, -0.3), (-0.44, 0.3), (0.1, 0.35)], 31)
    finish('garden_swing', tex=512)


def bonfire():
    m = std()
    for i in range(10):
        a = i * math.pi / 5
        rock(uid('ring'), 0.08, (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.04), m['stone'][i % 3], seed=i, squash=0.6)
    cyl(uid('ash'), 0.24, 0.02, (0, 0, 0.01), pm('bf_ash', '#3a3432', '#5a5250', scale=30), verts=16, bev=0)
    bark = bark_mat('bf_bark', '#5a3a22', '#7a5230')
    for k in range(6):
        a = k * math.pi / 3
        obox(uid('log'), (math.cos(a) * 0.08, math.sin(a) * 0.08, 0.12), ((-math.sin(a) * 0.4, math.cos(a) * 0.4, 0.9), (math.cos(a), math.sin(a), 0), (0, 0, 1)),
             (0.05, 0.05, 0.34), bark, bev=0.01)
    fire = pm('bf_fire', '#ff9a20', rough=0.3, emit=3.0)
    core = pm('bf_core', '#ffe060', rough=0.3, emit=4.0)
    cyl(uid('flame'), 0.1, 0.3, (0, 0, 0.2), fire, verts=10, r2=0.0, bev=0)
    for k in range(3):
        a = k * 2.1
        cyl(uid('flame'), 0.05, 0.18, (math.cos(a) * 0.06, math.sin(a) * 0.06, 0.13), fire, verts=8, r2=0.0, bev=0)
    cyl(uid('core'), 0.05, 0.16, (0, 0, 0.12), core, verts=8, r2=0.0, bev=0)
    marker('smoke', (0, 0, 0.4))
    glow(0, 0, 2.4)
    bark2 = bark_mat('bf_seat', '#6e4526', '#8a5a34')
    for x, y, a in ((0.42, -0.1, 0.3), (-0.4, 0.15, -0.3)):
        cyl(uid('seat'), 0.07, 0.4, (x, y, 0.07), bark2, verts=12, rot=(0, R90, a))
    finish('bonfire', tex=512, glow=('bf_fire', 'bf_core'))


def totem_pole():
    m = std()
    wood = pm('tp_wood', '#8a5230', '#a86a3e', scale=6, kind='wave', stretch=(1, 1, 8))
    cols = [pm('tp_red', '#c02a20'), pm('tp_teal', '#1f8a8a'), pm('tp_yel', '#f0b020'), pm('tp_blk', '#1e1a18'), pm('tp_wht', '#f4efe6')]
    cyl(uid('base'), 0.2, 0.1, (0, 0, 0.05), m['stone'][0], verts=12)
    for k in range(4):
        z = 0.3 + k * 0.52
        cyl(uid('seg'), 0.15, 0.5, (0, 0, z), wood, verts=16)
        # a carved face on each segment: brows, big eyes, a beak or mouth
        box(uid('brow'), (0.22, 0.04, 0.05), (0, -0.14, z + 0.13), cols[k % 3], bev=0.01)
        for sx in (-1, 1):
            ball(uid('eye'), 0.05, (sx * 0.06, -0.13, z + 0.05), cols[4], scale=(1, 0.5, 0.8), segs=10)
            ball(uid('pupil'), 0.022, (sx * 0.06, -0.155, z + 0.05), cols[3], scale=(1, 0.5, 1), segs=8)
        if k % 2:
            cyl(uid('beak'), 0.05, 0.16, (0, -0.2, z - 0.06), cols[2], verts=8, r2=0.0, rot=(R90, 0, 0))
        else:
            box(uid('mouth'), (0.16, 0.04, 0.05), (0, -0.14, z - 0.12), cols[0], bev=0.01)
            for i in range(4):
                box(uid('tooth'), (0.02, 0.02, 0.025), (-0.045 + i * 0.03, -0.16, z - 0.12), cols[4], bev=0)
    # spread wings under the thunderbird on top
    for sx in (-1, 1):
        obox(uid('wing'), (sx * 0.34, 0, 2.08), ((sx, 0, 0.25), (0, 1, 0), (-0.25 * sx, 0, 1)), (0.46, 0.05, 0.16), cols[1], bev=0.02)
        for i in range(3):
            box(uid('feather'), (0.05, 0.055, 0.06), (sx * (0.2 + i * 0.13), -0.01, 2.0 + i * 0.03), cols[i % 3], bev=0.008)
    ball(uid('head'), 0.14, (0, 0, 2.28), wood, segs=14)
    cyl(uid('hbeak'), 0.06, 0.18, (0, -0.18, 2.26), cols[2], verts=8, r2=0.0, rot=(R90, 0, 0))
    for sx in (-1, 1):
        ball(uid('heye'), 0.03, (sx * 0.07, -0.11, 2.32), cols[4], segs=8)
    tufts(m, [(0.3, -0.25), (-0.3, 0.25)], 41)
    finish('totem_pole', tex=1024)


def picnic_spot():
    m = std()
    check = pm('pc_check', '#d8282a', '#f6f2ea', scale=9, kind='checker')
    box(uid('blanket'), (0.86, 0.72, 0.012), (0, 0, 0.008), check, rot=(0, 0, 0.12), bev=0.004)
    wick = pm('pc_wicker', '#b8843a', '#d8a050', scale=60, kind='wave', stretch=(1, 1, 4))
    box(uid('basket'), (0.24, 0.16, 0.14), (0.18, 0.12, 0.08), wick, bev=0.02)
    box(uid('lid'), (0.25, 0.085, 0.02), (0.18, 0.08, 0.16), wick, rot=(0.3, 0, 0), bev=0.008)
    torus(uid('handle'), 0.08, 0.01, (0.18, 0.12, 0.16), wick, rot=(R90, 0, 0), segs=16, rsegs=5)
    box(uid('cloth'), (0.1, 0.1, 0.02), (0.18, 0.16, 0.16), check, bev=0.004)
    plate = pm('pc_plate', '#f8f6f0', rough=0.3)
    for x, y in ((-0.18, -0.12), (-0.02, -0.2)):
        cyl(uid('plate'), 0.07, 0.012, (x, y, 0.02), plate, verts=20, bev=0.003)
    ball(uid('apple'), 0.035, (-0.18, -0.12, 0.055), pm('apple', '#d8282a'), segs=10)
    ball(uid('bun'), 0.045, (-0.02, -0.2, 0.05), pm('bun', '#d89a4a'), scale=(1, 1, 0.6), segs=10)
    cyl(uid('bottle'), 0.03, 0.16, (-0.28, 0.14, 0.09), pm('pc_bottle', '#3a8a4a', rough=0.15), verts=12)
    cyl(uid('neck'), 0.012, 0.05, (-0.28, 0.14, 0.19), pm('pc_bottle', '#3a8a4a', rough=0.15), verts=8)
    for k in range(5):
        ball(uid('grape'), 0.018, (0.02 + (k % 3) * 0.03, 0.02 + (k // 3) * 0.025, 0.03), pm('grape', '#6a2a8a'), segs=8)
    tufts(m, [(0.45, -0.35), (-0.45, 0.4)], 51)
    finish('picnic_spot', tex=512)


def wind_turbine():
    m = std()
    white = pm('wt_white', '#f4f6f8', rough=0.4)
    cyl(uid('pad'), 0.3, 0.08, (0, 0, 0.04), m['stone'][1], verts=16)
    cyl(uid('tower'), 0.1, 3.4, (0, 0, 1.78), white, verts=16, r2=0.055)
    box(uid('nacelle'), (0.16, 0.42, 0.16), (0, 0.04, 3.52), white, bev=0.05)
    with anim_group('spinZ_rotor', (0, -0.2, 3.52)):
        ball(uid('hub'), 0.09, (0, -0.22, 3.52), white, scale=(1, 1.3, 1), segs=14)
        for k in range(3):
            a = math.radians(90 + k * 120)
            d = (math.cos(a), 0, math.sin(a))
            obox(uid('blade'), (d[0] * 0.78, -0.22, 3.52 + d[2] * 0.78), (d, (0, 1, 0), (-d[2], 0, d[0])), (1.4, 0.025, 0.12), white, bev=0.012)
    box(uid('band'), (0.021, 0.021, 0.2), (0, 0, 0.5), pm('wt_red', '#c8302a'), bev=0)
    box(uid('door'), (0.08, 0.02, 0.18), (0, -0.1, 0.18), pm('wt_door', '#8a96a0'), bev=0.004)
    tufts(m, [(0.3, -0.3), (-0.3, 0.3)], 61)
    finish('wind_turbine', tex=1024)


def stone_bridge():
    m = std()
    water = pm('br_water', '#2e7ab8', '#4a9ad0', scale=10, rough=0.1)
    box(uid('brook'), (0.7, 1.0, 0.03), (0, 0, 0.0), water, bev=0)
    for sx in (-1, 1):
        box(uid('bank'), (0.18, 1.0, 0.06), (sx * 0.4, 0, 0.02), m['soil'], bev=0.02)
    rnd = random.Random(7)
    n = 11
    for i in range(n):
        t = i / (n - 1)
        x = -0.95 + t * 1.9
        z = 0.08 + math.sin(t * math.pi) * 0.3
        a = math.atan(math.cos(t * math.pi) * 0.3 * math.pi / 1.9)
        obox(uid('deck'), (x, 0, z), ((math.cos(a), 0, math.sin(a)), (0, 1, 0), (-math.sin(a), 0, math.cos(a))), (0.2, 0.5, 0.1),
             m['stone'][rnd.randrange(3)], bev=0.015)
        for sy in (-1, 1):
            obox(uid('wall'), (x, sy * 0.24, z + 0.1), ((math.cos(a), 0, math.sin(a)), (0, 1, 0), (-math.sin(a), 0, math.cos(a))), (0.2, 0.06, 0.12),
                 m['stone'][rnd.randrange(3)], bev=0.012)
    # the arch under the deck
    for k in range(9):
        t = k / 8
        a = math.pi * t
        x, z = -math.cos(a) * 0.3, math.sin(a) * 0.22
        for sy in (-1, 1):
            obox(uid('arch'), (x, sy * 0.22, z), ((math.sin(a), 0, math.cos(a)), (0, 1, 0), (-math.cos(a), 0, math.sin(a))), (0.1, 0.08, 0.1),
                 m['stone'][k % 3], bev=0.01)
    for x in (-0.95, 0.95):
        for sy in (-1, 1):
            box(uid('newel'), (0.1, 0.1, 0.24), (x, sy * 0.24, 0.16), m['stone'][0], bev=0.015)
    for x, y in ((-0.3, 0.42), (0.3, -0.42), (0.25, 0.44)):
        cyl(uid('reed'), 0.008, 0.26, (x, y, 0.13), m['leaf'], verts=5, bev=0)
    finish('stone_bridge', tex=1024)


def pergola():
    m = std()
    white = pm('pg_white', '#f6f2ea', rough=0.6)
    box(uid('floor'), (1.8, 1.8, 0.05), (0, 0, 0.025), m['stone'][1], bev=0.01)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('post'), (0.1, 0.1, 1.5), (sx * 0.8, sy * 0.8, 0.8), white, bev=0.015)
        box(uid('beam'), (0.07, 1.98, 0.14), (sx * 0.8, 0, 1.55), white, bev=0.01)
    for k in range(9):
        box(uid('rafter'), (1.98, 0.05, 0.1), (0, -0.88 + k * 0.22, 1.66), white, bev=0.008)
    lm = leaf_mats('#2f8a26', 'pgl')
    rnd = random.Random(5)
    for i in range(38):
        x, y = rnd.uniform(-0.95, 0.95), rnd.uniform(-0.95, 0.95)
        ball(uid('vine'), rnd.uniform(0.08, 0.14), (x, y, 1.74), lm[i % len(lm)], scale=(1, 1, 0.5), segs=8)
    grape = pm('pg_grape', '#5a1a6a')
    for i in range(10):
        x, y = rnd.uniform(-0.7, 0.7), rnd.uniform(-0.7, 0.7)
        for k in range(4):
            ball(uid('g'), 0.025, (x + (k % 2) * 0.03, y, 1.58 - k * 0.03), grape, segs=6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            for k in range(5):
                ball(uid('climb'), 0.06, (sx * 0.84, sy * 0.84, 0.3 + k * 0.28), lm[k % len(lm)], segs=8)
    box(uid('table'), (0.6, 0.4, 0.04), (0, 0, 0.44), m['wood'], bev=0.01)
    for sx in (-1, 1):
        box(uid('tl'), (0.04, 0.34, 0.4), (sx * 0.26, 0, 0.23), m['wood_dark'], bev=0.006)
        box(uid('bench'), (0.6, 0.14, 0.04), (0, sx * 0.36, 0.26), m['wood'], bev=0.008)
    lantern(0, 0, 1.28, m, light=1.6)
    finish('pergola', tex=1024, glow=('lamp',))


def horse_statue():
    m = std()
    bronze = pm('hs_bronze', '#9a6230', '#c88a44', scale=16, rough=0.35, metal=0.3)
    stone = pm('hs_stone', '#c8c0b0', '#e0d8c8', scale=20)
    box(uid('step'), (0.8, 0.6, 0.1), (0, 0, 0.05), m['stone'][1], bev=0.015)
    box(uid('plinth'), (0.64, 0.44, 0.5), (0, 0, 0.35), stone, bev=0.02)
    box(uid('cap'), (0.7, 0.5, 0.06), (0, 0, 0.63), stone, bev=0.015)
    box(uid('plaque'), (0.26, 0.01, 0.12), (0, -0.225, 0.38), m['brass'], bev=0.003)
    y0 = 0.66
    # a rearing horse in game coords (y up, +z to the front): planted hind legs, forelegs raised
    b = Blob(0.008)
    b.cap((0, y0 + 0.28, -0.13), (0, y0 + 0.5, 0.08), 0.1, 0.095)
    b.cap((0, y0 + 0.52, 0.08), (0, y0 + 0.7, 0.14), 0.065, 0.048)
    b.cap((0, y0 + 0.72, 0.14), (0, y0 + 0.66, 0.26), 0.048, 0.034)
    for sx in (-1, 1):
        b.cap((sx * 0.055, y0 + 0.26, -0.13), (sx * 0.055, y0 + 0.13, -0.05), 0.045, 0.03)
        b.cap((sx * 0.055, y0 + 0.13, -0.05), (sx * 0.055, y0 + 0.02, -0.1), 0.03, 0.024)
        b.cap((sx * 0.05, y0 + 0.47, 0.1), (sx * 0.05, y0 + 0.43, 0.22), 0.035, 0.026)
        b.cap((sx * 0.05, y0 + 0.43, 0.22), (sx * 0.05 * (1 if sx > 0 else 0.6), y0 + 0.32, 0.22 + (0.03 if sx > 0 else -0.02)), 0.026, 0.02)
        b.cap((sx * 0.025, y0 + 0.74, 0.12), (sx * 0.03, y0 + 0.8, 0.1), 0.014, 0.005)
    b.cap((0, y0 + 0.3, -0.2), (0, y0 + 0.02, -0.26), 0.035, 0.02)
    for i in range(6):
        tt = i / 5
        b.ell((0, y0 + 0.56 + tt * 0.15, 0.04 + tt * 0.08), 0.018, 0.035, 0.025)
    b.build(bronze, 2400)
    tufts(m, [(0.38, -0.36), (-0.4, 0.34)], 71)
    finish('horse_statue', tex=1024)


def torii_gate():
    m = std()
    red = pm('tg_red', '#c8281c', '#d83a2a', scale=12)
    black = pm('tg_black', '#1e1a18')
    for sx in (-1, 1):
        cyl(uid('base'), 0.1, 0.14, (sx * 0.62, 0, 0.07), black, verts=16)
        cyl(uid('pillar'), 0.075, 1.7, (sx * 0.62, 0, 0.99), red, verts=16, r2=0.065)
    box(uid('nuki'), (1.6, 0.08, 0.1), (0, 0, 1.46), red, bev=0.01)
    box(uid('tsuka'), (0.1, 0.08, 0.18), (0, 0, 1.6), red, bev=0.01)
    box(uid('kasagi'), (2.0, 0.16, 0.1), (0, 0, 1.8), red, bev=0.012)
    box(uid('top'), (2.14, 0.2, 0.07), (0, 0, 1.88), black, bev=0.012)
    for sx in (-1, 1):
        obox(uid('tip'), (sx * 1.06, 0, 1.92), ((1, 0, sx * 0.2), (0, 1, 0), (-sx * 0.2, 0, 1)), (0.16, 0.2, 0.07), black, bev=0.01)
    for sx in (-1, 1):
        box(uid('lantern'), (0.14, 0.14, 0.22), (sx * 0.9, -0.28, 0.46), m['stone'][0], bev=0.02)
        cyl(uid('lroof'), 0.14, 0.1, (sx * 0.9, -0.28, 0.62), m['stone'][1], verts=4, r2=0.02, rot=(0, 0, math.radians(45)), bev=0)
        cyl(uid('lpost'), 0.04, 0.35, (sx * 0.9, -0.28, 0.18), m['stone'][2], verts=8)
        box(uid('llight'), (0.08, 0.15, 0.08), (sx * 0.9, -0.28, 0.47), m['lamp'], bev=0)
        glow(sx * 0.9, -0.28, 1.0)
    for i in range(5):
        box(uid('path'), (0.4, 0.16, 0.03), (0, -0.4 + i * 0.2, 0.015), m['stone'][i % 3], rot=(0, 0, (i - 2) * 0.1), bev=0.01)
    finish('torii_gate', tex=1024, glow=('lamp',))


def zen_garden():
    m = std()
    sand = pm('zg_sand', '#e8dcc0', '#f4ead4', scale=36, kind='wave', stretch=(1, 12, 1))
    box(uid('sand'), (1.8, 1.8, 0.04), (0, 0, 0.02), sand, bev=0)
    for k in range(16):
        box(uid('rake'), (1.76, 0.015, 0.012), (0, -0.84 + k * 0.112, 0.045), pm('zg_line', '#d4c6a4'), bev=0)
    border = pm('zg_border', '#6a6058', '#8a8078', scale=20)
    for sx in (-1, 1):
        box(uid('edge'), (0.08, 1.9, 0.1), (sx * 0.93, 0, 0.05), border, bev=0.015)
        box(uid('edge'), (1.9, 0.08, 0.1), (0, sx * 0.93, 0.05), border, bev=0.015)
    for x, y, r, s in ((-0.4, 0.3, 0.22, 1), (0.45, -0.2, 0.16, 2), (0.1, 0.55, 0.12, 3), (-0.5, -0.45, 0.1, 4)):
        rock(uid('stone'), r, (x, y, r * 0.4), m['stone'][s % 3], seed=s, squash=0.8)
        for k in range(3):
            torus(uid('ring'), r * (1.3 + k * 0.35), 0.008, (x, y, 0.045), pm('zg_line', '#d4c6a4'), segs=28, rsegs=4)
    moss = pm('zg_moss', '#4a8a2a', '#6aa83a', scale=30)
    ball(uid('moss'), 0.2, (-0.4, 0.3, 0.02), moss, scale=(1.4, 1.2, 0.2), segs=12)
    # a small bonsai pine in the corner
    bark = bark_mat('zg_bark', '#5a3a22', '#7a5230')
    cyl(uid('bt'), 0.03, 0.3, (0.6, 0.6, 0.18), bark, verts=8, rot=(0.2, -0.2, 0))
    for x, y, z in ((0.55, 0.62, 0.34), (0.68, 0.52, 0.3), (0.62, 0.66, 0.4)):
        ball(uid('bn'), 0.09, (x, y, z), pm('zg_pine', '#2a6a2a', '#3a8a36', scale=30), scale=(1.3, 1.3, 0.5), segs=10)
    finish('zen_garden', tex=1024)


def treehouse():
    m = std()
    bark = bark_mat('th_bark', '#6e4526', '#8a5a34')
    cyl(uid('trunk'), 0.24, 2.6, (0.2, 0.2, 1.3), bark, verts=16, r2=0.16)
    for k in range(5):
        a = k * 1.26
        cyl(uid('root'), 0.08, 0.5, (0.2 + math.cos(a) * 0.22, 0.2 + math.sin(a) * 0.22, 0.08), bark, verts=8, r2=0.02,
            rot=(math.sin(a) * 1.2, -math.cos(a) * 1.2, 0))
    lm = leaf_mats('#2f8a26', 'thl')
    for i, (x, y, z, r) in enumerate(((0.2, 0.3, 2.7, 0.62), (-0.35, 0.1, 2.5, 0.45), (0.65, -0.1, 2.5, 0.45), (0.1, 0.6, 2.4, 0.5), (0.2, -0.2, 2.9, 0.4))):
        clump(x, y, z, r, lm, n=26, seed=80 + i, leaf=0.3)
    wood = m['wood']
    box(uid('platform'), (1.3, 1.1, 0.06), (0, -0.1, 1.3), m['wood_dark'], bev=0.01)
    for sx in (-1, 1):
        cyl(uid('brace'), 0.03, 0.7, (sx * 0.5, -0.1, 1.0), m['wood_dark'], verts=8, rot=(0, -sx * 0.6, 0))
    box(uid('hut'), (0.9, 0.7, 0.6), (-0.05, 0.0, 1.63), wood, bev=0.01)
    for sx in (-1, 1):
        obox(uid('roof'), (-0.05 + sx * 0.25, 0.0, 2.08), ((math.cos(0.6), 0, -sx * math.sin(0.6)), (0, 1, 0), (sx * math.sin(0.6), 0, math.cos(0.6))),
             (0.62, 0.9, 0.04), pm('th_roof', '#a83a24', '#c44e36', scale=24), bev=0.008)
    box(uid('door'), (0.2, 0.02, 0.4), (-0.25, -0.36, 1.53), m['wood_dark'], bev=0.006)
    box(uid('win'), (0.2, 0.02, 0.18), (0.18, -0.36, 1.7), m['glass'], bev=0.004)
    box(uid('winf'), (0.24, 0.015, 0.22), (0.18, -0.355, 1.7), m['trim'], bev=0.004)
    for k in range(6):
        box(uid('rail'), (0.03, 0.03, 0.2), (-0.6 + k * 0.24, -0.63, 1.43), wood, bev=0)
    box(uid('railt'), (1.3, 0.04, 0.03), (0, -0.63, 1.53), wood, bev=0)
    # a rope ladder down the front
    for sx in (-1, 1):
        cyl(uid('rope'), 0.008, 1.3, (0.35 + sx * 0.1, -0.66, 0.65), m['rope'], verts=5, bev=0)
    for k in range(6):
        box(uid('rung'), (0.22, 0.03, 0.02), (0.35, -0.66, 0.12 + k * 0.2), wood, bev=0)
    lantern(-0.5, -0.5, 1.33, m, light=1.4)
    finish('treehouse', tex=1024, glow=('lamp', 'glass'))


def greenhouse():
    m = std()
    frame = pm('gh_frame', '#f4f6f4', rough=0.4)
    glass = pm('gh_glass', '#a8dce8', rough=0.05)
    box(uid('base'), (1.8, 1.4, 0.2), (0, 0, 0.1), m['brick'][0], bev=0.01)
    box(uid('walls'), (1.76, 1.36, 0.8), (0, 0, 0.6), glass, bev=0)
    for sy in (-1, 1):
        obox(uid('roof'), (0, sy * 0.35, 1.2), ((1, 0, 0), (0, math.cos(0.7), sy * math.sin(0.7)), (0, -sy * math.sin(0.7), math.cos(0.7))),
             (1.8, 0.9, 0.02), glass, bev=0)
    prism(uid('gable'), [(-0.68, 1.0), (0.68, 1.0), (0, 1.52)], -0.88, 0.88, glass)
    for k in range(7):
        x = -0.87 + k * 0.29
        for sy in (-1, 1):
            box(uid('mull'), (0.03, 0.03, 0.8), (x, sy * 0.68, 0.6), frame, bev=0)
            obox(uid('rib'), (x, sy * 0.35, 1.24), ((1, 0, 0), (0, math.cos(0.7), sy * math.sin(0.7)), (0, -sy * math.sin(0.7), math.cos(0.7))),
                 (0.03, 0.92, 0.03), frame, bev=0)
    for sx in (-1, 1):
        for k in range(4):
            box(uid('mull'), (0.03, 0.03, 0.8), (sx * 0.88, -0.51 + k * 0.34, 0.6), frame, bev=0)
    box(uid('ridge'), (1.84, 0.05, 0.05), (0, 0, 1.52), frame, bev=0)
    box(uid('sill'), (1.8, 1.4, 0.03), (0, 0, 1.0), frame, bev=0)
    box(uid('door'), (0.34, 0.02, 0.72), (0, -0.69, 0.56), frame, bev=0.006)
    # plants packed inside
    lm = leaf_mats('#2f8a26', 'ghl')
    for i in range(8):
        x = -0.65 + (i % 4) * 0.43
        y = -0.3 if i < 4 else 0.3
        cyl(uid('pot'), 0.1, 0.14, (x, y, 0.27), pm('gh_pot', '#b8582a'), verts=12, r2=0.08)
        clump(x, y, 0.5, 0.17, lm, n=14, seed=90 + i, leaf=0.35)
        if i % 2:
            for k in range(3):
                ball(uid('tom'), 0.03, (x + math.cos(k * 2) * 0.1, y - 0.1, 0.45 + k * 0.05), pm('gh_tom', '#d8282a'), segs=8)
    finish('greenhouse', tex=1024)


def water_tower():
    m = std()
    wood = m['wood_warm']
    for sx in (-1, 1):
        for sy in (-1, 1):
            obox(uid('leg'), (sx * 0.52, sy * 0.52, 1.1), ((1, 0, 0), (0, 1, 0), (-sx * 0.08, -sy * 0.08, 1)), (0.1, 0.1, 2.2), wood, bev=0.012)
            cyl(uid('foot'), 0.1, 0.1, (sx * 0.6, sy * 0.6, 0.05), m['stone'][0], verts=8)
    for z in (0.7, 1.5):
        for sx in (-1, 1):
            box(uid('brace'), (0.05, 1.1, 0.06), (sx * (0.55 - z * 0.04), 0, z), wood, bev=0)
            box(uid('brace'), (1.1, 0.05, 0.06), (0, sx * (0.55 - z * 0.04), z), wood, bev=0)
    box(uid('deck'), (1.2, 1.2, 0.06), (0, 0, 2.2), m['wood_dark'], bev=0.01)
    stave = pm('wt_stave', '#8a5a34', '#a86e40', scale=8, kind='wave', stretch=(1, 1, 8))
    cyl(uid('tank'), 0.52, 0.9, (0, 0, 2.7), stave, verts=28)
    for z in (2.35, 2.7, 3.05):
        torus(uid('hoop'), 0.53, 0.018, (0, 0, z), m['iron'], segs=32, rsegs=5)
    cyl(uid('roof'), 0.6, 0.4, (0, 0, 3.35), pm('wt_roof', '#3a5a6a', '#4a6a7a', scale=20), verts=28, r2=0.04)
    ball(uid('fin'), 0.04, (0, 0, 3.58), m['brass'], segs=8)
    cyl(uid('pipe'), 0.04, 2.2, (0.3, -0.3, 1.1), m['metal'], verts=10)
    cyl(uid('spout'), 0.03, 0.4, (0.3, -0.5, 2.3), m['metal'], verts=8, rot=(R90, 0, 0))
    for k in range(10):
        box(uid('ladder'), (0.2, 0.02, 0.02), (-0.6, -0.1, 0.2 + k * 0.2), m['wood_dark'], bev=0)
    for sx in (-1, 1):
        box(uid('lrail'), (0.02, 0.02, 2.1), (-0.6, -0.1 + sx * 0.1, 1.1), m['wood_dark'], bev=0)
    tufts(m, [(0.8, -0.7), (-0.8, 0.7), (0.7, 0.8)], 101)
    finish('water_tower', tex=1024)


def carousel():
    m = std()
    stripe = pm('cr_stripe', '#d8282a', '#f6f2ea', scale=10, kind='checker')
    gold = m['brass']
    cyl(uid('base'), 0.95, 0.14, (0, 0, 0.07), pm('cr_base', '#2a5aa8', '#3a6ac0', scale=20), verts=24)
    torus(uid('trim'), 0.95, 0.03, (0, 0, 0.14), gold, segs=40, rsegs=5)
    with anim_group('spinY_ride', (0, 0, 0)):
        cyl(uid('floor'), 0.9, 0.04, (0, 0, 0.16), m['wood'], verts=24)
        cyl(uid('pole'), 0.14, 1.3, (0, 0, 0.8), pm('cr_core', '#f0c020', '#f8d860', scale=20), verts=16)
        horse_cols = ['#f6f2ea', '#3a2a22', '#c07a3a', '#f6f2ea', '#8a5a34', '#f6f2ea']
        for k in range(6):
            a = k * math.pi / 3
            x, y = math.cos(a) * 0.65, math.sin(a) * 0.65
            cyl(uid('hpole'), 0.015, 1.3, (x, y, 0.82), gold, verts=8)
            hc = pm(uid('horse'), horse_cols[k])
            d = (-math.sin(a), math.cos(a), 0)
            obox(uid('hb'), (x, y, 0.62 + (k % 2) * 0.1), (d, (math.cos(a), math.sin(a), 0), (0, 0, 1)), (0.3, 0.1, 0.12), hc, bev=0.04)
            obox(uid('hn'), (x + d[0] * 0.15, y + d[1] * 0.15, 0.74 + (k % 2) * 0.1), (d, (math.cos(a), math.sin(a), 0), (0, 0, 1)), (0.08, 0.07, 0.18), hc, bev=0.03)
            obox(uid('hh'), (x + d[0] * 0.2, y + d[1] * 0.2, 0.82 + (k % 2) * 0.1), (d, (math.cos(a), math.sin(a), 0), (0, 0, 1)), (0.14, 0.06, 0.07), hc, bev=0.02)
            obox(uid('saddle'), (x, y, 0.69 + (k % 2) * 0.1), (d, (math.cos(a), math.sin(a), 0), (0, 0, 1)), (0.1, 0.11, 0.02), pm('cr_saddle', '#c8282a'), bev=0.008)
            for s in (-1, 1):
                for e in (-1, 1):
                    cyl(uid('hl'), 0.015, 0.2, (x + d[0] * 0.1 * s + math.cos(a) * 0.03 * e, y + d[1] * 0.1 * s + math.sin(a) * 0.03 * e,
                                                0.48 + (k % 2) * 0.1), hc, verts=6, bev=0)
        cyl(uid('canopy'), 1.0, 0.45, (0, 0, 1.68), stripe, verts=24, r2=0.1)
        cyl(uid('valance'), 1.0, 0.14, (0, 0, 1.43), pm('cr_val', '#f0c020'), verts=24)
        for k in range(24):
            a = k * math.pi / 12
            ball(uid('bulb'), 0.025, (math.cos(a) * 1.0, math.sin(a) * 1.0, 1.36), m['lamp'], segs=6)
        cyl(uid('spire'), 0.03, 0.3, (0, 0, 2.0), gold, verts=8)
        ball(uid('topb'), 0.06, (0, 0, 2.16), gold, segs=10)
    glow(0, 0, 3.0)
    finish('carousel', tex=1024, glow=('lamp',))


def lighthouse():
    m = std()
    red = pm('lh_red', '#c8281c')
    white = pm('lh_white', '#f6f4ee', rough=0.5)
    for i in range(12):
        a = i * math.pi / 6
        rock(uid('rock'), 0.2, (math.cos(a) * 0.72, math.sin(a) * 0.72, 0.08), m['stone'][i % 3], seed=i + 5, squash=0.55)
    cyl(uid('foot'), 0.6, 0.3, (0, 0, 0.15), m['stone'][1], verts=20)
    for k in range(5):
        z0 = 0.3 + k * 0.62
        r0, r1 = 0.46 - k * 0.05, 0.46 - (k + 1) * 0.05
        cyl(uid('band'), r0, 0.62, (0, 0, z0 + 0.31), red if k % 2 == 0 else white, verts=24, r2=r1, bev=0)
    zt = 3.4
    cyl(uid('gallery'), 0.4, 0.06, (0, 0, zt + 0.03), m['iron'], verts=24)
    for k in range(16):
        a = k * math.pi / 8
        cyl(uid('rail'), 0.008, 0.16, (math.cos(a) * 0.38, math.sin(a) * 0.38, zt + 0.14), m['iron'], verts=5, bev=0)
    torus(uid('railt'), 0.38, 0.012, (0, 0, zt + 0.22), m['iron'], segs=24, rsegs=4)
    cyl(uid('lamproom'), 0.22, 0.34, (0, 0, zt + 0.23), pm('lh_glass', '#ffe7a0', rough=0.2, emit=2.5), verts=16)
    for k in range(8):
        a = k * math.pi / 4
        box(uid('mull'), (0.02, 0.02, 0.34), (math.cos(a) * 0.22, math.sin(a) * 0.22, zt + 0.23), m['iron'], bev=0)
    cyl(uid('cap'), 0.26, 0.26, (0, 0, zt + 0.53), red, verts=16, r2=0.04)
    ball(uid('vent'), 0.05, (0, 0, zt + 0.7), m['iron'], segs=8)
    box(uid('door'), (0.16, 0.04, 0.3), (0, -0.45, 0.45), m['wood_dark'], bev=0.01)
    for z, a in ((1.2, 0.3), (2.1, -0.4), (2.8, 0.2)):
        r = 0.46 - (z - 0.3) / 0.62 * 0.05
        box(uid('win'), (0.08, 0.02, 0.14), (math.sin(a) * r, -math.cos(a) * r, z), m['glass'], rot=(0, 0, a), bev=0)
    glow(0, 0, 3.2)
    finish('lighthouse', tex=1024, glow=('lh_glass',))


def clock_tower():
    m = std()
    stone = pm('ct_stone', '#c8b89a', '#dccca8', scale=18)
    box(uid('base'), (1.1, 1.1, 0.2), (0, 0, 0.1), m['stone'][0], bev=0.015)
    box(uid('tower'), (0.8, 0.8, 2.6), (0, 0, 1.5), stone, bev=0.02)
    for z in (0.9, 1.8):
        box(uid('course'), (0.86, 0.86, 0.06), (0, 0, z), m['stone'][1], bev=0.01)
    box(uid('top'), (0.9, 0.9, 0.1), (0, 0, 2.85), m['stone'][1], bev=0.012)
    face = pm('ct_face', '#f8f4e8', rough=0.4)
    ink = pm('ct_ink', '#1e1a18')
    for k in range(4):
        a = k * R90
        dx, dy = math.sin(a), -math.cos(a)
        c = (dx * 0.41, dy * 0.41, 2.4)
        cyl(uid('face'), 0.28, 0.03, c, face, verts=32, rot=(R90, 0, a))
        torus(uid('rim'), 0.28, 0.025, c, m['brass'], rot=(R90, 0, a), segs=32, rsegs=5)
        for h in range(12):
            t = h * math.pi / 6
            box(uid('hr'), (0.02, 0.01, 0.05), (c[0] + math.cos(a) * math.sin(t) * 0.22 + dx * 0.02, c[1] + math.sin(a) * math.sin(t) * 0.22 + dy * 0.02,
                                                2.4 + math.cos(t) * 0.22), ink, rot=(0, -t if k % 2 == 0 else 0, a), bev=0)
        box(uid('hand'), (0.025, 0.012, 0.18), (c[0] + dx * 0.03, c[1] + dy * 0.03, 2.47), ink, rot=(0, 0, a), bev=0)
        obox(uid('hand'), (c[0] + dx * 0.03 + math.cos(a) * 0.06, c[1] + dy * 0.03 + math.sin(a) * 0.06, 2.42),
             ((math.cos(a), math.sin(a), 0), (dx, dy, 0), (0, 0, 1)), (0.14, 0.012, 0.025), ink, bev=0)
        box(uid('win'), (0.14, 0.03, 0.28), (dx * 0.4, dy * 0.4, 1.3), m['glass'], rot=(0, 0, a), bev=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('col'), (0.1, 0.1, 0.5), (sx * 0.34, sy * 0.34, 3.15), stone, bev=0.01)
    ball(uid('bell'), 0.14, (0, 0, 3.12), m['brass'], scale=(1, 1, 1.1), segs=14)
    cyl(uid('roof'), 0.62, 0.9, (0, 0, 3.85), pm('ct_roof', '#2a4a6a', '#3a5a7a', scale=20), verts=4, r2=0.0, rot=(0, 0, math.radians(45)), bev=0)
    box(uid('rbase'), (0.9, 0.9, 0.06), (0, 0, 3.42), m['stone'][1], bev=0.01)
    cyl(uid('spire'), 0.02, 0.3, (0, 0, 4.42), m['brass'], verts=6)
    ball(uid('orb'), 0.05, (0, 0, 4.58), m['brass'], segs=8)
    box(uid('door'), (0.26, 0.04, 0.44), (0, -0.41, 0.42), m['wood_dark'], bev=0.01)
    ball(uid('arch'), 0.13, (0, -0.41, 0.64), m['wood_dark'], scale=(1, 0.3, 0.5), segs=10)
    lantern(-0.3, -0.6, 0.0, m, post=0.6, light=1.4)
    lantern(0.3, -0.6, 0.0, m, post=0.6, light=1.4)
    finish('clock_tower', tex=1024, glow=('lamp',))


def hot_air_balloon():
    m = std()
    cols = [pm('hb_red', '#d8282a'), pm('hb_yel', '#f0b020'), pm('hb_blue', '#2a6ac0'), pm('hb_wht', '#f6f2ea')]
    wick = pm('hb_wicker', '#9a6a30', '#c08a44', scale=60, kind='wave', stretch=(1, 1, 4))
    box(uid('basket'), (0.44, 0.44, 0.36), (0, 0, 0.2), wick, bev=0.03)
    box(uid('brim'), (0.48, 0.48, 0.05), (0, 0, 0.38), pm('hb_leather', '#6a3a1e'), bev=0.015)
    for k in range(4):
        box(uid('sack'), (0.1, 0.06, 0.12), (0.26 if k < 2 else -0.26, (k % 2 - 0.5) * 0.2, 0.18), m['cloth'], bev=0.03)
    # tether ropes to pegs so it stays put
    for sx, sy in ((1, 1), (-1, -1), (1, -1)):
        cyl(uid('peg'), 0.025, 0.12, (sx * 0.85, sy * 0.85, 0.06), m['wood_dark'], verts=6)
        cyl(uid('tether'), 0.006, 0.9, (sx * 0.55, sy * 0.55, 0.28), m['rope'], verts=4, bev=0,
            rot=(-sy * math.radians(52) * 0.7, sx * math.radians(52) * 0.7, 0))
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(uid('line'), 0.006, 0.75, (sx * 0.28, sy * 0.28, 0.76), m['rope'], verts=4, bev=0, rot=(-sy * 0.25, sx * 0.25, 0))
    box(uid('burner'), (0.18, 0.18, 0.08), (0, 0, 1.12), m['metal'], bev=0.02)
    cyl(uid('flame'), 0.05, 0.14, (0, 0, 1.24), pm('hb_flame', '#ffa020', emit=3.0), verts=8, r2=0.0, bev=0)
    with anim_group('swayY_envelope', (0, 0, 1.12)):
        n, rows, cols_per = 12, 14, 3
        prof = [(math.sin(0.3 + tt * 2.65) * 0.95 + 0.12 * (1 - tt), 1.28 + tt * 1.75) for tt in (j / rows for j in range(rows + 1))]
        prof[-1] = (0.0, prof[-1][1] + 0.05)
        for k in range(n):
            me = bpy.data.meshes.new(uid('gore'))
            bm = bmesh.new()
            grid = []
            for j, (r, z) in enumerate(prof):
                row = []
                for c in range(cols_per + 1):
                    a = (k + c / cols_per) * math.pi * 2 / n
                    row.append(bm.verts.new((math.cos(a) * r, math.sin(a) * r, z)))
                grid.append(row)
            for j in range(rows):
                for c in range(cols_per):
                    q = [grid[j][c], grid[j][c + 1], grid[j + 1][c + 1], grid[j + 1][c]]
                    if len({id(v) for v in q}) == 4:
                        f = bm.faces.new(q)
                        f.material_index = 0 if j < 9 else 1
                        f.smooth = True
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            bm.to_mesh(me)
            bm.free()
            ob = bpy.data.objects.new(me.name, me)
            bpy.context.collection.objects.link(ob)
            me.materials.append(cols[k % 4])
            me.materials.append(cols[3] if k % 2 else cols[0])
        cyl(uid('skirt'), 0.3, 0.2, (0, 0, 1.24), cols[3], verts=16, r2=0.26)
    finish('hot_air_balloon', tex=1024, glow=('hb_flame',))


def golden_farmer():
    m = std()
    gold = pm('gf_gold', '#d49a1a', '#f6d050', scale=14, rough=0.25, metal=0.3)
    marble = pm('gf_marble', '#e8e4dc', '#f8f6f0', scale=12)
    box(uid('step'), (0.84, 0.84, 0.1), (0, 0, 0.05), m['stone'][1], bev=0.015)
    cyl(uid('plinth'), 0.3, 0.44, (0, 0, 0.32), marble, verts=8)
    cyl(uid('cap'), 0.34, 0.06, (0, 0, 0.57), marble, verts=8)
    box(uid('plaque'), (0.2, 0.01, 0.1), (0, -0.29, 0.34), gold, bev=0.003)
    y0 = 0.6
    # the farmer in game coords (y up, +z to the front), one hand on a pitchfork
    b = Blob(0.007)
    for sx in (-1, 1):
        b.cap((sx * 0.06, y0 + 0.02, 0.02), (sx * 0.065, y0 + 0.36, 0), 0.05, 0.055)
        b.ell((sx * 0.06, y0 + 0.03, 0.04), 0.045, 0.03, 0.07)
    b.ell((0, y0 + 0.5, 0), 0.13, 0.17, 0.09)
    b.cap((0, y0 + 0.62, 0), (0, y0 + 0.7, 0), 0.04)
    b.ball((0, y0 + 0.78, 0.005), 0.085)
    b.ell((0, y0 + 0.77, 0.085), 0.02, 0.022, 0.02)
    b.cap((0.14, y0 + 0.62, 0), (0.21, y0 + 0.5, 0.05), 0.038, 0.032)
    b.cap((0.21, y0 + 0.5, 0.05), (0.24, y0 + 0.62, 0.1), 0.032, 0.028)
    b.cap((-0.14, y0 + 0.62, 0), (-0.18, y0 + 0.45, 0.04), 0.038, 0.032)
    b.cap((-0.18, y0 + 0.45, 0.04), (-0.16, y0 + 0.4, 0.12), 0.032, 0.028)
    b.build(gold, 2600)
    cyl(uid('brim'), 0.17, 0.02, (0, 0, y0 + 0.85), gold, verts=24)
    cyl(uid('crown'), 0.09, 0.12, (0, 0, y0 + 0.92), gold, verts=16, r2=0.075)
    for sx in (-1, 1):
        box(uid('strap'), (0.035, 0.02, 0.26), (sx * 0.07, -0.085, y0 + 0.5), gold, bev=0.006)
    cyl(uid('fork'), 0.014, 1.05, (0.25, -0.1, y0 + 0.52), gold, verts=6)
    box(uid('fbar'), (0.1, 0.012, 0.012), (0.25, -0.1, y0 + 1.04), gold, bev=0)
    for k in range(3):
        cyl(uid('tine'), 0.007, 0.14, (0.21 + k * 0.04, -0.1, y0 + 1.11), gold, verts=5, bev=0)
    for k in range(7):
        a = (k - 3) * 0.12
        cyl(uid('wheat'), 0.006, 0.3, (-0.16 + math.sin(a) * 0.08, -0.14, y0 + 0.48), gold, verts=4, rot=(0, a, 0), bev=0)
        ball(uid('ear'), 0.018, (-0.16 + math.sin(a) * 0.2, -0.14, y0 + 0.64), gold, scale=(0.7, 0.7, 1.8), segs=6)
    tufts(m, [(0.36, -0.36), (-0.36, 0.36)], 111)
    finish('golden_farmer', tex=1024)


MODELS = {'sundial': sundial, 'bird_feeder': bird_feeder, 'garden_swing': garden_swing, 'bonfire': bonfire,
          'totem_pole': totem_pole, 'picnic_spot': picnic_spot, 'wind_turbine': wind_turbine, 'stone_bridge': stone_bridge,
          'pergola': pergola, 'horse_statue': horse_statue, 'torii_gate': torii_gate, 'zen_garden': zen_garden,
          'treehouse': treehouse, 'greenhouse': greenhouse, 'water_tower': water_tower, 'carousel': carousel,
          'lighthouse': lighthouse, 'clock_tower': clock_tower, 'hot_air_balloon': hot_air_balloon, 'golden_farmer': golden_farmer}

if __name__ == '__main__':
    main(MODELS)
