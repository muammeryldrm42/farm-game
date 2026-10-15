# The game's logo: its name in round, chunky 3D letters (the game's own font, Fredoka Bold), glossy
# and lighter towards the top, with a thick dark outline, gently arched, and a sheaf of the game's
# own wheat on either side.
# Rendered on a clear background for the loading screen, the store's feature graphic and so on.
# Run: python3 tools/blender/logo.py <out.png> <Fredoka-Bold.ttf> [first line] [second line] [width]
# (Fredoka comes with the game as a variable woff2: fontTools' instancer makes the bold TTF, with
# its overlaps removed, or Blender fills some letters wrongly.)
import math
import os
import sys

import bpy  # noqa: I001 (bpy first: the other Blender modules come with it)
import bmesh

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'models')
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
OUT, FONT = args[0], args[1]
LINE1 = args[2] if len(args) > 2 else 'Talons'
LINE2 = args[3] if len(args) > 3 else 'Farm'
WIDTH = int(args[4]) if len(args) > 4 else 1600


def mat(name, color, rough=0.45, grain=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = rough
    if not grain:
        bsdf.inputs['Base Color'].default_value = (*color, 1)
        return m
    # wood: long streaks of a lighter and a darker tone
    tex = nt.nodes.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 3.5
    tex.inputs['Detail'].default_value = 6
    mapping = nt.nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (0.25, 6.0, 1.0)
    coord = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(coord.outputs['Object'], mapping.inputs['Vector'])
    nt.links.new(mapping.outputs['Vector'], tex.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*grain, 1)
    ramp.color_ramp.elements[1].color = (*color, 1)
    nt.links.new(tex.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    return m


def candy(name, low, high):
    """A glossy face, lighter towards the top of the letters."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.28
    coord = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.15
    ramp.color_ramp.elements[0].color = (*low, 1)
    ramp.color_ramp.elements[1].position = 0.85
    ramp.color_ramp.elements[1].color = (*high, 1)
    nt.links.new(coord.outputs['Generated'], sep.inputs['Vector'])
    nt.links.new(sep.outputs['Y'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    return m


def word(text, size, y, face, side, arch):
    """One line of letters."""
    font = bpy.data.fonts.load(FONT)
    parts = []
    # (the outline is drawn round the letters afterwards, from their shape in the picture: grown in
    # 3D it leaves spikes where strokes meet)
    for bevel, depth, z, colours in ((0.02, 0.24, 0.0, (face, side)),):
        cu = bpy.data.curves.new(f'{text}{bevel}', 'FONT')
        cu.body = text
        cu.font = font
        cu.size = size
        cu.align_x = 'CENTER'
        cu.align_y = 'CENTER'
        cu.extrude = depth
        cu.bevel_depth = bevel
        cu.bevel_resolution = 4
        ob = bpy.data.objects.new(f'{text}{bevel}', cu)
        bpy.context.scene.collection.objects.link(ob)
        ob.location = (0, y, z)
        bpy.context.view_layer.objects.active = ob
        for o in bpy.context.scene.objects:
            o.select_set(o is ob)
        bpy.ops.object.convert(target='MESH')
        ob = bpy.context.view_layer.objects.active
        me = ob.data
        for m in colours:
            me.materials.append(m)
        for p in me.polygons:
            p.material_index = 0 if p.normal.z > 0.7 else 1
            p.use_smooth = p.normal.z < 0.7
        # a gentle arch: the middle of the line a little higher than its ends
        if arch:
            bm = bmesh.new()
            bm.from_mesh(me)
            for v in bm.verts:
                v.co.y += arch * (1 - (v.co.x / (size * len(text) * 0.32)) ** 2)
            bm.to_mesh(me)
            bm.free()
        parts.append(ob)
    return parts


def wheat(x, y, rot, scale):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'crop_wheat.glb'))
    for o in [o for o in bpy.data.objects if o not in before and o.parent is None]:
        # stood up in the picture's plane: the stalk along the screen's up, leaning outwards
        o.rotation_mode = 'XYZ'
        o.scale = (scale, scale, scale)
        o.rotation_euler = (math.radians(-90), 0, math.radians(rot))
        o.location = (x, y, -0.9)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    word(LINE1, 1.25, 0.95, candy('face1', (1.0, 0.62, 0.02), (1.0, 0.9, 0.3)), mat('side1', (0.8, 0.38, 0.02), 0.5), 0.12)
    word(LINE2, 1.85, -0.55, candy('face2', (0.82, 0.1, 0.02), (1.0, 0.42, 0.1)), mat('side2', (0.5, 0.08, 0.02), 0.5), 0.16)
    longest = max(len(LINE1) * 1.25, len(LINE2) * 1.85) * 0.62
    # a sheaf behind each end of the second line
    half = len(LINE2) * 1.85 * 0.62 / 2
    for side in (-1, 1):
        for k, lean in enumerate((12, 28, 44)):
            wheat(side * (half - 0.5), -1.1, -side * lean, 2.7 - k * 0.2)
    cam = bpy.data.cameras.new('cam')
    cam.type = 'ORTHO'
    cam.ortho_scale = longest + 2.6
    co = bpy.data.objects.new('cam', cam)
    sc.collection.objects.link(co)
    sc.camera = co
    # straight on, a little from below and to the side, so the letters' depth shows
    co.location = (1.6, -2.2, 20)
    co.rotation_euler = (math.radians(6.5), math.radians(4.5), 0)

    key = bpy.data.lights.new('key', 'SUN')
    key.energy = 2.6
    key.angle = math.radians(10)
    ko = bpy.data.objects.new('key', key)
    sc.collection.objects.link(ko)
    ko.rotation_euler = (math.radians(35), math.radians(-30), math.radians(20))
    world = bpy.data.worlds.new('sky')
    sc.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.85, 0.9, 1.0, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.45

    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 96
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = WIDTH
    sc.render.resolution_y = round(WIDTH * 0.62)
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    # two pictures: the letters, and the wheat (each with the other hidden)
    letters = [o for o in sc.objects if o.type == 'MESH' and o.name.startswith((LINE1, LINE2))]
    sheaves = [o for o in sc.objects if o.type == 'MESH' and o not in letters]
    for name, show in (('letters', letters), ('wheat', sheaves)):
        for o in letters + sheaves:
            o.hide_render = o not in show
        sc.render.filepath = f'{OUT}.{name}.png'
        bpy.ops.render.render(write_still=True)
    compose()


def compose():
    """The wheat, then a thick dark outline round the letters and a deeper edge below it, then
    the letters on top."""
    from PIL import Image, ImageChops, ImageFilter
    letters = Image.open(f'{OUT}.letters.png').convert('RGBA')
    wheat = Image.open(f'{OUT}.wheat.png').convert('RGBA')
    w, h = letters.size
    r = max(2, round(w * 0.011))
    # (opened a little: a hair thin sliver at a joint would grow into a bump in the outline)
    solid = letters.split()[3].point(lambda v: 255 if v > 100 else 0).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))

    def grow(mask, by):
        return mask.filter(ImageFilter.GaussianBlur(by)).point(lambda v: 255 if v > 18 else 0).filter(ImageFilter.GaussianBlur(0.8))

    ring = grow(solid, r)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.alpha_composite(wheat)
    # the edge below: the outline pushed down a little, darker
    drop = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for k in range(1, round(r * 0.9) + 1):
        drop.paste((44, 20, 6, 255), (0, 0), ImageChops.offset(ring, 0, k))
    out.alpha_composite(drop)
    ink = Image.new('RGBA', (w, h), (74, 38, 14, 255))
    ink.putalpha(ring)
    out.alpha_composite(ink)
    out.alpha_composite(letters)
    box = out.split()[3].getbbox()
    pad = r * 2
    out.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(w, box[2] + pad), min(h, box[3] + pad))).save(OUT)
    for name in ('letters', 'wheat'):
        os.remove(f'{OUT}.{name}.png')



main()
