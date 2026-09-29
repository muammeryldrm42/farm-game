# The farm's main animals modelled from scratch in Blender, with real anatomy: a barrel of a body
# over shoulders and hips, a neck, a head with brow, cheeks, muzzle and nostrils, ears, horns,
# and jointed legs (elbow and knee in front, stifle and hock behind, a pastern down to the hoof)
# in each animal's own proportions. Parts the game moves: `head` (at the neck), `leg0..3` (front
# left, front right, hind left, hind right, at the shoulder and hip), `tail`, and an `eye` mark.
# Built in game coordinates (y up, +z the front) from metaballs like animals.py.
# Run: python3 tools/blender/fauna.py [names...]   (see kit.main)
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from animals import B, Blob, noise  # noqa: E402
from breeds import cm, curve, eye_mark, horn_path  # noqa: E402
from kit import anim_group, finish, main, pm  # noqa: E402


class Spec:
    """An animal's proportions, in tiles at the game's scale (before the game's own scaling)."""

    def __init__(self, **kw):
        self.__dict__.update(kw)


def by(paint, part):
    return lambda x, y, z: cm(paint(part, x, y, z), scale=80)


def hoofed_leg(paint, x, z, top, front, t, hoof, hoof_h=0.03, knee=0.5, cloven=True, feather=None):
    """One leg from the shoulder or hip down to the hoof: elbow and knee in front, stifle and
    hock behind, a short sloping pastern, and the hoof (split in two for cattle, sheep and
    goats). `t` is the thickness at the top; `top` the height of the joint to the body."""
    lg = Blob(t * 0.1)
    if front:
        elbow = (x, top * 0.78, z - t * 0.3)
        kn = (x, top * knee * 0.62, z)
        fet = (x, hoof_h + 0.02, z - t * 0.1)
        lg.cap((x, top, z), elbow, t * 1.1, t * 0.9)
        lg.cap(elbow, kn, t * 0.72, t * 0.55)
        lg.ball(kn, t * 0.6)                                     # the knee joint
        lg.cap(kn, fet, t * 0.46, t * 0.44)
    else:
        stifle = (x, top * 0.72, z + t * 0.9)
        hock = (x, top * knee * 0.78, z - t * 1.3)
        fet = (x, hoof_h + 0.02, z - t * 0.6)
        lg.cap((x, top, z), stifle, t * 1.25, t * 1.0)
        lg.cap(stifle, hock, t * 0.9, t * 0.5)
        lg.ball(hock, t * 0.55)                                  # the point of the hock
        lg.cap(hock, fet, t * 0.47, t * 0.44)
    lg.ball(fet, t * 0.5)                                        # the fetlock
    toe = (x, hoof_h * 0.55, fet[2] + t * 0.45)
    lg.cap(fet, (x, hoof_h + 0.004, fet[2] + t * 0.3), t * 0.44, t * 0.42)
    lg.build(lambda px, py, pz: cm(paint('leg', px, py, pz), scale=80), 420)
    hf = Blob(t * 0.08)
    if cloven:
        for sx in (-1, 1):
            hf.ell((x + sx * t * 0.2, hoof_h * 0.5, toe[2]), t * 0.24, hoof_h * 0.55, t * 0.42)
    else:
        hf.ell((x, hoof_h * 0.5, toe[2] - t * 0.05), t * 0.5, hoof_h * 0.55, t * 0.52)
    hf.build(pm('fa_hoof' + hoof[1:], hoof, rough=0.45), 140)
    if feather:
        ff = Blob(t * 0.1)
        ff.ell((x, hoof_h + 0.03, fet[2] - t * 0.1), t * 0.7, 0.04, t * 0.75)
        ff.build(cm(feather, scale=80), 200)


def legs4(paint, s, hoof, cloven=True, feather=None):
    for i, (x, z) in enumerate(s.hips):
        front = z > 0
        top = s.leg_top_f if front else s.leg_top_h
        with anim_group(f'leg{i}', B(x, top, z)):
            hoofed_leg(paint, x, z, top, front, s.leg_t, hoof, s.hoof_h, cloven=cloven, feather=feather)


def horns_pair(pts_of, r0, r1, base, tip, faces=320):
    for sx in (-1, 1):
        horn_path(pts_of(sx), r0, r1, pm('fa_horn' + base[1:], base, rough=0.4), pm('fa_htip' + tip[1:], tip, rough=0.4), faces=faces)


# ---------------------------------------------------------------- cattle

def cow():
    """A Holstein Friesian dairy cow: a long, deep, angular body, a straight back, hip bones
    standing out at the rump, a big udder, a long head with a broad pink muzzle, short curved
    horns, and ears held out sideways. Black patches on white."""
    s = Spec(hips=[(-0.078, 0.17), (0.078, 0.17), (-0.078, -0.17), (0.078, -0.17)], leg_top_f=0.25, leg_top_h=0.27,
             leg_t=0.035, hoof_h=0.028)

    def paint(part, x, y, z):
        if part in ('udder', 'muzzle', 'ear_in'):
            return {'udder': '#f0b0b4', 'muzzle': '#eeaab0', 'ear_in': '#e8a4a8'}[part]
        if part == 'leg' and y < 0.12:
            return '#f8f6f0'                                     # white stockings
        if part == 'switch':
            return '#f8f6f0'
        n = noise(x * 1.1 + 4.2, y * 1.3, z, 7) + noise(x, y, z, 22) * 0.25
        return '#1c1a18' if n > 0.12 else '#f8f6f0'
    b = Blob(0.006)
    # the long barrel, deep through the chest and belly
    b.ell((0, 0.37, 0.0), 0.12, 0.11, 0.24)
    b.ell((0, 0.33, 0.02), 0.115, 0.1, 0.2)                      # the belly
    b.ell((0, 0.38, 0.17), 0.1, 0.105, 0.09)                     # the chest and shoulders
    b.ell((0, 0.4, -0.17), 0.105, 0.095, 0.09)                   # the hindquarters
    for sx in (-1, 1):
        b.ball((sx * 0.085, 0.45, -0.17), 0.04)                  # the hip bones (hooks)
        b.ball((sx * 0.05, 0.44, -0.25), 0.03)                   # the pin bones
    b.cap((0, 0.47, 0.18), (0, 0.47, -0.2), 0.035, 0.035)        # the straight back
    # the neck, with a loose dewlap under it
    b.cap((0, 0.43, 0.2), (0, 0.46, 0.3), 0.075, 0.06)
    b.ell((0, 0.34, 0.26), 0.035, 0.07, 0.05)
    b.build(by(paint, 'body'), 7500)
    u = Blob(0.004)
    u.ell((0, 0.255, -0.13), 0.07, 0.05, 0.075)
    for x, z in ((0.03, -0.1), (-0.03, -0.1), (0.03, -0.16), (-0.03, -0.16)):
        u.cap((x, 0.23, z), (x, 0.195, z), 0.011, 0.009)         # the teats
    u.build(by(paint, 'udder'), 500)
    hx, hy, hz = 0, 0.47, 0.3
    with anim_group('head', B(hx, hy, hz)):
        h = Blob(0.004)
        h.ball((0, 0.5, 0.32), 0.058)                            # the poll and brow
        h.cap((0, 0.49, 0.35), (0, 0.42, 0.45), 0.052, 0.044)    # the long face, down at an angle
        h.ell((0, 0.4, 0.46), 0.05, 0.042, 0.04)                 # the broad muzzle
        h.ell((0, 0.43, 0.39), 0.042, 0.035, 0.05)               # the jaw
        for sx in (-1, 1):
            h.ball((sx * 0.04, 0.49, 0.36), 0.022)               # the eye sockets
            h.ell((sx * 0.02, 0.4, 0.49), 0.01, 0.009, 0.009, neg=True)   # the nostrils

        def head(x, y, z):
            if z > 0.425 and y < 0.44:
                return cm('#eeaab0', scale=80)                  # the pink muzzle
            if abs(x) < 0.03 and z > 0.31:
                return cm('#f8f6f0', scale=80)                  # the white blaze
            return by(paint, 'head')(x, y, z)
        h.build(head, 2000)
        for sx in (-1, 1):
            e = Blob(0.0025)
            e.cap((sx * 0.05, 0.5, 0.31), (sx * 0.115, 0.49, 0.3), 0.022, 0.018)
            e.ell((sx * 0.1, 0.49, 0.3), 0.026, 0.012, 0.024)
            e.build(lambda x, y, z: cm('#e8a4a8') if (z > 0.3 and abs(x) > 0.07 and y < 0.492) else by(paint, 'head')(x, y, z), 300)
        horns_pair(lambda sx: curve((sx * 0.03, 0.535, 0.31), (sx * 0.07, 0.56, 0.3), (sx * 0.07, 0.585, 0.33), 6),
                   0.012, 0.004, '#ece2c8', '#4a3e34', faces=180)
    eye_mark((0.048, 0.49, 0.37), 0.0135, 0.85)
    with anim_group('tail', B(0, 0.47, -0.27)):
        t = Blob(0.003)
        t.cap((0, 0.47, -0.27), (0, 0.4, -0.29), 0.016, 0.01)
        t.cap((0, 0.4, -0.29), (0, 0.21, -0.29), 0.01, 0.008)
        t.build(by(paint, 'body'), 200)
        sw = Blob(0.003)
        sw.ell((0, 0.19, -0.288), 0.02, 0.04, 0.02)              # the switch
        sw.build(by(paint, 'switch'), 120)
    legs4(paint, s, '#2e2622')
    finish('animal_cow', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.12)


def paw_leg(paint, x, z, top, front, t, pad='#2a2420'):
    """A dog's leg: elbow or stifle and hock, a slim lower leg and a round paw with toes."""
    lg = Blob(t * 0.1)
    if front:
        elbow = (x, top * 0.72, z - t * 0.2)
        wrist = (x, 0.035, z + t * 0.1)
        lg.cap((x, top, z), elbow, t * 1.1, t * 0.8)
        lg.cap(elbow, wrist, t * 0.62, t * 0.5)
    else:
        stifle = (x, top * 0.7, z + t * 0.8)
        hock = (x, top * 0.36, z - t * 1.2)
        wrist = (x, 0.035, z - t * 0.6)
        lg.cap((x, top, z), stifle, t * 1.3, t * 0.95)
        lg.cap(stifle, hock, t * 0.8, t * 0.5)
        lg.cap(hock, wrist, t * 0.5, t * 0.48)
    paw = (x, t * 0.55, wrist[2] + t * 0.5)
    lg.cap(wrist, paw, t * 0.5, t * 0.62)
    lg.ell((x, t * 0.5, paw[2] + t * 0.1), t * 0.7, t * 0.5, t * 0.85)
    lg.build(lambda px, py, pz: cm(paint('leg', px, py, pz), scale=80), 420)


# ---------------------------------------------------------------- horse and donkey

def equid(kind, paint, S=1.0, donkey=False, hoof='#2a221c'):
    """A horse (or a donkey): a deep chest and rounded hindquarters on long clean legs, an arched
    neck with its mane, a long head with a flat face, big nostrils and a soft muzzle, small
    pricked ears (long ones on the donkey), and a long hair tail (a tufted one on the donkey)."""
    def P(*p):
        return tuple(c * S for c in p)

    def R(r):
        return r * S
    b = Blob(0.006 * S)
    b.ell(P(0, 0.5, 0.0), R(0.1), R(0.098), R(0.2))
    b.ball(P(0, 0.5, 0.15), R(0.1))                              # the chest
    b.ball(P(0, 0.52, -0.14), R(0.106))                          # the round hindquarters
    b.cap(P(0, 0.59, 0.14), P(0, 0.57, 0.03), R(0.05), R(0.05))  # the withers
    b.ell(P(0, 0.44, 0.0), R(0.085), R(0.06), R(0.15))           # the belly
    nt = (0, 0.72, 0.3) if not donkey else (0, 0.68, 0.29)
    b.cap(P(0, 0.54, 0.17), P(*nt), R(0.075), R(0.046))          # the neck, arched up and forward
    b.build(lambda x, y, z: cm(paint('body', x / S, y / S, z / S), scale=80), 4200)
    # the mane along the crest of the neck (short and upright on the donkey)
    m = Blob(0.003 * S)
    for k in range(10):
        u = k / 9
        c = (0, 0.6 + (nt[1] - 0.6) * u + 0.035, 0.16 + (nt[2] - 0.16) * u - 0.01)
        if donkey:
            m.ell(P(*c), R(0.012), R(0.03), R(0.022))
        else:
            m.ell(P(c[0], c[1] - 0.005, c[2]), R(0.014), R(0.045), R(0.025))
            m.ell(P(0.022, c[1] - 0.04, c[2] - 0.005), R(0.008), R(0.04), R(0.022))   # falling to one side
    m.build(lambda x, y, z: cm(paint('mane', x / S, y / S, z / S), scale=80), 800)
    hx, hy, hz = nt
    with anim_group('head', B(*P(hx, hy, hz))):
        h = Blob(0.0035 * S)
        h.ball(P(0, hy + 0.01, hz + 0.01), R(0.046))            # the poll and forehead
        h.cap(P(0, hy, hz + 0.03), P(0, hy - 0.1, hz + 0.13), R(0.043), R(0.03))    # the long flat face
        h.ell(P(0, hy - 0.115, hz + 0.14), R(0.031), R(0.033), R(0.03))            # the muzzle
        h.ell(P(0, hy - 0.05, hz + 0.05), R(0.038), R(0.04), R(0.045))             # the cheeks and jaw
        for sx in (-1, 1):
            h.ell(P(sx * 0.016, hy - 0.11, hz + 0.168), R(0.009), R(0.011), R(0.008), neg=True)   # nostrils
            h.ball(P(sx * 0.035, hy + 0.0, hz + 0.045), R(0.016))                 # the eye bones

        def head(x, y, z):
            lx, ly, lz = x / S, y / S - hy, z / S - hz
            if lz > 0.125:
                return cm(paint('muzzle', x / S, y / S, z / S), scale=80)
            if abs(lx) < 0.012 + lz * 0.05 and 0.02 < lz and ly > -0.08:
                return cm(paint('blaze', x / S, y / S, z / S), scale=80)
            return cm(paint('head', x / S, y / S, z / S), scale=80)
        h.build(head, 2400)
        for sx in (-1, 1):
            e = Blob(0.002 * S)
            if donkey:
                e.cap(P(sx * 0.025, hy + 0.04, hz + 0.0), P(sx * 0.055, hy + 0.15, hz - 0.03), R(0.018), R(0.009))
            else:
                e.cap(P(sx * 0.024, hy + 0.045, hz + 0.0), P(sx * 0.03, hy + 0.1, hz - 0.01), R(0.014), R(0.003))
            e.build(lambda x, y, z: cm(paint('ear', x / S, y / S, z / S), scale=80), 200)
        if not donkey:
            f = Blob(0.002 * S)
            f.ell(P(0, hy + 0.05, hz + 0.04), R(0.016), R(0.03), R(0.02))              # the forelock
            f.build(lambda x, y, z: cm(paint('mane', x / S, y / S, z / S), scale=80), 150)
    eye_mark(P(0.037, hy + 0.005, hz + 0.055), R(0.012), 0.9)
    with anim_group('tail', B(*P(0, 0.58, -0.25))):
        t = Blob(0.003 * S)
        if donkey:
            t.cap(P(0, 0.58, -0.25), P(0, 0.38, -0.28), R(0.012), R(0.008))
            t.ell(P(0, 0.34, -0.28), R(0.02), R(0.05), R(0.02))
        else:
            t.cap(P(0, 0.58, -0.25), P(0, 0.52, -0.29), R(0.03), R(0.03))
            for k, dx in enumerate((-0.012, 0.0, 0.012)):
                t.cap(P(dx, 0.52, -0.29), P(dx * 2, 0.3, -0.3 - k * 0.004), R(0.03), R(0.014))
        t.build(lambda x, y, z: cm(paint('tail', x / S, y / S, z / S), scale=80), 500)
    s = Spec(hips=[(-0.064 * S, 0.155 * S), (0.064 * S, 0.155 * S), (-0.064 * S, -0.155 * S), (0.064 * S, -0.155 * S)],
             leg_top_f=0.44 * S, leg_top_h=0.46 * S, leg_t=0.034 * S, hoof_h=0.03 * S)
    legs4(lambda part, x, y, z: paint(part, x / S, y / S, z / S), s, hoof, cloven=False)
    finish(f'animal_{kind}', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.12)


def horse():
    def paint(part, x, y, z):
        # a bay: a red-brown coat with black mane, tail and lower legs, a white blaze and socks
        if part in ('mane', 'tail'):
            return '#1c1614'
        if part == 'blaze':
            return '#f6f2ea'
        if part == 'muzzle':
            return '#3a2a22'
        if part == 'leg':
            return '#f6f2ea' if y < 0.09 and x > 0 else ('#1e1612' if y < 0.24 else '#8a4622')
        return '#8a4622' if noise(x, y, z, 30) < 0.35 else '#8e4a26'
    equid('horse', paint)


def donkey():
    def paint(part, x, y, z):
        if part == 'muzzle' or (part == 'body' and y < 0.42):
            return '#e6e0d6'                                     # the mealy muzzle and pale belly
        if part in ('mane', 'tail'):
            return '#2a2624'
        if part == 'ear':
            return '#2a2624' if y > 0.8 else '#8a8480'
        if part == 'body' and abs(x) < 0.012 and y > 0.55:
            return '#3a3634'                                     # the dark stripe down the back
        if part == 'leg' and y < 0.06:
            return '#3a3634'
        return '#8a8480' if noise(x, y, z, 30) < 0.35 else '#8e8884'
    equid('donkey', paint, S=0.8, donkey=True)


# ---------------------------------------------------------------- sheep

def sheep():
    """A Suffolk ewe: a deep, square body in a thick fleece of tight curls, a bare black face and
    ears, black legs."""
    wool = '#f1ebdd'

    def paint(part, x, y, z):
        if part in ('head', 'leg', 'ear'):
            return '#221e1c'
        if part == 'nose':
            return '#3a3230'
        return wool
    b = Blob(0.006)
    b.ell((0, 0.28, 0.0), 0.12, 0.105, 0.16)
    b.ell((0, 0.25, 0.0), 0.11, 0.09, 0.15)
    b.cap((0, 0.3, 0.12), (0, 0.33, 0.18), 0.07, 0.055)          # the neck, all fleece
    b.build(cm(wool, scale=120), 2500)
    # the fleece: a coat of close curls all over
    f = Blob(0.004)
    ga = math.pi * (3 - math.sqrt(5))
    for i in range(170):
        yv = 1 - 2 * (i + 0.5) / 170
        if yv < -0.6:
            continue
        rad = math.sqrt(1 - yv * yv)
        a = ga * i
        f.ball((math.cos(a) * rad * 0.118, 0.28 + yv * 0.104, math.sin(a) * rad * 0.158), 0.03 + 0.006 * math.sin(i * 1.3))
    f.build(pm('sh_curls', wool, '#fffaf0', scale=140), 3200)
    hx, hy, hz = 0, 0.34, 0.19
    with anim_group('head', B(hx, hy, hz)):
        h = Blob(0.003)
        h.ball((0, 0.35, 0.21), 0.04)
        h.cap((0, 0.345, 0.225), (0, 0.3, 0.29), 0.036, 0.024)  # the long Roman nosed face
        h.ell((0, 0.29, 0.295), 0.022, 0.022, 0.02)
        for sx in (-1, 1):
            h.ell((sx * 0.01, 0.293, 0.312), 0.005, 0.006, 0.005, neg=True)
        h.build(by(paint, 'head'), 1200)
        tk = Blob(0.003)
        tk.ell((0, 0.385, 0.2), 0.04, 0.022, 0.035)              # the wool on the poll
        tk.build(pm('sh_top', wool, '#fffaf0', scale=140), 300)
        for sx in (-1, 1):
            e = Blob(0.002)
            e.cap((sx * 0.035, 0.365, 0.2), (sx * 0.085, 0.355, 0.19), 0.013, 0.01)   # ears out sideways
            e.build(by(paint, 'ear'), 150)
    eye_mark((0.028, 0.36, 0.235), 0.009, 0.85)
    with anim_group('tail', B(0, 0.32, -0.16)):
        t = Blob(0.003)
        t.cap((0, 0.32, -0.16), (0, 0.24, -0.18), 0.022, 0.016)
        t.build(pm('sh_tail', wool, '#fffaf0', scale=140), 150)
    s = Spec(hips=[(-0.055, 0.1), (0.055, 0.1), (-0.055, -0.1), (0.055, -0.1)], leg_top_f=0.2, leg_top_h=0.21, leg_t=0.021,
             hoof_h=0.02)
    legs4(paint, s, '#1a1614')
    finish('animal_sheep', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.1)


# ---------------------------------------------------------------- the farm dog

def dog():
    """The farm's dog, a tricolour hound: a deep chest and tucked up belly, a long muzzle below a
    clear stop, long soft ears hanging by the cheeks, a tail carried up, on neat paws."""
    def paint(part, x, y, z):
        if part == 'ear':
            return '#7a4222'
        if part == 'leg':
            return '#f4efe6' if y < 0.08 else '#b06a34'
        if part == 'tail':
            return '#f4efe6' if y > 0.26 else '#2a2220'
        if part == 'head':
            if z > 0.2 or abs(x) < 0.01:
                return '#f4efe6'                                 # the white muzzle and blaze
            return '#b06a34'
        if part == 'body':
            if y < 0.16 or z > 0.1:
                return '#f4efe6'                                 # white chest and belly
            if y > 0.2 and -0.08 < z < 0.07:
                return '#2a2220'                                 # the black saddle
        return '#b06a34'
    b = Blob(0.004)
    b.ell((0, 0.2, 0.0), 0.05, 0.055, 0.1)
    b.ball((0, 0.2, 0.07), 0.058)                                # the deep chest
    b.ball((0, 0.21, -0.07), 0.05)
    b.ell((0, 0.17, -0.02), 0.04, 0.03, 0.06)                    # the tucked belly
    b.cap((0, 0.22, 0.09), (0, 0.27, 0.13), 0.04, 0.032)         # the neck
    b.build(by(paint, 'body'), 2600)
    hx, hy, hz = 0, 0.27, 0.13
    with anim_group('head', B(hx, hy, hz)):
        h = Blob(0.0025)
        h.ball((0, 0.285, 0.145), 0.036)                         # the skull
        h.cap((0, 0.275, 0.17), (0, 0.262, 0.22), 0.024, 0.019)  # the muzzle below the stop
        h.ell((0, 0.255, 0.2), 0.02, 0.014, 0.025)               # the lower jaw
        h.build(by(paint, 'head'), 1400)
        n = Blob(0.0015)
        n.ell((0, 0.272, 0.236), 0.011, 0.009, 0.008)
        n.build(pm('dg_nose', '#141010', rough=0.25), 80)
        for sx in (-1, 1):
            e = Blob(0.002)
            for k in range(6):
                u = k / 5
                e.ell((sx * (0.033 + u * 0.006), 0.29 - u * 0.05, 0.14 + u * 0.01), 0.006, 0.014, 0.018 - u * 0.004)
            e.build(by(paint, 'ear'), 220)
    eye_mark((0.021, 0.292, 0.17), 0.008, 0.6)
    with anim_group('tail', B(0, 0.24, -0.11)):
        t = Blob(0.002)
        t.cap((0, 0.24, -0.11), (0, 0.29, -0.15), 0.011, 0.008)
        t.cap((0, 0.29, -0.15), (0, 0.33, -0.15), 0.008, 0.005)
        t.build(by(paint, 'tail'), 200)
    for i, (x, z) in enumerate([(-0.035, 0.075), (0.035, 0.075), (-0.037, -0.075), (0.037, -0.075)]):
        top = 0.17
        with anim_group(f'leg{i}', B(x, top, z)):
            paw_leg(paint, x, z, top, z > 0, 0.016)
    finish('animal_dog', tex=1024, vivid=1.06, ao_min=0.62, ao_dist=0.08)


# ---------------------------------------------------------------- camel, alpaca, yak, buffalo

def pad_leg(paint, x, z, top, front, t, knee=0.55):
    """A camelid's long leg down to a broad, soft two toed pad."""
    lg = Blob(t * 0.1)
    if front:
        elbow = (x, top * 0.8, z - t * 0.2)
        kn = (x, top * knee * 0.7, z)
        fet = (x, 0.05, z)
        lg.cap((x, top, z), elbow, t * 1.2, t * 0.85)
        lg.cap(elbow, kn, t * 0.72, t * 0.55)
        lg.ball(kn, t * 0.62)                                    # the knee callus
        lg.cap(kn, fet, t * 0.48, t * 0.45)
    else:
        stifle = (x, top * 0.68, z + t * 0.6)
        hock = (x, top * knee * 0.7, z - t * 1.2)
        fet = (x, 0.05, z - t * 0.4)
        lg.cap((x, top, z), stifle, t * 1.3, t * 0.95)
        lg.cap(stifle, hock, t * 0.8, t * 0.5)
        lg.ball(hock, t * 0.52)
        lg.cap(hock, fet, t * 0.48, t * 0.45)
    lg.cap(fet, (x, 0.018, fet[2] + t * 0.5), t * 0.46, t * 0.5)
    lg.build(lambda px, py, pz: cm(paint('leg', px, py, pz), scale=80), 420)
    pd = Blob(t * 0.08)
    for sx in (-1, 1):
        pd.ell((x + sx * t * 0.32, 0.013, fet[2] + t * 0.75), t * 0.42, 0.013, t * 0.62)
    pd.build(cm(paint('pad', x, 0, z), scale=80), 140)


def camel():
    """A dromedary: a single tall hump, a long curved neck, a long head with droopy lips and small
    ears, long thin legs with knobbly knees and broad pads, a thin tufted tail."""
    def paint(part, x, y, z):
        if part == 'pad':
            return '#5a4636'
        if part == 'hump' and y > 0.76:
            return '#9a7446'
        if part == 'leg' and y < 0.06:
            return '#8a6a48'
        return '#c49a62' if noise(x, y, z, 30) < 0.35 else '#c8a068'
    b = Blob(0.006)
    b.ell((0, 0.570, 0.0), 0.09, 0.1, 0.19)
    b.ball((0, 0.550, 0.14), 0.095)
    b.ball((0, 0.570, -0.13), 0.09)
    b.ell((0, 0.510, 0.02), 0.08, 0.06, 0.14)
    b.cap((0, 0.560, 0.19), (0, 0.490, 0.3), 0.06, 0.045)          # the neck, down and forward
    b.cap((0, 0.490, 0.3), (0, 0.670, 0.37), 0.045, 0.036)         # and up again to the head
    b.ell((0, 0.69, -0.01), 0.075, 0.1, 0.1)                     # the hump, grown out of the back
    b.build(lambda x, y, z: by(paint, 'hump' if y > 0.72 else 'body')(x, y, z), 5000)
    hx, hy, hz = 0, 0.67, 0.37
    with anim_group('head', B(hx, hy, hz)):
        h = Blob(0.003)
        h.ball((0, 0.695, 0.38), 0.04)
        h.cap((0, 0.690, 0.4), (0, 0.655, 0.49), 0.035, 0.028)
        h.ell((0, 0.640, 0.49), 0.03, 0.026, 0.03)                # the soft, droopy lips
        for sx in (-1, 1):
            h.ell((sx * 0.012, 0.660, 0.515), 0.007, 0.004, 0.006, neg=True)
            h.ball((sx * 0.028, 0.700, 0.4), 0.014)               # the heavy brows
        h.build(by(paint, 'head'), 1500)
        for sx in (-1, 1):
            e = Blob(0.0015)
            e.cap((sx * 0.025, 0.725, 0.37), (sx * 0.038, 0.748, 0.36), 0.009, 0.004)
            e.build(by(paint, 'head'), 100)
    eye_mark((0.03, 0.703, 0.41), 0.01, 0.9)
    with anim_group('tail', B(0, 0.570, -0.21)):
        t = Blob(0.002)
        t.cap((0, 0.570, -0.21), (0, 0.410, -0.23), 0.012, 0.007)
        t.ell((0, 0.380, -0.23), 0.012, 0.03, 0.01)
        t.build(lambda x, y, z: cm('#6a4a2c') if y < 0.5 else cm('#c49a62'), 150)
    for i, (x, z) in enumerate([(-0.058, 0.14), (0.058, 0.14), (-0.058, -0.14), (0.058, -0.14)]):
        top = 0.49
        with anim_group(f'leg{i}', B(x, top, z)):
            pad_leg(paint, x, z, top, z > 0, 0.03)
    finish('animal_camel', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.12)


def alpaca():
    """An alpaca in full fleece: a fluffy body, a long upright neck, a small head with a woolly
    topknot and spear shaped ears, slim legs on soft pads."""
    fleece = '#ecdcc0'

    def paint(part, x, y, z):
        if part == 'pad':
            return '#3a2e26'
        if part == 'head':
            return '#e0cdae'
        return fleece
    b = Blob(0.005)
    b.ell((0, 0.360, 0.0), 0.09, 0.09, 0.16)
    b.cap((0, 0.390, 0.12), (0, 0.580, 0.17), 0.058, 0.045)        # the long upright neck
    b.build(by(paint, 'body'), 2400)
    f = Blob(0.004)
    ga = math.pi * (3 - math.sqrt(5))
    for i in range(130):
        yv = 1 - 2 * (i + 0.5) / 130
        rad = math.sqrt(1 - yv * yv)
        a = ga * i
        f.ball((math.cos(a) * rad * 0.09, 0.44 + yv * 0.09, math.sin(a) * rad * 0.16), 0.03)
    for k in range(12):
        u = k / 11
        for sx in (-1, 1):
            f.ball((sx * 0.025, 0.48 + u * 0.18, 0.13 + u * 0.04), 0.035)
    f.build(pm('al_fleece', fleece, '#fff4e0', scale=130), 3200)
    hx, hy, hz = 0, 0.59, 0.17
    with anim_group('head', B(hx, hy, hz)):
        h = Blob(0.0025)
        h.ball((0, 0.622, 0.192), 0.04)
        h.cap((0, 0.616, 0.205), (0, 0.596, 0.25), 0.03, 0.024)
        h.ell((0, 0.59, 0.252), 0.022, 0.02, 0.016)
        h.build(by(paint, 'head'), 1000)
        tk = Blob(0.003)
        tk.ell((0, 0.658, 0.182), 0.044, 0.032, 0.04)             # the woolly topknot
        tk.build(pm('al_top', fleece, '#fff4e0', scale=130), 300)
        for sx in (-1, 1):
            e = Blob(0.0015)
            e.cap((sx * 0.026, 0.66, 0.178), (sx * 0.036, 0.72, 0.17), 0.011, 0.003)    # spear shaped ears
            e.build(by(paint, 'head'), 100)
    eye_mark((0.027, 0.625, 0.21), 0.01, 0.85)
    for i, (x, z) in enumerate([(-0.05, 0.1), (0.05, 0.1), (-0.05, -0.1), (0.05, -0.1)]):
        top = 0.3
        with anim_group(f'leg{i}', B(x, top, z)):
            pad_leg(paint, x, z, top, z > 0, 0.023)
    with anim_group('tail', B(0, 0.390, -0.16)):
        t = Blob(0.003)
        t.ell((0, 0.360, -0.17), 0.025, 0.04, 0.022)
        t.build(pm('al_tail', fleece, '#fff4e0', scale=130), 150)
    finish('animal_alpaca', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.1)


def bovine_head(paint, hx, hy, hz, L=0.12, W=0.06, low=0.0):
    """A heavy bovine head from the poll down to a broad, wet muzzle."""
    h = Blob(0.0035)
    h.ball((0, hy + 0.03, hz + 0.02), W)
    h.cap((0, hy + 0.02, hz + 0.05), (0, hy - 0.05 - low, hz + L), W * 0.9, W * 0.72)
    h.ell((0, hy - 0.06 - low, hz + L + 0.01), W * 0.82, W * 0.62, W * 0.62)
    h.ell((0, hy - 0.02, hz + 0.06), W * 0.8, W * 0.7, W * 0.8)
    for sx in (-1, 1):
        h.ell((sx * W * 0.35, hy - 0.06 - low, hz + L + W * 0.6), W * 0.16, W * 0.14, W * 0.12, neg=True)
    return h


def yak():
    """A yak: a big humped shoulder, a coat of long hair hanging almost to the ground from its
    flanks and chest, a bushy tail, a broad head with upswept horns; black with a white muzzle."""
    def paint(part, x, y, z):
        if part == 'muzzle':
            return '#e8e2d8'
        return '#1e1a18' if noise(x, y, z, 40) < 0.3 else '#2a2420'
    b = Blob(0.006)
    b.ell((0, 0.38, 0.0), 0.12, 0.11, 0.22)
    b.ell((0, 0.46, 0.1), 0.1, 0.1, 0.1)                         # the high humped shoulders
    b.cap((0, 0.4, 0.18), (0, 0.38, 0.26), 0.08, 0.065)
    # the long skirt of hair hanging from the flanks and chest, part of the same shaggy coat
    b.ell((0, 0.29, 0.0), 0.125, 0.1, 0.21)
    b.ell((0, 0.28, 0.14), 0.1, 0.1, 0.07)
    skirt = pm('yk_skirt', '#1e1a18', '#342c26', scale=60, kind='wave', stretch=(1, 1, 6))
    b.build(lambda x, y, z: skirt if y < 0.33 else by(paint, 'body')(x, y, z), 5000)
    hx, hy, hz = 0, 0.38, 0.27
    with anim_group('head', B(hx, hy, hz)):
        h = bovine_head(paint, hx, hy, hz, L=0.11, W=0.058, low=0.03)
        h.build(lambda x, y, z: cm('#e8e2d8') if z > 0.36 else by(paint, 'head')(x, y, z), 1800)
        horns_pair(lambda sx: curve((sx * 0.045, hy + 0.06, hz + 0.02), (sx * 0.12, hy + 0.07, hz + 0.01), (sx * 0.11, hy + 0.16, hz + 0.02), 8),
                   0.016, 0.004, '#e8e0cc', '#5a5046')
        for sx in (-1, 1):
            e = Blob(0.002)
            e.ell((sx * 0.065, hy + 0.02, hz + 0.02), 0.022, 0.01, 0.014)
            e.build(by(paint, 'head'), 100)
    eye_mark((0.045, hy + 0.02, hz + 0.075), 0.011, 0.85)
    with anim_group('tail', B(0, 0.44, -0.22)):
        t = Blob(0.004)
        t.cap((0, 0.44, -0.22), (0, 0.24, -0.25), 0.03, 0.04)   # the bushy tail
        t.build(pm('yk_tail', '#1e1a18', '#342c26', scale=140), 400)
    s = Spec(hips=[(-0.075, 0.14), (0.075, 0.14), (-0.075, -0.14), (0.075, -0.14)], leg_top_f=0.24, leg_top_h=0.25, leg_t=0.034,
             hoof_h=0.026)
    legs4(paint, s, '#2a2420')
    finish('animal_yak', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.12)


def buffalo():
    """A water buffalo: a heavy, slate grey body with a thin coat, a long low head carried out in
    front, and great crescent horns sweeping back."""
    def paint(part, x, y, z):
        if part == 'leg' and y < 0.1:
            return '#6a6660'
        return '#2e2e30' if noise(x, y, z, 40) < 0.3 else '#383638'
    b = Blob(0.006)
    b.ell((0, 0.38, 0.0), 0.125, 0.115, 0.24)
    b.ball((0, 0.39, 0.16), 0.115)
    b.ball((0, 0.4, -0.17), 0.11)
    b.cap((0, 0.4, 0.2), (0, 0.38, 0.29), 0.08, 0.065)
    b.build(by(paint, 'body'), 4500)
    hx, hy, hz = 0, 0.37, 0.3
    with anim_group('head', B(hx, hy, hz)):
        h = bovine_head(paint, hx, hy, hz, L=0.13, W=0.056, low=0.02)
        h.build(lambda x, y, z: cm('#1a1a1c') if z > 0.43 else by(paint, 'head')(x, y, z), 1800)
        horns_pair(lambda sx: curve((sx * 0.035, hy + 0.06, hz + 0.02), (sx * 0.2, hy + 0.08, hz - 0.02), (sx * 0.14, hy + 0.1, hz - 0.14), 10),
                   0.024, 0.005, '#5a544c', '#2a2622', faces=420)
        for sx in (-1, 1):
            e = Blob(0.002)
            e.ell((sx * 0.07, hy + 0.0, hz + 0.03), 0.028, 0.01, 0.016)
            e.build(by(paint, 'head'), 100)
    eye_mark((0.046, hy + 0.02, hz + 0.075), 0.011, 0.85)
    with anim_group('tail', B(0, 0.46, -0.26)):
        t = Blob(0.003)
        t.cap((0, 0.46, -0.26), (0, 0.24, -0.28), 0.014, 0.008)
        t.ell((0, 0.22, -0.28), 0.014, 0.03, 0.014)
        t.build(by(paint, 'body'), 150)
    s = Spec(hips=[(-0.08, 0.16), (0.08, 0.16), (-0.08, -0.16), (0.08, -0.16)], leg_top_f=0.26, leg_top_h=0.28, leg_t=0.036,
             hoof_h=0.028)
    legs4(paint, s, '#1e1c1a')
    finish('animal_buffalo', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.12)


# ---------------------------------------------------------------- birds

def bird_leg(x, top, z, t, col, toes=3, spur=False, feather=None, length=None):
    """A bird's leg: a feathered thigh (in the body), a scaly shank and spread toes."""
    lg = Blob(min(0.002, t * 0.12))
    foot = (x, t * 0.6, z + t * 0.3)
    lg.cap((x, top, z), foot, t, t * 0.8)
    L = length or t * 7
    spread = (-0.5, 0.0, 0.5) if toes == 3 else (-0.18, 0.2)
    for a in spread:
        lg.cap(foot, (x + math.sin(a) * L, t * 0.35, z + t * 0.3 + math.cos(a) * L), t * 0.6, t * 0.35)
    if toes == 3:
        lg.cap(foot, (x, t * 0.35, z - L * 0.45), t * 0.5, t * 0.3)
    if spur:
        lg.cap((x, top * 0.3, z - t * 0.3), (x, top * 0.28, z - t * 2), t * 0.4, t * 0.15)
    lg.build(pm('bl_' + col[1:], col, rough=0.6), 400)


def gobbler():
    """A tom turkey in full display: the body puffed out, wings lowered to brush the ground, the
    great fan of tail feathers raised behind, banded and pale tipped; a bare blue and red head
    with the snood over the bill, the wattle and the black beard on the breast."""
    def paint(part, x, y, z):
        if part == 'fan':
            r = math.hypot(x, y - 0.22)
            if r > 0.19:
                return '#e6dccb'                                # the pale tips
            if 0.17 < r <= 0.19:
                return '#1e1814'                                # the dark band
            return '#6a4a2a' if math.sin(r * 160) > 0 else '#4e3620'
        if part == 'wing':
            return '#3a2a1a' if math.sin(z * 120) > 0 else '#e8e0d0'   # the barred flight feathers
        return '#3a2a1a' if noise(x, y, z, 120) < 0.2 else '#5a4020'   # bronze sheen
    b = Blob(0.004)
    b.ell((0, 0.2, 0.0), 0.085, 0.08, 0.1)
    b.ball((0, 0.22, 0.06), 0.075)                              # the puffed breast
    b.build(by(paint, 'body'), 2600)
    for sx in (-1, 1):
        w = Blob(0.003)
        w.ell((sx * 0.08, 0.14, -0.01), 0.015, 0.07, 0.09)      # wings lowered to the ground
        w.build(by(paint, 'wing'), 500)
    fan = Blob(0.003)
    for k in range(17):
        a = (k / 16 - 0.5) * math.pi * 0.95
        fan.cap((0, 0.22, -0.08), (math.sin(a) * 0.2, 0.22 + math.cos(a) * 0.2, -0.1), 0.012, 0.022)
    fan.build(by(paint, 'fan'), 1600)
    with anim_group('head', B(0, 0.26, 0.09)):
        n = Blob(0.002)
        n.cap((0, 0.26, 0.09), (0, 0.31, 0.11), 0.018, 0.013)
        n.ball((0, 0.315, 0.115), 0.017)
        n.build(lambda x, y, z: pm('gb_blue', '#9ab8e0') if y > 0.3 else pm('gb_red', '#c8282a'), 400)
        wt = Blob(0.0015)
        wt.ell((0, 0.28, 0.125), 0.008, 0.022, 0.008)           # the wattle
        wt.cap((0.004, 0.33, 0.128), (0.006, 0.3, 0.14), 0.005, 0.004)   # the snood hanging over the bill
        wt.build(pm('gb_wattle', '#d0262a'), 160)
        bk = Blob(0.0012)
        bk.cap((0, 0.315, 0.13), (0, 0.308, 0.145), 0.006, 0.002)
        bk.build(pm('gb_beak', '#d8c8a8'), 60)
    eye_mark((0.013, 0.322, 0.122), 0.0045, 1.0)
    bd = Blob(0.0015)
    bd.cap((0, 0.25, 0.12), (0, 0.18, 0.13), 0.006, 0.004)      # the beard
    bd.build(pm('gb_beard', '#141010'), 80)
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'leg{i}', B(sx * 0.035, 0.12, 0.0)):
            bird_leg(sx * 0.035, 0.12, 0.0, 0.009, '#d8a8a0', spur=True)
    finish('animal_gobbler', tex=1024, vivid=1.06, ao_min=0.62, ao_dist=0.06)


def ostrich():
    """A cock ostrich: a big body of black plumage with white wing and tail plumes, a long bare
    neck, a small flat head with big eyes, and powerful bare legs on two toes."""
    b = Blob(0.006)
    b.ell((0, 0.7, -0.02), 0.16, 0.13, 0.21)
    b.ell((0, 0.68, 0.1), 0.12, 0.1, 0.1)
    for sx in (-1, 1):
        b.ell((sx * 0.14, 0.68, -0.1), 0.04, 0.08, 0.12)        # the white wing plumes, drooping
    b.ell((0, 0.72, -0.23), 0.09, 0.08, 0.06)                    # and the tail plume
    white = pm('os_plume', '#f4f2ee', '#ffffff', scale=120)
    b.build(lambda x, y, z: white if (z < -0.2 or (abs(x) > 0.12 and z < -0.04)) else cm('#141212', scale=90), 3400)
    with anim_group('head', B(0, 0.78, 0.13)):
        n = Blob(0.003)
        n.cap((0, 0.76, 0.14), (0, 0.95, 0.16), 0.042, 0.026)
        n.cap((0, 0.95, 0.16), (0, 1.08, 0.18), 0.026, 0.02)
        n.ell((0, 1.1, 0.2), 0.024, 0.02, 0.03)                  # the small flat head
        n.build(lambda x, y, z: cm('#d8a8a0', scale=80) if y < 0.83 else cm('#b8a8a0', scale=80), 1200)
        bk = Blob(0.0015)
        bk.ell((0, 1.095, 0.235), 0.014, 0.006, 0.02)
        bk.build(pm('os_beak', '#e0c8a8'), 80)
    eye_mark((0.017, 1.108, 0.215), 0.009, 1.0)
    for i, sx in enumerate((-1, 1)):
        x = sx * 0.055
        with anim_group(f'leg{i}', B(x, 0.66, 0.0)):
            lg = Blob(0.003)
            lg.ell((x, 0.6, 0.0), 0.05, 0.1, 0.06)               # the bare, muscular thigh
            lg.cap((x, 0.55, 0.0), (x, 0.33, -0.03), 0.036, 0.024)
            lg.cap((x, 0.33, -0.03), (x, 0.03, 0.0), 0.022, 0.019)
            lg.cap((x, 0.02, 0.0), (x + sx * 0.005, 0.012, 0.07), 0.018, 0.012)   # the big toe
            lg.cap((x, 0.02, 0.0), (x + sx * 0.03, 0.01, 0.045), 0.012, 0.008)   # and the small one
            lg.build(lambda px, py, pz: cm('#d8a8a0', scale=80), 600)
    finish('animal_ostrich', tex=1024, vivid=1.06, ao_min=0.62, ao_dist=0.08)


def peacock():
    """A peacock with its train folded behind it: a shining blue neck and breast, a bronze green
    back, barred brown wings, the long train of eyed feathers trailing on the ground, and a fan
    shaped crest."""
    def paint(part, x, y, z):
        if part == 'train':
            # the eye spots down the train
            u = (-z - 0.1) * 18
            if math.sin(u * 2.4) > 0.75 and abs(math.sin(x * 60 + u)) > 0.3:
                return '#1a2a6a' if math.sin(u * 2.4) > 0.9 else '#c8a030'
            return '#3a7a3a' if noise(x, y, z, 80) < 0.2 else '#2a6a4a'
        if part == 'wing':
            return '#a07a4a' if math.sin(z * 150) > 0 else '#3a2a1a'
        if part == 'back':
            return '#3a6a3a'
        return '#1e4ab0' if noise(x, y, z, 90) < 0.3 else '#2a5ac0'
    b = Blob(0.003)
    b.ell((0, 0.19, 0.0), 0.05, 0.05, 0.08)
    b.ball((0, 0.2, 0.045), 0.045)
    b.build(by(paint, 'body'), 1600)
    bk = Blob(0.003)
    bk.ell((0, 0.225, -0.03), 0.042, 0.02, 0.06)
    bk.build(by(paint, 'back'), 400)
    for sx in (-1, 1):
        w = Blob(0.0025)
        w.ell((sx * 0.045, 0.2, -0.02), 0.012, 0.035, 0.06)
        w.build(by(paint, 'wing'), 300)
    tr = Blob(0.003)
    for k in range(7):
        x = (k - 3) * 0.01
        tr.cap((x * 0.5, 0.2, -0.07), (x * 1.8, 0.1, -0.22), 0.022, 0.02)
        tr.cap((x * 1.8, 0.1, -0.22), (x * 1.2, 0.015, -0.42), 0.02, 0.008)
    tr.build(by(paint, 'train'), 2000)
    with anim_group('head', B(0, 0.23, 0.06)):
        n = Blob(0.002)
        n.cap((0, 0.23, 0.06), (0, 0.32, 0.09), 0.02, 0.012)
        n.ball((0, 0.33, 0.095), 0.015)
        n.build(by(paint, 'neck'), 500)
        bl = Blob(0.001)
        bl.cap((0, 0.33, 0.11), (0, 0.325, 0.124), 0.004, 0.0015)
        bl.build(pm('pc_bill', '#9a948e'), 40)
        cr = Blob(0.0008)
        for k in range(5):
            a = (k / 4 - 0.5) * 1.0
            tip = (math.sin(a) * 0.014, 0.37, 0.09 + math.cos(a) * 0.004)
            cr.cap((0, 0.345, 0.092), tip, 0.0012, 0.0009)
            cr.ball(tip, 0.004)
        cr.build(pm('pc_crest', '#1e4ab0'), 200)
    eye_mark((0.011, 0.337, 0.103), 0.004, 1.0)
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'leg{i}', B(sx * 0.024, 0.13, 0.0)):
            bird_leg(sx * 0.024, 0.14, 0.0, 0.006, '#8a8684')
    finish('animal_peacock', tex=1024, vivid=1.06, ao_min=0.62, ao_dist=0.06)


def quail():
    """A California quail: plump, blue grey on the breast, brown on the back, a scaled belly, a
    black throat edged in white, and the forward curling plume on its crown."""
    def paint(part, x, y, z):
        if part == 'head':
            if z > 0.055 and y < 0.1:
                return '#141212'                                # the black throat
            if abs(y - 0.1) < 0.003 and z > 0.045:
                return '#f4f2ee'                                # the white band
            return '#7a5a3a'
        if part == 'body':
            if y < 0.05:
                return '#e8d8b8'                                # the pale scaled belly
            if z > 0.02:
                return '#6a7a8a'                                # the blue grey breast
            return '#7a6048'
        return '#6a5a4a'
    b = Blob(0.0018)
    b.ell((0, 0.06, 0.0), 0.034, 0.034, 0.045)
    b.ball((0, 0.065, 0.025), 0.03)
    b.ell((0, 0.07, -0.04), 0.02, 0.012, 0.02)
    b.build(by(paint, 'body'), 1200)
    with anim_group('head', B(0, 0.08, 0.035)):
        h = Blob(0.0012)
        h.cap((0, 0.08, 0.035), (0, 0.098, 0.047), 0.016, 0.015)
        h.ball((0, 0.105, 0.05), 0.017)
        h.build(by(paint, 'head'), 500)
        bl = Blob(0.0008)
        bl.cap((0, 0.104, 0.066), (0, 0.1, 0.074), 0.004, 0.0015)
        bl.build(pm('ql_bill', '#1e1a18'), 40)
        pl = Blob(0.0008)
        pl.cap((0, 0.114, 0.052), (0, 0.13, 0.058), 0.0032, 0.003)
        pl.ell((0, 0.133, 0.064), 0.004, 0.005, 0.0075)         # the teardrop plume
        pl.build(pm('ql_plume', '#141212'), 160)
    eye_mark((0.012, 0.108, 0.058), 0.0035, 1.0)
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'leg{i}', B(sx * 0.014, 0.035, 0.0)):
            bird_leg(sx * 0.014, 0.04, 0.0, 0.0048, '#8a7a6a', length=0.018)
    finish('animal_quail', tex=512, vivid=1.06, ao_min=0.65, ao_dist=0.03)


def duck():
    """A mallard drake afloat: a glossy green head, a thin white collar, a chestnut breast, pale
    grey flanks, a black stern with the curled tail feathers, a yellow bill and the blue wing
    patch."""
    def paint(part, x, y, z):
        if part == 'head':
            return '#1e5a3a' if noise(x, y, z, 60) < 0.3 else '#2a6a4a'
        if part == 'body':
            if y > 0.145 and z > 0.08:
                return '#f4f2ee' if y < 0.152 else '#1e5a3a'   # the white ring round the neck
            if z > 0.05 and y < 0.145:
                return '#6a3a24'                                # the chestnut breast
            if z < -0.08:
                return '#141414'                                # the black stern
            if y > 0.12 and abs(x) > 0.035 and -0.05 < z < 0.0:
                return '#2a4ab0'                                # the speculum
            return '#b8b8b4' if y < 0.12 else '#9a8e80'
        return '#b8b8b4'
    b = Blob(0.003)
    b.ell((0, 0.08, -0.01), 0.07, 0.05, 0.12)
    b.ball((0, 0.09, 0.07), 0.055)
    b.ell((0, 0.11, -0.1), 0.04, 0.03, 0.05)
    b.cap((0, 0.12, 0.08), (0, 0.16, 0.1), 0.036, 0.028)
    b.build(by(paint, 'body'), 1800)
    c = Blob(0.001)
    c.cap((0, 0.135, -0.13), (0, 0.16, -0.12), 0.004, 0.002)      # the curled drake feathers
    c.build(pm('dk_curl', '#141414'), 50)
    with anim_group('head', B(0, 0.15, 0.085)):
        h = Blob(0.0015)
        h.ball((0, 0.18, 0.105), 0.028)
        h.build(by(paint, 'head'), 600)
        bl = Blob(0.0012)
        bl.cap((0, 0.172, 0.128), (0, 0.162, 0.16), 0.011, 0.008)
        bl.build(pm('dk_bill', '#e8c040'), 120)
    eye_mark((0.02, 0.187, 0.12), 0.005, 1.0)
    finish('animal_duck', tex=512, vivid=1.06, ao_min=0.65, ao_dist=0.04)


def rabbit():
    """A wild brown rabbit, crouched: long hind feet and big haunches, a round head with long
    upright ears, big eyes, and the white scut of a tail."""
    def paint(part, x, y, z):
        if part == 'ear_tip':
            return '#2a2220'
        if part == 'body' and y < 0.035 and z > -0.08:
            return '#ece4d6'
        return '#957354'                                         # agouti brown
    b = Blob(0.003)
    b.ell((0, 0.08, -0.02), 0.052, 0.06, 0.075)
    b.ball((0, 0.075, -0.05), 0.055)                             # the haunches
    for sx in (-1, 1):
        b.ell((sx * 0.038, 0.012, -0.03), 0.011, 0.01, 0.045)    # the long hind feet
        b.cap((sx * 0.018, 0.06, 0.05), (sx * 0.018, 0.01, 0.068), 0.009, 0.007)   # the forelegs
    b.build(by(paint, 'body'), 2000)
    t = Blob(0.002)
    t.ball((0, 0.09, -0.115), 0.02)
    t.build(pm('rb_scut', '#f6f4f0', '#ffffff', scale=90), 150)
    with anim_group('head', B(0, 0.12, 0.05)):
        h = Blob(0.002)
        h.cap((0, 0.115, 0.045), (0, 0.13, 0.068), 0.03, 0.028)
        h.ell((0, 0.135, 0.075), 0.026, 0.027, 0.03)
        h.ell((0, 0.124, 0.098), 0.017, 0.016, 0.016)
        h.build(by(paint, 'head'), 900)
        for sx in (-1, 1):
            e = Blob(0.0015)
            for k in range(7):
                u = k / 6
                e.ell((sx * (0.012 + u * 0.01), 0.155 + u * 0.07, 0.065 - u * 0.02), 0.004, 0.011, 0.011 - abs(u - 0.4) * 0.007)
            e.build(lambda x, y, z: by(paint, 'ear_tip' if y > 0.215 else 'head')(x, y, z), 300)
        n = Blob(0.001)
        n.ell((0, 0.128, 0.113), 0.005, 0.004, 0.003)
        n.build(pm('rb_nose', '#d89a9a'), 40)
    eye_mark((0.02, 0.14, 0.088), 0.0065, 0.7)
    finish('animal_rabbit', tex=512, vivid=1.06, ao_min=0.65, ao_dist=0.04)


MODELS = {'animal_cow': cow, 'animal_camel': camel, 'animal_alpaca': alpaca, 'animal_yak': yak, 'animal_buffalo': buffalo,
          'animal_gobbler': gobbler, 'animal_ostrich': ostrich, 'animal_peacock': peacock, 'animal_quail': quail, 'animal_duck': duck,
          'animal_rabbit': rabbit, 'animal_horse': horse, 'animal_donkey': donkey, 'animal_sheep': sheep, 'animal_dog': dog}

if __name__ == '__main__':
    main(MODELS)
