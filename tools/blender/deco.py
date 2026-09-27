# Decorations and obstacles: hay bale, fence, bird house, pumpkins, bird bath, topiary, well,
# rose arch, hay wagon, tractor, bench, street lamp, scarecrow, windmill, pond, mailbox, gazebo,
# fountain, and the rocks and bushes that clutter new land. Living bits (water, birds, spray)
# stay in the game, so these models leave room for them.
# Run: python3 tools/blender/deco.py [names...]   (see kit.main)
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import (anim_group, ball, box, clump, crate, cyl, finish, glow, lantern, main, marker, pm, profile_roof,  # noqa: E402
                 rock, shingles, std, torus, uid)
from common import obox  # noqa: E402

R90 = math.radians(90)


def hay_bale():
    m = std()
    hay = m['hay']
    end = pm('hay_end', '#c89a38', '#e0b850', scale=50)
    cyl(uid('bale'), 0.2, 0.55, (0, 0, 0.2), hay, verts=24, rot=(0, R90, 0), bev=0.03)
    # rolled layers on the ends and red twine around it
    for sx in (-1, 1):
        for k, r in enumerate((0.16, 0.11, 0.06)):
            torus(uid('roll'), r, 0.012, (sx * 0.276, 0, 0.2), end, rot=(0, R90, 0), segs=24, rsegs=5)
    twine = pm('twine', '#b8302a')
    for x in (-0.14, 0.14):
        torus(uid('tw'), 0.203, 0.008, (x, 0, 0.2), twine, rot=(0, R90, 0), segs=28, rsegs=5)
    rnd = random.Random(3)
    for i in range(9):
        a = rnd.uniform(0, math.pi * 2)
        box(uid('wisp'), (0.12, 0.008, 0.006), (rnd.uniform(-0.3, 0.3), math.cos(a) * 0.3, 0.004), hay, rot=(0, 0, a), bev=0)
    finish('hay_bale', tex=512)


def picket_fence():
    m = std()
    white = pm('picket', '#f4f1ea', rough=0.6)
    for x in (-0.46, 0.46):
        box(uid('post'), (0.07, 0.07, 0.44), (x, 0, 0.22), white, bev=0.012)
        box(uid('cap'), (0.09, 0.09, 0.03), (x, 0, 0.455), white, bev=0.01)
        ball(uid('knob'), 0.03, (x, 0, 0.49), white, segs=10)
    for z in (0.1, 0.27):
        box(uid('rail'), (0.9, 0.025, 0.04), (0, 0.02, z), white, bev=0.008)
    for i in range(6):
        x = -0.34 + i * 0.136
        box(uid('pk'), (0.07, 0.022, 0.32), (x, -0.012, 0.18), white, bev=0.008)
        obox(uid('tip'), (x, -0.012, 0.34), ((0.7071, 0, 0.7071), (0, 1, 0), (-0.7071, 0, 0.7071)), (0.05, 0.022, 0.05), white, bev=0.006)
    for x in (-0.3, 0.12, 0.35):
        ball(uid('tuft'), 0.04, (x, -0.06, 0.01), m['leaf'], scale=(1.4, 1, 0.6), segs=8)
    finish('picket_fence', tex=512)


def bird_house():
    m = std()
    blue = pm('bh_blue', '#3a82c8', '#4a92d8', scale=6, kind='wave', stretch=(1, 1, 8))
    cyl(uid('post'), 0.03, 0.8, (0, 0, 0.4), m['wood_dark'], verts=10)
    box(uid('plat'), (0.24, 0.24, 0.02), (0, 0, 0.8), m['wood'], bev=0.006)
    box(uid('body'), (0.2, 0.18, 0.18), (0, 0, 0.9), blue, bev=0.01)
    profile_roof(uid('r'), 0.2, 0.99, [(0.09, 0.0), (0.0, 0.1)], 0.04, shingles('bhr', '#c0302a', spread=0.08), m['roofbase'],
                 trim=m['trim'], sw=0.06, rows_per_m=40, attic=blue, seed=2)
    cyl(uid('hole'), 0.035, 0.01, (0, -0.092, 0.92), pm('hole', '#2a1a10'), verts=16, rot=(R90, 0, 0), bev=0)
    torus(uid('ring'), 0.037, 0.006, (0, -0.094, 0.92), m['trim'], rot=(R90, 0, 0), segs=16, rsegs=4)
    cyl(uid('perch'), 0.006, 0.06, (0, -0.12, 0.86), m['wood_dark'], verts=6, rot=(R90, 0, 0), bev=0)
    for z in (0.3, 0.55):
        ball(uid('vine'), 0.05, (0.02, -0.02, z), m['leaf'], scale=(0.9, 0.9, 1.2), segs=10)
    finish('bird_house', tex=512)


def pumpkin(x, y, z, s, mat, stem, rot=0.0):
    for k in range(8):
        a = rot + k * math.pi / 4
        ball(uid('rib'), s * 0.62, (x + math.cos(a) * s * 0.36, y + math.sin(a) * s * 0.36, z + s * 0.55), mat,
             scale=(0.8, 0.8, 0.95), segs=12)
    cyl(uid('stem'), s * 0.09, s * 0.35, (x, y, z + s * 1.12), stem, verts=6, r2=s * 0.06)


def pumpkin_pile():
    m = std()
    orange = pm('pumpkin', '#e8741a', '#f48a2a', scale=12)
    pale = pm('pumpkin2', '#e8b848', '#f0c858', scale=12)
    stem = pm('pstem', '#5a6a22')
    for x, y, z, s, mt in ((-0.12, 0.08, 0, 0.16, orange), (0.15, 0.12, 0, 0.13, orange), (0.02, -0.16, 0, 0.12, pale),
                           (0.0, 0.05, 0.14, 0.11, orange), (0.24, -0.14, 0, 0.09, orange)):
        pumpkin(x, y, z, s, mt, stem, rot=x * 3)
    for i in range(5):
        a = i * 1.3
        ball(uid('leaf'), 0.06, (math.cos(a) * 0.3, math.sin(a) * 0.28, 0.01), m['leaf'], scale=(1.4, 1, 0.3), segs=8)
    crate(-0.3, -0.25, 0, 0.24, m, fill=[orange], rot=0.3, fill_r=0.045)
    finish('pumpkin_pile', tex=512)


def birdbath():
    m = std()
    stone = pm('bb_stone', '#bdb6a8', '#d4ccbe', scale=20)
    cyl(uid('base'), 0.18, 0.06, (0, 0, 0.03), stone, verts=20, r2=0.14)
    cyl(uid('ped'), 0.07, 0.42, (0, 0, 0.27), stone, verts=16, r2=0.05)
    for z in (0.1, 0.44):
        torus(uid('band'), 0.07, 0.015, (0, 0, z), stone, segs=18, rsegs=5)
    # the bowl stays open at the top; the game fills it with water
    cyl(uid('bowl'), 0.1, 0.1, (0, 0, 0.545), stone, verts=24, r2=0.25)
    torus(uid('rim'), 0.25, 0.028, (0, 0, 0.605), stone, segs=28, rsegs=6)
    for i in range(6):
        a = i * 1.05
        ball(uid('ivy'), 0.035, (math.cos(a) * 0.08, math.sin(a) * 0.08, 0.1 + (i % 3) * 0.1), m['leaf'], segs=8)
    finish('birdbath', tex=512)


def topiary():
    m = std()
    pot = pm('terracotta', '#c0643a', '#d27848', scale=20)
    cyl(uid('pot'), 0.12, 0.16, (0, 0, 0.08), pot, verts=20, r2=0.14)
    torus(uid('lip'), 0.14, 0.018, (0, 0, 0.16), pot, segs=22, rsegs=5)
    cyl(uid('soil'), 0.13, 0.01, (0, 0, 0.16), m['soil'], verts=20, bev=0)
    cyl(uid('stem'), 0.02, 0.7, (0, 0, 0.5), m['wood_dark'], verts=8)
    leaves = [pm('tp1', '#2f7a26', '#3f9030', scale=40), pm('tp2', '#3a8a2c'), pm('tp3', '#4a9a34')]
    for i, (z, r) in enumerate(((0.34, 0.14), (0.6, 0.115), (0.82, 0.085))):
        clump(0, 0, z, r, leaves, n=26, seed=i + 1, leaf=0.32, squash=0.95)
    finish('topiary', tex=512)


def well():
    m = std()
    rnd = random.Random(5)
    cyl(uid('core'), 0.29, 0.33, (0, 0, 0.165), m['mortar'], verts=24)
    for row in range(3):
        n = 12
        for i in range(n):
            a = (i + (0.5 if row % 2 else 0)) * math.pi * 2 / n
            obox(uid('st'), (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.055 + row * 0.11),
                 ((-math.sin(a), math.cos(a), 0), (math.cos(a), math.sin(a), 0), (0, 0, 1)), (0.15, 0.07, 0.095),
                 m['stone'][rnd.randrange(3)], bev=0.018)
    torus(uid('cap'), 0.3, 0.035, (0, 0, 0.345), m['stone'][1], segs=24, rsegs=6)
    cyl(uid('water'), 0.25, 0.01, (0, 0, 0.3), pm('deep', '#123a4a', rough=0.1), verts=24, bev=0)
    for sx in (-1, 1):
        box(uid('pst'), (0.05, 0.05, 0.6), (sx * 0.27, 0, 0.6), m['wood_dark'], bev=0.01)
    profile_roof(uid('r'), 0.6, 0.88, [(0.24, 0.0), (0.0, 0.2)], 0.07, shingles('wr', '#a8321e', spread=0.08), m['roofbase'],
                 trim=m['trim'], sw=0.08, rows_per_m=30, attic=m['wood_dark'], seed=3)
    cyl(uid('axle'), 0.03, 0.6, (0, 0, 0.72), m['wood'], verts=12, rot=(0, R90, 0))
    box(uid('crank'), (0.02, 0.02, 0.12), (0.32, 0, 0.67), m['iron'], bev=0)
    cyl(uid('handle'), 0.012, 0.08, (0.35, 0, 0.61), m['wood_dark'], verts=6, rot=(0, R90, 0), bev=0)
    torus(uid('coil'), 0.035, 0.008, (0, 0, 0.72), m['rope'], rot=(0, R90, 0), segs=14, rsegs=4)
    cyl(uid('rope'), 0.005, 0.2, (0, 0, 0.6), m['rope'], verts=5, bev=0)
    cyl(uid('bucket'), 0.055, 0.09, (0, 0, 0.46), m['wood'], verts=14, r2=0.065)
    torus(uid('bband'), 0.062, 0.006, (0, 0, 0.47), m['iron'], segs=16, rsegs=4)
    finish('well', tex=1024)


def flower_arch():
    m = std()
    white = pm('arch_white', '#f4f1ea', rough=0.6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('post'), (0.04, 0.04, 1.0), (sx * 0.38, sy * 0.1, 0.5), white, bev=0.008)
        for k in range(5):
            box(uid('lat'), (0.02, 0.2, 0.02), (sx * 0.38, 0, 0.12 + k * 0.2), white, bev=0)
    for sy in (-1, 1):
        torus(uid('arc'), 0.38, 0.02, (0, sy * 0.1, 1.0), white, rot=(R90, 0, 0), segs=32, rsegs=6)
    for k in range(9):
        a = k * math.pi / 8
        box(uid('slat'), (0.02, 0.22, 0.02), (math.cos(a) * 0.38, 0, 1.0 + math.sin(a) * 0.38), white, bev=0)
    leaves = [pm('av1', '#2f7a26'), pm('av2', '#3f9030')]
    roses = [pm('rose1', '#d8203a'), pm('rose2', '#f04a6a'), pm('rose3', '#fbe0e8')]
    rnd = random.Random(8)
    for i in range(26):
        a = i / 25 * math.pi
        p = (math.cos(a) * 0.38, rnd.uniform(-0.12, 0.12), 1.0 + math.sin(a) * 0.38)
        ball(uid('al'), 0.06, p, leaves[i % 2], scale=(1, 1, 0.85), segs=10)
        if i % 2 == 0:
            ball(uid('ar'), 0.035, (p[0], p[1] - 0.07, p[2] + 0.02), roses[i % 3], segs=10)
    for sx in (-1, 1):
        for k in range(7):
            p = (sx * 0.38 + rnd.uniform(-0.04, 0.04), rnd.uniform(-0.1, 0.1), 0.1 + k * 0.14)
            ball(uid('al'), 0.055, p, leaves[k % 2], scale=(1, 1, 0.9), segs=10)
            if k % 2:
                ball(uid('ar'), 0.032, (p[0], p[1] - 0.07, p[2] + 0.02), roses[k % 3], segs=10)
    finish('flower_arch', tex=1024)


def wheel(x, y, z, r, m, spokes=8, rim=None, axis='x'):
    rot = (0, R90, 0) if axis == 'x' else (R90, 0, 0)
    torus(uid('rim'), r, r * 0.1, (x, y, z), rim or m['wood_dark'], rot=rot, segs=28, rsegs=6)
    cyl(uid('hub'), r * 0.18, r * 0.3, (x, y, z), m['iron'], verts=12, rot=rot)
    for k in range(spokes):
        a = k * math.pi * 2 / spokes
        d = (0, math.cos(a), math.sin(a)) if axis == 'x' else (math.cos(a), 0, math.sin(a))
        c = (x + d[0] * r * 0.5, y + d[1] * r * 0.5, z + d[2] * r * 0.5)
        n = (1, 0, 0) if axis == 'x' else (0, 1, 0)
        perp = (n[1] * d[2] - n[2] * d[1], n[2] * d[0] - n[0] * d[2], n[0] * d[1] - n[1] * d[0])
        obox(uid('spk'), c, (d, perp, n), (r * 0.95, r * 0.08, r * 0.08), m['wood'], bev=0)


def hay_wagon():
    m = std()
    red = pm('wagon_red', '#b8302a', '#c8402e', scale=6, kind='wave', stretch=(1, 8, 1))
    box(uid('bed'), (1.4, 0.62, 0.06), (0.05, 0, 0.34), m['wood'], bev=0.01)
    for sy in (-1, 1):
        box(uid('side'), (1.4, 0.03, 0.16), (0.05, sy * 0.31, 0.45), red, bev=0.008)
        for k in range(6):
            box(uid('stake'), (0.03, 0.04, 0.2), (-0.6 + k * 0.26, sy * 0.33, 0.44), m['wood_dark'], bev=0.004)
    for sx in (-1, 1):
        box(uid('end'), (0.03, 0.62, 0.16), (0.05 + sx * 0.7, 0, 0.45), red, bev=0.008)
    box(uid('axl'), (0.05, 0.7, 0.05), (-0.45, 0, 0.2), m['iron'], bev=0)
    box(uid('axl'), (0.05, 0.7, 0.05), (0.55, 0, 0.2), m['iron'], bev=0)
    for x in (-0.45, 0.55):
        for sy in (-1, 1):
            wheel(x, sy * 0.37, 0.2, 0.19, m, axis='y')
    box(uid('tongue'), (0.5, 0.04, 0.04), (-0.9, 0, 0.26), m['wood_dark'], rot=(0, math.radians(-10), 0), bev=0.006)
    box(uid('tbar'), (0.04, 0.3, 0.04), (-1.1, 0, 0.3), m['wood_dark'], bev=0.006)
    rnd = random.Random(4)
    for i in range(16):
        ball(uid('hay'), rnd.uniform(0.14, 0.2), (rnd.uniform(-0.5, 0.6), rnd.uniform(-0.18, 0.18), 0.52 + rnd.uniform(0, 0.14)),
             m['hay'], scale=(1.3, 1, 0.7), segs=12)
    cyl(uid('fork'), 0.012, 0.8, (0.45, 0.05, 0.8), m['wood'], verts=6, rot=(0, math.radians(-35), 0.3), bev=0)
    finish('hay_wagon', tex=1024)


def tractor():
    m = std()
    red = pm('tr_red', '#c8201e', '#d8302a', scale=8, rough=0.35, metal=0.2)
    tire = pm('tire', '#262626', rough=0.9)
    hub = pm('tr_hub', '#f2c83a', rough=0.4)
    chrome = pm('chrome', '#c8ccd0', rough=0.25, metal=0.7)
    # rear wheels with chunky treads, front wheels
    for x0, y0, r, w in ((-0.4, 0.34, 0.3, 0.16), (0.4, 0.34, 0.3, 0.16), (-0.33, -0.44, 0.17, 0.1), (0.33, -0.44, 0.17, 0.1)):
        cyl(uid('tire'), r, w, (x0, y0, r), tire, verts=28, rot=(0, R90, 0), bev=0.02)
        cyl(uid('hub'), r * 0.58, w + 0.01, (x0, y0, r), hub, verts=20, rot=(0, R90, 0))
        cyl(uid('cap'), r * 0.2, w + 0.03, (x0, y0, r), red, verts=12, rot=(0, R90, 0))
        n = 14 if r > 0.2 else 10
        for k in range(n):
            a = k * math.pi * 2 / n
            obox(uid('tread'), (x0, y0 + math.cos(a) * r, r + math.sin(a) * r),
                 ((1, 0, 0), (0, -math.sin(a), math.cos(a)), (0, math.cos(a), math.sin(a))), (w + 0.01, 0.05, 0.035), tire, bev=0.006)
    # chassis, hood with a grille and lights, fenders, cab, seat and exhaust
    box(uid('chassis'), (0.34, 1.0, 0.12), (0, -0.08, 0.3), m['iron'], bev=0.01)
    box(uid('hood'), (0.42, 0.62, 0.3), (0, -0.3, 0.5), red, bev=0.05)
    box(uid('grille'), (0.34, 0.03, 0.24), (0, -0.62, 0.48), chrome, bev=0.01)
    for k in range(5):
        box(uid('gb'), (0.3, 0.035, 0.012), (0, -0.635, 0.4 + k * 0.04), m['iron'], bev=0)
    for sx in (-1, 1):
        cyl(uid('light'), 0.035, 0.03, (sx * 0.15, -0.64, 0.6), m['lamp'], verts=12, rot=(R90, 0, 0), bev=0)
        box(uid('fender'), (0.2, 0.46, 0.04), (sx * 0.4, 0.34, 0.66), red, bev=0.015)
        box(uid('fend2'), (0.2, 0.04, 0.2), (sx * 0.4, 0.1, 0.56), red, bev=0.01)
        box(uid('step'), (0.1, 0.12, 0.02), (sx * 0.26, 0.05, 0.3), m['iron'], bev=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('cpost'), (0.035, 0.035, 0.48), (sx * 0.26, 0.34 + sy * 0.2, 0.9), m['iron'], bev=0.006)
    box(uid('croof'), (0.62, 0.56, 0.05), (0, 0.34, 1.16), red, bev=0.02)
    box(uid('cglass'), (0.5, 0.01, 0.3), (0, 0.14, 0.9), m['glass'], bev=0)
    box(uid('seat'), (0.2, 0.18, 0.05), (0, 0.4, 0.72), pm('seat', '#2a2a2a'), bev=0.02)
    box(uid('back'), (0.2, 0.04, 0.16), (0, 0.49, 0.8), pm('seat', '#2a2a2a'), bev=0.02)
    cyl(uid('col'), 0.015, 0.2, (0, 0.2, 0.74), m['iron'], verts=8, rot=(math.radians(-30), 0, 0))
    torus(uid('sw'), 0.07, 0.012, (0, 0.16, 0.84), m['iron'], rot=(math.radians(-30), 0, 0), segs=16, rsegs=5)
    cyl(uid('exh'), 0.03, 0.46, (0.14, -0.2, 0.86), chrome, verts=10)
    cyl(uid('exhc'), 0.035, 0.04, (0.14, -0.2, 1.1), m['iron'], verts=10)
    marker('smoke', (0.14, -0.2, 1.16))
    finish('tractor', tex=1024, glow=('lamp',))


def bench():
    m = std()
    iron = pm('bench_iron', '#2f4a3a', rough=0.45, metal=0.4)
    for k in range(3):
        box(uid('seat'), (0.76, 0.08, 0.03), (0, -0.09 + k * 0.09, 0.22), m['wood'], bev=0.008)
    for k in range(2):
        box(uid('back'), (0.76, 0.03, 0.07), (0, 0.13, 0.32 + k * 0.1), m['wood'], rot=(math.radians(-10), 0, 0), bev=0.008)
    for sx in (-1, 1):
        x = sx * 0.33
        box(uid('leg'), (0.035, 0.035, 0.22), (x, -0.1, 0.11), iron, bev=0.006)
        box(uid('leg'), (0.035, 0.035, 0.44), (x, 0.13, 0.22), iron, rot=(math.radians(-10), 0, 0), bev=0.006)
        box(uid('rail'), (0.035, 0.26, 0.03), (x, 0.01, 0.2), iron, bev=0.006)
        box(uid('arm'), (0.05, 0.26, 0.03), (x, 0.0, 0.34), iron, bev=0.008)
        torus(uid('scroll'), 0.04, 0.01, (x, -0.1, 0.3), iron, rot=(0, R90, 0), segs=14, rsegs=4)
    finish('bench', tex=512)


def lamp():
    m = std()
    iron = pm('lamp_iron', '#2c2c30', rough=0.4, metal=0.5)
    cyl(uid('base'), 0.09, 0.08, (0, 0, 0.04), iron, verts=12, r2=0.06)
    cyl(uid('post'), 0.03, 1.02, (0, 0, 0.55), iron, verts=10)
    for z in (0.12, 0.9):
        torus(uid('ring'), 0.035, 0.012, (0, 0, z), iron, segs=12, rsegs=4)
    box(uid('glass'), (0.12, 0.12, 0.16), (0, 0, 1.16), m['lamp'], bev=0.01)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('frame'), (0.02, 0.02, 0.17), (sx * 0.065, sy * 0.065, 1.16), iron, bev=0)
    box(uid('floor'), (0.16, 0.16, 0.03), (0, 0, 1.07), iron, bev=0.006)
    cyl(uid('roof'), 0.13, 0.1, (0, 0, 1.29), iron, verts=4, r2=0.0, rot=(0, 0, math.radians(45)), bev=0)
    ball(uid('fin'), 0.025, (0, 0, 1.36), iron, segs=8)
    glow(0, 0, 2.2)
    finish('lamp', tex=512, glow=('lamp',))


def scarecrow():
    m = std()
    plaid = pm('plaid', '#c8302a', '#a82420', scale=14, kind='wave', stretch=(1, 1, 1))
    denim = pm('sc_denim', '#3a5a8a')
    sackm = pm('burlap', '#d8b880', '#e8ca94', scale=40)
    cyl(uid('post'), 0.03, 1.0, (0, 0.03, 0.5), m['wood_dark'], verts=8)
    box(uid('bar'), (0.62, 0.04, 0.04), (0, 0.03, 0.74), m['wood_dark'], bev=0.006)
    box(uid('shirt'), (0.28, 0.14, 0.3), (0, 0, 0.62), plaid, bev=0.04)
    for sx in (-1, 1):
        cyl(uid('sleeve'), 0.05, 0.22, (sx * 0.24, 0, 0.74), plaid, verts=12, rot=(0, R90, 0))
        for k in range(4):
            box(uid('straw'), (0.07, 0.01, 0.01), (sx * 0.38, (k - 1.5) * 0.02, 0.74 + (k % 2) * 0.02), m['hay'],
                rot=(0, 0, (k - 1.5) * 0.3), bev=0)
    box(uid('pants'), (0.26, 0.13, 0.12), (0, 0, 0.43), denim, bev=0.03)
    box(uid('patch'), (0.06, 0.01, 0.06), (0.06, -0.075, 0.62), pm('patch', '#f0c020'), bev=0)
    for k in range(5):
        box(uid('straw'), (0.01, 0.01, 0.08), (-0.08 + k * 0.04, 0, 0.35), m['hay'], rot=(0, (k - 2) * 0.2, 0), bev=0)
    ball(uid('head'), 0.1, (0, 0, 0.9), sackm, segs=14)
    for sx in (-1, 1):
        box(uid('eye'), (0.025, 0.01, 0.025), (sx * 0.035, -0.095, 0.92), pm('stitch', '#3a2616'), rot=(0, math.radians(45), 0), bev=0)
    box(uid('mouth'), (0.08, 0.01, 0.01), (0, -0.097, 0.86), pm('stitch', '#3a2616'), bev=0)
    ball(uid('nose'), 0.018, (0, -0.1, 0.89), pm('carrot', '#e8701a'), scale=(1, 1.6, 1), segs=8)
    hat = pm('sc_hat', '#b8923a', '#c8a24a', scale=40)
    cyl(uid('brim'), 0.17, 0.02, (0, 0, 0.98), hat, verts=20)
    cyl(uid('crown'), 0.09, 0.14, (0, 0, 1.06), hat, verts=16, r2=0.06)
    cyl(uid('band'), 0.083, 0.03, (0, 0, 1.01), pm('hat_band', '#8a2a1e'), verts=16, bev=0)
    crow = pm('crow', '#1e1e24')
    ball(uid('crow'), 0.04, (0.26, 0.03, 0.8), crow, scale=(1.3, 0.9, 1), segs=10)
    ball(uid('crowh'), 0.025, (0.3, 0.03, 0.84), crow, segs=8)
    ball(uid('beak'), 0.012, (0.33, 0.03, 0.84), pm('beak', '#f0b020'), scale=(1.6, 1, 0.8), segs=6)
    finish('scarecrow', tex=512)


def windmill():
    m = std()
    white = pm('wm_white', '#ece2cc', '#f6eed8', scale=18)
    cyl(uid('tower'), 0.55, 2.0, (0, 0, 1.0), white, verts=24, r2=0.36)
    for z in (0.02, 1.0, 1.96):
        r = 0.55 - 0.19 * z / 2.0
        torus(uid('band'), r + 0.01, 0.025, (0, 0, z), m['wood_dark'], segs=28, rsegs=6)
    # stone foot and a door, little windows up the tower
    cyl(uid('foot'), 0.6, 0.12, (0, 0, 0.06), m['stone'][0], verts=24)
    box(uid('door'), (0.24, 0.06, 0.42), (0, -0.53, 0.33), m['wood_dark'], bev=0.02)
    ball(uid('arch'), 0.12, (0, -0.52, 0.54), m['wood_dark'], scale=(1, 0.3, 0.6), segs=12)
    for z, a in ((0.95, -0.9), (1.45, 0.9), (0.9, 2.3)):
        r = 0.55 - 0.19 * z / 2.0
        c = (math.sin(a) * r, -math.cos(a) * r, z)
        obox(uid('win'), c, ((math.cos(a), math.sin(a), 0), (0, 0, 1), (math.sin(a), -math.cos(a), 0)), (0.14, 0.18, 0.04), m['glass'], bev=0.01)
        obox(uid('winf'), c, ((math.cos(a), math.sin(a), 0), (0, 0, 1), (math.sin(a), -math.cos(a), 0)), (0.18, 0.22, 0.03), m['trim'], bev=0.01)
    cyl(uid('cap'), 0.44, 0.5, (0, 0, 2.24), pm('wm_roof', '#9a3526', '#b04030', scale=30), verts=24, r2=0.04)
    ball(uid('fin'), 0.05, (0, 0, 2.5), m['brass'], segs=10)
    cyl(uid('shaft'), 0.05, 0.3, (0, -0.42, 1.75), m['wood_dark'], verts=10, rot=(R90, 0, 0))
    sail = pm('wm_sail', '#f6eedc', '#fffaf0', scale=20)
    frame = pm('wm_frame', '#8a4a26')
    with anim_group('spinZ_sails', (0, -0.58, 1.75)):
        cyl(uid('hub'), 0.08, 0.1, (0, -0.58, 1.75), m['wood_dark'], verts=14, rot=(R90, 0, 0))
        for k in range(4):
            a = math.radians(20 + k * 90)
            d = (math.cos(a), 0, math.sin(a))
            perp = (-math.sin(a), 0, math.cos(a))
            p = lambda r: (d[0] * r, -0.62, 1.75 + d[2] * r)  # noqa: E731
            obox(uid('arm'), p(0.45), (d, (0, 1, 0), perp), (0.9, 0.04, 0.05), frame, bev=0.008)
            q = p(0.55)
            obox(uid('sail'), (q[0] + perp[0] * 0.12, -0.64, q[2] + perp[2] * 0.12), (d, (0, 1, 0), perp), (0.62, 0.012, 0.2), sail, bev=0.004)
            for j in range(6):
                s = p(0.26 + j * 0.11)
                obox(uid('lat'), (s[0] + perp[0] * 0.12, -0.655, s[2] + perp[2] * 0.12), (perp, (0, 1, 0), d), (0.22, 0.012, 0.018), frame, bev=0)
    for x, y in ((0.7, -0.5), (-0.7, -0.45), (0.6, 0.6)):
        clump(x, y, 0.1, 0.12, [m['leaf'], pm('wm_l2', '#3f9030')], n=14, seed=int(x * 10 + 20), leaf=0.35)
    finish('windmill', tex=1024, glow=('glass',))


def pond():
    m = std()
    sand = pm('pond_sand', '#d8c088', '#e8d098', scale=30)
    # a sandy bed under the game's water, a ring of stones, reeds and lily pads
    cyl(uid('bed'), 0.97, 0.03, (0, 0, 0.015), sand, verts=40)
    rnd = random.Random(6)
    for i in range(22):
        a = i * math.pi * 2 / 22 + rnd.uniform(-0.05, 0.05)
        r = rnd.uniform(0.84, 0.9)
        rock(uid('rk'), rnd.uniform(0.07, 0.1), (math.cos(a) * r, math.sin(a) * r, 0.04), m['stone'][i % 3], seed=i, squash=0.6)
    pad = pm('lily', '#3a9a3a', '#4aaa42', scale=20)
    for x, y, r in ((-0.4, -0.2, 0.1), (0.3, 0.3, 0.09), (0.4, -0.3, 0.08), (-0.1, 0.45, 0.07)):
        cyl(uid('pad'), r, 0.01, (x, y, 0.065), pad, verts=16, bev=0)
    for k in range(6):
        a = k * 1.05
        ball(uid('petal'), 0.025, (0.3 + math.cos(a) * 0.022, 0.3 + math.sin(a) * 0.022, 0.08), pm('lotus', '#f06a9a'), scale=(1.4, 0.8, 0.6), segs=8)
    ball(uid('lotusc'), 0.015, (0.3, 0.3, 0.09), pm('lotusc', '#f0c020'), segs=8)
    reed = pm('reed', '#5a8a2a')
    cat = pm('cattail', '#6a3a1e')
    for i in range(9):
        x, y = 0.72 + rnd.uniform(-0.1, 0.1), rnd.uniform(0.0, 0.45)
        h = rnd.uniform(0.3, 0.45)
        cyl(uid('reed'), 0.01, h, (x, y, h / 2), reed, verts=5, rot=(rnd.uniform(-0.1, 0.1), rnd.uniform(-0.1, 0.1), 0), bev=0)
        if i % 2 == 0:
            cyl(uid('cat'), 0.022, 0.08, (x, y, h - 0.02), cat, verts=8)
    for i in range(5):
        a = 3.6 + i * 0.25
        clump(math.cos(a) * 0.95, math.sin(a) * 0.95, 0.05, 0.1, [m['leaf'], pm('pl2', '#3f9030')], n=10, seed=40 + i, leaf=0.4)
    finish('pond', tex=1024)


def mailbox():
    m = std()
    blue = pm('mb_blue', '#2e6aa8', rough=0.4, metal=0.3)
    red = pm('mb_red', '#d8302a')
    box(uid('post'), (0.05, 0.05, 0.56), (0, 0, 0.28), m['wood_dark'], bev=0.008)
    box(uid('arm'), (0.08, 0.24, 0.04), (0, -0.02, 0.56), m['wood_dark'], bev=0.008)
    box(uid('box'), (0.16, 0.3, 0.1), (0, -0.04, 0.63), blue, bev=0.01)
    cyl(uid('top'), 0.08, 0.3, (0, -0.04, 0.68), blue, verts=16, rot=(R90, 0, 0))
    box(uid('door'), (0.16, 0.01, 0.16), (0, -0.195, 0.65), pm('mb_door', '#2a5a90'), bev=0.004)
    cyl(uid('knob'), 0.012, 0.02, (0, -0.205, 0.66), m['brass'], verts=8, rot=(R90, 0, 0), bev=0)
    box(uid('flag'), (0.01, 0.02, 0.16), (0.09, 0.02, 0.7), red, bev=0)
    box(uid('flag2'), (0.01, 0.08, 0.05), (0.09, -0.01, 0.77), red, bev=0)
    for x, y in ((-0.12, -0.1), (0.1, 0.12)):
        clump(x, y, 0.04, 0.06, [m['leaf']], n=8, seed=int(x * 100), leaf=0.4)
    finish('mailbox', tex=512)


def gazebo():
    m = std()
    white = pm('gz_white', '#f6f2ea', rough=0.6)
    roof = pm('gz_roof', '#3f7a5a', '#4a8a66', scale=30)
    cyl(uid('base'), 0.9, 0.1, (0, 0, 0.05), m['stone'][1], verts=8, rot=(0, 0, math.radians(22.5)))
    cyl(uid('floor'), 0.84, 0.03, (0, 0, 0.115), m['wood'], verts=8, rot=(0, 0, math.radians(22.5)))
    box(uid('step'), (0.5, 0.2, 0.05), (0, -0.92, 0.025), m['stone'][0], bev=0.01)
    pts = []
    for i in range(8):
        a = i * math.pi / 4 + math.pi / 8
        pts.append((math.cos(a) * 0.76, math.sin(a) * 0.76))
    for x, y in pts:
        cyl(uid('col'), 0.035, 0.92, (x, y, 0.59), white, verts=10)
        box(uid('colb'), (0.08, 0.08, 0.04), (x, y, 0.15), white, bev=0.008)
    # railings on every side but the front entrance
    for i in range(8):
        (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % 8]
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        if my < -0.6:
            continue
        ln = math.hypot(x1 - x0, y1 - y0)
        d = ((x1 - x0) / ln, (y1 - y0) / ln, 0)
        for z in (0.2, 0.42):
            obox(uid('rail'), (mx, my, z), (d, (-d[1], d[0], 0), (0, 0, 1)), (ln, 0.025, 0.025), white, bev=0.004)
        for k in range(4):
            t = (k + 0.5) / 4 - 0.5
            obox(uid('bal'), (mx + d[0] * t * ln, my + d[1] * t * ln, 0.31), (d, (-d[1], d[0], 0), (0, 0, 1)), (0.018, 0.018, 0.22), white, bev=0)
    torus(uid('beam'), 0.8, 0.035, (0, 0, 1.06), white, segs=8, rsegs=4)
    cyl(uid('roof'), 1.02, 0.6, (0, 0, 1.36), roof, verts=8, r2=0.02, rot=(0, 0, math.radians(22.5)))
    cyl(uid('eave'), 1.03, 0.04, (0, 0, 1.07), white, verts=8, rot=(0, 0, math.radians(22.5)), bev=0)
    cyl(uid('fin'), 0.03, 0.2, (0, 0, 1.72), m['brass'], verts=8)
    ball(uid('finb'), 0.05, (0, 0, 1.84), m['brass'], segs=10)
    cyl(uid('table'), 0.3, 0.03, (0, 0.1, 0.42), m['wood'], verts=16)
    cyl(uid('tleg'), 0.04, 0.28, (0, 0.1, 0.27), m['wood_dark'], verts=8)
    cyl(uid('chain'), 0.006, 0.18, (0, 0, 0.97), m['iron'], verts=5, bev=0)
    box(uid('lamp'), (0.1, 0.1, 0.12), (0, 0, 0.82), m['lamp'], bev=0.01)
    glow(0, 0, 2.0)
    for x, y in ((-0.9, -0.5), (0.9, -0.5)):
        clump(x, y, 0.1, 0.13, [m['leaf'], pm('gz_l2', '#3f9030')], n=14, seed=int(x * 10 + 30), leaf=0.35)
        for k in range(4):
            ball(uid('fl'), 0.025, (x + math.cos(k * 1.6) * 0.1, y - 0.08 + math.sin(k * 1.6) * 0.04, 0.2), pm('gz_f', '#f06a9a'), segs=8)
    finish('gazebo', tex=1024, glow=('lamp',))


def fountain():
    m = std()
    stone = pm('ft_stone', '#c8c0b0', '#dcd4c4', scale=20)
    rnd = random.Random(9)
    # the basin wall is a ring of carved blocks; its floor sits under the game's water
    cyl(uid('floor'), 0.8, 0.12, (0, 0, 0.06), stone, verts=32)
    n = 20
    for i in range(n):
        a = i * math.pi * 2 / n
        obox(uid('blk'), (math.cos(a) * 0.84, math.sin(a) * 0.84, 0.14), ((-math.sin(a), math.cos(a), 0), (math.cos(a), math.sin(a), 0), (0, 0, 1)),
             (0.28, 0.14, 0.28), stone if i % 3 else m['stone'][rnd.randrange(3)], bev=0.02)
    torus(uid('lip'), 0.84, 0.05, (0, 0, 0.29), stone, segs=40, rsegs=6)
    cyl(uid('col'), 0.13, 0.52, (0, 0, 0.44), stone, verts=16, r2=0.09)
    for z in (0.24, 0.66):
        torus(uid('ring'), 0.12, 0.02, (0, 0, z), stone, segs=16, rsegs=5)
    cyl(uid('bowl'), 0.1, 0.12, (0, 0, 0.76), stone, verts=24, r2=0.32)
    torus(uid('brim'), 0.32, 0.03, (0, 0, 0.83), stone, segs=28, rsegs=6)
    cyl(uid('spout'), 0.05, 0.12, (0, 0, 0.88), stone, verts=12, r2=0.03)
    ball(uid('top'), 0.045, (0, 0, 0.96), stone, segs=10)
    for i in range(8):
        a = i * math.pi / 4 + 0.3
        clump(math.cos(a) * 1.0, math.sin(a) * 1.0, 0.06, 0.08, [m['leaf'], pm('ft_l2', '#3f9030')], n=8, seed=60 + i, leaf=0.4)
        ball(uid('fl'), 0.025, (math.cos(a) * 1.0, math.sin(a) * 1.0 - 0.05, 0.14), [pm('ftf1', '#f06a9a'), pm('ftf2', '#f0c020')][i % 2], segs=8)
    finish('fountain', tex=1024)


def rock_obs(v):
    m = std()
    rnd = random.Random(v * 7 + 1)
    moss = pm('moss', '#4a8a2a', '#5a9a32', scale=30)
    grey = [pm('rk1', '#6c7078', '#80848c', scale=16), pm('rk2', '#5e6268', '#72767c', scale=16), pm('rk3', '#7a766e', '#8e8a82', scale=16)]
    big = rock(uid('rock'), 0.3, (rnd.uniform(-0.05, 0.05), rnd.uniform(-0.05, 0.05), 0.12), grey[v % 3], seed=v + 3, squash=0.75)
    big.rotation_euler[2] = rnd.uniform(0, 3)
    for k in range(1 + v % 2 + 1):
        a = rnd.uniform(0, 6.28)
        rock(uid('rock'), rnd.uniform(0.1, 0.16), (math.cos(a) * 0.3, math.sin(a) * 0.28, 0.05), grey[(v + k + 1) % 3], seed=v * 10 + k, squash=0.7)
    for k in range(4):
        a = rnd.uniform(0, 6.28)
        ball(uid('moss'), rnd.uniform(0.05, 0.08), (math.cos(a) * 0.14, math.sin(a) * 0.14, 0.3 + rnd.uniform(-0.04, 0.02)), moss, scale=(1.3, 1, 0.35), segs=8)
    for k in range(6):
        a = rnd.uniform(0, 6.28)
        r = rnd.uniform(0.3, 0.42)
        for j in range(3):
            cyl(uid('grass'), 0.012, 0.1, (math.cos(a) * r + j * 0.015, math.sin(a) * r, 0.05), m['leaf'], verts=4, r2=0.0,
                rot=((j - 1) * 0.3, 0, 0), bev=0, smooth=False)
    if v == 1:
        for k in range(5):
            ball(uid('fl'), 0.02, (0.32 + math.cos(k * 1.25) * 0.02, -0.2 + math.sin(k * 1.25) * 0.02, 0.1), pm('rkf', '#f0f0f0'), segs=6)
        ball(uid('flc'), 0.012, (0.32, -0.2, 0.11), pm('rkfc', '#f0c020'), segs=6)
    finish(f'rock_obs{v}', tex=512)


def bush_obs(v):
    m = std()
    leaves = [pm('bs1', '#2f7a26', '#3a8a2c', scale=40), pm('bs2', '#3f9030'), pm('bs3', '#4a9a34')]
    berry = pm('berry', '#d8303a', rough=0.3)
    rnd = random.Random(v * 13 + 2)
    spots = [(-0.13, 0.02, 0.17, 0.2), (0.14, -0.04, 0.16, 0.19), (0.0, 0.08, 0.28, 0.2)] if v == 0 else \
            [(-0.1, -0.05, 0.16, 0.22), (0.12, 0.08, 0.15, 0.18), (0.02, 0.0, 0.3, 0.17), (0.2, -0.14, 0.1, 0.12)]
    for i, (x, y, z, r) in enumerate(spots):
        clump(x, y, z, r, leaves, n=22, seed=v * 10 + i, leaf=0.34)
    for k in range(9):
        a = rnd.uniform(0, 6.28)
        zf = rnd.uniform(-0.2, 0.8)
        ball(uid('berry'), 0.03, (math.cos(a) * 0.26, math.sin(a) * 0.24 - 0.04, 0.2 + zf * 0.15), berry, segs=8)
    finish(f'bush_obs{v}', tex=512)


MODELS = {'hay_bale': hay_bale, 'picket_fence': picket_fence, 'bird_house': bird_house, 'pumpkin_pile': pumpkin_pile,
          'birdbath': birdbath, 'topiary': topiary, 'well': well, 'flower_arch': flower_arch, 'hay_wagon': hay_wagon,
          'tractor': tractor, 'bench': bench, 'lamp': lamp, 'scarecrow': scarecrow, 'windmill': windmill, 'pond': pond,
          'mailbox': mailbox, 'gazebo': gazebo, 'fountain': fountain,
          'rock_obs0': lambda: rock_obs(0), 'rock_obs1': lambda: rock_obs(1), 'rock_obs2': lambda: rock_obs(2),
          'bush_obs0': lambda: bush_obs(0), 'bush_obs1': lambda: bush_obs(1)}

if __name__ == '__main__':
    main(MODELS)
