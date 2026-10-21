# Far detail levels for the Blender animals, crops, fruit trees, leafy decorations and buildings. Each model is read back, every
# part thinned out with Blender's Decimate (collapse) modifier, and written to
# `public/models/lod/<name>.glb` with the same part names and no materials: the game swaps in only
# this lighter geometry when the thing is far from the camera and keeps the near model's baked
# texture, so it looks the same from afar, it just costs about a third of the triangles.
# A second, much lighter level for the animals (about a tenth of the full model's triangles) goes to
# `public/models/lod2/<name>.glb`, for when the camera is zoomed far out and an animal is a few
# dozen pixels tall.
# Run: python3 tools/blender/lod.py [names...]   (default: every public/models/animal_*.glb)
#      python3 tools/blender/lod.py --far2 [names...]  (the very far level of the animals)
#      python3 tools/blender/lod.py --plants     (every crop, fruit tree and leafy decoration)
#      python3 tools/blender/lod.py --buildings  (the workshops, pens, barn, silo, stall and big decorations)
import glob
import os
import re
import sys

import bpy  # noqa: I001

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'models')
# the share of faces each part keeps: the body and head carry the shape, legs and tails are
# thin and already light
KEEP = {'body': 0.3, 'head': 0.35, 'small': 0.5}
MIN_FACES = 120
# the very far level: what an animal a few dozen pixels tall needs
KEEP2 = {'body': 0.1, 'head': 0.12, 'small': 0.25}
MIN_FACES2 = 60
# a building's walls and roofs are flat and already light: its triangles are in the little
# things (planks, tiles, pots, flowers), and these keep a little more of them than an animal does
BUILDING_KEEP = 0.4


def thin(name, building=False, far2=False):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, f'{name}.glb'))
    before = after = 0
    for o in list(bpy.data.objects):
        if o.type != 'MESH':
            continue
        n = len(o.data.polygons)
        before += n
        part = 'head' if o.name == 'head' else 'body' if not (o.name.startswith('leg') or o.name in ('tail', 'fan', 'train')) else 'small'
        if far2:
            ratio = max(KEEP2[part], min(1.0, MIN_FACES2 / max(1, n)))
        else:
            ratio = max(BUILDING_KEEP if building else KEEP[part], min(1.0, MIN_FACES / max(1, n)))
        if ratio < 1.0:
            bpy.context.view_layer.objects.active = o
            m = o.modifiers.new('thin', 'DECIMATE')
            m.decimate_type = 'COLLAPSE'
            m.ratio = ratio
            m.use_collapse_triangulate = True
            bpy.ops.object.select_all(action='DESELECT')
            o.select_set(True)
            bpy.ops.object.modifier_apply(modifier='thin')
        o.data.materials.clear()
        after += len(o.data.polygons)
    bpy.ops.object.select_all(action='SELECT')
    coarse = building or far2
    out = os.path.join(ROOT, 'lod2' if far2 else 'lod')
    os.makedirs(out, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, f'{name}.glb'), export_format='GLB', use_selection=True,
                              export_apply=True, export_yup=True, export_materials='NONE',
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              # a building (or an animal) seen from far: coarser numbers are as good and the file a good deal smaller
                              export_draco_position_quantization=12 if coarse else 14,
                              export_draco_normal_quantization=8 if coarse else 10,
                              export_draco_texcoord_quantization=11 if coarse else 12)
    print(f'LOD{"2" if far2 else ""} {name}: {before} -> {after} faces')


# leafy decorations a farm may have by the dozen, and the wild trees and bushes on new land
# (keep in step with PLANT_LOD in src/game/render3d.ts)
LEAFY = ['flowers', 'oak', 'pumpkin_pile', 'topiary', 'hay_bale', 'tree_obs0', 'tree_obs1', 'bush_obs0', 'bush_obs1']


def plants():
    """The crop models, the fruit tree models (the buildings of kind 'tree') and LEAFY."""
    crops = sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(ROOT, 'crop_*.glb')))
    data = open(os.path.join(ROOT, '..', '..', 'src', 'game', 'data.ts'), encoding='utf-8').read()
    trees = re.findall(r"b\(\{ id: '([a-z_]+)', [^}]*kind: 'tree'", data)
    return crops + [t for t in trees + LEAFY if os.path.exists(os.path.join(ROOT, f'{t}.glb'))]


def faces(name):
    """How many triangles a model has, from its glTF header (no need to import it)."""
    import json
    import struct
    with open(os.path.join(ROOT, f'{name}.glb'), 'rb') as f:
        f.seek(12)
        size = struct.unpack('<I', f.read(4))[0]
        f.read(4)
        j = json.loads(f.read(size))
    n = 0
    for node in j.get('nodes', []):
        for p in j['meshes'][node['mesh']]['primitives'] if 'mesh' in node else []:
            a = j['accessors'][p['indices'] if 'indices' in p else p['attributes']['POSITION']]
            n += a['count'] // 3
    return n


# (keep in step with BUILDING_LOD in src/game/render3d.ts)
BUILDING_KINDS = ('production', 'pen', 'barn', 'silo', 'stall')
# decorations this heavy get a far model too
HEAVY_DECO = 6000


def buildings():
    """The workshops, pens, barn, silo and stall, and the heavy decorations (not the houses: the
    farmhouse and the manor are one of a kind and keep their full model)."""
    data = open(os.path.join(ROOT, '..', '..', 'src', 'game', 'data.ts'), encoding='utf-8').read()
    out = []
    for i, kind in re.findall(r"b\(\{ id: '([a-z_]+)', [^}]*kind: '([a-z]+)'", data):
        if not os.path.exists(os.path.join(ROOT, f'{i}.glb')):
            continue
        if kind in BUILDING_KINDS or (kind == 'deco' and i not in LEAFY and faces(i) >= HEAVY_DECO):
            out.append(i)
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    building = '--buildings' in args
    if '--plants' in args:
        names = plants()
    elif building:
        names = [a for a in args if not a.startswith('--')] or buildings()
    else:
        names = [a for a in args if not a.startswith('--')] or sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(ROOT, 'animal_*.glb')))
    if '--list' in args:
        print(' '.join(names))
        sys.exit(0)
    for n in names:
        thin(n, building, '--far2' in args)
