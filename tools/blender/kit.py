# Building kit for the Blender models: face aligned walls, doors, windows, awnings, signs,
# chimneys, roofs of individual shingles and a shelf of props (crates, barrels, sacks, cans),
# plus the export pipeline that bakes colors and soft shadows into one texture.
#
# Conventions (Blender, Z up): a model sits on the ground centered on its footprint, its front
# faces -Y (the game's +Z). Empties named `smoke*` mark chimney tops, `badge` marks where the
# game hangs the building's icon, and parts built inside `anim_group('spin_x', pivot)` are
# exported as their own node (origin at the pivot) so the game can turn them.
import math
import os
import random
import sys
import time

import bpy  # noqa: I001  (bpy must come first: it makes bmesh importable)
import bmesh

from common import MATS, bevel, mat, mat_paint, obox, reset, _lin  # noqa: F401

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT_DIR = os.path.join(ROOT, 'public', 'models')
PREVIEW_DIR = os.path.join(HERE, 'previews')
RNG = random.Random(1)
ANIM = {}

# ---------------------------------------------------------------- materials

PALETTE = {}


def pm(name, a, b=None, **kw):
    """Palette material: painted between a and b, or flat when b is None. Cached per build."""
    if name in MATS:
        return MATS[name]
    if b is None:
        return mat(name, a, kw.get('rough', 0.75), kw.get('metal', 0.0), kw.get('emit'))
    metal = kw.pop('metal', 0.0)
    m = mat_paint(name, a, b, **kw)
    m.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = metal
    return m


def std():
    """The shared palette: rich mid tones rather than light pastels, so shapes stay defined."""
    return {
        'white': pm('white', '#f4f1ea', rough=0.6),
        'trim': pm('trim', '#fbfaf6', rough=0.6),
        'wood': pm('wood', '#b8733a', '#d48f4e', scale=6, kind='wave', stretch=(1, 8, 1)),
        'wood_dark': pm('wood_dark', '#7c4822', '#9a5e30', scale=6, kind='wave', stretch=(1, 8, 1)),
        'wood_warm': pm('wood_warm', '#9c5a2c', '#b8723c', scale=6, kind='wave', stretch=(1, 8, 1)),
        'wood_grey': pm('wood_grey', '#8a8278', '#a39b90', scale=6, kind='wave', stretch=(1, 8, 1)),
        'stone': [pm(f'stone{i}', a, b, scale=18) for i, (a, b) in enumerate([('#948d82', '#b8b0a4'), ('#a39a8c', '#c6bdaf'), ('#8a847a', '#aca69b')])],
        'mortar': pm('mortar', '#6f6961', rough=0.95),
        'brick': [pm(f'brick{i}', a, b, scale=24) for i, (a, b) in enumerate([('#a83a24', '#c44e36'), ('#933222', '#b0432e'), ('#b8452c', '#d45a40')])],
        'glass': pm('glass', '#7fc4e8', rough=0.1),
        'glass_hi': pm('glass_hi', '#dff4ff', rough=0.1),
        'metal': pm('metal', '#9aa3ab', '#b9c1c8', scale=20, rough=0.35, metal=0.6),
        'iron': pm('iron', '#3a3a3e', rough=0.5, metal=0.5),
        'brass': pm('brass', '#d8a83a', rough=0.35, metal=0.7),
        'soil': pm('soil', '#5a3a22', rough=0.95),
        'leaf': pm('leaf', '#2f8a26', '#58b43a', scale=30),
        'hay': pm('hay', '#d8b048', '#f0cc68', scale=40, kind='wave', stretch=(1, 1, 6)),
        'lamp': pm('lamp', '#ffe7a0', rough=0.3, emit=2.0),
        'roofbase': pm('roofbase', '#3e2216', rough=0.9),
        'rope': pm('rope', '#c8a878', '#e0c490', scale=60, kind='wave'),
        'cloth': pm('cloth', '#e8dcc4', '#f6ecd8', scale=30),
    }


def shingles(name, base, n=4, spread=0.1):
    """A set of shingle materials around one roof color, so a roof reads as many tiles."""
    from colorsys import rgb_to_hls, hls_to_rgb
    h = base.lstrip('#')
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    hh, ll, ss = rgb_to_hls(r, g, b)
    out = []
    for i in range(n):
        dl = (i / (n - 1) - 0.5) * spread * 2
        c1 = hls_to_rgb(hh, max(0, min(1, ll + dl - 0.05)), ss)
        c2 = hls_to_rgb(hh, max(0, min(1, ll + dl + 0.05)), ss)
        hx = lambda c: '#' + ''.join(f'{int(max(0, min(1, v)) * 255):02x}' for v in c)  # noqa: E731
        out.append(pm(f'{name}{i}', hx(c1), hx(c2), scale=40))
    return out


# ---------------------------------------------------------------- primitives

def box(name, size, loc, material, rot=(0, 0, 0), bev=0.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bev:
        bevel(o, min(bev, min(size) * 0.45))
    return o


def cyl(name, r, h, loc, material, verts=16, rot=(0, 0, 0), r2=None, bev=0.008, smooth=True):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(material)
    if bev:
        bevel(o, min(bev, h * 0.3))
    if smooth:
        bpy.ops.object.shade_smooth()
    return o


def ball(name, r, loc, material, scale=(1, 1, 1), segs=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=max(6, segs // 2), radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o


def torus(name, R, r, loc, material, rot=(0, 0, 0), segs=24, rsegs=8):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=segs, minor_segments=rsegs, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o


def prism(name, pts, x0, x1, material):
    """Extrude a polygon given in the (y, z) plane from x0 to x1 (gable walls, attic shapes)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    a = [bm.verts.new((x0, y, z)) for y, z in pts]
    b = [bm.verts.new((x1, y, z)) for y, z in pts]
    bm.faces.new(a[::-1])
    bm.faces.new(b)
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([a[i], a[j], b[j], b[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    return o


def marker(name, loc):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    bpy.context.collection.objects.link(o)
    return o


class anim_group:
    """Objects created inside become one animated node with its origin at `pivot`."""

    def __init__(self, name, pivot):
        self.name, self.pivot = name, pivot

    def __enter__(self):
        self.before = set(bpy.data.objects.keys())
        ANIM[self.name] = self.pivot

    def __exit__(self, *a):
        for n in set(bpy.data.objects.keys()) - self.before:
            bpy.data.objects[n]['anim'] = self.name


class capture:
    """Collects the objects created inside, so a sub assembly (dormer, porch, kennel) can be built
    around the origin and then turned and moved into place with `place`."""

    def __enter__(self):
        self.before = set(bpy.data.objects.keys())
        self.objs = []
        return self

    def __exit__(self, *a):
        self.objs = [bpy.data.objects[n] for n in set(bpy.data.objects.keys()) - self.before]


def place(cap, deg=0.0, offset=(0, 0, 0)):
    import mathutils
    R = mathutils.Matrix.Rotation(math.radians(deg), 4, 'Z')
    T = mathutils.Matrix.Translation(offset)
    for o in cap.objs:
        o.matrix_world = T @ R @ o.matrix_world
    for k, pv in list(ANIM.items()):
        if any(o.get('anim') == k for o in cap.objs):
            ANIM[k] = tuple(T @ R @ mathutils.Vector(pv))


def uid(prefix='p'):
    uid.n += 1
    return f'{prefix}{uid.n}'


uid.n = 0

# ---------------------------------------------------------------- faces
# A wall face is described by its tangent (along the wall, left to right seen from outside)
# and its outward normal. Face local coordinates: u along the wall, v up, n out of the wall.

FACES = {
    'front': ((1, 0, 0), (0, -1, 0)),
    'back': ((-1, 0, 0), (0, 1, 0)),
    'left': ((0, -1, 0), (-1, 0, 0)),
    'right': ((0, 1, 0), (1, 0, 0)),
}


class Face:
    def __init__(self, name, W, D, cx=0.0, cy=0.0):
        self.t, self.n = FACES[name]
        self.dist = D / 2 if name in ('front', 'back') else W / 2
        self.cx, self.cy = cx, cy
        self.width = W if name in ('front', 'back') else D

    def p(self, u, v, n=0.0):
        t, nn = self.t, self.n
        return (self.cx + t[0] * u + nn[0] * (self.dist + n), self.cy + t[1] * u + nn[1] * (self.dist + n), v)

    def box(self, u, v, n, su, sv, sn, material, bev=0.008):
        """Box centered at face coords (u, v, n) sized su along the wall, sv up, sn outward."""
        return obox(uid('fb'), self.p(u, v, n), (self.t, (0, 0, 1), self.n), (su, sv, sn), material, bev=bev)


# ---------------------------------------------------------------- building parts

def foundation(W, D, B, stones, mortar, seed=3):
    rnd = random.Random(seed)
    box(uid('found'), (W + 0.06, D + 0.06, B), (0, 0, B / 2), mortar, bev=0.02)
    for fname in FACES:
        f = Face(fname, W + 0.06, D + 0.06)
        along = f.width
        n = max(2, int(along / 0.14))
        for row in range(2):
            for i in range(n + 1):
                u = -along / 2 + (i + (0.5 if row else 0)) * along / n
                if abs(u) > along / 2 - 0.05:
                    continue
                w = along / n * rnd.uniform(0.8, 0.94)
                h = B / 2 * rnd.uniform(0.78, 0.94)
                f.box(u, h / 2 + row * B / 2 + 0.005, 0.02, w, h, 0.05, stones[rnd.randrange(len(stones))], bev=0.016)


def walls(W, D, H, z0, style, wallmat, trim, extra=None, rows=None, seed=5):
    """Wall shell with a surface style: 'clap' overlapping boards, 'batten' vertical boards and
    battens, 'brick' laid bricks, 'plaster' smooth with half timber beams, 'log' round logs."""
    rnd = random.Random(seed)
    box(uid('walls'), (W, D, H), (0, 0, z0 + H / 2), wallmat, bev=0.01)
    if style == 'clap':
        rows = rows or max(6, int(H / 0.085))
        bh = (H - 0.05) / rows
        for fname in FACES:
            f = Face(fname, W, D)
            for k in range(rows):
                f.box(0, z0 + (k + 0.5) * bh, 0.008, f.width + 0.02, bh * 1.05, 0.022, wallmat, bev=0.006)
    elif style == 'batten':
        for fname in FACES:
            f = Face(fname, W, D)
            n = int(f.width / 0.13)
            for i in range(1, n):
                u = -f.width / 2 + i * f.width / n
                f.box(u, z0 + (H - 0.04) / 2, 0.012, 0.035, H - 0.04, 0.025, extra or wallmat, bev=0.008)
    elif style == 'brick':
        bricks = extra
        for fname in FACES:
            f = Face(fname, W, D)
            # quoins: alternating long and short bricks up both corners
            for k in range(int(H / 0.1)):
                for side in (-1, 1):
                    L = 0.16 if k % 2 else 0.1
                    f.box(side * (f.width / 2 - L / 2 + 0.005), z0 + 0.05 + k * 0.1, 0.012, L, 0.085, 0.03, bricks[rnd.randrange(len(bricks))], bev=0.01)
    elif style == 'plaster':
        beam = extra
        for fname in FACES:
            f = Face(fname, W, D)
            f.box(0, z0 + 0.03, 0.014, f.width + 0.02, 0.06, 0.03, beam, bev=0.008)
            f.box(0, z0 + H - 0.03, 0.014, f.width + 0.02, 0.06, 0.03, beam, bev=0.008)
            n = max(2, int(f.width / 0.45))
            for i in range(n + 1):
                u = -f.width / 2 + i * f.width / n
                f.box(u, z0 + H / 2, 0.014, 0.05, H, 0.03, beam, bev=0.008)
    elif style == 'log':
        logs = extra
        n = int(H / 0.1)
        for k in range(n):
            z = z0 + 0.05 + k * H / n
            for fname in ('front', 'back'):
                f = Face(fname, W, D)
                cyl(uid('log'), 0.05, W + 0.16, f.p(0, z, 0.0), logs, verts=10, rot=(0, math.radians(90), 0), bev=0.0)
            for fname in ('left', 'right'):
                f = Face(fname, W, D)
                cyl(uid('log'), 0.05, D + 0.16, f.p(0, z + H / n / 2, 0.0), logs, verts=10, rot=(math.radians(90), 0, 0), bev=0.0)
    if style not in ('log', 'brick'):
        for cx in (-1, 1):
            for cy in (-1, 1):
                box(uid('corner'), (0.07, 0.07, H), (cx * (W / 2 + 0.01), cy * (D / 2 + 0.01), z0 + H / 2), trim, bev=0.012)


def window(face, u, zc, w, h, m, shutters=None, flowerbox=False, flowers=None, panes=2):
    """A framed window with glass, a glint, muntins, a sill and optional shutters and flower box."""
    face.box(u, zc, 0.02, w + 0.08, h + 0.08, 0.04, m['trim'], bev=0.012)
    face.box(u, zc, 0.03, w, h, 0.03, m['glass'], bev=0.004)
    face.box(u - w * 0.2, zc + h * 0.18, 0.042, w * 0.18, h * 0.26, 0.01, m['glass_hi'], bev=0.002)
    if panes >= 2:
        face.box(u, zc, 0.045, 0.02, h, 0.03, m['trim'], bev=0)
        face.box(u, zc, 0.045, w, 0.02, 0.03, m['trim'], bev=0)
    face.box(u, zc - h / 2 - 0.045, 0.05, w + 0.14, 0.035, 0.08, m['trim'], bev=0.01)
    if shutters is not None:
        for s in (-1, 1):
            face.box(u + s * (w / 2 + 0.075), zc, 0.03, 0.11, h + 0.05, 0.03, shutters, bev=0.01)
            for k in range(5):
                face.box(u + s * (w / 2 + 0.075), zc - h / 2 + 0.06 + k * (h - 0.06) / 5, 0.045, 0.09, 0.018, 0.02, shutters, bev=0.004)
    if flowerbox:
        face.box(u, zc - h / 2 - 0.12, 0.1, w + 0.1, 0.1, 0.12, m['wood'], bev=0.014)
        face.box(u, zc - h / 2 - 0.07, 0.1, w + 0.06, 0.02, 0.09, m['soil'], bev=0)
        fl = flowers or [m['leaf']]
        for i in range(7):
            lu = u - w / 2 + 0.01 + i * (w + 0.02) / 6
            ball(uid('lf'), 0.034, face.p(lu, zc - h / 2 - 0.05, 0.1), m['leaf'], scale=(1.3, 1.1, 0.8), segs=10)
            ball(uid('fl'), 0.027, face.p(lu + 0.015, zc - h / 2 - 0.025 + (i % 2) * 0.02, 0.12), fl[i % len(fl)], segs=10)


def door(face, u, z0, w, h, m, color, style='panel', frame=True):
    """'panel' paneled door with a knob, 'barn' board door with a white X brace, 'double'."""
    if frame:
        face.box(u, z0 + h / 2 + 0.02, 0.02, w + 0.08, h + 0.05, 0.04, m['trim'], bev=0.012)
    face.box(u, z0 + h / 2, 0.032, w, h, 0.04, color, bev=0.014)
    if style == 'panel':
        for pv in (0.27, 0.72):
            for pu in (-1, 1):
                face.box(u + pu * w * 0.22, z0 + h * pv, 0.055, w * 0.32, h * 0.3, 0.02, color, bev=0.012)
        ball(uid('knob'), 0.02, face.p(u + w * 0.32, z0 + h * 0.48, 0.07), m['brass'], segs=10)
    elif style in ('barn', 'double'):
        halves = (-1, 1) if style == 'double' or w > 0.45 else (0,)
        for s in halves:
            cu = u + s * w / 4 if s else u
            hw = w / 2 if s else w
            for k in range(int(hw / 0.07)):
                face.box(cu - hw / 2 + 0.035 + k * 0.07, z0 + h / 2, 0.05, 0.012, h - 0.02, 0.01, m['wood_dark'], bev=0)
            face.box(cu, z0 + 0.04, 0.058, hw - 0.02, 0.05, 0.02, m['trim'], bev=0.008)
            face.box(cu, z0 + h - 0.04, 0.058, hw - 0.02, 0.05, 0.02, m['trim'], bev=0.008)
            ang = math.atan2(h - 0.1, hw - 0.04)
            ln = math.hypot(h - 0.1, hw - 0.04)
            for sg in (-1, 1):
                t = face.t
                d1 = (t[0] * math.cos(ang) * sg, t[1] * math.cos(ang) * sg, math.sin(ang))
                perp = (-t[0] * math.sin(ang) * sg, -t[1] * math.sin(ang) * sg, math.cos(ang))
                obox(uid('xb'), face.p(cu, z0 + h / 2, 0.06), (d1, perp, (face.n[0], face.n[1], 0)), (ln, 0.045, 0.02), m['trim'], bev=0.006)
        if style == 'double' or w > 0.45:
            face.box(u, z0 + h / 2, 0.06, 0.02, h, 0.02, m['trim'], bev=0)


def awning(face, u, ztop, w, depth, c1, c2, stripes=7, drop=0.12):
    """A striped awning sloping out from the wall with a scalloped front edge."""
    ang = math.atan2(drop, depth)
    ln = math.hypot(drop, depth)
    sw = w / stripes
    t, n = face.t, face.n
    down = (n[0] * math.cos(ang), n[1] * math.cos(ang), -math.sin(ang))
    for i in range(stripes):
        cu = u - w / 2 + (i + 0.5) * sw
        c = face.p(cu, ztop - drop / 2, depth / 2)
        obox(uid('aw'), c, (t, down, (n[0] * math.sin(ang), n[1] * math.sin(ang), math.cos(ang))), (sw * 1.01, ln, 0.02), c1 if i % 2 else c2, bev=0.004)
        # scallop hanging from the front edge
        e = face.p(cu, ztop - drop - 0.035, depth + 0.005)
        flat = (1, 0.25, 0.55) if abs(t[0]) > 0.5 else (0.25, 1, 0.55)
        ball(uid('sc'), sw * 0.48, e, c1 if i % 2 else c2, scale=flat, segs=12)
    # the rail it hangs from and two brackets
    for s in (-1, 1):
        a = face.p(u + s * (w / 2 - 0.02), ztop - drop / 2, depth / 2)
        obox(uid('br'), a, (down, t, (n[0] * math.sin(ang), n[1] * math.sin(ang), math.cos(ang))), (ln, 0.02, 0.02), MATS.get('iron') or mat('iron', '#3a3a3e'), bev=0.004)


def sign(face, u, zc, w, h, board, frame, badge_name='badge'):
    """A sign board on the wall; the game hangs the building's painted icon on its `badge` marker."""
    face.box(u, zc, 0.03, w + 0.05, h + 0.05, 0.035, frame, bev=0.012)
    face.box(u, zc, 0.045, w, h, 0.03, board, bev=0.008)
    mk = marker(badge_name, face.p(u, zc, 0.065))
    mk.rotation_euler[2] = math.atan2(face.n[0], -face.n[1])   # turned to face out of the wall


def chimney(x, y, z0, h, bricks, cap, mortar, name='smoke'):
    """A brick chimney from z0 up h, with a cap; marks its top for the game's smoke."""
    rnd = random.Random(int(x * 100 + y * 10))
    box(uid('chc'), (0.2, 0.2, h), (x, y, z0 + h / 2), mortar, bev=0.01)
    rows = int(h / 0.06)
    for r in range(rows):
        z = z0 + (r + 0.5) * h / rows
        for side in range(4):
            for i in range(2):
                off = (i - 0.5) * 0.1 + (0.05 if r % 2 else 0) - 0.025
                bm = bricks[rnd.randrange(len(bricks))]
                if side < 2:
                    box(uid('br'), (0.095, 0.03, h / rows * 0.82), (x + off, y + (0.105 if side else -0.105), z), bm, bev=0.006)
                else:
                    box(uid('br'), (0.03, 0.095, h / rows * 0.82), (x + (0.105 if side == 3 else -0.105), y + off, z), bm, bev=0.006)
    box(uid('chcap'), (0.28, 0.28, 0.05), (x, y, z0 + h + 0.02), cap, bev=0.015)
    marker(name, (x, y, z0 + h + 0.08))


def roof_plane(name, eave, ra, u, n, length, run, rows, sw, mats, base_mat, base_thick, rnd, lift=0.012):
    """One rectangular roof plane covered in staggered shingles. `eave` is the middle of the
    lower edge; ra runs along the eave, u up the slope, n out of the roof."""
    mid = [eave[k] + u[k] * run / 2 - n[k] * base_thick / 2 for k in range(3)]
    obox(f'{name}base', mid, (ra, u, n), (length, run + 0.01, base_thick), base_mat, bev=0.008)
    rl = run / rows
    L = length / 2
    for r in range(rows):
        d = (r + 0.5) * rl - rl * 0.1
        off = sw / 2 if r % 2 else 0
        x = -L + off
        i = 0
        while x < L - 0.005:
            w = min(sw, L - x)
            if w > 0.02:
                c = [eave[k] + ra[k] * (x + w / 2) + u[k] * d + n[k] * (lift + r * 0.0005) for k in range(3)]
                tilt = (rnd.random() - 0.5) * 0.04
                nn = [n[k] + u[k] * 0.12 + ra[k] * tilt for k in range(3)]
                ln = math.sqrt(sum(q * q for q in nn))
                nn = [q / ln for q in nn]
                uu = [u[k] - n[k] * 0.12 for k in range(3)]
                lu = math.sqrt(sum(q * q for q in uu))
                uu = [q / lu for q in uu]
                obox(f'{name}s{r}_{i}', c, (ra, uu, nn), (w * 0.95, rl * 1.35, 0.022), mats[rnd.randrange(len(mats))], bev=0.005)
            x += w
            i += 1


def profile_roof(name, length, z, profile, over, mats, base_mat, trim=None, cx=0.0, cy=0.0, sw=0.14, rows_per_m=12,
                 base_thick=0.04, seed=1, ends=(-1, 1), attic=None):
    """A roof along X whose cross section follows `profile`: points (b, h) from the eave (largest b)
    up to the ridge (b = 0), mirrored to both sides. Two points make a gable roof, three a gambrel.
    The eave overhangs the walls by `over` along the slope; the attic below is walled in."""
    rnd = random.Random(seed)
    L = length + 2 * over
    for s in (-1, 1):
        for i in range(len(profile) - 1):
            (b0, h0), (b1, h1) = profile[i], profile[i + 1]
            db, dh = b1 - b0, h1 - h0
            run = math.hypot(db, dh)
            u = (0, s * db / run, dh / run)
            n = (0, s * dh / run, -db / run)
            if n[2] < 0:
                n = tuple(-q for q in n)
            ext = over if i == 0 else 0
            eave = (cx, cy + s * (b0 - ext * db / run), z + h0 - ext * dh / run)
            rows = max(3, int((run + ext) * rows_per_m))
            roof_plane(f'{name}{s}{i}', eave, (1, 0, 0), u, n, L, run + ext, rows, sw, mats, base_mat, base_thick, rnd)
    # attic walls
    pts = [(-b, h) for b, h in profile] + [(b, h) for b, h in reversed(profile)]
    pts = [(cy + y, z + h) for y, h in pts]
    seen = []
    for p in pts:
        if not seen or (abs(p[0] - seen[-1][0]) > 1e-6 or abs(p[1] - seen[-1][1]) > 1e-6):
            seen.append(p)
    prism(uid('attic'), seen, cx - length / 2, cx + length / 2, attic or base_mat)
    # ridge cap
    top = max(h for _, h in profile)
    box(uid('ridge'), (L + 0.04, 0.08, 0.06), (cx, cy, z + top + 0.04), mats[0], bev=0.02)
    if trim and ends:
        for sx in ends:
            for s in (-1, 1):
                for i in range(len(profile) - 1):
                    (b0, h0), (b1, h1) = profile[i], profile[i + 1]
                    ext = over if i == 0 else 0
                    db, dh = b1 - b0, h1 - h0
                    run = math.hypot(db, dh)
                    a = (cy + s * (b0 - ext * db / run), z + h0 - ext * dh / run)
                    b = (cy + s * b1, z + h1)
                    c = (cx + sx * (L / 2 + 0.005), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.02)
                    ln = math.hypot(b[0] - a[0], b[1] - a[1])
                    dirv = (0, (b[0] - a[0]) / ln, (b[1] - a[1]) / ln)
                    obox(uid('rake'), c, ((1, 0, 0), dirv, (0, -dirv[2], dirv[1])), (0.05, ln + 0.02, 0.07), trim, bev=0.012)


def flat_roof(W, D, z, over, top, trim):
    box(uid('flat'), (W + 2 * over, D + 2 * over, 0.08), (0, 0, z + 0.04), top, bev=0.02)
    for fname in FACES:
        f = Face(fname, W + 2 * over, D + 2 * over)
        f.box(0, z + 0.1, -0.02, f.width, 0.06, 0.05, trim, bev=0.012)


# ---------------------------------------------------------------- props

def crate(x, y, z, s, m, fill=None, rot=0.0, fill_r=None):
    """An open slatted crate, optionally heaped with round produce in the given materials."""
    t = (math.cos(rot), math.sin(rot), 0)
    nrm = (-math.sin(rot), math.cos(rot), 0)
    obox(uid('cr'), (x, y, z + 0.01), (t, nrm, (0, 0, 1)), (s, s * 0.8, 0.02), m['wood_dark'], bev=0.004)
    for sv in (-1, 1):
        for k in range(3):
            obox(uid('cr'), (x + nrm[0] * sv * s * 0.4, y + nrm[1] * sv * s * 0.4, z + 0.04 + k * s * 0.18), (t, nrm, (0, 0, 1)), (s, 0.02, s * 0.14), m['wood'], bev=0.004)
        for k in range(3):
            obox(uid('cr'), (x + t[0] * sv * s * 0.5, y + t[1] * sv * s * 0.5, z + 0.04 + k * s * 0.18), (nrm, t, (0, 0, 1)), (s * 0.8, 0.02, s * 0.14), m['wood'], bev=0.004)
    if fill:
        rnd = random.Random(int(x * 1000 + y * 100))
        r = fill_r or s * 0.14
        n = int((s / (r * 2)) ** 2 * 0.9) + 2
        for i in range(n):
            fx = (rnd.random() - 0.5) * s * 0.8
            fy = (rnd.random() - 0.5) * s * 0.6
            p = (x + t[0] * fx + nrm[0] * fy, y + t[1] * fx + nrm[1] * fy, z + s * 0.45 + rnd.random() * r)
            ball(uid('fr'), r, p, fill[i % len(fill)], segs=10)


def barrel(x, y, z, r, h, m, lid=True):
    cyl(uid('bar'), r, h, (x, y, z + h / 2), m['wood'], verts=16, bev=0.01)
    for k in (0.2, 0.8):
        torus(uid('band'), r * 1.01, 0.008, (x, y, z + h * k), m['iron'], segs=20, rsegs=6)
    if lid:
        cyl(uid('lid'), r * 0.92, 0.012, (x, y, z + h + 0.004), m['wood_dark'], verts=16, bev=0)


def sack(x, y, z, s, cloth, rot=0.0):
    b = ball(uid('sack'), s, (x, y, z + s * 0.85), cloth, scale=(1, 0.85, 1.05), segs=12)
    b.rotation_euler = (0, 0, rot)
    ball(uid('tie'), s * 0.35, (x, y, z + s * 1.8), cloth, scale=(1, 1, 0.8), segs=8)


def milk_can(x, y, z, m):
    cyl(uid('can'), 0.07, 0.2, (x, y, z + 0.1), m['metal'], verts=16)
    cyl(uid('can'), 0.07, 0.07, (x, y, z + 0.235), m['metal'], verts=16, r2=0.035)
    cyl(uid('can'), 0.04, 0.03, (x, y, z + 0.28), m['metal'], verts=12)


def hay_bale(x, y, z, s, m, rot=0.0):
    cyl(uid('hay'), s * 0.5, s, (x, y, z + s * 0.5), m['hay'], verts=16, rot=(0, math.radians(90), rot), bev=0.02)
    for k in (-0.25, 0.25):
        torus(uid('twine'), s * 0.505, 0.007, (x + math.cos(rot) * k * s, y + math.sin(rot) * k * s, z + s * 0.5), m['rope'], rot=(0, math.radians(90), rot), segs=20, rsegs=5)


def glow(x, y, size=1.0):
    """A warm pool of lamp light on the ground at night; the game reads the marker (its scale is
    the size of the pool)."""
    mk = marker(uid('glow'), (x, y, 0.0))
    mk.scale = (size, size, size)
    return mk


def lantern(x, y, z, m, post=0.0, light=1.0):
    if post:
        cyl(uid('lp'), 0.02, post, (x, y, z + post / 2), m['iron'], verts=8)
        z += post
    glow(x, y, light)
    box(uid('lb'), (0.07, 0.07, 0.1), (x, y, z + 0.05), m['lamp'], bev=0.01)
    box(uid('lt'), (0.09, 0.09, 0.02), (x, y, z + 0.11), m['iron'], bev=0.006)
    cyl(uid('lk'), 0.02, 0.03, (x, y, z + 0.13), m['iron'], verts=8)


def potted_plant(x, y, z, m, pot, bloom=None):
    cyl(uid('pot'), 0.055, 0.09, (x, y, z + 0.045), pot, verts=14, r2=0.07)
    for i in range(6):
        a = i * 1.05
        ball(uid('pl'), 0.035, (x + math.cos(a) * 0.03, y + math.sin(a) * 0.03, z + 0.11 + (i % 2) * 0.02), m['leaf'], segs=10)
    if bloom:
        ball(uid('pf'), 0.028, (x, y, z + 0.15), bloom, segs=10)


def rock(name, r, loc, material, seed=1, squash=0.7, rough=0.22):
    """An irregular faceted rock: an icosphere with its vertices pushed about."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    rnd = random.Random(seed)
    for v in o.data.vertices:
        k = 1 + (rnd.random() - 0.5) * rough * 2
        v.co.x *= k
        v.co.y *= k * rnd.uniform(0.9, 1.1)
        v.co.z *= k * squash
        if v.co.z < -r * 0.25 * squash:
            v.co.z = -r * 0.25 * squash
    o.data.materials.append(material)
    return o


def clump(cx, cy, cz, r, mats, n=24, seed=1, leaf=0.3, squash=0.85):
    """A leafy clump: many small overlapping balls on the surface of a sphere of radius r, so it
    reads as foliage rather than one smooth ball."""
    rnd = random.Random(seed)
    ball(uid('core'), r * 0.92, (cx, cy, cz), mats[0], scale=(1, 1, squash), segs=14)
    for i in range(n):
        # even spread over the upper part of the sphere
        zf = 1 - (i + 0.5) / n * 1.4
        a = i * 2.39996 + rnd.random() * 0.3
        rr = math.sqrt(max(0.0, 1 - zf * zf))
        p = (cx + math.cos(a) * rr * r, cy + math.sin(a) * rr * r, cz + zf * r * squash)
        s = r * leaf * rnd.uniform(0.8, 1.2)
        ball(uid('lf'), s, p, mats[rnd.randrange(len(mats))], scale=(1, 1, 0.85), segs=8)


# ---------------------------------------------------------------- nature

def leaf_mats(base='#3f8f2e', name='lf'):
    """Three greens around a base color, so foliage reads as many leaves."""
    from colorsys import rgb_to_hls, hls_to_rgb
    h = base.lstrip('#')
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    hh, ll, ss = rgb_to_hls(r, g, b)
    hx = lambda c: '#' + ''.join(f'{int(max(0, min(1, v)) * 255):02x}' for v in c)  # noqa: E731
    out = []
    for i, dl in enumerate((-0.07, 0.0, 0.07)):
        c1 = hls_to_rgb(hh, max(0, min(1, ll + dl - 0.04)), ss)
        c2 = hls_to_rgb(hh, max(0, min(1, ll + dl + 0.04)), ss)
        out.append(pm(f'{name}{i}', hx(c1), hx(c2), scale=40))
    return out


def bark_mat(name='bark', a='#6e4526', b='#8a5a34'):
    return pm(name, a, b, scale=10, kind='wave', stretch=(1, 1, 8))


def pine(x, y, s, leaf, bark, seed=1, layers=4):
    """A pine: a short trunk and stacked, slightly jagged cones."""
    rnd = random.Random(seed)
    cyl(uid('pt'), 0.06 * s, 0.4 * s, (x, y, 0.2 * s), bark, verts=10, r2=0.045 * s)
    for i in range(layers):
        k = i / max(1, layers - 1)
        r = (0.42 - 0.26 * k) * s
        z = (0.3 + i * 0.3) * s
        c = cyl(uid('pc'), r, 0.5 * s, (x, y, z + 0.25 * s), leaf[i % len(leaf)], verts=14, r2=0.0, bev=0, smooth=False)
        for v in c.data.vertices:
            if v.co.z < 0:
                v.co.z += (rnd.random() - 0.5) * 0.08 * s
                v.co.x *= 1 + (rnd.random() - 0.5) * 0.18
                v.co.y *= 1 + (rnd.random() - 0.5) * 0.18
    return (0.3 + layers * 0.3 + 0.25) * s


def palm(x, y, s, leaf, bark, seed=1, lean=(1, 0), seg_h=0.16, bend=0.22, nuts=True):
    """A leaning palm: ringed trunk segments curving over, a fan of drooping fronds and coconuts."""
    rnd = random.Random(seed)
    segs = 9
    px, py, pz = x, y, 0.0
    lx, ly = lean
    for i in range(segs):
        t = i / segs
        nx = x + lx * math.sin(t * 1.4) * bend * s
        ny = y + ly * math.sin(t * 1.4) * bend * s
        nz = (i + 1) * seg_h * s
        mid = ((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2)
        dx, dy, dz = nx - px, ny - py, nz - pz
        ln = math.sqrt(dx * dx + dy * dy + dz * dz)
        tilt = math.acos(dz / ln)
        ang = math.atan2(dy, dx)
        cyl(uid('ps'), (0.07 - t * 0.025) * s, ln * 1.05, mid, bark, verts=10, r2=(0.06 - t * 0.025) * s,
            rot=(0, tilt, ang), bev=0.004)
        torus(uid('pr'), (0.066 - t * 0.025) * s, 0.008 * s, (nx, ny, nz), bark, segs=12, rsegs=4)
        px, py, pz = nx, ny, nz
    top = (px, py, pz)
    # fronds: an arching spine with pairs of leaflets swept back and drooping from it
    for i in range(10):
        a = i / 10 * math.pi * 2 + rnd.uniform(-0.15, 0.15)
        ca, sa = math.cos(a), math.sin(a)
        side = (-sa, ca, 0.0)
        pts = []
        for k in range(9):
            u = k / 8
            r = (0.03 + u * 0.55) * s
            h = (0.05 + math.sin(u * 2.4) * 0.13 - u * u * 0.36) * s
            pts.append((top[0] + ca * r, top[1] + sa * r, top[2] + h))
        for k in range(8):
            p0, p1 = pts[k], pts[k + 1]
            d = [p1[j] - p0[j] for j in range(3)]
            ln = math.sqrt(sum(q * q for q in d))
            d = [q / ln for q in d]
            mid = [(p0[j] + p1[j]) / 2 for j in range(3)]
            nrm = (d[1] * side[2] - d[2] * side[1], d[2] * side[0] - d[0] * side[2], d[0] * side[1] - d[1] * side[0])
            obox(uid('spine'), mid, (d, side, nrm), (ln * 1.05, 0.018 * s, 0.012 * s), leaf[0], bev=0)
            u = k / 7
            L = (0.2 - abs(u - 0.4) * 0.14) * s
            for sd in (-1, 1):
                v = [side[j] * sd * 0.8 + d[j] * 0.45 for j in range(3)]
                v[2] -= 0.35 + u * 0.3
                lv = math.sqrt(sum(q * q for q in v))
                v = [q / lv for q in v]
                w = [v[1] * nrm[2] - v[2] * nrm[1], v[2] * nrm[0] - v[0] * nrm[2], v[0] * nrm[1] - v[1] * nrm[0]]
                lw = math.sqrt(sum(q * q for q in w)) or 1
                w = [q / lw for q in w]
                n2 = [v[1] * w[2] - v[2] * w[1], v[2] * w[0] - v[0] * w[2], v[0] * w[1] - v[1] * w[0]]
                c = [mid[j] + v[j] * L / 2 for j in range(3)]
                obox(uid('leaflet'), c, (v, w, n2), (L, 0.045 * s, 0.008 * s), leaf[(i + k + (sd > 0)) % len(leaf)], bev=0)
    nut = pm('coconut', '#6a4222', '#7e5230', scale=30)
    for i in range(3 if nuts else 0):
        a = i * 2.1
        ball(uid('nut'), 0.045 * s, (top[0] + math.cos(a) * 0.06 * s, top[1] + math.sin(a) * 0.06 * s, top[2] - 0.05 * s), nut, segs=10)
    return top[2]


def oak(x, y, s, leaf, bark, seed=1, crowns=None):
    """A round leafy tree: a flared trunk with roots and two branches under a crown of clumps."""
    rnd = random.Random(seed)
    cyl(uid('ot'), 0.1 * s, 0.7 * s, (x, y, 0.35 * s), bark, verts=12, r2=0.07 * s)
    for k in range(4):
        a = k * 1.57 + rnd.uniform(-0.3, 0.3)
        cyl(uid('root'), 0.035 * s, 0.2 * s, (x + math.cos(a) * 0.1 * s, y + math.sin(a) * 0.1 * s, 0.04 * s), bark, verts=8,
            r2=0.015 * s, rot=(math.sin(a) * 1.1, -math.cos(a) * 1.1, 0))
    for k in range(2):
        a = k * math.pi + rnd.uniform(-0.4, 0.4)
        cyl(uid('br'), 0.04 * s, 0.35 * s, (x + math.cos(a) * 0.1 * s, y + math.sin(a) * 0.1 * s, 0.75 * s), bark, verts=8,
            r2=0.02 * s, rot=(math.sin(a) * 0.7, -math.cos(a) * 0.7, 0))
    spots = crowns or [(0, 0, 1.05, 0.42), (-0.25, 0.08, 0.9, 0.3), (0.26, -0.06, 0.92, 0.3), (0.05, 0.2, 1.3, 0.28),
                       (-0.05, -0.22, 1.2, 0.26)]
    for i, (cx, cy, cz, r) in enumerate(spots):
        clump(x + cx * s, y + cy * s, cz * s, r * s, leaf, n=30, seed=seed * 10 + i, leaf=0.3)
    return max(cz + r for _, _, cz, r in spots) * s


def snow(x, y, r, mat, seed=1):
    ball(uid('snow'), r, (x, y, 0.0), mat, scale=(1.2 + random.Random(seed).random() * 0.4, 1, 0.35), segs=12)


def move_all(offset):
    """Shift everything built so far (markers and animation pivots too)."""
    import mathutils
    T = mathutils.Matrix.Translation(offset)
    for o in bpy.context.scene.objects:
        o.matrix_world = T @ o.matrix_world
    for k, p in list(ANIM.items()):
        ANIM[k] = tuple(T @ mathutils.Vector(p))


def dormer(m, wall, roof_mats, base, w=0.32, d=0.44, h=0.34, seed=7):
    """A dormer built around the origin facing -Y (body, little shingled gable roof, window);
    place it with `place`. Its body runs deep so it seats into the main roof."""
    with capture() as cap:
        box(uid('dm'), (w, d, h), (0, 0, h / 2), wall, bev=0.012)
        with capture() as rc:
            profile_roof(uid('dr'), d, h, [(w / 2, 0.0), (0.0, 0.17)], 0.05, roof_mats, base, trim=m['trim'], sw=0.1,
                         rows_per_m=22, attic=wall, seed=seed, ends=(-1,))
        place(rc, 90)
        f = Face('front', w, d)
        window(f, 0, h * 0.52, w * 0.56, h * 0.5, m)
    return cap


def turn(deg):
    """Rotate everything built so far about the vertical axis through the origin (markers and
    animation pivots too). Handy when a roof builder runs along X but the gable must face front."""
    import mathutils
    R = mathutils.Matrix.Rotation(math.radians(deg), 4, 'Z')
    for o in bpy.context.scene.objects:
        o.matrix_world = R @ o.matrix_world
    for k, p in list(ANIM.items()):
        ANIM[k] = tuple(R @ mathutils.Vector(p))


# ---------------------------------------------------------------- export

def _mesh_objects():
    return [o for o in bpy.context.scene.objects if o.type == 'MESH']


def _apply_and_weld(objs):
    """Apply modifiers and weld each part on its own (not across parts, so animated parts stay
    separable), without the slow edit mode round trips."""
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
        o.modifiers.clear()
        old = o.data
        o.data = me
        if old.users == 0:
            bpy.data.meshes.remove(old)
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0004)
        bm.to_mesh(me)
        bm.free()
        if o.get('anim'):
            vg = o.vertex_groups.new(name='anim:' + o['anim'])
            vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')


def finish(name, tex=1024, glow=(), vivid=1.18, ao_min=0.46, ao_dist=0.3, preview=True, cam=None):
    """Join, bake and export `public/models/<name>.glb`, then render a preview."""
    objs = _mesh_objects()
    _apply_and_weld(objs)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    ob = bpy.context.active_object
    ob.name = name
    # merge coplanar faces: same shape, far fewer triangles
    dec = ob.modifiers.new('planar', 'DECIMATE')
    dec.decimate_type = 'DISSOLVE'
    dec.angle_limit = math.radians(0.5)
    dec.use_dissolve_boundaries = False
    dec.delimit = {'NORMAL', 'MATERIAL'}
    bpy.ops.object.modifier_apply(modifier='planar')
    _bake(ob, tex, glow, vivid, ao_min, ao_dist)
    parts = _separate_anims(ob)
    markers = [o for o in bpy.context.scene.objects if o.type == 'EMPTY']
    bpy.ops.object.select_all(action='DESELECT')
    for o in [ob] + parts + markers:
        o.select_set(True)
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, f'{name}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_image_format='JPEG', export_jpeg_quality=86,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10,
                              export_draco_texcoord_quantization=12)
    for o in [ob] + parts:
        for slot in o.material_slots:
            slot.material.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.0
    if preview:
        os.makedirs(PREVIEW_DIR, exist_ok=True)
        _preview(os.path.join(PREVIEW_DIR, f'{name}.png'), cam)
    tris = sum(len(p.data.polygons) for p in [ob] + parts)
    print(f'done {name} faces={tris} size={os.path.getsize(path) // 1024}KB')


def _bake(ob, tex, glow, vivid, ao_min, ao_dist):
    import numpy as np
    scn = bpy.context.scene
    scn.render.engine = 'CYCLES'
    scn.cycles.device = 'CPU'
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.data.materials.append(mat('bake_ground', '#808080'))
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.004, scale_to_bounds=False)
    bpy.ops.uv.average_islands_scale()
    bpy.ops.uv.pack_islands(margin=0.004, rotate=True)
    bpy.ops.object.mode_set(mode='OBJECT')
    albedo = bpy.data.images.new(f'{ob.name}_albedo', tex, tex, alpha=False)
    ao = bpy.data.images.new(f'{ob.name}_ao', tex, tex, alpha=False)

    def target(img):
        for slot in ob.material_slots:
            nt = slot.material.node_tree
            node = nt.nodes.get('bake_target') or nt.nodes.new('ShaderNodeTexImage')
            node.name = 'bake_target'
            node.image = img
            nt.nodes.active = node

    target(albedo)
    scn.cycles.samples = 4
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=12, margin_type='EXTEND', use_clear=True)
    target(ao)
    scn.cycles.samples = 64
    scn.world = scn.world or bpy.data.worlds.new('w')
    scn.world.light_settings.distance = ao_dist
    bpy.ops.object.bake(type='AO', margin=12, margin_type='EXTEND', use_clear=True)
    a = np.array(albedo.pixels[:]).reshape(-1, 4)
    o = np.array(ao.pixels[:]).reshape(-1, 4)[:, :1]
    shade = ao_min + (1 - ao_min) * np.clip(o, 0, 1) ** 0.8
    rgb = a[:, :3]
    lum = (rgb * np.array([0.299, 0.587, 0.114])).sum(axis=1, keepdims=True)
    rgb = lum + (rgb - lum) * vivid
    out = a.copy()
    out[:, :3] = np.clip(rgb * shade, 0, 1)
    final = bpy.data.images.new(f'{ob.name}_color', tex, tex, alpha=False)
    final.pixels[:] = out.ravel()
    final.file_format = 'JPEG'
    mask = None
    if glow:
        mask = bpy.data.images.new(f'{ob.name}_glow', max(256, tex // 2), max(256, tex // 2), alpha=False)
        mask.file_format = 'JPEG'
        for slot in ob.material_slots:
            b = slot.material.node_tree.nodes['Principled BSDF']
            on = slot.material.name in glow
            b.inputs['Emission Color'].default_value = (1, 1, 1, 1) if on else (0, 0, 0, 1)
            b.inputs['Emission Strength'].default_value = 1.0
        target(mask)
        scn.cycles.samples = 1
        bpy.ops.object.bake(type='EMIT', margin=8, margin_type='EXTEND', use_clear=True)
    m = bpy.data.materials.new(f'{ob.name}_baked')
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    tn = nt.nodes.new('ShaderNodeTexImage')
    tn.image = final
    nt.links.new(tn.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.8
    if mask:
        mn = nt.nodes.new('ShaderNodeTexImage')
        mn.image = mask
        nt.links.new(mn.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 1.0
    ob.data.materials.clear()
    ob.data.materials.append(m)
    bpy.data.objects.remove(ground)


def _separate_anims(ob):
    parts = []
    for name, pivot in ANIM.items():
        vg = ob.vertex_groups.get('anim:' + name)
        if not vg:
            continue
        bpy.ops.object.select_all(action='DESELECT')
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='DESELECT')
        ob.vertex_groups.active_index = vg.index
        bpy.ops.object.vertex_group_select()
        bpy.ops.mesh.separate(type='SELECTED')
        bpy.ops.object.mode_set(mode='OBJECT')
        part = [o for o in bpy.context.selected_objects if o != ob][0]
        part.name = name
        bpy.context.scene.cursor.location = pivot
        bpy.ops.object.select_all(action='DESELECT')
        part.select_set(True)
        bpy.context.view_layer.objects.active = part
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        parts.append(part)
    return parts


def _preview(path, cam=None):
    scn = bpy.context.scene
    scn.cycles.samples = 40
    scn.render.resolution_x = 400
    scn.render.resolution_y = 400
    scn.render.filepath = path
    world = bpy.data.worlds.new('pw')
    scn.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.72, 0.9, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.8
    bpy.ops.object.light_add(type='SUN', rotation=(math.radians(50), math.radians(10), math.radians(35)))
    bpy.context.active_object.data.energy = 3.5
    bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 0, 0))
    bpy.context.active_object.data.materials.append(mat('pground', '#6db83c', 0.9))
    # frame the model from the game's usual three quarter angle
    objs = [o for o in scn.objects if o.type == 'MESH' and o.name not in ('Plane',) and not o.name.startswith('Plane')]
    import mathutils
    lo = mathutils.Vector((1e9, 1e9, 1e9))
    hi = -lo
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(c)
            lo = mathutils.Vector((min(lo[i], w[i]) for i in range(3)))
            hi = mathutils.Vector((max(hi[i], w[i]) for i in range(3)))
    center = (lo + hi) / 2
    size = max((hi - lo).length, 0.5)
    d = mathutils.Vector(cam or (0.75, -1.0, 0.8)).normalized() * size * 1.55
    bpy.ops.object.camera_add(location=center + d)
    c = bpy.context.active_object
    c.data.lens = 45
    v = center - c.location
    c.rotation_euler = (math.atan2(math.hypot(v.x, v.y), -v.z), 0, math.atan2(v.y, v.x) - math.pi / 2)
    scn.camera = c
    bpy.ops.render.render(write_still=True)


def main(models):
    """Command line entry for a model script: `--list`, or model names (default: all)."""
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    if '--list' in sys.argv:
        print('\n'.join(models))
        return
    for name in args or list(models):
        t = time.time()
        reset()
        ANIM.clear()
        uid.n = 0
        models[name]()
        print(f'  ({time.time() - t:.0f}s)')
