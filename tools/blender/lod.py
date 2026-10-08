# Far detail levels for the Blender animals, crops, fruit trees and leafy decorations. Each model is read back, every
# part thinned out with Blender's Decimate (collapse) modifier, and written to
# `public/models/lod/<name>.glb` with the same part names and no materials: the game swaps in only
# this lighter geometry when the thing is far from the camera and keeps the near model's baked
# texture, so it looks the same from afar, it just costs about a third of the triangles.
# Run: python3 tools/blender/lod.py [names...]   (default: every public/models/animal_*.glb)
#      python3 tools/blender/lod.py --plants     (every crop, fruit tree and leafy decoration)
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


def thin(name):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, f'{name}.glb'))
    before = after = 0
    for o in list(bpy.data.objects):
        if o.type != 'MESH':
            continue
        n = len(o.data.polygons)
        before += n
        part = 'head' if o.name == 'head' else 'body' if not (o.name.startswith('leg') or o.name in ('tail', 'fan', 'train')) else 'small'
        ratio = max(KEEP[part], min(1.0, MIN_FACES / max(1, n)))
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
    bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT, 'lod', f'{name}.glb'), export_format='GLB', use_selection=True,
                              export_apply=True, export_yup=True, export_materials='NONE',
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10,
                              export_draco_texcoord_quantization=12)
    print(f'LOD {name}: {before} -> {after} faces')


# leafy decorations a farm may have by the dozen, and the wild trees and bushes on new land
# (keep in step with PLANT_LOD in src/game/render3d.ts)
LEAFY = ['flowers', 'oak', 'pumpkin_pile', 'topiary', 'hay_bale', 'tree_obs0', 'tree_obs1', 'bush_obs0', 'bush_obs1']


def plants():
    """The crop models, the fruit tree models (the buildings of kind 'tree') and LEAFY."""
    crops = sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(ROOT, 'crop_*.glb')))
    data = open(os.path.join(ROOT, '..', '..', 'src', 'game', 'data.ts'), encoding='utf-8').read()
    trees = re.findall(r"b\(\{ id: '([a-z_]+)', [^}]*kind: 'tree'", data)
    return crops + [t for t in trees + LEAFY if os.path.exists(os.path.join(ROOT, f'{t}.glb'))]


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--plants' in args:
        names = plants()
    else:
        names = args or sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(ROOT, 'animal_*.glb')))
    for n in names:
        thin(n)
