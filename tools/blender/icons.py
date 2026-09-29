# Shop icons from the Blender models: each decoration's .glb rendered from the game's three
# quarter view on a transparent background into public/icons/<name>.webp, so the shop shows the
# very thing that gets built.
# Run: python3 tools/blender/icons.py [names...]   (default: every decoration with a model)
import math
import os
import re
import sys

import bpy
import mathutils

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
MODELS = os.path.join(ROOT, 'public', 'models')
OUT = os.path.join(ROOT, 'public', 'icons')
SIZE = 160


def deco_ids():
    src = open(os.path.join(ROOT, 'src', 'game', 'data.ts')).read()
    ids = re.findall(r"id: '([a-z0-9_]+)',[^\n]*kind: 'deco'", src)
    return [i for i in ids if os.path.exists(os.path.join(MODELS, f'{i}.glb'))]


def render(name):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene
    scn.render.engine = 'CYCLES'
    scn.cycles.samples = 24
    scn.cycles.use_denoising = True
    scn.render.resolution_x = scn.render.resolution_y = SIZE
    scn.render.film_transparent = True
    scn.view_settings.view_transform = 'Standard'
    scn.render.image_settings.file_format = 'WEBP'
    scn.render.image_settings.quality = 88
    scn.render.image_settings.color_mode = 'RGBA'
    scn.render.filepath = os.path.join(OUT, f'{name}.webp')
    world = bpy.data.worlds.new('iw')
    scn.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.8, 0.86, 0.95, 1)
    bg.inputs['Strength'].default_value = 0.9
    bpy.ops.import_scene.gltf(filepath=os.path.join(MODELS, f'{name}.glb'))
    add_eyes(scn)
    objs = [o for o in scn.objects if o.type == 'MESH']
    lo = mathutils.Vector((1e9, 1e9, 1e9))
    hi = -lo
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(c)
            lo = mathutils.Vector([min(lo[i], w[i]) for i in range(3)])
            hi = mathutils.Vector([max(hi[i], w[i]) for i in range(3)])
    center = (lo + hi) / 2
    bpy.ops.object.light_add(type='SUN', rotation=(math.radians(45), math.radians(8), math.radians(30)))
    bpy.context.active_object.data.energy = 3.2
    bpy.ops.object.light_add(type='SUN', rotation=(math.radians(60), 0, math.radians(200)))
    bpy.context.active_object.data.energy = 0.8
    # the game's view: from the front right, looking down; orthographic so it frames tightly
    d = mathutils.Vector((0.72, -0.72, 0.72)).normalized()
    bpy.ops.object.camera_add(location=center + d * 20)
    cam = bpy.context.active_object
    cam.data.type = 'ORTHO'
    v = center - cam.location
    cam.rotation_euler = (math.atan2(math.hypot(v.x, v.y), -v.z), 0, math.atan2(v.y, v.x) - math.pi / 2)
    scn.camera = cam
    bpy.context.view_layer.update()
    # the widest extent of the model as seen by the camera, plus a little margin
    inv = cam.matrix_world.inverted()
    xs, ys = [], []
    for o in objs:
        for c in o.bound_box:
            p = inv @ (o.matrix_world @ mathutils.Vector(c))
            xs.append(p.x)
            ys.append(p.y)
    span = max(max(xs) - min(xs), max(ys) - min(ys))
    cam.data.ortho_scale = span * 1.08
    cam.data.shift_x = (max(xs) + min(xs)) / 2 / cam.data.ortho_scale
    cam.data.shift_y = (max(ys) + min(ys)) / 2 / cam.data.ortho_scale
    # a quick draft first: frame what actually shows (a tall gnome, not the tufts of grass at
    # the corners of its tile), weighting the solid middle over faint far bits
    tight(scn, cam)
    bpy.ops.render.render(write_still=True)


def add_eyes(scn):
    # an animal model marks its right eye with an empty named `eye` (radius in its scale) and the
    # game draws the eyes on; the icon draws a glossy dark pair in the same places
    marks = [o for o in scn.objects if o.name.split('.')[0] == 'eye' and o.type == 'EMPTY']
    if not marks:
        return
    m = marks[0]
    bpy.context.view_layer.update()
    p = m.matrix_world.translation.copy()
    r = max(m.matrix_world.to_scale()) * 0.95
    mat = bpy.data.materials.new('icon_eye')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (0.02, 0.015, 0.012, 1)
    bsdf.inputs['Roughness'].default_value = 0.12
    for sx in (1, -1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=r, location=(p.x * sx, p.y, p.z))
        e = bpy.context.active_object
        e.data.materials.append(mat)
        bpy.ops.object.shade_smooth()


def tight(scn, cam):
    import numpy as np
    full, samples, path = scn.render.resolution_x, scn.cycles.samples, scn.render.filepath
    scn.render.resolution_x = scn.render.resolution_y = 96
    scn.cycles.samples = 4
    scn.render.filepath = path + '.draft.png'
    fmt = scn.render.image_settings.file_format
    scn.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(scn.render.filepath)
    n = img.size[0]
    a = np.array(img.pixels[:]).reshape(n, n, 4)[:, :, 3]
    bpy.data.images.remove(img)
    os.remove(scn.render.filepath)
    scn.render.image_settings.file_format = fmt
    scn.render.resolution_x = scn.render.resolution_y = full
    scn.cycles.samples = samples
    scn.render.filepath = path
    # the main body: columns and rows holding most of the picture's coverage
    cols, rows = a.sum(axis=0), a.sum(axis=1)
    def span(v):
        c = np.cumsum(v) / max(v.sum(), 1e-6)
        lo, hi = np.searchsorted(c, 0.03), np.searchsorted(c, 0.97)
        return lo, min(hi, len(v) - 1)
    x0, x1 = span(cols)
    y0, y1 = span(rows)          # image rows count from the bottom
    if x1 <= x0 or y1 <= y0:
        return
    s0 = cam.data.ortho_scale
    cx, cy = ((x0 + x1 + 1) / 2) / n - 0.5, ((y0 + y1 + 1) / 2) / n - 0.5
    size = max(x1 - x0 + 1, y1 - y0 + 1) / n
    cam.data.shift_x += cx
    cam.data.shift_y += cy
    k = min(1.0, size * 1.12)
    cam.data.ortho_scale = s0 * k
    cam.data.shift_x /= k
    cam.data.shift_y /= k


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    names = [a for a in sys.argv[1:] if not a.startswith('-')] or deco_ids()
    for n in names:
        render(n)
        print('icon', n)
    # the list of icons the UI may use, written next to the game code
    have = sorted(f[:-5] for f in os.listdir(OUT) if f.endswith('.webp'))
    with open(os.path.join(ROOT, 'src', 'game', 'modelIcons.ts'), 'w') as f:
        f.write('// Written by tools/blender/icons.py: the buildings that have a rendered shop icon in\n')
        f.write('// public/icons (made from their Blender model). Do not edit by hand.\n')
        f.write('export const MODEL_ICONS = new Set([\n')
        for i in range(0, len(have), 8):
            f.write('  ' + ', '.join(f"'{h}'" for h in have[i:i + 8]) + ',\n')
        f.write(']);\n')
