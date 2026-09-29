# Breeds built on the realistic sculpts (tools/blender/sculpts/real_<base>.json): the same
# lifelike body as the plain cow, horse, sheep, goat, alpaca, donkey or duck, painted in each
# breed's own coat and markings, sized for the breed, and given what sets it apart (the longhorn's
# great horns, the zebu's hump, the highland's shaggy fringe, the Jacob's four horns...). Parts and
# pivots are those of the base (`head`, `leg0..3`, `tail`), so the game animates them the same way.
# Goats are sculpted here from scratch (goat_model), the game's goat sculpt being too rough.
# Run: python3 tools/blender/breeds.py [names...]   (see kit.main)
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from animals import SCULPTS, B, Blob, noise, part_mesh  # noqa: E402
from kit import anim_group, ball, finish, main, marker, pm, uid  # noqa: E402


def lin(h):
    """'#rrggbb' to linear rgb, as the sculpts keep their colours."""
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def shade(c, x, y, z, amt=0.08, f=40):
    """A coat colour with a little natural unevenness."""
    k = 1 + noise(x, y, z, f) * amt
    return tuple(min(1.0, v * k) for v in c)


def dark(rgb):
    return max(rgb) < 0.06


def pinkish(rgb):
    return rgb[0] - rgb[1] > 0.18 and rgb[0] > 0.35


def tan(rgb):
    return rgb[0] - rgb[2] > 0.14 and rgb[1] - rgb[2] > 0.08 and rgb[0] > 0.45 and not pinkish(rgb)


class Part:
    """What the painter knows about a vertex: which part, where (game coords of the base animal,
    and local to the part), and the base sculpt's own colour there."""
    __slots__ = ('part', 'x', 'y', 'z', 'lx', 'ly', 'lz', 'rgb', 'leg')


def build(kind, base, paint, drop=None, head_extra=None, body_extra=None, S=1.0, goat_horns=False, horn_col='#8d8479', warp=None,
          tail=True):
    # `base` names a realistic sculpt; 'toon:<kind>' one of the game's cartoon sculpts instead
    fname = f'{base[5:]}.json' if base.startswith('toon:') else f'real_{base}.json'
    with open(os.path.join(SCULPTS, fname)) as f:
        d = json.load(f)
    meta = d['meta']
    hx, hy, hz = meta['headAt']

    def recolor(data, part, off, leg=-1):
        p, c = list(data['p']), data['c'] or [0.5] * len(data['p'])
        n = len(p) // 3
        out = list(c)
        keep = [True] * n
        v = Part()
        v.part, v.leg = part, leg
        for k in range(n):
            v.lx, v.ly, v.lz = p[k * 3], p[k * 3 + 1], p[k * 3 + 2]
            v.x, v.y, v.z = v.lx + off[0], v.ly + off[1], v.lz + off[2]
            v.rgb = (c[k * 3], c[k * 3 + 1], c[k * 3 + 2])
            if warp:
                w = warp(v)
                if w:
                    p[k * 3], p[k * 3 + 1], p[k * 3 + 2] = w
                    v.lx, v.ly, v.lz = w
                    v.x, v.y, v.z = v.lx + off[0], v.ly + off[1], v.lz + off[2]
            if drop and drop(v):
                keep[k] = False
                continue
            out[k * 3:k * 3 + 3] = paint(v)
        idx = data['i'] or list(range(n))
        tris = [idx[k:k + 3] for k in range(0, len(idx), 3)]
        tris = [t for t in tris if keep[t[0]] and keep[t[1]] and keep[t[2]]]
        used = sorted({i for t in tris for i in t})
        remap = {o: i for i, o in enumerate(used)}
        return {
            'p': [p[o * 3 + j] for o in used for j in range(3)],
            'c': [out[o * 3 + j] for o in used for j in range(3)],
            'i': [remap[i] for t in tris for i in t],
        }

    part_mesh('body', recolor(d['body'], 'body', (0, 0, 0)), (0, 0, 0), 2600, scale=S)
    if body_extra:
        body_extra(S)
    with anim_group('head', B(hx * S, hy * S, hz * S)):
        part_mesh('headm', recolor(d['head'], 'head', (hx, hy, hz)), (hx * S, hy * S, hz * S), 1800, scale=S)
        if goat_horns:
            arc_horns((hx, hy, hz), S, R=0.05, t=0.01, arc=math.pi * 0.85, at=(0.022, 0.04, -0.045), rot=(0, math.pi / 2, 0.1), col=horn_col)
        if head_extra:
            head_extra(S, (hx, hy, hz))
    if d['leg']:
        ll = meta['legLen']
        for i, (x, z) in enumerate(meta['legs']):
            with anim_group(f'leg{i}', B(x * S, ll * S, z * S)):
                part_mesh(f'legm{i}', recolor(d['leg'], 'leg', (x, ll, z), i), (x * S, ll * S, z * S), 320, scale=S)
    if d['tail'] and tail:
        tx, ty, tz = meta['tailAt']
        with anim_group('tail', B(tx * S, ty * S, tz * S)):
            part_mesh('tailm', recolor(d['tail'], 'tail', (tx, ty, tz)), (tx * S, ty * S, tz * S), 320, scale=S)
    if meta.get('eye'):
        ex, ey, ez, er, yaw = meta['eye']
        mk = marker('eye', B((hx + ex) * S, (hy + ey) * S, (hz + ez) * S))
        mk.scale = (er * S, er * S, er * S)
        mk.rotation_euler[2] = yaw
    finish(f'animal_{kind}', tex=512, vivid=1.08, ao_min=0.62, ao_dist=0.1)


def arc_horns(head, S, R, t, arc, at, rot, col, flip=False):
    """A pair of horns as arcs of a circle (like the game's goat horns)."""
    import mathutils
    mat = pm(uid('hornm'), col)
    for sx in (-1, 1):
        rx, ry, rz = rot
        if flip and sx < 0:
            ry += math.pi
        M = mathutils.Euler((rx, ry, rz), 'XYZ').to_matrix()
        pts = []
        for k in range(9):
            a = arc * k / 8
            v = M @ mathutils.Vector((R * math.cos(a), R * math.sin(a), 0))
            pts.append(((head[0] + sx * at[0] + v.x) * S, (head[1] + at[1] + v.y) * S, (head[2] + at[2] + v.z) * S))
        b = Blob(0.003)
        for k in range(8):
            b.cap(pts[k], pts[k + 1], t * S * (1.1 - k * 0.06), t * S * (1.1 - (k + 1) * 0.06))
        b.build(mat, 300)


def horn_path(pts, r0, r1, base, tip, res=0.003, faces=500):
    """A horn along the points `pts` (game coords), `r0` thick at the root narrowing to `r1`,
    pale `base` darkening to the `tip` colour over the last third."""
    b = Blob(res)
    n = len(pts) - 1
    for k in range(n):
        b.cap(pts[k], pts[k + 1], r0 + (r1 - r0) * k / n, r0 + (r1 - r0) * (k + 1) / n)
    ends = pts[-1]

    def paint(x, y, z):
        d = math.dist((x, y, z), ends)
        return tip if d < 0.3 * sum(math.dist(pts[k], pts[k + 1]) for k in range(n)) else base
    b.build(paint, faces)


def curve(p0, p1, p2, n=10):
    """Points along a quadratic curve from p0 to p2, pulled toward p1."""
    out = []
    for k in range(n + 1):
        t = k / n
        out.append(tuple((1 - t) ** 2 * p0[i] + 2 * (1 - t) * t * p1[i] + t * t * p2[i] for i in range(3)))
    return out


# ---------------------------------------------------------------- cattle (real_cow)

def cow_region(v):
    """hoof, horn, nose, ear (inside), udder, switch (tail tuft) or coat, on the real cow."""
    if v.part == 'leg' and v.ly < -0.17:
        return 'hoof'
    if v.part == 'head':
        if tan(v.rgb):
            return 'horn'
        if pinkish(v.rgb):
            return 'ear' if abs(v.lx) > 0.08 else 'nose'
    if v.part == 'body' and pinkish(v.rgb):
        return 'udder'
    if v.part == 'tail' and v.ly < -0.2:
        return 'switch'
    return 'coat'


def cattle(kind, coat, nose='#e6a8a0', ear=None, hoof='#3a302a', horn='#e8dcc0', udder=None, switch=None, polled=False,
           head_extra=None, body_extra=None, S=1.0):
    nose_c, hoof_c, horn_c = lin(nose), lin(hoof), lin(horn)
    ear_c, udder_c = lin(ear or nose), lin(udder or nose)
    sw = lin(switch) if switch else None

    def paint(v):
        r = cow_region(v)
        if r == 'hoof':
            return hoof_c
        if r == 'horn':
            return mix(horn_c, lin('#3a3028'), max(0, (v.ly - 0.1) / 0.03)) if v.ly > 0.1 else horn_c
        if r == 'nose':
            return nose_c
        if r == 'ear':
            return ear_c
        if r == 'udder':
            return udder_c
        if r == 'switch' and sw:
            return sw
        return coat(v)
    drop = (lambda v: v.part == 'head' and tan(v.rgb)) if polled else None
    build(kind, 'cow', paint, drop=drop, head_extra=head_extra, body_extra=body_extra, S=S)


def solid(h, amt=0.08, f=40):
    c = lin(h)
    return lambda v: shade(c, v.x, v.y, v.z, amt, f)


def angus_cow():
    cattle('angus_cow', solid('#1e1b19', 0.25, 30), nose='#2e2a28', ear='#3a3432', udder='#3a3030', hoof='#1a1614', polled=True)


def belted_galloway():
    black, white = lin('#1d1b19'), lin('#f1ede4')

    def coat(v):
        if v.part == 'body' and -0.07 + noise(v.x, v.y, 0, 25) * 0.015 < v.z < 0.09 + noise(v.x, v.y, 3, 25) * 0.015:
            return shade(white, v.x, v.y, v.z, 0.04)
        return shade(black, v.x, v.y, v.z, 0.25, 30)
    cattle('belted_galloway', coat, nose='#2e2a28', ear='#3a3432', udder='#d8b0a8', hoof='#1a1614', polled=True)


def dexter():
    cattle('dexter', solid('#211d1a', 0.25, 30), nose='#34302c', ear='#3a3432', udder='#4a3a36', horn='#e8dcc0', S=0.84)


def charolais():
    cattle('charolais', solid('#eee4cf', 0.05, 30), nose='#e8b4a4', ear='#efc8b8', hoof='#8a7a68', horn='#f0e6d0')


def brown_swiss():
    grey, ring, dark_c = lin('#7b6b5e'), lin('#e2d9c8'), lin('#4e433b')

    def coat(v):
        if v.part == 'head' and v.lz > 0.13:
            return ring                                  # the pale ring round the dark muzzle
        if v.part == 'head' and v.ly > 0.04 and abs(v.lx) < 0.05:
            return shade(ring, v.x, v.y, v.z, 0.05)      # pale tuft on the poll
        if v.part == 'leg' and v.ly < -0.12:
            return dark_c
        return shade(grey, v.x, v.y, v.z, 0.1, 30)
    cattle('brown_swiss', coat, nose='#2a2522', ear='#e0d8c8', udder='#cbb8a8', horn='#e8e0cc')


def hereford():
    red, white = lin('#8c3a1c'), lin('#f4efe6')

    def coat(v):
        n = noise(v.x, v.y, v.z, 18) * 0.02
        if v.part == 'head':
            return shade(white, v.x, v.y, v.z, 0.03)     # the white face
        if v.part == 'body':
            if v.y < 0.23 + n:
                return white                              # the underline
            if v.z > 0.2 and (v.y < 0.33 + n or v.y > 0.45 + n):
                return white                              # brisket, dewlap and crest
        if v.part == 'leg' and v.ly < -0.1 + n:
            return white
        if v.part == 'tail' and v.ly < -0.19:
            return white
        return shade(red, v.x, v.y, v.z, 0.12, 30)
    cattle('hereford', coat, nose='#e8aaa0', ear='#e8b8b0', horn='#efe4c8', switch='#f4efe6')


def guernsey():
    fawn, white = lin('#c47a36'), lin('#f5f0e6')

    def coat(v):
        if v.part == 'leg' and v.ly < -0.08:
            return white
        if v.part == 'head' and abs(v.lx) < 0.03 and v.lz > 0.02:
            return white                                  # a blaze down the face
        n = noise(v.x + 5, v.y, v.z, 9)
        return shade(white, v.x, v.y, v.z, 0.03) if n > 0.28 else shade(fawn, v.x, v.y, v.z, 0.1, 30)
    cattle('guernsey', coat, nose='#e8c0a0', ear='#e8c8a8', horn='#efe4c8', switch='#f5f0e6')


def jersey_cow():
    fawn, dusk, ring = lin('#b07a4a'), lin('#5e4230'), lin('#eadcc6')

    def coat(v):
        if v.part == 'head':
            if v.lz > 0.12:
                return ring                               # the pale muzzle ring
            return mix(fawn, dusk, 0.55)
        if v.part == 'leg':
            return mix(fawn, dusk, min(1, max(0, (-v.ly - 0.05) / 0.12)))
        # darker over the neck, shoulders and hindquarters, as Jerseys are
        k = min(1, max(0, (abs(v.z - 0.02) - 0.14) / 0.14)) * 0.55
        return shade(mix(fawn, dusk, k), v.x, v.y, v.z, 0.08, 30)
    cattle('jersey_cow', coat, nose='#1f1a18', ear='#e0ccb4', udder='#e0b8a0', horn='#e8dcc4', switch='#2a201a')


def texas_longhorn():
    red, white, spot = lin('#94421e'), lin('#efe6d6'), lin('#6a2e16')

    def coat(v):
        n = noise(v.x + 2, v.y, v.z, 7)
        if n > 0.18:
            return shade(white, v.x, v.y, v.z, 0.03)
        # freckles of red at the edges of the white
        if n > 0.08 and noise(v.x, v.y, v.z, 90) > 0.2:
            return spot
        return shade(red, v.x, v.y, v.z, 0.12, 30)

    def horns(S, h):
        hx, hy, hz = h
        for sx in (-1, 1):
            # out sideways a long way, a gentle twist up and forward at the tips
            pts = curve((sx * 0.06, hy + 0.09, hz - 0.01), (sx * 0.3, hy + 0.09, hz - 0.03), (sx * 0.42, hy + 0.2, hz + 0.04), 12)
            horn_path([tuple(c * S for c in p) for p in pts], 0.022 * S, 0.005 * S, pm('lh_horn', '#e6d8b8'), pm('lh_tip', '#4a3a2c'))
    cattle('texas_longhorn', coat, nose='#d89a8a', ear='#e0b0a0', horn='#e6d8b8', switch='#efe6d6', polled=True, head_extra=horns)


def watusi():
    def horns(S, h):
        hx, hy, hz = h
        for sx in (-1, 1):
            # the Ankole-Watusi's huge, thick lyre of horns
            pts = curve((sx * 0.055, hy + 0.09, hz - 0.01), (sx * 0.26, hy + 0.2, hz - 0.08), (sx * 0.2, hy + 0.42, hz - 0.02), 12)
            horn_path([tuple(c * S for c in p) for p in pts], 0.05 * S, 0.008 * S, pm('wt_horn', '#ddcfb2'), pm('wt_tip', '#5a4a38'), faces=700)
    cattle('watusi', solid('#6e2c18', 0.14, 30), nose='#3a2a26', ear='#6a3a2a', horn='#ddcfb2', polled=True, head_extra=horns)


def zebu():
    light, grey = lin('#d6d0c6'), lin('#8e8a84')

    def coat(v):
        # darker grey over the hump, neck and shoulders
        k = max(0, min(1, (v.z - 0.05) / 0.2)) * max(0, min(1, (v.y - 0.32) / 0.12)) if v.part == 'body' else 0
        if v.part == 'head':
            k = 0.35
        return shade(mix(light, grey, k), v.x, v.y, v.z, 0.05)

    def hump(S):
        b = Blob(0.006)
        b.ell((0, 0.47 * S, 0.14 * S), 0.07 * S, 0.075 * S, 0.075 * S)
        b.ell((0, 0.44 * S, 0.1 * S), 0.07 * S, 0.05 * S, 0.08 * S)
        # the loose dewlap under the neck
        b.ell((0, 0.3 * S, 0.27 * S), 0.03 * S, 0.07 * S, 0.05 * S)
        b.build(lambda x, y, z: pm('zb_hump', '#8e8a84', '#9a968e', scale=40) if y > 0.36 * S else pm('zb_dew', '#cfc9bf'), 700)
    cattle('zebu', coat, nose='#3a3634', ear='#c8c0b6', horn='#3a3632', body_extra=hump)


def highland_cow():
    ginger = lin('#b8622c')

    def coat(v):
        n = noise(v.x, v.y * 4, v.z, 60)
        return shade(mix(ginger, lin('#e0a060'), max(0, n) * 0.6), v.x, v.y, v.z, 0.06)

    def extra(S, h):
        hx, hy, hz = h
        hair = pm('hl_hair', '#b8622c', '#d8883e', scale=60, kind='wave', stretch=(1, 1, 6))
        # the shaggy fringe falling over the eyes
        f = Blob(0.004)
        for k in range(14):
            a = (k / 13 - 0.5) * 2.2
            x = math.sin(a) * 0.07
            f.cap(((hx + x) * S, (hy + 0.1) * S, (hz + 0.03) * S), ((hx + x * 1.15) * S, (hy + 0.01 - abs(x) * 0.2) * S, (hz + 0.1) * S), 0.016 * S, 0.008 * S)
        f.build(hair, 900)
        for sx in (-1, 1):
            pts = curve((sx * 0.06, hy + 0.09, hz - 0.01), (sx * 0.24, hy + 0.1, hz + 0.02), (sx * 0.28, hy + 0.24, hz + 0.02), 10)
            horn_path([tuple(c * S for c in p) for p in pts], 0.022 * S, 0.005 * S, pm('hl_horn', '#ecdfc4'), pm('hl_tip', '#4a3a2c'))

    def shag(S):
        hair = pm('hl_coat', '#b0602a', '#cf8038', scale=60, kind='wave', stretch=(1, 1, 6))
        b = Blob(0.006)
        # long hair hanging down the flanks and chest
        for k in range(60):
            a = k * 2.39996
            u = (k + 0.5) / 60
            z = -0.22 + u * 0.46
            for sx in (-1, 1):
                x = sx * (0.11 + 0.02 * math.sin(a))
                y = 0.36 + math.sin(a * 1.7) * 0.05
                b.cap((x * S, y * S, z * S), (x * 1.12 * S, (y - 0.13) * S, (z - 0.01) * S), 0.02 * S, 0.01 * S)
        b.build(hair, 1600)
    cattle('highland_cow', coat, nose='#2e2622', ear='#c07040', switch='#b8622c', polled=True, head_extra=extra, body_extra=shag)


# ---------------------------------------------------------------- horses (real_horse)

def horse_region(v):
    if v.part == 'leg' and v.ly < -0.27:
        return 'hoof'
    if v.part == 'tail' or dark(v.rgb):
        return 'mane'
    if v.part == 'head' and pinkish(v.rgb):
        return 'nose'
    if v.part == 'leg' and v.rgb[0] > 0.5:
        return 'sock'
    return 'coat'


def equine(kind, coat, mane='#1c1816', nose=None, hoof='#2a221c', sock=None, blaze=None, points=None, S=1.0, base='horse', **kw):
    mane_c, hoof_c = lin(mane), lin(hoof)
    nose_c = lin(nose) if nose else None
    sock_c = lin(sock) if sock else None
    blaze_c = lin(blaze) if blaze else None
    points_c = lin(points) if points else None

    def paint(v):
        r = horse_region(v)
        if r == 'hoof':
            return hoof_c
        if v.part == 'leg' and points_c and v.ly < -0.14:
            return points_c                               # dark lower legs (bay, dun)
        if v.part == 'leg' and sock_c and v.ly < -0.16:
            return sock_c
        if r == 'mane':
            if v.part == 'leg':
                return points_c or coat(v)
            return shade(mane_c, v.x, v.y, v.z, 0.12, 60)
        if r == 'nose' and nose_c:
            return nose_c
        if r == 'sock':
            return sock_c or coat(v)
        if blaze_c and v.part == 'head' and abs(v.lx) < 0.014 + v.lz * 0.05 and v.lz > 0.01 and v.ly > -0.06:
            return blaze_c
        return coat(v)
    build(kind, base, paint, S=S, **kw)


def appaloosa():
    white, spot = lin('#efe9df'), lin('#3a2a22')

    def coat(v):
        # a leopard of dark spots, thickest over the hindquarters
        rear = max(0, min(1, (0.05 - v.z) / 0.2)) if v.part == 'body' else 0.4
        n = noise(v.x, v.y, v.z, 70)
        if n > 0.42 - rear * 0.2:
            return spot
        return shade(white, v.x, v.y, v.z, 0.04)
    equine('appaloosa', coat, mane='#4a403a', nose='#5a4a44', hoof='#4a3e36', points='#6a5a50')


def clydesdale():
    equine('clydesdale', solid('#6b3a1e', 0.1, 30), mane='#1c1612', nose='#d8b0a8', sock='#f3efe6', blaze='#f3efe6', S=1.1)


def friesian():
    equine('friesian', solid('#161412', 0.3, 30), mane='#0e0c0b', nose='#2a2624', hoof='#141210', points='#161412')


def palomino():
    equine('palomino', solid('#d8a652', 0.08, 30), mane='#f4ecd8', nose='#c8a080', sock='#f6f0e2', blaze='#f6f0e2')


def pony():
    equine('pony', solid('#8e4c26', 0.1, 30), mane='#ead4a2', nose='#c8a088', sock='#f2ecdf', blaze='#f2ecdf', S=0.74)


def mule():
    brown, pale = lin('#5c3c28'), lin('#cdb49a')

    def coat(v):
        # the mealy pale muzzle and belly the donkey side gives
        if v.part == 'head' and v.lz > 0.12:
            return pale
        if v.part == 'body' and v.y < 0.32:
            return mix(brown, pale, 0.6)
        return shade(brown, v.x, v.y, v.z, 0.1, 30)
    equine('mule', coat, mane='#2a1c14', nose='#3a2a22', points='#3a2a20', S=1.08, base='donkey')


# ---------------------------------------------------------------- sheep (real_sheep)

def sheep_region(v):
    if v.part == 'leg' and v.ly < -0.12:
        return 'hoof'
    if v.part == 'body':
        return 'wool'
    if v.part == 'head' and not dark(v.rgb):
        return 'topknot'                                  # the wool on the poll
    return 'face'


def ovine(kind, wool, face, legs=None, hoof='#241e1a', head_extra=None, body_extra=None, S=1.0):
    face_f = face if callable(face) else solid(face, 0.1, 40)
    legs_f = legs if callable(legs) else solid(legs or face, 0.1, 40) if (legs or not callable(face)) else face_f
    hoof_c = lin(hoof)

    def paint(v):
        r = sheep_region(v)
        if r == 'hoof':
            return hoof_c
        if r in ('wool', 'topknot'):
            return wool(v)
        if v.part == 'leg':
            return legs_f(v)
        return face_f(v)
    build(kind, 'sheep', paint, head_extra=head_extra, body_extra=body_extra, S=S)


def fleece(h, amt=0.1):
    c = lin(h)
    return lambda v: shade(c, v.x, v.y, v.z, amt, 90)


def dorper():
    white, black = lin('#f2ede2'), lin('#1c1a18')

    def wool(v):
        # a black head and neck on a white body
        return shade(black, v.x, v.y, v.z, 0.2) if v.part == 'body' and v.z > 0.15 + noise(v.x, v.y, 0, 20) * 0.02 else shade(white, v.x, v.y, v.z, 0.05, 90)
    ovine('dorper', wool, '#1c1a18', legs='#ece6da')


def black_sheep():
    ovine('black_sheep', fleece('#2c2826', 0.3), '#1a1816')


def karakul():
    grey = lin('#3c3836')

    def wool(v):
        # tight curls, their tips a little greyer
        n = noise(v.x, v.y, v.z, 160)
        return mix(grey, lin('#77716c'), max(0, n) * 0.8)
    ovine('karakul', wool, '#2a2624')


def merino_sheep():
    white = lin('#f0e9da')

    def face(v):
        if v.lz > 0.08:
            return lin('#e8b8ae')                         # the pink nose
        return shade(white, v.x, v.y, v.z, 0.04)
    ovine('merino_sheep', fleece('#f0e9da', 0.06), face, legs='#eee6d8')


def suffolk_sheep():
    ovine('suffolk_sheep', fleece('#f2ecdf', 0.06), '#1c1917')


def valais_blacknose():
    white, black = lin('#f3eee4'), lin('#1a1816')

    def face(v):
        # a black mask over the nose and round the eyes, the rest white
        if v.lz > 0.05 or (v.ly > -0.01 and abs(v.lx) > 0.02 and v.lz > 0.0):
            return black
        return shade(white, v.x, v.y, v.z, 0.05)

    def legs(v):
        return black if (-0.1 < v.ly < -0.06 or v.ly < -0.12) else white

    def horns(S, h):
        hx, hy, hz = h
        for sx in (-1, 1):
            pts = []
            for k in range(15):
                a = k / 14 * math.pi * 1.5
                r = 0.045 * (1 - k / 22)
                pts.append(((hx + sx * (0.04 + k * 0.003)) * S, (hy + 0.06 + math.sin(a) * r) * S, (hz - 0.03 + math.cos(a) * r - 0.02) * S))
            horn_path(pts, 0.013 * S, 0.004 * S, pm('vb_horn', '#d8ccb4'), pm('vb_tip', '#8a7a64'))
    ovine('valais_blacknose', lambda v: mix(white, lin('#e4dccd'), max(0, noise(v.x, v.y * 3, v.z, 80)) * 0.6), face, legs=legs, head_extra=horns)


def shetland_sheep():
    ovine('shetland_sheep', fleece('#6e4b32', 0.14), '#5a3e2a')


def jacob_sheep():
    white, spot = lin('#f2ede3'), lin('#2e2420')

    def wool(v):
        return spot if noise(v.x + 4, v.y, v.z, 8) > 0.25 else shade(white, v.x, v.y, v.z, 0.05, 90)

    def face(v):
        return shade(white, v.x, v.y, v.z, 0.04) if abs(v.lx) < 0.012 and v.lz > 0.0 else spot

    def horns(S, h):
        hx, hy, hz = h
        for sx in (-1, 1):
            # four horns: a pair sweeping up and back, a pair curling down the sides
            up = curve((sx * 0.018, hy + 0.08, hz - 0.01), (sx * 0.04, hy + 0.16, hz - 0.04), (sx * 0.07, hy + 0.17, hz - 0.1), 8)
            horn_path([tuple(c * S for c in p) for p in up], 0.012 * S, 0.004 * S, pm('jb_horn', '#4a3e34'), pm('jb_tip', '#2a221c'))
            pts = []
            for k in range(12):
                a = k / 11 * math.pi * 1.2
                pts.append(((hx + sx * (0.05 + k * 0.004)) * S, (hy + 0.05 + math.sin(a) * 0.035) * S, (hz - 0.02 + math.cos(a) * 0.035 - 0.02) * S))
            horn_path(pts, 0.012 * S, 0.004 * S, pm('jb_horn', '#4a3e34'), pm('jb_tip', '#2a221c'))
    ovine('jacob_sheep', wool, face, legs=lambda v: white if noise(v.x, v.y, v.z, 30) > 0 else spot, head_extra=horns)


# ---------------------------------------------------------------- goats (modelled here)

# The goat is sculpted here rather than taken from the game's sculpt: a lean, deep bodied animal
# on slim legs, a long face held a little down, a beard, ears held out sideways (or hanging), and
# horns sweeping back. `coat(part, x, y, z)` gives each breed its colours.
GOAT_HIPS = [(-0.042, 0.1), (0.042, 0.1), (-0.042, -0.105), (0.042, -0.105)]
GOAT_LEG = 0.2


def gm(h):
    """A coat material for a colour, with a little natural variation in the hair."""
    c = [int(h[i:i + 2], 16) for i in (1, 3, 5)]
    light = '#' + ''.join(f'{min(255, int(v * 1.08 + 4)):02x}' for v in c)
    return pm('gt_' + h[1:], h, light, scale=55)   # pm keeps one per name for the model being built


def goat_model(kind, coat, nose='#3a302a', ears='out', horns='back', horn_col='#8d8479', beard=True, locks=None, S=1.0,
               roman=False):
    def P(*p):
        return tuple(c * S for c in p)

    def paint(part):
        return lambda x, y, z: gm(coat(part, x / S, y / S, z / S))
    b = Blob(0.005 * S)
    b.ell(P(0, 0.29, -0.005), 0.07 * S, 0.07 * S, 0.14 * S)
    b.ball(P(0, 0.295, 0.095), 0.064 * S)
    b.ball(P(0, 0.3, -0.1), 0.062 * S)
    b.ell(P(0, 0.258, 0.0), 0.058 * S, 0.05 * S, 0.1 * S)
    b.ball(P(0, 0.335, -0.125), 0.03 * S)               # the hip bones under the tail
    b.cap(P(0, 0.32, 0.11), P(0, 0.4, 0.178), 0.046 * S, 0.033 * S)
    b.build(paint('body'), 1800)
    if locks:
        locks(S)
    with anim_group('tail', B(*P(0, 0.34, -0.16))):
        t = Blob(0.003 * S)
        t.cap(P(0, 0.34, -0.16), P(0, 0.385, -0.19), 0.012 * S, 0.005 * S)
        t.build(paint('tail'), 120)
    with anim_group('head', B(*P(0, 0.4, 0.18))):
        h = Blob(0.0035 * S)
        h.ball(P(0, 0.432, 0.198), 0.036 * S)
        h.cap(P(0, 0.428, 0.212), P(0, 0.386, 0.272), 0.029 * S, 0.02 * S)
        if roman:
            h.ell(P(0, 0.42, 0.245), 0.018 * S, 0.018 * S, 0.02 * S)   # the Nubian's arched nose
        h.ell(P(0, 0.377, 0.279), 0.0185 * S, 0.019 * S, 0.018 * S)
        h.ell(P(0, 0.372, 0.266), 0.015 * S, 0.012 * S, 0.016 * S)   # the lower jaw

        def head(x, y, z):
            if z / S > 0.285 or (z / S > 0.272 and y / S < 0.378):
                return pm('gt_nose' + nose[1:], nose)
            return gm(coat('head', x / S, y / S, z / S))
        h.build(head, 1100)
        if beard:
            bd = Blob(0.0025 * S)
            bd.cap(P(0, 0.365, 0.262), P(0, 0.318, 0.254), 0.009 * S, 0.003 * S)
            bd.build(paint('beard'), 120)
        for sx in (-1, 1):
            e = Blob(0.002 * S)
            if ears == 'out':
                # held out sideways and a little down, leaf shaped
                for k in range(6):
                    u = k / 5
                    e.ell(P(sx * (0.03 + u * 0.045), 0.438 - u * 0.012, 0.19 - u * 0.004), 0.004 * S, (0.008 - u * 0.004) * S, (0.011 + math.sin(u * math.pi) * 0.004) * S)
            else:
                # long and hanging beside the face (Nubian, Boer)
                n = 7 if ears == 'long' else 6
                ln = 0.085 if ears == 'long' else 0.06
                for k in range(n):
                    u = k / (n - 1)
                    e.ell(P(sx * (0.035 + u * 0.01), 0.438 - u * ln, 0.2 + u * 0.012), 0.005 * S, 0.012 * S, (0.018 - u * 0.005) * S)
            e.build(paint('ear'), 220)
            if horns == 'back':
                pts = curve(P(sx * 0.013, 0.46, 0.192), P(sx * 0.028, 0.52, 0.16), P(sx * 0.045, 0.5, 0.098), 10)
                horn_path(pts, 0.011 * S, 0.003 * S, pm(uid('gh'), horn_col), pm(uid('ght'), '#3a322c'), res=0.002 * S, faces=260)
            elif horns == 'small':
                pts = curve(P(sx * 0.013, 0.46, 0.192), P(sx * 0.02, 0.49, 0.175), P(sx * 0.028, 0.49, 0.15), 6)
                horn_path(pts, 0.009 * S, 0.003 * S, pm(uid('gh'), horn_col), pm(uid('ght'), '#3a322c'), res=0.002 * S, faces=160)
            elif horns == 'spiral':
                # the angora's horns twisting out sideways
                pts = []
                for k in range(16):
                    u = k / 15
                    a = u * math.pi * 2.2
                    pts.append(P(sx * (0.016 + u * 0.075), 0.462 + math.sin(a) * 0.016 + u * 0.012, 0.188 - u * 0.03 + math.cos(a) * 0.016))
                horn_path(pts, 0.011 * S, 0.003 * S, pm(uid('gh'), horn_col), pm(uid('ght'), '#6a5e50'), res=0.002 * S, faces=320)
    mk = marker('eye', B(*P(0.03, 0.44, 0.222)))
    r = 0.0085 * S
    mk.scale = (r, r, r)
    mk.rotation_euler[2] = 0.95

    def make(x, y0, z):
        front = z > 0
        lg = Blob(0.0025 * S)
        lg.cap(P(x, y0 + 0.03, z), P(x, 0.11, z + (0.006 if front else -0.012)), 0.02 * S, 0.012 * S)
        lg.cap(P(x, 0.11, z + (0.006 if front else -0.012)), P(x, 0.022, z + 0.002), 0.0115 * S, 0.0095 * S)
        lg.build(paint('leg'), 260)
        hf = Blob(0.002 * S)
        hf.ell(P(x, 0.012, z + 0.005), 0.011 * S, 0.012 * S, 0.013 * S)
        hf.build(pm('gt_hoof', '#2a2420'), 60)
    for i, (x, z) in enumerate(GOAT_HIPS):
        with anim_group(f'leg{i}', B(*P(x, GOAT_LEG, z))):
            make(x, GOAT_LEG, z)
    finish(f'animal_{kind}', tex=512, vivid=1.08, ao_min=0.62, ao_dist=0.1)


def mohair(col, n=170, length=0.055, r0=0.013):
    """Locks of hair hanging all over the back and sides (angora mohair, cashmere fluff)."""
    def locks(S):
        hair = pm(uid('lock'), col, '#ffffff', scale=80)
        b = Blob(0.003 * S)
        ga = math.pi * (3 - math.sqrt(5))
        for i in range(n):
            y = 1 - 2 * (i + 0.5) / n
            if y < -0.35:
                continue
            rad = math.sqrt(1 - y * y)
            a = ga * i
            dx, dz = math.cos(a) * rad, math.sin(a) * rad
            p = (dx * 0.072, 0.29 + y * 0.072, -0.005 + dz * 0.15)
            w = math.sin(i * 1.7) * 0.006
            mid = (p[0] + dx * 0.012 + w, p[1] - length * 0.45, p[2] + dz * 0.008)
            end = (p[0] + dx * 0.02 - w, p[1] - length, p[2] + dz * 0.012)
            b.cap(tuple(c * S for c in p), tuple(c * S for c in mid), r0 * S, r0 * 0.75 * S)
            b.cap(tuple(c * S for c in mid), tuple(c * S for c in end), r0 * 0.75 * S, r0 * 0.4 * S)
        # a mane of locks down the neck
        for k in range(10):
            u = k / 9
            p = (0, 0.33 + u * 0.07, 0.12 + u * 0.06)
            for sx in (-1, 1):
                b.cap(tuple(c * S for c in p), ((sx * 0.03) * S, (p[1] - length * 0.8) * S, (p[2] + 0.005) * S), r0 * 0.9 * S, r0 * 0.4 * S)
        b.build(hair, 2400)
    return locks


def goat():
    goat_model('goat', lambda part, x, y, z: '#ece6da', nose='#d8a8a0')


def alpine_goat():
    def coat(part, x, y, z):
        # cou clair: a pale fore end, black hindquarters and legs, black stripes down the face
        if part in ('leg', 'tail', 'beard'):
            return '#221c18'
        if part == 'head':
            return '#e4d2b4' if abs(abs(x) - 0.014) < 0.006 and z > 0.215 else '#221c18'
        if part == 'ear':
            return '#221c18'
        return '#221c18' if z < 0.0 + noise(x, y, 0, 20) * 0.03 else '#e4d2b4'
    goat_model('alpine_goat', coat, nose='#2a221e')


def boer_goat():
    def coat(part, x, y, z):
        if part in ('head', 'ear'):
            return '#f3eee5' if part == 'head' and abs(x) < 0.008 and z > 0.215 else '#8e3c22'
        if part == 'body' and z > 0.13 + noise(x, y, 0, 20) * 0.02:
            return '#8e3c22'
        return '#f3eee5'
    goat_model('boer_goat', coat, nose='#b88878', ears='hang', horn_col='#5a4a3e', beard=False)


def angora_goat():
    goat_model('angora_goat', lambda part, x, y, z: '#f3ede1', nose='#e0b8b0', horns='spiral', horn_col='#c8bca8',
               locks=mohair('#f3ede1'))


def cashmere_goat():
    goat_model('cashmere_goat', lambda part, x, y, z: '#ece2d0', nose='#d8b0a4', horn_col='#9a8e80',
               locks=mohair('#ece2d0', n=140, length=0.035, r0=0.012))


def saanen_goat():
    goat_model('saanen_goat', lambda part, x, y, z: '#f6f2ea', nose='#eab8b0', horns=None)


def nubian_goat():
    def coat(part, x, y, z):
        if part in ('ear', 'head', 'leg', 'beard'):
            return '#8c4c2c'
        return '#d9b48e' if noise(x + 7, y, z, 8) > 0.3 else '#8c4c2c'
    goat_model('nubian_goat', coat, nose='#3a2a24', ears='long', horns=None, beard=False, roman=True)


def pygmy_goat():
    def coat(part, x, y, z):
        if part == 'leg' and y < 0.14:
            return '#2a2522'
        if part == 'body' and abs(x) < 0.012 and y > 0.35:
            return '#2a2522'                              # the dark stripe along the back
        if part == 'head' and z > 0.24:
            return '#2e2926'
        return '#6d6660' if noise(x, y, z, 140) < 0.15 else '#8c847c'
    goat_model('pygmy_goat', coat, nose='#2a2420', horns='small', horn_col='#6a5e54', S=0.78)


# ---------------------------------------------------------------- camelids (real_alpaca)

def alpaca_like(kind, coat, S=1.0, head_extra=None):
    toe = lin('#2a2420')

    def paint(v):
        if v.part == 'leg' and v.ly < -0.23:
            return toe
        if v.part == 'head' and dark(v.rgb) and v.lz > 0.07:
            return lin('#2a2420')                          # the dark nose and lips
        return coat(v)
    build(kind, 'alpaca', paint, S=S, head_extra=head_extra)


def llama():
    white, brown = lin('#f1ebe0'), lin('#7a4a2c')

    def coat(v):
        return shade(brown, v.x, v.y, v.z, 0.1) if noise(v.x + 1, v.y, v.z, 7) > 0.22 else shade(white, v.x, v.y, v.z, 0.05, 80)

    def ears(S, h):
        hx, hy, hz = h
        for sx in (-1, 1):
            # a llama's tall, curved banana ears
            pts = curve((sx * 0.025, hy + 0.09, hz - 0.02), (sx * 0.042, hy + 0.13, hz - 0.03), (sx * 0.032, hy + 0.165, hz - 0.005), 6)
            e = Blob(0.0018)
            for k, p in enumerate(pts):
                w = math.sin(math.pi * (k + 0.5) / len(pts))
                e.ell(tuple(c * S for c in p), 0.004 * S, 0.01 * S, (0.004 + 0.008 * w) * S)
            e.build(pm('ll_ear', '#efe8dc', '#e4dccd', scale=40), 200)
    alpaca_like('llama', coat, S=1.3, head_extra=ears)


def vicuna():
    cinnamon, white = lin('#c69662'), lin('#f5eee2')

    def coat(v):
        if v.part == 'body' and (v.y < 0.33 or (v.z > 0.12 and v.y < 0.5 and v.z > 0.15)):
            return shade(white, v.x, v.y, v.z, 0.04)       # white belly and the long bib on the chest
        if v.part == 'leg' and abs(v.lx) < 0.02 and v.lz > 0.0:
            return white
        return shade(cinnamon, v.x, v.y, v.z, 0.06)
    alpaca_like('vicuna', coat, S=0.95)


# ---------------------------------------------------------------- deer (real_horse, lighter built)

def antler(sx, S, root, beam, tines, r0=0.009, col='#d8c8a8', tip='#f4ecdc'):
    """One antler: a main beam along `beam` points from `root` (relative to the head pivot, game
    coords), with tines branching off: each (index along the beam, direction, length)."""
    b = Blob(0.002 * S)
    pts = [root] + beam
    n = len(pts) - 1
    for k in range(n):
        b.cap(tuple(c * S for c in pts[k]), tuple(c * S for c in pts[k + 1]), r0 * S * (1 - k / (n + 1) * 0.5), r0 * S * (1 - (k + 1) / (n + 1) * 0.5))
    for i, d, ln in tines:
        a = pts[i]
        e = (a[0] + d[0] * ln, a[1] + d[1] * ln, a[2] + d[2] * ln)
        b.cap(tuple(c * S for c in a), tuple(c * S for c in e), r0 * 0.6 * S, r0 * 0.25 * S)
    b.build(lambda x, y, z: pm('ant_' + col[1:], col, tip, scale=60), 700)


def moose():
    brown, legs = lin('#3b2a1f'), lin('#8e7f70')

    def coat(v):
        if v.part == 'leg' and v.ly < -0.1:
            return legs                                   # the pale grey-brown stockings
        return shade(brown, v.x, v.y, v.z, 0.14, 30)

    def extra(S, h):
        hx, hy, hz = h
        pal = pm('ms_palm', '#b8a488', '#d0bea0', scale=40)
        for sx in (-1, 1):
            # the broad palmate antler: a flat palm spreading out sideways with points round its edge
            b = Blob(0.0022 * S)
            b.cap(((hx + sx * 0.02) * S, (hy + 0.07) * S, (hz - 0.01) * S), ((hx + sx * 0.07) * S, (hy + 0.09) * S, (hz - 0.01) * S), 0.01 * S, 0.009 * S)
            for k in range(7):
                u = k / 6
                b.ell(((hx + sx * (0.08 + u * 0.08)) * S, (hy + 0.1 + math.sin(u * math.pi) * 0.03) * S, (hz - 0.02 + (u - 0.5) * 0.05) * S), 0.03 * S, 0.006 * S, 0.034 * S)
            for k in range(8):
                u = k / 7
                x0 = hx + sx * (0.09 + u * 0.08)
                z0 = hz - 0.04 + u * 0.06
                b.cap((x0 * S, (hy + 0.11) * S, z0 * S), ((x0 + sx * 0.015) * S, (hy + 0.15 + math.sin(u * 3) * 0.01) * S, (z0 - 0.01) * S), 0.005 * S, 0.002 * S)
            b.build(pal, 900)
        # the bell hanging under the throat
        bl = Blob(0.002 * S)
        bl.cap((hx * S, (hy - 0.06) * S, (hz + 0.02) * S), (hx * S, (hy - 0.13) * S, (hz + 0.01) * S), 0.012 * S, 0.006 * S)
        bl.build(pm('ms_bell', '#3b2a1f'), 120)
    equine('moose', coat, mane='#2a1d15', nose='#4a3a30', hoof='#2a221c', S=1.3, head_extra=extra, tail=False)


def elk():
    tan_c, dark_c, rump = lin('#b48a58'), lin('#4e3524'), lin('#ecdcbc')

    def coat(v):
        if v.part == 'head' or v.part == 'leg':
            return shade(dark_c, v.x, v.y, v.z, 0.1)
        if v.part == 'body':
            if v.z > 0.16:
                return shade(dark_c, v.x, v.y, v.z, 0.1)  # the dark shaggy neck
            if v.z < -0.2 and v.y > 0.4:
                return rump                              # the pale rump patch
        return shade(tan_c, v.x, v.y, v.z, 0.08, 30)

    def extra(S, h):
        hx, hy, hz = h
        for sx in (-1, 1):
            beam = [(hx + sx * 0.05, hy + 0.14, hz - 0.05), (hx + sx * 0.08, hy + 0.22, hz - 0.1), (hx + sx * 0.09, hy + 0.3, hz - 0.12), (hx + sx * 0.08, hy + 0.37, hz - 0.1)]
            tines = [(1, (0, 0.3, 1), 0.07), (2, (0, 0.4, 1), 0.08), (3, (0.2, 0.6, 1), 0.06), (4, (0.1, 1, 0.3), 0.04)]
            antler(sx, S, (hx + sx * 0.018, hy + 0.07, hz - 0.01), beam, tines, r0=0.01)
    equine('elk', coat, mane='#3a281c', nose='#2a201a', S=1.15, head_extra=extra, tail=False)


def reindeer():
    grey, pale = lin('#7a6c5e'), lin('#e6ddd0')

    def coat(v):
        if v.part == 'body' and (v.z > 0.18 or v.y < 0.37):
            return shade(pale, v.x, v.y, v.z, 0.05)     # the pale neck, mane and belly
        if v.part == 'head' and v.lz > 0.12:
            return lin('#a89c90')
        if v.part == 'leg' and v.ly < -0.24:
            return pale
        return shade(grey, v.x, v.y, v.z, 0.1, 30)

    def extra(S, h):
        hx, hy, hz = h
        for sx in (-1, 1):
            beam = [(hx + sx * 0.06, hy + 0.12, hz - 0.08), (hx + sx * 0.08, hy + 0.2, hz - 0.08), (hx + sx * 0.06, hy + 0.28, hz - 0.02), (hx + sx * 0.03, hy + 0.3, hz + 0.04)]
            tines = [(1, (0, 0.2, 1), 0.06), (2, (0.3, 0.5, -0.3), 0.05), (3, (0.2, 0.7, -0.2), 0.05)]
            antler(sx, S, (hx + sx * 0.018, hy + 0.07, hz - 0.01), beam, tines, r0=0.009, col='#d8ccb4')
    equine('reindeer', coat, mane='#e6ddd0', nose='#3a302a', S=0.82, head_extra=extra, tail=False)


def spotted_deer():
    rufous, white = lin('#b0602a'), lin('#f4ecdc')

    def coat(v):
        if v.part == 'body' and v.y < 0.37:
            return shade(white, v.x, v.y, v.z, 0.04)
        if v.part == 'body' and noise(v.x, v.y, v.z, 60) > 0.45:
            return white                                  # the chital's white spots
        if v.part == 'head' and v.lz > 0.13:
            return lin('#2a201a')
        return shade(rufous, v.x, v.y, v.z, 0.08, 30)

    def extra(S, h):
        hx, hy, hz = h
        for sx in (-1, 1):
            beam = [(hx + sx * 0.04, hy + 0.14, hz - 0.04), (hx + sx * 0.06, hy + 0.22, hz - 0.06), (hx + sx * 0.05, hy + 0.3, hz - 0.03)]
            tines = [(1, (0, 0.3, 1), 0.05), (3, (0.3, 0.3, 1), 0.035)]
            antler(sx, S, (hx + sx * 0.018, hy + 0.07, hz - 0.01), beam, tines, r0=0.008, col='#c8b490')
    equine('spotted_deer', coat, mane='#8a4a22', nose='#2a201a', S=0.72, head_extra=extra, tail=False)


# ---------------------------------------------------------------- bactrian camel (real_camel)

def bactrian_camel():
    fawn, dark_c = lin('#9c7a4e'), lin('#6a4a2c')

    def warp(v):
        # the dromedary's single hump is brought down to the back; two humps are added
        if v.part == 'body' and v.ly > 0.64 and abs(v.lz) < 0.13:
            return (v.lx, 0.64 + (v.ly - 0.64) * 0.2, v.lz)
        return None

    def paint(v):
        if v.part == 'leg' and v.ly < -0.43:
            return lin('#3a2a20')
        if v.part == 'head' and v.lz > 0.1:
            return lin('#4a3a2c')
        if v.part == 'body' and v.z > 0.24 and v.y < 0.66:
            return shade(dark_c, v.x, v.y, v.z, 0.1)     # the shaggy throat
        return shade(fawn, v.x, v.y, v.z, 0.08, 30)

    def humps(S):
        fur = pm('bc_fur', '#9c7a4e', '#a8865a', scale=50)
        hair = pm('bc_hump', '#6a4a2c', '#86623e', scale=60, kind='wave', stretch=(1, 1, 5))
        b = Blob(0.005 * S)
        for z in (0.075, -0.085):
            # a soft, rounded mound on the back
            b.ell((0, 0.655 * S, z * S), 0.07 * S, 0.075 * S, 0.068 * S)
            b.ell((0, 0.61 * S, z * S), 0.085 * S, 0.04 * S, 0.085 * S)
        b.build(lambda x, y, z: hair if y > 0.705 * S else fur, 1200)
        t = Blob(0.003 * S)
        for z in (0.075, -0.085):
            # the long winter hair on the hump tops, flopping over to the sides
            for k in range(10):
                a = k / 10 * math.pi * 2
                c = (math.cos(a) * 0.025 * S, 0.715 * S, (z + math.sin(a) * 0.022) * S)
                t.cap(c, (math.cos(a) * 0.05 * S, 0.7 * S, (z + math.sin(a) * 0.04) * S), 0.011 * S, 0.004 * S)
        t.build(hair, 700)
    build('bactrian_camel', 'camel', paint, warp=warp, body_extra=humps)


# ---------------------------------------------------------------- geese (modelled here) and the swan

def goose_model(kind, paint, bill='#f08a2a', legs='#f08a2a', S=1.0, dewlap=False, upright=False, knob=None):
    """A goose standing on its webbed feet: a long body carried level (or, for the Indian
    Runner, bolt upright like a bottle), folded wings, a long neck and a stout bill. `paint(part,
    x, y, z)` gives the plumage colour."""
    def P(*p):
        return tuple(c * S for c in p)
    mats = {}

    def M(h):
        if h not in mats:
            c = [int(h[i:i + 2], 16) for i in (1, 3, 5)]
            mats[h] = pm('gs_' + h[1:], h, '#' + ''.join(f'{min(255, int(v * 1.06 + 3)):02x}' for v in c), scale=70)
        return mats[h]

    def by(part):
        return lambda x, y, z: M(paint(part, x / S, y / S, z / S))
    b = Blob(0.004 * S)
    if upright:
        b.cap(P(0, 0.13, -0.04), P(0, 0.27, 0.02), 0.05 * S, 0.036 * S)
        b.ell(P(0, 0.13, -0.035), 0.05 * S, 0.05 * S, 0.055 * S)
        b.cap(P(0, 0.27, 0.02), P(0, 0.33, 0.035), 0.022 * S, 0.018 * S)
        neck_top = (0, 0.36, 0.04)
    else:
        b.ell(P(0, 0.17, -0.02), 0.075 * S, 0.066 * S, 0.13 * S)
        b.ball(P(0, 0.17, 0.065), 0.064 * S)
        b.ell(P(0, 0.195, -0.135), 0.05 * S, 0.035 * S, 0.055 * S)      # the tail end, tipped up
        b.ell(P(0, 0.135, -0.03), 0.064 * S, 0.048 * S, 0.1 * S)
        if dewlap:
            b.ell(P(0, 0.1, -0.02), 0.05 * S, 0.045 * S, 0.1 * S)      # the Toulouse's low keel
        b.cap(P(0, 0.2, 0.08), P(0, 0.3, 0.1), 0.03 * S, 0.02 * S)
        b.cap(P(0, 0.3, 0.1), P(0, 0.365, 0.115), 0.02 * S, 0.018 * S)
        neck_top = (0, 0.375, 0.115)
    b.build(by('body'), 1600)
    for sx in (-1, 1):
        w = Blob(0.003 * S)
        if upright:
            w.ell(P(sx * 0.042, 0.19, -0.01), 0.014 * S, 0.06 * S, 0.035 * S)
        else:
            w.ell(P(sx * 0.062, 0.19, -0.045), 0.018 * S, 0.042 * S, 0.1 * S)
            w.ell(P(sx * 0.05, 0.2, -0.13), 0.014 * S, 0.02 * S, 0.05 * S)
        w.build(by('wing'), 400)
    hx, hy, hz = neck_top
    with anim_group('head', B(*P(hx, hy - 0.02, hz))):
        h = Blob(0.0028 * S)
        h.ball(P(0, hy, hz + 0.008), 0.026 * S)
        h.cap(P(0, hy - 0.02, hz - 0.004), P(0, hy - 0.002, hz + 0.006), 0.021 * S, 0.022 * S)
        h.build(by('head'), 500)
        bk = Blob(0.002 * S)
        bk.cap(P(0, hy - 0.004, hz + 0.028), P(0, hy - 0.012, hz + 0.07), 0.012 * S, 0.006 * S)
        bk.build(pm('gs_bill' + bill[1:], bill), 160)
        if knob:
            kb = Blob(0.002 * S)
            kb.ball(P(0, hy + 0.006, hz + 0.03), 0.01 * S)
            kb.build(pm('gs_knob', knob), 60)
    mk = marker('eye', B(*P(0.02, hy + 0.006, hz + 0.02)))
    r = 0.0055 * S
    mk.scale = (r, r, r)
    mk.rotation_euler[2] = 1.1
    hip_y = 0.1 if not upright else 0.1
    for i, sx in enumerate((-1, 1)):
        x = sx * 0.03
        with anim_group(f'leg{i}', B(*P(x, hip_y, 0.0 if not upright else -0.03))):
            z0 = 0.0 if not upright else -0.03
            lg = Blob(0.002 * S)
            lg.cap(P(x, hip_y + 0.01, z0), P(x, 0.015, z0 + 0.005), 0.009 * S, 0.007 * S)
            # the webbed foot, three toes spread under a web
            lg.ell(P(x, 0.005, z0 + 0.028), 0.019 * S, 0.004 * S, 0.024 * S)
            lg.build(pm('gs_leg' + legs[1:], legs), 160)
    finish(f'animal_{kind}', tex=512, vivid=1.06, ao_min=0.65, ao_dist=0.06)


def goose():
    goose_model('goose', lambda part, x, y, z: '#f6f3ec' if part != 'wing' else '#e8e4dc')


def emden_goose():
    goose_model('emden_goose', lambda part, x, y, z: '#fbf9f4' if part != 'wing' else '#eeebe4', S=1.15)


def toulouse_goose():
    def paint(part, x, y, z):
        if part == 'wing':
            return '#5e5a56' if math.sin(y * 300) > 0.3 else '#7a7672'   # the pale edged wing feathers
        if part == 'body' and (y < 0.15 or z < -0.12):
            return '#eeeae4'                              # the white belly and under the tail
        return '#8a8580'
    goose_model('toulouse_goose', paint, dewlap=True, S=1.1)


def golden_goose():
    def paint(part, x, y, z):
        return '#e8b83a' if part != 'wing' else '#d8a42a'
    goose_model('golden_goose', paint, bill='#f0a030', legs='#f0a030')


def indian_runner():
    def paint(part, x, y, z):
        # the fawn and white runner: white neck, breast and belly, fawn back and cap
        if part == 'head':
            return '#9a7650' if y > 0.36 else '#f5f1ea'
        if part == 'wing':
            return '#9a7650'
        return '#f5f1ea' if (z > 0.0 or y < 0.2) else '#9a7650'
    goose_model('indian_runner', paint, bill='#8a9a4a', legs='#e8963a', upright=True, S=0.95)


def swan():
    # the mute swan: all white, an orange bill with the black knob and base
    white = lin('#f7f5f0')

    def paint(v):
        if v.part == 'head' and v.rgb[0] > 0.3 and v.rgb[1] < 0.2:
            return lin('#e87a28')
        if v.part == 'head' and v.rgb[0] > 0.6 and v.rgb[1] > 0.6:
            return lin('#1a1614')                          # what was the pale tip: the black nail
        return shade(white, v.x, v.y, v.z, 0.03)
    build('swan', 'toon:black_swan', paint)



# ---------------------------------------------------------------- shared: a palette material per colour


def cm(h, var=1.07, scale=60):
    """A material for a colour with a little natural variation (feathers, fur)."""
    c = [int(h[i:i + 2], 16) for i in (1, 3, 5)]
    light = '#' + ''.join(f'{min(255, int(v * var + 3)):02x}' for v in c)
    return pm('cm_' + h[1:], h, light, scale=scale)


def eye_mark(p, r, yaw=1.0):
    mk = marker('eye', B(*p))
    mk.scale = (r, r, r)
    mk.rotation_euler[2] = yaw


# ---------------------------------------------------------------- chickens and their kin (modelled here)

def hen_model(kind, paint, comb='single', comb_col='#d42a20', crest=None, fluffy=1.0, feathered=False, tail='hen',
              legs='#e8b030', beak='#e0a828', helmet=None, face=None, S=1.0):
    """A hen standing on its two feet: a plump body, folded wings, a tail of feathers held up
    behind (or a pheasant's long barred tail), hackles down the neck, and a small head with its
    comb, wattles and beak. `paint(part, x, y, z)` gives the plumage colour; parts are body,
    wing, tail, neck, head, crest and foot (feathered feet)."""
    def P(*p):
        return tuple(c * S for c in p)

    def by(part):
        return lambda x, y, z: cm(paint(part, x / S, y / S, z / S))
    F = fluffy
    b = Blob(0.003 * S)
    b.ell(P(0, 0.14, -0.005), 0.06 * F * S, 0.056 * F * S, 0.078 * F * S)
    b.ball(P(0, 0.142, 0.042), 0.053 * F * S)                     # the full breast
    b.ell(P(0, 0.17, -0.068), 0.044 * F * S, 0.048 * S, 0.04 * S)  # the saddle rising to the tail
    b.ell(P(0, 0.108, -0.02), 0.05 * F * S, 0.04 * F * S, 0.07 * F * S)
    b.build(by('body'), 1600)
    if F > 1.05:
        # fluffy breeds: a soft cushion of loose feathers over the back and thighs
        fl = Blob(0.003 * S)
        ga = math.pi * (3 - math.sqrt(5))
        for i in range(60):
            y = 1 - 2 * (i + 0.5) / 60
            if y < -0.5:
                continue
            rad = math.sqrt(1 - y * y)
            a = ga * i
            fl.ball(P(math.cos(a) * rad * 0.062 * F, 0.14 + y * 0.056 * F, -0.005 + math.sin(a) * rad * 0.078 * F), 0.02 * S)
        fl.build(by('body'), 1400)
    for sx in (-1, 1):
        w = Blob(0.0025 * S)
        w.ell(P(sx * 0.055 * F, 0.145, -0.02), 0.014 * S, 0.036 * S, 0.062 * S)
        w.ell(P(sx * 0.05 * F, 0.15, -0.075), 0.01 * S, 0.02 * S, 0.03 * S)
        w.build(by('wing'), 400)
    # the tail: a fan of feathers up and back
    t = Blob(0.0025 * S)
    if tail == 'long':
        for k in (-1, 0, 1):
            t.cap(P(k * 0.006, 0.17, -0.08), P(k * 0.02, 0.2, -0.2), 0.013 * S, 0.008 * S)
            t.cap(P(k * 0.02, 0.2, -0.2), P(k * 0.03, 0.19, -0.33), 0.008 * S, 0.003 * S)
    elif tail == 'short':
        t.ell(P(0, 0.16, -0.09), 0.03 * S, 0.02 * S, 0.03 * S)
    else:
        up = 0.27 if tail == 'tall' else 0.24
        for k in range(-3, 4):
            x = k * 0.009
            mid = P(x * 1.3, 0.2 + abs(k) * -0.004, -0.1)
            t.cap(P(x, 0.16, -0.075), mid, 0.014 * S, 0.011 * S)
            t.cap(mid, P(x * 1.8, up - abs(k) * 0.012, -0.12 - (0.02 if tail == 'tall' else 0) + abs(k) * 0.004), 0.011 * S, 0.004 * S)
    t.build(by('tail'), 700)
    # the neck with its hackles
    n = Blob(0.0025 * S)
    n.cap(P(0, 0.16, 0.045), P(0, 0.215, 0.06), 0.036 * F * S, 0.026 * S)
    n.build(by('neck'), 500)
    hx, hy, hz = 0, 0.215, 0.062
    with anim_group('head', B(*P(hx, hy, hz))):
        h = Blob(0.002 * S)
        h.ball(P(0, 0.232, 0.072), 0.025 * S)
        h.build(lambda x, y, z: cm(face) if (face and z / S > 0.078 and y / S < 0.238) else cm(paint('head', x / S, y / S, z / S)), 500)
        bk = Blob(0.0012 * S)
        bk.cap(P(0, 0.232, 0.092), P(0, 0.223, 0.11), 0.0075 * S, 0.0018 * S)
        bk.build(pm('hn_beak' + beak[1:], beak), 100)
        red = pm('hn_comb' + comb_col[1:], comb_col)
        cb = Blob(0.0012 * S)
        if comb in ('single', 'big'):
            k = 1.35 if comb == 'big' else 1.0
            for i in range(5):
                u = i / 4
                cb.ball(P(0, 0.256 + math.sin(u * math.pi) * 0.012 * k, 0.09 - u * 0.04), (0.007 + math.sin(u * math.pi) * 0.004) * k * S)
        elif comb in ('pea', 'walnut', 'small'):
            cb.ell(P(0, 0.255, 0.08), 0.006 * S, 0.006 * S, 0.014 * S)
        if comb != 'none':
            # the wattles under the beak
            for sx in (-1, 1):
                cb.ell(P(sx * 0.005, 0.212, 0.09), 0.005 * S, 0.01 * S, 0.004 * S)
        if helmet:
            cb.cap(P(0, 0.25, 0.07), P(0, 0.272, 0.062), 0.009 * S, 0.004 * S)
        cb.build(red if not helmet else pm('hn_helm', helmet), 200)
        if crest:
            # a pompom of feathers on the crown (Polish, Silkie)
            cr = Blob(0.0022 * S)
            for i in range(14):
                a = i * 2.39996
                r = 0.016 * math.sqrt((i + 0.5) / 14)
                cr.ball(P(math.cos(a) * r, 0.258 + (0.012 - r) * 0.6, 0.066 + math.sin(a) * r), 0.012 * crest * S)
            cr.build(by('crest'), 500)
    eye_mark(P(0.0185, 0.238, 0.084), 0.0055 * S, 1.0)
    for i, sx in enumerate((-1, 1)):
        x = sx * 0.024
        with anim_group(f'leg{i}', B(*P(x, 0.085, 0.0))):
            lg = Blob(0.0015 * S)
            lg.cap(P(x, 0.09, 0.0), P(x, 0.012, 0.005), 0.0075 * S, 0.0058 * S)
            for a in (-0.5, 0.0, 0.5):
                lg.cap(P(x, 0.007, 0.005), P(x + math.sin(a) * 0.028, 0.004, 0.005 + math.cos(a) * 0.032), 0.0042 * S, 0.0028 * S)
            lg.cap(P(x, 0.007, 0.005), P(x, 0.005, -0.016), 0.0038 * S, 0.0026 * S)
            lg.build(pm('hn_leg' + legs[1:], legs), 240)
            if feathered:
                ff = Blob(0.002 * S)
                ff.ell(P(x * 1.15, 0.035, 0.004), 0.013 * S, 0.03 * S, 0.012 * S)
                ff.ell(P(x * 1.3, 0.012, 0.02), 0.012 * S, 0.008 * S, 0.02 * S)
                ff.build(by('foot'), 200)
    finish(f'animal_{kind}', tex=512, vivid=1.06, ao_min=0.65, ao_dist=0.05)


def lacing(base, edge, f=220, th=0.35):
    """Feathers edged in another colour (laced and pencilled breeds)."""
    return lambda x, y, z: edge if abs(noise(x, y, z, f)) > th else base


def chicken():
    def paint(part, x, y, z):
        if part == 'tail':
            return '#2a2622'
        if part == 'neck':
            return '#c8782e'                              # golden hackles
        return '#9a4a22' if noise(x, y, z, 80) < 0.3 else '#b05a28'
    hen_model('chicken', paint)


def rhode_island_red():
    def paint(part, x, y, z):
        if part == 'tail':
            return '#18221e'
        if part == 'wing' and y < 0.13:
            return '#1e1a18'
        return '#6e2612' if noise(x, y, z, 80) < 0.3 else '#80301a'
    hen_model('rhode_island_red', paint)


def leghorn():
    hen_model('leghorn', lambda part, x, y, z: '#f7f5ef', comb='big', tail='tall', legs='#f0c030', beak='#f0c030')


def marans():
    def paint(part, x, y, z):
        if part in ('neck', 'head'):
            return '#b8662a' if noise(x, y * 3, z, 120) > -0.2 else '#1a1614'   # copper hackles
        return '#161412'
    hen_model('marans', paint, legs='#8a8a88', beak='#6a5a4a')


def orpington():
    hen_model('orpington', lambda part, x, y, z: '#e3b464' if noise(x, y, z, 90) < 0.35 else '#eec27a', fluffy=1.18,
              legs='#e8d0b8', beak='#e8c8a0', tail='short')


def polish_chicken():
    def paint(part, x, y, z):
        return '#f7f4ee' if part == 'crest' else '#1a1816'
    hen_model('polish_chicken', paint, comb='small', crest=1.35, legs='#6a6a6c', beak='#4a4a4c')


def silkie_chicken():
    hen_model('silkie_chicken', lambda part, x, y, z: '#f8f6f1', fluffy=1.2, crest=1.2, comb='walnut', comb_col='#4a2a4a',
              feathered=True, legs='#5a5a64', beak='#5a5a64', tail='short', face='#3a3040')


def wyandotte():
    def paint(part, x, y, z):
        if part == 'tail':
            return '#1a1816'
        return lacing('#f4f1ea', '#1c1a18')(x, y, z)
    hen_model('wyandotte', paint, comb='pea', fluffy=1.08)


def brahma_chicken():
    def paint(part, x, y, z):
        if part == 'tail':
            return '#1a1816'
        if part == 'neck':
            return '#1a1816' if math.sin(x * 900) > 0.2 else '#f4f1ea'   # striped hackles
        if part == 'wing' and y < 0.13:
            return '#1a1816'
        return '#f4f1ea'
    hen_model('brahma_chicken', paint, comb='pea', fluffy=1.12, feathered=True, legs='#e8b030', S=1.12)


def ayam_cemani():
    hen_model('ayam_cemani', lambda part, x, y, z: '#0f0d0e' if noise(x, y, z, 60) < 0.3 else '#1a1c24', comb='single',
              comb_col='#141214', legs='#141214', beak='#141214', tail='tall', face='#141214')


def guinea_fowl():
    def paint(part, x, y, z):
        if part == 'head':
            return '#eef2f6'                              # the bare pale blue face
        if part == 'neck' and y > 0.2:
            return '#3a3a44'
        return '#f4f2ee' if noise(x, y, z, 260) > 0.45 else '#3e3e4a'    # polka dots
    hen_model('guinea_fowl', paint, comb='none', helmet='#c8a070', legs='#5a5a5c', beak='#e8b89a', tail='short', fluffy=1.06)


def pheasant():
    def paint(part, x, y, z):
        if part == 'head':
            return '#1e4a3a'                              # the glossy green head
        if part == 'neck':
            if 0.172 < y < 0.182:
                return '#f4f2ee'                          # the white collar
            return '#1e4a3a' if y >= 0.182 else '#b85a22'
        if part == 'tail':
            return '#6a4a2a' if math.sin(z * 200) > 0 else '#a8864e'     # the long barred tail
        return '#b85a22' if noise(x, y, z, 200) < 0.4 else '#3a2418'
    hen_model('pheasant', paint, comb='small', comb_col='#d8302a', tail='long', legs='#8a7a6a', beak='#d8c8a0', S=0.95)



# ---------------------------------------------------------------- waders (modelled here)

def wader(kind, paint, bill='#e8c040', legs='#7a6a5a', S=1.0, crest=None, bill_down=False, bill_tip=None, neck=0.22):
    """A long legged wading bird: a slim body carried level on stilt legs, a long S curved neck
    (its `head` part pivots at the base of the neck, so the whole neck stoops to fish), a long
    bill and a short tail. `paint(part, x, y, z)`: body, wing, tail, neck, head, crest."""
    def P(*p):
        return tuple(c * S for c in p)

    def by(part):
        return lambda x, y, z: cm(paint(part, x / S, y / S, z / S))
    Y = 0.42
    b = Blob(0.003 * S)
    b.ell(P(0, Y, 0), 0.05 * S, 0.048 * S, 0.1 * S)
    b.ell(P(0, Y - 0.015, 0.05), 0.042 * S, 0.042 * S, 0.05 * S)
    b.build(by('body'), 1200)
    for sx in (-1, 1):
        w = Blob(0.0025 * S)
        w.ell(P(sx * 0.044, Y + 0.008, -0.02), 0.012 * S, 0.034 * S, 0.09 * S)
        w.ell(P(sx * 0.03, Y + 0.004, -0.1), 0.012 * S, 0.018 * S, 0.04 * S)
        w.build(by('wing'), 360)
    t = Blob(0.0025 * S)
    t.ell(P(0, Y + 0.005, -0.11), 0.03 * S, 0.015 * S, 0.035 * S)
    t.build(by('tail'), 200)
    with anim_group('head', B(*P(0, Y + 0.02, 0.07))):
        # the neck: out, up, and forward again in an S
        pts = [(0, Y + 0.02, 0.075), (0, Y + 0.09, 0.1), (0, Y + 0.16, 0.08), (0, Y + neck, 0.09), (0, Y + neck + 0.03, 0.11)]
        n = Blob(0.0022 * S)
        for k in range(len(pts) - 1):
            n.cap(P(*pts[k]), P(*pts[k + 1]), (0.022 - k * 0.003) * S, (0.019 - k * 0.003) * S)
        n.build(by('neck'), 600)
        hx, hy, hz = pts[-1]
        h = Blob(0.002 * S)
        h.ell(P(hx, hy + 0.004, hz + 0.008), 0.016 * S, 0.018 * S, 0.022 * S)
        h.build(by('head'), 300)
        bk = Blob(0.0015 * S)
        if bill_down:
            # the flamingo's thick bill, bent sharply down in the middle
            bk.cap(P(hx, hy + 0.002, hz + 0.024), P(hx, hy - 0.004, hz + 0.05), 0.009 * S, 0.007 * S)
            bk.cap(P(hx, hy - 0.004, hz + 0.05), P(hx, hy - 0.03, hz + 0.058), 0.007 * S, 0.003 * S)
        else:
            bk.cap(P(hx, hy + 0.002, hz + 0.024), P(hx, hy - 0.008, hz + 0.085), 0.0065 * S, 0.0015 * S)
        tipz = hz + 0.05
        bk.build(lambda x, y, z: pm('wd_tip' + bill_tip[1:], bill_tip) if (bill_tip and (y / S < hy - 0.012)) else pm('wd_bill' + bill[1:], bill), 200)
        if crest:
            cr = Blob(0.0012 * S)
            cr.cap(P(hx, hy + 0.012, hz - 0.004), P(hx, hy + 0.004, hz - 0.06), 0.004 * S, 0.0012 * S)
            cr.build(pm('wd_crest' + crest[1:], crest), 80)
        eye_mark(P(0.012, hy + 0.008, hz + 0.014), 0.0045 * S, 1.2)
    for i, sx in enumerate((-1, 1)):
        x = sx * 0.018
        with anim_group(f'leg{i}', B(*P(x, Y - 0.03, 0.0))):
            lg = Blob(0.0012 * S)
            knee = (x, 0.2, -0.012)
            lg.cap(P(x, Y - 0.03, 0.0), P(*knee), 0.0068 * S, 0.0052 * S)
            lg.cap(P(*knee), P(x, 0.012, 0.004), 0.0052 * S, 0.0045 * S)
            for a in (-0.55, 0.0, 0.55):
                lg.cap(P(x, 0.006, 0.004), P(x + math.sin(a) * 0.04, 0.003, 0.004 + math.cos(a) * 0.045), 0.0035 * S, 0.002 * S)
            lg.cap(P(x, 0.006, 0.004), P(x, 0.004, -0.02), 0.003 * S, 0.002 * S)
            lg.build(pm('wd_leg' + legs[1:], legs), 240)
    finish(f'animal_{kind}', tex=512, vivid=1.06, ao_min=0.7, ao_dist=0.05)


def flamingo():
    def paint(part, x, y, z):
        if part == 'wing' and y < 0.415:
            return '#2a2224'                              # the black flight feathers
        return '#f2849c' if part in ('body', 'wing') else '#f49aae'
    wader('flamingo', paint, bill='#f2d8d0', bill_tip='#1e1a1a', legs='#e8788e', bill_down=True, neck=0.3, S=1.05)


def crane():
    def paint(part, x, y, z):
        if part == 'neck':
            return '#1e1c1c' if y < 0.6 or z < 0.09 else '#f4f2ee'
        if part == 'head':
            return '#d82a22' if y > 0.672 else '#1e1c1c'     # the red crown
        if part == 'tail' or (part == 'wing' and z < -0.06):
            return '#1e1c1c'                              # the black bustle over the tail
        return '#f6f4f0'
    wader('crane', paint, bill='#8a8a6a', legs='#2a2826', neck=0.26, S=1.08)


def grey_heron():
    def paint(part, x, y, z):
        if part == 'neck':
            return '#1e1e22' if abs(x) < 0.004 and z > 0.08 else '#eeeeee'  # the black streak down the front
        if part == 'head':
            return '#1e1e22' if abs(x) > 0.008 and y > 0.672 else '#f4f4f2'
        if part == 'wing' and y < 0.42:
            return '#3a3e44'
        return '#8e98a2'
    wader('grey_heron', paint, bill='#e8b83a', legs='#8a7a5a', crest='#1e1e22', neck=0.24)


# ---------------------------------------------------------------- ratites (real_ostrich)

def ratite(kind, plumage, skin, leg, S=1.0, head_extra=None, body_extra=None):
    skin_c, leg_c = lin(skin), lin(leg)

    def paint(v):
        if v.part == 'leg':
            return leg_c if v.ly < -0.02 else plumage(v)
        if v.part == 'head' or (v.part == 'body' and v.y > 0.72 and v.z > 0.1):
            return skin_c if not callable(skin) else skin(v)
        return plumage(v)
    build(kind, 'ostrich', paint, S=S, head_extra=head_extra, body_extra=body_extra)


def emu():
    def plumage(v):
        return shade(lin('#6a5a48') if noise(v.x, v.y * 3, v.z, 90) > 0 else lin('#8a7660'), v.x, v.y, v.z, 0.1)
    ratite('emu', plumage, '#5a6a8a', '#6a6660', S=0.86)


def rhea():
    def plumage(v):
        if v.part == 'body' and v.y > 0.7 and v.z > 0.05:
            return lin('#2a2826')                          # the dark base of the neck
        return shade(lin('#9a948c'), v.x, v.y, v.z, 0.08, 60)
    ratite('rhea', plumage, '#aaa49c', '#8a847a', S=0.8)


def cassowary():
    def extra(S, h):
        hx, hy, hz = h
        # the tall horny casque and the red wattles down the throat
        c = Blob(0.0018 * S)
        c.cap(((hx) * S, (hy + 0.02) * S, (hz + 0.005) * S), (hx * S, (hy + 0.07) * S, (hz - 0.015) * S), 0.014 * S, 0.008 * S)
        c.build(pm('cs_casque', '#a8845a', '#c09a6a', scale=40), 200)
        w = Blob(0.0015 * S)
        for sx in (-1, 1):
            w.ell(((hx + sx * 0.008) * S, (hy - 0.07) * S, (hz + 0.01) * S), 0.007 * S, 0.02 * S, 0.006 * S)
        w.build(pm('cs_wattle', '#d82a22'), 120)
    ratite('cassowary', lambda v: shade(lin('#141212'), v.x, v.y, v.z, 0.25, 90), '#2a6ab8', '#6a6a60', S=0.9, head_extra=extra)


# ---------------------------------------------------------------- rabbits (real_rabbit)

def rabbit_kind(kind, coat, S=1.0, drop=None, head_extra=None, body_extra=None, warp=None):
    def paint(v):
        if v.part == 'head' and pinkish(v.rgb) and v.lz > 0.05 and v.ly < 0.03:
            return lin('#d89a9a')                          # the nose
        return coat(v)
    build(kind, 'rabbit', paint, S=S, drop=drop, head_extra=head_extra, body_extra=body_extra, warp=warp)


def angora_rabbit():
    def fluff(S):
        b = Blob(0.003 * S)
        ga = math.pi * (3 - math.sqrt(5))
        for i in range(110):
            y = 1 - 2 * (i + 0.5) / 110
            if y < -0.6:
                continue
            rad = math.sqrt(1 - y * y)
            a = ga * i
            b.ball(((math.cos(a) * rad * 0.075) * S, (0.09 + y * 0.075) * S, (-0.01 + math.sin(a) * rad * 0.09) * S), 0.026 * S)
        b.build(pm('ar_fluff', '#f6f3ee', '#ffffff', scale=90), 1600)
    rabbit_kind('angora_rabbit', lambda v: shade(lin('#f4f1ec'), v.x, v.y, v.z, 0.04), body_extra=fluff)


def dutch_rabbit():
    black, white = lin('#2a2624'), lin('#f5f2ec')

    def coat(v):
        if v.part == 'body':
            return black if v.z < -0.01 + noise(v.x, v.y, 0, 20) * 0.01 else white     # the dark hind half
        # a white blaze up the face between dark cheeks and ears
        if abs(v.lx) < 0.012 + max(0, -v.ly) * 0.3 and v.lz > 0.02:
            return white
        return black
    rabbit_kind('dutch_rabbit', coat)


def lop_rabbit():
    fawn = lin('#b88a5c')

    def ears(S, h):
        hx, hy, hz = h
        for sx in (-1, 1):
            # long ears hanging down beside the face
            e = Blob(0.002 * S)
            e.cap(((hx + sx * 0.03) * S, (hy + 0.05) * S, (hz - 0.012) * S), ((hx + sx * 0.058) * S, (hy + 0.04) * S, (hz - 0.008) * S), 0.012 * S, 0.012 * S)
            for k in range(7):
                u = k / 6
                e.ell(((hx + sx * (0.062 + u * 0.004)) * S, (hy + 0.035 - u * 0.085) * S, (hz - 0.006 + u * 0.01) * S), 0.007 * S, 0.016 * S, (0.024 - u * 0.006) * S)
            e.build(pm('lr_ear', '#a87a4e', '#b88a5c', scale=40), 300)
    rabbit_kind('lop_rabbit', lambda v: shade(fawn, v.x, v.y, v.z, 0.08, 60),
                warp=lambda v: (v.lx * 0.9, 0.05 - (v.ly - 0.05) * 0.05, v.lz) if v.part == 'head' and v.ly > 0.05 else None,
                head_extra=ears)


# ---------------------------------------------------------------- ducks, turkey, peacock (recoloured)

def muscovy_duck():
    black, white = lin('#161a18'), lin('#f4f2ec')

    def paint(v):
        if v.part == 'head':
            if duck_region(v) == 'bill':
                return lin('#e8c8c0')
            return white if noise(v.x, v.y, v.z, 30) > -0.2 else black
        return white if (v.y > 0.1 and abs(v.x) > 0.05 and v.z > -0.04) else shade(black, v.x, v.y, v.z, 0.25, 60)

    def caruncle(S, h):
        hx, hy, hz = h
        c = Blob(0.0012 * S)
        for sx in (-1, 1):
            c.ell(((hx + sx * 0.022) * S, (hy + 0.01) * S, (hz + 0.02) * S), 0.004 * S, 0.012 * S, 0.018 * S)
        c.ell(((hx) * S, (hy + 0.012) * S, (hz + 0.05) * S), 0.008 * S, 0.006 * S, 0.01 * S)
        c.build(pm('md_car', '#c8282a'), 160)
    build('muscovy_duck', 'duck', paint, head_extra=caruncle, S=1.1)


def mandarin_duck():
    def paint(v):
        if v.part == 'head':
            if duck_region(v) == 'bill':
                return lin('#d8302a')
            if abs(v.lx) > 0.02 and v.ly > 0.0 and v.lz < 0.03:
                return lin('#f4f2ee')                      # the broad white eye stripe
            if v.ly < -0.005:
                return lin('#e07a2a')                      # the orange whiskers
            return lin('#2a5a3a') if v.ly > 0.03 else lin('#8a3a1e')
        if v.z > 0.05 and v.y < 0.13:
            return lin('#4a2244')                          # the purple breast
        if v.y > 0.14:
            return lin('#3a3230')
        return shade(lin('#c89a62'), v.x, v.y, v.z, 0.06)

    def sails(S):
        # the orange sails standing up on the back
        b = Blob(0.0015 * S)
        for sx in (-1, 1):
            b.ell((sx * 0.04 * S, 0.16 * S, -0.03 * S), 0.004 * S, 0.028 * S, 0.02 * S)
        b.build(pm('md_sail', '#e8782a', '#f08a3a', scale=40), 200)
    build('mandarin_duck', 'duck', paint, body_extra=sails)


def duck():
    build('duck', 'duck', lambda v: shade(v.rgb, v.x, v.y, v.z, 0.06, 60))


def bronze_turkey():
    def paint(v):
        r = v.rgb
        if v.part == 'head':
            return r
        if r[0] > 0.4:
            return lin('#e6dccb')                          # the pale feather tips on the fan
        if r[0] > 0.1:
            return shade(lin('#7a5230'), v.x, v.y, v.z, 0.15, 80)
        return lin('#3a2a1a') if noise(v.x, v.y, v.z, 120) > 0 else lin('#5a4020')   # bronze sheen
    build('bronze_turkey', 'gobbler', paint)


def white_peacock():
    def paint(v):
        if v.part == 'leg':
            return lin('#8a8684')
        if v.part == 'head' and v.lz > 0.03 and v.ly < 0.01:
            return lin('#9a948e')                          # the bill
        return shade(lin('#f7f6f2'), v.x, v.y, v.z, 0.03, 60)
    build('white_peacock', 'peacock', paint)


# ---------------------------------------------------------------- bison and musk ox (real_buffalo)

def shag_skirt(S, col, y0, y1, n=80, zr=(-0.26, 0.3), rx=0.13, r0=0.02):
    """Long hair hanging from the flanks, chest and neck: thick overlapping locks of uneven
    length that run together into one shaggy mass, with a wavy combed texture."""
    c = [int(col[i:i + 2], 16) for i in (1, 3, 5)]
    hair = pm(uid('shag'), col, '#' + ''.join(f'{min(255, int(v * 1.3)):02x}' for v in c), scale=60, kind='wave', stretch=(1, 1, 6))
    b = Blob(0.006 * S)
    for k in range(n):
        u = (k + 0.5) / n
        z = zr[0] + u * (zr[1] - zr[0])
        for sx in (-1, 1):
            j = math.sin(k * 12.9898 + sx) * 43758.5453 % 1
            x = sx * (rx + 0.012 * j)
            top = y0 + 0.03 * math.sin(k * 0.9 + sx)
            end = y1 + (j - 0.5) * 0.06
            b.cap((x * S, top * S, z * S), (x * (1.08 + 0.05 * j) * S, end * S, (z + (j - 0.5) * 0.03) * S), r0 * 1.6 * S, r0 * 0.9 * S)
    b.build(hair, 2200)


def bison():
    dark, cape = lin('#2e2016'), lin('#6a4a2c')

    def paint(v):
        if v.part == 'leg' and v.ly < -0.17:
            return lin('#1a1410')
        if v.part == 'head':
            return shade(lin('#3a2818'), v.x, v.y, v.z, 0.15, 80)   # the dark, woolly head
        if v.part == 'body' and v.z > 0.08:
            return shade(cape, v.x, v.y, v.z, 0.15, 80)    # the woolly cape over the forequarters
        return shade(dark, v.x, v.y, v.z, 0.12, 40)

    def hump(S):
        b = Blob(0.005 * S)
        b.ell((0, 0.5 * S, 0.1 * S), 0.09 * S, 0.1 * S, 0.11 * S)
        # the woolly cape round the shoulders and chest, falling to the knees in front
        b.ell((0, 0.41 * S, 0.1 * S), 0.13 * S, 0.13 * S, 0.12 * S)
        b.ell((0, 0.31 * S, 0.19 * S), 0.09 * S, 0.09 * S, 0.06 * S)
        b.build(pm('bs_hump', '#6a4a2c', '#8a6238', scale=70, kind='wave', stretch=(1, 1, 5)), 1600)

    def extra(S, h):
        hx, hy, hz = h
        bd = Blob(0.003 * S)
        bd.cap((hx * S, (hy - 0.07) * S, (hz + 0.05) * S), (hx * S, (hy - 0.16) * S, (hz + 0.04) * S), 0.03 * S, 0.012 * S)
        bd.ell((hx * S, (hy + 0.065) * S, (hz - 0.03) * S), 0.05 * S, 0.035 * S, 0.04 * S)   # the woolly topknot
        bd.build(pm('bs_beard', '#4a3420', '#6a4a2c', scale=70), 600)
        for sx in (-1, 1):
            pts = curve((sx * 0.06, hy + 0.05, hz - 0.03), (sx * 0.1, hy + 0.06, hz - 0.03), (sx * 0.1, hy + 0.11, hz - 0.01), 6)
            horn_path([tuple(c * S for c in p) for p in pts], 0.016 * S, 0.004 * S, pm('bs_horn', '#2a2420'), pm('bs_tip', '#1a1614'), faces=200)
    build('bison', 'buffalo', paint, head_extra=extra, body_extra=hump)


def musk_ox():
    brown, saddle = lin('#3a2a1e'), lin('#c8b89a')

    def paint(v):
        if v.part == 'body' and v.y > 0.46 and -0.1 < v.z < 0.1:
            return shade(saddle, v.x, v.y, v.z, 0.06)      # the pale saddle
        if v.part == 'leg' and v.ly < -0.14:
            return lin('#e0d6c4')                          # pale stockings
        return shade(brown, v.x, v.y, v.z, 0.14, 60)

    def extra(S, h):
        hx, hy, hz = h
        for sx in (-1, 1):
            # the boss across the brow, the horns sweeping down past the eyes and up at the tips
            pts = curve((sx * 0.015, hy + 0.08, hz - 0.02), (sx * 0.13, hy + 0.06, hz - 0.03), (sx * 0.12, hy - 0.03, hz + 0.04), 10)
            pts += [((sx * 0.14), hy + 0.01, hz + 0.07)]
            horn_path([tuple(c * S for c in p) for p in pts], 0.026 * S, 0.006 * S, pm('mo_horn', '#d8ccb4'), pm('mo_tip', '#2a2420'), faces=400)

    def skirt(S):
        # the long coat hanging almost to the hooves all round, like a haystack
        b = Blob(0.006 * S)
        b.ell((0, 0.35 * S, 0.0), 0.155 * S, 0.17 * S, 0.29 * S)
        b.ell((0, 0.27 * S, 0.0), 0.15 * S, 0.12 * S, 0.27 * S)
        b.ell((0, 0.4 * S, 0.2 * S), 0.12 * S, 0.14 * S, 0.1 * S)
        b.build(lambda x, y, z: pm('mo_saddle', '#c8b89a', '#d8c8aa', scale=50) if (y > 0.49 * S and abs(z) < 0.1 * S) else
                pm('mo_coat', '#3a2a1e', '#56402c', scale=60, kind='wave', stretch=(1, 1, 6)), 2400)
    build('musk_ox', 'buffalo', paint, head_extra=extra, body_extra=skirt)



# ---------------------------------------------------------------- small animals and the cat (modelled here)

def quad(kind, paint, body, head, legs, tail, eye, S=1.0, extra=None, tex=512):
    """A small four legged animal from parts: `body(b)` and `head(h)` fill blobs (game coords,
    scaled by S afterwards), `legs` the hip points and leg length, `tail(t)` fills the tail
    blob; `paint(part, x, y, z)` gives the colour. Parts: head, leg0..3 and tail."""
    def by(part):
        return lambda x, y, z: cm(paint(part, x / S, y / S, z / S), scale=80)
    b = Blob(0.0025 * S)
    body(b, S)
    b.build(by('body'), 1600)
    hp, hfill = head
    with anim_group('head', B(*(c * S for c in hp))):
        h = Blob(0.0018 * S)
        hfill(h, S)
        h.build(by('head'), 1100)
        if extra:
            extra(S)
    (ex, ey, ez), er, yaw = eye
    eye_mark((ex * S, ey * S, ez * S), er * S, yaw)
    hips, top, foot = legs
    for i, (x, z) in enumerate(hips):
        with anim_group(f'leg{i}', B(x * S, top * S, z * S)):
            lg = Blob(0.0015 * S)
            lg.cap((x * S, top * S, z * S), (x * S, 0.012 * S, (z + 0.004) * S), foot[0] * S, foot[1] * S)
            lg.ell((x * S, 0.008 * S, (z + 0.008) * S), foot[1] * 1.2 * S, foot[1] * S, foot[1] * 1.5 * S)
            lg.build(by('leg'), 240)
    if tail:
        tp, tfill = tail
        with anim_group('tail', B(*(c * S for c in tp))):
            t = Blob(0.0018 * S)
            tfill(t, S)
            t.build(by('tail'), 500)
    finish(f'animal_{kind}', tex=tex, vivid=1.06, ao_min=0.7, ao_dist=0.04)


def P3(S, *p):
    return tuple(c * S for c in p)


def cat():
    def paint(part, x, y, z):
        # a calico: white with patches of ginger and black
        if part == 'head' and z > 0.152 and abs(x) < 0.006 and y < 0.21:
            return '#e89a9a'                              # the pink nose
        if part == 'ear_in':
            return '#e8a8a8'
        n = noise(x + 3, y, z, 16)
        if n > 0.25:
            return '#d8782a'
        if n < -0.3:
            return '#2a2624'
        return '#f6f3ee'

    def body(b, S):
        b.ell(P3(S, 0, 0.15, -0.005), 0.042 * S, 0.042 * S, 0.1 * S)
        b.ball(P3(S, 0, 0.155, 0.062), 0.04 * S)
        b.ball(P3(S, 0, 0.155, -0.072), 0.042 * S)
        b.cap(P3(S, 0, 0.17, 0.075), P3(S, 0, 0.198, 0.1), 0.03 * S, 0.026 * S)

    def head(h, S):
        h.ball(P3(S, 0, 0.215, 0.115), 0.035 * S)
        h.ell(P3(S, 0, 0.205, 0.125), 0.04 * S, 0.028 * S, 0.03 * S)       # the cheeks
        h.ell(P3(S, 0, 0.199, 0.146), 0.016 * S, 0.012 * S, 0.012 * S)     # the muzzle
        for sx in (-1, 1):
            h.cap(P3(S, sx * 0.021, 0.238, 0.108), P3(S, sx * 0.03, 0.272, 0.1), 0.013 * S, 0.002 * S)

    def ears_in(S):
        e = Blob(0.0012 * S)
        for sx in (-1, 1):
            e.cap(P3(S, sx * 0.022, 0.242, 0.114), P3(S, sx * 0.029, 0.265, 0.108), 0.006 * S, 0.0015 * S)
        e.build(cm('#e8a8a8'), 80)

    def tail(t, S):
        pts = [(0, 0.17, -0.105), (0, 0.19, -0.16), (0, 0.23, -0.2), (0, 0.28, -0.205)]
        for k in range(3):
            t.cap(P3(S, *pts[k]), P3(S, *pts[k + 1]), (0.01 - k * 0.001) * S, (0.009 - k * 0.001) * S)
    quad('cat', paint, body, ((0, 0.2, 0.1), head), ([(-0.03, 0.06), (0.03, 0.06), (-0.03, -0.07), (0.03, -0.07)], 0.13, (0.011, 0.008)),
         ((0, 0.17, -0.105), tail), ((0.0165, 0.222, 0.142), 0.0075, 0.6), extra=ears_in)


def squirrel():
    def paint(part, x, y, z):
        if part == 'head' and z > 0.1 and y < 0.12:
            return '#f4ece0'
        if part == 'body' and (y < 0.07 or z > 0.05) and abs(x) < 0.025:
            return '#f4ece0'                              # the white belly and chest
        return '#b8562a' if noise(x, y, z, 60) < 0.3 else '#a24a22'

    def body(b, S):
        b.ell(P3(S, 0, 0.075, 0.0), 0.03 * S, 0.034 * S, 0.055 * S)
        b.ball(P3(S, 0, 0.08, -0.035), 0.034 * S)                          # the haunches
        b.cap(P3(S, 0, 0.09, 0.035), P3(S, 0, 0.11, 0.055), 0.024 * S, 0.02 * S)

    def head(h, S):
        h.ball(P3(S, 0, 0.12, 0.07), 0.024 * S)
        h.ell(P3(S, 0, 0.114, 0.09), 0.013 * S, 0.012 * S, 0.014 * S)
        for sx in (-1, 1):
            h.cap(P3(S, sx * 0.013, 0.138, 0.064), P3(S, sx * 0.016, 0.162, 0.06), 0.007 * S, 0.002 * S)   # ear tufts

    def tail(t, S):
        # the big bushy tail curled up over the back
        pts = [(0, 0.07, -0.07), (0, 0.1, -0.11), (0, 0.16, -0.12), (0, 0.2, -0.09), (0, 0.21, -0.05)]
        for k in range(4):
            t.cap(P3(S, *pts[k]), P3(S, *pts[k + 1]), (0.02 + k * 0.004) * S, (0.024 + k * 0.003) * S)
    quad('squirrel', paint, body, ((0, 0.11, 0.06), head), ([(-0.018, 0.035), (0.018, 0.035), (-0.022, -0.035), (0.022, -0.035)], 0.06, (0.008, 0.006)),
         ((0, 0.07, -0.07), tail), ((0.013, 0.126, 0.083), 0.0055, 0.8))


def beaver():
    def paint(part, x, y, z):
        if part == 'tail':
            return '#2a2624' if noise(x * 3, y, z * 3, 200) > -0.2 else '#3a3430'   # the scaly paddle
        if part == 'head' and z > 0.14 and y < 0.085:
            return '#e8882a'                              # the orange front teeth
        return '#6a4428' if noise(x, y, z, 50) < 0.3 else '#5a3a22'

    def body(b, S):
        b.ell(P3(S, 0, 0.07, -0.01), 0.055 * S, 0.05 * S, 0.085 * S)
        b.ball(P3(S, 0, 0.068, -0.05), 0.052 * S)
        b.cap(P3(S, 0, 0.08, 0.05), P3(S, 0, 0.09, 0.08), 0.042 * S, 0.034 * S)

    def head(h, S):
        h.ball(P3(S, 0, 0.095, 0.1), 0.034 * S)
        h.ell(P3(S, 0, 0.088, 0.128), 0.024 * S, 0.02 * S, 0.02 * S)
        h.ell(P3(S, 0, 0.078, 0.146), 0.008 * S, 0.008 * S, 0.004 * S)   # the teeth
        for sx in (-1, 1):
            h.ball(P3(S, sx * 0.026, 0.118, 0.092), 0.008 * S)

    def tail(t, S):
        t.ell(P3(S, 0, 0.03, -0.17), 0.035 * S, 0.008 * S, 0.055 * S)
        t.cap(P3(S, 0, 0.05, -0.11), P3(S, 0, 0.032, -0.13), 0.016 * S, 0.012 * S)
    quad('beaver', paint, body, ((0, 0.09, 0.08), head), ([(-0.035, 0.04), (0.035, 0.04), (-0.04, -0.06), (0.04, -0.06)], 0.05, (0.012, 0.01)),
         ((0, 0.05, -0.11), tail), ((0.022, 0.108, 0.118), 0.0055, 0.8), S=1.1)


def chinchilla():
    def paint(part, x, y, z):
        if part == 'head' and 0.13 < z and y < 0.09:
            return '#e8e4de'
        if part == 'body' and y < 0.045:
            return '#ece8e2'
        if part == 'ear_in':
            return '#d8b0b0'
        return '#9ca0a4' if noise(x, y, z, 120) < 0.3 else '#b4b8bc'

    def body(b, S):
        b.ell(P3(S, 0, 0.07, -0.01), 0.052 * S, 0.055 * S, 0.065 * S)
        b.ball(P3(S, 0, 0.068, -0.04), 0.052 * S)

    def head(h, S):
        h.ball(P3(S, 0, 0.1, 0.06), 0.036 * S)
        h.ell(P3(S, 0, 0.093, 0.088), 0.022 * S, 0.02 * S, 0.018 * S)
        for sx in (-1, 1):
            # big round ears
            h.ell(P3(S, sx * 0.028, 0.14, 0.05), 0.008 * S, 0.026 * S, 0.02 * S)

    def tail(t, S):
        pts = [(0, 0.05, -0.09), (0, 0.08, -0.13), (0, 0.11, -0.13)]
        for k in range(2):
            t.cap(P3(S, *pts[k]), P3(S, *pts[k + 1]), 0.014 * S, 0.018 * S)
    quad('chinchilla', paint, body, ((0, 0.09, 0.05), head), ([(-0.03, 0.03), (0.03, 0.03), (-0.035, -0.04), (0.035, -0.04)], 0.04, (0.009, 0.008)),
         ((0, 0.05, -0.09), tail), ((0.022, 0.108, 0.082), 0.0075, 0.7))


def kiwi_bird():
    def paint(part, x, y, z):
        return '#6a4e34' if noise(x, y * 3, z, 160) < 0.2 else '#7e6040'   # the hair like feathers

    def body(b, S):
        b.ell(P3(S, 0, 0.1, -0.01), 0.06 * S, 0.06 * S, 0.075 * S)
        b.ball(P3(S, 0, 0.105, 0.045), 0.045 * S)

    def head(h, S):
        h.ball(P3(S, 0, 0.12, 0.085), 0.026 * S)

    def bill(S):
        bk = Blob(0.0012 * S)
        bk.cap(P3(S, 0, 0.115, 0.105), P3(S, 0, 0.06, 0.17), 0.005 * S, 0.0025 * S)   # the long bill, pointing down
        bk.build(pm('kw_bill', '#d8c8a8'), 120)
    quad('kiwi_bird', paint, body, ((0, 0.115, 0.07), head), ([(-0.025, 0.0), (0.025, 0.0)], 0.06, (0.011, 0.009)),
         None, ((0.017, 0.128, 0.098), 0.0035, 0.9), extra=bill)


def parrot():
    def paint(part, x, y, z):
        if part == 'head' and z > 0.088:
            return '#f4efe8'                              # the bare white face
        if part == 'tail':
            return '#d82a22' if abs(x) < 0.006 else '#2a6ac8'
        if part == 'body' and abs(x) > 0.024 and y < 0.2:
            return '#f0c02a' if y > 0.15 else '#2a6ac8'   # yellow and blue on the wings
        return '#d8261e'

    def body(b, S):
        b.ell(P3(S, 0, 0.16, -0.01), 0.032 * S, 0.055 * S, 0.035 * S)
        b.ell(P3(S, 0, 0.175, 0.008), 0.03 * S, 0.035 * S, 0.03 * S)
        for sx in (-1, 1):
            b.ell(P3(S, sx * 0.028, 0.16, -0.018), 0.01 * S, 0.05 * S, 0.028 * S)   # the folded wings

    def head(h, S):
        h.ball(P3(S, 0, 0.225, 0.02), 0.026 * S)

    def beak(S):
        bk = Blob(0.0012 * S)
        bk.cap(P3(S, 0, 0.228, 0.042), P3(S, 0, 0.21, 0.056), 0.012 * S, 0.004 * S)   # the big hooked bill
        bk.build(lambda x, y, z: pm('pr_lower', '#1e1a18') if y / S < 0.214 else pm('pr_upper', '#ece4d8'), 160)

    def tail(t, S):
        t.cap(P3(S, 0, 0.11, -0.03), P3(S, 0, -0.0, -0.08), 0.014 * S, 0.004 * S)
    quad('parrot', paint, body, ((0, 0.205, 0.012), head), ([(-0.014, 0.0), (0.014, 0.0)], 0.1, (0.0055, 0.0045)),
         ((0, 0.11, -0.03), tail), ((0.017, 0.232, 0.03), 0.0045, 1.0), extra=beak, S=1.1)


def silkworm():
    def body(b, S):
        # a plump white caterpillar in segments, the head end raised
        for k in range(9):
            u = k / 8
            b.ball(P3(S, 0, 0.018 + max(0, u - 0.7) * 0.06, -0.06 + u * 0.12), (0.016 + math.sin(u * math.pi) * 0.004) * S)
        b.cap(P3(S, 0, 0.03, -0.065), P3(S, 0, 0.042, -0.07), 0.003 * S, 0.001 * S)   # the little tail horn

    def head(h, S):
        h.ball(P3(S, 0, 0.04, 0.07), 0.012 * S)
    quad('silkworm', lambda part, x, y, z: '#f2eee6' if part != 'head' else '#e0d8cc', body, ((0, 0.035, 0.06), head), ([], 0.0, (0, 0)),
         None, ((0.006, 0.044, 0.078), 0.003, 1.0), S=1.3)


def black_swan():
    build('black_swan', 'toon:black_swan', lambda v: v.rgb if v.part == 'head' and max(v.rgb) > 0.1 else shade(lin('#1c1a1c'), v.x, v.y, v.z, 0.3, 90))


# ---------------------------------------------------------------- the realistic ones, refined

def refined(kind, horns_at=None):
    """The realistic sculpts as they were, with a little natural unevenness in the coat and,
    for the yak and the buffalo, their horns built into the model."""
    def paint(v):
        return shade(v.rgb, v.x, v.y, v.z, 0.07, 50)

    def extra(S, h):
        if horns_at:
            arc_horns(h, S, **horns_at)
    build(kind, kind, paint, head_extra=extra if horns_at else None)


def alpaca():
    refined('alpaca')


def buffalo():
    refined('buffalo', dict(R=0.1, t=0.018, arc=math.pi * 0.75, at=(0.05, 0.06, -0.04), rot=(0, 0, -0.2), col='#5a5048', flip=True))


def yak():
    refined('yak', dict(R=0.07, t=0.014, arc=math.pi * 0.6, at=(0.07, 0.06, -0.02), rot=(0, 0, 0.9), col='#e8e0cc', flip=True))


def camel():
    refined('camel')


def cow():
    refined('cow')


def dog():
    refined('dog')


def donkey():
    refined('donkey')


def gobbler():
    refined('gobbler')


def horse():
    refined('horse')


def ostrich():
    refined('ostrich')


def peacock():
    refined('peacock')


def quail():
    refined('quail')


def rabbit():
    refined('rabbit')


def sheep():
    refined('sheep')


# ---------------------------------------------------------------- ducks (real_duck)

def duck_region(v):
    if v.part == 'head' and v.lz > 0.055 and not dark(v.rgb) and v.rgb[0] > 0.2:
        return 'bill'
    return 'plumage'


def anatine(kind, plumage, bill, S=1.0):
    bill_c = lin(bill)

    def paint(v):
        return bill_c if duck_region(v) == 'bill' else plumage(v)
    build(kind, 'duck', paint, S=S)


def pekin_duck():
    anatine('pekin_duck', solid('#f7f2e4', 0.03), '#f0a23a')


def call_duck():
    anatine('call_duck', solid('#f8f5ee', 0.03), '#f2b04a', S=0.78)


def khaki_campbell():
    khaki, bronze = lin('#a8875a'), lin('#4c5236')

    def plumage(v):
        return shade(bronze, v.x, v.y, v.z, 0.1) if v.part == 'head' else shade(khaki, v.x, v.y, v.z, 0.08, 60)
    anatine('khaki_campbell', plumage, '#4e5a36')


MODELS = {f'animal_{k}': fn for k, fn in {
    'angus_cow': angus_cow, 'belted_galloway': belted_galloway, 'dexter': dexter, 'charolais': charolais,
    'brown_swiss': brown_swiss, 'hereford': hereford, 'guernsey': guernsey, 'jersey_cow': jersey_cow,
    'texas_longhorn': texas_longhorn, 'watusi': watusi, 'zebu': zebu, 'highland_cow': highland_cow,
    'appaloosa': appaloosa, 'clydesdale': clydesdale, 'friesian': friesian, 'palomino': palomino, 'pony': pony, 'mule': mule,
    'dorper': dorper, 'black_sheep': black_sheep, 'karakul': karakul, 'merino_sheep': merino_sheep,
    'suffolk_sheep': suffolk_sheep, 'valais_blacknose': valais_blacknose, 'shetland_sheep': shetland_sheep, 'jacob_sheep': jacob_sheep,
    'goat': goat, 'alpine_goat': alpine_goat, 'boer_goat': boer_goat, 'angora_goat': angora_goat, 'cashmere_goat': cashmere_goat,
    'saanen_goat': saanen_goat, 'nubian_goat': nubian_goat, 'pygmy_goat': pygmy_goat,
    'llama': llama, 'vicuna': vicuna, 'bactrian_camel': bactrian_camel,
    'moose': moose, 'elk': elk, 'reindeer': reindeer, 'spotted_deer': spotted_deer,
    'goose': goose, 'emden_goose': emden_goose, 'toulouse_goose': toulouse_goose, 'golden_goose': golden_goose,
    'indian_runner': indian_runner, 'swan': swan,
    'chicken': chicken, 'rhode_island_red': rhode_island_red, 'leghorn': leghorn, 'marans': marans, 'orpington': orpington,
    'polish_chicken': polish_chicken, 'silkie_chicken': silkie_chicken, 'wyandotte': wyandotte, 'brahma_chicken': brahma_chicken,
    'ayam_cemani': ayam_cemani, 'guinea_fowl': guinea_fowl, 'pheasant': pheasant,
    'flamingo': flamingo, 'crane': crane, 'grey_heron': grey_heron, 'emu': emu, 'rhea': rhea, 'cassowary': cassowary,
    'angora_rabbit': angora_rabbit, 'dutch_rabbit': dutch_rabbit, 'lop_rabbit': lop_rabbit,
    'muscovy_duck': muscovy_duck, 'mandarin_duck': mandarin_duck, 'bronze_turkey': bronze_turkey,
    'bison': bison, 'musk_ox': musk_ox,
    'cat': cat, 'squirrel': squirrel, 'beaver': beaver, 'chinchilla': chinchilla, 'kiwi_bird': kiwi_bird, 'parrot': parrot,
    'silkworm': silkworm, 'black_swan': black_swan,
   
   
    'pekin_duck': pekin_duck, 'call_duck': call_duck, 'khaki_campbell': khaki_campbell,
}.items()}

if __name__ == '__main__':
    main(MODELS)
