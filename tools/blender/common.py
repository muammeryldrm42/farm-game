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


def bevel(obj, width=0.015, segs=1):
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
    """Render a quick Cycles preview with a sun and soft sky. Can be called again for more angles."""
    scn = bpy.context.scene
    scn.render.engine = 'CYCLES'
    scn.cycles.samples = 48
    scn.cycles.device = 'CPU'
    scn.render.resolution_x = size
    scn.render.resolution_y = size
    scn.render.filepath = path
    cam = bpy.data.objects.get('preview_cam')
    if cam is None:
        world = bpy.data.worlds.new('w')
        scn.world = world
        world.use_nodes = True
        world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.72, 0.9, 1)
        world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.8
        bpy.ops.object.light_add(type='SUN', rotation=(math.radians(50), math.radians(10), math.radians(35)))
        bpy.context.active_object.data.energy = 3.5
        bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0))
        bpy.context.active_object.data.materials.append(mat('ground', '#7cc043', 0.9))
        bpy.ops.object.camera_add()
        cam = bpy.context.active_object
        cam.name = 'preview_cam'
        scn.camera = cam
    cam.location = cam_loc
    cam.data.lens = lens
    d = [target[i] - cam_loc[i] for i in range(3)]
    cam.rotation_euler = (math.atan2(math.hypot(d[0], d[1]), -d[2]), 0, math.atan2(d[1], d[0]) - math.pi / 2)
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


# ---------------------------------------------------------------- painted materials and baking

def _lin(hexc):
    h = hexc.lstrip('#')
    rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb] + [1]


def mat_paint(name, a, b, scale=8.0, kind='noise', detail=4.0, stretch=(1, 1, 1), rough=0.8):
    """A material whose color is painted with a procedural pattern between colors a and b:
    'noise' for mottling (stone, shingles), 'wave' for wood grain, 'musgrave' like streaks."""
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = rough
    coord = nt.nodes.new('ShaderNodeTexCoord')
    mapn = nt.nodes.new('ShaderNodeMapping')
    mapn.inputs['Scale'].default_value = stretch
    nt.links.new(coord.outputs['Object'], mapn.inputs['Vector'])
    if kind == 'wave':
        tex = nt.nodes.new('ShaderNodeTexWave')
        tex.inputs['Scale'].default_value = scale
        tex.inputs['Distortion'].default_value = 6
        tex.inputs['Detail'].default_value = detail
        out = tex.outputs['Fac']
    else:
        tex = nt.nodes.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = scale
        tex.inputs['Detail'].default_value = detail
        out = tex.outputs['Fac']
    nt.links.new(mapn.outputs['Vector'], tex.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = _lin(a)
    ramp.color_ramp.elements[1].position = 0.65
    ramp.color_ramp.elements[1].color = _lin(b)
    nt.links.new(out, ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    MATS[name] = m
    return m


def join_all(name='model'):
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in objs:
        bpy.context.view_layer.objects.active = o
        for md in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    ob = bpy.context.active_object
    ob.name = name
    # weld coincident vertices and drop the hidden faces of parts buried in other parts
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0005)
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob


def bake_and_export(ob, path, tex_size=2048, ao_samples=96, ao_dist=0.35, ao_min=0.5, vivid=1.28, glow=(), jpeg=True):
    """Unwrap, bake the painted colors and ambient occlusion into one texture, then export the
    model with a single textured material. The baked soft contact shadows are what give hand
    made game art its solid look. `vivid` boosts saturation so colors stay bright in the game,
    and the materials named in `glow` (windows, lamps) are baked into an emission mask that the
    game lights up at night."""
    import numpy as np
    scn = bpy.context.scene
    scn.render.engine = 'CYCLES'
    scn.cycles.device = 'CPU'
    # a ground plane so the base gets the soft shadow of sitting on the grass
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.data.materials.append(mat('bake_ground', '#808080'))
    # unwrap
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.004, scale_to_bounds=False)
    # even texel density everywhere, then a roomy pack so no island samples its neighbor
    bpy.ops.uv.average_islands_scale()
    bpy.ops.uv.pack_islands(margin=0.004, rotate=True)
    bpy.ops.object.mode_set(mode='OBJECT')
    imgs = {}
    for kind in ('albedo', 'ao'):
        img = bpy.data.images.new(f'{ob.name}_{kind}', tex_size, tex_size, alpha=False, float_buffer=False)
        imgs[kind] = img
    def target(img):
        for slot in ob.material_slots:
            nt = slot.material.node_tree
            node = nt.nodes.get('bake_target') or nt.nodes.new('ShaderNodeTexImage')
            node.name = 'bake_target'
            node.image = img
            nt.nodes.active = node
    target(imgs['albedo'])
    scn.cycles.samples = 4
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=12, margin_type='EXTEND', use_clear=True)
    target(imgs['ao'])
    scn.cycles.samples = ao_samples
    scn.world = scn.world or bpy.data.worlds.new('w')
    scn.world.light_settings.distance = ao_dist
    bpy.ops.object.bake(type='AO', margin=12, margin_type='EXTEND', use_clear=True)
    a = np.array(imgs['albedo'].pixels[:]).reshape(-1, 4)
    o = np.array(imgs['ao'].pixels[:]).reshape(-1, 4)[:, :1]
    shade = ao_min + (1 - ao_min) * np.clip(o, 0, 1) ** 0.8
    rgb = a[:, :3]
    lum = (rgb * np.array([0.299, 0.587, 0.114])).sum(axis=1, keepdims=True)
    rgb = lum + (rgb - lum) * vivid
    out = a.copy()
    out[:, :3] = np.clip(rgb * shade, 0, 1)
    final = bpy.data.images.new(f'{ob.name}_color', tex_size, tex_size, alpha=False)
    final.pixels[:] = out.ravel()
    final.file_format = 'JPEG' if jpeg else 'PNG'
    mask = None
    if glow:
        # emission mask: white where the glowing materials are, black elsewhere
        mask = bpy.data.images.new(f'{ob.name}_glow', tex_size // 2, tex_size // 2, alpha=False)
        mask.file_format = 'JPEG' if jpeg else 'PNG'
        for slot in ob.material_slots:
            b = slot.material.node_tree.nodes['Principled BSDF']
            on = slot.material.name in glow
            b.inputs['Emission Color'].default_value = (1, 1, 1, 1) if on else (0, 0, 0, 1)
            b.inputs['Emission Strength'].default_value = 1.0
        target(mask)
        scn.cycles.samples = 1
        bpy.ops.object.bake(type='EMIT', margin=8, margin_type='EXTEND', use_clear=True)
    # one material with the baked textures
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
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_image_format='JPEG' if jpeg else 'AUTO', export_jpeg_quality=88,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12)
    return ob


def obox(name, center, axes, dims, material, bev=0.006):
    """An oriented, beveled box: `axes` are three unit vectors (a, u, n) and `dims` the sizes along them."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = {}
    for i, sa in enumerate((-1, 1)):
        for j, su in enumerate((-1, 1)):
            for k, sn in enumerate((-1, 1)):
                p = [center[c] + sa * axes[0][c] * dims[0] / 2 + su * axes[1][c] * dims[1] / 2 + sn * axes[2][c] * dims[2] / 2 for c in range(3)]
                vs[(i, j, k)] = bm.verts.new(p)
    for f in [((0, 0, 0), (0, 1, 0), (1, 1, 0), (1, 0, 0)), ((0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)),
              ((0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)), ((0, 1, 0), (0, 1, 1), (1, 1, 1), (1, 1, 0)),
              ((0, 0, 0), (0, 0, 1), (0, 1, 1), (0, 1, 0)), ((1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1))]:
        bm.faces.new([vs[x] for x in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    me.materials.append(material)
    if bev:
        bevel(o, min(bev, min(dims) * 0.45))
    return o


def shingled_roof(name, cx, cy, z, length, span, rise, over, shingle_mats, base_mat, trim_mat=None, axis='x',
                  rows=10, sw=0.13, base_thick=0.04, seed=1, rake_ends=(-1, 1), eave_trim=True):
    """A gable roof covered in staggered individual shingles. The ridge runs along `axis`; eaves sit
    at height z over a footprint `length` (along the ridge) by `span`, overhanging by `over`."""
    import random as _r
    rnd = _r.Random(seed)
    hs = span / 2 + over
    drop = rise * over / (span / 2)
    L = length / 2 + over
    run = math.hypot(hs, rise + drop)

    def V(a, b, h):  # a along ridge, b across
        return (a, b, h) if axis == 'x' else (b, a, h)

    ra = V(1, 0, 0)
    for s in (-1, 1):
        # basis: along ridge, up the slope, outward normal
        u = V(0, -s * hs / run, (rise + drop) / run)
        n = V(0, s * (rise + drop) / run, hs / run)
        eave = [cx + V(0, s * hs, 0)[0], cy + V(0, s * hs, 0)[1], z - drop]
        mid = [eave[c] + u[c] * run / 2 - n[c] * base_thick / 2 for c in range(3)]
        obox(f'{name}base{s}', mid, (ra, u, n), (2 * L, run + 0.01, base_thick), base_mat, bev=0.01)
        rl = run / rows
        for r in range(rows):
            d = (r + 0.5) * rl - rl * 0.1
            off = sw / 2 if r % 2 else 0
            x = -L + off
            i = 0
            while x < L - 0.005:
                w = min(sw, L - x)
                if w > 0.02:
                    c = [eave[k] + ra[k] * (x + w / 2) + u[k] * d + n[k] * (0.012 + r * 0.0005) for k in range(3)]
                    tilt = (rnd.random() - 0.5) * 0.04
                    nn = [n[k] + u[k] * 0.12 + ra[k] * tilt for k in range(3)]
                    ln = math.sqrt(sum(q * q for q in nn))
                    nn = [q / ln for q in nn]
                    uu = [u[k] - n[k] * 0.12 for k in range(3)]
                    lu = math.sqrt(sum(q * q for q in uu))
                    uu = [q / lu for q in uu]
                    obox(f'{name}sh{s}{r}{i}', c, (ra, uu, nn), (w * 0.95, rl * 1.35, 0.022), shingle_mats[rnd.randrange(len(shingle_mats))])
                x += w
                i += 1
        if trim_mat:
            if eave_trim:
                fe = [eave[k] + u[k] * 0.02 + n[k] * 0.0 for k in range(3)]
                obox(f'{name}eave{s}', fe, (ra, u, n), (2 * L + 0.02, 0.06, 0.07), trim_mat, bev=0.015)
            for sx in rake_ends:
                rc = [eave[k] + ra[k] * sx * (L + 0.01) + u[k] * run / 2 + n[k] * 0.01 for k in range(3)]
                obox(f'{name}rake{s}{sx}', rc, (ra, u, n), (0.05, run + 0.02, 0.08), trim_mat, bev=0.015)
    # ridge cap
    top = [cx, cy, z + rise + 0.035]
    rc = V(0, 1, 0)
    obox(f'{name}ridge', top, (ra, rc, (0, 0, 1)), (2 * L + 0.04, 0.09, 0.07), shingle_mats[0], bev=0.02)


def debug_false_colors(path, colors, cam_loc, target):
    """Debug render: recolor the named materials in flat loud colors, so a stray speck on the model
    can be traced to the part it belongs to. `colors` maps material name to an (r, g, b) tuple."""
    for nm, col in colors.items():
        m = bpy.data.materials.get(nm)
        if not m:
            continue
        for n in list(m.node_tree.nodes):
            if n.type in ('TEX_NOISE', 'TEX_WAVE', 'VALTORGB', 'MAPPING', 'TEX_COORD'):
                m.node_tree.nodes.remove(n)
        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*col, 1)
    preview(path, cam_loc=cam_loc, target=target)
