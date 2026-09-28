# Life at sea: herring gulls, a sailing yacht, and the animals that sometimes
# show off the island: bottlenose dolphins, a humpback whale and a blue shark.
# The animals are sculpted from metaballs like animals.py, in game coordinates (y up, +z the
# nose). Parts the game moves: the gull's `wing0/1` (left, right) at the shoulders, and the
# `tail` of the dolphin, whale and shark at the root of the tail stock.
# The yacht is built in Blender coordinates with the bow toward -Y (the game's +z).
# Run: python3 tools/blender/sea.py [names...]   (see kit.main)
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import mathutils  # noqa: E402
from animals import B, Blob  # noqa: E402
from kit import anim_group, ball, box, cyl, finish, main, pm, prism, std, torus, uid  # noqa: E402
from world import bowl  # noqa: E402

R90 = math.radians(90)


def line(name, a, b, r, material, verts=6):
    """A thin rod from a to b (Blender coordinates): rigging, rails, booms."""
    va, vb = mathutils.Vector(a), mathutils.Vector(b)
    d = vb - va
    o = cyl(name, r, d.length, tuple((va + vb) / 2), material, verts=verts, bev=0)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = mathutils.Vector((0, 0, 1)).rotation_difference(d.normalized())
    return o


# ---------------------------------------------------------------- the herring gull

def seagull():
    white = pm('gl_white', '#f6f6f2', '#ffffff', scale=40)
    grey = pm('gl_grey', '#aab4bf', '#b8c2cc', scale=40)
    black = pm('gl_black', '#1c1c20')
    beak = pm('gl_beak', '#f2c230')
    spot = pm('gl_spot', '#d8302a')
    leg = pm('gl_leg', '#e8b0a0')

    b = Blob(0.004)
    b.ell((0, 0, 0), 0.055, 0.05, 0.14)                          # body
    b.ell((0, 0.04, 0.13), 0.042, 0.04, 0.045)                   # head
    b.cap((0, 0.02, 0.08), (0, 0.035, 0.12), 0.04, 0.036)         # neck
    b.ell((0, 0.005, -0.16), 0.045, 0.012, 0.06)                 # tail
    b.build(lambda x, y, z: grey if (y > 0.018 and -0.12 < z < 0.1) else (black if z < -0.19 else white), 900)
    bk = Blob(0.003)
    bk.cap((0, 0.035, 0.165), (0, 0.028, 0.215), 0.012, 0.006)
    bk.build(lambda x, y, z: spot if (z > 0.19 and y < 0.028) else beak, 150)
    for sx in (-1, 1):
        ball(uid('eye'), 0.007, B(sx * 0.03, 0.05, 0.155), black, segs=8)
    for sx in (-1, 1):
        lg = Blob(0.003)
        lg.cap((sx * 0.02, -0.04, 0.0), (sx * 0.02, -0.06, -0.06), 0.008, 0.006)
        lg.build(leg, 80)

    # long narrow wings, grey above with black tips and white spots ("mirrors")
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'wing{i}', B(sx * 0.045, 0.025, 0.02)):
            w = Blob(0.004)
            w.ell((sx * 0.14, 0.025, 0.02), 0.11, 0.013, 0.065)
            w.ell((sx * 0.3, 0.025, -0.01), 0.1, 0.01, 0.048)
            w.ell((sx * 0.43, 0.025, -0.04), 0.07, 0.008, 0.032)

            def wpaint(x, y, z, sx=sx):
                ax = abs(x)
                if ax > 0.44:
                    return white if abs(ax - 0.47) < 0.012 else black
                if ax > 0.37:
                    return black
                return white if z < -0.03 and ax < 0.3 else grey
            w.build(wpaint, 600)
    finish('seagull', tex=512, vivid=1.05, ao_min=0.85, ao_dist=0.05)


# ---------------------------------------------------------------- boats

def sailboat():
    """A white sloop: a smooth hull with a navy boot stripe, a teak deck and cockpit, a cabin
    with portholes, a tall mast with mainsail and jib, a boom, rigging and steel rails."""
    m = std()
    hull = pm('sb_hull', '#f6f6f2', '#ffffff', scale=20, rough=0.35)
    navy = pm('sb_navy', '#1f3a6a', rough=0.35)
    teak = pm('sb_teak', '#b88450', '#c8945e', scale=6, kind='wave', stretch=(1, 10, 1))
    sail = pm('sb_sail', '#fbf8f0', '#f2eee4', scale=16)
    steel = pm('sb_steel', '#c8ced4', rough=0.25, metal=0.8)
    bowl(uid('hull'), 0.3, 1.0, 0.26, (0, 0, 0.2), hull, wall=0.03, segs=32)
    torus(uid('boot'), 1.0, 0.03, (0, 0, 0.05), navy, segs=40, rsegs=6).scale = (0.26, 0.9, 0.5)
    torus(uid('rub'), 1.0, 0.035, (0, 0, 0.2), navy, segs=40, rsegs=6).scale = (0.3, 1.0, 0.5)
    deck = cyl(uid('deck'), 1.0, 0.02, (0, 0, 0.2), teak, verts=40, bev=0)
    deck.scale = (0.29, 0.98, 1)
    # cabin with portholes, the cockpit behind it
    box(uid('cabin'), (0.3, 0.52, 0.14), (0, 0.05, 0.28), hull, bev=0.03)
    box(uid('croof'), (0.32, 0.54, 0.02), (0, 0.05, 0.355), teak, bev=0.01)
    for sx in (-1, 1):
        for y in (-0.1, 0.05, 0.2):
            cyl(uid('port'), 0.025, 0.01, (sx * 0.151, y, 0.29), navy, verts=12, rot=(0, R90, 0), bev=0)
    box(uid('pit'), (0.24, 0.34, 0.03), (0, 0.5, 0.19), teak, bev=0.01)
    cyl(uid('wheel'), 0.07, 0.015, (0, 0.62, 0.3), steel, verts=16, rot=(R90, 0, 0), bev=0)
    # mast, boom and sails
    mx, my = 0.0, -0.22
    cyl(uid('mast'), 0.022, 2.1, (mx, my, 0.2 + 1.05), steel, verts=10, r2=0.016)
    line(uid('boom'), (0, my, 0.52), (0, 0.72, 0.5), 0.018, steel)
    prism(uid('main'), [(my + 0.03, 0.55), (0.7, 0.53), (my + 0.03, 2.15)], -0.004, 0.004, sail)
    prism(uid('jib'), [(-0.92, 0.26), (my - 0.05, 0.3), (my - 0.02, 1.9)], -0.004, 0.004, sail)
    line(uid('stay'), (0, -0.98, 0.22), (0, my, 2.25), 0.005, steel, verts=4)
    line(uid('back'), (0, 0.98, 0.22), (0, my, 2.25), 0.005, steel, verts=4)
    for sx in (-1, 1):
        line(uid('shroud'), (sx * 0.28, my, 0.2), (0, my, 1.9), 0.004, steel, verts=4)
    # guard rails on stanchions along both sides
    for sx in (-1, 1):
        pts = []
        for k in range(7):
            y = -0.7 + k * 0.24
            x = sx * 0.3 * math.sqrt(max(0.05, 1 - (y / 1.0) ** 2)) * 0.95
            pts.append((x, y))
            cyl(uid('stan'), 0.006, 0.12, (x, y, 0.26), steel, verts=5, bev=0)
        for a, b in zip(pts, pts[1:]):
            line(uid('rail'), (a[0], a[1], 0.32), (b[0], b[1], 0.32), 0.005, steel, verts=4)
    box(uid('flag'), (0.005, 0.1, 0.06), (0, 0.97, 0.45), pm('sb_flag', '#d8302a'), bev=0)
    line(uid('fpole'), (0, 0.95, 0.2), (0, 0.97, 0.5), 0.005, steel, verts=4)
    finish('sailboat', tex=1024, vivid=1.05, ao_min=0.7)


def dolphin():
    """A bottlenose dolphin: dark grey back, lighter flanks, pale belly, short beak, curved
    dorsal fin, pectoral fins, and flukes on the `tail` part."""
    back, flank, belly = pm('dl_back', '#4a5868', '#56657a', scale=30), pm('dl_flank', '#8494a4'), pm('dl_belly', '#e4e8ec')
    eye = pm('dl_eye', '#101014')

    def paint(x, y, z):
        if y > 0.02 + 0.02 * math.sin(z * 3):
            return back
        return flank if y > -0.04 else belly
    b = Blob(0.006)
    b.cap((0, 0, -0.25), (0, 0.02, 0.15), 0.09, 0.12)            # body
    b.cap((0, 0.02, 0.15), (0, 0.01, 0.34), 0.12, 0.08)           # head and melon
    b.ell((0, 0.04, 0.3), 0.07, 0.06, 0.06)                        # melon bulge
    b.cap((0, -0.01, 0.38), (0, -0.015, 0.47), 0.03, 0.022)       # beak
    b.build(paint, 1600)
    for sx in (-1, 1):
        ball(uid('eye'), 0.012, B(sx * 0.07, 0.01, 0.33), eye, segs=8)
    # curved dorsal fin and pectoral fins
    f = Blob(0.004)
    f.cap((0, 0.1, -0.02), (0, 0.2, -0.1), 0.045, 0.012)
    f.cap((0, 0.2, -0.1), (0, 0.22, -0.16), 0.012, 0.006)
    for sx in (-1, 1):
        f.ell((sx * 0.13, -0.05, 0.12), 0.07, 0.012, 0.035)
    f.build(back, 400)
    with anim_group('tail', B(0, 0, -0.25)):
        t = Blob(0.005)
        t.cap((0, 0, -0.25), (0, 0.0, -0.46), 0.08, 0.035)
        for sx in (-1, 1):
            t.ell((sx * 0.1, 0.0, -0.5), 0.1, 0.012, 0.045)
        t.build(paint, 500)
    finish('dolphin', tex=512, vivid=1.05, ao_min=0.8, ao_dist=0.08)


def whale():
    """A humpback whale: long and dark with a knobbly head, pale throat grooves, long white
    flippers, a small hump of a dorsal fin, and broad flukes (white below) on `tail`."""
    back, belly = pm('wh_back', '#2a3038', '#343c46', scale=20), pm('wh_belly', '#d8dce0')
    groove = pm('wh_groove', '#9aa4ae')
    knob = pm('wh_knob', '#3e4650')

    def paint(x, y, z):
        if y < -0.12 and z > 0.4:
            return groove if abs(math.sin(x * 60)) < 0.35 else belly
        return back if y > -0.18 else belly
    b = Blob(0.012)
    b.cap((0, 0, -0.9), (0, 0.05, 0.4), 0.3, 0.42)                # body
    b.cap((0, 0.05, 0.4), (0, -0.02, 1.25), 0.42, 0.2)             # head
    b.ell((0, -0.14, 0.8), 0.3, 0.14, 0.45)                        # throat
    b.build(paint, 3000)
    for k in range(9):
        ball(uid('knob'), 0.03, B((k % 3 - 1) * 0.08, 0.2 - (k // 3) * 0.01, 0.95 + (k // 3) * 0.1), knob, segs=8)
    for sx in (-1, 1):
        ball(uid('eye'), 0.02, B(sx * 0.3, -0.02, 0.85), pm('wh_eye', '#101014'), segs=8)
    f = Blob(0.008)
    f.cap((0, 0.38, -0.55), (0, 0.46, -0.7), 0.08, 0.03)           # small dorsal hump
    for sx in (-1, 1):
        f.cap((sx * 0.35, -0.15, 0.55), (sx * 0.9, -0.3, 0.1), 0.09, 0.05)   # long flippers
    f.build(lambda x, y, z: belly if abs(x) > 0.3 else back, 900)
    with anim_group('tail', B(0, 0, -0.9)):
        t = Blob(0.01)
        t.cap((0, 0, -0.9), (0, 0.0, -1.6), 0.26, 0.1)
        for sx in (-1, 1):
            t.ell((sx * 0.32, 0.0, -1.7), 0.34, 0.03, 0.14)
        t.build(lambda x, y, z: belly if (y < -0.01 and z < -1.55) else back, 900)
    finish('whale', tex=1024, vivid=1.05, ao_min=0.75, ao_dist=0.15)


def shark():
    """A blue shark: slender, blue grey above and white below, a pointed snout, a tall dorsal
    fin, long pectorals and a tall forked tail on `tail` (it sweeps side to side)."""
    back, belly = pm('sh_back', '#4e6a88', '#5a789a', scale=30), pm('sh_belly', '#eef0f2')
    eye = pm('sh_eye', '#0c0c10')

    def paint(x, y, z):
        return back if y > -0.03 + 0.01 * math.sin(z * 6) else belly
    b = Blob(0.006)
    b.cap((0, 0, -0.3), (0, 0.01, 0.25), 0.07, 0.1)
    b.cap((0, 0.01, 0.25), (0, 0.0, 0.5), 0.1, 0.03)
    b.build(paint, 1500)
    for sx in (-1, 1):
        ball(uid('eye'), 0.012, B(sx * 0.055, 0.02, 0.4), eye, segs=8)
        for k in range(4):
            box(uid('gill'), (0.004, 0.005, 0.05), B(sx * 0.085, 0.0, 0.2 - k * 0.025), pm('sh_gill', '#3a4e66'), bev=0)
    f = Blob(0.004)
    f.cap((0, 0.08, 0.05), (0, 0.26, -0.06), 0.06, 0.012)          # dorsal fin
    for sx in (-1, 1):
        f.cap((sx * 0.08, -0.05, 0.2), (sx * 0.3, -0.1, 0.05), 0.04, 0.015)   # pectorals
    f.build(back, 500)
    with anim_group('tail', B(0, 0, -0.3)):
        t = Blob(0.004)
        t.cap((0, 0, -0.3), (0, 0.02, -0.55), 0.06, 0.03)
        t.cap((0, 0.02, -0.55), (0, 0.25, -0.72), 0.03, 0.01)       # upper lobe
        t.cap((0, 0.0, -0.55), (0, -0.12, -0.65), 0.025, 0.01)      # lower lobe
        t.build(paint, 400)
    finish('shark', tex=512, vivid=1.05, ao_min=0.8, ao_dist=0.08)


# ---------------------------------------------------------------- the house sparrow

def sparrow():
    """A house sparrow: brown back streaked dark, grey crown, chestnut nape, pale cheeks and
    belly, a small black bib and a stout dark bill. Wings `wing0/1` fold along the body."""
    brown = pm('sp_brown', '#8a5a34', '#9a6a40', scale=60)
    streak = pm('sp_streak', '#3a2618')
    grey = pm('sp_grey', '#8a8a88')
    chest = pm('sp_chest', '#a8683a')
    pale = pm('sp_pale', '#e4dccc', '#ece6d8', scale=40)
    black = pm('sp_black', '#1c1a18')
    bill = pm('sp_bill', '#2a2622')
    leg = pm('sp_leg', '#c89a80')

    def body(x, y, z):
        if y < -0.005:
            return pale
        if z > 0.045 and y < 0.02 and abs(x) < 0.02:
            return black                                          # the bib
        return streak if (math.sin(x * 260) > 0.6 and math.sin(z * 180) > 0.2 and y > 0.01) else brown
    b = Blob(0.0025)
    b.ell((0, 0, 0), 0.035, 0.032, 0.055)
    b.ell((0, -0.004, -0.07), 0.018, 0.008, 0.04)                 # tail
    b.build(body, 600)
    h = Blob(0.0025)
    h.ball((0, 0.03, 0.055), 0.028)

    def head(x, y, z):
        if y > 0.045:
            return grey                                           # crown
        if z < 0.045:
            return chest                                          # nape
        if abs(x) > 0.017 and y < 0.035:
            return pale                                           # cheeks
        return black if y < 0.022 else brown
    h.build(head, 400)
    bk = Blob(0.002)
    bk.cap((0, 0.028, 0.08), (0, 0.026, 0.095), 0.009, 0.004)
    bk.build(bill, 60)
    for sx in (-1, 1):
        ball(uid('eye'), 0.005, B(sx * 0.02, 0.036, 0.07), black, segs=8)
        lg = Blob(0.002)
        lg.cap((sx * 0.012, -0.025, 0.0), (sx * 0.012, -0.045, 0.005), 0.004, 0.003)
        lg.build(leg, 40)
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'wing{i}', B(sx * 0.03, 0.015, 0.02)):
            w = Blob(0.0025)
            w.ell((sx * 0.035, 0.012, -0.01), 0.03, 0.008, 0.045)
            w.ell((sx * 0.07, 0.012, -0.02), 0.03, 0.006, 0.03)
            w.build(lambda x, y, z: streak if abs(math.sin(z * 200)) < 0.3 else chest, 200)
    finish('sparrow', tex=256, vivid=1.05, ao_min=0.85, ao_dist=0.03)


MODELS = {'seagull': seagull, 'sailboat': sailboat, 'dolphin': dolphin, 'whale': whale, 'shark': shark, 'sparrow': sparrow}

if __name__ == '__main__':
    main(MODELS)
