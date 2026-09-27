# Farm animals, sculpted from metaballs (soft blended shapes, like clay) and painted by region:
# coat patches, pink muzzles, dark hooves. Each animal is exported as a body plus parts the game
# animates: `head` (pivot at the neck), `leg0..3` (pivots at the hips, in the order the game
# swings them) and `tail`. The pivots and proportions follow the game's cartoon sculpts
# (src/game/gfx/toon.ts), so the game's googly eyes, collar bell and walk cycle fit as before.
# Coordinates below are the game's: x right, y up, z toward the animal's nose.
# Run: python3 tools/blender/animals.py [names...]   (see kit.main)
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import mathutils  # noqa: E402
from kit import anim_group, ball, cyl, finish, main, pm, uid  # noqa: E402

K = 1.75   # metaball radius per unit of visible radius (threshold 0.6, stiffness 2)


def B(x, y, z):
    """Game coords to Blender (animal nose toward -Y, the model front)."""
    return (x, -z, y)


class Blob:
    """Soft blended shapes (metaballs) turned into one mesh, painted face by face."""

    def __init__(self, res=0.009):
        self.mb = bpy.data.metaballs.new(uid('mb'))
        self.mb.resolution = res
        self.mb.render_resolution = res
        self.mb.threshold = 0.6

    def ball(self, c, r, neg=False):
        e = self.mb.elements.new()
        e.co = B(*c)
        e.radius = r * K
        e.use_negative = neg
        return self

    def ell(self, c, rx, ry, rz, neg=False):
        m = max(rx, ry, rz)
        e = self.mb.elements.new()
        e.type = 'ELLIPSOID'
        e.co = B(*c)
        e.radius = m * K
        # Blender axes: x, y (= -game z), z (= game y)
        e.size_x, e.size_y, e.size_z = rx / m, rz / m, ry / m
        e.use_negative = neg
        return self

    def cap(self, a, b, r0, r1=None):
        r1 = r0 if r1 is None else r1
        ln = math.dist(a, b)
        n = max(2, int(ln / (min(r0, r1) * 0.5)) + 1)
        for i in range(n):
            t = i / (n - 1)
            self.ball(tuple(a[k] + (b[k] - a[k]) * t for k in range(3)), r0 + (r1 - r0) * t)
        return self

    def build(self, paint, target=1200):
        """Mesh it, cut it down to about `target` faces and paint each face with paint(x, y, z)."""
        ob = bpy.data.objects.new(uid('mbo'), self.mb)
        bpy.context.collection.objects.link(ob)
        bpy.ops.object.select_all(action='DESELECT')
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        bpy.ops.object.convert(target='MESH')
        o = bpy.context.active_object
        n = len(o.data.polygons)
        if n > target:
            d = o.modifiers.new('dec', 'DECIMATE')
            d.ratio = target / n
            bpy.ops.object.modifier_apply(modifier='dec')
        mats = {}
        for p in o.data.polygons:
            c = p.center
            m = paint(c.x, c.z, -c.y) if callable(paint) else paint
            if m.name not in mats:
                mats[m.name] = len(mats)
                o.data.materials.append(m)
            p.material_index = mats[m.name]
            p.use_smooth = True
        return o


def noise(x, y, z, f):
    return mathutils.noise.noise((x * f + 3.1, y * f + 1.7, z * f + 5.3))


def patches(spot, base, th=0.2, f=11, seed=0.0):
    def paint(x, y, z):
        v = noise(x + seed, y, z, f) * 0.8 + noise(x + 8 + seed, y, z, f * 2.2) * 0.2
        return spot if v > th else base
    return paint


def leg4(hips, leg_len, make):
    """Four legs in the game's order, each its own animated part pivoting at the hip."""
    for i, (x, z) in enumerate(hips):
        with anim_group(f'leg{i}', B(x, leg_len, z)):
            make(x, leg_len, z)


def hoof_leg(th, leg_len, coat, hoof, sock=None, sock_h=0.0):
    def make(x, y0, z):
        blob = Blob(0.006)
        blob.cap((x, y0 + 0.02, z), (x, 0.035, z + 0.004), th * 0.62, th * 0.5)
        paint = (lambda px, py, pz: sock if py < sock_h else coat) if sock else coat
        blob.build(paint, 420)
        h = Blob(0.005)
        h.ell((x, 0.02, z + 0.006), th * 0.6, 0.024, th * 0.66)
        h.ell((x, 0.012, z + th * 0.62), 0.004, 0.02, 0.012, neg=True)
        h.build(hoof, 120)
    return make


# ---------------------------------------------------------------- cow

def cow():
    white, black = pm('cow_white', '#fbf8f0', '#fffdf8', scale=30), pm('cow_black', '#26241f', '#34302a', scale=30)
    pink, pink_d = pm('cow_pink', '#f2a4b4'), pm('cow_pink_d', '#d8788c')
    cream, hoof = pm('horn', '#efe0b8', '#f8ecc8', scale=30), pm('hoof', '#4a3a30')
    coat = patches(black, white, th=0.22, f=9)
    b = Blob(0.01)
    b.ell((0, 0.3, -0.01), 0.15, 0.135, 0.2).ball((0, 0.31, 0.1), 0.13).ball((0, 0.31, -0.12), 0.13)
    b.cap((0, 0.33, 0.14), (0, 0.39, 0.21), 0.09, 0.08)
    b.ball((0, 0.4, -0.2), 0.05)       # hip bones under the tail
    body = b.build(coat, 1500)
    u = Blob(0.006)
    u.ell((0, 0.2, -0.1), 0.062, 0.042, 0.056)
    for x, z in ((0.022, -0.085), (-0.022, -0.085), (0.022, -0.12), (-0.022, -0.12)):
        u.cap((x, 0.19, z), (x, 0.148, z), 0.011, 0.009)
    u.build(pink, 300)
    hx, hy, hz = 0, 0.42, 0.24
    with anim_group('head', B(hx, hy, hz)):
        o = lambda x, y, z: (hx + x, hy + y, hz + z)  # noqa: E731
        h = Blob(0.006)
        h.ball(o(0, 0.03, 0), 0.1).ell(o(0, -0.02, 0.06), 0.088, 0.075, 0.07)
        blaze = patches(black, white, th=0.18, f=12, seed=3)
        h.build(lambda x, y, z: white if (z - hz > 0.02 and abs(x) < 0.05 + (y - hy) * 0.2) else blaze(x, y, z), 900)
        mz = Blob(0.005)
        mz.ell(o(0, -0.05, 0.12), 0.09, 0.062, 0.058)
        for sx in (-1, 1):
            mz.ell(o(sx * 0.035, -0.04, 0.178), 0.014, 0.018, 0.016, neg=True)
        mz.build(lambda x, y, z: pink_d if z - hz > 0.168 and abs(x) > 0.02 else pink, 500)
        t = Blob(0.005)
        for sx, dz in ((0, 0.01), (0.02, 0.03), (-0.02, 0.03)):
            t.ball(o(sx, 0.125 + (0.005 if sx else 0), dz), 0.026 if sx == 0 else 0.02)
        t.build(black, 200)
        for sx in (-1, 1):
            e = Blob(0.005)
            e.ell(o(sx * 0.12, 0.04, -0.01), 0.055, 0.022, 0.032)
            e.build(black, 150)
            ei = Blob(0.004)
            ei.ell(o(sx * 0.127, 0.04, 0.006), 0.034, 0.012, 0.018)
            ei.build(pink, 80)
            hr = Blob(0.004)
            hr.cap(o(sx * 0.05, 0.11, -0.01), o(sx * 0.075, 0.145, -0.02), 0.018, 0.013).cap(o(sx * 0.075, 0.145, -0.02), o(sx * 0.08, 0.168, -0.01), 0.013, 0.009)
            hr.build(cream, 150)
    with anim_group('tail', B(0, 0.38, -0.21)):
        tl = Blob(0.004)
        tl.cap((0, 0.38, -0.21), (0, 0.21, -0.2), 0.013, 0.01)
        tl.build(white, 120)
        tf = Blob(0.004)
        tf.ell((0, 0.19, -0.198), 0.024, 0.034, 0.024)
        tf.build(black, 120)
    leg4([(-0.085, 0.12), (0.085, 0.12), (-0.085, -0.12), (0.085, -0.12)], 0.17, hoof_leg(0.075, 0.17, white, hoof))
    finish('animal_cow', tex=512, vivid=1.1, ao_min=0.6, ao_dist=0.12)


# ---------------------------------------------------------------- sheep

def sheep():
    wool = pm('wool', '#f2ebdd', '#fffcf4', scale=60)
    face, face_l = pm('sheep_face', '#3b322d', '#463c36', scale=30), pm('sheep_nose', '#54483f')
    pink, hoof = pm('sheep_pink', '#e89aa8'), pm('sheep_hoof', '#1f1a17')
    b = Blob(0.008)
    b.ell((0, 0.26, 0), 0.115, 0.095, 0.145)
    b.build(wool, 900)
    # the fleece: a coat of separate round puffs over the body, so it reads as curly wool
    ga = math.pi * (3 - math.sqrt(5))
    for i in range(52):
        y = 1 - 2 * (i + 0.5) / 52
        if y < -0.75:
            continue
        rad = math.sqrt(1 - y * y)
        a = ga * i + 1.3
        s = 0.046 * (0.85 + 0.3 * ((math.sin(i * 12.9898) * 43758.5453) % 1))
        p = (math.cos(a) * rad * 0.115, 0.26 + y * 0.095, math.sin(a) * rad * 0.145)
        ball(uid('puff'), s, B(*p), wool, segs=12)
    ball(uid('puff'), 0.035, B(0, 0.29, -0.17), wool, segs=12)
    hx, hy, hz = 0, 0.3, 0.19
    with anim_group('head', B(hx, hy, hz)):
        o = lambda x, y, z: (hx + x, hy + y, hz + z)  # noqa: E731
        h = Blob(0.005)
        h.ball(o(0, 0, 0), 0.068).ell(o(0, -0.02, 0.05), 0.05, 0.045, 0.05)
        h.ell(o(-0.014, -0.05, 0.097), 0.006, 0.005, 0.006, neg=True).ell(o(0.014, -0.05, 0.097), 0.006, 0.005, 0.006, neg=True)
        h.build(lambda x, y, z: face_l if z - hz > 0.075 else face, 700)
        for sx in (-1, 1):
            e = Blob(0.004)
            e.ell(o(sx * 0.085, 0.005, -0.01), 0.045, 0.016, 0.024)
            e.build(face, 100)
            ei = Blob(0.004)
            ei.ell(o(sx * 0.09, 0.005, 0.003), 0.028, 0.008, 0.013)
            ei.build(pink, 60)
        for i in range(11):
            y = 1 - 2 * (i + 0.5) / 11
            if y < -0.2:
                continue
            rad = math.sqrt(1 - y * y)
            a = ga * i + 2.1
            ball(uid('tuft'), 0.026, B(*o(math.cos(a) * rad * 0.05, 0.05 + y * 0.03, -0.01 + math.sin(a) * rad * 0.045)), wool, segs=10)
    leg4([(-0.06, 0.09), (0.06, 0.09), (-0.06, -0.09), (0.06, -0.09)], 0.13, hoof_leg(0.05, 0.13, face, hoof))
    finish('animal_sheep', tex=512, vivid=1.1, ao_min=0.6, ao_dist=0.12)


# ---------------------------------------------------------------- horse

def horse():
    coat = pm('horse_coat', '#a4602a', '#b8703a', scale=40)
    belly = pm('horse_belly', '#8e4f20', '#a05e2c', scale=40)
    mane = pm('mane', '#3b2415', '#4a2e1c', scale=60, kind='wave', stretch=(1, 1, 6))
    blaze, sock = pm('blaze', '#fbf6ee'), pm('sock', '#fbf6ee', '#fffcf6', scale=30)
    muzzle, hoof = pm('horse_muzzle', '#6a3e22'), pm('horse_hoof', '#2e2018')
    b = Blob(0.01)
    b.ell((0, 0.45, 0), 0.11, 0.11, 0.2).ball((0, 0.45, 0.12), 0.11).ball((0, 0.46, -0.13), 0.11)
    b.cap((0, 0.47, 0.14), (0, 0.6, 0.22), 0.075, 0.058)
    b.build(lambda x, y, z: belly if y < 0.39 else coat, 1500)
    m = Blob(0.006)
    for i in range(9):
        t = i / 8
        m.ell((0, 0.53 + t * 0.12, 0.09 + t * 0.12), 0.022, 0.04 - t * 0.008, 0.03)
    m.build(mane, 500)
    hx, hy, hz = 0, 0.62, 0.25
    with anim_group('head', B(hx, hy, hz)):
        o = lambda x, y, z: (hx + x, hy + y, hz + z)  # noqa: E731
        h = Blob(0.006)
        h.ball(o(0, 0, 0), 0.065).cap(o(0, -0.01, 0.02), o(0, -0.04, 0.12), 0.055, 0.046)
        for sx in (-1, 1):
            h.ell(o(sx * 0.022, -0.035, 0.168), 0.009, 0.012, 0.012, neg=True)

        def paint(x, y, z):
            lz, ly = z - hz, y - hy
            if lz > 0.115:
                return muzzle
            if abs(x) < 0.016 + lz * 0.08 and lz > 0.02 and ly > -0.03:
                return blaze
            return coat
        h.build(paint, 900)
        fl = Blob(0.004)
        fl.ell(o(0, 0.06, 0.03), 0.022, 0.03, 0.022).ell(o(0, 0.045, 0.055), 0.016, 0.02, 0.016)
        fl.build(mane, 150)
        for sx in (-1, 1):
            e = Blob(0.004)
            e.cap(o(sx * 0.03, 0.05, -0.01), o(sx * 0.04, 0.12, -0.02), 0.02, 0.006)
            e.build(coat, 120)
    with anim_group('tail', B(0, 0.5, -0.25)):
        for k, dx in enumerate((-0.012, 0.0, 0.012)):
            tl = Blob(0.004)
            tl.cap((dx, 0.5, -0.25), (dx * 2, 0.4, -0.3 - k * 0.005), 0.03, 0.024).cap((dx * 2, 0.4, -0.3), (dx * 2.5, 0.28, -0.29), 0.024, 0.012)
            tl.build(mane, 200)
    leg4([(-0.065, 0.15), (0.065, 0.15), (-0.065, -0.15), (0.065, -0.15)], 0.3,
         hoof_leg(0.064, 0.3, coat, hoof, sock=sock, sock_h=0.1))
    finish('animal_horse', tex=512, vivid=1.1, ao_min=0.6, ao_dist=0.12)


# ---------------------------------------------------------------- chicken

def chicken():
    white = pm('hen_white', '#fbf7ec', '#fffdf6', scale=50)
    cream = pm('hen_cream', '#efe4cc', '#f6eed8', scale=50)
    red, beak, legc = pm('comb', '#e0302a', '#ec4a3a', scale=30), pm('beak', '#f2b632'), pm('hen_leg', '#f2a933')
    b = Blob(0.005)
    b.ell((0, 0.16, -0.01), 0.075, 0.07, 0.09).ball((0, 0.17, 0.04), 0.065)
    b.cap((0, 0.18, 0.04), (0, 0.23, 0.07), 0.042, 0.036)
    b.build(white, 1200)
    t = Blob(0.004)
    for sx in (0, 0.025, -0.025):
        t.cap((sx, 0.17, -0.07), (sx * 1.4, 0.26 - abs(sx) * 0.8, -0.115), 0.034 if sx == 0 else 0.025, 0.014)
    t.build(cream, 500)
    for sx in (-1, 1):
        w = Blob(0.004)
        w.ell((sx * 0.068, 0.165, -0.01), 0.022, 0.046, 0.066)
        for k in range(4):
            w.ell((sx * 0.07, 0.14 - k * 0.004, -0.05 - k * 0.012), 0.016, 0.02, 0.02)
        w.build(cream, 350)
    hx, hy, hz = 0, 0.24, 0.07
    with anim_group('head', B(hx, hy, hz)):
        o = lambda x, y, z: (hx + x, hy + y, hz + z)  # noqa: E731
        h = Blob(0.004)
        h.ball(o(0, 0, 0), 0.042)
        h.build(white, 500)
        c = Blob(0.003)
        c.ball(o(0, 0.045, 0.014), 0.016).ball(o(0, 0.054, -0.006), 0.019).ball(o(0, 0.046, -0.026), 0.015)
        c.ell(o(0, -0.034, 0.034), 0.011, 0.02, 0.011)
        c.build(red, 300)
        bk = Blob(0.003)
        bk.cap(o(0, -0.002, 0.035), o(0, -0.008, 0.064), 0.014, 0.004)
        bk.build(beak, 120)
    for i, x in enumerate((-0.03, 0.03)):
        with anim_group(f'leg{i}', B(x, 0.08, 0)):
            lg = Blob(0.003)
            lg.cap((x, 0.1, 0), (x, 0.006, 0.004), 0.011, 0.009)
            for a in (-0.55, 0, 0.55):
                lg.cap((x, 0.005, 0.004), (x + math.sin(a) * 0.048, 0.004, 0.004 + math.cos(a) * 0.053), 0.006, 0.004)
            lg.cap((x, 0.005, 0.004), (x, 0.004, -0.024), 0.005, 0.004)
            lg.build(legc, 200)
    finish('animal_chicken', tex=512, vivid=1.1, ao_min=0.6, ao_dist=0.08)


# ---------------------------------------------------------------- the farmer

def farmer():
    """The farmer in a red plaid shirt, blue overalls, jeans, boots and a big straw hat. Parts:
    `leg0/1` at the hips, `body` (torso), `arm0/1` at the shoulders and `head` at the neck,
    on the pivots the game's walk cycle uses."""
    import math as _m
    skin, skin_d = pm('skin', '#ffd0a6', '#ffdab4', scale=40), pm('cheek', '#f6a8a0')
    hair = pm('hair', '#6b4020', '#7a4c28', scale=60, kind='wave', stretch=(1, 1, 6))
    red, red_d, red_l = pm('plaid', '#d64541'), pm('plaid_d', '#8a2622'), pm('plaid_l', '#e8726c')
    denim = pm('denim', '#3b6fa8', '#4a7eb8', scale=60)
    jeans = pm('jeans', '#2f5d8a', '#3a6a98', scale=60)
    boot, brass = pm('boot', '#6a3e1c', '#7a4a24', scale=30), pm('button', '#f2d16b', rough=0.3, metal=0.6)
    straw = pm('straw_hat', '#efc95e', '#f6d676', scale=50, kind='wave', stretch=(1, 1, 5))
    band = pm('hat_band', '#c0392b')

    def plaid(x, y, z):
        a, b = _m.sin(x * 160) > 0.55, _m.sin(y * 160) > 0.55
        return red_d if a and b else red if a or b else red_l

    for i, x in enumerate((-0.06, 0.06)):
        with anim_group(f'leg{i}', B(x, 0.28, 0)):
            lg = Blob(0.005)
            lg.cap((x, 0.29, 0), (x, 0.05, 0.004), 0.05, 0.046)
            lg.build(jeans, 400)
            bt = Blob(0.004)
            bt.ell((x, 0.032, 0.03), 0.059, 0.043, 0.09)
            bt.build(boot, 300)
    with anim_group('body', B(0, 0, 0)):
        t = Blob(0.006)
        t.ell((0, 0.33, 0), 0.118, 0.085, 0.116).cap((0, 0.4, 0), (0, 0.52, 0), 0.112, 0.104)
        t.ell((0, 0.58, 0), 0.1, 0.05, 0.09)

        def paint(x, y, z):
            if y < 0.43:
                return denim
            if z > 0.05 and abs(x) < 0.066 and y < 0.53:
                return denim   # the bib
            if z > 0 and abs(abs(x) - 0.055) < 0.014 and y < 0.6:
                return denim   # the straps
            return plaid(x, y, z)
        t.build(paint, 1400)
        for sx in (-1, 1):
            ball(uid('btn'), 0.016, B(sx * 0.056, 0.515, 0.12), brass, segs=10)
        pk = Blob(0.003)
        pk.ell((0, 0.47, 0.115), 0.04, 0.03, 0.01)
        pk.build(pm('pocket', '#335f94'), 120)
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'arm{i}', B(sx * 0.15, 0.53, 0)):
            a = Blob(0.004)
            a.cap((sx * 0.15, 0.55, 0), (sx * 0.15, 0.39, 0), 0.05, 0.044)
            a.build(plaid, 400)
            h = Blob(0.004)
            h.ball((sx * 0.15, 0.33, 0), 0.052)
            h.build(skin, 250)
    hx, hy, hz = 0, 0.74, 0
    with anim_group('head', B(hx, hy, hz)):
        o = lambda x, y, z: (hx + x, hy + y, hz + z)  # noqa: E731
        hd = Blob(0.005)
        hd.ell(o(0, 0, 0), 0.128, 0.122, 0.12).ell(o(0, -0.07, 0.02), 0.08, 0.05, 0.08)
        hd.ell(o(0, -0.012, 0.125), 0.024, 0.022, 0.022)   # nose
        for sx in (-1, 1):
            hd.ell(o(sx * 0.125, -0.006, 0), 0.02, 0.034, 0.025)   # ears
        hd.ell(o(0, -0.058, 0.108), 0.03, 0.006, 0.02, neg=True)   # smile

        def face(x, y, z):
            lz, ly, lx = z - hz, y - hy, x - hx
            if lz > 0.07 and abs(lx) > 0.05 and -0.055 < ly < -0.01:
                return skin_d
            return skin
        hd.build(face, 1200)
        hr = Blob(0.005)
        hr.ell(o(0, 0.035, -0.022), 0.132, 0.1, 0.118).ell(o(0.035, 0.07, 0.075), 0.06, 0.028, 0.04)
        hr.ell(o(0, -0.02, -0.06), 0.1, 0.07, 0.07)
        hr.build(hair, 700)
        # big straw hat tipped back so the face shows
        tilt = _m.radians(-18)

        def rot(p):
            x, y, z = p
            return (x, y * _m.cos(tilt) - z * _m.sin(tilt), y * _m.sin(tilt) + z * _m.cos(tilt))
        hc = o(0, 0, 0)
        for (py, r, h, mat_, r2) in ((0.085, 0.235, 0.022, straw, 0.225), (0.111, 0.142, 0.032, band, None)):
            c = rot((0, py, -0.01))
            cyl(uid('hat'), r, h, B(hc[0] + c[0], hc[1] + c[1], hc[2] + c[2]), mat_, verts=32, r2=r2, rot=(tilt, 0, 0))
        c = rot((0, 0.1, -0.01))
        ball(uid('crown'), 0.14, B(hc[0] + c[0], hc[1] + c[1], hc[2] + c[2]), straw, scale=(1, 1, 0.85), segs=18)
    finish('farmer', tex=512, vivid=1.1, ao_min=0.82, ao_dist=0.05)


# ---------------------------------------------------------------- the rest, from the game's sculpts
# Every other animal starts from the game's own cartoon sculpt (shape and painted coat, dumped by
# export_sculpts.mjs into tools/blender/sculpts), which Blender smooths, trims to a light mesh and
# bakes with soft ambient occlusion into one texture, split into the same animated parts.

SCULPTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sculpts')
HAND_MADE = {'cow', 'sheep', 'horse', 'chicken'}


def vcol_mat():
    m = bpy.data.materials.get('sculpt_vcol')
    if m:
        return m
    m = bpy.data.materials.new('sculpt_vcol')
    m.use_nodes = True
    nt = m.node_tree
    attr = nt.nodes.new('ShaderNodeVertexColor')
    attr.layer_name = 'Col'
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.6
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    return m


def part_mesh(name, data, offset, target):
    """One sculpt part as a smooth mesh with its vertex colors, placed at `offset` (game coords)."""
    import bmesh
    pts, cols, idx = data['p'], data['c'], data['i']
    n = len(pts) // 3
    ox, oy, oz = offset
    me = bpy.data.meshes.new(name)
    verts = [B(pts[k * 3] + ox, pts[k * 3 + 1] + oy, pts[k * 3 + 2] + oz) for k in range(n)]
    tris = [tuple(idx[k:k + 3]) for k in range(0, len(idx), 3)] if idx else [(k, k + 1, k + 2) for k in range(0, n, 3)]
    me.from_pydata(verts, [], tris)
    lay = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    if cols:
        for k in range(n):
            # the sculpt colors are linear already (three.js vertex colors)
            lay.data[k].color = (cols[k * 3], cols[k * 3 + 1], cols[k * 3 + 2], 1.0)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0005)
    bm.to_mesh(me)
    bm.free()
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    faces = len(me.polygons)
    if faces > target:
        d = o.modifiers.new('dec', 'DECIMATE')
        d.ratio = target / faces
        bpy.ops.object.modifier_apply(modifier='dec')
    for poly in me.polygons:
        poly.use_smooth = True
    me.materials.append(vcol_mat())
    return o


def from_sculpt(kind):
    import json
    with open(os.path.join(SCULPTS, f'{kind}.json')) as f:
        d = json.load(f)
    meta = d['meta']
    part_mesh('body', d['body'], (0, 0, 0), 2200)
    hx, hy, hz = meta['headAt']
    with anim_group('head', B(hx, hy, hz)):
        part_mesh('headm', d['head'], (hx, hy, hz), 1500)
    if d['leg']:
        for i, (x, z) in enumerate(meta['legs']):
            with anim_group(f'leg{i}', B(x, meta['legLen'], z)):
                part_mesh(f'legm{i}', d['leg'], (x, meta['legLen'], z), 260)
    if d['tail']:
        tx, ty, tz = meta['tailAt']
        with anim_group('tail', B(tx, ty, tz)):
            part_mesh('tailm', d['tail'], (tx, ty, tz), 300)
    finish(f'animal_{kind}', tex=512, vivid=1.08, ao_min=0.62, ao_dist=0.1)


MODELS = {'animal_cow': cow, 'animal_sheep': sheep, 'animal_horse': horse, 'animal_chicken': chicken, 'farmer': farmer}
if os.path.isdir(SCULPTS):
    for f in sorted(os.listdir(SCULPTS)):
        k = f[:-5]
        if f.endswith('.json') and k not in HAND_MADE:
            MODELS[f'animal_{k}'] = (lambda kk=k: from_sculpt(kk))

if __name__ == '__main__':
    main(MODELS)
