# Fruit trees, palms, the decorative oak and the wild trees that clutter new land.
# The foliage is exported as its own node named `crown`, pivoting at the foot of the tree: the
# game hangs it in its swaying crown group, next to the fruit it grows and drops, so the model
# sways and shakes exactly like the tree it replaces. The crown sits around the spot the game
# hangs fruit on (a ball of radius ~0.45 at 0.8 up).
# Run: python3 tools/blender/trees.py [names...]   (see kit.main)
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import anim_group, ball, bark_mat, box, clump, cyl, finish, leaf_mats, main, palm, pm, torus, uid  # noqa: E402

SHAPES = {
    'round': [(0, 0, 0.82, 0.36), (-0.21, 0.06, 0.72, 0.26), (0.22, -0.05, 0.74, 0.26), (0.04, 0.18, 0.98, 0.24),
              (-0.06, -0.2, 0.95, 0.23), (0.12, 0.17, 0.68, 0.22)],
    'citrus': [(0, 0, 0.8, 0.4), (0.18, -0.12, 0.92, 0.22), (-0.18, 0.1, 0.94, 0.22), (0, 0.05, 1.1, 0.2), (0.1, 0.16, 0.7, 0.2)],
    'tall': [(0, 0, 0.74, 0.32), (0, 0.02, 1.0, 0.3), (0.13, -0.1, 0.87, 0.22), (-0.13, 0.1, 0.86, 0.22), (0, 0, 1.22, 0.2)],
    'broad': [(0, 0, 0.86, 0.34), (-0.3, 0.05, 0.78, 0.26), (0.3, -0.05, 0.78, 0.26), (0, 0.26, 0.8, 0.24), (0.02, -0.25, 0.84, 0.24)],
    'bushy': [(0, 0, 0.66, 0.34), (-0.23, 0.1, 0.56, 0.26), (0.23, -0.1, 0.57, 0.26), (0.05, 0.1, 0.9, 0.26), (0, -0.2, 0.8, 0.22)],
    'cone': [(0, 0, 0.62, 0.3), (0, 0, 0.84, 0.27), (0, 0, 1.04, 0.21), (0, 0, 1.22, 0.14), (0.15, 0.08, 0.7, 0.22), (-0.15, -0.08, 0.72, 0.22),
             (0.05, -0.16, 0.9, 0.2), (-0.06, 0.16, 0.88, 0.2)],
    'spread': [(0, 0, 0.78, 0.3), (-0.36, 0.1, 0.7, 0.25), (0.36, -0.08, 0.7, 0.25), (0.1, 0.34, 0.72, 0.23), (-0.12, -0.34, 0.72, 0.23),
               (0, 0, 0.95, 0.2), (0.26, 0.26, 0.66, 0.2), (-0.26, -0.26, 0.66, 0.2)],
    'weeping': [(0, 0, 0.9, 0.34), (-0.2, 0.08, 0.8, 0.25), (0.2, -0.06, 0.8, 0.25), (0, 0.2, 0.84, 0.23), (0, -0.2, 0.84, 0.23), (0, 0, 1.12, 0.2)],
    'shrub': [(0, 0, 0.56, 0.3), (-0.24, 0.1, 0.48, 0.24), (0.24, -0.1, 0.48, 0.24), (0.05, 0.22, 0.62, 0.22), (0, -0.22, 0.6, 0.22), (0, 0, 0.78, 0.2)],
    'olive': [(0.08, 0, 0.86, 0.3), (-0.22, 0.08, 0.76, 0.22), (0.27, -0.08, 0.72, 0.2), (0, 0.18, 1.0, 0.2), (-0.05, -0.18, 0.95, 0.18)],
}

# id: (shape, leaf color, blossom colors, scale)
TREES = {
    'apple_tree': ('round', '#4a9a32', None, 1), 'cherry_tree': ('round', '#3a8a36', None, 1),
    'orange_tree': ('citrus', '#2a7a2e', None, 1), 'lemon_tree': ('citrus', '#3a8e38', None, 1),
    'lime_tree': ('citrus', '#2a7a30', None, 1), 'grapefruit_tree': ('citrus', '#358a36', None, 1),
    'peach_tree': ('round', '#52a036', None, 1), 'pear_tree': ('tall', '#529a36', None, 1),
    'plum_tree': ('round', '#3a7a36', None, 1), 'mango_tree': ('broad', '#2a7a30', None, 1),
    'avocado_tree': ('tall', '#28662c', None, 1), 'pomegranate_tree': ('bushy', '#468634', None, 1),
    'apricot_tree': ('round', '#529a36', None, 1), 'fig_tree': ('broad', '#469636', None, 1),
    'olive_tree': ('olive', '#7c9270', None, 1), 'walnut_tree': ('round', '#3a762c', None, 1.2),
    'quince_tree': ('round', '#529636', None, 1), 'almond_tree': ('round', '#62a246', ('#f8e8ee', '#f4c4d4'), 1),
    'mulberry_tree': ('bushy', '#3a8632', None, 1), 'persimmon_tree': ('broad', '#62962a', None, 1),
    'lychee_tree': ('broad', '#2a7a30', None, 1), 'hazelnut_tree': ('bushy', '#529632', None, 1),
    'starfruit_tree': ('round', '#3a8a3a', None, 1), 'maple_tree': ('round', '#d04a24', None, 1),
    'cocoa_tree': ('tall', '#2a662c', None, 1), 'sakura_tree': ('round', '#de6a9a', ('#fbd8e6', '#e8407a'), 1),
    'golden_apple_tree': ('round', '#6aae42', ('#f0c020',), 1),
    'tangerine_tree': ('citrus', '#2a7a2e', None, 1),
    'nectarine_tree': ('round', '#4a9a32', None, 1),
    'chestnut_tree': ('broad', '#3a7a2a', None, 1.2),
    'kumquat_tree': ('bushy', '#2a7a2a', ('#fbf6ea',), 0.9),
    'guava_tree': ('bushy', '#6aa83a', None, 1),
    'pistachio_tree': ('spread', '#7a9a5a', None, 0.95),
    'elderberry_tree': ('shrub', '#4a8a36', ('#f8f4e0',), 1),
    'pecan_tree': ('tall', '#4a8a30', None, 1.2),
    'blood_orange_tree': ('citrus', '#26702a', None, 1),
    'jackfruit_tree': ('broad', '#2a6a28', None, 1.12),
    'macadamia_tree': ('cone', '#2a6a30', None, 1),
    'yuzu_tree': ('citrus', '#2f7a2a', ('#ffffff',), 0.95),
    'cashew_tree': ('spread', '#3a8a30', None, 1.05),
    'white_peach_tree': ('round', '#5aa03a', ('#f8d8e0',), 1),
    'loquat_tree': ('broad', '#2a5a2a', None, 0.95),
    'crabapple_tree': ('round', '#4a8a32', ('#f8b8c8', '#e0507a'), 0.92),
    'cinnamon_tree': ('cone', '#2a6a2e', None, 1),
    'mangosteen_tree': ('cone', '#1f5a26', None, 1.05),
    'durian_tree': ('tall', '#4a7a2c', None, 1.15),
    'black_cherry_tree': ('tall', '#2f6a30', ('#ffffff', '#f4e8ec'), 1),
    'silver_pear_tree': ('weeping', '#9ab8a0', ('#ffffff',), 1),
}


def trunk(bark, s, rnd, shape):
    """Flared trunk with roots and two limbs reaching into the crown."""
    h = (0.36 if shape in ('bushy', 'shrub') else 0.55) * s
    if shape == 'olive':
        # two twisting stems leaning apart
        for k, lean in enumerate((0.22, -0.18)):
            cyl(uid('tr'), 0.06 * s, h * 1.1, (lean * 0.25 * s, 0, h * 0.55), bark, verts=10, r2=0.045 * s, rot=(0, lean, k * 0.8))
    elif shape == 'shrub':
        # several thin stems from one root crown
        for k in range(5):
            a = k * 1.26
            cyl(uid('tr'), 0.03 * s, h * 1.2, (math.cos(a) * 0.05 * s, math.sin(a) * 0.05 * s, h * 0.6), bark, verts=8, r2=0.02 * s,
                rot=(math.sin(a) * 0.35, -math.cos(a) * 0.35, 0))
        return
    elif shape == 'spread':
        # a short trunk forking into low, wide limbs
        cyl(uid('tr'), 0.1 * s, h * 0.8, (0, 0, h * 0.4), bark, verts=12, r2=0.075 * s)
        for k in range(4):
            a = k * 1.57 + 0.4
            cyl(uid('limb'), 0.05 * s, 0.42 * s, (math.cos(a) * 0.15 * s, math.sin(a) * 0.15 * s, h * 0.95), bark, verts=8, r2=0.03 * s,
                rot=(math.sin(a) * 1.0, -math.cos(a) * 1.0, 0))
    else:
        cyl(uid('tr'), 0.09 * s, h, (0, 0, h / 2), bark, verts=12, r2=0.06 * s)
    for k in range(4):
        a = k * 1.57 + rnd.uniform(-0.3, 0.3)
        cyl(uid('root'), 0.035 * s, 0.18 * s, (math.cos(a) * 0.09 * s, math.sin(a) * 0.09 * s, 0.035 * s), bark, verts=8,
            r2=0.012 * s, rot=(math.sin(a) * 1.15, -math.cos(a) * 1.15, 0))
    for k in range(2):
        a = k * math.pi + rnd.uniform(-0.4, 0.4)
        cyl(uid('limb'), 0.035 * s, 0.3 * s, (math.cos(a) * 0.08 * s, math.sin(a) * 0.08 * s, h + 0.08 * s), bark, verts=8,
            r2=0.018 * s, rot=(math.sin(a) * 0.7, -math.cos(a) * 0.7, 0))


def crown(shape, leaf, blossom, s, seed):
    rnd = random.Random(seed)
    mats = leaf_mats(leaf, f'lf{seed}')
    blooms = [pm(f'bl{i}', c, rough=0.5) for i, c in enumerate(blossom)] if blossom else []
    with anim_group('crown', (0, 0, 0)):
        for i, (x, y, z, r) in enumerate(SHAPES[shape]):
            clump(x * s, y * s, z * s, r * s, mats, n=13, seed=seed * 10 + i, leaf=0.42, squash=0.9)
        if shape == 'weeping':
            # long leafy strands trailing down around the crown
            for i in range(40):
                a = i * 2.4
                rr = (0.3 + (i % 3) * 0.05) * s
                for k in range(6):
                    ball(uid('drip'), (0.045 - k * 0.005) * s, (math.cos(a) * (rr + k * 0.015 * s), math.sin(a) * (rr + k * 0.015 * s), (0.84 - k * 0.07) * s),
                         mats[(i + k) % len(mats)], scale=(1, 1, 1.4), segs=8)
        for i in range(34 if blooms else 0):
            # blossoms dotted over the outside of the crown
            a = rnd.uniform(0, math.pi * 2)
            zf = rnd.uniform(-0.3, 0.9)
            rr = math.sqrt(max(0.0, 1 - zf * zf)) * 0.47 * s
            ball(uid('bloom'), 0.035 * s, (math.cos(a) * rr, math.sin(a) * rr, (0.82 + zf * 0.4) * s), blooms[i % len(blooms)], segs=8)


def fruit_tree(tid):
    shape, leaf, blossom, s = TREES[tid]
    rnd = random.Random(len(tid))
    bark = bark_mat('bark_olive', '#7a6a58', '#928270') if shape == 'olive' else bark_mat()
    trunk(bark, s, rnd, shape)
    crown(shape, leaf, blossom, s, len(tid))
    grass(rnd)
    finish(tid, tex=1024)


def grass(rnd, n=6):
    g = pm('tuft', '#4a9a2a', '#5aaa34', scale=20)
    for i in range(n):
        a = rnd.uniform(0, 6.28)
        r = rnd.uniform(0.18, 0.34)
        for k in range(3):
            cyl(uid('gr'), 0.01, 0.09, (math.cos(a) * r + k * 0.012, math.sin(a) * r, 0.04), g, verts=4, r2=0.0,
                rot=((k - 1) * 0.3, 0, a), bev=0, smooth=False)


def palm_tree(tid, leaf):
    # matches the game's palm: nine 0.15 segments bending 0.16 toward +x, fruit hung at the top
    with anim_group('crown', (0, 0, 0)):
        palm(0, 0, 1.0, leaf_mats(leaf, 'plf'), bark_mat('palm_bark', '#8a6a44', '#a07e52'), seed=len(tid), lean=(1, 0),
             seg_h=0.15, bend=0.16, nuts=False)
    rnd = random.Random(3)
    for i in range(4):
        a = rnd.uniform(0, 6.28)
        ball(uid('sandm'), 0.12, (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.0), pm('palm_sand', '#e8d098', scale=30), scale=(1.4, 1.2, 0.25), segs=10)
    grass(rnd, 4)
    finish(tid, tex=1024)


def oak_tree(name, leaf, s, seed):
    rnd = random.Random(seed)
    trunk(bark_mat(), s, rnd, 'round')
    crown('round', leaf, None, s, seed)
    grass(rnd)
    finish(name, tex=1024)


def wild_tree(v):
    rnd = random.Random(v + 40)
    s = 1.08
    trunk(bark_mat('wild_bark', '#6a4424', '#7e5230'), s, rnd, 'round')
    crown(['round', 'broad'][v], '#3a8a30' if v == 0 else '#46923a', None, s, 50 + v)
    # a mossy stone and a mushroom or two at the foot
    ball(uid('stone'), 0.07, (0.24, -0.16, 0.02), pm('wstone', '#7a7e84', scale=16), scale=(1.2, 1, 0.6), segs=10)
    for k in range(2):
        x, y = -0.2 + k * 0.05, -0.2 - k * 0.04
        cyl(uid('mst'), 0.012, 0.05, (x, y, 0.025), pm('mstem', '#f4ead8'), verts=8)
        ball(uid('mcap'), 0.03, (x, y, 0.055), pm('mcap', '#d8302a'), scale=(1, 1, 0.6), segs=10)
    grass(rnd)
    finish(f'tree_obs{v}', tex=1024)


def banana_tree():
    """A banana plant: a thick fibrous pseudostem and big paddle leaves arching out from the top.
    The game hangs its fruit bunches (and swaps them in and out) beside the crown."""
    from common import obox
    stem = pm('banana_stem', '#8a8a4a', '#9e9e58', scale=10, kind='wave', stretch=(1, 1, 8))
    leafm = leaf_mats('#56a640', 'bl')
    rib = pm('banana_rib', '#8cc05a')
    with anim_group('crown', (0, 0, 0)):
        cyl(uid('stem'), 0.1, 0.95, (0, 0, 0.475), stem, verts=14, r2=0.07)
        for k in range(3):
            torus(uid('ring'), 0.095 - k * 0.01, 0.01, (0, 0, 0.2 + k * 0.25), stem, segs=16, rsegs=4)
        for i in range(8):
            a = i / 8 * math.pi * 2 + (i % 2) * 0.3
            ca, sa = math.cos(a), math.sin(a)
            side = (-sa, ca, 0.0)
            pts = []
            lift = 0.8 + (i % 3) * 0.15
            for k in range(8):
                u = k / 7
                r = 0.04 + u * 0.72
                h = 0.9 + math.sin(u * 2.2) * 0.3 * lift - u * u * 0.45
                pts.append((ca * r, sa * r, h))
            for k in range(7):
                p0, p1 = pts[k], pts[k + 1]
                d = [p1[j] - p0[j] for j in range(3)]
                ln = math.sqrt(sum(q * q for q in d))
                d = [q / ln for q in d]
                nrm = (d[1] * side[2] - d[2] * side[1], d[2] * side[0] - d[0] * side[2], d[0] * side[1] - d[1] * side[0])
                mid = [(p0[j] + p1[j]) / 2 for j in range(3)]
                u = (k + 0.5) / 7
                w = 0.08 + math.sin(u * math.pi) * 0.16
                obox(uid('blade'), mid, (d, side, nrm), (ln * 1.04, w, 0.008), leafm[(i + k) % 3], bev=0)
                obox(uid('rib'), mid, (d, side, nrm), (ln * 1.04, 0.014, 0.014), rib, bev=0)
        ball(uid('bud'), 0.045, (0.16, 0.06, 0.55), pm('banana_bud', '#6a2a4a'), scale=(0.8, 0.8, 1.4), segs=12)
    rnd = random.Random(8)
    grass(rnd, 5)
    finish('banana_tree', tex=1024)


def papaya_tree():
    """A slender papaya: one ringed trunk topped by big lobed leaves on long stalks. The game hangs
    the fruit in a ring round the trunk just under the leaves."""
    bark = pm('papaya_bark', '#9a8a6a', '#b0a07a', scale=12)
    leafm = leaf_mats('#4a9a36', 'pap')
    stalk = pm('papaya_stalk', '#9ab860')
    with anim_group('crown', (0, 0, 0)):
        cyl(uid('stem'), 0.06, 1.1, (0, 0, 0.55), bark, verts=12, r2=0.045)
        for k in range(8):
            torus(uid('scar'), 0.056 - k * 0.0015, 0.008, (0, 0, 0.15 + k * 0.1), pm('papaya_scar', '#7a6a50'), segs=14, rsegs=4)
        for i in range(10):
            a = i * 2.4
            tilt = 0.7 + (i % 3) * 0.25
            ca, sa = math.cos(a), math.sin(a)
            cyl(uid('pet'), 0.008, 0.46, (ca * 0.2 * math.sin(tilt), sa * 0.2 * math.sin(tilt), 1.08 + 0.2 * math.cos(tilt)), stalk, verts=5,
                rot=(-sa * tilt, ca * tilt, 0), bev=0)
            cx, cy, cz = ca * 0.42 * math.sin(tilt), sa * 0.42 * math.sin(tilt), 1.08 + 0.42 * math.cos(tilt)
            for j in range(5):
                b = a + (j - 2) * 0.35
                ball(uid('lobe'), 0.09, (cx + math.cos(b) * 0.08, cy + math.sin(b) * 0.08, cz - abs(j - 2) * 0.02), leafm[(i + j) % len(leafm)],
                     scale=(1.3, 0.6, 0.3), segs=8).rotation_euler = (0, 0, b)
    grass(random.Random(5), 5)
    finish('papaya_tree', tex=1024)


def dragon_fruit_tree():
    """Dragon fruit cactus trained up a wooden post, its three winged stems arching over a ring at
    the top and drooping down all round."""
    from common import obox
    post = bark_mat('df_post', '#8a6a44', '#a07e52')
    cact = pm('df_cactus', '#4a7a44', '#5e9454', scale=14)
    with anim_group('crown', (0, 0, 0)):
        box(uid('post'), (0.1, 0.1, 0.78), (0, 0, 0.39), post, bev=0.012)
        torus(uid('ring'), 0.2, 0.02, (0, 0, 0.8), pm('df_tire', '#2a2a2a'), segs=20, rsegs=6)
        for i in range(4):
            a = i * math.pi / 2
            box(uid('bar'), (0.24, 0.035, 0.035), (math.cos(a) * 0.1, math.sin(a) * 0.1, 0.8), post, rot=(0, 0, a), bev=0.004)
        # climbing stems up the post
        for k in range(2):
            a = k * math.pi
            for j in range(6):
                obox(uid('climb'), (math.cos(a) * 0.07, math.sin(a) * 0.07, 0.1 + j * 0.12), ((0, 0, 1), (math.cos(a), math.sin(a), 0), (-math.sin(a), math.cos(a), 0)),
                     (0.13, 0.06, 0.02), cact, bev=0.006)
        # arching stems: each a chain of three finned segments
        for i in range(9):
            a = i * 2 * math.pi / 9
            ca, sa = math.cos(a), math.sin(a)
            x, z, ang = 0.12, 0.84, 0.9
            for j in range(6):
                ang -= 0.45
                dx, dz = math.cos(ang) * 0.1, math.sin(ang) * 0.1
                mid = (ca * (x + dx / 2), sa * (x + dx / 2), z + dz / 2)
                d = (ca * math.cos(ang), sa * math.cos(ang), math.sin(ang))
                t1 = (-sa, ca, 0.0)
                t2 = (d[1] * t1[2] - d[2] * t1[1], d[2] * t1[0] - d[0] * t1[2], d[0] * t1[1] - d[1] * t1[0])
                for f in range(3):
                    fa = f * 2.094
                    side = tuple(math.cos(fa) * t1[q] + math.sin(fa) * t2[q] for q in range(3))
                    nrm = (d[1] * side[2] - d[2] * side[1], d[2] * side[0] - d[0] * side[2], d[0] * side[1] - d[1] * side[0])
                    c = tuple(mid[q] + side[q] * 0.018 for q in range(3))
                    obox(uid('fin'), c, (d, side, nrm), (0.11, 0.04, 0.02), cact, bev=0.006)
                    ball(uid('areole'), 0.006, tuple(mid[q] + side[q] * 0.04 for q in range(3)), pm('df_areole', '#d8d0b0'), segs=6)
                x, z = x + dx, z + dz
    grass(random.Random(6), 5)
    finish('dragon_fruit_tree', tex=1024)


def passion_fruit_tree():
    """A passion fruit vine smothering a little wooden arbor, with a few purple white flowers."""
    wood = bark_mat('pf_wood', '#8a5a34', '#a06a3e')
    mats = leaf_mats('#3a8a30', 'pf')
    with anim_group('crown', (0, 0, 0)):
        for sx in (-1, 1):
            for sy in (-1, 1):
                box(uid('post'), (0.05, 0.05, 1.0), (sx * 0.32, sy * 0.32, 0.5), wood, bev=0.008)
            box(uid('beam'), (0.05, 0.76, 0.05), (sx * 0.32, 0, 1.0), wood, bev=0.006)
        for k in range(4):
            box(uid('slat'), (0.76, 0.035, 0.03), (0, -0.27 + k * 0.18, 1.03), wood, bev=0.004)
        rnd = random.Random(9)
        for i in range(9):
            clump(rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3), 1.05, 0.18, mats, n=10, seed=200 + i, leaf=0.4, squash=0.6)
        for sx in (-1, 1):
            for sy in (-1, 1):
                for k in range(4):
                    clump(sx * 0.32, sy * 0.32, 0.25 + k * 0.2, 0.08, mats, n=5, seed=300 + k + sx * 7 + sy * 3, leaf=0.4)
        petal, crownm = pm('pf_petal', '#f4f0f8'), pm('pf_corona', '#6a3aa8')
        for i in range(6):
            a = i * 1.05
            x, y = math.cos(a) * 0.38, math.sin(a) * 0.38
            ball(uid('petal'), 0.05, (x, y, 1.0), petal, scale=(1, 1, 0.2), segs=10)
            ball(uid('cor'), 0.03, (x, y, 1.012), crownm, scale=(1, 1, 0.3), segs=10)
    grass(random.Random(7), 5)
    finish('passion_fruit_tree', tex=1024)


MODELS = {tid: (lambda t=tid: fruit_tree(t)) for tid in TREES}
MODELS['banana_tree'] = banana_tree
MODELS['papaya_tree'] = papaya_tree
MODELS['dragon_fruit_tree'] = dragon_fruit_tree
MODELS['passion_fruit_tree'] = passion_fruit_tree
MODELS['coconut_palm'] = lambda: palm_tree('coconut_palm', '#4c9a38')
MODELS['date_palm'] = lambda: palm_tree('date_palm', '#5a8a3a')
MODELS['oak'] = lambda: oak_tree('oak', '#4a9a32', 1.0, 3)
MODELS['tree_obs0'] = lambda: wild_tree(0)
MODELS['tree_obs1'] = lambda: wild_tree(1)

if __name__ == '__main__':
    main(MODELS)
