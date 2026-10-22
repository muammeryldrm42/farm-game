# Season event prizes, two for each of the year's four events: a jack-o'-lantern and a lantern
# arch (Pumpkin Nights), a festive pine and a gift sleigh (Winter Lights), a blossom tree and a
# butterfly dome (Blossom Days), lawn flamingos and a paddling pool (Sunny Days).
# Blender coordinates: z up, the model's front toward -Y (the game's +z), one unit a tile.
# Run: python3 tools/blender/deco5.py [names...]   (see kit.main)
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402,F401
import mathutils  # noqa: E402
from kit import (ball, bark_mat, box, clump, cyl, finish, glow, lantern, leaf_mats, main, pine, pm, std, torus, uid)  # noqa: E402
from common import obox  # noqa: E402

R90 = math.radians(90)


def rod(name, a, b, r, material, verts=8):
    """A round bar from a to b."""
    va, vb = mathutils.Vector(a), mathutils.Vector(b)
    d = vb - va
    o = cyl(name, r, d.length, tuple((va + vb) / 2), material, verts=verts, bev=0)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = mathutils.Vector((0, 0, 1)).rotation_difference(d.normalized())
    return o


def pumpkin(x, y, z, s, mat, stem, rot=0.0, ribs=8):
    for k in range(ribs):
        a = rot + k * 2 * math.pi / ribs
        ball(uid('rib'), s * 0.62, (x + math.cos(a) * s * 0.36, y + math.sin(a) * s * 0.36, z + s * 0.55), mat,
             scale=(0.8, 0.8, 0.92), segs=14)
    cyl(uid('stem'), s * 0.09, s * 0.35, (x, y, z + s * 1.12), stem, verts=6, r2=s * 0.06)


def carve(name, cx, cy, cz, rx, rz, poly, material, depth):
    """A flat cut-out laid on the front (-Y) of an egg shaped pumpkin (radii rx across, rz up, its
    middle at cx, cy, cz): every corner of the outline `poly` (u across, v up, from the middle)
    sits on the skin, so the plate follows its curve, and it reaches `depth` into the pumpkin."""
    import bmesh
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()

    def skin(u, v, inset):
        k = max(0.04, 1 - (u / rx) ** 2 - (v / rz) ** 2)
        y = -rx * math.sqrt(k)
        n = mathutils.Vector((u / rx ** 2, y / rx ** 2, v / rz ** 2)).normalized()
        return mathutils.Vector((cx + u, cy + y, cz + v)) - n * inset

    front = [bm.verts.new(skin(u, v, -0.01)) for u, v in poly]
    back = [bm.verts.new(skin(u, v, depth)) for u, v in poly]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    k = len(poly)
    for i in range(k):
        j = (i + 1) % k
        bm.faces.new([front[i], back[i], back[j], front[j]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    return o


def face(x, y, z, s, lamp, grin=True):
    """A friendly carved face on the front (-Y) of a pumpkin of size `s` at (x, y, z): triangle
    eyes and nose and a grin with two teeth, the glowing inside showing through."""
    cz, rx, rz = z + s * 0.55, s * 0.86, s * 0.57
    up = s * 0.08  # the face sits a little above the middle
    for sx in (-1, 1):
        ex, ez = sx * s * 0.27, s * 0.12 + up
        carve(uid('eye'), x, y, cz, rx, rz, [(ex - s * 0.14, ez - s * 0.09), (ex + s * 0.14, ez - s * 0.09), (ex, ez + s * 0.15)], lamp, s * 0.1)
    carve(uid('nose'), x, y, cz, rx, rz, [(-s * 0.07, up - s * 0.05), (s * 0.07, up - s * 0.05), (0, up + s * 0.06)], lamp, s * 0.1)
    if grin:
        w = s * 0.5
        top, bot = [], []
        for i in range(13):
            u = -w + 2 * w * i / 12
            t = (u / w) ** 2
            top.append((u, up + s * (-0.14 + 0.13 * t)))
            bot.append((u, up + s * (-0.32 + 0.3 * t)))
        # two square teeth hang from the top edge
        poly = []
        for i, (u, v) in enumerate(top):
            if i in (4, 8):
                poly += [(u - s * 0.045, v), (u - s * 0.045, v - s * 0.08), (u + s * 0.045, v - s * 0.08), (u + s * 0.045, v)]
            else:
                poly.append((u, v))
        poly += list(reversed(bot[1:-1]))
        carve(uid('grin'), x, y, cz, rx, rz, poly, lamp, s * 0.1)


def hay(x, y, z, w, d, h, m, rot=0.0):
    box(uid('hay'), (w, d, h), (x, y, z + h / 2), m['hay'], rot=(0, 0, rot), bev=0.02)
    for sx in (-1, 1):
        box(uid('twine'), (0.012, d + 0.006, h + 0.006), (x + math.cos(rot) * sx * w * 0.25, y + math.sin(rot) * sx * w * 0.25, z + h / 2), m['rope'],
            rot=(0, 0, rot), bev=0)


# ---------------------------------------------------------------- Pumpkin Nights

def jack_lantern():
    m = std()
    orange = pm('jl_orange', '#e86a12', '#f4892a', scale=12)
    pale = pm('jl_pale', '#e8b848', '#f4cf68', scale=12)
    stem = pm('jl_stem', '#5a6a22')
    lamp = pm('jl_lamp', '#ffe27a', rough=0.3, emit=2.0)
    hay(0.0, 0.06, 0.0, 0.5, 0.3, 0.16, m)
    # the big lantern on the bale, a small one beside it, and an uncarved one at the back
    pumpkin(0.0, 0.02, 0.16, 0.27, orange, stem, rot=0.2, ribs=10)
    face(0.0, 0.02, 0.16, 0.27, lamp)
    pumpkin(0.3, -0.2, 0.0, 0.15, orange, stem, rot=0.6)
    face(0.3, -0.2, 0.0, 0.15, lamp, grin=False)
    pumpkin(-0.3, -0.16, 0.0, 0.13, pale, stem, rot=1.0)
    for i in range(7):
        a = i * 0.95 + 0.3
        ball(uid('leaf'), 0.06, (math.cos(a) * 0.36, math.sin(a) * 0.32 - 0.05, 0.01), pm('jl_leaf', '#c8641a', '#e09a2a', scale=20),
             scale=(1.4, 1, 0.25), segs=8)
    # a candle glow on the ground
    glow(0.05, -0.15, 1.3)
    finish('jack_lantern', tex=512, glow=('jl_lamp',))


def lantern_arch():
    m = std()
    wood = m['wood_dark']
    orange = pm('la_orange', '#e86a12', '#f4892a', scale=12)
    pale = pm('la_pale', '#efe0c0', '#f8eedb', scale=12)
    stem = pm('la_stem', '#5a6a22')
    corn = pm('la_corn', '#c8a050', '#e0c070', scale=30, kind='wave', stretch=(1, 1, 8))
    leaves = [pm(f'la_leaf{i}', a, b, scale=20) for i, (a, b) in enumerate([('#c8501a', '#e07a2a'), ('#d8a020', '#f0c040'), ('#a83a1a', '#c85a2a')])]
    paper = [pm('la_paper1', '#ff9a3a', rough=0.4, emit=1.6), pm('la_paper2', '#ffd060', rough=0.4, emit=1.6)]
    # two posts and a curved beam, the arch two tiles wide
    for sx in (-1, 1):
        box(uid('post'), (0.09, 0.09, 1.1), (sx * 0.78, 0, 0.55), wood, bev=0.012)
        box(uid('foot'), (0.16, 0.16, 0.06), (sx * 0.78, 0, 0.03), wood, bev=0.01)
        # corn sheaves bound to the posts
        for k in range(9):
            a = k * 2 * math.pi / 9
            rod(uid('stalk'), (sx * 0.78 + math.cos(a) * 0.07, math.sin(a) * 0.07, 0.0),
                (sx * 0.78 + math.cos(a) * 0.15, math.sin(a) * 0.15, 0.7), 0.014, corn, verts=5)
        torus(uid('band'), 0.1, 0.015, (sx * 0.78, 0, 0.45), m['rope'], segs=14, rsegs=4)
    n = 14
    pts = []
    for k in range(n + 1):
        u = k / n
        x = -0.78 + 1.56 * u
        z = 1.1 + 0.22 * math.sin(u * math.pi)
        pts.append((x, z))
    for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
        rod(uid('beam'), (x0, 0, z0), (x1, 0, z1), 0.05, wood, verts=8)
    # a garland of autumn leaves along the beam
    rnd = random.Random(3)
    for k, (x, z) in enumerate(pts):
        for j in range(3):
            ball(uid('gl'), 0.05, (x + rnd.uniform(-0.05, 0.05), rnd.uniform(-0.06, 0.06), z + rnd.uniform(0.0, 0.07)), leaves[(k + j) % 3],
                 scale=(1.3, 1, 0.35), segs=8)
    # paper lanterns hanging under the beam
    for k, u in enumerate((0.2, 0.4, 0.6, 0.8)):
        x = -0.78 + 1.56 * u
        z = 1.1 + 0.22 * math.sin(u * math.pi)
        drop = 0.2 + 0.08 * (k % 2)
        cyl(uid('cord'), 0.005, drop, (x, 0, z - drop / 2), m['iron'], verts=4, bev=0)
        ball(uid('paper'), 0.075, (x, 0, z - drop - 0.06), paper[k % 2], scale=(1, 1, 1.15), segs=12)
        cyl(uid('cap'), 0.04, 0.025, (x, 0, z - drop + 0.02), m['iron'], verts=8, bev=0)
        cyl(uid('cap'), 0.04, 0.025, (x, 0, z - drop - 0.14), m['iron'], verts=8, bev=0)
        glow(x, 0, 0.8)
    # pumpkins and hay at the feet
    for sx in (-1, 1):
        hay(sx * 0.55, -0.22, 0.0, 0.36, 0.22, 0.14, m, rot=sx * 0.15)
        pumpkin(sx * 0.55, -0.22, 0.14, 0.12, orange, stem, rot=sx)
        pumpkin(sx * 0.95, -0.25, 0.0, 0.1, pale if sx > 0 else orange, stem, rot=0.5)
    for i in range(12):
        x = rnd.uniform(-0.9, 0.9)
        ball(uid('fall'), 0.04, (x, rnd.uniform(-0.4, 0.3), 0.008), leaves[i % 3], scale=(1.4, 1, 0.2), segs=6)
    finish('lantern_arch', tex=1024, glow=('la_paper1', 'la_paper2'))


# ---------------------------------------------------------------- Winter Lights

def festive_pine():
    m = std()
    leaves = [pm('fp_leaf', '#1f6a34', '#2f8a44', scale=30), pm('fp_leaf2', '#1a5e2e', '#28803e', scale=30)]
    bark = bark_mat('fp_bark', '#5a3a22', '#6e4a2c')
    snowm = pm('fp_snow', '#f4f8fc', '#ffffff', scale=20)
    rnd = random.Random(7)
    balls = [pm('fp_red', '#d8241a', rough=0.25, metal=0.3), pm('fp_gold', '#e8b830', rough=0.25, metal=0.5),
             pm('fp_blue', '#2a6ad8', rough=0.25, metal=0.3)]
    bulb = pm('fp_bulb', '#fff0a0', rough=0.3, emit=2.0)
    bulb2 = pm('fp_bulb2', '#ffb0c0', rough=0.3, emit=2.0)
    # a trunk and four stacked, slightly ragged cones (base radius, bottom, height)
    cyl(uid('trunk'), 0.05, 0.24, (0, 0, 0.12), bark, verts=10, r2=0.04)
    tiers = [(0.4, 0.16, 0.42), (0.32, 0.38, 0.38), (0.24, 0.58, 0.34), (0.15, 0.78, 0.32)]
    for i, (r, z, h) in enumerate(tiers):
        c = cyl(uid('cone'), r, h, (0, 0, z + h / 2), leaves[i % 2], verts=16, r2=0.0, bev=0, smooth=False)
        for v in c.data.vertices:
            if v.co.z < 0:
                v.co.z += (rnd.random() - 0.5) * 0.05
                v.co.x *= 1 + (rnd.random() - 0.5) * 0.14
                v.co.y *= 1 + (rnd.random() - 0.5) * 0.14
        # snow on the tier's shoulders
        ball(uid('snowcap'), r * 0.55, (0, 0, z + h * 0.62), snowm, scale=(1, 1, 0.25), segs=12)
    top = tiers[-1][1] + tiers[-1][2]

    def on_cone(h, a, out=0.0):
        r = 0.0
        for (r0, z0, hh) in tiers:
            if z0 <= h <= z0 + hh:
                r = max(r, r0 * (1 - (h - z0) / hh))
        return (math.cos(a) * (r + out), math.sin(a) * (r + out), h)

    base = tiers[0][1]
    for k in range(16):
        h = base + 0.06 + (k / 16) * (top - base - 0.2)
        a = rnd.uniform(0, 2 * math.pi)
        ball(uid('bauble'), 0.035, on_cone(h, a, 0.01), balls[k % 3], segs=10)
    for k in range(34):
        u = k / 34
        h = base + 0.04 + u * (top - base - 0.12)
        a = u * 3.2 * 2 * math.pi
        ball(uid('light'), 0.016, on_cone(h, a, 0.012), bulb if k % 3 else bulb2, segs=6)
    # the star on top
    star = pm('fp_star', '#ffc81a', rough=0.3, emit=2.0)
    for k in range(5):
        a = k * 2 * math.pi / 5 + math.pi / 2
        obox(uid('ray'), (math.cos(a) * 0.045, 0.0, top + 0.08 + math.sin(a) * 0.045), ((math.cos(a), 0, math.sin(a)), (0, 1, 0), (-math.sin(a), 0, math.cos(a))),
             (0.09, 0.025, 0.035), star, bev=0)
    ball(uid('heart'), 0.035, (0, 0.0, top + 0.08), star, scale=(1, 0.6, 1), segs=8)
    # snow at the foot and gifts round it
    ball(uid('drift'), 0.4, (0, 0, -0.03), snowm, scale=(1, 1, 0.1), segs=18)
    gifts = [('#d8281a', '#f0d040'), ('#2a8a3a', '#f4efe6'), ('#2a5ad8', '#f0d040'), ('#f4efe6', '#d8281a')]
    for i, (x, y, s, rot) in enumerate(((-0.26, -0.22, 0.13, 0.3), (0.2, -0.25, 0.11, -0.4), (0.3, 0.05, 0.09, 0.2), (-0.05, -0.32, 0.08, 0.7))):
        c, r = gifts[i % 4]
        box(uid('gift'), (s, s, s * 0.85), (x, y, s * 0.42), pm(f'fp_g{i}', c), rot=(0, 0, rot), bev=0.008)
        ribbon = pm(f'fp_r{i}', r)
        box(uid('rib'), (s + 0.006, 0.018, s * 0.85 + 0.006), (x, y, s * 0.42), ribbon, rot=(0, 0, rot), bev=0)
        box(uid('rib'), (0.018, s + 0.006, s * 0.85 + 0.006), (x, y, s * 0.42), ribbon, rot=(0, 0, rot), bev=0)
        for sx in (-1, 1):
            ball(uid('bow'), 0.022, (x + sx * 0.02, y, s * 0.85 + 0.01), ribbon, scale=(1.2, 0.6, 0.7), segs=8)
    glow(0, -0.05, 1.4)
    finish('festive_pine', tex=1024, glow=('fp_bulb', 'fp_bulb2', 'fp_star'))


def gift_sleigh():
    m = std()
    red = pm('gs_red', '#c8201a', '#e0382a', scale=14)
    gold = m['brass']
    wood = m['wood_warm']
    # two runners that curl up at the front (-X is the front of the sleigh, it stands across the tile)
    for sy in (-1, 1):
        y = sy * 0.24
        pts = [(0.7, 0.03), (0.2, 0.02), (-0.4, 0.02), (-0.6, 0.06), (-0.72, 0.16), (-0.74, 0.28), (-0.66, 0.36), (-0.58, 0.32)]
        for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
            rod(uid('runner'), (x0, y, z0), (x1, y, z1), 0.022, gold, verts=8)
        for x in (-0.3, 0.1, 0.5):
            rod(uid('strut'), (x, y, 0.03), (x, y * 0.9, 0.2), 0.016, gold, verts=6)
    # the body: a tub with a curved front and a high back, a padded seat
    box(uid('floor'), (1.0, 0.5, 0.06), (0.1, 0, 0.22), red, bev=0.02)
    for sy in (-1, 1):
        obox(uid('side'), (0.1, sy * 0.25, 0.36), ((1, 0, 0), (0, 0, 1), (0, 1, 0)), (1.0, 0.28, 0.04), red, bev=0.015)
        rod(uid('trim'), (-0.4, sy * 0.27, 0.5), (0.6, sy * 0.27, 0.5), 0.015, gold, verts=6)
        for k in range(3):
            torus(uid('curl'), 0.06, 0.012, (-0.1 + k * 0.3, sy * 0.275, 0.36), gold, rot=(R90, 0, 0), segs=16, rsegs=4)
    obox(uid('front'), (-0.42, 0, 0.4), ((0.5, 0, 0.87), (0, 1, 0), (0.87, 0, -0.5)), (0.42, 0.54, 0.05), red, bev=0.015)
    box(uid('back'), (0.06, 0.54, 0.5), (0.6, 0, 0.47), red, bev=0.02)
    rod(uid('backtrim'), (0.63, -0.27, 0.72), (0.63, 0.27, 0.72), 0.018, gold, verts=6)
    box(uid('seat'), (0.3, 0.46, 0.08), (0.42, 0, 0.3), pm('gs_seat', '#2a6a3a', '#3a8a4a', scale=20), bev=0.03)
    box(uid('cushion'), (0.06, 0.44, 0.24), (0.54, 0, 0.44), pm('gs_seat', '#2a6a3a', '#3a8a4a', scale=20), bev=0.03)
    # a pile of gifts and a sack
    gifts = [('#2a8a3a', '#f0d040'), ('#2a5ad8', '#f4efe6'), ('#f4efe6', '#d8281a'), ('#e8b830', '#c8201a'), ('#8a3ad8', '#f0d040')]
    for i, (x, y, z, s, rot) in enumerate(((-0.12, -0.08, 0.25, 0.18, 0.2), (0.12, 0.1, 0.25, 0.16, -0.3), (-0.1, 0.12, 0.25, 0.12, 0.6),
                                            (0.0, -0.02, 0.41, 0.13, -0.1), (0.14, -0.12, 0.25, 0.11, 0.4))):
        c, r = gifts[i]
        box(uid('gift'), (s, s, s * 0.9), (x, y, z + s * 0.45), pm(f'gs_g{i}', c), rot=(0, 0, rot), bev=0.01)
        ribbon = pm(f'gs_r{i}', r)
        box(uid('rib'), (s + 0.006, 0.02, s * 0.9 + 0.006), (x, y, z + s * 0.45), ribbon, rot=(0, 0, rot), bev=0)
        box(uid('rib'), (0.02, s + 0.006, s * 0.9 + 0.006), (x, y, z + s * 0.45), ribbon, rot=(0, 0, rot), bev=0)
        ball(uid('bow'), 0.025, (x, y, z + s * 0.9 + 0.01), ribbon, scale=(1.4, 0.8, 0.6), segs=8)
    sackm = pm('gs_sack', '#b8925a', '#d0aa70', scale=30)
    ball(uid('sack'), 0.16, (0.3, 0.02, 0.42), sackm, scale=(1, 1, 1.2), segs=14)
    torus(uid('tie'), 0.05, 0.015, (0.3, 0.02, 0.6), m['rope'], segs=12, rsegs=4)
    ball(uid('neck'), 0.06, (0.3, 0.02, 0.64), sackm, scale=(1, 1, 0.7), segs=10)
    # a lantern on a hook at the front
    rod(uid('hook'), (-0.55, 0, 0.5), (-0.62, 0, 0.66), 0.012, m['iron'], verts=6)
    lantern(-0.66, 0, 0.5, m, light=1.3)
    snowm = pm('gs_snow', '#f4f8fc', '#ffffff', scale=20)
    ball(uid('drift'), 0.5, (0.0, 0, -0.03), snowm, scale=(1.7, 0.85, 0.08), segs=18)
    finish('gift_sleigh', tex=1024, glow=('lamp',))


# ---------------------------------------------------------------- Blossom Days

def blossom_tree():
    bark = bark_mat('bt_bark', '#5a3a2a', '#74503a')
    pinks = [pm('bt_p1', '#f4a0c0', '#ffc8dc', scale=30), pm('bt_p2', '#e880a8', '#f8a8c8', scale=30), pm('bt_p3', '#fff0f4', '#ffd8e6', scale=30)]
    # a twisting trunk that forks into three boughs
    pts = [(0, 0, 0), (0.03, 0.01, 0.2), (0.0, 0.03, 0.4), (-0.03, 0.02, 0.52)]
    for a, b in zip(pts, pts[1:]):
        rod(uid('trunk'), a, b, 0.06, bark, verts=10)
    ball(uid('root'), 0.09, (0, 0, 0.03), bark, scale=(1, 1, 0.5), segs=10)
    tops = [(-0.22, 0.05, 0.78), (0.2, -0.05, 0.8), (0.0, 0.18, 0.9)]
    for t in tops:
        rod(uid('bough'), pts[-1], t, 0.035, bark, verts=8)
    rnd = random.Random(11)
    for i, (x, y, z) in enumerate(tops + [(0.0, -0.08, 0.98), (-0.12, -0.12, 0.7), (0.15, 0.15, 0.72)]):
        clump(x, y, z, 0.19, pinks, n=46, seed=20 + i, leaf=0.2, squash=0.8)
    # petals fallen round the foot
    for i in range(40):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(0.08, 0.45)
        ball(uid('petal'), 0.022, (math.cos(a) * r, math.sin(a) * r, 0.006), pinks[i % 3], scale=(1.3, 1, 0.25), segs=6)
    finish('blossom_tree', tex=1024)


def butterfly_dome():
    m = std()
    white = pm('bd_white', '#f4f1ea', rough=0.5)
    stone = m['stone'][1]
    leaves = leaf_mats('#3f8f2e', 'bdv')
    cols = [pm('bd_f1', '#ff7aa8'), pm('bd_f2', '#fff2a0'), pm('bd_f3', '#b890ff'), pm('bd_f4', '#ff9a4a'), pm('bd_f5', '#ffffff')]
    rnd = random.Random(5)
    # a round stone plinth with a step and a lawn
    cyl(uid('plinth'), 0.82, 0.1, (0, 0, 0.05), stone, verts=40)
    cyl(uid('step'), 0.9, 0.04, (0, 0, 0.02), m['stone'][0], verts=40)
    cyl(uid('floor'), 0.76, 0.02, (0, 0, 0.105), pm('bd_floor', '#5a9a32', '#7ab842', scale=30), verts=40, bev=0)
    # an open dome of white iron ribs and rings, with climbing roses along the ribs
    R, zb = 0.72, 0.11
    for k in range(10):
        a = k * 2 * math.pi / 10
        prev = None
        for j in range(10):
            t = j / 9 * math.pi / 2
            p = (math.cos(a) * math.cos(t) * R, math.sin(a) * math.cos(t) * R, zb + math.sin(t) * R * 1.05)
            if prev:
                rod(uid('rib'), prev, p, 0.014, white, verts=6)
                if j % 2 == 0 and j < 9 and rnd.random() < 0.85:
                    ball(uid('vine'), 0.04, p, leaves[j % 3], scale=(1, 1, 0.8), segs=8)
                    ball(uid('rose'), 0.022, (p[0] * 1.03, p[1] * 1.03, p[2] + 0.02), cols[(k + j) % 5], segs=8)
            prev = p
    for h in (0.3, 0.62, 0.88):
        z = zb + h * R * 1.05
        torus(uid('ring'), math.sqrt(max(0.0, 1 - h * h)) * R, 0.013, (0, 0, z), white, segs=40, rsegs=4)
    torus(uid('base'), R, 0.025, (0, 0, zb + 0.02), white, segs=40, rsegs=5)
    ball(uid('finial'), 0.06, (0, 0, zb + R * 1.05 + 0.03), m['brass'], segs=10)
    # flower beds and a little tree inside
    for i in range(10):
        a = i * 2 * math.pi / 10 + 0.3
        r = 0.48 + rnd.uniform(-0.05, 0.05)
        x, y = math.cos(a) * r, math.sin(a) * r
        if y < -0.3 and abs(x) < 0.3:
            continue
        clump(x, y, 0.15, 0.09, [m['leaf'], pm('bd_l2', '#4a9a34')], n=10, seed=30 + i, leaf=0.35)
        for j in range(5):
            ball(uid('bloom'), 0.024, (x + rnd.uniform(-0.07, 0.07), y + rnd.uniform(-0.07, 0.07), 0.22 + rnd.uniform(0, 0.04)), cols[(i + j) % 5], segs=8)
    rod(uid('trunk'), (0, 0.05, 0.11), (0, 0.05, 0.42), 0.03, bark_mat('bd_bark', '#5a3a22', '#6e4a2c'), verts=8)
    clump(0, 0.05, 0.52, 0.17, leaf_mats('#3f8f2e', 'bdl'), n=24, seed=3, leaf=0.3)
    # a path of stepping stones in from the front
    for k in range(3):
        cyl(uid('stepstone'), 0.07, 0.02, (0, -0.68 + k * 0.17, 0.115), m['stone'][k % 3], verts=10)
    box(uid('bench'), (0.3, 0.1, 0.03), (0.32, 0.18, 0.24), m['wood'], rot=(0, 0, 2.2), bev=0.008)
    # butterflies inside and out, big and bright
    wings = [pm('bd_w1', '#ff8a1a'), pm('bd_w2', '#3aa0f0'), pm('bd_w3', '#f4d020'), pm('bd_w4', '#e85aa0')]
    spots = ((0.3, -0.2, 0.55), (-0.35, 0.1, 0.48), (0.1, 0.35, 0.7), (-0.2, -0.35, 0.36), (0.6, -0.5, 0.95), (-0.65, -0.45, 0.8), (0.0, -0.1, 1.0))
    for i, (x, y, z) in enumerate(spots):
        w = wings[i % 4]
        a = rnd.uniform(0, math.pi)
        for sd in (-1, 1):
            obox(uid('wing'), (x + math.cos(a) * sd * 0.045, y + math.sin(a) * sd * 0.045, z + 0.01), ((math.cos(a), math.sin(a), 0.6 * sd), (-math.sin(a), math.cos(a), 0), (0, 0, 1)),
                 (0.09, 0.1, 0.008), w, bev=0)
        ball(uid('body'), 0.011, (x, y, z), pm('bd_body', '#2a1a10'), scale=(1, 3, 1), segs=6)
    finish('butterfly_dome', tex=1024)


# ---------------------------------------------------------------- Sunny Days

def lawn_flamingos():
    pink = pm('lf_pink', '#f46a9a', '#ff8ab4', scale=16)
    beak = pm('lf_beak', '#2a2226')
    legm = pm('lf_leg', '#d84a7a', rough=0.5)
    eye = pm('lf_eye', '#1a1a1e')
    grass = leaf_mats('#3f8f2e', 'lfg')

    def flamingo(x, y, turn, head_down=False):
        c, s = math.cos(turn), math.sin(turn)

        def at(u, v, z):  # u forward along the bird, v to its side
            return (x + c * u - s * v, y + s * u + c * v, z)

        rod(uid('leg'), at(0.0, 0.02, 0.0), at(0.0, 0.02, 0.36), 0.008, legm, verts=5)
        rod(uid('leg'), at(0.0, -0.02, 0.0), at(0.0, -0.02, 0.36), 0.008, legm, verts=5)
        b = ball(uid('body'), 0.11, at(0.0, 0.0, 0.42), pink, scale=(1.35, 0.75, 0.75), segs=14)
        b.rotation_euler = (0, -0.25, turn)
        ball(uid('tail'), 0.05, at(-0.14, 0.0, 0.45), pink, scale=(1.4, 0.8, 0.5), segs=8)
        for v in (-1, 1):
            w = ball(uid('wing'), 0.08, at(-0.02, v * 0.07, 0.44), pm('lf_wing', '#e85a8a', '#f478a4', scale=16), scale=(1.4, 0.3, 0.6), segs=10)
            w.rotation_euler = (0, -0.2, turn)
        if head_down:
            pts = [at(0.12, 0, 0.46), at(0.2, 0, 0.5), at(0.24, 0, 0.42), at(0.26, 0, 0.3), at(0.3, 0, 0.22)]
        else:
            pts = [at(0.12, 0, 0.46), at(0.18, 0, 0.56), at(0.15, 0, 0.66), at(0.12, 0, 0.74), at(0.16, 0, 0.8)]
        for a, bb in zip(pts, pts[1:]):
            rod(uid('neck'), a, bb, 0.022, pink, verts=8)
        hx, hy, hz = pts[-1]
        ball(uid('head'), 0.035, (hx, hy, hz), pink, segs=10)
        tip = at(0.26, 0, 0.75) if not head_down else at(0.36, 0, 0.18)
        rod(uid('beak'), (hx, hy, hz), tip, 0.014, beak, verts=6)
        for v in (-1, 1):
            ball(uid('eye'), 0.007, (hx - s * v * 0.03, hy + c * v * 0.03, hz + 0.01), eye, segs=6)

    flamingo(-0.17, 0.05, 0.4)
    flamingo(0.17, -0.06, 2.6, head_down=True)
    clump(-0.32, -0.3, 0.03, 0.08, grass, n=10, seed=2, leaf=0.4)
    clump(0.35, 0.3, 0.03, 0.08, grass, n=10, seed=4, leaf=0.4)
    for i, (x, y) in enumerate(((-0.05, -0.32), (0.3, 0.12), (-0.38, 0.25))):
        clump(x, y, 0.02, 0.05, [pm('lf_d1', '#fff2a0'), pm('lf_d2', '#ffffff')], n=6, seed=9 + i, leaf=0.5)
    finish('lawn_flamingos', tex=512)


def paddling_pool():
    m = std()
    rings = [pm('pp_blue', '#2a8ae0', rough=0.35), pm('pp_white', '#f6f6f0', rough=0.35), pm('pp_yellow', '#f8c820', rough=0.35)]
    water = pm('pp_water', '#5ac8f0', '#8adcf8', scale=10, kind='wave', rough=0.05)
    R = 0.72
    # three inflated rings, the pool floor and the water
    cyl(uid('floor'), R, 0.02, (0, 0, 0.01), rings[0], verts=48, bev=0)
    for k, z in enumerate((0.07, 0.19, 0.31)):
        torus(uid('ring'), R, 0.065, (0, 0, z), rings[k % 3], segs=48, rsegs=12)
    cyl(uid('water'), R - 0.03, 0.02, (0, 0, 0.26), water, verts=48, bev=0)
    # a rubber duck and a beach ball afloat
    duck = pm('pp_duck', '#ffd21a', rough=0.35)
    ball(uid('duck'), 0.08, (0.22, 0.1, 0.3), duck, scale=(1.3, 1, 0.8), segs=12)
    ball(uid('dhead'), 0.05, (0.3, 0.1, 0.39), duck, segs=12)
    cyl(uid('dbeak'), 0.022, 0.05, (0.35, 0.1, 0.385), pm('pp_beak', '#f07a1a'), verts=8, rot=(0, R90, 0), r2=0.01)
    for sy in (-1, 1):
        ball(uid('deye'), 0.008, (0.33, 0.1 + sy * 0.025, 0.41), pm('pp_eye', '#1a1a1e'), segs=6)
    cols = [pm('pp_b1', '#e8281a'), pm('pp_b2', '#f8f8f0'), pm('pp_b3', '#2a6ad8'), pm('pp_b4', '#f8c820')]
    bx, by, bz, br = -0.25, -0.15, 0.33, 0.1
    for k in range(8):
        a0, a1 = k * math.pi / 4, (k + 1) * math.pi / 4
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=br, location=(bx, by, bz))
        o = bpy.context.active_object
        o.name = uid('ball')
        import bmesh
        bm = bmesh.new()
        bm.from_mesh(o.data)
        keep = []
        for f in bm.faces:
            c = f.calc_center_median()
            ang = math.atan2(c.y, c.x) % (2 * math.pi)
            if not (a0 <= ang < a1):
                keep.append(f)
        bmesh.ops.delete(bm, geom=keep, context='FACES')
        bm.to_mesh(o.data)
        bm.free()
        o.data.materials.append(cols[k % 4])
        bpy.ops.object.shade_smooth()
    # a towel and flip-flops on the grass beside it
    towel = pm('pp_towel', '#e84a6a', '#f8f0e8', scale=12, kind='wave', stretch=(1, 10, 1))
    box(uid('towel'), (0.34, 0.2, 0.012), (0.62, -0.72, 0.006), towel, rot=(0, 0, 0.5), bev=0.004)
    for k, (x, y) in enumerate(((-0.78, -0.55), (-0.7, -0.62))):
        ball(uid('flop'), 0.05, (x, y, 0.008), pm('pp_flop', '#2ab0a0'), scale=(0.6, 1.2, 0.12), segs=10)
    finish('paddling_pool', tex=1024)


MODELS = {'jack_lantern': jack_lantern, 'lantern_arch': lantern_arch, 'festive_pine': festive_pine, 'gift_sleigh': gift_sleigh,
          'blossom_tree': blossom_tree, 'butterfly_dome': butterfly_dome, 'lawn_flamingos': lawn_flamingos, 'paddling_pool': paddling_pool}

if __name__ == '__main__':
    main(MODELS)
