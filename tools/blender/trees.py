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
from kit import anim_group, ball, bark_mat, clump, cyl, finish, leaf_mats, main, palm, pm, torus, uid  # noqa: E402

SHAPES = {
    'round': [(0, 0, 0.82, 0.36), (-0.21, 0.06, 0.72, 0.26), (0.22, -0.05, 0.74, 0.26), (0.04, 0.18, 0.98, 0.24),
              (-0.06, -0.2, 0.95, 0.23), (0.12, 0.17, 0.68, 0.22)],
    'citrus': [(0, 0, 0.8, 0.4), (0.18, -0.12, 0.92, 0.22), (-0.18, 0.1, 0.94, 0.22), (0, 0.05, 1.1, 0.2), (0.1, 0.16, 0.7, 0.2)],
    'tall': [(0, 0, 0.74, 0.32), (0, 0.02, 1.0, 0.3), (0.13, -0.1, 0.87, 0.22), (-0.13, 0.1, 0.86, 0.22), (0, 0, 1.22, 0.2)],
    'broad': [(0, 0, 0.86, 0.34), (-0.3, 0.05, 0.78, 0.26), (0.3, -0.05, 0.78, 0.26), (0, 0.26, 0.8, 0.24), (0.02, -0.25, 0.84, 0.24)],
    'bushy': [(0, 0, 0.66, 0.34), (-0.23, 0.1, 0.56, 0.26), (0.23, -0.1, 0.57, 0.26), (0.05, 0.1, 0.9, 0.26), (0, -0.2, 0.8, 0.22)],
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
    'nectarine_tree': ('round', '#52a036', None, 1),
    'chestnut_tree': ('round', '#3a7a2c', None, 1),
    'papaya_tree': ('tall', '#3a8a3a', None, 1),
    'kumquat_tree': ('citrus', '#2a7a30', None, 1),
    'guava_tree': ('broad', '#469636', None, 1),
    'pistachio_tree': ('bushy', '#6a9a4a', None, 1),
    'elderberry_tree': ('bushy', '#3a8a36', None, 1),
    'dragon_fruit_tree': ('tall', '#4a9a3a', None, 1),
    'pecan_tree': ('round', '#3a762c', None, 1),
    'blood_orange_tree': ('citrus', '#2a7a2e', None, 1),
    'jackfruit_tree': ('broad', '#2a7a30', None, 1),
    'macadamia_tree': ('round', '#3a8a36', None, 1),
    'yuzu_tree': ('citrus', '#358a36', None, 1),
    'passion_fruit_tree': ('bushy', '#3a8a36', None, 1),
    'cashew_tree': ('broad', '#469636', None, 1),
    'white_peach_tree': ('round', '#52a036', ('#fbe8ee',), 1),
    'loquat_tree': ('broad', '#3a7a2e', None, 1),
    'crabapple_tree': ('round', '#4a9a32', ('#f8c8d8', '#f07aa0'), 1),
    'cinnamon_tree': ('tall', '#2f7a32', None, 1),
    'mangosteen_tree': ('round', '#2a6a2e', None, 1),
    'durian_tree': ('broad', '#3a7a2c', None, 1),
    'black_cherry_tree': ('round', '#3a7a36', None, 1),
    'silver_pear_tree': ('tall', '#8aa890', None, 1),
}


def trunk(bark, s, rnd, shape):
    """Flared trunk with roots and two limbs reaching into the crown."""
    h = (0.36 if shape == 'bushy' else 0.55) * s
    if shape == 'olive':
        # two twisting stems leaning apart
        for k, lean in enumerate((0.22, -0.18)):
            cyl(uid('tr'), 0.06 * s, h * 1.1, (lean * 0.25 * s, 0, h * 0.55), bark, verts=10, r2=0.045 * s, rot=(0, lean, k * 0.8))
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


MODELS = {tid: (lambda t=tid: fruit_tree(t)) for tid in TREES}
MODELS['banana_tree'] = banana_tree
MODELS['coconut_palm'] = lambda: palm_tree('coconut_palm', '#4c9a38')
MODELS['date_palm'] = lambda: palm_tree('date_palm', '#5a8a3a')
MODELS['oak'] = lambda: oak_tree('oak', '#4a9a32', 1.0, 3)
MODELS['tree_obs0'] = lambda: wild_tree(0)
MODELS['tree_obs1'] = lambda: wild_tree(1)

if __name__ == '__main__':
    main(MODELS)
