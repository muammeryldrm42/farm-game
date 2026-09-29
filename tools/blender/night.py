# Wild creatures that come out on the farm at night: a hedgehog snuffling through the grass, a
# pipistrelle bat flitting round the buildings and a common toad by the water.
# hedgehog: a brown, spiny back of pale tipped spines over a soft grey-brown face and belly, a
# pointed snout with a shiny black nose and short legs; parts `head` (at the neck) and `leg0..3`
# (front left, front right, hind left, hind right, at the hips).
# bat: a small dark brown pipistrelle with its wings spread, the thin skin stretched between long
# finger bones; parts `wing0/1` (left, right, at the shoulders) and `head`.
# toad: a warty olive brown toad, squat and broad, with gold eyes, pale throat and dark blotches;
# parts `leg0..3` (front left, front right, hind left, hind right).
# barn_owl, tawny_owl: the wild owls that live in the farm's trees (see owl()).
# Built in game coordinates (y up, +z the front) from metaballs like animals.py; the feet stand at
# y 0.
# Run: python3 tools/blender/night.py [names...]   (see kit.main)
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from animals import B, Blob, noise  # noqa: E402
from kit import anim_group, ball, finish, main, pm, uid  # noqa: E402


def hedgehog():
    spine = pm('hh_spine', '#5a4432', '#6a5240', scale=90)
    tip = pm('hh_tip', '#d8c8a8', '#e4d6b8', scale=90)
    face = pm('hh_face', '#a88c70', '#b89c80', scale=60)
    belly = pm('hh_belly', '#8a7460')
    nose = pm('hh_nose', '#141010', rough=0.2)
    black = pm('hh_eye', '#0c0a08', rough=0.1)
    claw = pm('hh_claw', '#3a2e26')
    Y = 0.06
    # the body: a low dome, longest front to back
    b = Blob(0.0026)
    b.ell((0, Y, -0.005), 0.062, 0.05, 0.085)
    b.ell((0, Y - 0.022, 0.0), 0.05, 0.026, 0.07)
    # the spiny coat: a ruff of little points standing out all over the back
    for k in range(150):
        a = k * 2.39996
        u = (k + 0.5) / 150
        # spread over the upper back, from the brow to the rump
        th = math.acos(1 - u * 1.05)
        x = math.sin(th) * math.cos(a)
        y = math.cos(th)
        z = math.sin(th) * math.sin(a)
        if z > 0.75 and y < 0.55:
            continue
        p = (x * 0.062, Y + y * 0.05, -0.005 + z * 0.085)
        q = (x * 0.078, Y + y * 0.066, -0.005 + z * 0.1 - 0.012)
        b.cap(p, q, 0.006, 0.0018)

    def coat(x, y, z):
        r = math.sqrt((x / 0.062) ** 2 + ((y - Y) / 0.05) ** 2 + ((z + 0.005) / 0.085) ** 2)
        if y < Y - 0.02 or (z > 0.05 and y < Y + 0.02):
            return belly
        if r > 1.12:
            return tip if noise(x, y, z, 160) > 0.3 else spine
        return spine
    b.build(coat, 2600)
    with anim_group('head', B(0, Y - 0.006, 0.06)):
        h = Blob(0.0022)
        h.ell((0, Y - 0.008, 0.075), 0.03, 0.028, 0.03)
        h.cap((0, Y - 0.012, 0.085), (0, Y - 0.02, 0.122), 0.02, 0.008)
        h.build(face, 600)
        ball(uid('nose'), 0.0065, B(0, Y - 0.02, 0.124), nose, segs=10)
        for sx in (-1, 1):
            ball(uid('eye'), 0.0055, B(sx * 0.017, Y + 0.002, 0.098), black, segs=10)
            e = Blob(0.0016)
            e.ell((sx * 0.022, Y + 0.018, 0.078), 0.007, 0.008, 0.004)
            e.build(face, 60)
    hips = ((-0.03, 0.045), (0.03, 0.045), (-0.034, -0.05), (0.034, -0.05))
    for i, (x, z) in enumerate(hips):
        with anim_group(f'leg{i}', B(x, 0.03, z)):
            lg = Blob(0.0018)
            lg.cap((x, 0.03, z), (x * 1.05, 0.006, z + 0.006), 0.009, 0.007)
            lg.ell((x * 1.05, 0.004, z + 0.012), 0.008, 0.004, 0.011)
            lg.build(lambda px, py, pz, zz=z: claw if pz > zz + 0.018 else belly, 90)
    finish('hedgehog', tex=512, vivid=1.05, ao_min=0.7, ao_dist=0.04)


def membrane(outline, centre, material):
    """A thin sheet as a fan of triangles from `centre` round the closed `outline` (game coords)."""
    import bpy
    verts = [B(*centre)] + [B(*p) for p in outline]
    n = len(outline)
    faces = [(0, 1 + k, 1 + (k + 1) % n) for k in range(n - 1)]
    me = bpy.data.meshes.new(uid('skin'))
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(me.name, me)
    bpy.context.collection.objects.link(ob)
    me.materials.append(material)
    for f in me.polygons:
        f.use_smooth = True
    return ob


def bat():
    fur = pm('bt_fur', '#4a3426', '#5a4030', scale=80)
    skin = pm('bt_skin', '#2e221c', '#3a2c24', scale=40)
    bone = pm('bt_bone', '#1c1612')
    black = pm('bt_eye', '#0a0808', rough=0.1)
    Y = 0.0
    b = Blob(0.0018)
    b.ell((0, Y, 0), 0.016, 0.014, 0.03)
    b.build(fur, 400)
    with anim_group('head', B(0, Y + 0.004, 0.024)):
        h = Blob(0.0015)
        h.ball((0, Y + 0.006, 0.034), 0.013)
        h.cap((0, Y + 0.004, 0.04), (0, Y + 0.002, 0.05), 0.007, 0.004)
        for sx in (-1, 1):
            # big rounded ears
            h.cap((sx * 0.007, Y + 0.014, 0.032), (sx * 0.012, Y + 0.03, 0.028), 0.0055, 0.004)
        h.build(lambda x, y, z: skin if y > Y + 0.018 else fur, 260)
        for sx in (-1, 1):
            ball(uid('eye'), 0.0022, B(sx * 0.0065, Y + 0.01, 0.045), black, segs=8)
    # the wings: a thin membrane between the arm and three long fingers, spread out sideways
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'wing{i}', B(sx * 0.012, Y + 0.004, 0.012)):
            sh = (sx * 0.012, Y + 0.004, 0.012)
            wrist = (sx * 0.055, Y + 0.008, 0.02)
            tips = [(sx * 0.12, Y + 0.006, 0.012), (sx * 0.11, Y + 0.004, -0.02), (sx * 0.075, Y + 0.002, -0.04)]
            bn = Blob(0.0012)
            bn.cap(sh, wrist, 0.0032, 0.0026)
            for t in tips:
                bn.cap(wrist, t, 0.002, 0.0011)
            bn.build(bone, 200)
            # the skin: a thin sheet from the shoulder out along the arm to the finger tips,
            # scalloped between them, and back in to the flank
            outline = [sh, wrist, tips[0]]
            for k in range(len(tips) - 1):
                a, c = tips[k], tips[k + 1]
                mid = tuple((a[j] + c[j]) / 2 for j in range(3))
                outline += [(mid[0] * 0.86, mid[1], mid[2] * 0.86 + 0.004), c]
            outline += [(sx * 0.05, Y + 0.001, -0.036), (sx * 0.02, Y, -0.028)]
            membrane(outline, (sx * 0.045, Y + 0.004, -0.004), skin)
    finish('bat', tex=256, vivid=1.0, ao_min=0.85, ao_dist=0.02)


def toad():
    back = pm('td_back', '#7a6440', '#8a7450', scale=90)
    blot = pm('td_blot', '#4a3a24')
    wart = pm('td_wart', '#9a7a4a')
    throat = pm('td_throat', '#d8c8a0')
    gold = pm('td_gold', '#d8a030', rough=0.2)
    black = pm('td_pupil', '#0a0806', rough=0.1)
    Y = 0.028
    b = Blob(0.0018)
    b.ell((0, Y, -0.004), 0.034, 0.02, 0.04)
    b.ell((0, Y + 0.006, 0.024), 0.028, 0.016, 0.022)
    # warts over the back
    for k in range(34):
        a = k * 2.39996
        r = math.sqrt((k + 0.5) / 34)
        x, z = math.cos(a) * r * 0.028, -0.004 + math.sin(a) * r * 0.036
        b.ball((x, Y + 0.016 - r * r * 0.008, z), 0.0042)
    # the bulging glands behind the eyes
    for sx in (-1, 1):
        b.ell((sx * 0.016, Y + 0.016, 0.012), 0.008, 0.005, 0.014)

    def skin(x, y, z):
        if y < Y - 0.008:
            return throat
        n = noise(x, y, z, 60)
        if n > 0.3:
            return blot
        return wart if noise(x, y, z, 200) > 0.35 else back
    b.build(skin, 1400)
    for sx in (-1, 1):
        e = Blob(0.0014)
        e.ball((sx * 0.013, Y + 0.018, 0.03), 0.0065)
        e.build(back, 80)
        ball(uid('eye'), 0.0058, B(sx * 0.0145, Y + 0.021, 0.032), gold, segs=10)
        ball(uid('pupil'), 0.0032, B(sx * 0.017, Y + 0.022, 0.036), black, scale=(1.4, 0.6, 0.7), segs=8)
    legs = ((-0.026, 0.02, 0.02), (0.026, 0.02, 0.02), (-0.03, -0.028, 0.03), (0.03, -0.028, 0.03))
    for i, (x, z, r) in enumerate(legs):
        with anim_group(f'leg{i}', B(x, Y - 0.006, z)):
            lg = Blob(0.0014)
            sx = 1 if x > 0 else -1
            if i < 2:
                lg.cap((x, Y - 0.006, z), (x + sx * 0.008, 0.004, z + 0.01), 0.0065, 0.004)
                lg.ell((x + sx * 0.01, 0.002, z + 0.014), 0.007, 0.002, 0.006)
            else:
                # folded hind legs: thigh out and forward, shin back, long webbed foot forward
                knee = (x + sx * 0.012, Y - 0.004, z + 0.014)
                heel = (x + sx * 0.004, 0.006, z - 0.006)
                lg.cap((x, Y - 0.006, z), knee, 0.009, 0.007)
                lg.cap(knee, heel, 0.006, 0.005)
                lg.ell((x + sx * 0.012, 0.002, z + 0.01), 0.009, 0.002, 0.014)
            lg.build(back, 160)
    finish('toad', tex=512, vivid=1.05, ao_min=0.75, ao_dist=0.03)


def owl(name, tawny=False):
    """A wild owl standing upright on its perch: `head` (turning at the neck), `wing0/1` (left,
    right, built spread out sideways at the shoulders; the game folds them back along the body
    when it sits) and `leg0/1`. The barn owl is golden buff above with fine grey speckles, white
    below, with its white heart shaped face and dark eyes; the tawny owl is a rounder, rufous
    brown bird streaked darker, with a pale brown face ringed dark and big black eyes."""
    if tawny:
        back = pm('to_back', '#8a5a34', '#9a6a40', scale=90)
        speck = pm('to_speck', '#4a3020')
        belly = pm('to_belly', '#c8a070', '#d4ae80', scale=80)
        disc = pm('to_disc', '#d0aa80', '#dab690', scale=60)
        rim = pm('to_rim', '#5a3a22')
        bill = pm('to_bill', '#d8c498')
        leg = pm('to_leg', '#c8a878')
    else:
        back = pm('bo_back', '#d09a52', '#dcaa62', scale=90)
        speck = pm('bo_speck', '#7a7a80')
        belly = pm('bo_belly', '#f8f2e6', '#fffaf0', scale=60)
        disc = pm('bo_disc', '#fbf7f0', '#ffffff', scale=60)
        rim = pm('bo_rim', '#c08a4a')
        bill = pm('bo_bill', '#e8d4c4')
        leg = pm('bo_leg', '#f2ece2')
    black = pm('ow_eye', '#080606', rough=0.08)
    claw = pm('ow_claw', '#2a2420')
    W = 1.1 if tawny else 1.0

    def plumage(x, y, z):
        # pale underparts in front, the coloured back and crown; speckles or dark streaks
        front = z > 0.02 - (y - 0.14) * 0.1
        if front and y < 0.2:
            if tawny and noise(x, y * 3, z, 120) > 0.35:
                return speck
            if not tawny and noise(x, y, z, 260) > 0.7:
                return speck
            return belly
        return speck if noise(x, y, z, 260 if not tawny else 180) > (0.4 if tawny else 0.62) else back
    b = Blob(0.0035)
    b.ell((0, 0.14, 0.0), 0.062 * W, 0.092, 0.066 * W)
    b.ell((0, 0.1, -0.01), 0.056 * W, 0.06, 0.06 * W)
    b.ell((0, 0.075, -0.06), 0.03, 0.012, 0.045)            # the short tail
    for sx in (-1, 1):
        b.ell((sx * 0.055 * W, 0.14, -0.012), 0.016, 0.07, 0.05)  # the folded wing edge on the flank
    b.build(plumage, 1800)
    with anim_group('head', B(0, 0.215, 0.005)):
        h = Blob(0.003)
        h.ell((0, 0.255, 0.004), 0.058 * W, 0.052 * W, 0.054 * W)
        h.build(plumage, 900)
        # the facial disc: a flat dish round the eyes (a heart for the barn owl, round for the tawny)
        d = Blob(0.0022)
        if tawny:
            d.ell((0, 0.252, 0.054), 0.046, 0.042, 0.014)
        else:
            d.ell((0, 0.246, 0.046), 0.038, 0.044, 0.012)
            for sx in (-1, 1):
                d.ell((sx * 0.02, 0.262, 0.044), 0.026, 0.026, 0.012)

        def face(x, y, z):
            r = math.hypot(x / 0.046, (y - 0.252) / 0.042) if tawny else math.hypot(x / 0.05, (y - 0.25) / 0.05)
            return rim if r > (0.9 if tawny else 0.9) else disc
        d.build(face, 700)
        for sx in (-1, 1):
            ball(uid('eye'), 0.0095 if tawny else 0.0082, B(sx * 0.0175, 0.253, 0.066 if tawny else 0.056), black, segs=12)
        dz = 0.01 if tawny else 0.0
        bk = Blob(0.0015)
        bk.cap((0, 0.246, 0.058 + dz), (0, 0.232, 0.064 + dz), 0.005, 0.0022)
        bk.build(bill, 80)
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'leg{i}', B(sx * 0.02, 0.07, 0.012)):
            lg = Blob(0.002)
            lg.cap((sx * 0.02, 0.075, 0.012), (sx * 0.022, 0.012, 0.02), 0.011 if not tawny else 0.012, 0.007)
            lg.build(leg, 160)
            t = Blob(0.0014)
            for a in (-0.45, 0, 0.45):
                t.cap((sx * 0.022, 0.008, 0.02), (sx * 0.022 + math.sin(a) * 0.022, 0.003, 0.02 + math.cos(a) * 0.024), 0.0032, 0.0016)
            t.cap((sx * 0.022, 0.008, 0.02), (sx * 0.022, 0.003, 0.0), 0.003, 0.0016)
            t.build(claw, 100)
    # the wings, spread wide: long broad hands, barred flight feathers
    for i, sx in enumerate((-1, 1)):
        sh = (sx * 0.05 * W, 0.175, 0.0)
        with anim_group(f'wing{i}', B(*sh)):
            w = Blob(0.0028)
            w.cap(sh, (sx * 0.14, 0.178, 0.012), 0.024, 0.02)
            w.ell((sx * 0.13, 0.176, -0.012), 0.08, 0.006, 0.05)
            w.ell((sx * 0.22, 0.176, -0.006), 0.07, 0.005, 0.042)
            w.ell((sx * 0.28, 0.176, -0.012), 0.035, 0.004, 0.03)

            def wing(x, y, z):
                if y < 0.1755:
                    return belly                                   # the pale underwing
                ax = abs(x)
                if ax > 0.17 and math.sin(ax * 170) > 0.55:
                    return speck                                   # bars on the flight feathers
                return plumage(x, 0.25, -0.1)
            w.build(wing, 700)
    finish(name, tex=512, vivid=1.05, ao_min=0.75, ao_dist=0.05)


MODELS = {'hedgehog': hedgehog, 'bat': bat, 'toad': toad,
          'barn_owl': lambda: owl('barn_owl'), 'tawny_owl': lambda: owl('tawny_owl', tawny=True)}

if __name__ == '__main__':
    main(MODELS)
