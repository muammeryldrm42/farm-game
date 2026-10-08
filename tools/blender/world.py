# The world around the farm: forest trees for the locked land (light enough to draw hundreds
# of them as instances), the FOR SALE sign on buyable land, and the tilled soil of a crop plot.
# Run: python3 tools/blender/world.py [names...]   (see kit.main)
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from kit import ball, bark_mat, box, cyl, finish, leaf_mats, main, pm, rock, std, torus, uid  # noqa: E402


def forest_pine():
    """A low poly pine for the forest: a stubby trunk and four jagged tiers. The game tints each
    copy a little differently, so the leaves are painted in light greens."""
    rnd = random.Random(4)
    bark = bark_mat('fp_bark', '#7a4a26', '#8e5a30')
    cyl(uid('t'), 0.07, 0.36, (0, 0, 0.18), bark, verts=8, r2=0.05, bev=0)
    greens = [pm('fp1', '#4a9a3a', '#5aaa44', scale=20), pm('fp2', '#55a642', '#62b24c', scale=20)]
    for i in range(4):
        k = i / 3
        r = 0.46 - 0.28 * k
        z = 0.28 + i * 0.3
        c = cyl(uid('tier'), r, 0.52, (0, 0, z + 0.26), greens[i % 2], verts=12, r2=0.0, bev=0, smooth=False)
        for v in c.data.vertices:
            if v.co.z < 0:
                a = math.atan2(v.co.y, v.co.x)
                # a zigzag hem, like layers of branches
                v.co.z += 0.04 * (1 if int((a + 4) * 12 / (2 * math.pi)) % 2 else -1)
                v.co.x *= 1 + (rnd.random() - 0.5) * 0.12
                v.co.y *= 1 + (rnd.random() - 0.5) * 0.12
    finish('forest_pine', tex=256, vivid=1.05, ao_min=0.55, preview=True)


def forest_round():
    """A low poly round tree: a trunk and a crown of a few big lobes."""
    rnd = random.Random(7)
    bark = bark_mat('fr_bark', '#7a4a26', '#8e5a30')
    cyl(uid('t'), 0.08, 0.5, (0, 0, 0.25), bark, verts=8, r2=0.06, bev=0)
    greens = [pm('fr1', '#4c9a36', '#5aa842', scale=20), pm('fr2', '#428e30', '#50a03c', scale=20)]
    ball(uid('core'), 0.36, (0, 0, 0.82), greens[0], scale=(1, 1, 0.9), segs=12)
    for i in range(7):
        a = i * 2.39996
        zf = 0.6 - i / 6 * 1.0
        rr = math.sqrt(max(0.0, 1 - zf * zf)) * 0.3
        ball(uid('lobe'), rnd.uniform(0.18, 0.22), (math.cos(a) * rr, math.sin(a) * rr, 0.82 + zf * 0.28), greens[i % 2], segs=10)
    finish('forest_round', tex=256, vivid=1.05, ao_min=0.55, preview=True)


def forsale_sign():
    """A wooden FOR SALE sign on a post, lettered on both faces."""
    m = std()
    board = pm('fs_board', '#c98a45', '#d89a52', scale=6, kind='wave', stretch=(1, 8, 1))
    frame = pm('fs_frame', '#6b4226', '#7a4c2c', scale=6, kind='wave', stretch=(1, 8, 1))
    letters = pm('fs_letters', '#fff6e2')
    box(uid('post'), (0.08, 0.08, 1.02), (0, 0.04, 0.51), frame, bev=0.015)
    ball(uid('cap'), 0.05, (0, 0.04, 1.03), frame, scale=(1, 1, 0.7), segs=10)
    box(uid('board'), (0.9, 0.05, 0.45), (0, 0, 0.95), board, bev=0.02)
    for z, h in ((1.165, 0.04), (0.735, 0.04)):
        box(uid('fr'), (0.94, 0.07, h), (0, 0, z), frame, bev=0.012)
    for sx in (-1, 1):
        box(uid('fr'), (0.04, 0.07, 0.47), (sx * 0.45, 0, 0.95), frame, bev=0.012)
    for sx in (-1, 1):
        box(uid('nail'), (0.02, 0.08, 0.02), (sx * 0.38, 0, 1.1), m['iron'], bev=0)
    for side in (-1, 1):
        bpy.ops.object.text_add(location=(0, side * 0.027, 0.95))
        t = bpy.context.active_object
        t.name = uid('text')
        t.data.body = 'FOR SALE'
        t.data.align_x = 'CENTER'
        t.data.align_y = 'CENTER'
        t.data.size = 0.16
        t.data.extrude = 0.006
        t.data.bevel_depth = 0.003
        t.rotation_euler = (math.radians(90), 0, math.radians(180) if side > 0 else 0)
        # heavy lettering: fatten the outline a little
        t.data.offset = 0.004
        # the letters are a few pixels tall in the game: three steps per curve and a single step
        # round the bevel keep their shape (Blender's 12 and 4 made 8000 triangles a side)
        t.data.resolution_u = 3
        t.data.bevel_resolution = 1
        bpy.ops.object.convert(target='MESH')
        t = bpy.context.active_object
        t.data.materials.clear()
        t.data.materials.append(letters)
    for i in range(5):
        a = i * 1.3
        ball(uid('tuft'), 0.05, (math.cos(a) * 0.1, math.sin(a) * 0.1 + 0.04, 0.02), m['leaf'], scale=(1.3, 1, 0.6), segs=8)
    finish('forsale_sign', tex=512, vivid=1.1)


def plot():
    """A tilled crop plot: a bed of dark soil with four raised furrows and a few clods."""
    rnd = random.Random(3)
    soil = pm('plot_soil', '#7a4a28', '#8e5a32', scale=24)
    furrow = pm('plot_furrow', '#6a3e20', '#7c4a28', scale=24)
    box(uid('bed'), (0.92, 0.92, 0.09), (0, 0, 0.045), soil, bev=0.035)
    for k in range(4):
        y = -0.3 + k * 0.2
        r = cyl(uid('row'), 0.075, 0.8, (0, y, 0.08), furrow, verts=16, rot=(0, math.radians(90), 0), bev=0.03)
        r.scale = (0.45, 1, 1)   # a low rounded mound, not a log (local x is up once turned)
    for i in range(14):
        x, y = rnd.uniform(-0.4, 0.4), rnd.uniform(-0.4, 0.4)
        rock(uid('clod'), rnd.uniform(0.012, 0.022), (x, y, 0.1), soil if i % 2 else furrow, seed=i, squash=0.6)
    finish('plot', tex=512, vivid=1.1)


def bowl(name, rx, ry, rz, loc, material, wall=0.02, segs=24):
    """An open hull: the lower half of a squashed sphere, given a wall thickness."""
    import bmesh
    o = ball(name, 1.0, loc, material, scale=(rx, ry, rz), segs=segs)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > 0.001], context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    sol = o.modifiers.new('wall', 'SOLIDIFY')
    sol.thickness = wall / max(rx, ry, rz)
    sol.offset = -1
    return o


def text(body, loc, size, material, rot=(math.radians(90), 0, 0)):
    bpy.ops.object.text_add(location=loc)
    t = bpy.context.active_object
    t.name = uid('text')
    t.data.body = body
    t.data.align_x = 'CENTER'
    t.data.align_y = 'CENTER'
    t.data.size = size
    t.data.extrude = 0.005
    t.data.offset = 0.003
    t.rotation_euler = rot
    bpy.ops.object.convert(target='MESH')
    t = bpy.context.active_object
    t.data.materials.clear()
    t.data.materials.append(material)
    return t


def fishing_jetty():
    """The jetty off the south shore: a plank deck on posts running out to sea, rails at the end
    and a FISHING sign at the shore end. The origin is the shore end of the deck's center line."""
    m = std()
    L = 1.85
    plank = pm('jt_plank', '#c49660', '#d4a670', scale=6, kind='wave', stretch=(8, 1, 1))
    post = bark_mat('jt_post', '#6b4226', '#7c4e2e')
    for k in range(int(L / 0.1)):
        y = -(k + 0.5) * L / int(L / 0.1)
        box(uid('pl'), (0.7, L / int(L / 0.1) * 0.9, 0.06), (0, y, -0.115), plank if k % 3 else m['wood_warm'], bev=0.008)
    for sx in (-1, 1):
        box(uid('beam'), (0.05, L, 0.06), (sx * 0.3, -L / 2, -0.17), m['wood_dark'], bev=0.008)
        y = -0.15
        while y > -L - 0.01:
            cyl(uid('pile'), 0.045, 0.9, (sx * 0.32, y, -0.55), post, verts=10, r2=0.05)
            torus(uid('wrap'), 0.048, 0.01, (sx * 0.32, y, -0.12), m['rope'], segs=14, rsegs=5)
            y -= 0.55
        cyl(uid('rail'), 0.05, 0.35, (sx * 0.32, -L, 0.02), post, verts=10)
        ball(uid('railc'), 0.052, (sx * 0.32, -L, 0.2), post, scale=(1, 1, 0.6), segs=10)
    box(uid('rbar'), (0.7, 0.04, 0.04), (0, -L, 0.12), m['wood_dark'], bev=0.006)
    torus(uid('coil'), 0.06, 0.018, (0.2, -L + 0.2, -0.07), m['rope'], segs=16, rsegs=6)
    # FISHING sign at the shore end, left of the deck
    sx, sy = -0.55, -0.15
    cyl(uid('spost'), 0.03, 0.75, (sx, sy, -0.2 + 0.375), post, verts=8)
    box(uid('sboard'), (0.62, 0.05, 0.3), (sx, sy, -0.2 + 0.72), pm('js_board', '#c98a45', '#d89a52', scale=6, kind='wave', stretch=(1, 8, 1)), bev=0.015)
    for z in (-0.2 + 0.87, -0.2 + 0.57):
        box(uid('sfr'), (0.66, 0.07, 0.035), (sx, sy, z), m['wood_dark'], bev=0.01)
    lettering = pm('js_letters', '#fff6e2')
    text('FISHING', (sx, sy - 0.027, -0.2 + 0.72), 0.12, lettering)
    text('FISHING', (sx, sy + 0.027, -0.2 + 0.72), 0.12, lettering, rot=(math.radians(90), 0, math.radians(180)))
    finish('fishing_jetty', tex=1024)


def rowboat():
    """A little wooden rowboat: a planked hull, a white stripe, two seats and a pair of oars.
    The origin sits where the game floats the boat; the rim is at 0.3."""
    m = std()
    hull = pm('rb_hull', '#9a5a32', '#ac6a3c', scale=6, kind='wave', stretch=(1, 8, 1))
    bowl(uid('hull'), 0.27, 0.56, 0.2, (0, 0, 0.3), hull, wall=0.025)
    torus(uid('rim'), 1.0, 0.07, (0, 0, 0.3), m['wood_dark'], segs=28, rsegs=6).scale = (0.27, 0.56, 0.4)
    torus(uid('stripe'), 1.0, 0.05, (0, 0, 0.2), pm('rb_stripe', '#f4efe6'), segs=32, rsegs=6).scale = (0.255, 0.53, 0.35)
    for y in (0.12, -0.2):
        box(uid('seat'), (0.46, 0.1, 0.03), (0, y, 0.23), m['wood'], bev=0.006)
    # a pair of oars stowed along the seats
    for sx in (-1, 1):
        cyl(uid('oar'), 0.012, 0.78, (sx * 0.13, -0.02, 0.265), m['wood'], verts=6, rot=(math.radians(90), 0, sx * 0.08))
        box(uid('blade'), (0.06, 0.16, 0.01), (sx * 0.13 + sx * 0.03, -0.42, 0.265), m['wood'], rot=(0, 0, sx * 0.08), bev=0.004)
    finish('rowboat', tex=512)


def cargo_boat():
    """The cargo boat that visits the dock: a round bellied hull with a stripe, a plank deck, a
    mast with a white sail and a red pennant. The game fills its deck with crates."""
    m = std()
    hull = pm('cb_hull', '#8e4a2b', '#a05a36', scale=6, kind='wave', stretch=(1, 8, 1))
    bowl(uid('hull'), 0.27, 0.6, 0.22, (0, 0, 0.22), hull, wall=0.025)
    torus(uid('rim'), 1.0, 0.06, (0, 0, 0.22), m['wood_dark'], segs=32, rsegs=6).scale = (0.27, 0.6, 0.35)
    torus(uid('stripe'), 1.0, 0.05, (0, 0, 0.13), pm('cb_stripe', '#f4efe6'), segs=36, rsegs=6).scale = (0.255, 0.57, 0.3)
    box(uid('deck'), (0.44, 0.9, 0.025), (0, 0, 0.2), pm('cb_deck', '#c98a45', '#d89a52', scale=6, kind='wave', stretch=(1, 8, 1)), bev=0.006)
    cyl(uid('mast'), 0.025, 1.3, (0, -0.05, 0.2 + 0.65), m['wood_dark'], verts=10, r2=0.02)
    sail = pm('cb_sail', '#fffaf0', '#fff4e0', scale=20)
    from kit import prism
    prism(uid('sail'), [(-0.03, 0.35), (-0.5, 0.38), (-0.06, 1.35)], -0.004, 0.004, sail)
    box(uid('boom'), (0.02, 0.5, 0.02), (0, -0.28, 0.36), m['wood_dark'], bev=0)
    box(uid('flag'), (0.01, 0.16, 0.1), (0, -0.13, 1.47), pm('cb_flag', '#e74c3c'), bev=0)
    ball(uid('top'), 0.025, (0, -0.05, 1.51), m['brass'], segs=8)
    for sx in (-1, 1):
        torus(uid('buoy'), 0.05, 0.018, (sx * 0.27, 0.2, 0.15), pm('cb_ring', '#e8402c'), rot=(0, math.radians(90), 0), segs=16, rsegs=6)
    finish('cargo_boat', tex=512)


def shore_rock():
    """A faceted boulder for the shoreline, one unit across, drawn as instances round the island
    (each copy turned, squashed and tinted by the game)."""
    stone = pm('shore_stone', '#8e949a', '#a4aab0', scale=6)
    rock(uid('boulder'), 1.0, (0, 0, 0), stone, seed=31, squash=0.85, rough=0.18)
    finish('shore_rock', tex=256, vivid=1.0, ao_min=0.6)


MODELS = {'forest_pine': forest_pine, 'forest_round': forest_round, 'forsale_sign': forsale_sign, 'plot': plot,
          'fishing_jetty': fishing_jetty, 'rowboat': rowboat, 'cargo_boat': cargo_boat, 'shore_rock': shore_rock}

if __name__ == '__main__':
    main(MODELS)
