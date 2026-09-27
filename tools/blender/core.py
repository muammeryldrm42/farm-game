# Core farm buildings: barn, silo, order board, roadside stall, boat dock and fishing pier.
# Run: python3 tools/blender/core.py [names...]   (see kit.main)
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import (Face, anim_group, awning, ball, barrel, box, capture, chimney, crate, cyl, door, dormer, finish,  # noqa: E402,F401
                 foundation, hay_bale, lantern, main, marker, milk_can, move_all, place, pm, potted_plant, profile_roof, sack,
                 shingles, sign, std, torus, turn, uid, walls, window)
from common import obox  # noqa: E402


def barn():
    m = std()
    red = pm('barn_red', '#a8261c', '#c23426', scale=6, kind='wave', stretch=(8, 8, 1))
    batten = pm('barn_batten', '#8e1f17', '#a82a20', scale=6, kind='wave', stretch=(8, 8, 1))
    door_red = pm('barn_door', '#7e1c14', '#98261c', scale=6, kind='wave', stretch=(8, 8, 1))
    # built with the ridge along X and the gable end on the +X face, then turned to face front
    L, S, B, H = 1.4, 1.62, 0.1, 0.98   # length (becomes depth), span (becomes front width)
    foundation(L, S, B, m['stone'], m['mortar'])
    walls(L, S, H, B, 'batten', red, m['trim'], extra=batten)
    Z = B + H
    prof = [(S / 2, 0.0), (S / 2 * 0.62, 0.44), (0.0, 0.7)]
    profile_roof('roof', L, Z, prof, 0.13, shingles('bsh', '#55504f', spread=0.08), m['roofbase'], trim=m['trim'],
                 sw=0.13, rows_per_m=13, attic=red, seed=4)
    f = Face('right', L, S)
    door(f, 0, B, 0.68, 0.74, m, door_red, style='double')
    # hayloft door with hay spilling out, and the hoist beam with its pulley and rope
    door(f, 0, Z + 0.08, 0.32, 0.34, m, door_red, style='barn')
    f.box(0, Z + 0.09, 0.07, 0.28, 0.05, 0.1, m['hay'], bev=0.02)
    f.box(0, Z + 0.66, 0.2, 0.06, 0.06, 0.44, m['wood_dark'], bev=0.01)
    cyl(uid('pulley'), 0.035, 0.025, f.p(0, Z + 0.6, 0.38), m['iron'], verts=14, rot=(math.radians(90), 0, 0))
    cyl(uid('ropeh'), 0.006, 0.52, f.p(0, Z + 0.33, 0.39), m['rope'], verts=6)
    # white trim bands along the eaves line
    f.box(0, Z - 0.02, 0.022, S + 0.02, 0.05, 0.03, m['trim'], bev=0.01)
    for s in (-1, 1):
        window(f, s * 0.58, B + 0.56, 0.16, 0.2, m)
    for side in ('front', 'back'):
        sf = Face(side, L, S)
        for u in (-0.34, 0.34):
            window(sf, u, B + 0.58, 0.2, 0.22, m)
    # cupola with louvers, a little roof and a rooster weathervane that swings in the wind
    top = Z + 0.7
    box(uid('cup'), (0.26, 0.26, 0.22), (0, 0, top + 0.08), red, bev=0.012)
    for fn in ('front', 'back', 'left', 'right'):
        cf = Face(fn, 0.26, 0.26)
        for k in range(4):
            cf.box(0, top + 0.02 + k * 0.035, 0.005, 0.16, 0.012, 0.02, m['trim'], bev=0.003)
    cyl(uid('cuproof'), 0.25, 0.14, (0, 0, top + 0.26), shingles('bsh', '#55504f')[1], verts=4, r2=0.02, rot=(0, 0, math.radians(45)))
    cyl(uid('vpole'), 0.008, 0.2, (0, 0, top + 0.42), m['iron'], verts=8)
    with anim_group('swayY_vane', (0, 0, top + 0.5)):
        box(uid('arrow'), (0.012, 0.24, 0.012), (0, 0, top + 0.5), m['iron'], bev=0)
        box(uid('tail'), (0.008, 0.05, 0.06), (0, -0.1, top + 0.52), m['iron'], bev=0)
        ball(uid('rooster'), 0.035, (0, 0.02, top + 0.56), m['iron'], scale=(0.3, 1.2, 1), segs=10)
        ball(uid('rhead'), 0.018, (0, 0.06, top + 0.6), m['iron'], scale=(0.3, 1, 1), segs=8)
    # props by the doors: hay bales, milk cans and a lantern
    x0 = L / 2 + 0.22
    hay_bale(x0, 0.6, 0, 0.22, m, rot=math.radians(90))
    hay_bale(x0 - 0.02, 0.62, 0.2, 0.2, m, rot=math.radians(80))
    hay_bale(x0 + 0.02, 0.36, 0, 0.2, m, rot=math.radians(100))
    for i, y in enumerate((-0.62, -0.5)):
        milk_can(x0 - 0.06 + i * 0.05, y, 0, m)
    lantern(L / 2 + 0.035, 0.44, B + 0.62, m)
    turn(-90)
    finish('barn', tex=2048, glow=('glass', 'glass_hi', 'lamp'))


def silo():
    m = std()
    steel = pm('silo_steel', '#a9b4bd', '#c6cfd6', scale=40, kind='wave', stretch=(1, 1, 30), rough=0.35, metal=0.5)
    band = pm('silo_band', '#7d8790', rough=0.4, metal=0.5)
    dome = pm('silo_dome', '#b8281e', '#d23a2c', scale=10, rough=0.35)
    R, H = 0.34, 1.75
    cyl(uid('base'), R + 0.07, 0.1, (0, 0, 0.05), m['stone'][1], verts=24)
    cyl(uid('body'), R, H, (0, 0, 0.1 + H / 2), steel, verts=32, bev=0)
    for k in range(7):
        torus(uid('band'), R + 0.005, 0.012, (0, 0, 0.18 + k * H / 7), band, segs=32, rsegs=6)
    # vertical seams for the corrugated look
    for i in range(16):
        a = i / 16 * math.tau
        box(uid('seam'), (0.012, 0.012, H - 0.02), (math.cos(a) * R, math.sin(a) * R, 0.1 + H / 2), band, rot=(0, 0, a), bev=0)
    bpy_dome = ball(uid('dome'), R + 0.02, (0, 0, 0.1 + H), dome, scale=(1, 1, 0.75), segs=24)
    bpy_dome.scale = (1, 1, 0.75)
    cyl(uid('vent'), 0.06, 0.08, (0, 0, 0.1 + H + R * 0.78), band, verts=12)
    cyl(uid('ventcap'), 0.09, 0.04, (0, 0, 0.1 + H + R * 0.78 + 0.06), dome, verts=12, r2=0.02)
    # ladder with a safety cage on the front right
    lx, ly = R * math.cos(math.radians(-60)), R * math.sin(math.radians(-60))
    nx, ny = math.cos(math.radians(-60)), math.sin(math.radians(-60))
    tx, ty = -ny, nx
    for s in (-1, 1):
        box(uid('rail'), (0.02, 0.02, H - 0.1), (lx + nx * 0.05 + tx * s * 0.07, ly + ny * 0.05 + ty * s * 0.07, 0.1 + (H - 0.1) / 2), band, bev=0)
    for k in range(13):
        box(uid('rung'), (0.16, 0.014, 0.014), (lx + nx * 0.05, ly + ny * 0.05, 0.2 + k * 0.13), band, rot=(0, 0, math.atan2(ty, tx)), bev=0)
    for k in range(6):
        torus(uid('cage'), 0.1, 0.006, (lx + nx * 0.12, ly + ny * 0.12, 0.7 + k * 0.2), band, segs=16, rsegs=4)
    # a little access door at the bottom
    f = Face('front', 2 * R, 2 * R)
    box(uid('door'), (0.16, 0.03, 0.26), (0, -R - 0.005, 0.25), m['wood_dark'], bev=0.01)
    box(uid('doorf'), (0.2, 0.03, 0.3), (0, -R + 0.005, 0.25), band, bev=0.01)
    finish('silo', tex=1024)


def board():
    m = std()
    frame = m['wood_dark']
    for x in (-0.32, 0.32):
        cyl(uid('post'), 0.035, 1.0, (x, 0, 0.5), frame, verts=10)
    box(uid('panel'), (0.74, 0.05, 0.5), (0, 0, 0.62), m['wood'], bev=0.014)
    box(uid('frame'), (0.8, 0.04, 0.56), (0, 0.01, 0.62), frame, bev=0.012)
    notes = [pm('n1', '#fff6d8'), pm('n2', '#d8ecff'), pm('n3', '#ffe0e6'), pm('n4', '#e0ffd8')]
    pins = [pm('pin1', '#e03a3a'), pm('pin2', '#3a7ae0'), pm('pin3', '#f0c020')]
    for i, (x, z, r) in enumerate([(-0.22, 0.7, 0.05), (0.02, 0.66, -0.06), (0.23, 0.72, 0.08), (-0.15, 0.5, -0.04), (0.16, 0.5, 0.05)]):
        box(uid('note'), (0.16, 0.012, 0.19), (x, -0.032, z), notes[i % 4], rot=(0, r, 0), bev=0.003)
        ball(uid('pin'), 0.012, (x, -0.042, z + 0.08), pins[i % 3], segs=8)
    # a little shingled roof over the board
    profile_roof('roof', 0.86, 0.9, [(0.14, 0.0), (0.0, 0.1)], 0.04, shingles('bdr', '#8a3a22', spread=0.08), m['roofbase'],
                 sw=0.1, rows_per_m=18, attic=frame, seed=2)
    lantern(0.4, -0.02, 0.5, m, post=0.0)
    finish('board', tex=1024, glow=('lamp',))


def stall():
    m = std()
    red = pm('stall_red', '#c0302a')
    cream = pm('stall_cream', '#f6ecd6')
    paint = pm('stall_paint', '#2f7aa8', '#3a8cc0', scale=8, kind='wave', stretch=(1, 8, 1))
    for x in (-0.72, 0.72):
        for y in (-0.72, 0.72):
            cyl(uid('post'), 0.035, 1.3 if y > 0 else 1.1, (x, y, (1.3 if y > 0 else 1.1) / 2), m['wood_dark'], verts=10)
    # the counter: painted boards, a wide plank top and a skirt of crates below
    box(uid('counter'), (1.3, 0.42, 0.42), (0, -0.3, 0.21), paint, bev=0.015)
    for i in range(10):
        box(uid('cb'), (0.012, 0.44, 0.4), (-0.6 + i * 0.133, -0.3, 0.21), pm('stall_paint2', '#276890'), bev=0)
    box(uid('top'), (1.42, 0.54, 0.05), (0, -0.3, 0.445), m['wood'], bev=0.012)
    # striped canopy from the back posts down to the front ones, scalloped front edge
    from kit import Face as _F, awning as _aw
    _aw(_F('front', 2.0, -1.44), 0, 1.33, 1.5, 1.6, red, cream, stripes=8, drop=0.26)
    # produce crates in front and baskets on the ends of the counter
    apple, orange, lettuce = pm('apple', '#c8201c'), pm('orange', '#f08a1a'), pm('lettuce', '#6ab82a')
    crate(-0.45, -0.66, 0, 0.26, m, fill=[apple], rot=0.1)
    crate(-0.12, -0.7, 0, 0.26, m, fill=[orange], rot=-0.05)
    crate(0.42, -0.64, 0, 0.26, m, fill=[lettuce], rot=0.08, fill_r=0.05)
    crate(0.42, -0.64, 0.22, 0.24, m, fill=[apple], rot=-0.1)
    # a chalkboard sign on an easel
    box(uid('chalk'), (0.3, 0.02, 0.24), (0.75, -0.9, 0.36), pm('chalkboard', '#2c3a30'), rot=(math.radians(-12), 0, 0), bev=0.006)
    box(uid('chalkf'), (0.34, 0.015, 0.28), (0.75, -0.89, 0.36), m['wood'], rot=(math.radians(-12), 0, 0), bev=0.006)
    for s in (-1, 1):
        box(uid('easel'), (0.02, 0.02, 0.5), (0.75 + s * 0.13, -0.86, 0.24), m['wood_dark'], rot=(math.radians(-12), 0, 0), bev=0)
    finish('stall', tex=1024)


def deck(m, x0, x1, y0, y1, top, posts_every=0.6):
    """A plank deck standing in the water on posts, planks running across."""
    n = int((y1 - y0) / 0.1)
    for i in range(n):
        y = y0 + (i + 0.5) * (y1 - y0) / n
        box(uid('plank'), (x1 - x0, (y1 - y0) / n * 0.9, 0.05), (0.5 * (x0 + x1), y, top - 0.025), m['wood'] if i % 3 else m['wood_warm'], bev=0.006)
    for x in (x0 + 0.03, x1 - 0.03):
        box(uid('beam'), (0.04, y1 - y0, 0.05), (x, 0.5 * (y0 + y1), top - 0.07), m['wood_dark'], bev=0.006)
        k = int((y1 - y0) / posts_every) + 1
        for j in range(k):
            y = y0 + 0.04 + j * (y1 - y0 - 0.08) / max(1, k - 1)
            cyl(uid('pile'), 0.035, top + 0.18, (x, y, (top + 0.18) / 2 - 0.12), m['wood_dark'], verts=10)
            torus(uid('wrap'), 0.037, 0.008, (x, y, top + 0.02), m['rope'], segs=14, rsegs=5)


def dock():
    m = std()
    deck(m, -0.85, -0.35, -0.92, 0.92, 0.135)
    # bollards with rope, a coil of rope, a stack of crates and a lamp at the end
    for y in (-0.8, 0.0):
        cyl(uid('bol'), 0.04, 0.12, (-0.4, y, 0.2), m['iron'], verts=12)
        cyl(uid('bolc'), 0.055, 0.03, (-0.4, y, 0.27), m['iron'], verts=12)
    torus(uid('coil'), 0.07, 0.02, (-0.7, -0.55, 0.15), m['rope'], segs=18, rsegs=6)
    torus(uid('coil2'), 0.05, 0.02, (-0.7, -0.55, 0.18), m['rope'], segs=16, rsegs=6)
    crate(-0.68, 0.6, 0.135, 0.22, m, rot=0.05)
    crate(-0.66, 0.62, 0.36, 0.2, m, rot=-0.2)
    crate(-0.48, 0.66, 0.135, 0.2, m, rot=0.3)
    barrel(-0.5, 0.35, 0.135, 0.08, 0.2, m)
    lantern(-0.82, -0.85, 0.135, m, post=0.55)
    finish('dock', tex=1024, glow=('lamp',))


def pier():
    m = std()
    deck(m, -0.83, -0.27, -0.95, 0.95, 0.135)
    wall = pm('pier_wall', '#b07a44', '#c88c52', scale=6, kind='wave', stretch=(8, 8, 1))
    roofm = shingles('psh', '#2e6aa8', spread=0.1)
    # a little bait hut at the back of the pier
    with capture() as hut:
        W, D, H = 0.5, 0.44, 0.5
        walls(W, D, H, 0.0, 'batten', wall, m['trim'], extra=pm('pier_batten', '#94602e'))
        profile_roof(uid('hr'), W, H, [(D / 2, 0.0), (0.0, 0.2)], 0.06, roofm, m['roofbase'], trim=m['trim'], sw=0.1,
                     rows_per_m=22, attic=wall, seed=9)
        f = Face('front', W, D)
        door(f, 0.1, 0.0, 0.18, 0.34, m, pm('pier_door', '#2e6aa8'), style='panel')
        sign(f, -0.12, 0.34, 0.16, 0.14, pm('signboard', '#f2e2c0'), m['wood_dark'])
        torus(uid('ring'), 0.07, 0.022, f.p(-0.14, 0.18, 0.04), pm('lifering', '#e8402c'), rot=(math.radians(90), 0, 0), segs=20)
    place(hut, 0, (-0.55, 0.62, 0.135))
    # fishing gear: bucket of fish, a net over the rail, a stool at the end
    cyl(uid('bucket'), 0.07, 0.12, (-0.4, -0.3, 0.195), m['metal'], verts=14, r2=0.08)
    fish = pm('fish', '#8aa8c8', '#b8cce0', scale=20)
    for i in range(3):
        ball(uid('fish'), 0.03, (-0.4 + (i - 1) * 0.03, -0.3, 0.27 + i * 0.01), fish, scale=(1, 2.2, 0.8), segs=10)
    box(uid('stool'), (0.14, 0.14, 0.03), (-0.55, -0.72, 0.28), m['wood'], bev=0.008)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('sl'), (0.02, 0.02, 0.14), (-0.55 + sx * 0.05, -0.72 + sy * 0.05, 0.2), m['wood_dark'], bev=0)
    lantern(-0.3, 0.3, 0.135, m, post=0.5)
    finish('fishing_pier', tex=1024, glow=('glass', 'glass_hi', 'lamp'))


def manor():
    m = std()
    wall = pm('manor_wall', '#ead9b4', '#f6e8c8', scale=30, kind='wave', stretch=(1, 1, 8))
    blue = pm('manor_shutter', '#244f8c', '#2f62a8', scale=10)
    roofm = shingles('msh', '#34507e', spread=0.09)
    W, D, B, H = 2.5, 1.45, 0.12, 2.1
    Z = B + H
    foundation(W, D, B, m['stone'], m['mortar'])
    walls(W, D, H, B, 'clap', wall, m['trim'], rows=24)
    for fn in ('front', 'back', 'left', 'right'):
        Face(fn, W, D).box(0, B + H * 0.5, 0.025, (W if fn in ('front', 'back') else D) + 0.03, 0.06, 0.04, m['trim'], bev=0.012)
    profile_roof('roof', W, Z, [(D / 2, 0.0), (0.0, 0.82)], 0.18, roofm, m['roofbase'], trim=m['trim'], sw=0.14, rows_per_m=12,
                 attic=wall, seed=11)
    # chimneys at both gable ends
    for i, sx in enumerate((-1, 1)):
        chimney(sx * (W / 2 - 0.28), 0.12, Z + 0.2, 1.0, m['brick'], m['stone'][0], m['mortar'], name='smoke' if i == 0 else 'smoke2')
    # two dormers on the front slope, seated into the roof
    for sx in (-0.62, 0.62):
        dm = dormer(m, wall, roofm, m['roofbase'], w=0.34, d=0.5, h=0.36, seed=int(sx * 10 + 20))
        place(dm, 0, (sx, -D / 2 + 0.2, Z + 0.12))
    f = Face('front', W, D)
    flowers = [pm('fa', '#e8305a'), pm('fb', '#f2c10a'), pm('fc', '#ffffff'), pm('fd', '#8a4ae0')]
    for u in (-0.95, -0.55, 0.55, 0.95):
        window(f, u, B + H * 0.25, 0.26, 0.42, m, shutters=blue, flowerbox=abs(u) > 0.9, flowers=flowers)
        window(f, u, B + H * 0.76, 0.26, 0.4, m, shutters=blue)
    for side in ('left', 'right', 'back'):
        sf = Face(side, W, D)
        us = (-0.35, 0.35) if side != 'back' else (-0.8, 0.0, 0.8)
        for u in us:
            window(sf, u, B + H * 0.25, 0.26, 0.42, m, shutters=blue)
            window(sf, u, B + H * 0.76, 0.26, 0.4, m, shutters=blue)
    # front door with a fanlight, balcony door upstairs
    door(f, 0, B, 0.4, 0.7, m, pm('manor_door', '#6a2a1c', '#843626', scale=6, kind='wave', stretch=(8, 1, 1)), style='panel')
    obox(uid('fan'), f.p(0, B + 0.8, 0.03), ((1, 0, 0), (0, 0, 1), (0, -1, 0)), (0.36, 0.1, 0.03), m['glass'], bev=0.02)
    f.box(0, B + H * 0.5 + 0.34, 0.03, 0.34, 0.56, 0.03, m['glass'], bev=0.006)
    f.box(0, B + H * 0.5 + 0.34, 0.02, 0.42, 0.62, 0.03, m['trim'], bev=0.01)
    # portico: four tall columns, a balcony with balusters and a pediment
    py = -D / 2 - 0.42
    box(uid('porch'), (1.2, 0.5, 0.1), (0, -D / 2 - 0.24, 0.05), m['stone'][1], bev=0.02)
    for i in range(3):
        box(uid('step'), (1.0 - i * 0.12, 0.14, 0.05), (0, py - 0.1 - i * 0.12, 0.08 - i * 0.03 - 0.025), m['stone'][i % 3], bev=0.015)
    for sx in (-0.45, -0.15, 0.15, 0.45):
        cyl(uid('col'), 0.05, H - 0.1, (sx, py + 0.1, 0.1 + (H - 0.1) / 2), m['trim'], verts=16)
        box(uid('colb'), (0.13, 0.13, 0.06), (sx, py + 0.1, 0.13), m['trim'], bev=0.012)
        box(uid('colc'), (0.13, 0.13, 0.05), (sx, py + 0.1, H + 0.03), m['trim'], bev=0.012)
    bal_z = B + H * 0.5
    box(uid('balc'), (1.16, 0.56, 0.07), (0, -D / 2 - 0.26, bal_z), pm('balcony', '#e2d8c4'), bev=0.015)
    box(uid('balrail'), (1.12, 0.04, 0.04), (0, py + 0.02, bal_z + 0.26), m['trim'], bev=0.01)
    for i in range(12):
        cyl(uid('bal'), 0.014, 0.22, (-0.52 + i * 0.094, py + 0.02, bal_z + 0.14), m['trim'], verts=8)
    with capture() as ped:
        profile_roof(uid('ped'), 0.62, 0.0, [(0.62, 0.0), (0.0, 0.38)], 0.06, roofm, m['roofbase'], trim=m['trim'], sw=0.12,
                     rows_per_m=14, attic=m['trim'], seed=13, ends=(-1,))
    place(ped, 90, (0, -D / 2 - 0.12, Z - 0.02))
    # lanterns flanking the steps
    for sx in (-1, 1):
        lantern(sx * 0.62, py - 0.25, 0.0, m, post=0.55)
    # hedges and flower beds along the front, stepping stones to the steps
    hedge = pm('hedge', '#2e7a26', '#4a9a34', scale=18)
    for sx in (-1, 1):
        for i in range(3):
            ball(uid('hedge'), 0.16, (sx * (0.82 + i * 0.28), -D / 2 - 0.22, 0.14), hedge, scale=(1.1, 0.8, 0.9), segs=14)
        for i in range(6):
            ball(uid('bloom'), 0.035, (sx * (0.76 + i * 0.12), -D / 2 - 0.46, 0.05), flowers[(i + (sx > 0)) % 4], segs=10)
    for i in range(3):
        cyl(uid('ss'), 0.12, 0.03, ((i % 2 - 0.5) * 0.1, py - 0.5 - i * 0.24, 0.015), m['stone'][1], verts=12, bev=0.008)
    # the dog's kennel in the front right corner
    with capture() as ken:
        kred = pm('kennel', '#b5452c', '#c85a3e', scale=6, kind='wave', stretch=(8, 8, 1))
        box(uid('kb'), (0.34, 0.3, 0.24), (0, 0, 0.12), kred, bev=0.012)
        with capture() as kr:
            profile_roof(uid('kr'), 0.3, 0.24, [(0.17, 0.0), (0.0, 0.14)], 0.04, shingles('ksh', '#5d3a1f'), m['roofbase'],
                         sw=0.08, rows_per_m=28, attic=kred, seed=17)
        place(kr, 90)
        obox(uid('kd'), (0, -0.152, 0.1), ((1, 0, 0), (0, 0, 1), (0, -1, 0)), (0.13, 0.16, 0.01), pm('kdark', '#2a1a10'), bev=0.03)
        cyl(uid('bowl'), 0.06, 0.03, (0.22, -0.12, 0.015), m['metal'], verts=14, r2=0.05)
    place(ken, math.degrees(-0.5), (1.12, -1.5, 0))
    move_all((0, 0.45, 0))
    finish('manor', tex=2048, glow=('glass', 'glass_hi', 'lamp'))


MODELS = {'barn': barn, 'silo': silo, 'board': board, 'stall': stall, 'dock': dock, 'fishing_pier': pier, 'manor': manor}

if __name__ == '__main__':
    main(MODELS)
