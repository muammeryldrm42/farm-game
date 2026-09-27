# Shared helpers for the Blender model scripts: run with `python3 tools/blender/<model>.py`.
# Models are built in Blender's Z up space, facing -Y (the game's +Z), centered on the origin,
# then exported as .glb into public/models.
import math
import bpy
import bmesh

MATS = {}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()


def mat(name, color, rough=0.75, metal=0.0, emit=None):
    """A flat stylized material; color is a hex string."""
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    h = color.lstrip('#')
    rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    b.inputs['Base Color'].default_value = (*lin, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*lin, 1)
        b.inputs['Emission Strength'].default_value = emit
    MATS[name] = m
    return m


def bevel(obj, width=0.015, segs=2):
    mod = obj.modifiers.new('bevel', 'BEVEL')
    mod.width = width
    mod.segments = segs
    mod.limit_method = 'ANGLE'
    mod.harden_normals = True
    return obj


def box(name, size, loc, material, rot=(0, 0, 0), bev=0.015):
    """A beveled box: size (x, y, z), loc is the center."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bev:
        bevel(o, min(bev, min(size) * 0.45))
    return o


def cyl(name, r, h, loc, material, verts=16, rot=(0, 0, 0), r2=None, bev=0.01):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(material)
    if bev:
        bevel(o, bev)
    bpy.ops.object.shade_smooth()
    return o


def sphere(name, r, loc, material, scale=(1, 1, 1), segs=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=max(6, segs // 2), radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o


def prism(name, w, d, h, loc, material):
    """A gable triangle: base w along X, depth d along Y, apex height h, base centered at loc."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    x, y, z = loc
    v = [bm.verts.new(p) for p in [(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x, y - d / 2, z + h),
                                   (x - w / 2, y + d / 2, z), (x + w / 2, y + d / 2, z), (x, y + d / 2, z + h)]]
    for f in [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]:
        bm.faces.new([v[i] for i in f])
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    return o


def finish_and_export(path):
    """Apply modifiers, join everything into one object and export a .glb."""
    bpy.ops.object.select_all(action='SELECT')
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in objs:
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
                              export_yup=True, export_normals=True, export_materials='EXPORT')


def preview(path, size=640, cam_loc=(3.2, -3.6, 3.0), target=(0, 0, 0.6), lens=45):
    """Render a quick Cycles preview with a sun and soft sky."""
    scn = bpy.context.scene
    scn.render.engine = 'CYCLES'
    scn.cycles.samples = 48
    scn.cycles.device = 'CPU'
    scn.render.resolution_x = size
    scn.render.resolution_y = size
    scn.render.filepath = path
    world = bpy.data.worlds.new('w')
    scn.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.72, 0.9, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.8
    bpy.ops.object.light_add(type='SUN', rotation=(math.radians(50), math.radians(10), math.radians(35)))
    bpy.context.active_object.data.energy = 3.5
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0))
    g = bpy.context.active_object
    g.data.materials.append(mat('ground', '#7cc043', 0.9))
    bpy.ops.object.camera_add(location=cam_loc)
    cam = bpy.context.active_object
    cam.data.lens = lens
    d = [target[i] - cam_loc[i] for i in range(3)]
    cam.rotation_euler = (math.atan2(math.hypot(d[0], d[1]), -d[2]), 0, math.atan2(d[1], d[0]) - math.pi / 2)
    scn.camera = cam
    bpy.ops.render.render(write_still=True)


def slab(name, corners, thick, material):
    """A flat quad (4 corners, counter clockwise seen from outside) given thickness along its normal."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    v = [bm.verts.new(c) for c in corners]
    f = bm.faces.new(v)
    bm.normal_update()
    # roof slabs always face up and out, whatever order the corners came in
    if f.normal.z < 0:
        f.normal_flip()
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    s = o.modifiers.new('solid', 'SOLIDIFY')
    s.thickness = thick
    s.offset = 1
    bevel(o, thick * 0.35)
    return o


def gable_roof(name, cx, cy, z, length, span, rise, over, material, lip=None, axis='x', rows=6, thick=0.07):
    """A two slope roof. The ridge runs along `axis` ('x' or 'y') over a footprint length x span,
    eaves start at height z and overhang by `over`. Optional shingle lips in a darker color."""
    hs = span / 2 + over
    drop = rise * over / (span / 2)
    L = length / 2 + over
    lift = thick * math.hypot(span / 2, rise) / (span / 2) + 0.004  # slab top, measured straight up
    objs = []

    def P(a, b, h):  # a along the ridge, b across it
        return (cx + a, cy + b, h) if axis == 'x' else (cx + b, cy + a, h)

    for s in (-1, 1):
        eave, top = z - drop, z + rise
        c = [P(-L, s * hs, eave), P(L, s * hs, eave), P(L, 0, top), P(-L, 0, top)]
        if (s < 0) != (axis == 'y'):
            c = c[::-1]
        objs.append(slab(f'{name}{s}', c, thick, material))
        if lip:
            for r in range(rows):
                t = (r + 0.35) / rows
                b0, h0 = s * hs * (1 - t), eave + (top - eave) * t
                b1, h1 = s * hs * (1 - t - 0.5 / rows), eave + (top - eave) * (t + 0.5 / rows)
                cc = [P(-L + 0.01, b0, h0 + lift), P(L - 0.01, b0, h0 + lift), P(L - 0.01, b1, h1 + lift), P(-L + 0.01, b1, h1 + lift)]
                if (s < 0) != (axis == 'y'):
                    cc = cc[::-1]
                objs.append(slab(f'{name}lip{s}{r}', cc, 0.02, lip))
    return objs


def gable_wall(name, cx, cy, z, length, span, rise, material, axis='x'):
    """The triangular attic walls under a gable roof (ridge along `axis`)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    a, b = length / 2, span / 2

    def P(u, w, h):
        return (cx + u, cy + w, h) if axis == 'x' else (cx + w, cy + u, h)

    v = [bm.verts.new(p) for p in [P(-a, -b, z), P(-a, b, z), P(-a, 0, z + rise), P(a, -b, z), P(a, b, z), P(a, 0, z + rise)]]
    for f in [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]:
        bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    return o
