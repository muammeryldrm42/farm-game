# A Holstein cow drawn as in the game's trailer: true cow proportions (a long deep barrel on long
# jointed legs, a long narrow face), soft cream white and charcoal patches with organic edges, a
# big pink udder, a black head with a white blaze and a pink muzzle, small horns and level ears.
# The patches, the blaze and a soft light from above (the underside a shade darker, as a painter
# would) are drawn by shaders, so their edges are clean curves; the bake adds soft shadows in the
# creases. The parts are the game's (`head`, `leg0..3`, `tail`, each turning about its own
# joint), so it can stand in for animal_cow; it is written as animal_cow_hd and leaves the cow in
# use untouched.
# Coordinates below are the game's: x right, y up, z toward the cow's nose (see animals.B).
# Run: python3 tools/blender/cow_hd.py
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from animals import B, Blob  # noqa: E402
from common import _lin  # noqa: E402
from kit import anim_group, finish, main  # noqa: E402

# the joints: the head turns where it meets the neck, the legs at the shoulder and the hip
HEAD = (0.0, 0.392, 0.282)
FRONT, HIND = 0.15, -0.15
LEGS = [(-0.062, 0.3, FRONT), (0.062, 0.3, FRONT), (-0.066, 0.31, HIND), (0.066, 0.31, HIND)]
TAIL = (0.0, 0.415, -0.25)


# ---------------------------------------------------------------- shader helpers

class NB:
    """A small builder for node materials: sockets in, sockets out."""

    def __init__(self, name, rough=0.8):
        self.m = bpy.data.materials.new(name)
        self.m.use_nodes = True
        self.nt = self.m.node_tree
        self.bsdf = self.nt.nodes['Principled BSDF']
        self.bsdf.inputs['Roughness'].default_value = rough
        tc = self.nt.nodes.new('ShaderNodeTexCoord')
        self.co = tc.outputs['Object']
        sep = self.nt.nodes.new('ShaderNodeSeparateXYZ')
        self.nt.links.new(self.co, sep.inputs[0])
        # game axes from Blender's: x, y = Blender z, z = -Blender y
        self.x = sep.outputs['X']
        self.y = sep.outputs['Z']
        self.z = self.math('MULTIPLY', sep.outputs['Y'], -1.0)

    def _in(self, sock, v):
        if isinstance(v, (int, float)):
            sock.default_value = v
        else:
            self.nt.links.new(v, sock)

    def math(self, op, a, b=0.0, c=None):
        n = self.nt.nodes.new('ShaderNodeMath')
        n.operation = op
        self._in(n.inputs[0], a)
        self._in(n.inputs[1], b)
        if c is not None:
            self._in(n.inputs[2], c)
        return n.outputs[0]

    def smooth(self, e0, e1, v):
        """smoothstep(e0, e1, v), 0 below e0 and 1 above e1."""
        n = self.nt.nodes.new('ShaderNodeMapRange')
        n.interpolation_type = 'SMOOTHSTEP'
        self._in(n.inputs['Value'], v)
        n.inputs['From Min'].default_value = e0
        n.inputs['From Max'].default_value = e1
        return n.outputs['Result']

    def noise(self, scale, detail=2.0, rough=0.5, dist=0.0, offset=(0, 0, 0), stretch=(1, 1, 1)):
        mp = self.nt.nodes.new('ShaderNodeMapping')
        mp.inputs['Location'].default_value = offset
        mp.inputs['Scale'].default_value = stretch
        self.nt.links.new(self.co, mp.inputs['Vector'])
        n = self.nt.nodes.new('ShaderNodeTexNoise')
        n.inputs['Scale'].default_value = scale
        n.inputs['Detail'].default_value = detail
        n.inputs['Roughness'].default_value = rough
        n.inputs['Distortion'].default_value = dist
        self.nt.links.new(mp.outputs['Vector'], n.inputs['Vector'])
        return n.outputs['Fac']

    def dist(self, p):
        """Distance from the game point p."""
        v = self.nt.nodes.new('ShaderNodeVectorMath')
        v.operation = 'DISTANCE'
        self.nt.links.new(self.co, v.inputs[0])
        v.inputs[1].default_value = B(*p)
        return v.outputs['Value']

    def mix(self, fac, a, b):
        """a where fac is 0, b where it is 1 (colours as hex or sockets)."""
        n = self.nt.nodes.new('ShaderNodeMix')
        n.data_type = 'RGBA'
        self._in(n.inputs['Factor'], fac)
        for sock, v in ((n.inputs[6], a), (n.inputs[7], b)):
            if isinstance(v, str):
                sock.default_value = _lin(v)
            else:
                self.nt.links.new(v, sock)
        return n.outputs[2]

    def fur(self, color, amt=0.08, scale=90.0):
        """A fine grain of hair over a colour: a little lighter and darker in streaks."""
        g = self.noise(scale, detail=3.0, rough=0.6, stretch=(1.0, 1.0, 3.0))
        hsv = self.nt.nodes.new('ShaderNodeHueSaturation')
        self._in(hsv.inputs['Value'], self.math('MULTIPLY_ADD', g, amt * 2, 1 - amt))
        self.nt.links.new(color, hsv.inputs['Color'])
        return hsv.outputs['Color']

    def done(self, color):
        self.nt.links.new(color, self.bsdf.inputs['Base Color'])
        return self.m



# the trailer's colours: a warm cream white and a soft warm charcoal (never a hard black)
WHITE, BLACK = '#f0e8da', '#45403c'


def shade_from_above(n, col, low=0.88):
    """The underside a shade darker than the back, as the soft daylight in the trailer."""
    k = n.smooth(0.16, 0.44, n.y)
    hsv = n.nt.nodes.new('ShaderNodeHueSaturation')
    n._in(hsv.inputs['Value'], n.math('MULTIPLY_ADD', k, 1 - low, low))
    n.nt.links.new(col, hsv.inputs['Color'])
    return hsv.outputs['Color']


def patches(n, white_below):
    """Black where the patch pattern says so (about half the coat), never below `white_below`."""
    # big smooth blobs, a few to a side, with clean soft edges
    base = n.noise(8.6, detail=0.6, rough=0.5, dist=0.22, offset=(4.2, 1.3, 0.7))
    s = n.math('ADD', base, n.math('MULTIPLY', n.math('SUBTRACT', n.y, 0.33), 0.3))
    black = n.smooth(0.5, 0.512, s)
    return n.math('MULTIPLY', black, n.smooth(white_below, white_below + 0.025, n.y))


def coat_mat():
    n = NB('hd_coat', rough=0.82)
    col = n.mix(patches(n, 0.215), WHITE, BLACK)
    return n.done(shade_from_above(n, col))


def leg_mat():
    n = NB('hd_leg', rough=0.82)
    col = n.mix(patches(n, 0.15), WHITE, BLACK)
    return n.done(shade_from_above(n, col))


def face_mat():
    """A black head with a white blaze down the front of the face, narrow on the forehead and
    widening toward the muzzle."""
    n = NB('hd_face', rough=0.75)
    # the face runs from the forehead (y .405, z .305) down to the muzzle (y .345, z .385): how far
    # along it, and how far out on its front
    along = n.math('ADD', n.math('MULTIPLY', n.math('SUBTRACT', n.y, 0.405), -0.6), n.math('MULTIPLY', n.math('SUBTRACT', n.z, 0.305), 0.8))
    front = n.math('ADD', n.math('MULTIPLY', n.math('SUBTRACT', n.y, 0.405), 0.8), n.math('MULTIPLY', n.math('SUBTRACT', n.z, 0.305), 0.6))
    wobble = n.math('MULTIPLY', n.math('SUBTRACT', n.noise(30.0, detail=2.0), 0.5), 0.012)
    half = n.math('ADD', n.math('MULTIPLY_ADD', along, 0.16, 0.008), wobble)
    blaze = n.smooth(-0.002, 0.002, n.math('SUBTRACT', half, n.math('ABSOLUTE', n.x)))
    blaze = n.math('MULTIPLY', blaze, n.smooth(0.016, 0.024, front))
    blaze = n.math('MULTIPLY', blaze, n.smooth(-0.005, 0.005, along))
    # the lower face white all across its front, from below the eyes
    lower = n.math('MULTIPLY', n.smooth(0.035, 0.045, n.math('ADD', along, wobble)), n.smooth(0.004, 0.014, front))
    col = n.mix(n.math('MAXIMUM', blaze, lower), BLACK, WHITE)
    return n.done(shade_from_above(n, col, low=0.9))


def muzzle_mat():
    """Pink going greyish toward the lips, darker in the nostrils."""
    n = NB('hd_muzzle', rough=0.45)
    col = n.mix(n.smooth(0.3, 0.335, n.y), '#e6aba5', '#f3cdc5')
    for sx in (-1, 1):
        d = n.dist((sx * 0.017, 0.326, 0.428))
        col = n.mix(n.smooth(0.013, 0.006, d), col, '#a8615e')
    mottle = n.noise(30.0, detail=1.0)
    hsv = n.nt.nodes.new('ShaderNodeHueSaturation')
    n._in(hsv.inputs['Value'], n.math('MULTIPLY_ADD', mottle, 0.06, 0.97))
    n.nt.links.new(col, hsv.inputs['Color'])
    return n.done(hsv.outputs['Color'])


def flat_mat(name, a, b=None, rough=0.7, along_y=None, fur=0.04):
    n = NB(name, rough=rough)
    col = n.mix(n.smooth(along_y[0], along_y[1], n.y), a, b) if b and along_y else n.mix(0.0, a, a)
    return n.done(n.fur(col, amt=fur, scale=80.0))


def eye_mat(sx):
    """A dark brown eye with a small catch light."""
    n = NB(f'hd_eye{sx}', rough=0.2)
    ex, ey, ez = sx * 0.051, 0.392, 0.322
    col = n.mix(n.smooth(0.009, 0.0, n.dist((ex + sx * 0.006, ey, ez + 0.002))), '#0d0907', '#3b2416')
    col = n.mix(n.smooth(0.0032, 0.0022, n.dist((ex + sx * 0.004, ey + 0.004, ez + 0.006))), col, '#f4f1ea')
    return n.done(col)


_cache = {}


def cached(key, make):
    if key not in _cache:
        _cache[key] = make()
    return _cache[key]


# ---------------------------------------------------------------- the cow

def body(coat):
    b = Blob(0.004)
    b.ell((0, 0.316, -0.02), 0.102, 0.102, 0.23)       # the barrel
    b.ell((0, 0.315, 0.12), 0.09, 0.094, 0.105)        # chest
    b.ell((0, 0.338, -0.17), 0.094, 0.082, 0.1)        # hindquarters, the flank tucked up below
    b.ell((0, 0.228, -0.03), 0.092, 0.052, 0.13)       # the belly, hanging a little in the middle
    b.ell((0, 0.393, -0.04), 0.066, 0.03, 0.19)        # a straight back, on to the rump
    b.ell((0, 0.402, 0.12), 0.042, 0.032, 0.06)        # withers
    b.ell((0, 0.255, 0.2), 0.045, 0.04, 0.04)          # brisket
    for sx in (-1, 1):
        b.ell((sx * 0.07, 0.392, -0.14), 0.03, 0.02, 0.03)     # hook bones, just showing
        b.ell((sx * 0.034, 0.385, -0.238), 0.02, 0.018, 0.02)   # pin bones
        b.ell((sx * 0.055, 0.32, 0.15), 0.04, 0.08, 0.05)       # shoulders
        b.ell((sx * 0.058, 0.28, -0.18), 0.045, 0.085, 0.065)   # thighs
    b.ell((0, 0.392, -0.24), 0.026, 0.02, 0.026)       # tail head
    # the neck rising to the head, a little dewlap under it
    b.cap((0, 0.35, 0.16), (0, 0.38, 0.27), 0.058, 0.042)
    b.ell((0, 0.33, 0.2), 0.05, 0.07, 0.06)
    b.ell((0, 0.285, 0.232), 0.018, 0.04, 0.03)
    return b.build(coat, 2600)


def udder():
    pink = flat_mat('hd_udder', '#e59a8e', '#f2b6a8', rough=0.5, along_y=(0.13, 0.24), fur=0.0)
    u = Blob(0.0028)
    u.ell((0, 0.198, -0.13), 0.066, 0.056, 0.072)
    u.ell((0, 0.222, -0.1), 0.054, 0.034, 0.058)
    for x, z in ((0.026, -0.1), (-0.026, -0.1), (0.026, -0.158), (-0.026, -0.158)):
        u.cap((x, 0.16, z), (x, 0.124, z), 0.011, 0.0085)
    u.build(pink, 500)


def head(face, muzzle):
    black = cached('black', lambda: flat_mat('hd_black', BLACK, fur=0.0))
    with anim_group('head', B(*HEAD)):
        h = Blob(0.003)
        h.ell((0, 0.418, 0.29), 0.058, 0.03, 0.034)        # poll, broad between the horns
        h.ell((0, 0.398, 0.305), 0.056, 0.042, 0.04)        # forehead and eyes
        h.cap((0, 0.395, 0.31), (0, 0.345, 0.385), 0.044, 0.032)   # the long face
        h.cap((0, 0.355, 0.29), (0, 0.322, 0.36), 0.03, 0.021)    # jaw
        for sx in (-1, 1):
            h.ell((sx * 0.034, 0.362, 0.312), 0.028, 0.035, 0.04)  # cheeks
            h.ell((sx * 0.046, 0.403, 0.319), 0.015, 0.008, 0.012)  # brow
            h.ell((sx * 0.051, 0.392, 0.322), 0.0105, 0.0105, 0.0105, neg=True)  # eye socket
        h.build(face, 1800)
        m = Blob(0.0022)
        m.ell((0, 0.326, 0.405), 0.041, 0.031, 0.031)
        m.ell((0, 0.307, 0.396), 0.034, 0.017, 0.024)       # lower lip and chin
        for sx in (-1, 1):
            m.ell((sx * 0.017, 0.326, 0.432), 0.008, 0.006, 0.009, neg=True)  # nostrils
        m.build(muzzle, 700)
        for sx in (-1, 1):
            e = Blob(0.0016)
            e.ell((sx * 0.051, 0.392, 0.322), 0.0098, 0.0098, 0.0098)
            e.build(eye_mat(sx), 120)
            # level ears, a little drooping at the tips, pink inside
            ear = Blob(0.0022)
            ear.ell((sx * 0.068, 0.401, 0.29), 0.016, 0.01, 0.012)
            ear.ell((sx * 0.097, 0.396, 0.291), 0.032, 0.01, 0.02)
            ear.build(black, 260)
            inner = Blob(0.0018)
            inner.ell((sx * 0.099, 0.396, 0.298), 0.025, 0.006, 0.014)
            inner.build(cached('ear', lambda: flat_mat('hd_ear', '#dc9c98', '#ecb6b0', rough=0.6, along_y=(0.39, 0.4), fur=0.0)), 110)
            # small horns, out and up and a little forward, darker at the tips
            hn = Blob(0.0016)
            pts = [(sx * 0.036, 0.428, 0.288), (sx * 0.058, 0.442, 0.29), (sx * 0.072, 0.462, 0.3), (sx * 0.072, 0.482, 0.316)]
            rs = [0.0125, 0.0105, 0.0075, 0.0042]
            for k in range(3):
                hn.cap(pts[k], pts[k + 1], rs[k], rs[k + 1])
            hn.build(cached('horn', horn_mat), 200)
        t = Blob(0.0018)
        for dx, dz in ((0, 0.296), (0.012, 0.3), (-0.012, 0.3)):
            t.ball((dx, 0.432, dz), 0.011)                 # a tuft of hair on the poll
        t.build(black, 120)


def horn_mat():
    n = NB('hd_horn', rough=0.4)
    col = n.mix(n.smooth(0.462, 0.482, n.y), '#e8d8ae', '#a08e6a')
    return n.done(col)


def legs(leg, hoof):
    for i, (x, py, z) in enumerate(LEGS):
        front = z > 0
        with anim_group(f'leg{i}', B(x, py, z)):
            b = Blob(0.0022)
            if front:
                b.cap((x, 0.27, z), (x, 0.135, z + 0.004), 0.033, 0.024)    # forearm
                b.ball((x, 0.126, z + 0.006), 0.0225)                         # knee
                b.cap((x, 0.12, z + 0.006), (x, 0.052, z + 0.009), 0.0185, 0.0175)  # cannon
                b.ball((x, 0.046, z + 0.011), 0.0168)                         # fetlock
                b.cap((x, 0.044, z + 0.012), (x, 0.03, z + 0.019), 0.0148, 0.0155)  # pastern
                hz = z + 0.024
            else:
                b.cap((x, 0.27, z - 0.012), (x, 0.145, z - 0.045), 0.037, 0.023)  # gaskin
                b.ell((x, 0.137, z - 0.05), 0.0185, 0.021, 0.023)                # hock
                b.ball((x, 0.142, z - 0.064), 0.011)                              # point of the hock
                b.cap((x, 0.13, z - 0.047), (x, 0.052, z - 0.033), 0.0185, 0.0175)  # cannon
                b.ball((x, 0.046, z - 0.031), 0.0168)
                b.cap((x, 0.044, z - 0.03), (x, 0.03, z - 0.023), 0.0148, 0.0155)
                hz = z - 0.018
            b.build(leg, 520)
            hf = Blob(0.0016)
            hf.ell((x, 0.0145, hz), 0.0195, 0.0155, 0.024)
            hf.ell((x, 0.012, hz + 0.022), 0.0025, 0.02, 0.012, neg=True)    # the split between the claws
            hf.build(hoof, 180)
            dc = Blob(0.0014)
            dc.ell((x, 0.04, hz - 0.03), 0.008, 0.006, 0.007)                # dew claws
            dc.build(hoof, 40)


def tail(tuft):
    tx, ty, tz = TAIL
    with anim_group('tail', B(*TAIL)):
        t = Blob(0.0016)
        t.cap((tx, ty, tz), (tx, ty - 0.03, tz - 0.018), 0.011, 0.008)
        t.cap((tx, ty - 0.03, tz - 0.018), (tx, 0.15, tz - 0.024), 0.008, 0.0055)
        t.build(cached('tailc', lambda: flat_mat('hd_tail', WHITE, fur=0.0)), 200)
        f = Blob(0.0016)
        f.ell((tx, 0.128, tz - 0.024), 0.012, 0.03, 0.011)
        f.ell((tx, 0.104, tz - 0.024), 0.009, 0.014, 0.008)
        f.build(tuft, 140)


def cow_hd():
    _cache.clear()
    body(coat_mat())
    udder()
    head(face_mat(), muzzle_mat())
    legs(leg_mat(), flat_mat('hd_hoof', '#2e2a28', '#45403b', rough=0.4, along_y=(0.0, 0.03), fur=0.0))
    tail(cached('black', lambda: flat_mat('hd_black', BLACK, fur=0.0)))
    finish('animal_cow_hd', tex=1024, vivid=1.02, ao_min=0.5, ao_dist=0.07)


MODELS = {'animal_cow_hd': cow_hd}

if __name__ == '__main__':
    main(MODELS)
