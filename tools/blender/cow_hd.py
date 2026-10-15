# A detailed Holstein cow in the chunky storybook style of the game's trailer: a deep barrel of a
# body with a straight back and the hip bones showing, sturdy legs on split hooves, a big kind
# head with a broad pink muzzle, short horns, ears held out to the sides and glossy dark eyes.
# The coat's black patches are drawn by a shader (not face by face), so their edges are clean
# curves, with a little fur grain over everything; the bake adds soft shadows in the creases.
# Parts and pivots are the cow's (`head`, `leg0..3`, `tail`, see breeds.py and the meta of
# sculpts/real_cow.json), so it can stand in for animal_cow without changes to the game; it is
# written as animal_cow_hd and leaves the cow in use untouched.
# Coordinates below are the game's: x right, y up, z toward the cow's nose (see animals.B).
# Run: python3 tools/blender/cow_hd.py
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from animals import B, Blob  # noqa: E402
from common import _lin  # noqa: E402
from kit import anim_group, finish, main  # noqa: E402

HEAD = (0.0, 0.41, 0.26)            # the neck pivot
HIPS = [(-0.075, 0.15), (0.075, 0.15), (-0.075, -0.15), (0.075, -0.15)]  # front left, front right, back left, back right
LEG = 0.2                           # hip height
TAIL = (0.0, 0.42, -0.25)


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


WHITE, BLACK = '#f6f2ea', '#1c1a19'


def coat_mat():
    """Big rounded black patches over white; white low on the legs and under the belly."""
    n = NB('hd_coat', rough=0.75)
    spots = n.noise(4.6, detail=1.4, rough=0.45, dist=0.3, offset=(4.2, 1.3, 0.7))
    # patches mostly up on the sides and the back; the lower legs and the belly stay white
    bias = n.math('MULTIPLY', n.math('SUBTRACT', n.y, 0.36), 0.5)
    s = n.math('ADD', spots, bias)
    black = n.smooth(0.522, 0.536, s)
    low = n.smooth(0.1, 0.13, n.y)
    black = n.math('MULTIPLY', black, low)
    col = n.mix(black, WHITE, BLACK)
    return n.done(n.fur(col))


def leg_mat():
    """The legs carry the body's patches down to the knee, white below."""
    n = NB('hd_leg', rough=0.75)
    spots = n.noise(4.6, detail=1.4, rough=0.45, dist=0.3, offset=(4.2, 1.3, 0.7))
    bias = n.math('MULTIPLY', n.math('SUBTRACT', n.y, 0.36), 0.5)
    black = n.smooth(0.522, 0.536, n.math("ADD", spots, bias))
    black = n.math('MULTIPLY', black, n.smooth(0.12, 0.15, n.y))
    return n.done(n.fur(n.mix(black, WHITE, BLACK)))


def face_mat():
    """A black head with a white blaze down the face, narrow between the eyes and widening to
    the muzzle, and white round the muzzle's top."""
    hx, hy, hz = HEAD
    n = NB('hd_face', rough=0.7)
    ly = n.math('SUBTRACT', n.y, hy)
    lz = n.math('SUBTRACT', n.z, hz)
    ax = n.math('ABSOLUTE', n.x)
    wobble = n.math('MULTIPLY', n.math('SUBTRACT', n.noise(18.0, detail=2.0), 0.5), 0.03)
    # half width of the blaze at each height: 0.016 on the forehead, 0.05 by the muzzle
    half = n.math('ADD', n.math('MULTIPLY_ADD', n.math('SUBTRACT', 0.09, ly), 0.32, 0.012), wobble)
    inside = n.math('SUBTRACT', half, ax)
    blaze = n.smooth(-0.003, 0.003, inside)
    front = n.smooth(0.06, 0.08, lz)
    white = n.math('MULTIPLY', blaze, front)
    # the jaw and the muzzle's top white too
    jaw = n.math('MULTIPLY', n.smooth(0.01, -0.01, n.math('ADD', ly, 0.035)), n.smooth(0.1, 0.13, lz))
    white = n.math('MAXIMUM', white, jaw)
    col = n.mix(white, BLACK, WHITE)
    return n.done(n.fur(col, amt=0.06, scale=120.0))


def muzzle_mat():
    """Soft pink, a shade darker round the nostrils and lighter on top."""
    hx, hy, hz = HEAD
    n = NB('hd_muzzle', rough=0.45)
    top = n.smooth(-0.07, -0.02, n.math('SUBTRACT', n.y, hy))
    col = n.mix(top, '#d98d8f', '#f2b5b1')
    for sx in (-1, 1):
        d = n.dist((hx + sx * 0.032, hy - 0.05, hz + 0.236))
        col = n.mix(n.smooth(0.026, 0.012, d), col, '#8a4a4c')
    mottle = n.noise(40.0, detail=3.0)
    hsv = n.nt.nodes.new('ShaderNodeHueSaturation')
    n._in(hsv.inputs['Value'], n.math('MULTIPLY_ADD', mottle, 0.12, 0.94))
    n.nt.links.new(col, hsv.inputs['Color'])
    return n.done(hsv.outputs['Color'])


def flat_mat(name, a, b=None, rough=0.7, along_y=None):
    """One colour, or a blend from a to b up the game's y between along_y = (y0, y1)."""
    n = NB(name, rough=rough)
    if b and along_y:
        col = n.mix(n.smooth(along_y[0], along_y[1], n.y), a, b)
    else:
        col = n.mix(0.0, a, a)
    return n.done(n.fur(col, amt=0.04, scale=60.0))


def eye_mat(sx):
    """A glossy dark eye with a white catch light up front, toward the sun."""
    hx, hy, hz = HEAD
    n = NB(f'hd_eye{sx}', rough=0.2)
    ex, ey, ez = hx + sx * 0.071, hy + 0.045, hz + 0.088
    c = n.dist((ex + sx * 0.004, ey + 0.009, ez + 0.012))
    col = n.mix(n.smooth(0.016, 0.0, n.dist((ex + sx * 0.012, ey, ez + 0.004))), '#120c0a', '#3a2418')
    col = n.mix(n.smooth(0.0062, 0.0045, c), col, '#ffffff')
    return n.done(col)


# ---------------------------------------------------------------- the cow

def body(coat):
    b = Blob(0.0045)
    # the barrel: deep chest, round belly, broad rump
    b.ell((0, 0.335, -0.01), 0.128, 0.112, 0.225)
    b.ell((0, 0.335, 0.13), 0.122, 0.116, 0.11)       # chest and shoulders
    b.ell((0, 0.34, -0.16), 0.12, 0.108, 0.12)        # rump
    b.ell((0, 0.27, -0.01), 0.11, 0.07, 0.17)         # belly
    b.ell((0, 0.42, 0.14), 0.06, 0.035, 0.07)         # withers
    for sx in (-1, 1):
        b.ell((sx * 0.08, 0.415, -0.17), 0.04, 0.025, 0.04)  # hip bones, just showing
        b.ell((sx * 0.058, 0.29, -0.185), 0.05, 0.088, 0.068)  # thighs, within the rump's width
        b.ell((sx * 0.075, 0.32, 0.14), 0.055, 0.085, 0.06)  # shoulders
    b.ell((0, 0.405, -0.265), 0.045, 0.035, 0.035)    # tail head
    # the neck to the head, and the dewlap under it
    b.ell((0, 0.385, 0.22), 0.085, 0.09, 0.08)
    b.ell((0, 0.3, 0.2), 0.04, 0.06, 0.05)
    return b.build(coat, 2400)


def udder():
    pink = flat_mat('hd_udder', '#e89a9a', '#f4b8b4', rough=0.5, along_y=(0.16, 0.24))
    u = Blob(0.003)
    u.ell((0, 0.205, -0.1), 0.062, 0.046, 0.058)
    u.ell((0, 0.22, -0.08), 0.05, 0.03, 0.04)
    for x, z in ((0.024, -0.075), (-0.024, -0.075), (0.024, -0.122), (-0.024, -0.122)):
        u.cap((x, 0.18, z), (x, 0.142, z), 0.011, 0.0085)
    u.build(pink, 450)


def head(face, muzzle):
    hx, hy, hz = HEAD
    o = lambda x, y, z: (hx + x, hy + y, hz + z)  # noqa: E731
    with anim_group('head', B(*HEAD)):
        h = Blob(0.0035)
        h.ell(o(0, 0.03, 0.04), 0.085, 0.085, 0.09)      # skull
        h.ell(o(0, -0.005, 0.12), 0.07, 0.075, 0.09)     # face, tapering to the muzzle
        h.ell(o(0, 0.09, 0.03), 0.06, 0.03, 0.05)        # poll between the horns
        for sx in (-1, 1):
            h.ell(o(sx * 0.055, 0.055, 0.085), 0.03, 0.022, 0.03)  # brow over the eye
            h.ell(o(sx * 0.05, -0.04, 0.09), 0.035, 0.04, 0.05)    # cheeks
            h.ell(o(sx * 0.071, 0.045, 0.088), 0.019, 0.019, 0.019, neg=True)  # eye socket
        h.build(face, 1700)
        m = Blob(0.003)
        m.ell(o(0, -0.045, 0.2), 0.072, 0.056, 0.05)
        m.ell(o(0, -0.07, 0.19), 0.06, 0.03, 0.045)      # chin and lower lip
        for sx in (-1, 1):
            m.ell(o(sx * 0.032, -0.05, 0.248), 0.015, 0.012, 0.016, neg=True)  # nostrils
        m.build(muzzle, 650)
        for sx in (-1, 1):
            e = Blob(0.0022)
            e.ell(o(sx * 0.071, 0.045, 0.088), 0.0185, 0.0185, 0.0185)
            e.build(eye_mat(sx), 160)
            # ears held out to the side, a little down, pink inside
            ear = Blob(0.003)
            ear.ell(o(sx * 0.125, 0.05, 0.018), 0.052, 0.02, 0.03)
            ear.ell(o(sx * 0.09, 0.052, 0.02), 0.02, 0.016, 0.018)
            ear.build(face_black(), 260)
            inner = Blob(0.0025)
            inner.ell(o(sx * 0.13, 0.049, 0.036), 0.038, 0.012, 0.018)
            inner.build(ear_pink(), 110)
            # short horns curving out and up, darker at the tips
            hn = Blob(0.0025)
            pts = [o(sx * 0.045, 0.085, 0.02), o(sx * 0.075, 0.1, 0.03), o(sx * 0.097, 0.123, 0.036), o(sx * 0.105, 0.145, 0.03)]
            rs = [0.017, 0.014, 0.0105, 0.007]
            for k in range(3):
                hn.cap(pts[k], pts[k + 1], rs[k], rs[k + 1])
            hn.build(horn_mat(), 220)
        # a curly tuft between the horns
        t = Blob(0.0025)
        for dx, dz in ((0, 0.04), (0.018, 0.05), (-0.018, 0.05), (0, 0.065)):
            t.ball(o(dx, 0.105, dz), 0.017)
        t.build(face_black(), 160)


_cache = {}


def face_black():
    if 'black' not in _cache:
        _cache['black'] = flat_mat('hd_black', BLACK)
    return _cache['black']


def ear_pink():
    if 'ear' not in _cache:
        _cache['ear'] = flat_mat('hd_ear', '#d88a8c', '#eeaaa8', rough=0.6, along_y=(0.44, 0.47))
    return _cache['ear']


def horn_mat():
    if 'horn' not in _cache:
        n = NB('hd_horn', rough=0.4)
        # pale at the root, darkening over the tip
        col = n.mix(n.smooth(0.53, 0.56, n.y), '#efe2c0', '#5a4a3a')
        _cache['horn'] = n.done(n.fur(col, amt=0.05, scale=50.0))
    return _cache['horn']


def legs(leg, hoof):
    for i, (x, z) in enumerate(HIPS):
        front = z > 0
        with anim_group(f'leg{i}', B(x, LEG, z)):
            b = Blob(0.0028)
            if front:
                b.ell((x, 0.2, z), 0.05, 0.07, 0.055)                  # forearm into the shoulder
                b.cap((x, 0.2, z), (x, 0.1, z + 0.005), 0.038, 0.03)
                b.ball((x, 0.1, z + 0.006), 0.031)                     # knee
                b.cap((x, 0.1, z + 0.006), (x, 0.045, z + 0.01), 0.027, 0.026)
            else:
                b.ell((x, 0.21, z - 0.005), 0.055, 0.08, 0.065)        # gaskin into the thigh
                b.cap((x, 0.2, z - 0.01), (x, 0.11, z - 0.03), 0.042, 0.03)
                b.ball((x, 0.105, z - 0.032), 0.03)                    # hock
                b.cap((x, 0.105, z - 0.03), (x, 0.045, z - 0.012), 0.027, 0.026)
            b.build(leg, 420)
            # a split hoof, with a dew claw behind
            zz = z + (0.012 if front else -0.01)
            hf = Blob(0.0022)
            hf.ell((x, 0.022, zz + 0.004), 0.032, 0.024, 0.036)
            hf.ell((x, 0.018, zz + 0.04), 0.004, 0.03, 0.016, neg=True)
            hf.build(hoof, 160)
            dc = Blob(0.002)
            dc.ell((x, 0.05, zz - 0.026), 0.012, 0.008, 0.01)
            dc.build(hoof, 40)


def tail(coat_white, tuft):
    tx, ty, tz = TAIL
    with anim_group('tail', B(*TAIL)):
        t = Blob(0.0022)
        t.cap((tx, ty, tz), (tx, ty - 0.05, tz - 0.022), 0.014, 0.011)
        t.cap((tx, ty - 0.05, tz - 0.022), (tx, 0.19, tz - 0.03), 0.011, 0.0085)
        t.build(coat_white, 160)
        f = Blob(0.0022)
        f.ell((tx, 0.165, tz - 0.03), 0.022, 0.04, 0.02)
        f.ell((tx, 0.14, tz - 0.03), 0.014, 0.018, 0.013)
        f.build(tuft, 140)


def cow_hd():
    coat = coat_mat()
    body(coat)
    udder()
    head(face_mat(), muzzle_mat())
    legs(leg_mat(), flat_mat('hd_hoof', '#2a2422', '#4a403a', rough=0.45, along_y=(0.0, 0.045)))
    tail(flat_mat('hd_tail', '#efebe2'), face_black())
    finish('animal_cow_hd', tex=1024, vivid=1.06, ao_min=0.55, ao_dist=0.08)


MODELS = {'animal_cow_hd': cow_hd}

if __name__ == '__main__':
    main(MODELS)
