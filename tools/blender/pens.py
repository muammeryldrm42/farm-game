# Animal pens: the fence (wood, white, log, stone or bamboo, with a gate at the front), the
# shelter that suits the animal (open shed, hen house, stable, lodge, hutch...), a feed trough
# and the scenery around it. The ground, water and the animals themselves stay live in the
# game, so the herd walks on the game's own lawn or yard.
# Run: python3 tools/blender/pens.py [names...]   (see kit.main)
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import (Face, anim_group, ball, bark_mat, box, capture, clump, crate, cyl, door, finish, hay_bale, leaf_mats, main, oak,  # noqa: E402
                 palm, pine, place, pm, profile_roof, rock, roof_plane, shingles, snow, std, torus, uid, walls, window)
from common import obox  # noqa: E402
import bpy  # noqa: E402
from mathutils import Matrix  # noqa: E402

R90 = math.radians(90)
PW, PH = 3, 3   # footprint of the pen being built, in tiles


def P(gx, gz, z=0.0):
    """Game footprint coords (x right, z toward the viewer) to Blender (centered, front -Y)."""
    return (gx - PW / 2, PH / 2 - gz, z)


# ---------------------------------------------------------------- fences

def fence(m, style):
    """Posts every half tile around the footprint with rails between, and a gate in the front."""
    rnd = random.Random(PW * 7 + PH)
    inset = 0.05
    x0, x1, y0, y1 = -PW / 2 + inset, PW / 2 - inset, -PH / 2 + inset, PH / 2 - inset
    white = pm('fence_white', '#f4f1ea', rough=0.6)
    wood = pm('fence_wood', '#b87a42', '#cc8c50', scale=6, kind='wave', stretch=(1, 8, 1))
    wood_d = pm('fence_wood_d', '#8a5630', '#9e6538', scale=6, kind='wave', stretch=(1, 8, 1))
    logm = bark_mat('fence_log', '#7a5230', '#946238')
    bamboo = pm('fence_bamboo', '#b8a04a', '#ccb45a', scale=8, kind='wave', stretch=(1, 1, 8))
    gate_w = 0.6
    posts = []
    n = int(round(PW / 0.5))
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        posts += [(x, y0), (x, y1)]
    n = int(round(PH / 0.5))
    for i in range(1, n):
        y = y0 + (y1 - y0) * i / n
        posts += [(x0, y), (x1, y)]
    sides = [((x0, y1), (x1, y1)), ((x0, y0), (x0, y1)), ((x1, y0), (x1, y1)),
             ((x0, y0), (-gate_w / 2, y0)), ((gate_w / 2, y0), (x1, y0))]

    if style == 'stone':
        # a dry stone wall of irregular blocks with a flat coping, and two gate pillars
        stones = m['stone']
        for (ax, ay), (bx_, by) in sides:
            ln = math.hypot(bx_ - ax, by - ay)
            d = ((bx_ - ax) / ln, (by - ay) / ln, 0)
            nrm = (-d[1], d[0], 0)
            for row in range(3):
                u = -0.05 * (row % 2)
                while u < ln:
                    w = rnd.uniform(0.12, 0.2)
                    c = (ax + d[0] * (u + w / 2), ay + d[1] * (u + w / 2), 0.05 + row * 0.095)
                    obox(uid('ws'), c, (d, nrm, (0, 0, 1)), (min(w, ln - u) * 0.96, 0.14, 0.09), stones[rnd.randrange(3)], bev=0.02)
                    u += w
            mid = ((ax + bx_) / 2, (ay + by) / 2, 0.31)
            obox(uid('wc'), mid, (d, nrm, (0, 0, 1)), (ln + 0.04, 0.17, 0.04), m['stone'][1], bev=0.015)
        for sx in (-1, 1):
            box(uid('gp'), (0.16, 0.16, 0.42), (sx * (gate_w / 2 + 0.04), y0, 0.21), m['stone'][0], bev=0.02)
            ball(uid('gpb'), 0.06, (sx * (gate_w / 2 + 0.04), y0, 0.46), m['stone'][1], segs=10)
        gate(m, y0, gate_w, wood)
        return

    post_m = {'white': white, 'wood': wood_d, 'log': logm, 'bamboo': bamboo}[style]
    rail_m = {'white': white, 'wood': wood, 'log': logm, 'bamboo': bamboo}[style]
    for x, y in posts:
        if abs(y - y0) < 1e-6 and abs(x) < gate_w / 2 - 0.01:
            continue
        if style == 'white':
            box(uid('fp'), (0.07, 0.07, 0.42), (x, y, 0.21), white, bev=0.012)
            box(uid('fc'), (0.09, 0.09, 0.025), (x, y, 0.43), white, bev=0.008)
        elif style == 'bamboo':
            cyl(uid('fp'), 0.035, 0.46, (x, y, 0.23), bamboo, verts=10)
            for z in (0.15, 0.32):
                torus(uid('node'), 0.036, 0.008, (x, y, z), bamboo, segs=12, rsegs=4)
        elif style == 'log':
            cyl(uid('fp'), 0.055, 0.44, (x, y, 0.22), logm, verts=10)
            cyl(uid('fcut'), 0.05, 0.01, (x, y, 0.445), pm('logcut', '#d8b078'), verts=10, bev=0)
        else:
            cyl(uid('fp'), 0.05, 0.4, (x, y, 0.2), post_m, verts=10, r2=0.045)
            ball(uid('fcap'), 0.052, (x, y, 0.4), post_m, scale=(1, 1, 0.7), segs=10)
    for (ax, ay), (bx_, by) in sides:
        ln = math.hypot(bx_ - ax, by - ay)
        if ln < 0.05:
            continue
        d = ((bx_ - ax) / ln, (by - ay) / ln, 0)
        nrm = (-d[1], d[0], 0)
        mid = ((ax + bx_) / 2, (ay + by) / 2)
        zs = (0.12, 0.25, 0.36) if style in ('wood', 'white') else (0.14, 0.32)
        for z in zs:
            if style == 'log':
                obox(uid('fr'), (mid[0], mid[1], z), (d, nrm, (0, 0, 1)), (ln, 0.07, 0.07), logm, bev=0.03)
            elif style == 'bamboo':
                cyl(uid('fr'), 0.02, ln, (mid[0], mid[1], z), bamboo, verts=8, rot=(0, R90, math.atan2(d[1], d[0])))
            else:
                obox(uid('fr'), (mid[0], mid[1], z), (d, nrm, (0, 0, 1)), (ln, 0.03, 0.05), rail_m, bev=0.01)
        if style == 'white':
            # the tidier white fences get pickets too
            k = int(ln / 0.12)
            for i in range(k):
                u = (i + 0.5) / k - 0.5
                obox(uid('pk'), (mid[0] + d[0] * u * ln, mid[1] + d[1] * u * ln, 0.17), (d, nrm, (0, 0, 1)), (0.05, 0.02, 0.3), white, bev=0.006)
    for sx in (-1, 1):
        x = sx * (gate_w / 2 + 0.03)
        if style == 'white':
            box(uid('gp'), (0.09, 0.09, 0.5), (x, y0, 0.25), white, bev=0.012)
            ball(uid('gpb'), 0.045, (x, y0, 0.52), white, segs=10)
        else:
            cyl(uid('gp'), 0.06, 0.5, (x, y0, 0.25), post_m, verts=10)
            ball(uid('gpb'), 0.06, (x, y0, 0.5), post_m, scale=(1, 1, 0.7), segs=10)
    gate(m, y0, gate_w, white if style == 'white' else wood)


def gate(m, y, w, mat):
    """A two leaf gate with a diagonal brace in each leaf. Each leaf is its own node (`gate0`,
    `gate1`) hinged at its post, so the game can swing it open when the animals go out."""
    for sx in (-1, 1):
        cx = sx * w / 4
        with anim_group(f'gate{0 if sx < 0 else 1}', (sx * w / 2, y, 0)):
            for z in (0.12, 0.34):
                box(uid('gr'), (w / 2 - 0.04, 0.03, 0.045), (cx, y, z), mat, bev=0.008)
            for u in (-1, 1):
                box(uid('gs'), (0.04, 0.03, 0.3), (cx + u * (w / 4 - 0.04), y, 0.23), mat, bev=0.006)
            a = math.atan2(0.22, w / 2 - 0.1)
            ln = math.hypot(0.22, w / 2 - 0.1)
            obox(uid('gb'), (cx, y, 0.23), ((math.cos(a) * sx, 0, math.sin(a)), (0, 1, 0), (-math.sin(a) * sx, 0, math.cos(a))),
                 (ln, 0.025, 0.035), mat, bev=0.006)
            if sx > 0:
                box(uid('latch'), (0.05, 0.035, 0.03), (0.02, y - 0.02, 0.28), m['iron'], bev=0)


# ---------------------------------------------------------------- shelters and props

def trough(m, gx, gz, fill='hay'):
    c = P(gx, gz)
    box(uid('tr'), (0.55, 0.18, 0.1), (c[0], c[1], 0.1), m['wood'], bev=0.015)
    box(uid('trin'), (0.47, 0.11, 0.02), (c[0], c[1], 0.15), m['hay'] if fill == 'hay' else pm('water_t', '#4a9ad0', rough=0.1), bev=0)
    for sx in (-1, 1):
        box(uid('trl'), (0.04, 0.2, 0.06), (c[0] + sx * 0.22, c[1], 0.03), m['wood_dark'], bev=0.006)


def shed_roof(cx, cy, W, D, z_front, z_back, mats, base, seed=1):
    """A single slope shingled roof, low at the front (-Y) edge."""
    run = math.hypot(D, z_back - z_front)
    u = (0, D / run, (z_back - z_front) / run)
    n = (0, -(z_back - z_front) / run, D / run)
    roof_plane(uid('shed'), (cx, cy - D / 2, z_front), (1, 0, 0), u, n, W, run, max(3, int(run * 12)), 0.12, mats, base, 0.04,
               random.Random(seed))


def open_shed(m, color, gx=0.7, gz=0.6, W=1.1, D=0.8, thatch=False):
    """An open field shelter: four posts, a board back wall and a sloped roof, hay inside."""
    cx, cy, _ = P(gx, gz)
    posts = pm('shed_post', '#8a5a33', '#9e6a3c', scale=6, kind='wave', stretch=(1, 1, 8))
    for sx in (-1, 1):
        for sy in (-1, 1):
            h = 0.62 if sy < 0 else 0.8
            box(uid('sp'), (0.07, 0.07, h), (cx + sx * (W / 2 - 0.05), cy + sy * (D / 2 - 0.05), h / 2), posts, bev=0.012)
    boards = pm('shed_boards', '#a8703e', '#bc8048', scale=6, kind='wave', stretch=(8, 8, 1))
    for k in range(5):
        box(uid('bw'), (W - 0.06, 0.03, 0.14), (cx, cy + D / 2 - 0.05, 0.1 + k * 0.14), boards, bev=0.006)
    for sx in (-1, 1):
        for k in range(4):
            box(uid('sw'), (0.03, D * 0.55, 0.13), (cx + sx * (W / 2 - 0.05), cy + D * 0.2, 0.1 + k * 0.14), boards, bev=0.006)
    if thatch:
        straw = pm('thatch', '#c8a24a', '#dcb85a', scale=30, kind='wave', stretch=(1, 1, 6))
        obox(uid('th'), (cx, cy, 0.76), ((1, 0, 0), (0, 0.97, 0.22), (0, -0.22, 0.97)), (W + 0.3, D + 0.34, 0.1), straw, bev=0.05)
        for k in range(int((W + 0.3) / 0.08)):
            ball(uid('fringe'), 0.05, (cx - (W + 0.3) / 2 + 0.04 + k * 0.08, cy - D / 2 - 0.14, 0.64), straw, scale=(0.9, 0.6, 0.9), segs=8)
    else:
        shed_roof(cx, cy, W + 0.24, D + 0.28, 0.6, 0.86, shingles(uid('shr'), color, spread=0.08), m['roofbase'], seed=int(gx * 10))
    hay_bale(cx - 0.18, cy + 0.1, 0.0, 0.26, m, rot=0.3)
    hay_bale(cx + 0.2, cy + 0.12, 0.0, 0.24, m, rot=-0.2)
    ball(uid('loose'), 0.16, (cx + 0.05, cy - 0.12, 0.02), m['hay'], scale=(1.3, 1, 0.45), segs=12)


def house(m, wall, roof, gx, gz, W, D, H, door_c=None, legs=0.0, style='batten', seed=1, rise=None, window_=True, ramp=False):
    """A little gabled animal house (hen house, duck house, hutch), optionally raised on legs."""
    cx, cy, _ = P(gx, gz)
    with capture() as cap:
        if legs:
            for sx in (-1, 1):
                for sy in (-1, 1):
                    box(uid('leg'), (0.05, 0.05, legs), (sx * (W / 2 - 0.04), sy * (D / 2 - 0.04), legs / 2), m['wood_dark'], bev=0.008)
        walls(W, D, H, legs, style, wall, m['trim'], extra=pm('house_bat', '#8a5630'))
        rise = rise or min(W, D) * 0.4
        profile_roof(uid('hr'), W, legs + H, [(D / 2, 0.0), (0.0, rise)], 0.07, shingles(uid('hs'), roof, spread=0.08),
                     m['roofbase'], trim=m['trim'], sw=0.1, rows_per_m=20, attic=wall, seed=seed)
        f = Face('front', W, D)
        dw, dh = min(0.2, W * 0.3), min(0.28, H * 0.62)
        door(f, -W * 0.18 if window_ else 0, legs, dw, dh, m, door_c or m['wood_dark'], style='barn')
        if window_ and W > 0.45:
            window(f, W * 0.22, legs + H * 0.55, 0.14, 0.12, m, panes=2)
        if ramp:
            a = math.atan2(legs, 0.34)
            obox(uid('ramp'), (-W * 0.18, -D / 2 - 0.16, legs / 2), ((1, 0, 0), (0, math.cos(a), math.sin(a)), (0, -math.sin(a), math.cos(a))),
                 (0.16, math.hypot(legs, 0.34), 0.02), m['wood'], bev=0.004)
            for k in range(4):
                obox(uid('cleat'), (-W * 0.18, -D / 2 - 0.06 - k * 0.07, legs * (1 - (k + 1) * 0.2)), ((1, 0, 0), (0, math.cos(a), math.sin(a)),
                     (0, -math.sin(a), math.cos(a))), (0.15, 0.015, 0.02), m['wood_dark'], bev=0)
    place(cap, 0, (cx, cy, 0))
    return cx, cy


def coop(m, wall, roof):
    cx, cy = house(m, wall, roof, 0.62, 0.55, 0.78, 0.56, 0.42, legs=0.16, style='batten', seed=2, ramp=True)
    # nest boxes on the side and a basket of eggs
    box(uid('nest'), (0.14, 0.4, 0.2), (cx + 0.46, cy, 0.34), wall, bev=0.01)
    box(uid('nestl'), (0.2, 0.44, 0.03), (cx + 0.48, cy, 0.455), shingles(uid('nr'), '#6a4a3a')[0], rot=(0, -0.3, 0), bev=0.006)
    egg = pm('egg', '#f4ead8')
    cyl(uid('bsk'), 0.07, 0.06, P(1.5, 0.45, 0.03), m['hay'], verts=14, r2=0.085)
    for k in range(4):
        a = k * 1.6
        ball(uid('egg'), 0.025, (P(1.5, 0.45)[0] + math.cos(a) * 0.03, P(1.5, 0.45)[1] + math.sin(a) * 0.03, 0.08), egg, scale=(1, 1, 1.3), segs=8)


def stable(m, wall, roof):
    cx, cy, _ = P(1.1, 0.5)
    with capture() as cap:
        W, D, H = 1.5, 0.72, 0.72
        walls(W, D, H, 0.0, 'batten', wall, m['trim'], extra=pm('stb_bat', '#8a3a24'))
        profile_roof(uid('sr'), W, H, [(D / 2, 0.0), (0.0, 0.36)], 0.1, shingles('stsh', roof, spread=0.08), m['roofbase'],
                     trim=m['trim'], sw=0.11, rows_per_m=16, attic=wall, seed=4)
        f = Face('front', W, D)
        for u in (-0.45, 0.0, 0.45):
            f.box(u, 0.2, 0.03, 0.28, 0.4, 0.04, m['wood_dark'], bev=0.01)
            f.box(u, 0.5, 0.02, 0.28, 0.16, 0.02, pm('stall_dark', '#2a1a12'), bev=0)
            f.box(u, 0.42, 0.05, 0.3, 0.035, 0.05, m['trim'], bev=0.006)
            f.box(u, 0.62, 0.03, 0.32, 0.035, 0.05, m['trim'], bev=0.006)
        f.box(0, H + 0.12, 0.0, 0.22, 0.18, 0.04, m['hay'], bev=0.01)
    place(cap, 0, (cx, cy, 0))
    shoe = pm('horseshoe', '#8a8a90', rough=0.3, metal=0.7)
    torus(uid('shoe'), 0.06, 0.012, (cx, cy - 0.37, 0.8), shoe, rot=(R90, 0, 0), segs=16, rsegs=4)
    for x in (cx + 0.95, cx + 0.95):
        hay_bale(x, cy - 0.1, 0, 0.26, m, rot=1.57)


def lodge(m):
    logs = bark_mat('lodge_log', '#7a4e2a', '#8e5e34')
    snowm = pm('snow', '#f6fafc', '#ffffff', scale=20)
    cx, cy, _ = P(0.72, 0.52)
    with capture() as cap:
        W, D, H = 1.0, 0.7, 0.5
        walls(W, D, H, 0.0, 'log', logs, m['trim'], extra=logs)
        profile_roof(uid('lr'), W, H, [(D / 2, 0.0), (0.0, 0.32)], 0.1, [snowm], snowm, trim=None, sw=0.2, rows_per_m=8, attic=logs, seed=5)
        f = Face('front', W, D)
        door(f, 0, 0, 0.2, 0.32, m, pm('lodge_door', '#5a3a22'), style='barn')
        window(f, 0.3, 0.28, 0.12, 0.12, m, panes=2)
        for k in range(8):
            f.box(-0.45 + k * 0.13, H + 0.02, 0.11, 0.02, 0.06 + (k % 3) * 0.03, 0.02, pm('icicle', '#dff2fa'), bev=0)
    place(cap, 0, (cx, cy, 0))
    # snow drifts and a sled
    for i, (gx, gz, r) in enumerate(((0.4, 1.4, 0.2), (2.4, 1.2, 0.26), (1.3, 2.6, 0.22), (2.6, 2.5, 0.18), (0.5, 2.4, 0.2))):
        snow(*P(gx, gz)[:2], r, snowm, seed=i)
    sx, sy, _ = P(2.4, 0.5)
    red = pm('sled', '#b8302a')
    box(uid('sled'), (0.42, 0.24, 0.1), (sx, sy, 0.12), red, bev=0.02)
    for s in (-1, 1):
        obox(uid('runner'), (sx, sy + s * 0.12, 0.03), ((1, 0, 0), (0, 1, 0), (0, 0, 1)), (0.52, 0.02, 0.02), m['brass'], bev=0)
        torus(uid('curl'), 0.05, 0.01, (sx + 0.27, sy + s * 0.12, 0.08), m['brass'], rot=(R90, 0, 0), segs=12, rsegs=4)
    crate(sx - 0.02, sy, 0.17, 0.16, m, fill=[pm('carrot', '#e8701a')])


def pond_rim(gx, gz, r, m, sand='#d8c088', stones=True, seed=1, reeds=0):
    """Sandy bank and stones around one of the game's water discs."""
    c = P(gx, gz)
    cyl(uid('bank'), r + 0.1, 0.03, (c[0], c[1], 0.015), pm(uid('sand'), sand, scale=30), verts=32)
    rnd = random.Random(seed)
    if stones:
        n = int(r * 16)
        for i in range(n):
            a = i * math.pi * 2 / n + rnd.uniform(-0.05, 0.05)
            rr = r + rnd.uniform(0.02, 0.07)
            rock(uid('rk'), rnd.uniform(0.05, 0.08), (c[0] + math.cos(a) * rr, c[1] + math.sin(a) * rr, 0.04), m['stone'][i % 3],
                 seed=i + seed, squash=0.6)
    reed = pm('reed', '#5a8a2a')
    cat = pm('cattail', '#6a3a1e')
    for i in range(reeds):
        a = rnd.uniform(0, 6.28)
        rr = r + rnd.uniform(0.0, 0.1)
        h = rnd.uniform(0.25, 0.45)
        x, y = c[0] + math.cos(a) * rr, c[1] + math.sin(a) * rr
        cyl(uid('reed'), 0.01, h, (x, y, h / 2), reed, verts=5, bev=0)
        if i % 3 == 0:
            cyl(uid('cat'), 0.02, 0.07, (x, y, h - 0.02), cat, verts=8)


def lily_pads(gx, gz, r, n=5, seed=1):
    c = P(gx, gz)
    pad = pm('lily', '#3a9a3a', '#4aaa42', scale=20)
    pink = pm('lotus', '#f07aa8')
    for i in range(n):
        a = i * 1.3 + seed
        x, y = c[0] + math.cos(a) * r, c[1] + math.sin(a) * r * 0.9
        cyl(uid('pad'), 0.07, 0.01, (x, y, 0.09), pad, verts=14, bev=0)
        if i % 2 == 0:
            ball(uid('lot'), 0.025, (x, y, 0.105), pink, scale=(1, 1, 0.7), segs=8)


def pavilion(m):
    white = pm('pav_white', '#f6f2ea', rough=0.6)
    c = P(0.45, 0.45)
    cyl(uid('pbase'), 0.3, 0.05, (c[0], c[1], 0.025), m['stone'][1], verts=8)
    for gx, gz in ((0.25, 0.25), (0.65, 0.25), (0.25, 0.65), (0.65, 0.65)):
        p = P(gx, gz)
        cyl(uid('pcol'), 0.025, 0.42, (p[0], p[1], 0.26), white, verts=10)
    ball(uid('dome'), 0.34, (c[0], c[1], 0.46), pm('pav_roof', '#f0ece2'), scale=(1, 1, 0.6), segs=18)
    torus(uid('pr'), 0.3, 0.02, (c[0], c[1], 0.47), white, segs=24, rsegs=5)
    ball(uid('pfin'), 0.035, (c[0], c[1], 0.68), m['brass'], segs=10)


def hutch(m, wall, roof, gx=0.62, gz=0.5):
    cx, cy, _ = P(gx, gz)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(uid('hl'), (0.05, 0.05, 0.32), (cx + sx * 0.38, cy + sy * 0.2, 0.16), m['wood_dark'], bev=0.006)
    box(uid('hb'), (0.86, 0.5, 0.34), (cx, cy, 0.47), wall, bev=0.015)
    wire = pm('wire', '#8a929a', rough=0.4, metal=0.5)
    box(uid('hdark'), (0.66, 0.02, 0.24), (cx - 0.05, cy - 0.25, 0.48), pm('hutch_in', '#3a2a1a'), bev=0)
    for i in range(9):
        box(uid('wv'), (0.008, 0.012, 0.26), (cx - 0.37 + i * 0.08, cy - 0.265, 0.48), wire, bev=0)
    for i in range(4):
        box(uid('wh'), (0.66, 0.012, 0.008), (cx - 0.05, cy - 0.265, 0.37 + i * 0.075), wire, bev=0)
    for z in (0.33, 0.62):
        box(uid('hf'), (0.72, 0.03, 0.03), (cx - 0.05, cy - 0.27, z), m['wood_dark'], bev=0)
    obox(uid('hroof'), (cx, cy, 0.68), ((1, 0, 0), (0, 0.985, 0.17), (0, -0.17, 0.985)), (1.0, 0.66, 0.04), shingles(uid('hr'), roof)[0], bev=0.012)
    a = 0.62
    obox(uid('ramp'), (cx + 0.3, cy - 0.42, 0.15), ((1, 0, 0), (0, math.cos(a), math.sin(a)), (0, -math.sin(a), math.cos(a))), (0.16, 0.5, 0.02), m['wood'], bev=0.004)
    carrot = pm('carrot', '#e8701a')
    top = pm('carrot_top', '#4a9a2a')
    for i in range(4):
        p = P(1.45 + i * 0.05, 1.62 - i * 0.03)
        cyl(uid('car'), 0.015, 0.1, (p[0], p[1], 0.02), carrot, verts=8, r2=0.004, rot=(0, R90 - 0.2 + i * 0.1, 0))
        ball(uid('ct'), 0.02, (p[0] - 0.06, p[1], 0.03), top, scale=(1.4, 1, 0.6), segs=6)


def awning_shade(m, color):
    cloth1, cloth2 = pm(uid('cl'), color), pm('cloth_cream', '#f2e6c8')
    posts = bark_mat('shade_post', '#8a5a33', '#9e6a3c')
    for gx, gz in ((0.3, 0.3), (1.3, 0.3), (0.3, 1.1), (1.3, 1.1)):
        p = P(gx, gz)
        cyl(uid('ap'), 0.035, 0.9, (p[0], p[1], 0.45), posts, verts=10)
    c = P(0.8, 0.7)
    for i in range(6):
        x = c[0] - 0.5 + (i + 0.5) / 6
        obox(uid('as'), (x, c[1], 0.9), ((1, 0, 0), (0, 1, 0), (0, 0, 1)), (1.0 / 6 * 1.01, 0.95, 0.02), cloth1 if i % 2 else cloth2, bev=0.004)
        ball(uid('asc'), 0.08, (x, c[1] - 0.48, 0.87), cloth1 if i % 2 else cloth2, scale=(1, 0.25, 0.5), segs=10)
    for k in range(3):
        rock(uid('dr'), 0.08 + k * 0.02, P(2.4 + k * 0.15, 1.2 + k * 0.2, 0.03), m['stone'][k], seed=k, squash=0.6)


def kiwi(m):
    c = P(0.55, 0.5)
    grass = pm('mound', '#5a9a3a', '#6aaa44', scale=30)
    ball(uid('mound'), 0.45, (c[0], c[1], 0.0), grass, scale=(1, 0.9, 0.55), segs=18)
    ball(uid('burrow'), 0.1, (c[0], c[1] - 0.36, 0.08), pm('burrow', '#1e140c'), scale=(1, 0.4, 0.8), segs=12)
    fern = leaf_mats('#3a8a2e', 'fern')
    for i, (gx, gz) in enumerate(((1.3, 0.4), (1.6, 0.9), (1.4, 1.5), (0.5, 1.5))):
        p = P(gx, gz)
        for k in range(7):
            a = k * 0.9 + i
            obox(uid('fern'), (p[0] + math.cos(a) * 0.1, p[1] + math.sin(a) * 0.1, 0.08),
                 ((math.cos(a), math.sin(a), 0.4), (-math.sin(a), math.cos(a), 0), (-0.4 * math.cos(a), -0.4 * math.sin(a), 1)),
                 (0.24, 0.06, 0.01), fern[k % 3], bev=0)


def pines(m, snowy=False):
    leaf = leaf_mats('#2e7a2a' if not snowy else '#2a6a3a', 'pine')
    bark = bark_mat()
    for i, (gx, gz, s) in enumerate(((0.4, 0.4, 0.85), (2.6, 0.5, 0.7), (0.5, 2.5, 0.72))):
        p = P(gx, gz)
        pine(p[0], p[1], s, leaf, bark, seed=i + 1)
    lick = pm('saltlick', '#e8e2d6')
    box(uid('lick'), (0.18, 0.18, 0.1), P(1.7, 1.4, 0.05), lick, bev=0.02)
    for k in range(3):
        rock(uid('rk'), 0.08 + k * 0.02, P(2.5 + k * 0.1, 2.3 - k * 0.12, 0.03), m['stone'][k], seed=k + 3, squash=0.6)


def golden_nest(m):
    c = P(1.0, 1.0)
    straw = pm('nest_straw', '#b88a3a', '#d0a24a', scale=30, kind='wave', stretch=(1, 1, 6))
    torus(uid('nest'), 0.42, 0.15, (c[0], c[1], 0.12), straw, segs=28, rsegs=10)
    cyl(uid('lining'), 0.42, 0.06, (c[0], c[1], 0.05), m['hay'], verts=24)
    rnd = random.Random(3)
    for i in range(30):
        a = rnd.uniform(0, 6.28)
        r = rnd.uniform(0.3, 0.55)
        box(uid('twig'), (0.2, 0.012, 0.012), (c[0] + math.cos(a) * r, c[1] + math.sin(a) * r, rnd.uniform(0.05, 0.24)), straw,
            rot=(rnd.uniform(-0.4, 0.4), 0, a + R90 + rnd.uniform(-0.4, 0.4)), bev=0)
    gold = pm('gold_deco', '#e8b020', rough=0.3, metal=0.7)
    for k in range(4):
        p = P([0.25, 1.75, 0.3, 1.7][k], [0.3, 0.3, 1.7, 1.7][k])
        cyl(uid('gpost'), 0.04, 0.3, (p[0], p[1], 0.15), m['stone'][1], verts=10)
        ball(uid('gball'), 0.05, (p[0], p[1], 0.34), gold, segs=10)


def silk(m, roof):
    wall = pm('silk_wall', '#f4efe6', '#fbf8f0', scale=20)
    cx, cy = house(m, wall, roof, 0.45, 0.45, 0.56, 0.46, 0.42, style='plaster', seed=8, window_=False, rise=0.24)
    lan = pm('paper_lantern', '#e8402a', emit=0.6)
    ball(uid('lan'), 0.05, (cx + 0.2, cy - 0.3, 0.44), lan, scale=(1, 1, 1.2), segs=12)
    leaf = leaf_mats('#3f8a33', 'mul')
    for i, (gx, gz) in enumerate(((1.5, 0.4), (1.55, 1.5), (0.5, 1.5))):
        p = P(gx, gz)
        cyl(uid('mt'), 0.04, 0.3, (p[0], p[1], 0.15), bark_mat(), verts=8)
        clump(p[0], p[1], 0.42, 0.24, leaf, n=22, seed=i + 5, leaf=0.32)
        for k in range(4):
            ball(uid('berry'), 0.02, (p[0] + math.cos(k * 1.6) * 0.2, p[1] - 0.12 + math.sin(k * 1.6) * 0.05, 0.36), pm('mulberry', '#4a1a3a'), segs=6)


def squirrel(m):
    leaf = leaf_mats('#4a9a34', 'sq')
    p = P(0.55, 0.55)
    oak(p[0], p[1], 0.9, leaf, bark_mat(), seed=7)
    ball(uid('knot'), 0.05, (p[0] + 0.02, p[1] - 0.085, 0.45), pm('knot', '#2a1a10'), scale=(0.9, 0.4, 1.2), segs=10)
    acorn, cap = pm('acorn', '#a8703a'), pm('acorn_cap', '#6a4222')
    rnd = random.Random(2)
    for i in range(7):
        q = P(0.9 + rnd.random() * 0.9, 0.9 + rnd.random() * 0.9)
        ball(uid('ac'), 0.025, (q[0], q[1], 0.025), acorn, scale=(1, 1, 1.2), segs=8)
        ball(uid('acc'), 0.022, (q[0], q[1], 0.05), cap, scale=(1, 1, 0.6), segs=8)
    stump = P(1.6, 0.4)
    cyl(uid('stump'), 0.12, 0.14, (stump[0], stump[1], 0.07), bark_mat(), verts=12)
    cyl(uid('rings'), 0.11, 0.01, (stump[0], stump[1], 0.145), pm('logcut', '#d8b078'), verts=12, bev=0)


def parrot(m):
    for gx, gz in ((0.5, 1.4), (1.5, 0.6)):
        p = P(gx, gz)
        cyl(uid('pp'), 0.022, 0.6, (p[0], p[1], 0.3), m['wood_dark'], verts=8)
        box(uid('pb'), (0.4, 0.03, 0.03), (p[0], p[1], 0.6), m['wood_dark'], bev=0)
        for sx in (-1, 1):
            cyl(uid('cup'), 0.03, 0.03, (p[0] + sx * 0.2, p[1], 0.62), pm('seed_cup', '#e8b020'), verts=10)
    p = P(0.4, 0.4)
    palm(p[0], p[1], 0.62, leaf_mats('#3a9a30', 'pal'), bark_mat('palm_bark', '#8a6a44', '#a07e52'), seed=3, lean=(0.7, -0.7))
    for i, (gx, gz) in enumerate(((1.6, 1.6), (1.2, 1.7))):
        q = P(gx, gz)
        for k in range(5):
            ball(uid('trop'), 0.035, (q[0] + math.cos(k * 1.25) * 0.05, q[1] + math.sin(k * 1.25) * 0.05, 0.1), pm(f'trop{i}', ['#f0402a', '#f0c020'][i]), segs=8)
        clump(q[0], q[1], 0.05, 0.08, leaf_mats('#3a8a2a', 'tl'), n=8, seed=i, leaf=0.4)


def arbor(m):
    white = pm('arb_white', '#f6f2ea', rough=0.6)
    for gx in (0.3, 1.1):
        for gz in (0.3, 0.7):
            p = P(gx, gz)
            box(uid('ap'), (0.04, 0.04, 0.72), (p[0], p[1], 0.36), white, bev=0.006)
    for k in range(5):
        p = P(0.3 + k * 0.2, 0.5)
        box(uid('ab'), (0.03, 0.5, 0.03), (p[0], p[1], 0.73), white, bev=0)
    for gz in (0.3, 0.7):
        p = P(0.7, gz)
        box(uid('abeam'), (0.9, 0.03, 0.04), (p[0], p[1], 0.72), white, bev=0)
    rose = [pm('ar1', '#d8203a'), pm('ar2', '#f06a9a')]
    leaf = leaf_mats('#3f8f2e', 'arl')
    for i in range(16):
        p = P(0.3 + (i % 8) * 0.11, 0.3 + (i // 8) * 0.4)
        ball(uid('al'), 0.05, (p[0], p[1], 0.74 + (i % 3) * 0.03), leaf[i % 3], segs=8)
        if i % 3 == 0:
            ball(uid('ar'), 0.03, (p[0], p[1] - 0.03, 0.79), rose[i % 2], segs=8)
    c = P(1.5, 1.5)
    stone = pm('pg_stone', '#d0c8b8', '#e0d8c8', scale=20)
    cyl(uid('fb'), 0.08, 0.1, (c[0], c[1], 0.05), stone, verts=14)
    cyl(uid('fbowl'), 0.12, 0.06, (c[0], c[1], 0.14), stone, verts=18, r2=0.2)
    torus(uid('frim'), 0.2, 0.02, (c[0], c[1], 0.18), stone, segs=22, rsegs=5)


def marsh(m):
    pond_rim(1.0, 1.1, 0.5, m, sand='#8a9a58', stones=False, seed=3, reeds=16)
    pond_rim(2.1, 2.0, 0.55, m, sand='#8a9a58', stones=False, seed=5, reeds=16)
    for i, (gx, gz) in enumerate(((0.5, 2.4), (2.5, 0.6))):
        p = P(gx, gz)
        rock(uid('rk'), 0.12, (p[0], p[1], 0.04), m['stone'][i], seed=i, squash=0.6)


def beaver(m):
    pond_rim(1.5, 1.4, 0.64, m, sand='#a89060', stones=False, seed=4, reeds=8)
    logm = bark_mat('dam_log', '#7a5a3a', '#8e6a44')
    rnd = random.Random(5)
    for i in range(9):
        p = P(1.2 + (i % 3) * 0.3, 2.1 + (rnd.random() - 0.5) * 0.08)
        cyl(uid('dlog'), 0.04, 0.5 + rnd.random() * 0.3, (p[0], p[1], 0.05 + (i // 3) * 0.06), logm, verts=8,
            rot=(0, R90, (rnd.random() - 0.5) * 0.4))
    c = P(1.65, 1.2)
    ball(uid('lodge'), 0.36, (c[0], c[1], 0.02), pm('lodge_mud', '#6a4a2a', '#7a5832', scale=20), scale=(1, 0.9, 0.8), segs=16)
    for i in range(18):
        a = rnd.uniform(0, 6.28)
        box(uid('stick'), (0.3, 0.02, 0.02), (c[0] + math.cos(a) * 0.2, c[1] + math.sin(a) * 0.18, rnd.uniform(0.08, 0.26)), logm,
            rot=(rnd.uniform(-0.5, 0.5), rnd.uniform(-0.5, 0.5), a), bev=0)
    for k in range(3):
        p = P(0.4 + k * 0.2, 0.5)
        cyl(uid('stump'), 0.06, 0.1, (p[0], p[1], 0.05), logm, verts=10)
        cyl(uid('cut'), 0.055, 0.01, (p[0], p[1], 0.1), pm('logcut', '#d8b078'), verts=10, bev=0)


def hives_garden(m):
    rnd = random.Random(8)
    cols = [pm('bg1', '#f0c020'), pm('bg2', '#f06a9a'), pm('bg3', '#ffffff'), pm('bg4', '#9a6ad8'), pm('bg5', '#f08a2a')]
    stem = pm('stem', '#4a8a2a')
    for i in range(34):
        gx, gz = 0.15 + rnd.random() * 1.7, 0.15 + rnd.random() * 1.7
        if min(abs(gx - 0.5), abs(gx - 1.5)) < 0.22 and min(abs(gz - 0.5), abs(gz - 1.5)) < 0.22:
            continue
        p = P(gx, gz)
        h = rnd.uniform(0.1, 0.18)
        cyl(uid('st'), 0.006, h, (p[0], p[1], h / 2), stem, verts=4, bev=0, smooth=False)
        ball(uid('bl'), 0.035, (p[0], p[1], h + 0.01), cols[i % 5], scale=(1, 1, 0.6), segs=8)
    # sunflowers along the back
    for k in range(4):
        p = P(0.3 + k * 0.45, 0.12)
        cyl(uid('sfs'), 0.012, 0.5, (p[0], p[1], 0.25), stem, verts=6)
        cyl(uid('sfh'), 0.08, 0.02, (p[0], p[1] - 0.01, 0.52), pm('sunpetal', '#f0c020'), verts=14, rot=(math.radians(70), 0, 0))
        cyl(uid('sfc'), 0.045, 0.025, (p[0], p[1] - 0.02, 0.52), pm('suncenter', '#6a3a1a'), verts=12, rot=(math.radians(70), 0, 0))


def lagoon(m):
    pond_rim(1.5, 1.6, 1.0, m, sand='#f0d8a0', stones=False, seed=6, reeds=6)
    p = P(0.35, 0.35)
    palm(p[0], p[1], 0.75, leaf_mats('#3a9a30', 'lpal'), bark_mat('palm_bark', '#8a6a44', '#a07e52'), seed=4, lean=(0.7, -0.7))
    for k in range(4):
        q = P(2.6, 0.4 + k * 0.15)
        ball(uid('shell'), 0.03, (q[0], q[1], 0.02), pm('shell', '#f8d8c8'), scale=(1, 1, 0.5), segs=8)


def goat_rocks(m):
    for i, (gx, gz, r) in enumerate(((2.35, 0.6, 0.26), (2.6, 0.9, 0.18), (2.1, 0.45, 0.16))):
        rock(uid('grk'), r, P(gx, gz, r * 0.4), m['stone'][i], seed=i + 11, squash=0.8)
    box(uid('plank'), (0.5, 0.12, 0.03), P(1.9, 0.75, 0.2), m['wood'], rot=(0, 0.35, 0.3), bev=0.006)


def tall_grass(m, n=10, seed=1):
    rnd = random.Random(seed)
    g = pm('tallgrass', '#6a9a2a', '#7aaa36', scale=20)
    for i in range(n):
        gx, gz = rnd.uniform(1.6, PW - 0.3), rnd.uniform(0.3, 1.2)
        p = P(gx, gz)
        for k in range(5):
            cyl(uid('tg'), 0.012, 0.3, (p[0] + (k - 2) * 0.02, p[1], 0.15), g, verts=4, r2=0.0, rot=((k - 2) * 0.15, (k % 2 - 0.5) * 0.3, 0),
                bev=0, smooth=False)


# ---------------------------------------------------------------- the pen table

WHITE = {'guernsey_pasture', 'palomino_stable', 'dutch_hutch', 'sheepfold', 'stable', 'alpaca_ranch', 'peacock_garden', 'rabbit_hutch', 'pony_paddock', 'black_sheepfold', 'merino_fold',
         'jacob_fold', 'silkie_coop', 'suffolk_fold', 'saanen_yard', 'valais_fold', 'charolais_pasture', 'appaloosa_stable', 'clydesdale_stable', 'angora_hutch', 'deer_park', 'chinchilla_hutch'}
LOG = {'shetland_fold', 'karakul_fold', 'alpine_yard', 'longhorn_ranch', 'elk_woods', 'mule_paddock', 'reindeer_lodge', 'bison_range', 'moose_woods', 'musk_ox_range', 'yak_pasture', 'beaver_pond'}
STONE = {'highland_pasture', 'galloway_pasture'}
BAMBOO = {'parrot_aviary', 'silk_house', 'kiwi_burrow', 'crane_marsh', 'flamingo_lagoon', 'heron_marsh'}
NO_TROUGH = {'beehive', 'duck_pond', 'goose_pen', 'peacock_garden', 'swan_lake', 'flamingo_lagoon', 'golden_nest', 'mandarin_pond',
             'black_swan_lake', 'silk_house', 'parrot_aviary', 'kiwi_burrow', 'squirrel_grove', 'crane_marsh', 'heron_marsh', 'pekin_pond', 'toulouse_pen', 'runner_pen', 'white_peacock_garden', 'campbell_pond', 'call_duck_pond', 'emden_pen'}

# id: (w, h, roof color, wall color, shelter)
PENS = {
    'coop': (2, 2, '#b5452c', '#e3c27a', 'coop'), 'silkie_coop': (2, 2, '#e07898', '#e8cf94', 'coop'),
    'guinea_run': (2, 2, '#5a7a2a', '#d0a868', 'coop'), 'gobbler_run': (2, 2, '#8e4a2b', '#c9a46a', 'coop'),
    'quail_coop': (2, 2, '#5a7a2a', '#e0cc98', 'quail'),
    'pasture': (3, 2, '#6b4226', None, 'open'), 'sheepfold': (3, 2, '#2e6aa8', None, 'open'), 'goat_yard': (3, 2, '#7a4b26', None, 'goat'),
    'duck_pond': (3, 2, '#2e6aa8', '#f0e2c0', 'duck'), 'beehive': (2, 2, '#f5b92b', None, 'hives'),
    'rabbit_hutch': (2, 2, '#c0302a', '#d9b27a', 'hutch'), 'chinchilla_hutch': (2, 2, '#6a7a98', '#c8b890', 'hutch'),
    'alpaca_ranch': (3, 2, '#7d5ba6', None, 'open'), 'goose_pen': (2, 2, '#3a78c0', '#f0e2c0', 'goose'),
    'donkey_paddock': (3, 2, '#6b4226', None, 'open'), 'buffalo_wallow': (3, 2, '#4a6a3a', None, 'thatch'),
    'peacock_garden': (2, 2, '#2e7d8a', None, 'arbor'), 'ostrich_ranch': (3, 2, '#b5452c', None, 'thatch_grass'),
    'yak_pasture': (3, 2, '#5a3a2a', None, 'open'), 'camel_corral': (3, 2, '#c0602a', None, 'awning_palm'),
    'stable': (3, 2, '#8e2c20', '#b86038', 'stable'), 'pheasant_run': (3, 2, '#8a3a2a', None, 'open_grass'),
    'highland_pasture': (3, 2, '#5a3a24', None, 'open'), 'swan_lake': (3, 2, '#f4efe6', None, 'pavilion'),
    'emu_ranch': (3, 2, '#7a5a3a', None, 'thatch_grass'), 'reindeer_lodge': (3, 2, '#f4f8fa', None, 'lodge'),
    'bison_range': (3, 2, '#4a3424', None, 'open'), 'flamingo_lagoon': (3, 2, '#f28ab0', None, 'lagoon'),
    'llama_ranch': (3, 2, '#c0392b', None, 'open'), 'pony_paddock': (3, 2, '#c0392b', '#c86a48', 'stable'),
    'black_sheepfold': (3, 2, '#34495e', None, 'open'), 'jersey_pasture': (3, 2, '#8a5a34', None, 'open'),
    'muscovy_pond': (3, 2, '#2e6aa8', '#f0e2c0', 'muscovy'), 'nubian_yard': (3, 2, '#8a3a2a', None, 'goat'),
    'silk_house': (2, 2, '#b5452c', None, 'silk'), 'angora_yard': (3, 2, '#6b4226', None, 'goat'),
    'mandarin_pond': (3, 2, '#c0392b', None, 'pavilion'), 'squirrel_grove': (2, 2, '#6b4226', None, 'squirrel'),
    'merino_fold': (3, 2, '#5a7a9a', None, 'open'), 'parrot_aviary': (2, 2, '#2a8a5a', None, 'parrot'),
    'galloway_pasture': (3, 2, '#34495e', None, 'open'), 'moose_woods': (3, 2, '#5a3a24', None, 'pines'),
    'cashmere_yard': (3, 2, '#8a6a4a', None, 'goat'), 'rhea_ranch': (3, 2, '#7a5a3a', None, 'thatch_grass'),
    'bactrian_corral': (3, 2, '#b5452c', None, 'awning'), 'beaver_pond': (3, 2, '#6b4226', None, 'beaver'),
    'jacob_fold': (3, 2, '#6b4226', None, 'open'), 'deer_park': (3, 2, '#5a3a24', None, 'pines'),
    'crane_marsh': (3, 2, '#f4efe6', None, 'marsh'), 'zebu_pasture': (3, 2, '#b5452c', None, 'thatch'),
    'musk_ox_range': (3, 2, '#4a3424', None, 'open_snow'), 'black_swan_lake': (3, 2, '#34495e', None, 'pavilion'),
    'cassowary_ranch': (3, 2, '#2a6a8a', None, 'thatch_grass'), 'watusi_ranch': (3, 2, '#8a3a2a', None, 'thatch'),
    'kiwi_burrow': (2, 2, '#6b4226', None, 'kiwi'),
    'vicuna_ranch': (3, 2, '#c0392b', None, 'open'), 'golden_nest': (2, 2, '#d4a020', None, 'nest'),
    'hereford_ranch': (3, 2, '#8a3a2a', None, 'open'), 'suffolk_fold': (3, 2, '#2e4a6a', None, 'open'),
    'turkey_run': (2, 2, '#8e4a2b', '#c9a46a', 'coop'), 'saanen_yard': (3, 2, '#6b4226', None, 'goat'),
    'cemani_coop': (2, 2, '#2a2a34', '#d8c090', 'coop'), 'heron_marsh': (3, 2, '#5a7a8a', None, 'marsh'),
    'pekin_pond': (3, 2, '#2e6aa8', '#f0e2c0', 'duck'),
    'orpington_coop': (2, 2, '#b5452c', '#e8cf94', 'coop'),
    'lop_hutch': (2, 2, '#8a5a34', '#d9b27a', 'hutch'),
    'pygmy_yard': (3, 2, '#6a4a2a', None, 'goat'),
    'brahma_coop': (2, 2, '#5a5a6a', '#e0cc98', 'coop'),
    'toulouse_pen': (2, 2, '#3a78c0', '#f0e2c0', 'goose'),
    'angus_ranch': (3, 2, '#2a2a2e', None, 'open'),
    'polish_coop': (2, 2, '#c0392b', '#e3c27a', 'coop'),
    'valais_fold': (3, 2, '#34495e', None, 'open'),
    'runner_pen': (2, 2, '#6a8a3a', '#f0e2c0', 'goose'),
    'boer_yard': (3, 2, '#8a3a1a', None, 'goat'),
    'dorper_fold': (3, 2, '#4a4a4a', None, 'open'),
    'charolais_pasture': (3, 2, '#b5452c', None, 'open'),
    'angora_hutch': (2, 2, '#e07898', '#e8d8c0', 'hutch'),
    'white_peacock_garden': (2, 2, '#f4efe6', None, 'arbor'),
    'appaloosa_stable': (3, 2, '#5a3a24', '#b86038', 'stable'),
    'mule_paddock': (3, 2, '#6b4226', None, 'open'),
    'longhorn_ranch': (3, 2, '#8a3a1a', None, 'open'),
    'clydesdale_stable': (3, 2, '#2e4a6a', '#c86a48', 'stable'),
    'elk_woods': (3, 2, '#4a3424', None, 'pines'),
    'leghorn_coop': (2, 2, '#c0392b', '#f0e2c0', 'coop'),
    'campbell_pond': (3, 2, '#2e6aa8', '#f0e2c0', 'duck'),
    'dutch_hutch': (2, 2, '#34495e', '#d9b27a', 'hutch'),
    'rhode_coop': (2, 2, '#8a2a14', '#e3c27a', 'coop'),
    'guernsey_pasture': (3, 2, '#c8843a', None, 'open'),
    'shetland_fold': (3, 2, '#6b4226', None, 'open'),
    'call_duck_pond': (3, 2, '#3a78c0', '#f0e2c0', 'duck'),
    'alpine_yard': (3, 2, '#1e1c1c', None, 'goat'),
    'wyandotte_coop': (2, 2, '#5a5a6a', '#e0cc98', 'coop'),
    'swiss_pasture': (3, 2, '#6a5a4a', None, 'open'),
    'emden_pen': (2, 2, '#3a78c0', '#f0e2c0', 'goose'),
    'karakul_fold': (3, 2, '#2a2624', None, 'open'),
    'palomino_stable': (3, 2, '#d8a848', '#b86038', 'stable'),
    'marans_coop': (2, 2, '#6a3a1e', '#e8cf94', 'coop'),
    'dexter_pasture': (3, 2, '#2a2a2e', None, 'open'),
    'friesian_stable': (3, 2, '#1e1c1e', '#8a5a3a', 'stable'),
}


def squash(before, k):
    """Scale everything built since `before` to k of its depth about the pen's centre line, so a
    layout drawn for a 3 x 3 pen fits the 3 x 2 one (the fence is built at the real size)."""
    S = Matrix.Diagonal((1.0, k, 1.0, 1.0))
    for name in set(bpy.data.objects.keys()) - before:
        ob = bpy.data.objects[name]
        if ob.type == 'MESH':
            ob.data.transform(ob.matrix_world)
            ob.matrix_world = Matrix.Identity(4)
            ob.data.transform(S)
        else:
            ob.location.y *= k


def build_pen(pid):
    global PW, PH
    w, h, roof, wall, kind = PENS[pid]
    PW, PH = w, h
    m = std()
    if pid != 'beehive':
        style = 'white' if pid in WHITE else 'log' if pid in LOG else 'stone' if pid in STONE else 'bamboo' if pid in BAMBOO else 'wood'
        fence(m, style)
    # the wide pens are 3 x 2 now; their shelters and scenery are laid out as for 3 x 3 and then
    # pressed into the shallower yard
    design = 3 if (w, h) == (3, 2) else h
    PH = h = design
    before = set(bpy.data.objects.keys())
    wallm = pm(uid('pw'), wall, scale=6, kind='wave', stretch=(8, 8, 1)) if wall else None
    if kind in ('open', 'open_grass', 'goat', 'open_snow'):
        open_shed(m, roof)
        if kind == 'open_grass':
            tall_grass(m, seed=2)
        if kind == 'goat':
            goat_rocks(m)
        if kind == 'open_snow':
            snowm = pm('snow', '#f6fafc', '#ffffff', scale=20)
            for i, (gx, gz, r) in enumerate(((0.4, 1.5, 0.2), (2.4, 1.3, 0.24), (1.4, 2.6, 0.2), (2.6, 2.4, 0.18))):
                snow(*P(gx, gz)[:2], r, snowm, seed=i)
    elif kind in ('thatch', 'thatch_grass'):
        open_shed(m, roof, thatch=True)
        if kind == 'thatch_grass':
            tall_grass(m, seed=4)
        if pid == 'buffalo_wallow':
            pond_rim(2.0, 1.95, 0.55, m, sand='#5a4028', stones=False, seed=2, reeds=5)
    elif kind == 'coop':
        coop(m, wallm, roof)
    elif kind == 'quail':
        house(m, wallm, roof, 0.55, 0.45, 0.7, 0.5, 0.26, style='batten', seed=3, window_=False, rise=0.24)
    elif kind in ('duck', 'muscovy', 'goose'):
        at = {'duck': (0.45, 0.45), 'muscovy': (0.45, 0.45), 'goose': (0.45, 0.42)}[kind]
        house(m, wallm, roof, at[0], at[1], 0.5, 0.45, 0.32 if kind != 'goose' else 0.28, style='clap', seed=4, window_=False,
              rise=0.22 if kind != 'goose' else 0.26)
        if kind == 'duck':
            pond_rim(1.7, 1.7, 0.85, m, seed=1, reeds=6)
            lily_pads(1.7, 1.7, 0.6)
        elif kind == 'muscovy':
            pond_rim(0.8, 2.2, 0.48, m, seed=2, reeds=5)
        else:
            pond_rim(1.45, 1.45, 0.37, m, seed=3, reeds=4)
    elif kind == 'stable':
        stable(m, wallm, roof)
    elif kind == 'lodge':
        lodge(m)
    elif kind == 'pavilion':
        pavilion(m)
        pond_rim(1.7, 1.7, 0.85, m, seed=5, reeds=6)
        lily_pads(1.7, 1.7, 0.6, seed=2)
    elif kind == 'hutch':
        hutch(m, wallm, roof)
    elif kind in ('awning', 'awning_palm'):
        awning_shade(m, roof)
        if kind == 'awning_palm':
            p = P(0.45, 2.5)
            palm(p[0], p[1], 0.8, leaf_mats('#3a9a30', 'cpal'), bark_mat('palm_bark', '#8a6a44', '#a07e52'), seed=5, lean=(0.6, 0.6))
    elif kind == 'kiwi':
        kiwi(m)
    elif kind == 'pines':
        pines(m)
    elif kind == 'nest':
        golden_nest(m)
    elif kind == 'silk':
        silk(m, roof)
    elif kind == 'squirrel':
        squirrel(m)
    elif kind == 'parrot':
        parrot(m)
    elif kind == 'arbor':
        arbor(m)
    elif kind == 'marsh':
        marsh(m)
    elif kind == 'beaver':
        beaver(m)
    elif kind == 'hives':
        hives_garden(m)
    elif kind == 'lagoon':
        lagoon(m)
    if pid not in NO_TROUGH:
        trough(m, w - 0.55, h - 0.35)
    if design != PENS[pid][1]:
        squash(before, PENS[pid][1] / design)
    finish(pid, tex=1024)


MODELS = {pid: (lambda p=pid: build_pen(p)) for pid in PENS}

if __name__ == '__main__':
    main(MODELS)
