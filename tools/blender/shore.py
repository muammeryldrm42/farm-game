# Shore life for the sandy beach round the island: three true crabs, a hermit crab, sanderlings
# running the tide line, and harbour seals that swim offshore and bask on the shore rocks.
# rock_crab: a red rock crab, brick red with black tipped claws; blue_crab: an olive backed
# blue crab with long side spines, blue legs, red tipped claws and paddle hind legs; ghost_crab:
# a pale sand coloured ghost crab on tall legs with big eyes on stalks; hermit_crab: a small
# orange hermit crab in a borrowed whelk shell.
# Built in game coordinates (y up, +z the front) from metaballs like animals.py. Parts the game
# moves: the walking legs `leg0..leg7` (0..3 on the left, -x, front to back; 4..7 on the right),
# or `leg0..leg3` for the hermit crab, and the claws `claw0` (left) and `claw1` (right), each
# pivoting where it joins the body.
# Run: python3 tools/blender/shore.py [names...]   (see kit.main)
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from animals import B, Blob, noise  # noqa: E402
from kit import anim_group, ball, finish, main, pm, uid  # noqa: E402


def crab(name, top, spot, under, leg, claw, tip, W=0.05, spines=False, ghost=False, paddles=False):
    black = pm('cr_eye', '#141010')
    hi = 0.012 if ghost else 0.0
    # the carapace: a wide oval, domed on top, flatter below, with a notched front edge
    b = Blob(0.0028)
    b.ell((0, 0.034 + hi, 0), W, 0.02, W * 0.74)
    b.ell((0, 0.024 + hi, -0.002), W * 0.86, 0.013, W * 0.62)
    for k in range(-2, 3):
        b.ball((k * W * 0.2, 0.036 + hi, W * 0.7), W * 0.1)
    if spines:
        for sx in (-1, 1):
            b.cap((sx * W * 0.8, 0.036 + hi, W * 0.08), (sx * W * 1.32, 0.037 + hi, W * 0.16), W * 0.12, W * 0.025)

    def shell(x, y, z):
        if y < 0.028 + hi:
            return under
        v = noise(x, y, z, 70)
        return spot if v > 0.25 else top
    b.build(shell, 1100)

    # eyes on stalks at the front: tall and bulbous on the ghost crab
    for sx in (-1, 1):
        s = Blob(0.0022)
        top_y = 0.058 + hi * (2.4 if ghost else 1)
        s.cap((sx * W * 0.24, 0.042 + hi, W * 0.66), (sx * W * 0.28, top_y, W * 0.7), 0.0035, 0.003)
        s.build(top if not ghost else spot, 80)
        ball(uid('eye'), 0.0075 if ghost else 0.0045, B(sx * W * 0.28, top_y + 0.003, W * 0.71), black, segs=10)

    # four walking legs a side, each in three jointed segments reaching out and down
    zs = (W * 0.36, W * 0.08, -W * 0.2, -W * 0.46)
    reach = 1.35 if ghost else 1.0
    for i in range(8):
        sx = -1 if i < 4 else 1
        z0 = zs[i % 4]
        root = (sx * W * 0.82, 0.03 + hi, z0)
        with anim_group(f'leg{i}', B(*root)):
            # up to an arched knee, then down to a pointed foot, splayed forward or back
            knee = (sx * (W * 0.82 + 0.03 * reach), 0.056 + hi * 1.3, z0 * 1.3 + 0.003)
            foot = (sx * (W * 0.82 + 0.055 * reach), 0.0, z0 * 1.6)
            lg = Blob(0.002)
            lg.cap(root, knee, 0.0052, 0.0042)
            lg.cap(knee, foot, 0.0038, 0.0012)
            if paddles and i % 4 == 3:
                # the swimming crab's hind legs end in flat oar blades
                lg.ell((foot[0] * 0.98, 0.006, foot[2]), 0.012, 0.003, 0.009)
            lg.build(lambda x, y, z: tip if y < 0.006 else leg, 160)

    # the claws: an arm out and forward, a swollen palm, a fixed finger and a moving one
    for i, sx in enumerate((-1, 1)):
        pivot = (sx * W * 0.56, 0.03 + hi, W * 0.52)
        big = 1.0 if not ghost else (1.25 if sx > 0 else 0.8)
        with anim_group(f'claw{i}', B(*pivot)):
            c = Blob(0.0022)
            palm = (sx * W * 0.86, 0.036 + hi, W * 1.12)
            c.cap(pivot, (sx * W * 0.8, 0.036 + hi, W * 0.92), 0.0075, 0.0068)
            c.ell(palm, 0.015 * big, 0.011 * big, 0.022 * big)
            c.cap((palm[0] - sx * 0.004, palm[1] - 0.004, palm[2] + 0.016 * big), (palm[0] - sx * 0.01, palm[1] - 0.005, palm[2] + 0.036 * big), 0.0055 * big, 0.0018)
            c.cap((palm[0] + sx * 0.003, palm[1] + 0.006, palm[2] + 0.015 * big), (palm[0] - sx * 0.004, palm[1] + 0.003, palm[2] + 0.036 * big), 0.0048 * big, 0.0016)
            c.build(lambda x, y, z, pz=palm[2]: tip if z > pz + 0.02 * big else claw, 380)
    finish(name, tex=512, vivid=1.05, ao_min=0.8, ao_dist=0.03)


def hermit_crab():
    cream = pm('hc_cream', '#eadcc0', '#f2e8d4', scale=60)
    band = pm('hc_band', '#a8744a', '#8a5a36', scale=60)
    lip = pm('hc_lip', '#f4d8c8')
    body = pm('hc_body', '#d8582c', '#e0703a', scale=80)
    leg = pm('hc_leg', '#e07a40')
    ring = pm('hc_ring', '#f0c050')
    tip = pm('hc_tip', '#2a1a14')
    black = pm('hc_eye', '#141010')

    # a whelk shell: whorls winding up to a point, the opening to the front
    s = Blob(0.0026)
    steps = 48
    for k in range(steps):
        t = k / (steps - 1)
        a = t * 3.6 * 2 * math.pi
        r = 0.032 * (1 - t) ** 1.7 + 0.003
        wr = r * 0.45
        # the spire rises back and up from the big body whorl to a sharp point
        cx = math.cos(a) * wr
        cz = -0.01 - t * 0.085
        cy = 0.034 + t * 0.045 + math.sin(a) * wr * 0.6
        s.ball((cx, cy, cz), r)
    s.ell((0, 0.032, 0.008), 0.03, 0.028, 0.02)

    def whelk(x, y, z):
        if z > 0.014:
            return lip
        return band if math.sin(math.atan2(y - 0.04, x) * 3 + z * 180) > 0.55 else cream
    s.build(whelk, 1400)

    # the crab peeping out of the opening: its head, eyes, legs and claws
    h = Blob(0.0022)
    h.ell((0, 0.03, 0.028), 0.018, 0.012, 0.014)
    h.build(body, 200)
    for sx in (-1, 1):
        st = Blob(0.002)
        st.cap((sx * 0.006, 0.036, 0.036), (sx * 0.008, 0.05, 0.042), 0.0028, 0.0024)
        st.build(body, 60)
        ball(uid('eye'), 0.0038, B(sx * 0.008, 0.053, 0.043), black, segs=10)
    for i in range(4):
        sx = -1 if i < 2 else 1
        z0 = 0.03 - (i % 2) * 0.012
        root = (sx * 0.014, 0.026, z0)
        with anim_group(f'leg{i}', B(*root)):
            knee = (sx * 0.042, 0.04, z0 + 0.012)
            foot = (sx * 0.06, 0.0, z0 + 0.02)
            lg = Blob(0.002)
            lg.cap(root, knee, 0.0052, 0.0042)
            lg.cap(knee, foot, 0.004, 0.0015)
            lg.build(lambda x, y, z, kx=knee[0]: ring if abs(x - kx) < 0.004 else (tip if y < 0.004 else leg), 140)
    # the left claw of a hermit crab is the big one; it closes the shell like a door
    for i, sx in enumerate((-1, 1)):
        big = 1.35 if sx < 0 else 0.8
        pivot = (sx * 0.01, 0.028, 0.036)
        with anim_group(f'claw{i}', B(*pivot)):
            c = Blob(0.002)
            palm = (sx * 0.014, 0.03, 0.052)
            c.cap(pivot, palm, 0.005, 0.005)
            c.ell(palm, 0.01 * big, 0.008 * big, 0.013 * big)
            c.cap((palm[0], palm[1] - 0.002, palm[2] + 0.01 * big), (palm[0] - sx * 0.003, palm[1] - 0.002, palm[2] + 0.022 * big), 0.004 * big, 0.0014)
            c.build(lambda x, y, z, pz=palm[2]: tip if z > pz + 0.016 * big else body, 200)
    finish('hermit_crab', tex=512, vivid=1.05, ao_min=0.8, ao_dist=0.03)


def rock_crab():
    crab('rock_crab', pm('rc_top', '#b8432a', '#c85236', scale=70), pm('rc_spot', '#7c2a1a'), pm('rc_under', '#ecd2ac'),
         pm('rc_leg', '#c05438', '#cc6446', scale=80), pm('rc_claw', '#b8432a', '#c85236', scale=70), pm('rc_tip', '#1c1410'))


def blue_crab():
    crab('blue_crab', pm('bc_top', '#66764e', '#5a6a44', scale=70), pm('bc_spot', '#4a583a'), pm('bc_under', '#f2eee2'),
         pm('bc_leg', '#4a7cc0', '#5a8ccc', scale=80), pm('bc_claw', '#3a6ab8', '#4a7ac4', scale=70), pm('bc_tip', '#d0442e'),
         W=0.056, spines=True, paddles=True)


def ghost_crab():
    crab('ghost_crab', pm('gc_top', '#e2d2b0', '#d6c49e', scale=70), pm('gc_spot', '#c4b08a'), pm('gc_under', '#f6f0e2'),
         pm('gc_leg', '#e6d8bc', '#dccaa8', scale=80), pm('gc_claw', '#ecdfc4'), pm('gc_tip', '#f8f2e6'),
         W=0.042, ghost=True)


def sandpiper():
    """A sanderling, the little wader that runs the tide line: pale grey back with a dark
    shoulder, white face and belly, black bill and legs. Parts: `head` (pecking, at the neck)
    and `leg0/1` (left, right, at the hips). The feet stand at y 0."""
    grey = pm('sp_back', '#a8a49c', '#bcb8b0', scale=70)
    dark = pm('sp_dark', '#4a4642')
    white = pm('sp_white', '#f6f4f0', '#ffffff', scale=40)
    black = pm('sp_black', '#1a1816')
    Y = 0.052

    def body(x, y, z):
        if y < Y - 0.004:
            return white
        if z > 0.0 and abs(x) > 0.02 and y < Y + 0.02:
            return dark                                           # the dark shoulder
        return grey
    b = Blob(0.0024)
    b.ell((0, Y, 0), 0.026, 0.024, 0.045)
    b.ell((0, Y + 0.004, -0.05), 0.016, 0.008, 0.028)             # wing tips over the tail
    b.build(body, 600)
    with anim_group('head', B(0, Y + 0.02, 0.03)):
        h = Blob(0.0022)
        h.ball((0, Y + 0.03, 0.045), 0.019)
        h.cap((0, Y + 0.022, 0.03), (0, Y + 0.03, 0.045), 0.015, 0.016)
        h.build(lambda x, y, z: white if (y < Y + 0.026 or z > 0.055) else grey, 300)
        bk = Blob(0.0015)
        bk.cap((0, Y + 0.028, 0.062), (0, Y + 0.022, 0.09), 0.0035, 0.0016)
        bk.build(black, 60)
        for sx in (-1, 1):
            ball(uid('eye'), 0.0035, B(sx * 0.013, Y + 0.036, 0.055), black, segs=8)
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'leg{i}', B(sx * 0.01, Y - 0.015, 0.0)):
            lg = Blob(0.0015)
            lg.cap((sx * 0.01, Y - 0.015, 0.0), (sx * 0.01, 0.004, 0.004), 0.0028, 0.0022)
            lg.ell((sx * 0.01, 0.002, 0.012), 0.004, 0.0015, 0.01)
            lg.build(black, 60)
    finish('sandpiper', tex=256, vivid=1.05, ao_min=0.85, ao_dist=0.03)


def harbor_seal():
    """A harbour seal hauled out on the sand: a plump spindle of a body, grey with dark rings
    and spots, paler below, a round dog like head with big dark eyes and whiskers. Parts:
    `head` (at the neck), the fore flippers `flip0/1` (left, right) and the hind flippers `tail`."""
    grey = pm('hs_grey', '#8a8e92', '#9a9ea2', scale=40)
    spot = pm('hs_spot', '#4a4e54')
    pale = pm('hs_pale', '#c8c6c0', '#d6d4ce', scale=40)
    black = pm('hs_black', '#141414')
    nose = pm('hs_nose', '#2a2a2c')
    whisk = pm('hs_whisk', '#a8a49e')

    def coat(x, y, z):
        if y < 0.045:
            return pale
        return spot if noise(x, y, z, 26) > 0.3 else grey
    b = Blob(0.005)
    b.ell((0, 0.075, 0.02), 0.11, 0.075, 0.2)                      # body
    b.cap((0, 0.07, -0.12), (0, 0.05, -0.25), 0.075, 0.04)          # tapering to the hips
    b.cap((0, 0.08, 0.12), (0, 0.095, 0.2), 0.08, 0.06)             # the neck
    b.build(coat, 1600)
    with anim_group('head', B(0, 0.1, 0.19)):
        h = Blob(0.004)
        h.ball((0, 0.12, 0.25), 0.062)
        h.ell((0, 0.105, 0.3), 0.036, 0.03, 0.034)                  # the muzzle
        h.build(coat, 700)
        for sx in (-1, 1):
            ball(uid('eye'), 0.014, B(sx * 0.03, 0.135, 0.292), black, segs=12)
            # the whisker pads on the muzzle
            ball(uid('pad'), 0.016, B(sx * 0.016, 0.1, 0.318), whisk, scale=(1, 0.8, 0.8), segs=10)
        ball(uid('nose'), 0.012, B(0, 0.112, 0.33), nose, scale=(1.3, 1, 0.8), segs=10)
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'flip{i}', B(sx * 0.09, 0.04, 0.1)):
            f = Blob(0.003)
            f.cap((sx * 0.09, 0.04, 0.1), (sx * 0.14, 0.012, 0.13), 0.022, 0.014)
            f.build(grey, 200)
    with anim_group('tail', B(0, 0.05, -0.25)):
        t = Blob(0.003)
        for sx in (-1, 1):
            t.cap((sx * 0.015, 0.05, -0.25), (sx * 0.04, 0.04, -0.34), 0.026, 0.01)
            t.ell((sx * 0.045, 0.035, -0.35), 0.03, 0.008, 0.028)
        t.build(grey, 300)
    finish('harbor_seal', tex=512, vivid=1.05, ao_min=0.8, ao_dist=0.06)


MODELS = {'rock_crab': rock_crab, 'blue_crab': blue_crab, 'ghost_crab': ghost_crab, 'hermit_crab': hermit_crab,
          'sandpiper': sandpiper, 'harbor_seal': harbor_seal}

if __name__ == '__main__':
    main(MODELS)
