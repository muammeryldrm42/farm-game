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
from breeds import antler, cm, curve, eye_mark, horn_path  # noqa: E402
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

def scale_all(S):
    """Scale everything built so far about the ground point under the animal (markers and
    animation pivots too), for breeds bigger or smaller than their kind."""
    import mathutils
    import bpy
    M = mathutils.Matrix.Scale(S, 4)
    for o in bpy.context.scene.objects:
        o.matrix_world = M @ o.matrix_world
    from kit import ANIM
    for k, p in list(ANIM.items()):
        ANIM[k] = tuple(M @ mathutils.Vector(p))


def hair(col, scale=60):
    """A long hair material: a combed, wavy streak through the colour."""
    c = [int(col[i:i + 2], 16) for i in (1, 3, 5)]
    return pm('hr_' + col[1:], col, '#' + ''.join(f'{min(255, int(v * 1.22 + 6)):02x}' for v in c), scale=scale * 2.4)


# the cow's head pivot and poll, for horns and extras
COW_HEAD = (0, 0.47, 0.3)


def cattle(kind, paint, S=1.0, horns='short', udder=True, ears='out', hump=False, shaggy=None, body_extra=None,
           head_extra=None, hoof='#2e2622', dewlap=1.0):
    """A cow on the Holstein's frame: a long, deep, angular body, a straight back, hip bones
    standing out at the rump, an udder, a long head with a broad muzzle, and ears out sideways
    (or long and drooping on the zebu). `paint(part, x, y, z)` gives the colours; parts: body,
    head, face (down the front of the face), muzzle, ear, ear_in, udder, switch, leg.
    `horns`: 'short', 'none' or a function giving each side's horn. `shaggy`: a long hair colour
    for a coat that hangs down the flanks (the Highland)."""
    s = Spec(hips=[(-0.078, 0.17), (0.078, 0.17), (-0.078, -0.17), (0.078, -0.17)], leg_top_f=0.25, leg_top_h=0.27,
             leg_t=0.035, hoof_h=0.028)
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
    b.ell((0, 0.34 - (dewlap - 1) * 0.03, 0.26), 0.035, 0.07 * dewlap, 0.05)
    if hump:
        # the zebu's hump over the shoulders
        b.ell((0, 0.5, 0.15), 0.06, 0.075, 0.07)
    if shaggy:
        # a coat of long hair hanging down the flanks, part of the same shaggy mass
        b.ell((0, 0.31, 0.0), 0.128, 0.1, 0.235)
        b.ell((0, 0.3, 0.16), 0.105, 0.1, 0.08)
        hm = hair(shaggy)
        b.build(lambda x, y, z: hm if y < 0.4 else by(paint, 'body')(x, y, z), 7500)
    else:
        b.build(by(paint, 'body'), 7500)
    if body_extra:
        body_extra()
    if udder:
        u = Blob(0.004)
        u.ell((0, 0.255, -0.13), 0.07, 0.05, 0.075)
        for x, z in ((0.03, -0.1), (-0.03, -0.1), (0.03, -0.16), (-0.03, -0.16)):
            u.cap((x, 0.23, z), (x, 0.195, z), 0.011, 0.009)     # the teats
        u.build(by(paint, 'udder'), 500)
    hx, hy, hz = COW_HEAD
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
                return by(paint, 'muzzle')(x, y, z)
            if abs(x) < 0.03 and z > 0.31:
                return by(paint, 'face')(x, y, z)
            return by(paint, 'head')(x, y, z)
        h.build(head, 2000)
        for sx in (-1, 1):
            e = Blob(0.0025)
            if ears == 'droop':
                # long ears hanging down beside the face
                e.cap((sx * 0.05, 0.49, 0.31), (sx * 0.09, 0.43, 0.3), 0.022, 0.016)
                e.ell((sx * 0.09, 0.43, 0.305), 0.014, 0.032, 0.022)
            else:
                e.cap((sx * 0.05, 0.5, 0.31), (sx * 0.115, 0.49, 0.3), 0.022, 0.018)
                e.ell((sx * 0.1, 0.49, 0.3), 0.026, 0.012, 0.024)
            e.build(lambda x, y, z: by(paint, 'ear_in')(x, y, z) if (z > 0.3 and abs(x) > 0.07 and y < 0.492 and ears != 'droop')
                    else by(paint, 'ear')(x, y, z), 300)
        if horns == 'short':
            horns_pair(lambda sx: curve((sx * 0.03, 0.535, 0.31), (sx * 0.07, 0.56, 0.3), (sx * 0.07, 0.585, 0.33), 6),
                       0.012, 0.004, '#ece2c8', '#4a3e34', faces=180)
        elif callable(horns):
            horns()
        if head_extra:
            head_extra()
    eye_mark((0.048, 0.49, 0.37), 0.0135, 0.85)
    with anim_group('tail', B(0, 0.47, -0.27)):
        t = Blob(0.003)
        t.cap((0, 0.47, -0.27), (0, 0.4, -0.29), 0.016, 0.01)
        t.cap((0, 0.4, -0.29), (0, 0.21, -0.29), 0.01, 0.008)
        t.build(by(paint, 'body'), 200)
        sw = Blob(0.003)
        sw.ell((0, 0.19, -0.288), 0.02, 0.04, 0.02)              # the switch
        sw.build(by(paint, 'switch'), 120)
    legs4(paint, s, hoof)
    if S != 1.0:
        scale_all(S)
    finish(f'animal_{kind}', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.12)


def coat(base, parts=None, var=0.0):
    """A paint function: `base` for the coat, with `parts` overriding by part name (a colour or a
    function of x, y, z)."""
    parts = parts or {}

    def paint(part, x, y, z):
        v = parts.get(part)
        if v is not None:
            return v(x, y, z) if callable(v) else v
        return base(x, y, z) if callable(base) else base
    return paint


def cow():
    """A Holstein Friesian: black patches on white, a pink muzzle, a white blaze."""
    def patches(x, y, z):
        n = noise(x * 1.1 + 4.2, y * 1.3, z, 7) + noise(x, y, z, 22) * 0.25
        return '#1c1a18' if n > 0.12 else '#f8f6f0'
    cattle('cow', coat(patches, {'udder': '#f0b0b4', 'muzzle': '#eeaab0', 'ear_in': '#e8a4a8', 'switch': '#f8f6f0', 'face': '#f8f6f0',
                                 'leg': lambda x, y, z: '#f8f6f0' if y < 0.12 else patches(x, y, z)}))


def angus_cow():
    cattle('angus_cow', coat('#1e1b19', {'muzzle': '#2e2a28', 'ear_in': '#3a3432', 'udder': '#3a3030'}), horns='none',
           hoof='#1a1614')


def belted_galloway():
    def body(x, y, z):
        return '#f1ede4' if -0.07 + noise(x, y, 0, 25) * 0.015 < z < 0.08 + noise(x, y, 3, 25) * 0.015 else '#1d1b19'
    # the Galloway's thick, wavy winter coat
    cattle('belted_galloway', coat('#1d1b19', {'body': body, 'muzzle': '#2e2a28', 'ear_in': '#3a3432', 'udder': '#d8b0a8'}),
           horns='none', hoof='#1a1614')


def dexter():
    cattle('dexter', coat('#211d1a', {'muzzle': '#34302c', 'ear_in': '#3a3432', 'udder': '#4a3a36'}), S=0.82)


def charolais():
    cattle('charolais', coat('#eee4cf', {'muzzle': '#e8b4a4', 'ear_in': '#efc8b8', 'udder': '#f0c8b8'}), hoof='#8a7a68', S=1.08)


def brown_swiss():
    grey = '#7b6b5e'

    def muzzle(x, y, z):
        return '#2a2522' if z > 0.46 and y < 0.42 else '#e2d9c8'   # dark nose in a pale ring
    cattle('brown_swiss', coat(grey, {'muzzle': muzzle, 'ear_in': '#e0d8c8', 'udder': '#cbb8a8', 'switch': '#2a2522',
                                     'leg': lambda x, y, z: '#4e433b' if y < 0.1 else grey}))


def hereford():
    red, white = '#8c3a1c', '#f4efe6'

    def body(x, y, z):
        n = noise(x, y, z, 18) * 0.02
        if y < 0.26 + n or (z > 0.2 and (y < 0.36 + n or y > 0.47 + n)):
            return white                                         # the underline, brisket and crest
        return red
    cattle('hereford', coat(red, {'body': body, 'head': white, 'face': white, 'muzzle': '#e8aaa0', 'ear': red, 'ear_in': '#e8b8b0',
                                  'switch': white, 'udder': '#e8b8b0', 'leg': lambda x, y, z: white if y < 0.12 else red}))


def guernsey():
    fawn, white = '#c47a36', '#f5f0e6'

    def patches(x, y, z):
        return white if noise(x + 5, y, z, 9) > 0.28 else fawn
    cattle('guernsey', coat(patches, {'face': white, 'muzzle': '#e8c0a0', 'ear_in': '#e8c8a8', 'switch': white, 'udder': '#f0c8a8',
                                      'leg': lambda x, y, z: white if y < 0.13 else patches(x, y, z)}))


def jersey_cow():
    fawn, dusk = '#b07a4a', '#6e4c34'

    def body(x, y, z):
        # darker over the neck, shoulders and hindquarters, as Jerseys are
        return dusk if abs(z - 0.02) > 0.18 + noise(x, y, z, 12) * 0.03 else fawn

    def muzzle(x, y, z):
        return '#1f1a18' if z > 0.46 and y < 0.42 else '#eadcc6'
    cattle('jersey_cow', coat(fawn, {'body': body, 'head': dusk, 'face': '#8a5e3a', 'muzzle': muzzle, 'ear': dusk, 'ear_in': '#e0ccb4',
                                     'switch': '#2a201a', 'udder': '#e0b8a0', 'leg': lambda x, y, z: dusk if y < 0.14 else fawn}), S=0.92)


def texas_longhorn():
    red, white = '#94421e', '#efe6d6'

    def patches(x, y, z):
        n = noise(x + 2, y, z, 7)
        if n > 0.18:
            return white
        return '#6a2e16' if n > 0.08 and noise(x, y, z, 90) > 0.2 else red

    def horns():
        # out sideways a long way, a gentle twist up and forward at the tips
        horns_pair(lambda sx: curve((sx * 0.035, 0.53, 0.31), (sx * 0.3, 0.54, 0.29), (sx * 0.42, 0.65, 0.36), 12),
                   0.02, 0.005, '#e6d8b8', '#4a3a2c', faces=420)
    cattle('texas_longhorn', coat(patches, {'muzzle': '#d89a8a', 'ear_in': '#e0b0a0', 'switch': white, 'udder': '#e0b0a0'}),
           horns=horns)


def watusi():
    def horns():
        # the Ankole-Watusi's huge, thick lyre of horns
        horns_pair(lambda sx: curve((sx * 0.06, 0.53, 0.31), (sx * 0.3, 0.64, 0.25), (sx * 0.24, 0.88, 0.3), 12),
                   0.04, 0.008, '#ddcfb2', '#5a4a38', faces=600)
    cattle('watusi', coat('#6e2c18', {'muzzle': '#3a2a26', 'ear_in': '#6a3a2a', 'udder': '#6a3a2a'}), horns=horns)


def zebu():
    light, grey = '#d6d0c6', '#8e8a84'

    def body(x, y, z):
        return grey if z > 0.05 and y > 0.43 else light           # darker over the hump and shoulders

    def horns():
        horns_pair(lambda sx: curve((sx * 0.03, 0.535, 0.31), (sx * 0.05, 0.57, 0.29), (sx * 0.05, 0.6, 0.27), 6),
                   0.012, 0.004, '#3a3632', '#1e1a18', faces=160)
    cattle('zebu', coat(light, {'body': body, 'head': grey, 'face': '#b8b2a8', 'muzzle': '#3a3634', 'ear': '#b8b2a8', 'ear_in': '#c8c0b6',
                                'udder': '#c8b8b0', 'switch': '#2a2624'}), hump=True, ears='droop', horns=horns, dewlap=1.6)


def highland_cow():
    ginger = '#b8622c'

    def extra():
        # the shaggy fringe falling over the eyes
        f = Blob(0.003)
        for k in range(14):
            a = (k / 13 - 0.5) * 2.2
            x = math.sin(a) * 0.06
            f.cap((x, 0.55, 0.33), (x * 1.2, 0.47 - abs(x) * 0.2, 0.39), 0.014, 0.007)
        f.build(hair(ginger), 900)

    def horns():
        horns_pair(lambda sx: curve((sx * 0.035, 0.535, 0.31), (sx * 0.2, 0.55, 0.33), (sx * 0.24, 0.68, 0.33), 10),
                   0.02, 0.005, '#ecdfc4', '#4a3a2c', faces=360)
    cattle('highland_cow', coat(ginger, {'muzzle': '#2e2622', 'ear': ginger, 'ear_in': '#c07040', 'udder': '#c08060'}), horns=horns,
           shaggy=ginger, head_extra=extra, S=0.9)

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

def equid(kind, paint, S=1.0, donkey=False, hoof='#2a221c', size=1.0, mane=True, tail='long', ears=None, slim=1.0, feather=None,
          head_extra=None, body_extra=None, face=1.0, leg_t=0.034):
    """A horse (or a donkey): a deep chest and rounded hindquarters on long clean legs, an arched
    neck with its mane, a long head with a flat face, big nostrils and a soft muzzle, small
    pricked ears (long ones on the donkey), and a long hair tail (a tufted one on the donkey)."""
    def P(*p):
        return tuple(c * S for c in p)

    def R(r):
        return r * S
    b = Blob(0.006 * S)
    k = slim                                                     # deer are slimmer through the body
    b.ell(P(0, 0.5, 0.0), R(0.1 * k), R(0.098 * k), R(0.2))
    b.ball(P(0, 0.5, 0.15), R(0.1 * k))                          # the chest
    b.ball(P(0, 0.52, -0.14), R(0.106 * k))                      # the round hindquarters
    b.cap(P(0, 0.59, 0.14), P(0, 0.57, 0.03), R(0.05 * k), R(0.05 * k))   # the withers
    b.ell(P(0, 0.44, 0.0), R(0.085 * k), R(0.06 * k), R(0.15))   # the belly
    nt = (0, 0.72, 0.3) if not donkey else (0, 0.68, 0.29)
    b.cap(P(0, 0.54, 0.17), P(*nt), R(0.075), R(0.046))          # the neck, arched up and forward
    if body_extra:
        body_extra(b)
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
    if mane:
        m.build(lambda x, y, z: cm(paint('mane', x / S, y / S, z / S), scale=80), 800)
    hx, hy, hz = nt
    with anim_group('head', B(*P(hx, hy, hz))):
        h = Blob(0.0035 * S)
        h.ball(P(0, hy + 0.01, hz + 0.01), R(0.046))            # the poll and forehead
        f = face
        h.cap(P(0, hy, hz + 0.03), P(0, hy - 0.1 * f, hz + 0.13 * f), R(0.043), R(0.03 * max(1, f)))   # the long flat face
        h.ell(P(0, hy - 0.115 * f, hz + 0.14 * f), R(0.031 * f), R(0.033 * f), R(0.03 * f))          # the muzzle
        h.ell(P(0, hy - 0.05, hz + 0.05), R(0.038), R(0.04), R(0.045))             # the cheeks and jaw
        for sx in (-1, 1):
            h.ell(P(sx * 0.016 * face, hy - 0.11 * face, hz + 0.168 * face), R(0.009), R(0.011), R(0.008), neg=True)   # nostrils
            h.ball(P(sx * 0.035, hy + 0.0, hz + 0.045), R(0.016))                 # the eye bones

        def head(x, y, z):
            lx, ly, lz = x / S, y / S - hy, z / S - hz
            if lz > 0.125 * face:
                return cm(paint('muzzle', x / S, y / S, z / S), scale=80)
            if abs(lx) < 0.012 + lz * 0.05 and 0.02 < lz and ly > -0.08:
                return cm(paint('blaze', x / S, y / S, z / S), scale=80)
            return cm(paint('head', x / S, y / S, z / S), scale=80)
        h.build(head, 2400)
        for sx in (-1, 1):
            e = Blob(0.002 * S)
            if donkey or ears == 'long':
                e.cap(P(sx * 0.025, hy + 0.04, hz + 0.0), P(sx * 0.055, hy + 0.15, hz - 0.03), R(0.018), R(0.009))
            elif ears == 'deer':
                # big, leaf shaped ears held out to the sides
                e.cap(P(sx * 0.03, hy + 0.04, hz + 0.0), P(sx * 0.075, hy + 0.075, hz - 0.01), R(0.016), R(0.012))
                e.ell(P(sx * 0.068, hy + 0.072, hz - 0.008), R(0.02), R(0.012), R(0.012))
            else:
                e.cap(P(sx * 0.024, hy + 0.045, hz + 0.0), P(sx * 0.03, hy + 0.1, hz - 0.01), R(0.014), R(0.003))
            e.build(lambda x, y, z: cm(paint('ear', x / S, y / S, z / S), scale=80), 200)
        if not donkey and mane:
            f = Blob(0.002 * S)
            f.ell(P(0, hy + 0.05, hz + 0.04), R(0.016), R(0.03), R(0.02))              # the forelock
            f.build(lambda x, y, z: cm(paint('mane', x / S, y / S, z / S), scale=80), 150)
        if head_extra:
            head_extra(hx, hy, hz)
    eye_mark(P(0.037, hy + 0.005, hz + 0.055), R(0.012), 0.9)
    with anim_group('tail', B(*P(0, 0.58, -0.25))):
        t = Blob(0.003 * S)
        if tail == 'deer':
            t.cap(P(0, 0.58, -0.25), P(0, 0.53, -0.28), R(0.022), R(0.014))   # a short tail
        elif donkey or tail == 'tuft':
            t.cap(P(0, 0.58, -0.25), P(0, 0.38, -0.28), R(0.012), R(0.008))
            t.ell(P(0, 0.34, -0.28), R(0.02), R(0.05), R(0.02))
        else:
            t.cap(P(0, 0.58, -0.25), P(0, 0.52, -0.29), R(0.03), R(0.03))
            for k, dx in enumerate((-0.012, 0.0, 0.012)):
                t.cap(P(dx, 0.52, -0.29), P(dx * 2, 0.3, -0.3 - k * 0.004), R(0.03), R(0.014))
        t.build(lambda x, y, z: cm(paint('tail', x / S, y / S, z / S), scale=80), 500)
    s = Spec(hips=[(-0.064 * S, 0.155 * S), (0.064 * S, 0.155 * S), (-0.064 * S, -0.155 * S), (0.064 * S, -0.155 * S)],
             leg_top_f=0.44 * S, leg_top_h=0.46 * S, leg_t=leg_t * S, hoof_h=0.03 * S)
    legs4(lambda part, x, y, z: paint(part, x / S, y / S, z / S), s, hoof, cloven=tail == 'deer', feather=feather)
    if size != 1.0:
        scale_all(size)
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


def appaloosa():
    def body(x, y, z):
        # a white blanket over the hindquarters, spotted with dark, on a dark bay forehand
        if z < 0.02 + noise(x, y, 0, 15) * 0.04 and y > 0.42:
            return '#3a2a22' if noise(x, y, z, 70) > 0.4 else '#efe9df'
        return '#6a4a36' if noise(x, y, z, 60) < 0.3 else '#7a5a44'
    equid('appaloosa', coat(body, {'mane': '#4a403a', 'tail': '#4a403a', 'muzzle': '#5a4a44', 'blaze': '#efe9df', 'head': '#6a4a36',
                                   'ear': '#6a4a36', 'leg': lambda x, y, z: '#3a2e28' if y < 0.2 else '#6a4a36'}))


def clydesdale():
    bay = '#6b3a1e'
    equid('clydesdale', coat(bay, {'mane': '#1c1612', 'tail': '#1c1612', 'muzzle': '#d8b0a8', 'blaze': '#f3efe6',
                                   'leg': lambda x, y, z: '#f3efe6' if y < 0.16 else bay}), size=1.12, feather='#f3efe6', leg_t=0.04)


def friesian():
    equid('friesian', coat('#161412', {'mane': '#0e0c0b', 'tail': '#0e0c0b', 'muzzle': '#2a2624', 'blaze': '#161412'}),
          feather='#161412')


def palomino():
    gold = '#d8a652'
    equid('palomino', coat(gold, {'mane': '#f4ecd8', 'tail': '#f4ecd8', 'muzzle': '#c8a080', 'blaze': '#f6f0e2',
                                  'leg': lambda x, y, z: '#f6f0e2' if y < 0.09 else gold}))


def pony():
    chestnut = '#8e4c26'
    equid('pony', coat(chestnut, {'mane': '#ead4a2', 'tail': '#ead4a2', 'muzzle': '#c8a088', 'blaze': '#f2ecdf',
                                  'leg': lambda x, y, z: '#f2ecdf' if y < 0.09 and x < 0 else chestnut}), size=0.72, leg_t=0.04,
          face=0.9)


def mule():
    brown, pale = '#5c3c28', '#cdb49a'
    equid('mule', coat(brown, {'mane': '#2a1c14', 'tail': '#2a1c14', 'muzzle': pale, 'blaze': brown,
                               'body': lambda x, y, z: pale if y < 0.42 else brown, 'ear': '#3a2a20',
                               'leg': lambda x, y, z: '#3a2a20' if y < 0.1 else brown}), ears='long', tail='tuft', size=0.92)


# ---------------------------------------------------------------- deer (on the horse's frame, slimmer)

def elk():
    tan_c, dark_c = '#b48a58', '#4e3524'

    def body(x, y, z):
        if z > 0.17:
            return dark_c                                        # the dark shaggy neck
        if z < -0.2 and y > 0.42:
            return '#ecdcbc'                                     # the pale rump patch
        return tan_c

    def antlers(hx, hy, hz):
        for sx in (-1, 1):
            beam = [(hx + sx * 0.05, hy + 0.14, hz - 0.05), (hx + sx * 0.08, hy + 0.22, hz - 0.1), (hx + sx * 0.09, hy + 0.3, hz - 0.12),
                    (hx + sx * 0.08, hy + 0.37, hz - 0.1)]
            tines = [(1, (0, 0.3, 1), 0.07), (2, (0, 0.4, 1), 0.08), (3, (0.2, 0.6, 1), 0.06), (4, (0.1, 1, 0.3), 0.04)]
            antler(sx, 1.0, (hx + sx * 0.02, hy + 0.05, hz), beam, tines, r0=0.01)
    equid('elk', coat(body, {'mane': dark_c, 'tail': '#ecdcbc', 'muzzle': '#2a201a', 'blaze': dark_c, 'head': dark_c, 'ear': dark_c,
                             'leg': dark_c}), mane=False, tail='deer', ears='deer', slim=0.85, head_extra=antlers, size=1.1, leg_t=0.028,
          hoof='#1e1814')


def reindeer():
    grey, pale = '#7a6c5e', '#e6ddd0'

    def body(x, y, z):
        return pale if (z > 0.18 or y < 0.42) else grey          # the pale neck, mane and belly

    def antlers(hx, hy, hz):
        for sx in (-1, 1):
            beam = [(hx + sx * 0.06, hy + 0.12, hz - 0.08), (hx + sx * 0.08, hy + 0.2, hz - 0.08), (hx + sx * 0.06, hy + 0.28, hz - 0.02),
                    (hx + sx * 0.03, hy + 0.3, hz + 0.04)]
            tines = [(1, (0, 0.2, 1), 0.06), (2, (0.3, 0.5, -0.3), 0.05), (3, (0.2, 0.7, -0.2), 0.05)]
            antler(sx, 1.0, (hx + sx * 0.02, hy + 0.05, hz), beam, tines, r0=0.009, col='#d8ccb4')
    equid('reindeer', coat(body, {'mane': pale, 'tail': pale, 'muzzle': '#a89c90', 'blaze': grey, 'head': grey, 'ear': grey,
                                  'leg': lambda x, y, z: pale if y < 0.06 else '#5a4e42'}), mane=False, tail='deer', ears='deer', slim=0.9,
          head_extra=antlers, size=0.85, leg_t=0.032, hoof='#2a2420')


def spotted_deer():
    rufous, white = '#b0602a', '#f4ecdc'

    def body(x, y, z):
        if y < 0.42:
            return white
        return white if noise(x, y, z, 60) > 0.45 else rufous     # the chital's white spots

    def antlers(hx, hy, hz):
        for sx in (-1, 1):
            beam = [(hx + sx * 0.04, hy + 0.14, hz - 0.04), (hx + sx * 0.06, hy + 0.22, hz - 0.06), (hx + sx * 0.05, hy + 0.3, hz - 0.03)]
            tines = [(1, (0, 0.3, 1), 0.05), (3, (0.3, 0.3, 1), 0.035)]
            antler(sx, 1.0, (hx + sx * 0.02, hy + 0.05, hz), beam, tines, r0=0.008, col='#c8b490')
    equid('spotted_deer', coat(body, {'mane': rufous, 'tail': white, 'muzzle': '#2a201a', 'blaze': rufous, 'head': rufous,
                                      'ear': rufous, 'leg': rufous}),
          mane=False, tail='deer', ears='deer', slim=0.78, head_extra=antlers, size=0.72, leg_t=0.026, hoof='#2a2420')


def moose():
    brown = '#3b2a1f'

    def antlers(hx, hy, hz):
        pal = pm('ms_palm', '#b8a488', '#d0bea0', scale=40)
        for sx in (-1, 1):
            # the broad palmate antler: a flat palm spreading out sideways with points round its edge
            b = Blob(0.0022)
            b.cap((hx + sx * 0.02, hy + 0.05, hz), (hx + sx * 0.07, hy + 0.08, hz - 0.01), 0.012, 0.01)
            for k in range(8):
                u = k / 7
                b.ell((hx + sx * (0.08 + u * 0.11), hy + 0.08 + math.sin(u * math.pi) * 0.05, hz - 0.02 + (u - 0.5) * 0.07), 0.04, 0.007, 0.045)
            for k in range(9):
                u = k / 8
                x0 = hx + sx * (0.1 + u * 0.1)
                z0 = hz - 0.06 + u * 0.09
                b.cap((x0, hy + 0.1 + math.sin(u * math.pi) * 0.04, z0), (x0 + sx * 0.02, hy + 0.15 + math.sin(u * math.pi) * 0.05, z0 - 0.01), 0.006, 0.002)
            b.build(pal, 900)
        # the bell hanging under the throat
        bl = Blob(0.002)
        bl.cap((hx, hy - 0.07, hz + 0.03), (hx, hy - 0.15, hz + 0.02), 0.013, 0.006)
        bl.build(cm(brown), 120)

    def withers(b):
        b.ell((0, 0.62, 0.12), 0.07, 0.07, 0.1)                 # the humped shoulders
    equid('moose', coat(brown, {'mane': '#2a1d15', 'tail': brown, 'muzzle': '#4a3a30', 'blaze': brown, 'ear': brown,
                                'leg': lambda x, y, z: '#8e7f70' if y < 0.28 else brown}), mane=False, tail='deer', ears='deer',
          head_extra=antlers, body_extra=withers, size=1.25, face=1.25, leg_t=0.032, hoof='#2a221c')


# ---------------------------------------------------------------- sheep

def ovis(kind, wool, paint, size=1.0, curl=0.03, curls=170, horns=None, long_wool=False, hoof='#1a1614'):
    """A sheep: a deep, square body in a fleece of curls (or long locks), a bare face and ears,
    slim legs. `wool(x, y, z)` gives the fleece colour, `paint(part, x, y, z)` the rest (head,
    face, ear, leg, nose)."""
    b = Blob(0.006)
    b.ell((0, 0.28, 0.0), 0.12, 0.105, 0.16)
    b.ell((0, 0.25, 0.0), 0.11, 0.09, 0.15)
    b.cap((0, 0.3, 0.12), (0, 0.33, 0.18), 0.07, 0.055)          # the neck, all fleece
    b.build(lambda x, y, z: cm(wool(x, y, z), scale=120), 2500)
    # the fleece: a coat of close curls all over, or long wavy locks hanging down
    f = Blob(0.004)
    ga = math.pi * (3 - math.sqrt(5))
    for i in range(curls):
        yv = 1 - 2 * (i + 0.5) / curls
        if yv < -0.6:
            continue
        rad = math.sqrt(1 - yv * yv)
        a = ga * i
        p = (math.cos(a) * rad * 0.118, 0.28 + yv * 0.104, math.sin(a) * rad * 0.158)
        r = curl + 0.2 * curl * math.sin(i * 1.3)
        if long_wool and yv < 0.5:
            f.cap(p, (p[0] * 1.12, p[1] - 0.05, p[2]), r, r * 0.7)
        else:
            f.ball(p, r)
    for k in range(10):
        u = k / 9
        f.ball((0, 0.3 + u * 0.035, 0.12 + u * 0.06), 0.05)    # fleece round the neck
    f.build(lambda x, y, z: cm(wool(x, y, z), scale=140), 3400)
    hx, hy, hz = 0, 0.34, 0.19
    with anim_group('head', B(hx, hy, hz)):
        h = Blob(0.003)
        h.ball((0, 0.35, 0.21), 0.04)
        h.cap((0, 0.345, 0.225), (0, 0.3, 0.29), 0.036, 0.024)  # the long Roman nosed face
        h.ell((0, 0.29, 0.295), 0.022, 0.022, 0.02)
        for sx in (-1, 1):
            h.ell((sx * 0.01, 0.293, 0.312), 0.005, 0.006, 0.005, neg=True)
        h.build(lambda x, y, z: cm(paint('nose' if z > 0.3 and y < 0.3 else ('face' if z > 0.24 else 'head'), x, y, z), scale=80), 1200)
        tk = Blob(0.003)
        tk.ell((0, 0.385, 0.2), 0.04, 0.022, 0.035)              # the wool on the poll
        tk.build(lambda x, y, z: cm(wool(x, y, z), scale=140), 300)
        for sx in (-1, 1):
            e = Blob(0.002)
            e.cap((sx * 0.035, 0.365, 0.2), (sx * 0.085, 0.355, 0.19), 0.013, 0.01)   # ears out sideways
            e.build(by(paint, 'ear'), 150)
        if horns:
            horns()
    eye_mark((0.028, 0.36, 0.235), 0.009, 0.85)
    with anim_group('tail', B(0, 0.32, -0.16)):
        t = Blob(0.003)
        t.cap((0, 0.32, -0.16), (0, 0.24, -0.18), 0.022, 0.016)
        t.build(lambda x, y, z: cm(wool(x, y, z), scale=140), 150)
    s = Spec(hips=[(-0.055, 0.1), (0.055, 0.1), (-0.055, -0.1), (0.055, -0.1)], leg_top_f=0.2, leg_top_h=0.21, leg_t=0.021,
             hoof_h=0.02)
    legs4(paint, s, hoof)
    if size != 1.0:
        scale_all(size)
    finish(f'animal_{kind}', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.1)


def ram_horns(r0=0.013, turns=1.5, col='#d8ccb4', tip='#8a7a64', out=0.0):
    """A pair of spiral ram's horns curling round beside the ears."""
    for sx in (-1, 1):
        pts = []
        for k in range(16):
            u = k / 15
            a = u * math.pi * 2 * turns * 0.5
            r = 0.045 * (1 - u * 0.35)
            pts.append((sx * (0.035 + u * 0.03 + out * u), 0.37 + math.cos(a) * r - 0.01, 0.2 - math.sin(a) * r * 0.9))
        horn_path(pts, r0, r0 * 0.3, pm('rh_' + col[1:], col, rough=0.5), pm('rt_' + tip[1:], tip, rough=0.5), faces=300)


def sheep():
    """A Suffolk ewe: cream fleece, a bare black face and ears, black legs."""
    ovis('sheep', lambda x, y, z: '#f1ebdd', coat('#221e1c', {'nose': '#3a3230'}))


def suffolk_sheep():
    ovis('suffolk_sheep', lambda x, y, z: '#ece4d2', coat('#1c1917', {'nose': '#2e2826'}), size=1.08)


def dorper():
    def wool(x, y, z):
        return '#1c1a18' if z > 0.13 + noise(x, y, 0, 20) * 0.02 else '#f2ede2'   # a black head and neck on a white body
    ovis('dorper', wool, coat('#1c1a18', {'leg': '#ece6da', 'nose': '#2a2624'}), curl=0.026)


def black_sheep():
    ovis('black_sheep', lambda x, y, z: '#2c2826' if noise(x, y, z, 60) < 0.3 else '#383230', coat('#1a1816', {'nose': '#2a2624'}))


def karakul():
    ovis('karakul', lambda x, y, z: '#3c3836' if noise(x, y, z, 160) < 0.25 else '#5c5652', coat('#2a2624', {'nose': '#3a3432'}),
         curl=0.02, curls=320)


def merino_sheep():
    white = '#f0e9da'
    ovis('merino_sheep', lambda x, y, z: white, coat(white, {'nose': '#e8b8ae', 'face': '#f2ece2', 'head': white, 'leg': '#eee6d8'}),
         curl=0.024, curls=300, horns=lambda: ram_horns(r0=0.012, turns=1.6, col='#e0d4bc', tip='#b8a888'))


def valais_blacknose():
    white, black = '#f3eee4', '#1a1816'

    def leg(x, y, z):
        return black if (0.1 < y < 0.14 or y < 0.05) else white   # black knees and feet
    ovis('valais_blacknose', lambda x, y, z: white if noise(x, y * 3, z, 80) < 0.3 else '#e4dccd',
         coat(black, {'leg': leg}), long_wool=True, curl=0.034,
         horns=lambda: ram_horns(r0=0.013, turns=1.4, col='#d8ccb4', tip='#8a7a64', out=0.02))


def shetland_sheep():
    ovis('shetland_sheep', lambda x, y, z: '#6e4b32' if noise(x, y, z, 60) < 0.3 else '#7a5638', coat('#5a3e2a', {'nose': '#3a2a20'}),
         size=0.86)


def jacob_sheep():
    white, spot = '#f2ede3', '#2e2420'

    def wool(x, y, z):
        return spot if noise(x + 4, y, z, 8) > 0.25 else white

    def face(x, y, z):
        return white if abs(x) < 0.012 else spot                 # the white blaze

    def horns():
        for sx in (-1, 1):
            # four horns: a pair sweeping up and back, a pair curling down the sides
            up = curve((sx * 0.018, 0.395, 0.2), (sx * 0.04, 0.47, 0.17), (sx * 0.07, 0.48, 0.11), 8)
            horn_path(up, 0.012, 0.004, pm('jb_horn', '#4a3e34'), pm('jb_tip', '#2a221c'))
        ram_horns(r0=0.012, turns=1.2, col='#4a3e34', tip='#2a221c')
    ovis('jacob_sheep', wool, coat(spot, {'face': face, 'leg': lambda x, y, z: white if noise(x, y, z, 30) > 0 else spot}),
         horns=horns)


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


def camel(kind='camel', paint=None, humps=1, size=1.0, shaggy=None):
    """A dromedary: a single tall hump, a long curved neck, a long head with droopy lips and small
    ears, long thin legs with knobbly knees and broad pads, a thin tufted tail. The bactrian has
    two humps and a shaggy winter coat on them, the throat and the forelegs."""
    def camel_paint(part, x, y, z):
        if part == 'pad':
            return '#5a4636'
        if part == 'hump' and y > 0.76:
            return '#9a7446'
        if part == 'leg' and y < 0.06:
            return '#8a6a48'
        return '#c49a62' if noise(x, y, z, 30) < 0.35 else '#c8a068'
    paint = paint or camel_paint
    b = Blob(0.006)
    b.ell((0, 0.570, 0.0), 0.09, 0.1, 0.19)
    b.ball((0, 0.550, 0.14), 0.095)
    b.ball((0, 0.570, -0.13), 0.09)
    b.ell((0, 0.510, 0.02), 0.08, 0.06, 0.14)
    b.cap((0, 0.560, 0.19), (0, 0.490, 0.3), 0.06, 0.045)          # the neck, down and forward
    b.cap((0, 0.490, 0.3), (0, 0.670, 0.37), 0.045, 0.036)         # and up again to the head
    if humps == 1:
        b.ell((0, 0.69, -0.01), 0.075, 0.1, 0.1)                 # the hump, grown out of the back
    else:
        for z in (0.08, -0.09):
            b.ell((0, 0.66, z), 0.065, 0.085, 0.065)             # two humps
    hm = hair(shaggy) if shaggy else None

    def body(x, y, z):
        if hm and (y > 0.71 or (z > 0.26 and y < 0.62)):
            return hm                                            # long hair on the humps and the throat
        return by(paint, 'hump' if y > 0.72 else 'body')(x, y, z)
    b.build(body, 5000)
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
    if size != 1.0:
        scale_all(size)
    finish(f'animal_{kind}', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.12)


def bactrian_camel():
    fawn = '#9c7a4e'

    def paint(part, x, y, z):
        if part == 'pad':
            return '#4a3a2c'
        if part == 'head' and z > 0.46:
            return '#4a3a2c'
        if part == 'leg' and y > 0.34:
            return '#6a4a2c'                                     # the hairy tops of the forelegs
        return fawn
    camel('bactrian_camel', paint, humps=2, shaggy='#6a4a2c', size=1.02)


def alpaca(kind='alpaca', fleece_fn=None, head='#e0cdae', size=1.0, ears='spear', fluff=1.0):
    """An alpaca in full fleece: a fluffy body, a long upright neck, a small head with a woolly
    topknot and spear shaped ears, slim legs on soft pads. The llama is bigger, with a shorter
    coat and long curved banana ears; the vicuna finer and short coated."""
    fleece_fn = fleece_fn or (lambda x, y, z: '#ecdcc0')

    def paint(part, x, y, z):
        if part == 'pad':
            return '#3a2e26'
        if part == 'head':
            return head(x, y, z) if callable(head) else head
        return fleece_fn(x, y, z)
    b = Blob(0.005)
    b.ell((0, 0.360, 0.0), 0.09, 0.09, 0.16)
    b.cap((0, 0.390, 0.12), (0, 0.580, 0.17), 0.058, 0.045)        # the long upright neck
    if fluff < 0.8:
        # a short coat: the body itself a little fuller, no locks of fleece
        b.ell((0, 0.36, 0.0), 0.1, 0.1, 0.17)
        b.cap((0, 0.39, 0.12), (0, 0.58, 0.17), 0.064, 0.05)
    b.build(by(paint, 'body'), 3200)
    f = Blob(0.004)
    ga = math.pi * (3 - math.sqrt(5))
    for i in range(130 if fluff >= 0.8 else 0):
        yv = 1 - 2 * (i + 0.5) / 130
        rad = math.sqrt(1 - yv * yv)
        a = ga * i
        f.ball((math.cos(a) * rad * 0.09, 0.36 + yv * 0.09, math.sin(a) * rad * 0.16), 0.03 * fluff)
    for k in range(12 if fluff >= 0.8 else 0):
        u = k / 11
        for sx in (-1, 1):
            f.ball((sx * 0.02, 0.4 + u * 0.17, 0.13 + u * 0.04), 0.035 * fluff)
    if fluff >= 0.8:
        f.build(lambda x, y, z: cm(fleece_fn(x, y, z), scale=130), 3200)
    hx, hy, hz = 0, 0.59, 0.17
    with anim_group('head', B(hx, hy, hz)):
        h = Blob(0.0025)
        h.ball((0, 0.622, 0.192), 0.04)
        h.cap((0, 0.616, 0.205), (0, 0.596, 0.25), 0.03, 0.024)
        h.ell((0, 0.59, 0.252), 0.022, 0.02, 0.016)
        h.build(by(paint, 'head'), 1000)
        tk = Blob(0.003)
        tk.ell((0, 0.658, 0.182), 0.044, 0.032, 0.04)             # the woolly topknot
        tk.build(lambda x, y, z: cm(fleece_fn(x, y, z), scale=130), 300)
        for sx in (-1, 1):
            e = Blob(0.0015)
            if ears == 'banana':
                # the llama's tall ears, curving in at the tips
                pts = curve((sx * 0.024, 0.66, 0.18), (sx * 0.045, 0.72, 0.17), (sx * 0.03, 0.77, 0.19), 6)
                for k in range(len(pts) - 1):
                    e.cap(pts[k], pts[k + 1], 0.011 - k * 0.0012, 0.01 - k * 0.0012)
            else:
                e.cap((sx * 0.026, 0.66, 0.178), (sx * 0.036, 0.72, 0.17), 0.011, 0.003)    # spear shaped ears
            e.build(by(paint, 'head'), 160)
    eye_mark((0.027, 0.625, 0.21), 0.01, 0.85)
    for i, (x, z) in enumerate([(-0.05, 0.1), (0.05, 0.1), (-0.05, -0.1), (0.05, -0.1)]):
        top = 0.3
        with anim_group(f'leg{i}', B(x, top, z)):
            pad_leg(paint, x, z, top, z > 0, 0.023)
    with anim_group('tail', B(0, 0.390, -0.16)):
        t = Blob(0.003)
        t.ell((0, 0.360, -0.17), 0.025, 0.04, 0.022)
        t.build(lambda x, y, z: cm(fleece_fn(x, y, z), scale=130), 150)
    if size != 1.0:
        scale_all(size)
    finish(f'animal_{kind}', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.1)


def llama():
    def patches(x, y, z):
        return '#7a4a2c' if noise(x + 1, y, z, 7) > 0.22 else '#f1ebe0'
    alpaca('llama', patches, head=patches, size=1.28, ears='banana', fluff=0.7)


def vicuna():
    def fleece(x, y, z):
        if y < 0.3 or (z > 0.1 and y < 0.52 and abs(x) < 0.05):
            return '#f5eee2'                                     # white belly and the long bib on the chest
        return '#c69662'
    alpaca('vicuna', fleece, head='#c69662', size=0.95, fluff=0.55)


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


def yak(kind='yak', paint=None, skirt='#1e1a18', skirt_low=0.29, hump=1.0, horns=None, head_extra=None, body_extra=None,
        tail_col='#1e1a18', size=1.0, hoof='#2a2420'):
    """A yak: a big humped shoulder, a coat of long hair hanging almost to the ground from its
    flanks and chest, a bushy tail, a broad head with upswept horns; black with a white muzzle.
    The bison and the musk ox are built on the same heavy frame."""
    def yak_paint(part, x, y, z):
        if part == 'muzzle':
            return '#e8e2d8'
        return '#1e1a18' if noise(x, y, z, 40) < 0.3 else '#2a2420'
    paint = paint or yak_paint
    b = Blob(0.006)
    b.ell((0, 0.38, 0.0), 0.12, 0.11, 0.22)
    b.ell((0, 0.46, 0.1), 0.1 * hump, 0.1 * hump, 0.1 * hump)    # the high humped shoulders
    b.cap((0, 0.4, 0.18), (0, 0.38, 0.26), 0.08, 0.065)
    if skirt:
        # the long skirt of hair hanging from the flanks and chest, part of the same shaggy coat
        b.ell((0, skirt_low, 0.0), 0.125, 0.1 + (0.29 - skirt_low) * 0.8, 0.21)
        b.ell((0, skirt_low - 0.01, 0.14), 0.1, 0.1 + (0.29 - skirt_low) * 0.8, 0.07)
    if body_extra:
        body_extra(b)
    sk = hair(skirt) if skirt else None
    b.build(lambda x, y, z: sk if (sk and y < 0.33) else by(paint, 'body')(x, y, z), 5000)
    hx, hy, hz = 0, 0.38, 0.27
    with anim_group('head', B(hx, hy, hz)):
        h = bovine_head(paint, hx, hy, hz, L=0.11, W=0.058, low=0.03)
        h.build(lambda x, y, z: by(paint, 'muzzle')(x, y, z) if z > 0.36 else by(paint, 'head')(x, y, z), 1800)
        if horns:
            horns(hx, hy, hz)
        else:
            horns_pair(lambda sx: curve((sx * 0.045, hy + 0.06, hz + 0.02), (sx * 0.12, hy + 0.07, hz + 0.01), (sx * 0.11, hy + 0.16, hz + 0.02), 8),
                       0.016, 0.004, '#e8e0cc', '#5a5046')
        if head_extra:
            head_extra(hx, hy, hz)
        for sx in (-1, 1):
            e = Blob(0.002)
            e.ell((sx * 0.065, hy + 0.02, hz + 0.02), 0.022, 0.01, 0.014)
            e.build(by(paint, 'head'), 100)
    eye_mark((0.045, hy + 0.02, hz + 0.075), 0.011, 0.85)
    with anim_group('tail', B(0, 0.44, -0.22)):
        t = Blob(0.004)
        t.cap((0, 0.44, -0.22), (0, 0.24, -0.25), 0.03, 0.04)   # the bushy tail
        t.build(hair(tail_col), 400)
    s = Spec(hips=[(-0.075, 0.14), (0.075, 0.14), (-0.075, -0.14), (0.075, -0.14)], leg_top_f=0.24, leg_top_h=0.25, leg_t=0.034,
             hoof_h=0.026)
    legs4(paint, s, hoof)
    if size != 1.0:
        scale_all(size)
    finish(f'animal_{kind}', tex=1024, vivid=1.06, ao_min=0.6, ao_dist=0.12)


def bison():
    cape, dark = '#6a4a2c', '#3a2818'

    def paint(part, x, y, z):
        if part == 'leg':
            return '#1a1410' if y < 0.08 else dark
        if part in ('head', 'muzzle'):
            return '#2e2016' if part == 'head' else '#1a1410'
        return cape if z > 0.02 + noise(x, y, 0, 15) * 0.03 else dark   # the woolly cape over the forequarters

    def cape_wool(b):
        # the great hump and the thick wool round the shoulders and chest
        b.ell((0, 0.52, 0.1), 0.1, 0.1, 0.12)
        b.ell((0, 0.4, 0.13), 0.13, 0.13, 0.12)
        b.ell((0, 0.3, 0.2), 0.08, 0.1, 0.06)

    def horns(hx, hy, hz):
        horns_pair(lambda sx: curve((sx * 0.05, hy + 0.05, hz + 0.02), (sx * 0.1, hy + 0.05, hz + 0.02), (sx * 0.1, hy + 0.1, hz + 0.04), 6),
                   0.015, 0.004, '#2a2420', '#141210', faces=200)

    def beard(hx, hy, hz):
        bd = Blob(0.003)
        bd.cap((hx, hy - 0.08, hz + 0.08), (hx, hy - 0.16, hz + 0.07), 0.025, 0.01)
        bd.ell((hx, hy + 0.065, hz + 0.02), 0.05, 0.035, 0.045)   # the woolly topknot
        bd.build(hair('#4a3420'), 600)
    yak('bison', paint, skirt=None, hump=1.2, horns=horns, head_extra=beard, body_extra=cape_wool, tail_col='#2a1c12', size=1.05,
        hoof='#1a1410')


def musk_ox():
    brown = '#3a2a1e'

    def paint(part, x, y, z):
        if part == 'body' and y > 0.47 and -0.08 < z < 0.1:
            return '#c8b89a'                                     # the pale saddle
        if part == 'leg' and y < 0.1:
            return '#e0d6c4'                                     # pale stockings
        if part == 'muzzle':
            return '#5a4a3a'
        return brown

    def horns(hx, hy, hz):
        # the boss across the brow, the horns sweeping down past the eyes and up at the tips
        horns_pair(lambda sx: curve((sx * 0.012, hy + 0.07, hz + 0.02), (sx * 0.14, hy + 0.06, hz + 0.0), (sx * 0.12, hy - 0.04, hz + 0.08), 10)
                   + [(sx * 0.14, hy - 0.01, hz + 0.11)], 0.024, 0.006, '#d8ccb4', '#2a2420', faces=400)
    yak('musk_ox', paint, skirt=brown, skirt_low=0.22, hump=0.9, horns=horns, tail_col=brown, size=0.95)


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


def gobbler(kind='gobbler', dark='#3a2a1a', light='#5a4020', band='#4e3620', fan_col='#6a4a2a'):
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
            return fan_col if math.sin(r * 160) > 0 else band
        if part == 'wing':
            return dark if math.sin(z * 120) > 0 else '#e8e0d0'   # the barred flight feathers
        return dark if noise(x, y, z, 120) < 0.2 else light      # bronze sheen
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
    finish(f'animal_{kind}', tex=1024, vivid=1.06, ao_min=0.62, ao_dist=0.06)


def bronze_turkey():
    # the Bronze: copper and bronze sheen, a chestnut fan with a black band and white tips
    gobbler('bronze_turkey', dark='#4a3018', light='#8a6030', band='#6a4a2a', fan_col='#8a5a30')


def ostrich(kind='ostrich', body='#141212', plume='#f4f2ee', neck='#d8a8a0', head='#b8a8a0', leg='#d8a8a0', size=1.0, shaggy=False,
            head_extra=None):
    """A cock ostrich: a big body of black plumage with white wing and tail plumes, a long bare
    neck, a small flat head with big eyes, and powerful bare legs on two toes. The emu, rhea and
    cassowary share its frame: shaggy brown, grey or black plumage and their own heads and necks."""
    b = Blob(0.006)
    b.ell((0, 0.7, -0.02), 0.16, 0.13, 0.21)
    b.ell((0, 0.68, 0.1), 0.12, 0.1, 0.1)
    for sx in (-1, 1):
        b.ell((sx * 0.14, 0.68, -0.1), 0.04, 0.08, 0.12)        # the white wing plumes, drooping
    b.ell((0, 0.72, -0.23), 0.09, 0.08, 0.06)                    # and the tail plume
    white = cm(plume, scale=120)
    feathers = hair(body) if shaggy else cm(body, scale=90)
    b.build(lambda x, y, z: white if (z < -0.2 or (abs(x) > 0.12 and z < -0.04)) else feathers, 3400)
    with anim_group('head', B(0, 0.78, 0.13)):
        n = Blob(0.003)
        n.cap((0, 0.76, 0.14), (0, 0.95, 0.16), 0.042, 0.026)
        n.cap((0, 0.95, 0.16), (0, 1.08, 0.18), 0.026, 0.02)
        n.ell((0, 1.1, 0.2), 0.024, 0.02, 0.03)                  # the small flat head
        n.build(lambda x, y, z: cm(neck(x, y, z) if callable(neck) else neck, scale=80) if y < 0.83
                else cm(head(x, y, z) if callable(head) else head, scale=80), 1200)
        bk = Blob(0.0015)
        bk.ell((0, 1.095, 0.235), 0.014, 0.006, 0.02)
        bk.build(pm('os_beak', '#e0c8a8'), 80)
        if head_extra:
            head_extra()
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
            lg.build(lambda px, py, pz: cm(leg, scale=80), 600)
    if size != 1.0:
        scale_all(size)
    finish(f'animal_{kind}', tex=1024, vivid=1.06, ao_min=0.62, ao_dist=0.08)


def emu():
    ostrich('emu', body='#6a5a48', plume='#6a5a48', neck='#5a6a8a', head='#4a5a78', leg='#6a6660', size=0.82, shaggy=True)


def rhea():
    ostrich('rhea', body='#9a948c', plume='#b4aea6', neck=lambda x, y, z: '#2a2826' if y < 0.86 else '#aaa49c', head='#aaa49c',
            leg='#8a847a', size=0.76, shaggy=True)


def cassowary():
    def extra():
        # the tall horny casque and the red wattles down the throat
        c = Blob(0.0018)
        c.cap((0, 1.12, 0.195), (0, 1.19, 0.18), 0.016, 0.009)
        c.build(pm('cs_casque', '#a8845a', '#c09a6a', scale=40), 200)
        w = Blob(0.0015)
        for sx in (-1, 1):
            w.ell((sx * 0.01, 1.03, 0.2), 0.008, 0.03, 0.007)
        w.build(pm('cs_wattle', '#d82a22'), 120)
    ostrich('cassowary', body='#141212', plume='#141212', neck=lambda x, y, z: '#d8302a' if y < 0.9 else '#2a6ab8', head='#2a6ab8',
            leg='#6a6a60', size=0.88, shaggy=True, head_extra=extra)


def peacock(kind='peacock', white=False):
    """A peacock: a shining blue neck and breast, a bronze green back, barred brown wings, and a
    fan shaped crest. Its long train of eyed feathers trails behind (`train`), and it can raise it
    into the great upright fan of its display (`fan`, built open; the game folds it away and
    raises it now and then). The white peacock is the same bird all in white."""
    def paint(part, x, y, z):
        if white:
            return '#f6f5f0' if part not in ('wing',) else '#ecebe4'
        if part == 'fan':
            # an eye near the end of each feather, and a second row of them further in
            ang = math.atan2(x, max(1e-4, y - 0.2))
            r = math.hypot(x, y - 0.2)
            best = 1.0
            for row, frac, off in ((0, 0.86, 0.0), (1, 0.6, 0.5)):
                k = round(ang / (math.pi * 1.05 / 30) - off)
                a = (k + off) * math.pi * 1.05 / 30
                L = (0.36 - abs(a) * 0.05) * frac
                best = min(best, math.hypot(x - math.sin(a) * L, (y - 0.2) - math.cos(a) * L) / (1.0 if row == 0 else 0.8))
            if best < 0.012:
                return '#141a4a'
            if best < 0.018:
                return '#2a8a8a'
            if best < 0.026:
                return '#c8a030'
            return '#3a7a3a' if r > 0.12 else '#2a6a4a'
        if part == 'train':
            # the eyes down the folded train
            u = (-z - 0.1) / 0.04
            d = math.hypot((u - round(u)) * 0.04, (x - round(x / 0.02) * 0.02))
            if -z > 0.18 and d < 0.006:
                return '#141a4a'
            if -z > 0.18 and d < 0.01:
                return '#c8a030'
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
    with anim_group('train', B(0, 0.2, -0.07)):
        tr = Blob(0.003)
        for k in range(7):
            x = (k - 3) * 0.01
            tr.cap((x * 0.5, 0.2, -0.07), (x * 1.8, 0.1, -0.22), 0.022, 0.02)
            tr.cap((x * 1.8, 0.1, -0.22), (x * 1.2, 0.015, -0.42), 0.02, 0.008)
        tr.build(by(paint, 'train'), 2000)
    with anim_group('fan', B(0, 0.2, -0.07)):
        # the display: some thirty feathers raised in a half wheel behind the bird, each a quill
        # widening to a rounded vane with its eye near the tip
        fn = Blob(0.0022)
        for k in range(31):
            a = (k / 30 - 0.5) * math.pi * 1.05
            d = (math.sin(a), math.cos(a))
            L = 0.36 - abs(a) * 0.05
            base = (d[0] * 0.03, 0.2 + d[1] * 0.03, -0.075)
            mid = (d[0] * L * 0.55, 0.2 + d[1] * L * 0.55, -0.09)
            tip = (d[0] * L, 0.2 + d[1] * L, -0.1)
            fn.cap(base, mid, 0.008, 0.016)
            fn.cap(mid, tip, 0.016, 0.022)
        fn.build(by(paint, 'fan'), 12000)
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
        cr.build(pm('pc_crest_w' if white else 'pc_crest', '#f0efe8' if white else '#1e4ab0'), 200)
    eye_mark((0.011, 0.337, 0.103), 0.004, 1.0)
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'leg{i}', B(sx * 0.024, 0.13, 0.0)):
            bird_leg(sx * 0.024, 0.14, 0.0, 0.006, '#b8b4ae' if white else '#8a8684')
    finish(f'animal_{kind}', tex=1024, vivid=1.06, ao_min=0.62, ao_dist=0.06)


def white_peacock():
    peacock('white_peacock', white=True)


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


def duck(kind='duck', paint=None, bill='#e8c040', size=1.0, curl='#141414', extra=None):
    """A mallard drake afloat: a glossy green head, a thin white collar, a chestnut breast, pale
    grey flanks, a black stern with the curled tail feathers, a yellow bill and the blue wing
    patch. The domestic breeds are the same bird in their own colours."""
    def mallard(part, x, y, z):
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
    paint = paint or mallard
    b = Blob(0.003)
    b.ell((0, 0.08, -0.01), 0.07, 0.05, 0.12)
    b.ball((0, 0.09, 0.07), 0.055)
    b.ell((0, 0.11, -0.1), 0.04, 0.03, 0.05)
    b.cap((0, 0.12, 0.08), (0, 0.16, 0.1), 0.036, 0.028)
    b.build(by(paint, 'body'), 1800)
    if curl:
        c = Blob(0.001)
        c.cap((0, 0.135, -0.13), (0, 0.16, -0.12), 0.004, 0.002)  # the curled drake feathers
        c.build(pm('dk_curl' + curl[1:], curl), 50)
    if extra:
        extra()
    with anim_group('head', B(0, 0.15, 0.085)):
        h = Blob(0.0015)
        h.ball((0, 0.18, 0.105), 0.028)
        h.build(by(paint, 'head'), 600)
        bl = Blob(0.0012)
        bl.cap((0, 0.172, 0.128), (0, 0.162, 0.16), 0.011, 0.008)
        bl.build(pm('dk_bill' + bill[1:], bill), 120)
    eye_mark((0.02, 0.187, 0.12), 0.005, 1.0)
    if size != 1.0:
        scale_all(size)
    finish(f'animal_{kind}', tex=512, vivid=1.06, ao_min=0.65, ao_dist=0.04)


def pekin_duck():
    duck('pekin_duck', lambda part, x, y, z: '#f7f2e4', bill='#f0a23a', size=1.12, curl='#f7f2e4')


def call_duck():
    duck('call_duck', lambda part, x, y, z: '#f8f5ee', bill='#f2b04a', size=0.74, curl='#f8f5ee')


def khaki_campbell():
    def paint(part, x, y, z):
        if part == 'head' or (part == 'body' and y > 0.145 and z > 0.08):
            return '#4c5236'                                     # the bronze green head
        return '#a8875a' if noise(x, y, z, 60) < 0.3 else '#b09060'
    duck('khaki_campbell', paint, bill='#4e5a36', curl='#4c5236')


def muscovy_duck():
    def paint(part, x, y, z):
        if part == 'head':
            return '#f4f2ec' if noise(x, y, z, 30) > -0.2 else '#161a18'
        if part == 'body' and y > 0.1 and abs(x) > 0.05 and z > -0.04:
            return '#f4f2ec'                                     # the white wing patches
        return '#161a18' if noise(x, y, z, 60) < 0.3 else '#1e2a26'

    def caruncle():
        c = Blob(0.0012)
        for sx in (-1, 1):
            c.ell((sx * 0.018, 0.185, 0.115), 0.004, 0.012, 0.016)   # the red bare skin round the eyes
        c.ell((0, 0.18, 0.13), 0.008, 0.006, 0.01)
        c.build(pm('md_car', '#c8282a'), 160)
    duck('muscovy_duck', paint, bill='#e8c8c0', size=1.15, curl=None, extra=caruncle)


def mandarin_duck():
    def paint(part, x, y, z):
        if part == 'head':
            if abs(x) > 0.016 and y > 0.18 and z < 0.115:
                return '#f4f2ee'                                 # the broad white eye stripe
            if y < 0.172:
                return '#e07a2a'                                 # the orange whiskers
            return '#2a5a3a' if y > 0.195 else '#8a3a1e'
        if z > 0.05 and y < 0.13:
            return '#4a2244'                                     # the purple breast
        if y > 0.12:
            return '#3a3230'
        return '#c89a62'

    def sails():
        # the orange sails standing up on the back
        b = Blob(0.0015)
        for sx in (-1, 1):
            b.ell((sx * 0.04, 0.14, -0.03), 0.004, 0.028, 0.02)
        b.build(pm('md_sail', '#e8782a', '#f08a3a', scale=40), 200)
    duck('mandarin_duck', paint, bill='#d8302a', size=0.85, curl=None, extra=sails)


def rabbit(kind='rabbit', paint=None, ears='up', fluffy=None, size=1.0):
    """A wild brown rabbit, crouched: long hind feet and big haunches, a round head with long
    upright ears, big eyes, and the white scut of a tail. Tame breeds in their colours, lop eared
    or in the angora's cloud of fur."""
    def wild(part, x, y, z):
        if part == 'ear_tip':
            return '#2a2220'
        if part == 'body' and y < 0.035 and z > -0.08:
            return '#ece4d6'
        return '#957354'                                         # agouti brown
    paint = paint or wild
    b = Blob(0.003)
    b.ell((0, 0.08, -0.02), 0.052, 0.06, 0.075)
    b.ball((0, 0.075, -0.05), 0.055)                             # the haunches
    for sx in (-1, 1):
        b.ell((sx * 0.038, 0.012, -0.03), 0.011, 0.01, 0.045)    # the long hind feet
        b.cap((sx * 0.018, 0.06, 0.05), (sx * 0.018, 0.01, 0.068), 0.009, 0.007)   # the forelegs
    b.build(by(paint, 'body'), 2000)
    if fluffy:
        fl = Blob(0.003)
        ga = math.pi * (3 - math.sqrt(5))
        for i in range(110):
            yv = 1 - 2 * (i + 0.5) / 110
            if yv < -0.6:
                continue
            rad = math.sqrt(1 - yv * yv)
            a = ga * i
            fl.ball((math.cos(a) * rad * 0.058, 0.08 + yv * 0.062, -0.02 + math.sin(a) * rad * 0.08), 0.024)
        fl.build(cm(fluffy, scale=140), 1800)
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
                if ears == 'lop':
                    # long ears hanging down beside the face
                    e.ell((sx * (0.03 + u * 0.004), 0.155 - u * 0.075, 0.068 + u * 0.008), 0.006, 0.013, 0.014 - abs(u - 0.4) * 0.006)
                else:
                    e.ell((sx * (0.012 + u * 0.01), 0.155 + u * 0.07, 0.065 - u * 0.02), 0.004, 0.011, 0.011 - abs(u - 0.4) * 0.007)
            e.build(lambda x, y, z: by(paint, 'ear_tip' if (y > 0.215 and ears != 'lop') else 'ear')(x, y, z), 300)
        n = Blob(0.001)
        n.ell((0, 0.128, 0.113), 0.005, 0.004, 0.003)
        n.build(pm('rb_nose', '#d89a9a'), 40)
    eye_mark((0.02, 0.14, 0.088), 0.0065, 0.7)
    if size != 1.0:
        scale_all(size)
    finish(f'animal_{kind}', tex=512, vivid=1.06, ao_min=0.65, ao_dist=0.04)


def angora_rabbit():
    rabbit('angora_rabbit', coat('#f4f1ec', {'ear_tip': '#f4f1ec'}), fluffy='#f6f3ee', size=1.05)


def dutch_rabbit():
    black, white = '#2a2624', '#f5f2ec'

    def body(x, y, z):
        return black if z < -0.01 + noise(x, y, 0, 20) * 0.01 else white    # the dark hind half

    def head(x, y, z):
        return white if abs(x) < 0.008 + max(0, 0.14 - y) * 0.4 and z > 0.07 else black   # a white blaze
    rabbit('dutch_rabbit', coat(black, {'body': body, 'head': head, 'ear': black, 'ear_tip': black}), size=0.92)


def lop_rabbit():
    rabbit('lop_rabbit', coat('#b88a5c', {'ear': '#a87a4e', 'body': lambda x, y, z: '#ece0cc' if y < 0.035 else '#b88a5c'}), ears='lop')


def swan(kind='swan', black=False):
    """A swan afloat: a long, boat shaped body riding low with the wings raised a little over
    the back, a long neck in a graceful S, and the bill: the mute swan's orange with its black
    knob, the black swan's red with a white band. The black swan's wing feathers curl up."""
    body_c = '#1c1a1c' if black else '#f7f5f0'

    def plumage(x, y, z):
        if black and y > 0.13 and abs(x) > 0.03 and noise(x, y, z, 140) > 0.35:
            return '#f0eee8' if z < -0.05 else '#2a2628'         # the white flight feathers peeping out
        return body_c
    b = Blob(0.003)
    b.ell((0, 0.07, -0.01), 0.075, 0.055, 0.14)                  # the hull of the body
    b.ell((0, 0.08, 0.08), 0.06, 0.05, 0.06)                     # the full breast
    for sx in (-1, 1):
        b.ell((sx * 0.045, 0.12, -0.04), 0.03, 0.035, 0.11)      # the wings, raised a little over the back
    b.ell((0, 0.11, -0.14), 0.035, 0.03, 0.04)                   # the tail tipped up
    b.build(lambda x, y, z: cm(plumage(x, y, z), scale=90), 2600)
    if black:
        cr = Blob(0.0018)
        for k in range(10):
            x = (k % 5 - 2) * 0.014
            cr.cap((x, 0.14, -0.06 - (k // 5) * 0.03), (x * 1.3, 0.17, -0.09 - (k // 5) * 0.03), 0.007, 0.003)   # curled plumes
        cr.build(cm('#2a2628', scale=90), 400)
    with anim_group('head', B(0, 0.11, 0.1)):
        pts = [(0, 0.11, 0.1), (0, 0.19, 0.14), (0, 0.27, 0.12), (0, 0.33, 0.11), (0, 0.36, 0.14)]
        n = Blob(0.002)
        for k in range(len(pts) - 1):
            n.cap(pts[k], pts[k + 1], 0.026 - k * 0.004, 0.022 - k * 0.004)
        n.ell((0, 0.365, 0.15), 0.017, 0.018, 0.024)             # the head
        n.build(cm(body_c, scale=90), 1200)
        bl = Blob(0.0012)
        bl.cap((0, 0.362, 0.168), (0, 0.345, 0.212), 0.011, 0.007)
        if black:
            bl.build(lambda x, y, z: pm('sw_band', '#f4f2ee') if 0.198 < z < 0.204 else pm('sw_red', '#d8302a'), 220)
        else:
            bl.ball((0, 0.372, 0.172), 0.009)                    # the black knob
            bl.build(lambda x, y, z: pm('sw_knob', '#141414') if (z < 0.18 or y > 0.368) else pm('sw_orange', '#e87a28'), 220)
    eye_mark((0.013, 0.372, 0.158), 0.0045, 1.0)
    finish(f'animal_{kind}', tex=1024, vivid=1.06, ao_min=0.65, ao_dist=0.05)


def black_swan():
    swan('black_swan', black=True)


MODELS = {'animal_cow': cow, 'animal_angus_cow': angus_cow, 'animal_belted_galloway': belted_galloway, 'animal_dexter': dexter,
          'animal_charolais': charolais, 'animal_brown_swiss': brown_swiss, 'animal_hereford': hereford, 'animal_guernsey': guernsey,
          'animal_jersey_cow': jersey_cow, 'animal_texas_longhorn': texas_longhorn, 'animal_watusi': watusi, 'animal_zebu': zebu,
          'animal_highland_cow': highland_cow, 'animal_appaloosa': appaloosa, 'animal_clydesdale': clydesdale,
          'animal_friesian': friesian, 'animal_palomino': palomino, 'animal_pony': pony, 'animal_mule': mule, 'animal_elk': elk,
          'animal_reindeer': reindeer, 'animal_spotted_deer': spotted_deer, 'animal_moose': moose,
          'animal_suffolk_sheep': suffolk_sheep, 'animal_dorper': dorper, 'animal_black_sheep': black_sheep, 'animal_karakul': karakul,
          'animal_merino_sheep': merino_sheep, 'animal_valais_blacknose': valais_blacknose, 'animal_shetland_sheep': shetland_sheep,
          'animal_jacob_sheep': jacob_sheep,
          'animal_bactrian_camel': bactrian_camel, 'animal_llama': llama, 'animal_vicuna': vicuna, 'animal_bison': bison,
          'animal_musk_ox': musk_ox, 'animal_emu': emu, 'animal_rhea': rhea, 'animal_cassowary': cassowary,
          'animal_bronze_turkey': bronze_turkey, 'animal_pekin_duck': pekin_duck, 'animal_call_duck': call_duck,
          'animal_khaki_campbell': khaki_campbell, 'animal_muscovy_duck': muscovy_duck, 'animal_mandarin_duck': mandarin_duck,
          'animal_angora_rabbit': angora_rabbit, 'animal_dutch_rabbit': dutch_rabbit, 'animal_lop_rabbit': lop_rabbit,
          'animal_swan': swan, 'animal_black_swan': black_swan, 'animal_camel': camel, 'animal_alpaca': alpaca, 'animal_yak': yak, 'animal_buffalo': buffalo,
          'animal_gobbler': gobbler, 'animal_ostrich': ostrich, 'animal_peacock': peacock, 'animal_white_peacock': white_peacock, 'animal_quail': quail, 'animal_duck': duck,
          'animal_rabbit': rabbit, 'animal_horse': horse, 'animal_donkey': donkey, 'animal_sheep': sheep, 'animal_dog': dog}

if __name__ == '__main__':
    main(MODELS)
