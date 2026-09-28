# Sand sculptures for the beach, ten of them: a sea turtle, a leaping dolphin, a giant crab, an
# octopus, a starfish set with shells, a stepped pyramid, a tall tower with a ramp winding up it,
# a race car, a sea serpent looping out of the sand and a whale. Each stands on a low mound of
# damp sand, with pebble eyes, shells pressed in and carved lines in darker sand.
# Organic shapes are metaballs in game coordinates (y up, +z the front, see animals.py); the
# built ones use Blender coordinates (z up, front toward -Y).
# Run: python3 tools/blender/sand.py [names...]   (see kit.main)
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from animals import B, Blob, noise  # noqa: E402
from kit import ball, box, cyl, finish, main, pm, uid  # noqa: E402


def mats():
    return {
        'sand': pm('sd_sand', '#dcc488', '#ead69e', scale=30),
        'damp': pm('sd_damp', '#c4a86c', '#d0b67c', scale=30),
        'carve': pm('sd_carve', '#b0935a'),
        'pebble': pm('sd_pebble', '#3a3634', rough=0.4),
        'shells': [pm('sd_shell0', '#f8e4d8'), pm('sd_shell1', '#f2c0b0'), pm('sd_shell2', '#fff6ea'), pm('sd_shell3', '#e8c890')],
        'weed': pm('sd_weed', '#4a7a2a'),
    }


def mound(m, rx=0.44, ry=0.4, seed=1):
    """The low mound of damp sand every sculpture is built on, edged with a few shells."""
    b = Blob(0.012)
    b.ell((0, 0.0, 0), rx, 0.05, ry)
    b.build(m['damp'], 500)
    rnd = random.Random(seed)
    for k in range(7):
        a = k * math.tau / 7 + rnd.uniform(-0.3, 0.3)
        shell(m, (math.cos(a) * rx * 0.9, 0.03, math.sin(a) * ry * 0.9), rnd)


def shell(m, p, rnd, s=0.02):
    ball(uid('shell'), s, B(*p), rnd.choice(m['shells']), scale=(1, 0.7, 0.35), segs=8)


def eyes(m, pts, r=0.018):
    for p in pts:
        ball(uid('eye'), r, B(*p), m['pebble'], segs=8)


def pail(m, x, z, col, rot=0.0):
    """A toy bucket and spade left by the sculpture."""
    c = pm(f'sd_pail{col}', col)
    cyl(uid('pail'), 0.05, 0.08, B(x, 0.06, z), c, verts=14, r2=0.04)
    box(uid('spade'), (0.035, 0.008, 0.14), B(x + 0.09, 0.06, z), pm('sd_spade', '#f0c020'), rot=(0.5, 0, rot), bev=0.003)


def carved(m, fn):
    """A paint function: carved lines (fn true) in the darker sand, the rest plain sand."""
    return lambda x, y, z: m['carve'] if fn(x, y, z) else m['sand']


# ---------------------------------------------------------------- sea creatures

def sand_turtle():
    m = mats()
    mound(m, seed=1)
    b = Blob(0.01)
    b.ell((0, 0.09, -0.02), 0.26, 0.12, 0.3)                      # the shell
    b.ell((0, 0.06, 0.33), 0.075, 0.06, 0.09)                     # head
    b.cap((0, 0.05, 0.22), (0, 0.06, 0.3), 0.06, 0.06)            # neck
    for sx in (-1, 1):
        b.ell((sx * 0.28, 0.03, 0.14), 0.14, 0.025, 0.06)          # fore flippers
        b.ell((sx * 0.2, 0.03, -0.28), 0.08, 0.022, 0.05)          # hind flippers

    def plates(x, y, z):
        # the scutes of the shell drawn as carved hexagon seams
        if y < 0.12:
            return False
        u, v = x * 11, (z + 0.02) * 9
        return abs(math.sin(u) * math.sin(v + 0.5 * math.sin(u))) < 0.12
    b.build(carved(m, plates), 2600)
    eyes(m, [(-0.04, 0.09, 0.39), (0.04, 0.09, 0.39)], 0.012)
    pail(m, 0.3, -0.32, '#e8403a', 0.4)
    finish('sand_turtle', tex=512)


def sand_dolphin():
    m = mats()
    mound(m, seed=2)
    b = Blob(0.009)
    # the body arcs up out of the sand and dives back in: a leap frozen mid air
    n = 16
    for i in range(n):
        t = i / (n - 1)
        a = math.pi * (0.1 + t * 0.8)
        z = -math.cos(a) * 0.32
        y = math.sin(a) * 0.34
        r = 0.05 + math.sin(math.pi * min(1.0, t * 1.25)) * 0.045
        b.ball((0, y, z), r)
    b.cap((0, 0.25, 0.26), (0, 0.2, 0.36), 0.035, 0.02)            # the beak, pointing down
    b.cap((0, 0.38, 0.0), (0, 0.46, -0.06), 0.03, 0.01)             # dorsal fin
    for sx in (-1, 1):
        b.ell((sx * 0.07, 0.28, 0.12), 0.05, 0.012, 0.03)           # flippers
    b.build(carved(m, lambda x, y, z: abs(y - 0.3 + 0.1 * math.cos(z * 6)) < 0.006 and z > 0.05), 2200)
    eyes(m, [(-0.05, 0.3, 0.22), (0.05, 0.3, 0.22)], 0.01)
    finish('sand_dolphin', tex=512)


def sand_crab():
    m = mats()
    mound(m, seed=3)
    b = Blob(0.01)
    b.ell((0, 0.09, 0), 0.24, 0.1, 0.17)                          # the carapace
    for sx in (-1, 1):
        for k in range(4):
            z = 0.08 - k * 0.07
            b.cap((sx * 0.2, 0.06, z), (sx * 0.3, 0.1, z * 1.2), 0.028, 0.022)
            b.cap((sx * 0.3, 0.1, z * 1.2), (sx * 0.38, 0.02, z * 1.4), 0.02, 0.012)
        b.cap((sx * 0.13, 0.08, 0.14), (sx * 0.2, 0.1, 0.26), 0.035, 0.03)          # arm
        b.ell((sx * 0.21, 0.11, 0.32), 0.06, 0.05, 0.07)                             # claw
        b.cap((sx * 0.19, 0.1, 0.37), (sx * 0.14, 0.1, 0.43), 0.025, 0.01)          # pincer
        b.cap((sx * 0.24, 0.14, 0.37), (sx * 0.18, 0.14, 0.44), 0.02, 0.008)
        b.cap((sx * 0.05, 0.15, 0.12), (sx * 0.06, 0.2, 0.14), 0.014, 0.012)        # eye stalk
    b.build(carved(m, lambda x, y, z: y > 0.17 and abs(math.sin(x * 30)) < 0.1 and abs(z) < 0.12), 2600)
    eyes(m, [(-0.06, 0.215, 0.145), (0.06, 0.215, 0.145)], 0.016)
    pail(m, -0.3, -0.3, '#2a7ad8', -0.3)
    finish('sand_crab', tex=512)


def sand_octopus():
    m = mats()
    mound(m, seed=4)
    b = Blob(0.009)
    b.ell((0, 0.22, -0.04), 0.14, 0.17, 0.15)                     # the mantle, the big round head
    b.ell((0, 0.1, 0.02), 0.13, 0.08, 0.13)
    # eight arms curling out over the sand
    for k in range(8):
        a0 = k * math.tau / 8 + 0.2
        curl = 1 if k % 2 else -1
        pts = []
        for i in range(9):
            t = i / 8
            r = 0.1 + t * 0.3
            a = a0 + curl * t * t * 1.4
            pts.append((math.cos(a) * r, 0.05 * (1 - t) + 0.02, math.sin(a) * r))
        for i in range(8):
            b.cap(pts[i], pts[i + 1], 0.035 * (1 - i / 9) + 0.008, 0.035 * (1 - (i + 1) / 9) + 0.008)
    b.build(m['sand'], 3000)
    rnd = random.Random(4)
    # a row of shell suckers pressed along each arm
    for k in range(8):
        a0 = k * math.tau / 8 + 0.2
        curl = 1 if k % 2 else -1
        for i in (3, 5, 7):
            t = i / 8
            r, a = 0.1 + t * 0.3, a0 + curl * t * t * 1.4
            ball(uid('sucker'), 0.009, B(math.cos(a) * r, 0.055 * (1 - t) + 0.035, math.sin(a) * r), rnd.choice(m['shells']), scale=(1, 1, 0.5), segs=6)
    eyes(m, [(-0.07, 0.26, 0.1), (0.07, 0.26, 0.1)], 0.02)
    finish('sand_octopus', tex=512)


def sand_starfish():
    m = mats()
    mound(m, seed=5)
    b = Blob(0.01)
    b.ell((0, 0.07, 0), 0.1, 0.06, 0.1)
    for k in range(5):
        a = k * math.tau / 5 + math.pi / 2
        b.cap((0, 0.07, 0), (math.cos(a) * 0.36, 0.035, math.sin(a) * 0.36), 0.075, 0.025)
    b.build(m['sand'], 2000)
    rnd = random.Random(5)
    # shells set in rows down every arm, a sun of shells in the middle
    for k in range(5):
        a = k * math.tau / 5 + math.pi / 2
        for i in range(1, 6):
            r = i * 0.06
            shell(m, (math.cos(a) * r, 0.1 - r * 0.15, math.sin(a) * r), rnd, 0.017 - i * 0.0015)
    ball(uid('centre'), 0.03, B(0, 0.13, 0), m['shells'][1], scale=(1, 1, 0.5), segs=10)
    pail(m, 0.32, 0.3, '#f0a020', 1.2)
    finish('sand_starfish', tex=512)


def sand_serpent():
    m = mats()
    mound(m, rx=0.46, ry=0.36, seed=6)
    b = Blob(0.009)
    # three humps looping out of the sand, then the head rearing up at the front
    for j, (z0, h) in enumerate([(-0.3, 0.14), (-0.08, 0.17), (0.14, 0.15)]):
        n = 10
        for i in range(n):
            t = i / (n - 1)
            a = math.pi * t
            b.ball((0.03 * math.sin(j * 2), math.sin(a) * h, z0 + (1 - math.cos(a)) * 0.08), 0.042 - j * 0.003)
    b.cap((0, 0.0, 0.33), (0, 0.2, 0.36), 0.045, 0.045)
    b.ell((0, 0.24, 0.39), 0.06, 0.05, 0.08)                        # the head
    for sx in (-1, 1):
        b.cap((sx * 0.03, 0.28, 0.36), (sx * 0.06, 0.34, 0.32), 0.012, 0.004)    # little horns
    b.cap((0, 0.02, -0.38), (0, 0.06, -0.44), 0.02, 0.006)          # the tail tip
    b.build(carved(m, lambda x, y, z: y > 0.03 and abs(math.sin(z * 60 + y * 30)) < 0.08), 2600)
    eyes(m, [(-0.04, 0.27, 0.44), (0.04, 0.27, 0.44)], 0.011)
    finish('sand_serpent', tex=512)


def sand_whale():
    m = mats()
    mound(m, seed=7)
    b = Blob(0.01)
    b.ell((0, 0.12, 0.05), 0.2, 0.13, 0.32)                        # the body
    b.cap((0, 0.1, -0.2), (0, 0.15, -0.33), 0.085, 0.045)          # tail stock rising
    b.cap((0, 0.15, -0.33), (0, 0.19, -0.4), 0.045, 0.03)
    for sx in (-1, 1):
        b.ell((sx * 0.08, 0.2, -0.42), 0.1, 0.02, 0.05)             # the flukes, lifted
        b.ell((sx * 0.2, 0.05, 0.12), 0.1, 0.02, 0.05)              # flippers on the sand
    b.build(carved(m, lambda x, y, z: y < 0.1 and z > 0.1 and abs(math.sin(x * 70)) < 0.18), 2600)
    eyes(m, [(-0.15, 0.12, 0.24), (0.15, 0.12, 0.24)], 0.014)
    ball(uid('blowhole'), 0.015, B(0, 0.25, 0.14), m['carve'], scale=(1.4, 1, 0.3), segs=8)
    pail(m, 0.3, 0.32, '#3aa84a', 0.8)
    finish('sand_whale', tex=512)


# ---------------------------------------------------------------- built ones

def sand_pyramid():
    m = mats()
    mound(m, seed=8)
    s = m['sand']
    for k in range(5):
        w = 0.66 - k * 0.13
        box(uid('step'), (w, w, 0.075), (0, 0, 0.05 + k * 0.075), s, bev=0.01)
    box(uid('cap'), (0.1, 0.1, 0.06), (0, 0, 0.44), s, bev=0.01)
    # a doorway on the front face, and shells along the bottom step
    box(uid('door'), (0.08, 0.02, 0.1), (0, -0.335, 0.1), m['carve'], bev=0.004)
    rnd = random.Random(8)
    for k in range(9):
        shell(m, (-0.28 + k * 0.07, 0.09, 0.335), rnd, 0.014)
    pail(m, -0.32, 0.32, '#e8403a', -0.8)
    finish('sand_pyramid', tex=512)


def sand_tower():
    m = mats()
    mound(m, seed=9)
    s = m['sand']
    cyl(uid('tower'), 0.16, 0.62, (0, 0, 0.33), s, verts=20, r2=0.12)
    # a ramp winding up the tower, with a low wall along its edge
    n = 26
    for i in range(n):
        t = i / (n - 1)
        a = t * math.tau * 1.6
        z = 0.06 + t * 0.52
        r = 0.16 - t * 0.04 + 0.04
        box(uid('ramp'), (0.07, 0.06, 0.02), (math.cos(a) * r, math.sin(a) * r, z), s, rot=(0, 0, a), bev=0.004)
        if i % 2 == 0:
            box(uid('wall'), (0.02, 0.02, 0.03), (math.cos(a) * (r + 0.035), math.sin(a) * (r + 0.035), z + 0.025), s, rot=(0, 0, a), bev=0.003)
    for k in range(8):
        a = k * math.tau / 8
        box(uid('cren'), (0.04, 0.04, 0.05), (math.cos(a) * 0.11, math.sin(a) * 0.11, 0.66), s, rot=(0, 0, a), bev=0.004)
    cyl(uid('pole'), 0.005, 0.18, (0, 0, 0.73), pm('sd_pole', '#8a5a2a'), verts=5)
    box(uid('flag'), (0.08, 0.005, 0.05), (0.04, 0, 0.8), pm('sd_flag', '#2a7ad8'), bev=0)
    for k in range(4):
        a = k * 1.3 + 0.4
        ball(uid('window'), 0.02, (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.2 + k * 0.1), m['carve'], scale=(1, 0.4, 1.3), segs=8)
    finish('sand_tower', tex=512)


def sand_car():
    m = mats()
    mound(m, rx=0.46, ry=0.34, seed=10)
    b = Blob(0.01)
    # a low racer: long nose, a cockpit scooped out, wheels at the corners, a spoiler behind
    b.ell((0, 0.09, 0.02), 0.16, 0.07, 0.38)
    b.ell((0, 0.12, -0.12), 0.14, 0.06, 0.12)
    b.ell((0, 0.14, -0.06), 0.07, 0.04, 0.06, neg=True)              # the cockpit
    for sx in (-1, 1):
        for z in (0.22, -0.24):
            b.ell((sx * 0.18, 0.07, z), 0.05, 0.07, 0.07)              # wheels
    b.cap((-0.13, 0.16, -0.33), (0.13, 0.16, -0.33), 0.022, 0.022)      # the spoiler
    for sx in (-1, 1):
        b.cap((sx * 0.1, 0.1, -0.3), (sx * 0.1, 0.16, -0.33), 0.015, 0.015)
    b.build(carved(m, lambda x, y, z: abs(abs(x) - 0.18) < 0.03 and abs(abs(z + 0.01) - 0.23) < 0.05 and abs(x) > 0.2), 2600)
    rnd = random.Random(10)
    # a number one in shells on the nose, and headlights
    for k in range(4):
        shell(m, (0.0, 0.16 - k * 0.012, 0.18 + k * 0.035), rnd, 0.012)
    for sx in (-1, 1):
        ball(uid('light'), 0.02, B(sx * 0.08, 0.1, 0.39), m['shells'][2], scale=(1, 0.6, 1), segs=8)
    pail(m, 0.33, -0.3, '#e8403a', 0.2)
    finish('sand_car', tex=512)


MODELS = {'sand_turtle': sand_turtle, 'sand_dolphin': sand_dolphin, 'sand_crab': sand_crab, 'sand_octopus': sand_octopus,
          'sand_starfish': sand_starfish, 'sand_pyramid': sand_pyramid, 'sand_tower': sand_tower, 'sand_car': sand_car,
          'sand_serpent': sand_serpent, 'sand_whale': sand_whale}

if __name__ == '__main__':
    main(MODELS)
