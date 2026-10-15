# Renders exported models (.glb) side by side on a patch of grass in warm afternoon light, from a
# few angles, to judge a model as the player will see it (and against the one it may replace).
# Run: python3 tools/blender/showcase.py <out.png> <model.glb> [model.glb ...] [--size 900] [--views 3]
import math
import os
import sys

import bpy  # noqa: I001
import mathutils

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = {a.split('=')[0][2:]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
OUT, MODELS = args[0], args[1:]
SIZE = int(opt.get('size', 900))
VIEWS = [v for v in opt.get('views', 'front,side,close').split(',')]
GAP = float(opt.get('gap', 0.75))


def lin(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c) + (1.0,)


def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene
    scn.render.engine = 'CYCLES'
    scn.cycles.device = 'CPU'
    scn.cycles.samples = 64
    scn.cycles.use_denoising = True
    scn.view_settings.view_transform = 'AgX'
    scn.view_settings.look = 'AgX - Medium High Contrast'
    world = bpy.data.worlds.new('sky')
    scn.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = lin('#a9d4f2')
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
    sun = bpy.data.lights.new('sun', 'SUN')
    sun.energy = 4.0
    sun.angle = math.radians(6)
    sun.color = lin('#fff0d8')[:3]
    so = bpy.data.objects.new('sun', sun)
    scn.collection.objects.link(so)
    so.rotation_euler = (math.radians(48), math.radians(12), math.radians(-35))
    # grass: green with a soft mottling
    bpy.ops.mesh.primitive_plane_add(size=12)
    g = bpy.context.active_object
    m = bpy.data.materials.new('grass')
    m.use_nodes = True
    nt = m.node_tree
    n = nt.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = 6
    r = nt.nodes.new('ShaderNodeValToRGB')
    r.color_ramp.elements[0].color = lin('#5f9a34')
    r.color_ramp.elements[1].color = lin('#86b84a')
    nt.links.new(n.outputs['Fac'], r.inputs['Fac'])
    nt.links.new(r.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
    nt.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.95
    g.data.materials.append(m)


def load(path, x):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        if o.parent is None:
            o.location.x += x
    return new


def bounds(objs):
    lo = mathutils.Vector((1e9, 1e9, 1e9))
    hi = -lo
    for o in objs:
        if o.type != 'MESH':
            continue
        for c in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(c)
            lo = mathutils.Vector(min(lo[i], w[i]) for i in range(3))
            hi = mathutils.Vector(max(hi[i], w[i]) for i in range(3))
    return lo, hi


def shoot(name, center, size, direction, lens=50):
    scn = bpy.context.scene
    cam = bpy.data.cameras.new(name)
    cam.lens = lens
    co = bpy.data.objects.new(name, cam)
    scn.collection.objects.link(co)
    co.location = center + mathutils.Vector(direction).normalized() * size
    v = center - co.location
    co.rotation_euler = v.to_track_quat('-Z', 'Y').to_euler()
    scn.camera = co
    path = f'{OUT}.{name}.png'
    scn.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path


def main():
    setup()
    scn = bpy.context.scene
    scn.render.resolution_x = SIZE
    scn.render.resolution_y = round(SIZE * 0.75)
    groups = []
    for i, p in enumerate(MODELS):
        groups.append(load(p, i * 3.0))
    # the models face -Y (the game's +z): three quarters from the front, from the side, close
    # to the head, and from above as the game's camera sees them
    dirs = {'front': ((0.6, -1.0, 0.45), 1.2), 'side': ((1.0, -0.15, 0.3), 1.2), 'close': ((0.35, -1.0, 0.3), 0.62),
            'top': ((0.8, -0.8, 1.25), 1.35), 'back': ((-0.6, 1.0, 0.45), 1.2)}
    rows = []
    for v in VIEWS:
        d, k = dirs[v]
        row = []
        for i, g in enumerate(groups):
            lo, hi = bounds(g)
            c = (lo + hi) / 2
            if v == 'close':
                # the head end: the front third of the model
                c = mathutils.Vector((c.x, lo.y + (hi.y - lo.y) * 0.22, lo.z + (hi.z - lo.z) * 0.68))
            row.append(shoot(f'{v}{i}', c, (hi - lo).length * k * 1.6, d))
        rows.append(row)
    from PIL import Image
    ims = [[Image.open(s).convert('RGB') for s in r] for r in rows]
    w, h = ims[0][0].size
    out = Image.new('RGB', (w * len(groups), h * len(rows)))
    for r, row in enumerate(ims):
        for k, im in enumerate(row):
            out.paste(im, (k * w, r * h))
    out.save(OUT)
    for r in rows:
        for s in r:
            os.remove(s)


main()
