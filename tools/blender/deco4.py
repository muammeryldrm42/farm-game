# Third wave decorations, farmyard things: a firewood pile with a chopping block, milk churns on
# a stand, crates of apples, a little tool shed, a patch of sunflowers and an old bicycle with a
# basket of flowers.
# Blender coordinates: z up, the model's front toward -Y (the game's +z), one unit a tile.
# Run: python3 tools/blender/deco4.py [names...]   (see kit.main)
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402,F401
import mathutils  # noqa: E402
from kit import ball, box, clump, cyl, finish, main, pm, prism, std, torus, uid  # noqa: E402
from common import obox  # noqa: E402

R90 = math.radians(90)


def rod(name, a, b, r, material, verts=8):
    """A round bar from a to b: frame tubes, handles, stems."""
    va, vb = mathutils.Vector(a), mathutils.Vector(b)
    d = vb - va
    o = cyl(name, r, d.length, tuple((va + vb) / 2), material, verts=verts, bev=0)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = mathutils.Vector((0, 0, 1)).rotation_difference(d.normalized())
    return o


def tufts(m, pts, seed=1):
    for i, (x, y) in enumerate(pts):
        clump(x, y, 0.04, 0.06, [m['leaf'], pm('d4_l2', '#3f9030')], n=8, seed=seed + i, leaf=0.4)


# ---------------------------------------------------------------- firewood

def firewood_pile():
    """Split logs stacked between two stakes, their pale cut ends to the front, a chopping block
    with an axe in it beside the pile and a few chips on the ground."""
    m = std()
    bark = pm('fw_bark', '#5a3a22', '#6e4a2c', scale=30, kind='wave', stretch=(1, 1, 6))
    end = pm('fw_end', '#d8b07a', '#e8c48e', scale=20)
    rnd = random.Random(3)
    rows = [(5, 0.06), (4, 0.18), (3, 0.3), (2, 0.42)]
    for n, z in rows:
        for i in range(n):
            x = (i - (n - 1) / 2) * 0.125 - 0.12
            r = 0.058 + rnd.uniform(-0.008, 0.008)
            y = rnd.uniform(-0.03, 0.03)
            cyl(uid('log'), r, 0.5, (x, y, z), bark, verts=9, rot=(R90, 0, rnd.uniform(-0.05, 0.05)))
            for sy in (-1, 1):
                cyl(uid('end'), r * 0.9, 0.012, (x, y + sy * 0.251, z), end, verts=9, rot=(R90, 0, 0), bev=0)
    for sx in (-1, 1):
        cyl(uid('stake'), 0.022, 0.62, (-0.12 + sx * 0.36, 0, 0.3), m['wood_dark'], verts=8)
    # the chopping block and its axe
    cyl(uid('block'), 0.11, 0.2, (0.3, -0.18, 0.1), bark, verts=12)
    cyl(uid('blocktop'), 0.1, 0.012, (0.3, -0.18, 0.205), end, verts=12, bev=0)
    rod(uid('haft'), (0.3, -0.2, 0.2), (0.36, -0.36, 0.48), 0.012, m['wood'])
    obox(uid('axe'), (0.295, -0.2, 0.215), ((0, 0.8, -0.6), (1, 0, 0), (0, 0.6, 0.8)), (0.11, 0.012, 0.07), m['metal'], bev=0.004)
    for i in range(7):
        box(uid('chip'), (0.04, 0.02, 0.008), (0.2 + rnd.uniform(0, 0.25), -0.3 + rnd.uniform(0, 0.25), 0.004), end, rot=(0, 0, rnd.uniform(0, 3)), bev=0)
    tufts(m, [(-0.42, -0.3), (0.42, 0.28)], seed=3)
    finish('firewood_pile', tex=512)


# ---------------------------------------------------------------- dairy

def milk_churns():
    """Three steel milk churns on a low wooden stand, the kind left at the lane for the dairy."""
    m = std()
    steel = pm('mc_steel', '#b8c0c6', '#d6dce0', scale=24, rough=0.3, metal=0.75)
    band = pm('mc_band', '#8a9298', rough=0.35, metal=0.7)
    # the stand: a plank top on four legs
    box(uid('top'), (0.8, 0.44, 0.05), (0, 0, 0.2), m['wood'])
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('leg'), (0.06, 0.06, 0.2), (sx * 0.34, sy * 0.17, 0.1), m['wood_dark'])
    for i, (x, y, s) in enumerate([(-0.22, 0.02, 1.0), (0.04, -0.03, 1.08), (0.27, 0.04, 0.92)]):
        z0 = 0.225
        cyl(uid('churn'), 0.1 * s, 0.26 * s, (x, y, z0 + 0.13 * s), steel, verts=18)
        cyl(uid('shoulder'), 0.1 * s, 0.07 * s, (x, y, z0 + 0.295 * s), steel, verts=18, r2=0.05 * s)
        cyl(uid('neck'), 0.05 * s, 0.07 * s, (x, y, z0 + 0.365 * s), steel, verts=16)
        cyl(uid('lid'), 0.062 * s, 0.03 * s, (x, y, z0 + 0.41 * s), steel, verts=16)
        ball(uid('knob'), 0.022 * s, (x, y, z0 + 0.435 * s), band, segs=10)
        for zz in (0.04, 0.22):
            torus(uid('band'), 0.1 * s, 0.008, (x, y, z0 + zz * s), band, segs=24, rsegs=5)
        for sx in (-1, 1):
            torus(uid('handle'), 0.028 * s, 0.006, (x + sx * 0.085 * s, y, z0 + 0.3 * s), band, rot=(R90, 0, 0), segs=12, rsegs=4)
    tufts(m, [(-0.4, -0.26), (0.42, -0.24)], seed=5)
    finish('milk_churns', tex=512)


# ---------------------------------------------------------------- orchard

def crate(x, y, z, rot, wood, fruit, leaf, seed):
    """A slatted wooden crate heaped with apples."""
    rnd = random.Random(seed)
    w, d, h = 0.34, 0.24, 0.16
    ca, sa = math.cos(rot), math.sin(rot)
    def at(px, py, pz):
        return (x + px * ca - py * sa, y + px * sa + py * ca, z + pz)
    box(uid('floor'), (w, d, 0.015), at(0, 0, 0.008), wood, rot=(0, 0, rot), bev=0.003)
    for k in range(3):
        pz = 0.03 + k * 0.05
        for sy in (-1, 1):
            box(uid('slat'), (w, 0.012, 0.035), at(0, sy * (d / 2 - 0.006), pz), wood, rot=(0, 0, rot), bev=0.003)
        for sx in (-1, 1):
            box(uid('slat'), (0.012, d, 0.035), at(sx * (w / 2 - 0.006), 0, pz), wood, rot=(0, 0, rot), bev=0.003)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('corner'), (0.02, 0.02, h), at(sx * (w / 2 - 0.01), sy * (d / 2 - 0.01), h / 2), wood, rot=(0, 0, rot), bev=0.003)
    for i in range(9):
        px, py = (i % 3 - 1) * 0.1 + rnd.uniform(-0.01, 0.01), (i // 3 - 1) * 0.065 + rnd.uniform(-0.01, 0.01)
        ball(uid('apple'), 0.045, at(px, py, h - 0.005 + rnd.uniform(0, 0.02)), fruit, segs=12)
        if i % 3 == 0:
            obox(uid('leaf'), at(px + 0.02, py, h + 0.04), ((1, 0, 0.3), (0, 1, 0), (-0.3, 0, 1)), (0.035, 0.018, 0.004), leaf, bev=0)


def apple_crates():
    """Crates of red and green apples, stacked as they come in from the orchard, with a few
    windfalls on the grass."""
    m = std()
    wood = pm('ac_wood', '#c89a5a', '#dcb070', scale=6, kind='wave', stretch=(1, 8, 1))
    red = pm('ac_red', '#c8281e', '#e04a32', scale=30)
    green = pm('ac_green', '#8cc43a', '#a8d850', scale=30)
    leaf = m['leaf']
    crate(-0.16, 0.08, 0.0, 0.05, wood, red, leaf, 1)
    crate(0.2, 0.1, 0.0, -0.08, wood, green, leaf, 2)
    crate(0.0, 0.1, 0.17, 0.12, wood, red, leaf, 3)
    crate(0.04, -0.22, 0.0, 0.3, wood, red, leaf, 4)
    rnd = random.Random(8)
    for i in range(4):
        ball(uid('windfall'), 0.045, (rnd.uniform(-0.4, 0.4), -0.38 + rnd.uniform(0, 0.08), 0.045), red if i % 2 else green, segs=12)
    tufts(m, [(-0.42, -0.1), (0.42, -0.3)], seed=8)
    finish('apple_crates', tex=512)


# ---------------------------------------------------------------- tool shed

def tool_shed():
    """A small plank tool shed with a shingled roof, a ledged door, a four pane window and a rake
    and spade leaning by the door."""
    m = std()
    plank = pm('ts_plank', '#6f8a5a', '#80a068', scale=6, kind='wave', stretch=(8, 1, 1))
    trim = m['white']
    roof = pm('ts_roof', '#5a3a2a', '#6e4a36', scale=14)
    W, D, H = 0.72, 0.62, 0.62
    box(uid('base'), (W + 0.06, D + 0.06, 0.05), (0, 0.02, 0.025), m['stone'][1])
    box(uid('walls'), (W, D, H), (0, 0.02, 0.05 + H / 2), plank)
    # vertical boards: thin battens down the walls
    for k in range(7):
        x = -W / 2 + 0.06 + k * (W - 0.12) / 6
        box(uid('batten'), (0.012, 0.012, H), (x, 0.02 - D / 2 - 0.004, 0.05 + H / 2), plank, bev=0.002)
    # the gable roof overhanging all round
    top = 0.05 + H
    prism(uid('gable'), [(-D / 2 + 0.02, top), (D / 2 + 0.02, top), (0.02, top + 0.3)], -W / 2, W / 2, plank)
    # two roof slopes from the ridge down past the eaves (rise 0.3 over a half depth of 0.33)
    for sy in (-1, 1):
        u = (0, sy * 0.74, -0.67)
        n = (0, sy * 0.67, 0.74)
        c = (0, 0.02 + sy * 0.18 + n[1] * 0.02, top + 0.14 + n[2] * 0.02)
        obox(uid('roof'), c, ((1, 0, 0), u, n), (W + 0.14, 0.56, 0.03), roof, bev=0.006)
    box(uid('ridge'), (W + 0.16, 0.05, 0.04), (0, 0.02, top + 0.31), m['wood_dark'])
    # the door with its Z brace and a latch
    fy = 0.02 - D / 2 - 0.01
    box(uid('door'), (0.26, 0.02, 0.46), (-0.14, fy, 0.05 + 0.23), m['wood_dark'])
    for dz in (0.1, 0.36):
        box(uid('ledge'), (0.24, 0.014, 0.035), (-0.14, fy - 0.012, 0.05 + dz), m['wood'], bev=0.003)
    obox(uid('brace'), (-0.14, fy - 0.012, 0.05 + 0.23), ((0.49, 0, 0.87), (0, 1, 0), (-0.87, 0, 0.49)), (0.3, 0.014, 0.03), m['wood'], bev=0.003)
    ball(uid('latch'), 0.012, (-0.03, fy - 0.02, 0.05 + 0.24), m['iron'], segs=8)
    # a window with a white frame
    box(uid('win'), (0.2, 0.02, 0.18), (0.2, fy, 0.05 + 0.36), m['glass'])
    box(uid('winfr'), (0.23, 0.016, 0.02), (0.2, fy - 0.01, 0.05 + 0.36), trim, bev=0.002)
    box(uid('winfr2'), (0.02, 0.016, 0.21), (0.2, fy - 0.01, 0.05 + 0.36), trim, bev=0.002)
    for dz in (-0.1, 0.1):
        box(uid('winfr3'), (0.23, 0.016, 0.02), (0.2, fy - 0.01, 0.05 + 0.36 + dz), trim, bev=0.002)
    box(uid('sill'), (0.26, 0.05, 0.02), (0.2, fy - 0.02, 0.05 + 0.26), trim, bev=0.003)
    # garden tools leaning on the wall beside the door
    rod(uid('rake'), (0.02, fy - 0.1, 0.02), (0.05, fy - 0.02, 0.62), 0.01, m['wood'])
    box(uid('rakehead'), (0.12, 0.02, 0.02), (0.02, fy - 0.1, 0.03), m['iron'], bev=0.002)
    rod(uid('spade'), (0.36, fy - 0.1, 0.1), (0.34, fy - 0.02, 0.6), 0.01, m['wood'])
    obox(uid('blade'), (0.36, fy - 0.1, 0.07), ((1, 0, 0), (0, 0.16, 0.99), (0, -0.99, 0.16)), (0.08, 0.11, 0.008), m['metal'], bev=0.003)
    tufts(m, [(-0.44, -0.36), (0.46, 0.34), (0.44, -0.38)], seed=11)
    finish('tool_shed', tex=1024)


# ---------------------------------------------------------------- sunflowers

def sunflower_patch():
    """A bed of tall sunflowers, their heavy heads turned to the sun: a dark seed disc ringed
    with golden petals on a leafy stem."""
    m = std()
    stem = pm('sf_stem', '#4a8a2a', '#5a9a34', scale=20)
    leaf = pm('sf_leaf', '#3f8a26', '#5aa83a', scale=30)
    petal = pm('sf_petal', '#f2b61a', '#ffcc30', scale=30)
    disc = pm('sf_disc', '#4a2a14', '#6a3e1e', scale=60)
    box(uid('bed'), (0.86, 0.66, 0.08), (0, 0, 0.04), m['soil'])
    for sx in (-1, 1):
        box(uid('edge'), (0.9, 0.04, 0.1), (0, sx * 0.35, 0.05), m['wood'], bev=0.004)
        box(uid('edge'), (0.04, 0.7, 0.1), (sx * 0.45, 0, 0.05), m['wood'], bev=0.004)
    rnd = random.Random(21)
    spots = [(-0.28, 0.16), (0.0, 0.2), (0.28, 0.14), (-0.3, -0.12), (-0.04, -0.08), (0.24, -0.14), (0.12, 0.02)]
    for i, (x, y) in enumerate(spots):
        h = rnd.uniform(0.75, 1.0)
        tilt = rnd.uniform(0.25, 0.45)
        top = (x, y - 0.05, h)
        rod(uid('stem'), (x, y, 0.07), top, 0.014, stem)
        for k in range(3):
            z = 0.25 + k * 0.2
            a = rnd.uniform(0, 6.28)
            obox(uid('leaf'), (x + math.cos(a) * 0.07, y + math.sin(a) * 0.07, z), ((math.cos(a), math.sin(a), -0.25), (-math.sin(a), math.cos(a), 0), (0.25, 0, 1)), (0.13, 0.08, 0.006), leaf, bev=0)
        # the head faces forward and a little up
        n = mathutils.Vector((0, -math.cos(tilt), math.sin(tilt)))
        c = mathutils.Vector(top) + n * 0.02
        q = mathutils.Vector((0, 0, 1)).rotation_difference(n)
        o = cyl(uid('disc'), 0.075, 0.03, tuple(c), disc, verts=18)
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = q
        u = q @ mathutils.Vector((1, 0, 0))
        v = q @ mathutils.Vector((0, 1, 0))
        for k in range(16):
            a = k * math.tau / 16
            d = u * math.cos(a) + v * math.sin(a)
            p = c + d * 0.1 - n * 0.004
            obox(uid('petal'), tuple(p), (tuple(d), tuple(n.cross(d)), tuple(n)), (0.06, 0.028, 0.006), petal, bev=0)
    finish('sunflower_patch', tex=1024)


# ---------------------------------------------------------------- bicycle

def wheel(c, r, mat, hub):
    torus(uid('tyre'), r, 0.016, c, mat, rot=(R90, 0, 0), segs=28, rsegs=6)
    torus(uid('rim'), r - 0.018, 0.006, c, hub, rot=(R90, 0, 0), segs=28, rsegs=4)
    for k in range(12):
        a = k * math.pi / 12
        rod(uid('spoke'), (c[0] - math.cos(a) * (r - 0.02), c[1], c[2] - math.sin(a) * (r - 0.02)),
            (c[0] + math.cos(a) * (r - 0.02), c[1], c[2] + math.sin(a) * (r - 0.02)), 0.002, hub, verts=4)
    cyl(uid('hub'), 0.018, 0.04, c, hub, verts=10, rot=(R90, 0, 0))


def flower_bicycle():
    """An old town bicycle in mint green leaning on its stand, a wicker basket of flowers on the
    front and a bell on the handlebar."""
    m = std()
    frame = pm('fb_frame', '#7ac0a8', '#8ccfb6', scale=10, rough=0.4, metal=0.3)
    tyre = pm('fb_tyre', '#2a2624')
    chrome = pm('fb_chrome', '#c8cdd2', rough=0.25, metal=0.8)
    wicker = pm('fb_wicker', '#b8864a', '#d0a060', scale=40, kind='wave')
    saddle = pm('fb_saddle', '#6a3a22')
    r = 0.2
    back, front = (-0.3, 0.0, r + 0.01), (0.32, 0.0, r + 0.01)
    wheel(back, r, tyre, chrome)
    wheel(front, r, tyre, chrome)
    crank = (-0.02, 0.0, 0.2)
    seat = (-0.14, 0.0, 0.5)
    head = (0.22, 0.0, 0.52)
    rod(uid('seat_tube'), crank, seat, 0.016, frame)
    rod(uid('down_tube'), crank, (head[0] - 0.02, 0, head[2] - 0.08), 0.017, frame)
    rod(uid('top_tube'), (seat[0] + 0.02, 0, seat[2] - 0.08), (head[0] - 0.01, 0, head[2] - 0.04), 0.014, frame)
    for sy in (-1, 1):
        rod(uid('stay'), (back[0], sy * 0.03, back[2]), (crank[0], sy * 0.02, crank[2]), 0.01, frame)
        rod(uid('stay'), (back[0], sy * 0.03, back[2]), (seat[0] + 0.01, sy * 0.012, seat[2] - 0.06), 0.009, frame)
        rod(uid('fork'), (front[0], sy * 0.03, front[2]), (head[0], sy * 0.015, head[2] - 0.06), 0.01, chrome)
    rod(uid('stem'), (head[0], 0, head[2] - 0.08), (head[0] - 0.01, 0, head[2] + 0.08), 0.013, chrome)
    rod(uid('bar'), (head[0] - 0.05, -0.2, head[2] + 0.1), (head[0] - 0.05, 0.2, head[2] + 0.1), 0.01, chrome)
    for sy in (-1, 1):
        rod(uid('grip'), (head[0] - 0.05, sy * 0.2, head[2] + 0.1), (head[0] - 0.05, sy * 0.26, head[2] + 0.1), 0.014, saddle)
    ball(uid('bell'), 0.02, (head[0] - 0.04, -0.13, head[2] + 0.12), chrome, segs=10)
    rod(uid('post'), seat, (seat[0] - 0.02, 0, seat[2] + 0.07), 0.01, chrome)
    ball(uid('saddle'), 1, (seat[0] - 0.03, 0, seat[2] + 0.09), saddle, scale=(0.09, 0.05, 0.025), segs=14)
    cyl(uid('chainring'), 0.06, 0.01, (crank[0], -0.03, crank[2]), chrome, verts=16, rot=(R90, 0, 0))
    rod(uid('pedal_arm'), (crank[0], -0.04, crank[2]), (crank[0] + 0.05, -0.05, crank[2] - 0.06), 0.008, chrome)
    box(uid('pedal'), (0.06, 0.03, 0.012), (crank[0] + 0.05, -0.07, crank[2] - 0.06), m['iron'], bev=0.002)
    rod(uid('kick'), (crank[0] - 0.05, 0.02, crank[2]), (crank[0] - 0.12, 0.12, 0.0), 0.008, chrome)
    # the wicker basket on the front, full of flowers
    bc = (front[0] + 0.02, 0.0, head[2] + 0.02)
    cyl(uid('basket'), 0.11, 0.12, bc, wicker, verts=16, r2=0.09)
    rnd = random.Random(4)
    cols = [pm('fb_f1', '#ff7aa8'), pm('fb_f2', '#fff2a0'), pm('fb_f3', '#b890ff'), pm('fb_f4', '#ff9a4a')]
    clump(bc[0], bc[1], bc[2] + 0.07, 0.08, [m['leaf'], pm('fb_l2', '#4a9a34')], n=14, seed=6, leaf=0.35)
    for i in range(10):
        a = rnd.uniform(0, 6.28)
        rr = rnd.uniform(0, 0.08)
        ball(uid('bloom'), 0.024, (bc[0] + math.cos(a) * rr, bc[1] + math.sin(a) * rr, bc[2] + 0.1 + rnd.uniform(0, 0.05)), cols[i % 4], segs=10)
    tufts(m, [(-0.46, -0.3), (0.46, 0.3)], seed=4)
    finish('flower_bicycle', tex=512)


MODELS = {'firewood_pile': firewood_pile, 'milk_churns': milk_churns, 'apple_crates': apple_crates,
          'tool_shed': tool_shed, 'sunflower_patch': sunflower_patch, 'flower_bicycle': flower_bicycle}

if __name__ == '__main__':
    main(MODELS)
