# Production buildings: one cozy shop shell per building, each with its own walls, roof color,
# awning and a signature piece that says what it makes (an oven, a windmill, a giant cone...).
# Run: python3 tools/blender/production.py [names...]   (see kit.main)
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import (Face, anim_group, capture, flat_roof, place, awning, ball, barrel, box, chimney, crate, cyl, door, finish, foundation, lantern,  # noqa: E402
                 main, marker, milk_can, move_all, pm, potted_plant, prism, profile_roof, sack, shingles, sign, std, torus,
                 uid, walls, window)
from common import obox  # noqa: E402

W, D = 1.44, 1.1          # shop body; it sits back on the 2x2 footprint to leave a front yard
BACK = 0.14               # how far the body is pushed back
B = 0.1                   # foundation height


def shop(m, wall, roof, door_c, aw=None, style='clap', extra=None, H=0.92, rise=0.5, door_u=-0.34, flowers=None,
         shutters=None, chim=True, sign_board=None, seed=3, win_u=0.3, aw_u=None, kind='side', over=0.12):
    """The shared shell: foundation, walls, a shingled gable roof, door with a sign above it
    (the game hangs the product icon there), a front window under a striped awning, side
    windows, a chimney that smokes while the shop works and a lantern by the door."""
    foundation(W, D, B, m['stone'], m['mortar'], seed=seed)
    walls(W, D, H, B, style, wall, m['trim'], extra=extra)
    Z = B + H
    mats = shingles(uid('sh'), roof, spread=0.09)
    f = Face('front', W, D)
    # roof kinds: 'side' gable ends left and right, 'front' gable facing the yard, 'gambrel' a
    # barn roof, 'flat' a kiosk roof with a trimmed parapet (rooftop signs stand on it)
    if kind == 'flat':
        flat_roof(W, D, Z, over, mats[0], m['trim'])
        top = Z + 0.14
    elif kind == 'front':
        with capture() as rc:
            profile_roof(uid('roof'), D, Z, [(W / 2, 0.0), (0.0, rise)], over, mats, m['roofbase'], trim=m['trim'],
                         sw=0.12, rows_per_m=15, attic=wall, seed=seed)
        place(rc, 90)
        # a round attic window in the front gable
        cyl(uid('ow'), 0.1, 0.04, f.p(0, Z + rise * 0.36, 0.01), m['trim'], verts=20, rot=(math.radians(90), 0, 0))
        cyl(uid('owg'), 0.075, 0.04, f.p(0, Z + rise * 0.36, 0.025), m['glass'], verts=20, rot=(math.radians(90), 0, 0), bev=0.004)
        f.box(0, Z + rise * 0.36, 0.05, 0.15, 0.018, 0.01, m['trim'], bev=0)
        f.box(0, Z + rise * 0.36, 0.05, 0.018, 0.15, 0.01, m['trim'], bev=0)
        top = Z + rise + 0.06
    else:
        prof = [(D / 2, 0.0), (0.0, rise)] if kind == 'side' else [(D / 2, 0.0), (D / 2 * 0.6, rise * 0.62), (0.0, rise)]
        profile_roof(uid('roof'), W, Z, prof, over, mats, m['roofbase'], trim=m['trim'], sw=0.12, rows_per_m=15,
                     attic=wall, seed=seed)
        top = Z + rise + 0.06
    door(f, door_u, B, 0.3, 0.56, m, door_c, style='panel')
    sign(f, door_u, B + 0.75, 0.3, 0.26, sign_board or pm('signboard', '#f6ead0'), m['wood_dark'])
    window(f, win_u, B + 0.45, 0.36, 0.3, m, shutters=shutters, flowerbox=flowers is not None, flowers=flowers)
    if aw:
        awning(f, aw_u if aw_u is not None else win_u, B + 0.8, 0.6, 0.26, aw[0], aw[1], stripes=7, drop=0.13)
    for side in ('left', 'right'):
        sf = Face(side, W, D)
        window(sf, 0, B + 0.45, 0.3, 0.28, m, shutters=shutters)
    if chim:
        if kind == 'flat':
            chimney(0.46, 0.3, Z + 0.05, 0.3, m['brick'], m['stone'][0], m['mortar'])
        else:
            chimney(0.4 if kind == 'side' else 0.34, 0.26, Z + 0.05, rise + 0.22, m['brick'], m['stone'][0], m['mortar'])
    lantern(door_u + 0.26, -D / 2 - 0.05, B + 0.5, m)
    # stepping stones to the door
    for i, k in enumerate((0.12, 0.3)):
        cyl(uid('step'), 0.09 - i * 0.01, 0.03, (door_u + (0.02 if i else 0), -D / 2 - k, 0.015), m['stone'][i], verts=10)
    return f, Z, top


def done(name, glow=('glass', 'glass_hi', 'lamp')):
    move_all((0, BACK, 0))
    finish(name, tex=1024, glow=glow)


def front_y(k=0.0):
    """y in the front yard, k past the front wall (before the final move back)."""
    return -D / 2 - k


# ---------------------------------------------------------------- the shops

def bakery():
    m = std()
    wall = pm('bk_wall', '#e8bf72', '#f2cd86', scale=10)
    f, Z, top = shop(m, wall, '#b8352a', pm('bk_door', '#7a3e1e'), aw=(pm('bk_aw1', '#c8302a'), pm('bk_aw2', '#f6ead6')),
         style='plaster', extra=m['wood_dark'], flowers=[pm('bk_f1', '#e8304a'), pm('bk_f2', '#f0c020')], seed=11)
    # a bread table in the yard, flour sacks by the door and a pretzel hanging from a bracket
    y = front_y(0.3)
    box(uid('tbl'), (0.46, 0.24, 0.03), (0.34, y, 0.3), m['wood'], bev=0.008)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('tl'), (0.025, 0.025, 0.29), (0.34 + sx * 0.2, y + sy * 0.09, 0.145), m['wood_dark'], bev=0)
    crust = pm('crust', '#b8702a', '#d08a3a', scale=24)
    for i, (x, sy) in enumerate([(0.18, -0.03), (0.3, 0.04), (0.42, -0.02), (0.52, 0.05)]):
        ball(uid('loaf'), 0.05, (x, y + sy, 0.34), crust, scale=(1.4, 0.8, 0.7), segs=12)
    cloth = pm('flour', '#efe6d2', '#fff8e8', scale=30)
    for x, yy, z, sz in ((-0.62, 0.0, 0.0, 0.075), (-0.48, 0.03, 0.0, 0.07), (-0.56, 0.01, 0.14, 0.065)):
        sack(x, front_y(0.12) + yy, z, sz, cloth)
    f = Face('front', W, D)
    obox(uid('brk'), f.p(0.62, B + 0.74, 0.14), ((0, -1, 0), (0, 0, 1), (1, 0, 0)), (0.26, 0.025, 0.025), m['iron'], bev=0.004)
    for s in (-1, 1):
        torus(uid('pz'), 0.05, 0.018, f.p(0.62 + s * 0.035, B + 0.6, 0.24), crust, rot=(math.radians(90), 0, 0), segs=16, rsegs=6)
    torus(uid('pz'), 0.07, 0.018, f.p(0.62, B + 0.64, 0.24), crust, rot=(math.radians(90), 0, 0), segs=18, rsegs=6)
    done('bakery')


def feed_mill():
    m = std()
    wall = pm('fm_wall', '#c9964e', '#dca862', scale=6, kind='wave', stretch=(8, 8, 1))
    f, Z, top = shop(m, wall, '#4f8a2a', pm('fm_door', '#3f6a24'), style='batten', extra=pm('fm_bat', '#a8763a'),
         aw=None, chim=False, seed=12, H=0.96, kind='gambrel', rise=0.62)
    # windmill sails on the right gable, turning while the mill works
    cx = W / 2 + 0.1
    hub = (cx, 0.0, B + 0.96 + 0.3)
    cyl(uid('axle'), 0.03, 0.2, (cx - 0.06, 0, hub[2]), m['wood_dark'], verts=10, rot=(0, math.radians(90), 0))
    sail = pm('fm_sail', '#f4ead6', '#fffaf0', scale=20)
    sail_frame = pm('fm_frame', '#b8302a')
    with anim_group('spinX_sails', hub):
        cyl(uid('hub'), 0.06, 0.06, hub, m['iron'], verts=14, rot=(0, math.radians(90), 0))
        for k in range(4):
            a = math.radians(45 + k * 90)
            d = (0, math.cos(a), math.sin(a))
            p = lambda r: (hub[0] + 0.02, hub[1] + d[1] * r, hub[2] + d[2] * r)  # noqa: E731
            perp = (0, -d[2], d[1])
            obox(uid('arm'), p(0.31), (d, perp, (1, 0, 0)), (0.62, 0.045, 0.04), m['wood_dark'], bev=0.006)
            q = p(0.38)
            obox(uid('sail'), (q[0] + 0.02, q[1] + perp[1] * 0.095, q[2] + perp[2] * 0.095), (d, perp, (1, 0, 0)),
                 (0.44, 0.18, 0.014), sail, bev=0.004)
            for k2 in range(5):
                r2 = 0.18 + k2 * 0.1
                obox(uid('lat'), (p(r2)[0] + 0.03, p(r2)[1] + perp[1] * 0.08, p(r2)[2] + perp[2] * 0.08), (perp, d, (1, 0, 0)),
                     (0.19, 0.016, 0.012), sail_frame, bev=0)
    # a grain hopper, sacks of feed and a hay bale
    y = front_y(0.28)
    cyl(uid('hop'), 0.16, 0.22, (0.4, y, 0.42), m['metal'], verts=16, r2=0.05)
    for sx in (-1, 1):
        box(uid('hl'), (0.025, 0.025, 0.32), (0.4 + sx * 0.1, y, 0.16), m['wood_dark'], bev=0)
    box(uid('trough'), (0.3, 0.14, 0.08), (0.4, y - 0.02, 0.04), m['wood'], bev=0.01)
    ball(uid('grain'), 0.1, (0.4, y - 0.02, 0.08), m['hay'], scale=(1.3, 0.55, 0.35), segs=12)
    feed = pm('feed_sack', '#d8c49a', '#e8d6ae', scale=30)
    for x, yy, z in ((-0.62, 0.0, 0.0), (-0.48, 0.02, 0.0), (-0.55, 0.01, 0.14)):
        sack(x, front_y(0.12) + yy, z, 0.07, feed)
    done('feed_mill')


def dairy():
    m = std()
    wall = pm('dy_wall', '#f2f0ea', '#fbfaf6', scale=30, kind='wave', stretch=(1, 1, 8))
    blue = pm('dy_blue', '#2a64b8')
    f, Z, top = shop(m, wall, '#2a64b8', blue, aw=(blue, pm('dy_aw2', '#f6f4ee')), shutters=blue,
         flowers=[pm('dy_f1', '#f0c020'), pm('dy_f2', '#ffffff')], seed=13, kind='front', rise=0.62)
    # a giant milk bottle on the ridge and a cart of milk churns
    milk = pm('milk', '#fbfbf6')
    cyl(uid('btl'), 0.13, 0.3, (0, 0, top + 0.15), milk, verts=20)
    cyl(uid('btl'), 0.13, 0.12, (0, 0, top + 0.36), milk, verts=20, r2=0.06)
    cyl(uid('cap'), 0.07, 0.06, (0, 0, top + 0.45), blue, verts=16)
    cyl(uid('lbl'), 0.134, 0.1, (0, 0, top + 0.16), blue, verts=20, bev=0)
    y = front_y(0.3)
    box(uid('cart'), (0.44, 0.26, 0.05), (0.38, y, 0.18), m['wood'], bev=0.01)
    for sx in (-1, 1):
        cyl(uid('wh'), 0.09, 0.03, (0.38 + sx * 0.2, y, 0.1), m['wood_dark'], verts=16, rot=(0, math.radians(90), 0))
    box(uid('hdl'), (0.03, 0.3, 0.03), (0.38, y - 0.25, 0.22), m['wood_dark'], rot=(math.radians(-15), 0, 0), bev=0)
    for x in (0.27, 0.49):
        milk_can(x, y, 0.2, m)
    milk_can(-0.6, front_y(0.12), 0.0, m)
    done('dairy')


def sugar_mill():
    m = std()
    wall = pm('sm_wall', '#e08aaa', '#ec9cb8', scale=10)
    roof = '#983a78'
    f, Z, top = shop(m, wall, roof, pm('sm_door', '#7a2a5a'), aw=(pm('sm_aw1', '#c83a7a'), pm('sm_aw2', '#fbeef4')),
         style='brick', extra=m['brick'], seed=14, H=1.04)
    # a cane crusher: a post with a sweep arm that turns while the mill works
    y = front_y(0.32)
    px = 0.42
    cyl(uid('base'), 0.16, 0.08, (px, y, 0.04), m['stone'][0], verts=18)
    cyl(uid('roll'), 0.07, 0.28, (px, y, 0.22), m['metal'], verts=14)
    with anim_group('spinY_sweep', (px, y, 0.4)):
        cyl(uid('cap'), 0.05, 0.06, (px, y, 0.39), m['iron'], verts=12)
        box(uid('sweep'), (0.5, 0.035, 0.035), (px, y, 0.4), m['wood_dark'], bev=0.006)
    # bundles of sugar cane and a candy striped post
    cane = pm('cane', '#6aa83a', '#8cc04a', scale=8, kind='wave', stretch=(1, 1, 8))
    for bx_, by in ((-0.62, front_y(0.1)), (-0.46, front_y(0.16))):
        for k in range(6):
            a = k * 1.05
            cyl(uid('cn'), 0.014, 0.42, (bx_ + math.cos(a) * 0.03, by + math.sin(a) * 0.03, 0.21), cane, verts=6,
                rot=(math.sin(a) * 0.08, math.cos(a) * 0.08, 0))
        torus(uid('tie'), 0.05, 0.008, (bx_, by, 0.2), m['rope'], segs=14, rsegs=5)
    red, white = pm('cc_red', '#d8283a'), pm('cc_white', '#fbf6f2')
    for k in range(8):
        cyl(uid('cc'), 0.025, 0.06, (0.7, front_y(0.1), 0.03 + k * 0.06), red if k % 2 else white, verts=10, bev=0)
    ball(uid('ccb'), 0.03, (0.7, front_y(0.1), 0.5), red, segs=10)
    done('sugar_mill')


def bbq_grill():
    m = std()
    logs = pm('logs', '#8a5a30', '#a26c3c', scale=6, kind='wave', stretch=(1, 8, 1))
    f, Z, top = shop(m, logs, '#4a3a30', pm('bq_door', '#5a2a1a'), aw=(pm('bq_aw1', '#c8302a'), pm('bq_aw2', '#2a2a2e')),
         style='log', extra=logs, seed=15, shutters=pm('bq_sh', '#8a2a1e'), rise=0.38, over=0.16)
    # a big barrel grill with smoke, a picnic table with a checked cloth and a woodpile
    y = front_y(0.3)
    gx = 0.38
    cyl(uid('grill'), 0.13, 0.46, (gx, y, 0.34), m['iron'], verts=20, rot=(0, math.radians(90), 0))
    box(uid('grate'), (0.44, 0.24, 0.02), (gx, y, 0.35), pm('ember', '#e85a1a'), bev=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('gl'), (0.025, 0.025, 0.26), (gx + sx * 0.18, y + sy * 0.08, 0.13), m['iron'], bev=0)
    cyl(uid('stack'), 0.03, 0.2, (gx + 0.16, y + 0.08, 0.52), m['iron'], verts=10)
    marker('smoke_grill', (gx + 0.16, y + 0.08, 0.64))
    check = pm('check', '#d8303a')
    box(uid('ptb'), (0.36, 0.2, 0.03), (-0.5, y, 0.24), m['wood'], bev=0.008)
    for k in range(3):
        box(uid('ck'), (0.36, 0.05, 0.004), (-0.5, y - 0.06 + k * 0.06, 0.257), check, bev=0)
    for sx in (-1, 1):
        box(uid('pl'), (0.025, 0.18, 0.025), (-0.5 + sx * 0.14, y, 0.12), m['wood_dark'], rot=(math.radians(20), 0, 0), bev=0)
        box(uid('bn'), (0.36, 0.07, 0.025), (-0.5, y + sx * 0.17, 0.14), m['wood'], bev=0.006)
    for k in range(5):
        cyl(uid('wd'), 0.03, 0.2, (0.72, front_y(0.05) - (k % 3) * 0.06, 0.03 + (k // 3) * 0.055), logs, verts=8,
            rot=(0, math.radians(90), 0))
    done('bbq_grill', glow=('glass', 'glass_hi', 'lamp', 'ember'))


def juice_press():
    m = std()
    wall = pm('jp_wall', '#f0b43a', '#f8c450', scale=30, kind='wave', stretch=(1, 1, 8))
    orange = pm('jp_orange', '#e8701e')
    f, Z, top = shop(m, wall, '#d8601a', pm('jp_door', '#2a8a4a'), aw=(orange, pm('jp_aw2', '#fff6e0')), seed=16,
         flowers=[pm('jp_f1', '#e8304a'), pm('jp_f2', '#ffffff')], kind='front', rise=0.6)
    # a giant juice glass with a straw on the ridge
    glass = pm('jglass', '#f8a830', rough=0.2)
    cyl(uid('jg'), 0.12, 0.3, (0, 0, top + 0.15), glass, verts=20, r2=0.14)
    cyl(uid('jgr'), 0.145, 0.03, (0, 0, top + 0.3), pm('jrim', '#fff8ea'), verts=20)
    box(uid('straw'), (0.025, 0.025, 0.32), (0.05, 0, top + 0.38), pm('straw', '#e8304a'), rot=(0, math.radians(18), 0), bev=0)
    ball(uid('slice'), 0.07, (-0.12, 0, top + 0.3), orange, scale=(1, 0.25, 1), segs=14)
    # a fruit press and crates of fruit
    y = front_y(0.3)
    barrel(0.42, y, 0.0, 0.11, 0.24, m, lid=False)
    for sx in (-1, 1):
        box(uid('pp'), (0.03, 0.03, 0.5), (0.42 + sx * 0.14, y, 0.25), m['wood_dark'], bev=0)
    box(uid('pbeam'), (0.34, 0.05, 0.05), (0.42, y, 0.48), m['wood_dark'], bev=0.006)
    cyl(uid('screw'), 0.018, 0.22, (0.42, y, 0.37), m['iron'], verts=8)
    ball(uid('pulp'), 0.1, (0.42, y, 0.23), orange, scale=(1, 1, 0.4), segs=12)
    crate(-0.55, front_y(0.2), 0, 0.24, m, fill=[orange], rot=0.1)
    crate(-0.55, front_y(0.2), 0.2, 0.22, m, fill=[pm('jp_apple', '#c8201c')], rot=-0.1)
    done('juice_press')


def loom():
    m = std()
    wall = pm('lm_wall', '#b89ad8', '#c8aee6', scale=10)
    f, Z, top = shop(m, wall, '#6c4a9a', pm('lm_door', '#4a2a6a'), aw=(pm('lm_aw1', '#7c4ab0'), pm('lm_aw2', '#f6eefc')),
         style='plaster', extra=m['wood_dark'], seed=17, flowers=[pm('lm_f1', '#f0c020'), pm('lm_f2', '#ffffff')], kind='gambrel', rise=0.6)
    # a spinning wheel that turns while the loom works, and a basket of yarn
    y = front_y(0.28)
    wx = 0.4
    box(uid('swb'), (0.36, 0.1, 0.04), (wx, y, 0.1), m['wood'], bev=0.008)
    for sx in (-1, 1):
        box(uid('swl'), (0.03, 0.03, 0.12), (wx + sx * 0.14, y, 0.04), m['wood_dark'], bev=0)
    for sx in (-1, 1):
        box(uid('swp'), (0.025, 0.025, 0.34), (wx + 0.05, y + sx * 0.04, 0.28), m['wood_dark'], bev=0)
    with anim_group('spinX_wheel', (wx + 0.05, y, 0.36)):
        torus(uid('rim'), 0.16, 0.014, (wx + 0.05, y, 0.36), m['wood'], rot=(0, math.radians(90), 0), segs=28, rsegs=6)
        for k in range(6):
            a = k * math.pi / 3
            obox(uid('spk'), (wx + 0.05, y + math.cos(a) * 0.08, 0.36 + math.sin(a) * 0.08),
                 ((0, math.cos(a), math.sin(a)), (0, -math.sin(a), math.cos(a)), (1, 0, 0)), (0.16, 0.012, 0.012), m['wood_dark'], bev=0)
        cyl(uid('hub'), 0.025, 0.04, (wx + 0.05, y, 0.36), m['iron'], verts=10, rot=(0, math.radians(90), 0))
    ball(uid('fleece'), 0.05, (wx - 0.12, y, 0.2), pm('fleece', '#f6f2ea', '#ffffff', scale=40), scale=(1, 1, 0.8), segs=10)
    cyl(uid('bsk'), 0.13, 0.1, (-0.55, front_y(0.18), 0.05), m['hay'], verts=16, r2=0.15)
    yarns = [pm('y1', '#d8304a'), pm('y2', '#2a78c8'), pm('y3', '#f0b020'), pm('y4', '#3aa84a'), pm('y5', '#9a4ac8')]
    for k in range(6):
        a = k * 1.1
        ball(uid('yarn'), 0.05, (-0.55 + math.cos(a) * 0.06, front_y(0.18) + math.sin(a) * 0.06, 0.13 + (k % 2) * 0.04),
             yarns[k % 5], segs=12)
    done('loom')


def jam_maker():
    m = std()
    wall = pm('jm_wall', '#e88a96', '#f09ca6', scale=30, kind='wave', stretch=(1, 1, 8))
    f, Z, top = shop(m, wall, '#b02a3a', pm('jm_door', '#6a1a2a'), aw=(pm('jm_aw1', '#c8283a'), pm('jm_aw2', '#fff6f4')),
         shutters=pm('jm_sh', '#f6f0ea'), seed=18, kind='front', rise=0.6)
    # a copper pot on a fire, a shelf of jars and a basket of strawberries
    y = front_y(0.3)
    px = 0.42
    for k in range(5):
        a = k * 1.25
        cyl(uid('fw'), 0.02, 0.18, (px + math.cos(a) * 0.05, y + math.sin(a) * 0.05, 0.03), m['wood_dark'], verts=6,
            rot=(0, math.radians(90), a))
    ball(uid('fire'), 0.06, (px, y, 0.05), pm('fire', '#f07a1a'), scale=(1, 1, 0.6), segs=10)
    for sx in (-1, 1):
        box(uid('tri'), (0.02, 0.02, 0.5), (px + sx * 0.18, y, 0.24), m['iron'], rot=(0, sx * 0.25, 0), bev=0)
    box(uid('bar'), (0.42, 0.02, 0.02), (px, y, 0.48), m['iron'], bev=0)
    copper = pm('copper', '#c8703a', '#e08a4a', scale=20, rough=0.3, metal=0.6)
    cyl(uid('pot'), 0.12, 0.14, (px, y, 0.25), copper, verts=20, r2=0.14)
    cyl(uid('jam'), 0.13, 0.01, (px, y, 0.32), pm('jamred', '#9a1a2a'), verts=20, bev=0)
    marker('smoke_pot', (px, y, 0.36))
    shelf_y = front_y(0.1)
    box(uid('shelf'), (0.34, 0.12, 0.03), (-0.5, shelf_y, 0.3), m['wood'], bev=0.006)
    box(uid('shelf'), (0.34, 0.12, 0.03), (-0.5, shelf_y, 0.12), m['wood'], bev=0.006)
    for sx in (-1, 1):
        box(uid('sl'), (0.025, 0.12, 0.34), (-0.5 + sx * 0.16, shelf_y, 0.17), m['wood_dark'], bev=0)
    jams = [pm('j1', '#b01a2a', rough=0.2), pm('j2', '#6a1a6a', rough=0.2), pm('j3', '#e8801a', rough=0.2)]
    gingham = pm('gingham', '#e8404a')
    for z in (0.135, 0.315):
        for k in range(3):
            x = -0.6 + k * 0.1
            cyl(uid('jar'), 0.035, 0.08, (x, shelf_y, z + 0.04), jams[(k + int(z * 10)) % 3], verts=12)
            cyl(uid('lid'), 0.042, 0.015, (x, shelf_y, z + 0.09), gingham, verts=12, bev=0)
    done('jam_maker', glow=('glass', 'glass_hi', 'lamp', 'fire'))


def ice_cream():
    m = std()
    wall = pm('ic_wall', '#8ecfee', '#a2dcf6', scale=30, kind='wave', stretch=(1, 1, 8))
    pink = pm('ic_pink', '#e8649a')
    f, Z, top = shop(m, wall, '#e0588e', pm('ic_door', '#2a6aa8'), aw=(pink, pm('ic_aw2', '#fff6fa')), seed=19,
         flowers=[pm('ic_f1', '#f0c020'), pink], kind='flat')
    # a giant cone with three scoops on the ridge
    top -= 0.02
    cone = pm('cone', '#d8a050', '#e8b868', scale=40)
    cyl(uid('cone'), 0.02, 0.3, (0, 0, top + 0.15), cone, verts=16, r2=0.12)
    for k, (c, dx, dz) in enumerate([('#fbe8d8', -0.07, 0.32), ('#e8649a', 0.07, 0.32), ('#6a3a22', 0.0, 0.42)]):
        ball(uid('scoop'), 0.1, (dx, 0, top + dz), pm(f'scoop{k}', c), segs=14)
    ball(uid('cherry'), 0.035, (0.0, 0, top + 0.53), pm('cherry', '#d8182a'), segs=10)
    # a bistro table under a striped parasol and a cart
    y = front_y(0.32)
    tx = 0.4
    cyl(uid('tbl'), 0.13, 0.02, (tx, y, 0.26), pm('ic_tbl', '#f6f6f2'), verts=18)
    cyl(uid('tl'), 0.015, 0.26, (tx, y, 0.13), m['iron'], verts=8)
    cyl(uid('pole'), 0.012, 0.66, (tx, y, 0.45), m['iron'], verts=8)
    for k in range(8):
        a = k * math.pi / 4
        c = pink if k % 2 else pm('ic_para2', '#fff6fa')
        obox(uid('par'), (tx + math.cos(a + 0.39) * 0.12, y + math.sin(a + 0.39) * 0.12, 0.74),
             ((math.cos(a + 0.39), math.sin(a + 0.39), -0.35), (-math.sin(a + 0.39), math.cos(a + 0.39), 0), (0.3, 0, 0.95)),
             (0.26, 0.1, 0.01), c, bev=0)
    for sx in (-1, 1):
        cyl(uid('ch'), 0.06, 0.02, (tx + sx * 0.22, y, 0.18), pink, verts=14)
        cyl(uid('chl'), 0.01, 0.18, (tx + sx * 0.22, y, 0.09), m['iron'], verts=6)
    box(uid('cart'), (0.3, 0.2, 0.22), (-0.55, front_y(0.18), 0.17), pm('ic_cart', '#f6f6f2'), bev=0.02)
    box(uid('cartb'), (0.32, 0.22, 0.03), (-0.55, front_y(0.18), 0.29), pink, bev=0.01)
    for sx in (-1, 1):
        cyl(uid('cw'), 0.06, 0.02, (-0.55 + sx * 0.12, front_y(0.18) - 0.1, 0.06), m['iron'], verts=14, rot=(math.radians(90), 0, 0))
    done('ice_cream')


def sushi_bar():
    m = std()
    wall = pm('su_wall', '#efe4d0', '#f8efde', scale=10)
    navy = pm('navy', '#23324a')
    f, Z, top = shop(m, wall, '#2f4458', pm('su_door', '#6a3a22'), aw=None, style='plaster', extra=pm('su_beam', '#3a2418'), seed=20, rise=0.4, over=0.2)
    f = Face('front', W, D)
    # a split noren curtain over the door and red paper lanterns
    for k in range(3):
        f.box(-0.34 - 0.1 + k * 0.1, B + 0.5, 0.07, 0.09, 0.16, 0.01, navy, bev=0.002)
    f.box(-0.34, B + 0.59, 0.07, 0.34, 0.02, 0.02, m['wood_dark'], bev=0)
    red = pm('lantern_red', '#d8283a', emit=1.0)
    for u in (0.08, 0.58):
        ball(uid('pl'), 0.07, f.p(u, B + 0.72, 0.12), red, scale=(1, 1, 1.25), segs=14)
        for dz in (-0.09, 0.09):
            cyl(uid('plc'), 0.035, 0.02, f.p(u, B + 0.72 + dz, 0.12), m['iron'], verts=10, bev=0)
        marker(uid('glow'), (f.p(u, 0, 0.3)[0], f.p(u, 0, 0.3)[1], 0))
    # bamboo in a planter, a koi streamer on a pole
    bamboo = pm('bamboo', '#5a9a2a', '#7ab83a', scale=6, kind='wave', stretch=(1, 1, 8))
    box(uid('planter'), (0.3, 0.14, 0.12), (0.42, front_y(0.2), 0.06), m['wood_dark'], bev=0.01)
    for k in range(5):
        h = 0.45 + (k % 3) * 0.12
        cyl(uid('bb'), 0.014, h, (0.3 + k * 0.06, front_y(0.2), 0.12 + h / 2), bamboo, verts=8)
        ball(uid('bl'), 0.04, (0.3 + k * 0.06, front_y(0.2), 0.14 + h), m['leaf'], scale=(1.4, 0.7, 0.5), segs=8)
    cyl(uid('kp'), 0.015, 1.0, (-0.66, front_y(0.1), 0.5), m['wood_dark'], verts=8)
    with anim_group('swayY_koi', (-0.66, front_y(0.1), 0.9)):
        koi = pm('koi', '#e8502a')
        cyl(uid('koi'), 0.05, 0.3, (-0.66 + 0.16, front_y(0.1), 0.9), koi, verts=12, r2=0.025, rot=(0, math.radians(90), 0))
        ball(uid('ke'), 0.012, (-0.66 + 0.04, front_y(0.1) - 0.045, 0.91), pm('koi_eye', '#1a1a1a'), segs=8)
    done('sushi_bar', glow=('glass', 'glass_hi', 'lamp', 'lantern_red'))


def salad_bar():
    m = std()
    wall = pm('sb_wall', '#8cc05a', '#9cd06a', scale=6, kind='wave', stretch=(8, 8, 1))
    green = pm('sb_green', '#3a8a2a')
    f, Z, top = shop(m, wall, '#3f7a2a', pm('sb_door', '#f6f0e2'), aw=(green, pm('sb_aw2', '#f8f6ee')), style='batten',
         extra=pm('sb_bat', '#6aa840'), seed=21, flowers=[pm('sb_f1', '#e8304a'), pm('sb_f2', '#f0c020')], kind='front', rise=0.56)
    # crates of vegetables and a chalkboard menu
    tom, let, car = pm('tomato', '#d8281a'), pm('lettuce', '#6ab82a'), pm('carrot', '#e8701a')
    crate(0.3, front_y(0.24), 0, 0.24, m, fill=[tom], rot=0.08)
    crate(0.56, front_y(0.2), 0, 0.22, m, fill=[let], rot=-0.1, fill_r=0.045)
    crate(0.42, front_y(0.2), 0.2, 0.22, m, fill=[car, tom], rot=0.05)
    box(uid('chalk'), (0.24, 0.02, 0.3), (-0.6, front_y(0.2), 0.3), pm('chalkboard', '#2c3a30'), rot=(math.radians(-10), 0, 0), bev=0.006)
    box(uid('chalkf'), (0.28, 0.015, 0.34), (-0.6, front_y(0.2) + 0.01, 0.3), m['wood'], rot=(math.radians(-10), 0, 0), bev=0.006)
    for sx in (-1, 1):
        box(uid('easel'), (0.02, 0.02, 0.5), (-0.6 + sx * 0.1, front_y(0.2) + 0.03, 0.24), m['wood_dark'], rot=(math.radians(-10), 0, 0), bev=0)
    for k, c in enumerate((let, tom, car)):
        ball(uid('dot'), 0.02, (-0.66 + k * 0.06, front_y(0.2) - 0.02, 0.36), c, scale=(1, 0.3, 1), segs=8)
    done('salad_bar')


def pizzeria():
    m = std()
    wall = pm('pz_wall', '#e8b27a', '#f0c28c', scale=10)
    f, Z, top = shop(m, wall, '#b8352a', pm('pz_door', '#2a7a3a'), aw=(pm('pz_aw1', '#c8302a'), pm('pz_aw2', '#2a8a3a')),
         style='brick', extra=m['brick'], seed=22, shutters=pm('pz_sh', '#2a7a3a'), chim=False)
    # a domed brick oven out front with its own chimney and a glowing mouth
    ox, oy = 0.4, front_y(0.3)
    cyl(uid('obase'), 0.2, 0.16, (ox, oy, 0.08), m['stone'][1], verts=20)
    dome = pm('oven', '#b8583a', '#d06a48', scale=24)
    ball(uid('dome'), 0.19, (ox, oy, 0.16), dome, scale=(1, 1, 0.9), segs=18)
    ball(uid('mouth'), 0.08, (ox, oy - 0.16, 0.2), pm('fire', '#f07a1a'), scale=(1, 0.5, 0.8), segs=12)
    cyl(uid('och'), 0.04, 0.22, (ox + 0.06, oy + 0.08, 0.4), m['brick'][0], verts=10)
    marker('smoke_oven', (ox + 0.06, oy + 0.08, 0.53))
    # a giant pizza on the ridge and a stack of firewood
    cyl(uid('pz'), 0.2, 0.04, (0, -0.02, top + 0.2), pm('pz_crust', '#e0a050'), verts=24, rot=(math.radians(70), 0, 0))
    cyl(uid('pzs'), 0.17, 0.045, (0, -0.023, top + 0.2), pm('pz_cheese', '#f6c83a'), verts=24, rot=(math.radians(70), 0, 0), bev=0)
    pep = pm('pepperoni', '#b8281a')
    for a, r in ((0.3, 0.09), (2.0, 0.1), (3.9, 0.08), (5.2, 0.1), (1.1, 0.02)):
        x, z = math.cos(a) * r, math.sin(a) * r
        cyl(uid('pp'), 0.03, 0.05, (x, -0.03 - z * 0.34, top + 0.2 + z * 0.94), pep, verts=12, rot=(math.radians(70), 0, 0), bev=0)
    for x, z in ((-0.62, 0.03), (-0.5, 0.03), (-0.56, 0.085)):
        cyl(uid('wd'), 0.03, 0.22, (x, front_y(0.12), z), pm('pz_wood', '#8a5a30'), verts=8, rot=(math.radians(90), 0, 0))
    done('pizzeria', glow=('glass', 'glass_hi', 'lamp', 'fire'))


def coffee_kiosk():
    m = std()
    wall = pm('ck_wall', '#c89464', '#d8a476', scale=30, kind='wave', stretch=(1, 1, 8))
    brown = pm('ck_brown', '#5a341c')
    f, Z, top = shop(m, wall, '#5e3a22', pm('ck_door', '#2a5a4a'), aw=(brown, pm('ck_aw2', '#f6ead8')), seed=23,
         shutters=pm('ck_sh', '#2a5a4a'), kind='flat')
    # a giant steaming cup on the ridge
    cup = pm('cup', '#f8f6f0')
    cyl(uid('cup'), 0.14, 0.24, (0, 0, top + 0.12), cup, verts=22, r2=0.17)
    cyl(uid('cof'), 0.155, 0.01, (0, 0, top + 0.235), pm('coffee', '#4a2a14'), verts=22, bev=0)
    torus(uid('handle'), 0.06, 0.018, (0.17, 0, top + 0.13), cup, rot=(math.radians(90), 0, 0), segs=16, rsegs=6)
    cyl(uid('saucer'), 0.2, 0.03, (0, 0, top + 0.0), cup, verts=22)
    marker('smoke_cup', (0, 0, top + 0.3))
    # bistro table with two chairs and sacks of beans
    y = front_y(0.3)
    tx = 0.4
    cyl(uid('tbl'), 0.12, 0.02, (tx, y, 0.26), m['wood'], verts=18)
    cyl(uid('tl'), 0.015, 0.26, (tx, y, 0.13), m['iron'], verts=8)
    for sx in (-1, 1):
        cyl(uid('ch'), 0.06, 0.02, (tx + sx * 0.2, y, 0.17), m['wood'], verts=14)
        cyl(uid('chl'), 0.01, 0.17, (tx + sx * 0.2, y, 0.085), m['iron'], verts=6)
        box(uid('chb'), (0.02, 0.1, 0.12), (tx + sx * 0.26, y, 0.25), m['wood'], bev=0.006)
    cyl(uid('mug'), 0.025, 0.05, (tx + 0.03, y, 0.295), cup, verts=12)
    beans = pm('bean_sack', '#b89a6a', '#caa87a', scale=30)
    for x, yy, z in ((-0.6, 0.0, 0.0), (-0.47, 0.03, 0.0)):
        sack(x, front_y(0.14) + yy, z, 0.07, beans)
    ball(uid('bns'), 0.05, (-0.53, front_y(0.14), 0.17), pm('beans', '#4a2a14', '#6a3a1e', scale=60), scale=(1.2, 1, 0.4), segs=10)
    done('coffee_kiosk')


def oil_press():
    m = std()
    wall = pm('op_wall', '#e0c890', '#ead6a2', scale=10)
    f, Z, top = shop(m, wall, '#5a7a2a', pm('op_door', '#5a6a2a'), aw=(pm('op_aw1', '#6a8a2a'), pm('op_aw2', '#f6f0da')),
         style='plaster', extra=m['wood_dark'], seed=24, flowers=[pm('op_f1', '#8a4ac8'), pm('op_f2', '#ffffff')], rise=0.36, over=0.15)
    # a stone basin with an upright millstone rolling round it while the press works
    bx_, by = 0.4, front_y(0.3)
    cyl(uid('basin'), 0.2, 0.12, (bx_, by, 0.06), m['stone'][0], verts=22)
    cyl(uid('oil'), 0.17, 0.01, (bx_, by, 0.12), pm('olive_oil', '#c8b020', rough=0.2), verts=22, bev=0)
    cyl(uid('post'), 0.025, 0.36, (bx_, by, 0.3), m['wood_dark'], verts=10)
    with anim_group('spinY_mill', (bx_, by, 0.25)):
        cyl(uid('mill'), 0.1, 0.06, (bx_ + 0.09, by, 0.22), m['stone'][1], verts=20, rot=(0, math.radians(90), 0))
        box(uid('arm'), (0.4, 0.03, 0.03), (bx_ + 0.06, by, 0.25), m['wood_dark'], bev=0.006)
    # amphorae and a basket of olives
    clay = pm('clay', '#c0643a', '#d27848', scale=20)
    for x, yy in ((-0.62, 0.0), (-0.48, 0.04)):
        ball(uid('amph'), 0.07, (x, front_y(0.12) + yy, 0.12), clay, scale=(1, 1, 1.4), segs=14)
        cyl(uid('neck'), 0.03, 0.08, (x, front_y(0.12) + yy, 0.25), clay, verts=12)
        torus(uid('lip'), 0.032, 0.01, (x, front_y(0.12) + yy, 0.29), clay, segs=12, rsegs=5)
    cyl(uid('bsk'), 0.1, 0.08, (-0.55, front_y(0.3), 0.04), m['hay'], verts=16, r2=0.12)
    ol = [pm('olive1', '#4a5a1a'), pm('olive2', '#3a2a3a')]
    for k in range(8):
        a = k * 0.8
        ball(uid('ol'), 0.02, (-0.55 + math.cos(a) * 0.05, front_y(0.3) + math.sin(a) * 0.05, 0.09 + (k % 2) * 0.015), ol[k % 2], scale=(1, 1, 1.3), segs=8)
    done('oil_press')


def florist():
    m = std()
    wall = pm('fl_wall', '#f09ab8', '#f8accb', scale=30, kind='wave', stretch=(1, 1, 8))
    pink = pm('fl_pink', '#d8487e')
    blooms = [pm('b1', '#e8304a'), pm('b2', '#f0c020'), pm('b3', '#8a4ac8'), pm('b4', '#ffffff'), pm('b5', '#ff8a3a')]
    f, Z, top = shop(m, wall, '#c03a72', pm('fl_door', '#2a7a5a'), aw=(pink, pm('fl_aw2', '#fff4f8')), seed=25, flowers=blooms,
         shutters=pm('fl_sh', '#2a7a5a'), kind='front', rise=0.6)
    # buckets of cut flowers on tiered steps and a flower cart
    y = front_y(0.28)
    for k, (x, z) in enumerate(((0.26, 0.0), (0.42, 0.0), (0.58, 0.0), (0.34, 0.14), (0.5, 0.14))):
        if z:
            box(uid('step'), (0.4, 0.14, 0.14), (0.42, y + 0.1, 0.07), m['wood'], bev=0.01)
        yy = y + (0.1 if z else -0.06)
        cyl(uid('bucket'), 0.055, 0.1, (x, yy, z + 0.05), m['metal'], verts=14, r2=0.065)
        for j in range(6):
            a = j * 1.05
            cyl(uid('stem'), 0.006, 0.1, (x + math.cos(a) * 0.02, yy + math.sin(a) * 0.02, z + 0.13), m['leaf'], verts=5, bev=0)
            ball(uid('bl'), 0.028, (x + math.cos(a) * 0.035, yy + math.sin(a) * 0.035, z + 0.19 + (j % 2) * 0.02), blooms[(k + j) % 5], segs=10)
    potted_plant(-0.62, front_y(0.1), 0, m, pm('pot', '#c0643a'), bloom=blooms[0])
    potted_plant(-0.45, front_y(0.14), 0, m, pm('pot2', '#2a7a9a'), bloom=blooms[2])
    done('florist')


def workshop():
    m = std()
    wall = pm('ws_wall', '#b07a44', '#c08a52', scale=6, kind='wave', stretch=(8, 8, 1))
    blue = pm('ws_blue', '#2f5a88')
    f, Z, top = shop(m, wall, '#3f6a92', blue, style='batten', extra=m['wood_dark'], seed=26, door_u=-0.28, win_u=0.36,
                aw=(blue, pm('ws_aw2', '#f2ece0')), kind='gambrel', rise=0.6)
    # a sawhorse with a plank and a saw, a lumber pile, an anvil and a grindstone that turns
    y = front_y(0.3)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('shl'), (0.025, 0.025, 0.26), (0.36 + sx * 0.14, y + sy * 0.05, 0.12), m['wood_dark'], rot=(sy * 0.3, 0, 0), bev=0)
        box(uid('shb'), (0.05, 0.05, 0.04), (0.36 + sx * 0.14, y, 0.25), m['wood'], bev=0.006)
    box(uid('plank'), (0.5, 0.12, 0.03), (0.36, y, 0.29), m['wood'], bev=0.006)
    box(uid('saw'), (0.2, 0.005, 0.07), (0.3, y - 0.07, 0.33), m['metal'], rot=(0, 0.2, 0), bev=0)
    box(uid('sawh'), (0.06, 0.02, 0.05), (0.2, y - 0.07, 0.35), m['wood_dark'], bev=0.004)
    for k in range(4):
        box(uid('lum'), (0.06, 0.4, 0.05), (-0.7 + (k % 3) * 0.065, front_y(0.2), 0.025 + (k // 3) * 0.05), m['wood'], bev=0.006)
    ax, ay = -0.46, front_y(0.36)
    box(uid('stump'), (0.12, 0.12, 0.14), (ax, ay, 0.07), m['wood_dark'], bev=0.02)
    box(uid('anvil'), (0.16, 0.07, 0.05), (ax, ay, 0.17), m['iron'], bev=0.01)
    ball(uid('horn'), 0.035, (ax + 0.09, ay, 0.17), m['iron'], scale=(1.4, 0.8, 0.6), segs=10)
    gx, gy = 0.66, front_y(0.1)
    for sx in (-1, 1):
        box(uid('gf'), (0.025, 0.025, 0.28), (gx, gy + sx * 0.05, 0.14), m['wood_dark'], bev=0)
    with anim_group('spinZ_stone', (gx, gy, 0.26)):
        cyl(uid('gs'), 0.1, 0.04, (gx, gy, 0.26), m['stone'][2], verts=20, rot=(math.radians(90), 0, 0))
    done('workshop')



# ---------------------------------------------------------------- third wave workshops

def tea_house():
    m = std()
    wall = pm('th_wall', '#e0ecd0', '#ecf4e0', scale=10)
    green = pm('th_green', '#3a7a3a')
    f, Z, top = shop(m, wall, '#3a6a3a', pm('th_door', '#8a3a2a'), aw=(green, pm('th_aw2', '#f4f0e0')), style='plaster', extra=m['wood_dark'],
         seed=31, flowers=[pm('th_f1', '#f0c020'), pm('th_f2', '#ffffff')], kind='front', rise=0.55)
    # a big teapot on the roof, steam curling from its spout
    pot = pm('th_pot', '#f4f0e8', rough=0.3)
    ball(uid('pot'), 0.16, (0, 0, top + 0.14), pot, scale=(1, 1, 0.82), segs=18)
    cyl(uid('lid'), 0.07, 0.04, (0, 0, top + 0.27), pot, verts=16)
    ball(uid('knob'), 0.025, (0, 0, top + 0.3), green, segs=8)
    cyl(uid('spout'), 0.03, 0.18, (0.17, 0, top + 0.18), pot, verts=10, r2=0.018, rot=(0, math.radians(55), 0))
    torus(uid('handle'), 0.07, 0.018, (-0.17, 0, top + 0.15), pot, rot=(math.radians(90), 0, 0), segs=16, rsegs=6)
    for k in range(3):
        ball(uid('band'), 0.02, (math.cos(k * 2.1) * 0.15, math.sin(k * 2.1) * 0.15, top + 0.12), green, segs=8)
    marker('smoke_tea', (0.25, 0, top + 0.26))
    # a low table with cups and cushions out front, tea bushes in pots
    y = front_y(0.3)
    box(uid('tbl'), (0.3, 0.2, 0.03), (0.4, y, 0.15), m['wood_dark'], bev=0.008)
    for sx in (-1, 1):
        box(uid('tl'), (0.03, 0.18, 0.14), (0.4 + sx * 0.12, y, 0.07), m['wood_dark'], bev=0)
        box(uid('cush'), (0.12, 0.12, 0.04), (0.4 + sx * 0.24, y, 0.03), pm('th_cush', '#c83a3a'), bev=0.015)
    for k in range(2):
        cyl(uid('cup'), 0.02, 0.03, (0.36 + k * 0.08, y, 0.18), pot, verts=10)
    potted_plant(-0.55, front_y(0.18), 0, m, pm('th_pot2', '#b8582a'))
    done('tea_house')


def smoothie_bar():
    m = std()
    wall = pm('sb_wall', '#f8d8e8', '#fce6f0', scale=30, kind='wave', stretch=(1, 1, 8))
    pink = pm('sb_pink', '#e84a8a')
    f, Z, top = shop(m, wall, '#e84a8a', pm('sb_door', '#2aa0a0'), aw=(pink, pm('sb_aw2', '#fff6fa')), seed=32,
         flowers=[pm('sb_f1', '#f0c020'), pm('sb_f2', '#ffffff')], kind='flat')
    # a tall smoothie cup with a bendy straw, a strawberry and a banana slice
    glass = pm('sb_glass', '#f07aa8', rough=0.2)
    cyl(uid('cup'), 0.1, 0.34, (0, 0, top + 0.17), glass, verts=20, r2=0.14)
    ball(uid('foam'), 0.14, (0, 0, top + 0.34), pm('sb_foam', '#fbd0e0'), scale=(1, 1, 0.35), segs=14)
    cyl(uid('straw'), 0.018, 0.3, (0.05, 0, top + 0.46), pm('sb_straw', '#2aa0a0'), verts=8, rot=(0, math.radians(15), 0))
    ball(uid('berry'), 0.05, (-0.08, 0, top + 0.38), pm('sb_berry', '#e02a3a'), scale=(1, 1, 1.2), segs=12)
    cyl(uid('slice'), 0.06, 0.02, (0.12, 0, top + 0.33), pm('sb_ban', '#f8e8a0'), verts=16, rot=(math.radians(90), 0, 0))
    # stools at a little counter and crates of fruit
    y = front_y(0.25)
    box(uid('counter'), (0.5, 0.14, 0.3), (0.35, y, 0.15), pm('sb_counter', '#2aa0a0'), bev=0.02)
    for k in range(2):
        cyl(uid('stool'), 0.05, 0.03, (0.25 + k * 0.2, y - 0.15, 0.2), pink, verts=12)
        cyl(uid('sl'), 0.012, 0.2, (0.25 + k * 0.2, y - 0.15, 0.1), m['metal'], verts=6)
    crate(-0.55, front_y(0.2), 0, 0.24, m, fill=[pm('sb_mango', '#f0a020')], rot=0.1)
    crate(-0.55, front_y(0.2), 0.2, 0.22, m, fill=[pm('sb_kiwi', '#6a8a2a')], rot=-0.1)
    done('smoothie_bar')


def pasta_maker():
    m = std()
    wall = pm('pm_wall', '#f4e6c8', '#fbf0d8', scale=10)
    red = pm('pm_red', '#c83a2a')
    f, Z, top = shop(m, wall, '#b8402a', pm('pm_door', '#2a6a3a'), aw=(red, pm('pm_aw2', '#f8f4ea')), style='plaster', extra=m['brick'][0],
         seed=33, shutters=pm('pm_sh', '#2a6a3a'), flowers=[pm('pm_f1', '#e83a2a'), pm('pm_f2', '#ffffff')], kind='side')
    # a giant fork twirling a nest of spaghetti
    pasta = pm('pm_pasta', '#f0d070', '#f8e090', scale=60, kind='wave')
    for k in range(6):
        torus(uid('nest'), 0.13 - k * 0.012, 0.022, (0, 0, top + 0.08 + k * 0.035), pasta, segs=20, rsegs=6)
    cyl(uid('fork'), 0.015, 0.4, (0, 0, top + 0.35), m['metal'], verts=8)
    for k in range(4):
        cyl(uid('tine'), 0.008, 0.12, ((k - 1.5) * 0.02, 0, top + 0.1), m['metal'], verts=5)
    # a drying rack of pasta ribbons and a basket of eggs
    y = front_y(0.3)
    for sx in (-1, 1):
        box(uid('rp'), (0.03, 0.03, 0.4), (0.4 + sx * 0.18, y, 0.2), m['wood_dark'], bev=0)
    for k in range(3):
        cyl(uid('rod'), 0.008, 0.4, (0.4, y, 0.2 + k * 0.08), m['wood'], verts=6, rot=(0, math.radians(90), 0))
        for j in range(6):
            box(uid('rib'), (0.02, 0.005, 0.12), (0.26 + j * 0.056, y, 0.15 + k * 0.08), pasta, bev=0)
    cyl(uid('basket'), 0.1, 0.08, (-0.55, front_y(0.2), 0.04), pm('pm_wick', '#b8843a', '#d8a050', scale=60, kind='wave'), verts=16, r2=0.12)
    for k in range(5):
        ball(uid('egg'), 0.03, (-0.55 + math.cos(k * 1.3) * 0.05, front_y(0.2) + math.sin(k * 1.3) * 0.05, 0.1), pm('pm_egg', '#f4ecdc'), scale=(1, 1, 1.25), segs=8)
    done('pasta_maker')


def candy_shop():
    m = std()
    wall = pm('cs_wall', '#fcd8ec', '#fde8f4', scale=30, kind='wave', stretch=(1, 1, 8))
    pink, mint = pm('cs_pink', '#e85aa8'), pm('cs_mint', '#6ad8b8')
    f, Z, top = shop(m, wall, '#e85aa8', pm('cs_door', '#6ad8b8'), aw=(pink, pm('cs_aw2', '#ffffff')), seed=34,
         flowers=[pm('cs_f1', '#f0c020'), pm('cs_f2', '#6ad8b8')], kind='front', rise=0.6)
    # a giant swirl lollipop on the gable
    cyl(uid('stick'), 0.02, 0.36, (0, 0, top + 0.18), pm('cs_stick', '#f8f4ea'), verts=8)
    cyl(uid('pop'), 0.2, 0.06, (0, 0, top + 0.5), pm('cs_swirl', '#e85aa8', '#ffffff', scale=4, kind='wave'), verts=28, rot=(math.radians(90), 0, 0))
    torus(uid('rim'), 0.2, 0.02, (0, 0, top + 0.5), mint, rot=(math.radians(90), 0, 0), segs=28, rsegs=6)
    # jars of sweets in the yard and a candy cane post
    y = front_y(0.25)
    for k, c in enumerate(('#e8303a', '#f0c020', '#6ad8b8')):
        cyl(uid('jar'), 0.07, 0.16, (0.25 + k * 0.17, y, 0.08), pm('cs_glass', '#e8f4f8', rough=0.05), verts=14)
        for j in range(5):
            ball(uid('sweet'), 0.022, (0.25 + k * 0.17 + math.cos(j * 1.3) * 0.03, y + math.sin(j * 1.3) * 0.03, 0.05 + (j % 3) * 0.03), pm(f'cs_s{k}', c), segs=8)
        cyl(uid('jlid'), 0.075, 0.02, (0.25 + k * 0.17, y, 0.17), pink, verts=14)
    cyl(uid('cane'), 0.03, 0.5, (-0.6, front_y(0.15), 0.25), pm('cs_cane', '#e8303a', '#ffffff', scale=6, kind='wave', stretch=(1, 1, 3)), verts=10)
    torus(uid('hook'), 0.07, 0.03, (-0.53, front_y(0.15), 0.5), pm('cs_cane', '#e8303a', '#ffffff', scale=6, kind='wave', stretch=(1, 1, 3)), rot=(math.radians(90), 0, 0), segs=14, rsegs=6)
    done('candy_shop')


def cheese_cave():
    m = std()
    wall = pm('cc_wall', '#c8bca0', '#d8ccb0', scale=18)
    f, Z, top = shop(m, wall, '#7a5a34', pm('cc_door', '#5a3a1e'), aw=(pm('cc_aw1', '#f0c040'), pm('cc_aw2', '#f8f0d8')), style='brick', extra=m['brick'],
         seed=35, flowers=[pm('cc_f1', '#8a5ad8'), pm('cc_f2', '#ffffff')], kind='gambrel', rise=0.6)
    # a big wedge of cheese with holes on the roof
    cheese = pm('cc_cheese', '#f0c040', '#f8d460', scale=20)
    prism(uid('wedge'), [(-0.18, top), (0.18, top), (0.18, top + 0.2)], -0.12, 0.12, cheese)
    for k in range(4):
        ball(uid('hole'), 0.025, (0.13, -0.08 + k * 0.05, top + 0.05 + (k % 2) * 0.07), pm('cc_hole', '#c89020'), scale=(0.3, 1, 1), segs=8)
    # wheels of cheese on a rack in the yard
    y = front_y(0.28)
    box(uid('rack'), (0.5, 0.2, 0.03), (0.35, y, 0.22), m['wood'], bev=0.006)
    for sx in (-1, 1):
        box(uid('rl'), (0.03, 0.18, 0.22), (0.35 + sx * 0.23, y, 0.11), m['wood_dark'], bev=0)
    for k in range(3):
        cyl(uid('wheel'), 0.08, 0.06, (0.2 + k * 0.15, y, 0.27), cheese, verts=18)
        cyl(uid('wheel'), 0.08, 0.06, (0.2 + k * 0.15, y, 0.06), pm('cc_rind', '#d8a030'), verts=18)
    barrel(-0.55, front_y(0.2), 0.0, 0.1, 0.22, m)
    done('cheese_cave')


def noodle_bar():
    m = std()
    wall = pm('nb_wall', '#f8ead0', '#fff4e0', scale=10)
    red = pm('nb_red', '#d8302a')
    f, Z, top = shop(m, wall, '#2a2a30', pm('nb_door', '#d8302a'), aw=(red, pm('nb_aw2', '#f8f0e0')), style='batten',
         seed=36, flowers=[pm('nb_f1', '#f0c020'), pm('nb_f2', '#d8302a')], kind='side')
    # a steaming noodle bowl with chopsticks on the ridge
    bowl = pm('nb_bowl', '#d8302a')
    ball(uid('bowl'), 0.17, (0, 0, top + 0.12), bowl, scale=(1, 1, 0.55), segs=18)
    cyl(uid('soup'), 0.15, 0.01, (0, 0, top + 0.18), pm('nb_soup', '#e8b050'), verts=20, bev=0)
    for k in range(5):
        torus(uid('nd'), 0.04 + k * 0.02, 0.008, (0, 0, top + 0.19), pm('nb_noodle', '#f8e8a8'), segs=16, rsegs=4)
    for sx in (-1, 1):
        cyl(uid('stick'), 0.008, 0.36, (sx * 0.03, 0.02, top + 0.3), m['wood'], verts=6, rot=(0, math.radians(28) * sx, 0))
    marker('smoke_bowl', (0, 0, top + 0.26))
    # paper lanterns along the eave and a bench out front
    for k in range(3):
        x = -0.4 + k * 0.4
        cyl(uid('lstr'), 0.004, 0.1, (x, -D / 2 - 0.12, B + 0.86), m['iron'], verts=4, bev=0)
        ball(uid('lant'), 0.06, (x, -D / 2 - 0.12, B + 0.74), pm('nb_lant', '#ff5a3a', emit=1.5), scale=(1, 1, 1.25), segs=12)
    box(uid('bench'), (0.5, 0.14, 0.04), (0.35, front_y(0.35), 0.2), m['wood'], bev=0.01)
    for sx in (-1, 1):
        box(uid('bl'), (0.04, 0.12, 0.2), (0.35 + sx * 0.2, front_y(0.35), 0.1), m['wood_dark'], bev=0)
    done('noodle_bar', glow=('glass', 'glass_hi', 'lamp', 'nb_lant'))


def smokehouse():
    m = std()
    wall = pm('sh_wall', '#8a6a4a', '#a07a58', scale=6, kind='wave', stretch=(1, 8, 1))
    f, Z, top = shop(m, wall, '#4a3a2a', pm('sh_door', '#3a2a1a'), aw=(pm('sh_aw1', '#6a8a9a'), pm('sh_aw2', '#e8e4dc')), style='log', extra=m['wood_dark'],
         seed=37, kind='side')
    # a second tall stone chimney for the smoke, and fish hanging to smoke on a rack
    box(uid('stack'), (0.24, 0.24, 1.2), (-0.45, 0.25, 0.6), m['stone'][0], bev=0.02)
    marker('smoke_stack', (-0.45, 0.25, 1.25))
    y = front_y(0.3)
    for sx in (-1, 1):
        box(uid('rp'), (0.035, 0.035, 0.5), (0.35 + sx * 0.22, y, 0.25), m['wood_dark'], bev=0)
    box(uid('rbar'), (0.5, 0.03, 0.03), (0.35, y, 0.49), m['wood_dark'], bev=0)
    fish = pm('sh_fish', '#b88a4a', '#d8a860', scale=20)
    for k in range(5):
        x = 0.19 + k * 0.08
        cyl(uid('str'), 0.003, 0.05, (x, y, 0.46), m['rope'], verts=4, bev=0)
        ball(uid('fish'), 0.03, (x, y, 0.36), fish, scale=(0.5, 0.3, 1.6), segs=10)
        cyl(uid('tail'), 0.025, 0.04, (x, y, 0.29), fish, verts=4, r2=0.0, rot=(math.radians(180), 0, 0))
    for k in range(4):
        cyl(uid('log'), 0.04, 0.3, (-0.6, front_y(0.1) - k * 0.09, 0.04 + (k % 2) * 0.07), m['wood_dark'], verts=8, rot=(0, math.radians(90), 0))
    done('smokehouse')


def spice_mill():
    m = std()
    wall = pm('sm_wall', '#f0d4a8', '#f8e0b8', scale=10)
    orange = pm('sm_orange', '#d86a1a')
    f, Z, top = shop(m, wall, '#b8501a', pm('sm_door', '#2a4a8a'), aw=(orange, pm('sm_aw2', '#f8ecd4')), style='plaster', extra=m['wood_dark'],
         seed=38, flowers=[pm('sm_f1', '#e8303a'), pm('sm_f2', '#f0c020')], kind='front', rise=0.55)
    # a giant mortar and pestle
    stone = pm('sm_stone', '#8a8680', '#a8a49c', scale=18)
    cyl(uid('mortar'), 0.13, 0.16, (0, 0, top + 0.08), stone, verts=18, r2=0.17)
    cyl(uid('spice'), 0.15, 0.01, (0, 0, top + 0.16), pm('sm_spice', '#d8501a'), verts=18, bev=0)
    cyl(uid('pestle'), 0.035, 0.36, (0.05, 0, top + 0.28), stone, verts=10, r2=0.05, rot=(0, math.radians(22), 0))
    # open sacks of colorful spices
    for k, c in enumerate(('#e8a020', '#c0301a', '#8a5a2a', '#e8d040')):
        x = 0.1 + k * 0.16
        sack(x, front_y(0.22), 0, 0.07, pm('sm_sack', '#c8a878', '#d8b888', scale=30))
        ball(uid('pile'), 0.055, (x, front_y(0.22), 0.16), pm(f'sm_p{k}', c), scale=(1, 1, 0.45), segs=10)
    done('spice_mill')


def perfumery():
    m = std()
    wall = pm('pf_wall', '#ece0f4', '#f6eefa', scale=10)
    purple = pm('pf_purple', '#9a5ac8')
    f, Z, top = shop(m, wall, '#7a4aa8', pm('pf_door', '#f4f0f8'), aw=(purple, pm('pf_aw2', '#ffffff')), style='plaster', extra=m['wood_dark'],
         seed=39, shutters=pm('pf_sh', '#9a5ac8'), flowers=[pm('pf_f1', '#e880c0'), pm('pf_f2', '#ffffff')], kind='side')
    # a faceted perfume bottle with a squeeze bulb
    glass = pm('pf_glass', '#c8a0e8', rough=0.05)
    cyl(uid('bottle'), 0.14, 0.26, (0, 0, top + 0.13), glass, verts=8)
    cyl(uid('neck'), 0.04, 0.06, (0, 0, top + 0.29), m['brass'], verts=12)
    ball(uid('stopper'), 0.06, (0, 0, top + 0.36), purple, segs=12)
    cyl(uid('tube'), 0.008, 0.2, (0.1, 0, top + 0.33), pm('pf_tube', '#f0c0d8'), verts=6, rot=(0, math.radians(60), 0))
    ball(uid('bulb'), 0.05, (0.2, 0, top + 0.38), pm('pf_bulb', '#e880c0'), scale=(1, 1, 1.2), segs=10)
    # flower beds of lavender and roses
    for k in range(8):
        x = 0.1 + (k % 4) * 0.14
        yy = front_y(0.18 + (k // 4) * 0.14)
        cyl(uid('lv'), 0.006, 0.14, (x, yy, 0.07), m['leaf'], verts=4, bev=0)
        ball(uid('lvf'), 0.02, (x, yy, 0.16), pm('pf_lav', '#8a5ad8') if k % 2 else pm('pf_rose', '#e8436a'), scale=(1, 1, 1.6 if k % 2 else 1), segs=8)
    done('perfumery')


def soap_maker():
    m = std()
    wall = pm('so_wall', '#d8eef4', '#e8f6fa', scale=30, kind='wave', stretch=(1, 1, 8))
    blue = pm('so_blue', '#3a8ab0')
    f, Z, top = shop(m, wall, '#3a7aa0', pm('so_door', '#f4efe6'), aw=(blue, pm('so_aw2', '#ffffff')), seed=40,
         flowers=[pm('so_f1', '#8a5ad8'), pm('so_f2', '#ffffff')], kind='front', rise=0.55)
    # a big bar of soap with bubbles rising off it
    box(uid('bar'), (0.3, 0.18, 0.1), (0, 0, top + 0.06), pm('so_soap', '#f0a8c8'), bev=0.04)
    bub = pm('so_bub', '#e8f8ff', rough=0.05)
    for k, (x, z, r) in enumerate(((0.08, 0.2, 0.05), (-0.06, 0.28, 0.04), (0.02, 0.38, 0.06), (-0.1, 0.46, 0.035), (0.1, 0.5, 0.03))):
        ball(uid('bub'), r, (x, 0, top + z), bub, segs=12)
    # soap bars curing on a table
    y = front_y(0.28)
    box(uid('tbl'), (0.5, 0.2, 0.03), (0.35, y, 0.24), m['wood'], bev=0.006)
    for sx in (-1, 1):
        box(uid('tl'), (0.03, 0.18, 0.24), (0.35 + sx * 0.22, y, 0.12), m['wood_dark'], bev=0)
    for k, c in enumerate(('#f0a8c8', '#a8e0c0', '#f8e8a0', '#c8b0f0', '#f4f0e8')):
        box(uid('sbar'), (0.07, 0.05, 0.03), (0.17 + k * 0.09, y, 0.27), pm(f'so_s{k}', c), bev=0.01)
    done('soap_maker')


def candle_shop():
    m = std()
    wall = pm('cn_wall', '#f4e4bc', '#fbeecc', scale=6, kind='wave', stretch=(1, 8, 1))
    gold = pm('cn_gold', '#c8962a')
    f, Z, top = shop(m, wall, '#8a5a2a', pm('cn_door', '#6a2a2a'), aw=(gold, pm('cn_aw2', '#fbf4e0')), style='batten',
         seed=41, flowers=[pm('cn_f1', '#e8436a'), pm('cn_f2', '#f0c020')], kind='gambrel', rise=0.6)
    # a giant candle with a glowing flame, wax dripping down its side
    wax = pm('cn_wax', '#f8ecc8', rough=0.4)
    cyl(uid('candle'), 0.1, 0.34, (0, 0, top + 0.17), wax, verts=18)
    for k in range(4):
        a = k * 1.6
        ball(uid('drip'), 0.025, (math.cos(a) * 0.1, math.sin(a) * 0.1, top + 0.28 - k * 0.04), wax, scale=(1, 1, 2), segs=8)
    cyl(uid('wick'), 0.006, 0.04, (0, 0, top + 0.36), pm('cn_wick', '#2a1a10'), verts=5)
    ball(uid('flame'), 0.04, (0, 0, top + 0.42), pm('cn_flame', '#ffb030', emit=3.0), scale=(0.7, 0.7, 1.5), segs=10)
    # beehives and a stall of candles
    y = front_y(0.28)
    for k in range(4):
        cyl(uid('cand'), 0.03, 0.08 + k * 0.03, (0.2 + k * 0.1, y, 0.04 + k * 0.015), pm(f'cn_c{k}', ['#e8436a', '#f8ecc8', '#8a5ad8', '#6ad8b8'][k]), verts=12)
    for k in range(3):
        ball(uid('skep'), 0.09 - k * 0.022, (-0.55, front_y(0.2), 0.06 + k * 0.06), pm('cn_skep', '#d8a848', '#e8c068', scale=40, kind='wave'), scale=(1, 1, 0.7), segs=14)
    done('candle_shop', glow=('glass', 'glass_hi', 'lamp', 'cn_flame'))


def chocolatier():
    m = std()
    wall = pm('co_wall', '#ecd8c4', '#f4e4d4', scale=10)
    brown = pm('co_brown', '#5a2e14')
    f, Z, top = shop(m, wall, '#5a2e14', pm('co_door', '#c8962a'), aw=(brown, pm('co_aw2', '#f8ecd8')), style='brick', extra=m['brick'],
         seed=42, shutters=pm('co_sh', '#5a2e14'), flowers=[pm('co_f1', '#e8436a'), pm('co_f2', '#ffffff')], kind='front', rise=0.55)
    # a chocolate bar with a bite out of it, and a truffle
    choc = pm('co_choc', '#4a2410', '#5a2e14', scale=20, rough=0.35)
    for i in range(3):
        for j in range(2):
            if i == 2 and j == 1:
                continue
            box(uid('sq'), (0.1, 0.09, 0.04), (-0.1 + i * 0.105, -0.05 + j * 0.095, top + 0.03), choc, bev=0.012)
    box(uid('wrap'), (0.32, 0.2, 0.03), (0.02, 0.0, top + 0.005), pm('co_wrap', '#c8962a', rough=0.3, metal=0.6), bev=0.005)
    ball(uid('truffle'), 0.07, (0.17, 0.06, top + 0.1), choc, segs=14)
    ball(uid('dust'), 0.071, (0.17, 0.06, top + 0.12), pm('co_dust', '#8a5a34'), scale=(1, 1, 0.4), segs=12)
    # a cart of cocoa pods
    y = front_y(0.25)
    crate(0.35, y, 0, 0.26, m, fill=[pm('co_pod', '#d8781a')], rot=0.1)
    crate(-0.55, front_y(0.2), 0, 0.22, m, fill=[pm('co_pod2', '#8a2a1a')], rot=-0.1)
    done('chocolatier')


MODELS = {'bakery': bakery, 'feed_mill': feed_mill, 'dairy': dairy, 'sugar_mill': sugar_mill, 'bbq_grill': bbq_grill,
          'juice_press': juice_press, 'loom': loom, 'jam_maker': jam_maker, 'ice_cream': ice_cream, 'sushi_bar': sushi_bar,
          'salad_bar': salad_bar, 'pizzeria': pizzeria, 'coffee_kiosk': coffee_kiosk, 'oil_press': oil_press,
          'florist': florist, 'workshop': workshop, 'tea_house': tea_house, 'smoothie_bar': smoothie_bar, 'pasta_maker': pasta_maker,
          'candy_shop': candy_shop, 'cheese_cave': cheese_cave, 'noodle_bar': noodle_bar, 'smokehouse': smokehouse, 'spice_mill': spice_mill,
          'perfumery': perfumery, 'soap_maker': soap_maker, 'candle_shop': candle_shop, 'chocolatier': chocolatier}

if __name__ == '__main__':
    main(MODELS)
