# A Holstein cow as in the game's trailer, modelled the way an artist would: each part (the
# barrel, the neck, the long face, the legs with their knees and hocks, the ears, horns, udder
# and tail) is lofted through a run of cross sections and smoothed with subdivision, so its
# forms are clean and its outline crisp. The coat is a warm cream with soft charcoal patches
# (colours measured from the trailer), the face dark with a white front and a pink muzzle; the
# patches, the face markings and a soft light from above are drawn by shaders, and the bake adds
# soft shadows in the creases. Eyes and nostrils are placed by casting rays at the finished face.
# The parts are the game's (`head`, `leg0..3`, `tail`, each turning about its own joint), so it
# can stand in for animal_cow; it is written as animal_cow_hd and leaves the cow in use untouched.
# Coordinates below are the game's: x right, y up, z toward the cow's nose (see animals.B).
# Run: python3 tools/blender/cow_hd.py
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402,I001
import bmesh  # noqa: E402
from mathutils import Vector  # noqa: E402
from animals import B  # noqa: E402
from common import _lin  # noqa: E402
from kit import anim_group, finish, main  # noqa: E402

# the joints: the head turns where it meets the neck, the legs at the shoulder and the hip
HEAD = (0.0, 0.4, 0.3)
LEGS = [(-0.066, 0.29, 0.15), (0.066, 0.29, 0.15), (-0.072, 0.3, -0.138), (0.072, 0.3, -0.138)]
TAIL = (0.0, 0.4, -0.243)
# the face's line, from the forehead to the muzzle (for its markings)
FACE0, FACE1 = Vector((0, 0.424, 0.312)), Vector((0, 0.38, 0.458))


# ---------------------------------------------------------------- lofted, subdivided parts

def ring(c, t, rx, up, dn, segs, sq=2.0, rx_up=None, rx_dn=None, ref=(1, 0, 0)):
    """A cross section round the point c, across the direction t: `rx` to the sides (narrowing to
    rx_up at the top and rx_dn at the bottom), `up` above and `dn` below (above being the side of
    t x ref), as a superellipse (sq 2 round, higher squarer)."""
    c, t = Vector(c), Vector(t).normalized()
    r = Vector(ref)
    r = (r - t * r.dot(t)).normalized()
    u = t.cross(r)
    pts = []
    for k in range(segs):
        a = 2 * math.pi * k / segs
        ca, sa = math.cos(a), math.sin(a)
        ex = math.copysign(abs(ca) ** (2 / sq), ca)
        ey = math.copysign(abs(sa) ** (2 / sq), sa)
        w = rx
        if rx_up is not None and ey > 0:
            w = rx + (rx_up - rx) * ey
        if rx_dn is not None and ey < 0:
            w = rx + (rx_dn - rx) * -ey
        pts.append(c + r * (w * ex) + u * ((up if ey > 0 else dn) * ey))
    return pts


def path_rings(points, segs, sq=2.0, ref=(1, 0, 0)):
    """Rings along a path of (point, rx, up, dn[, extra]) entries, each across the path there."""
    out = []
    for i, e in enumerate(points):
        p = Vector(e[0])
        a = Vector(points[max(0, i - 1)][0])
        b = Vector(points[min(len(points) - 1, i + 1)][0])
        kw = e[4] if len(e) > 4 else {}
        out.append(ring(p, b - a, e[1], e[2], e[3], segs, kw.get('sq', sq), kw.get('rx_up'), kw.get('rx_dn'), ref))
    return out


def loft(name, rings, mat, sub=2, cap0=True, cap1=True, keep=None):
    """A mesh through the rings (game coordinates), closed at the ends, smoothed with subdivision
    and, if `keep` is given, thinned to that share of its faces."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vr = [[bm.verts.new(B(*p)) for p in r] for r in rings]
    n = len(rings[0])
    for a, b in zip(vr, vr[1:]):
        for k in range(n):
            bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
    if cap0:
        bm.faces.new(list(reversed(vr[0])))
    if cap1:
        bm.faces.new(vr[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    me.materials.append(mat)
    if sub:
        m = ob.modifiers.new('sub', 'SUBSURF')
        m.levels = m.render_levels = sub
    if keep:
        d = ob.modifiers.new('dec', 'DECIMATE')
        d.ratio = keep
    return ob


def blob(name, c, rx, ry, rz, mat, segs=12, sub=1):
    """A smooth ellipsoid (an eye, an udder, a tuft)."""
    rings = []
    for k in range(1, 8):
        a = -math.pi / 2 + math.pi * k / 8
        rings.append(ring((c[0], c[1] + ry * math.sin(a), c[2]), (0, 1, 0), rx * math.cos(a), rz * math.cos(a), rz * math.cos(a), segs, ref=(1, 0, 0)))
    return loft(name, rings, mat, sub=sub)


def hit(ob, origin, direction):
    """Where a ray (game coordinates) meets the finished surface of `ob`, in game coordinates."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    ok, loc, _n, _i = ev.ray_cast(Vector(B(*origin)), Vector(B(*direction)).normalized())
    if not ok:
        return None
    return (loc.x, loc.z, -loc.y)


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
    """Charcoal where the patch pattern says so (about half the coat), never below `white_below`:
    many soft edged patches, more of them up on the back."""
    base = n.noise(8.4, detail=0.45, rough=0.45, dist=0.24, offset=(4.2, 1.3, 0.7))
    s = n.math('ADD', base, n.math('MULTIPLY', n.math('SUBTRACT', n.y, 0.33), 0.3))
    black = n.smooth(0.5, 0.512, s)
    return n.math('MULTIPLY', black, n.smooth(white_below, white_below + 0.025, n.y))


def coat_mat(name='hd_coat', white_below=0.21):
    n = NB(name, rough=0.8)
    col = n.mix(patches(n, white_below), WHITE, BLACK)
    return n.done(shade_from_above(n, col))


def face_mat(nostrils):
    """The head: charcoal, with a white front from below the eyes down to the muzzle and a narrow
    blaze up the forehead, and the muzzle pink, darker in the nostrils."""
    n = NB('hd_face', rough=0.7)
    d = (FACE1 - FACE0).normalized()
    f = Vector((0, d.z, -d.y))  # across the face, toward its front
    ly, lz = n.math('SUBTRACT', n.y, FACE0.y), n.math('SUBTRACT', n.z, FACE0.z)
    along = n.math('ADD', n.math('MULTIPLY', ly, d.y), n.math('MULTIPLY', lz, d.z))
    front = n.math('ADD', n.math('MULTIPLY', ly, f.y), n.math('MULTIPLY', lz, f.z))
    wob = n.math('MULTIPLY', n.math('SUBTRACT', n.noise(30.0, detail=1.0), 0.5), 0.012)
    ax = n.math('ABSOLUTE', n.x)
    # the blaze: narrow on the forehead, widening down the face
    half = n.math('ADD', n.math('MULTIPLY_ADD', along, 0.22, 0.007), wob)
    blaze = n.smooth(-0.002, 0.002, n.math('SUBTRACT', half, ax))
    blaze = n.math('MULTIPLY', blaze, n.smooth(0.01, 0.02, front))
    # the lower face white all across its front, from below the eyes
    lower = n.math('MULTIPLY', n.smooth(0.058, 0.072, n.math('ADD', along, wob)), n.smooth(-0.004, 0.012, front))
    white = n.math('MAXIMUM', blaze, lower)
    col = n.mix(white, BLACK, WHITE)
    col = shade_from_above(n, col, low=0.9)
    # the muzzle: pink beyond its edge, a little deeper toward the lips
    length = (FACE1 - FACE0).length
    muzzle = n.smooth(length * 0.8, length * 0.8 + 0.006, n.math('ADD', along, n.math('MULTIPLY', wob, 0.5)))
    pink = n.mix(n.smooth(0.325, 0.37, n.y), '#e3a59f', '#f1c9c1')
    col = n.mix(muzzle, col, pink)
    for p in nostrils:
        col = n.mix(n.smooth(0.0085, 0.0045, n.dist(p)), col, '#9c5754')
    return n.done(col)


def flat_mat(name, a, b=None, rough=0.7, along_y=None):
    n = NB(name, rough=rough)
    col = n.mix(n.smooth(along_y[0], along_y[1], n.y), a, b) if b and along_y else n.mix(0.0, a, a)
    return n.done(col)


def ear_mat():
    """Charcoal outside, pink inside (the side facing forward)."""
    n = NB('hd_ear', rough=0.65)
    geo = n.nt.nodes.new('ShaderNodeNewGeometry')
    sep = n.nt.nodes.new('ShaderNodeSeparateXYZ')
    n.nt.links.new(geo.outputs['Normal'], sep.inputs[0])
    fwd = n.math('MULTIPLY', sep.outputs['Y'], -1.0)   # the game's z is Blender's -y
    inner = n.smooth(0.15, 0.45, fwd)
    return n.done(n.mix(inner, BLACK, '#e2a6a0'))


def eye_mat(c, sx):
    """A glossy dark brown eye with a small catch light, up and to the front."""
    n = NB(f'hd_eye{sx}', rough=0.15)
    cx, cy, cz = c
    col = n.mix(n.smooth(0.006, 0.0, n.dist((cx + sx * 0.004, cy, cz + 0.002))), '#0c0806', '#3a2416')
    col = n.mix(n.smooth(0.0026, 0.0016, n.dist((cx + sx * 0.003, cy + 0.0035, cz + 0.004))), col, '#f6f2ea')
    return n.done(col)


def horn_mat():
    n = NB('hd_horn', rough=0.4)
    return n.done(n.mix(n.smooth(0.475, 0.5, n.y), '#e8d8ae', '#a08e6a'))


# ---------------------------------------------------------------- the cow

def body(coat):
    """The barrel and the neck as one piece: from the rump forward, then rising up into the head."""
    # (point on the line through the middle, half width, above, below, extra)
    rows = [
        ((0, 0.34, -0.273), 0.037, 0.032, 0.036, {}),
        ((0, 0.334, -0.266), 0.081, 0.078, 0.086, {'rx_up': 0.066}),      # a full round rump
        ((0, 0.322, -0.243), 0.110, 0.1, 0.11, {'rx_up': 0.088}),
        ((0, 0.312, -0.198), 0.121, 0.112, 0.125, {'rx_up': 0.106}),
        ((0, 0.308, -0.129), 0.125, 0.116, 0.13, {'rx_up': 0.114}),        # across the hip bones
        ((0, 0.298, -0.074), 0.130, 0.12, 0.134, {'rx_up': 0.106, 'rx_dn': 0.119}),
        ((0, 0.293, -0.009), 0.136, 0.125, 0.138, {'rx_up': 0.103, 'rx_dn': 0.128}),  # the belly, fullest
        ((0, 0.298, 0.06), 0.131, 0.124, 0.13, {'rx_up': 0.097}),
        ((0, 0.31, 0.12), 0.119, 0.12, 0.124, {'rx_up': 0.084}),          # the withers
        ((0, 0.322, 0.172), 0.108, 0.106, 0.116, {'rx_up': 0.077}),        # shoulders
        ((0, 0.336, 0.212), 0.097, 0.09, 0.104, {'rx_up': 0.070, 'rx_dn': 0.066}),    # the neck's base, the brisket below
        ((0, 0.356, 0.245), 0.085, 0.074, 0.086, {'rx_dn': 0.059}),
        ((0, 0.377, 0.274), 0.075, 0.062, 0.072, {'rx_dn': 0.055}),        # the throat, a little dewlap
        ((0, 0.396, 0.298), 0.064, 0.05, 0.058, {}),
        ((0, 0.408, 0.316), 0.048, 0.036, 0.042, {}),                     # (inside the head)
    ]
    loft('barrel', path_rings(rows, 16, sq=2.2), coat, sub=2)


def udder():
    pink = flat_mat('hd_udder', '#e59a8e', '#f2b6a8', rough=0.5, along_y=(0.13, 0.24))
    blob('udder', (0, 0.18, -0.122), 0.074, 0.062, 0.076, pink, segs=14, sub=2)
    for x, z in ((0.03, -0.09), (-0.03, -0.09), (0.03, -0.155), (-0.03, -0.155)):
        loft('teat', path_rings([((x, 0.15, z), 0.012, 0.012, 0.012), ((x, 0.118, z), 0.01, 0.01, 0.01), ((x, 0.104, z), 0.008, 0.008, 0.008)], 8), pink, sub=1)


def head():
    with anim_group('head', B(*HEAD)):
        # the long face, from behind the poll to the muzzle: (point, half width, above, below, extra)
        d = (FACE1 - FACE0).normalized()
        P = lambda k: tuple(FACE0 + d * k)  # noqa: E731
        L = (FACE1 - FACE0).length
        face = [
            ((0, 0.425, 0.272), 0.046, 0.025, 0.036, {}),
            ((0, 0.423, 0.288), 0.074, 0.039, 0.064, {'rx_up': 0.067}),     # the poll, broad between the horns
            (P(0.0), 0.078, 0.041, 0.071, {'rx_dn': 0.053}),                # forehead and eyes, the jaw below
            (P(L * 0.28), 0.069, 0.039, 0.062, {'rx_dn': 0.048}),
            (P(L * 0.55), 0.055, 0.036, 0.048, {'rx_dn': 0.041}),           # the narrow of the face
            (P(L * 0.78), 0.058, 0.039, 0.043, {'sq': 2.3}),                # the muzzle flares
            (P(L * 0.94), 0.062, 0.038, 0.041, {'sq': 2.4}),
            (P(L * 1.05), 0.05, 0.028, 0.03, {'sq': 2.2}),
        ]
        rings = path_rings(face, 16)
        tmp = loft('headm', rings, bpy.data.materials.new('tmp'), sub=2)
        nostrils = []
        for sx in (-1, 1):
            p = hit(tmp, (sx * 0.021, FACE1.y + 0.004, 0.8), (0, 0, -1))
            if p:
                nostrils.append(p)
        tmp.data.materials.clear()
        tmp.data.materials.append(face_mat(nostrils))
        dark = cached('lid', lambda: flat_mat('hd_lid', BLACK))
        for sx in (-1, 1):
            # glossy eyes, set into the sides of the head under the brow
            e = hit(tmp, (sx * 0.3, FACE0.y - 0.007, FACE0.z + 0.026), (-sx, 0, 0))
            if e:
                c = (e[0] - sx * 0.0045, e[1], e[2])
                blob(f'eye{sx}', c, 0.0105, 0.0105, 0.0105, eye_mat(c, sx), segs=12, sub=1)
                loft(f'lid{sx}', path_rings([((c[0] + sx * 0.001, c[1] + 0.007, c[2] - 0.009), 0.004, 0.003, 0.003),
                                             ((c[0] + sx * 0.003, c[1] + 0.0095, c[2]), 0.0048, 0.0034, 0.0034),
                                             ((c[0] + sx * 0.001, c[1] + 0.007, c[2] + 0.01), 0.004, 0.003, 0.003)], 8, ref=(0, 1, 0)), dark, sub=1)
            # level ears from the sides of the poll: dark leaves with pink hollows facing forward
            b = hit(tmp, (sx * 0.3, 0.424, 0.292), (-sx, 0, 0))
            if b:
                bx, by, bz = b
                out = lambda k, up=0.0: (bx + sx * k, by - k * 0.12 + up, bz + 0.004)  # noqa: E731
                loft(f'ear{sx}', path_rings([(out(-0.006), 0.006, 0.01, 0.01), (out(0.016), 0.0065, 0.016, 0.016), (out(0.04), 0.006, 0.019, 0.017),
                                             (out(0.062), 0.0045, 0.012, 0.011), (out(0.07), 0.003, 0.004, 0.004)], 10, ref=(0, 0, 1)), dark, sub=2)
                loft(f'earin{sx}', path_rings([(out(0.012, 0.0), 0.002, 0.008, 0.008), (out(0.036, 0.0), 0.002, 0.0125, 0.011),
                                               (out(0.056, 0.0), 0.0018, 0.007, 0.006)], 8, ref=(0, 0, 1)),
                     cached('earpink', lambda: flat_mat('hd_earin', '#d99a95')), sub=2)
            # short horns from the top of the poll, out and up, pale with darker tips
            t = hit(tmp, (sx * 0.04, 0.8, 0.29), (0, -1, 0))
            if t:
                tx, ty, tz = t
                pts = [(tx, ty - 0.008, tz), (tx + sx * 0.02, ty + 0.007, tz + 0.002), (tx + sx * 0.034, ty + 0.025, tz + 0.009),
                       (tx + sx * 0.038, ty + 0.043, tz + 0.021), (tx + sx * 0.035, ty + 0.054, tz + 0.032)]
                rs = [0.0155, 0.0135, 0.0105, 0.007, 0.003]
                loft(f'horn{sx}', path_rings([(p, r, r, r) for p, r in zip(pts, rs)], 10), cached('horn', horn_mat), sub=1)
        # a tuft of hair on the poll, between the horns
        top = hit(tmp, (0, 0.8, 0.295), (0, -1, 0))
        if top:
            for dx, dz in ((0, -0.004), (0.012, 0.0), (-0.012, 0.0)):
                blob('tuft', (dx, top[1] + 0.002, top[2] + dz), 0.012, 0.007, 0.011, dark, segs=8, sub=1)


_cache = {}


def cached(key, make):
    if key not in _cache:
        _cache[key] = make()
    return _cache[key]


def legs(leg, hoof):
    for i, (x, py, z) in enumerate(LEGS):
        front = z > 0
        with anim_group(f'leg{i}', B(x, py, z)):
            if front:
                # (point, half width, front, back): forearm, knee, cannon, fetlock, pastern
                pts = [((x, 0.28, z), 0.031, 0.034, 0.034), ((x, 0.205, z), 0.031, 0.035, 0.033), ((x, 0.155, z + 0.002), 0.027, 0.029, 0.027),
                       ((x, 0.124, z + 0.004), 0.026, 0.028, 0.026), ((x, 0.1, z + 0.005), 0.021, 0.023, 0.021),
                       ((x, 0.06, z + 0.007), 0.0195, 0.021, 0.02), ((x, 0.045, z + 0.009), 0.0215, 0.024, 0.022),
                       ((x, 0.032, z + 0.014), 0.019, 0.021, 0.02)]
                hz = z + 0.02
            else:
                # thigh and gaskin, the hock behind, cannon, fetlock, pastern
                pts = [((x, 0.29, z), 0.046, 0.05, 0.05), ((x, 0.235, z - 0.012), 0.041, 0.047, 0.05), ((x, 0.18, z - 0.03), 0.031, 0.033, 0.039),
                       ((x, 0.14, z - 0.045), 0.025, 0.027, 0.033), ((x, 0.118, z - 0.044), 0.022, 0.023, 0.027),
                       ((x, 0.07, z - 0.034), 0.0195, 0.021, 0.02), ((x, 0.045, z - 0.03), 0.0215, 0.024, 0.022),
                       ((x, 0.032, z - 0.025), 0.019, 0.021, 0.02)]
                hz = z - 0.019
            loft(f'legm{i}', path_rings(pts, 12, ref=(1, 0, 0)), leg, sub=1)
            # a split hoof: two claws, the front edge sloped
            for side in (-1, 1):
                cx = x + side * 0.0098
                loft(f'hoof{i}{side}', [ring((cx, 0.034, hz - 0.004), (0, 1, 0), 0.011, 0.014, 0.014, 10, sq=2.4, ref=(1, 0, 0)),
                                        ring((cx, 0.016, hz), (0, 1, 0), 0.0125, 0.018, 0.016, 10, sq=2.6, ref=(1, 0, 0)),
                                        ring((cx, 0.0, hz + 0.004), (0, 1, 0), 0.013, 0.021, 0.017, 10, sq=2.8, ref=(1, 0, 0))],
                     hoof, sub=1)
            blob('dew', (x, 0.042, hz - (0.034 if front else 0.03)), 0.009, 0.006, 0.007, hoof, segs=8, sub=1)


def tail():
    tx, ty, tz = TAIL
    with anim_group('tail', B(*TAIL)):
        pts = [((tx, ty, tz), 0.012, 0.012, 0.012), ((tx, ty - 0.03, tz - 0.016), 0.0095, 0.0095, 0.0095),
               ((tx, ty - 0.1, tz - 0.024), 0.007, 0.007, 0.007), ((tx, 0.17, tz - 0.026), 0.0055, 0.0055, 0.0055),
               ((tx, 0.13, tz - 0.026), 0.005, 0.005, 0.005)]
        loft('tailm', path_rings(pts, 8, ref=(1, 0, 0)), cached('tailc', lambda: flat_mat('hd_tail', WHITE)), sub=1)
        sw = cached('lid', lambda: flat_mat('hd_lid', BLACK))
        loft('switch', path_rings([((tx, 0.15, tz - 0.026), 0.007, 0.007, 0.007), ((tx, 0.125, tz - 0.026), 0.014, 0.014, 0.014),
                                   ((tx, 0.098, tz - 0.024), 0.011, 0.011, 0.011), ((tx, 0.084, tz - 0.022), 0.004, 0.004, 0.004)], 10), sw, sub=2)


def cow_hd():
    _cache.clear()
    coat = coat_mat()
    body(coat)
    udder()
    head()
    legs(coat_mat('hd_leg', white_below=0.15), flat_mat('hd_hoof', '#2e2a28', '#45403b', rough=0.4, along_y=(0.0, 0.03)))
    tail()
    finish('animal_cow_hd', tex=1024, vivid=1.02, ao_min=0.5, ao_dist=0.07)


MODELS = {'animal_cow_hd': cow_hd}

if __name__ == '__main__':
    main(MODELS)
