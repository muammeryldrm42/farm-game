# The app's icon: a little grass island with the farmhouse, an apple tree, a hay bale, flowers and
# two hens, all the game's own Blender models, rendered from above on a clear background.
# tools/store_art.py lays it on the sky for the store icon, the phone's launcher icons and the
# splash screen.
# Run: python3 tools/blender/icon.py <out.png> [size]
import math
import os
import sys

import bpy  # noqa: I001 (bpy first: the other Blender modules come with it)
import bmesh
import mathutils

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'models')
OUT = sys.argv[-2] if len(sys.argv) > 2 and sys.argv[-1].isdigit() else sys.argv[-1]
SIZE = int(sys.argv[-1]) if sys.argv[-1].isdigit() else 1024


def mat(name, color, rough=0.9, noise=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = rough
    if not noise:
        bsdf.inputs['Base Color'].default_value = (*color, 1)
        return m
    # a soft mottle, so the grass and soil are not flat colour
    tex = nt.nodes.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 6
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*[c * (1 - noise) for c in color], 1)
    ramp.color_ramp.elements[1].color = (*[min(1, c * (1 + noise)) for c in color], 1)
    nt.links.new(tex.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    return m


def island(w=4.2, d=4.2, h=0.75, r=0.45, seg=8):
    # a rounded rectangle seen from above, stood up into a block of soil with grass on top
    ring = []
    for cx, cy, a0 in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)):
        for k in range(seg + 1):
            a = math.radians(a0 + 90 * k / seg)
            ring.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    me = bpy.data.meshes.new('island')
    ob = bpy.data.objects.new('island', me)
    bpy.context.scene.collection.objects.link(ob)
    bm = bmesh.new()
    top = [bm.verts.new((x, y, 0)) for x, y in ring]
    bot = [bm.verts.new((x, y, -h)) for x, y in ring]
    n = len(ring)
    grass = bm.faces.new(top)
    grass.material_index = 0
    soil = bm.faces.new(list(reversed(bot)))
    soil.material_index = 1
    for i in range(n):
        j = (i + 1) % n
        f = bm.faces.new((top[i], bot[i], bot[j], top[j]))
        f.material_index = 1
        f.smooth = True
    for e in bm.edges:
        e.smooth = abs(e.verts[0].co.z - e.verts[1].co.z) > 1e-4
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat('grass', (0.24, 0.55, 0.12), 0.95, 0.18))
    me.materials.append(mat('soil', (0.36, 0.21, 0.09), 1.0, 0.12))
    return ob


def place(name, x, y, rot=0.0, scale=1.0):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, f'{name}.glb'))
    new = [o for o in bpy.data.objects if o not in before]
    top = [o for o in new if o.parent is None]
    for o in top:
        o.location = (o.location.x + x, o.location.y + y, o.location.z)
        o.rotation_mode = 'XYZ'
        o.rotation_euler.z += math.radians(rot)
        o.scale = [s * scale for s in o.scale]
    return new


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    island()
    place('farmhouse', -0.35, 0.45, rot=28)
    place('apple_tree', 1.25, 1.0, rot=10, scale=1.15)
    place('hay_bale', -1.35, -1.05, rot=-20, scale=1.2)
    place('flowers', 1.35, -0.55, scale=0.9)
    place('animal_chicken', -0.2, -1.3, rot=-35, scale=1.9)
    place('animal_chicken', 0.45, -1.6, rot=25, scale=1.9)

    cam = bpy.data.cameras.new('cam')
    cam.type = 'ORTHO'
    cam.ortho_scale = 6.9
    co = bpy.data.objects.new('cam', cam)
    sc.collection.objects.link(co)
    sc.camera = co
    co.location = (7.0, -7.0, 6.4)
    target = mathutils.Vector((0, 0, 0.45))
    co.rotation_euler = (target - co.location).to_track_quat('-Z', 'Y').to_euler()

    sun = bpy.data.lights.new('sun', 'SUN')
    sun.energy = 3.6
    sun.angle = math.radians(8)
    sun.color = (1.0, 0.95, 0.86)
    so = bpy.data.objects.new('sun', sun)
    sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(40), math.radians(-25), math.radians(-60))

    world = bpy.data.worlds.new('sky')
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.55, 0.74, 1.0, 1)
    bg.inputs['Strength'].default_value = 0.9

    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 96
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = SIZE
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    sc.render.filepath = OUT
    bpy.ops.render.render(write_still=True)


main()
