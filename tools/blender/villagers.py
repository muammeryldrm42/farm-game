# The valley folk who tell the farm story: Grandpa Walt, Mayor Bramble, Ivy the gardener, Doc
# Maya, Rosie the baker, Chef Marco, Captain Finn and Professor Hazel. Built like the farmer in
# animals.py (same pivots and head, so the game's walk cycle and googly eyes fit), each with
# their own build, hair, clothes and hat.
# Parts: `leg0/1` at the hips, `body`, `arm0/1` at the shoulders and `head` at the neck.
# Run: python3 tools/blender/villagers.py [names...]   (see kit.main)
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from animals import B, Blob  # noqa: E402
from kit import anim_group, ball, cyl, finish, main, pm, torus, uid  # noqa: E402

HX, HY, HZ = 0, 0.74, 0   # the head pivot, as on the farmer


def o(x, y, z):
    return (HX + x, HY + y, HZ + z)


def person(name, v):
    g = v.get('girth', 1.0)
    skin = pm(f'{name}_skin', v['skin'], v.get('skin2', v['skin']), scale=40)
    cheek = pm(f'{name}_cheek', v.get('cheek', '#f0a098'))
    hair = pm(f'{name}_hair', v['hair'], v.get('hair2', v['hair']), scale=60, kind='wave', stretch=(1, 1, 6))
    top = pm(f'{name}_top', v['top'], v.get('top2', v['top']), scale=40)
    legs_m = pm(f'{name}_legs', v['legs'], v.get('legs2', v['legs']), scale=60)
    boot = pm(f'{name}_boot', v.get('boot', '#5a3a1c'), rough=0.5)
    coat = pm(f'{name}_coat', v['coat'], v.get('coat2', v['coat']), scale=40) if v.get('coat') else None
    apron = pm(f'{name}_apron', v['apron'], rough=0.8) if v.get('apron') else None
    dress = pm(f'{name}_dress', v['dress'], v.get('dress2', v['dress']), scale=40) if v.get('dress') else None
    gold = pm('gold', '#e8b83a', rough=0.3, metal=0.7)

    # legs: trousers, or stockings under a skirt
    for i, x in enumerate((-0.06, 0.06)):
        with anim_group(f'leg{i}', B(x, 0.28, 0)):
            lg = Blob(0.005)
            lg.cap((x, 0.29, 0), (x, 0.05, 0.004), 0.05 * min(g, 1.1), 0.045)
            lg.build(legs_m, 400)
            bt = Blob(0.004)
            bt.ell((x, 0.032, 0.03), 0.058, 0.042, 0.088)
            bt.build(boot, 300)

    with anim_group('body', B(0, 0, 0)):
        t = Blob(0.006)
        t.ell((0, 0.33, 0.01 * (g - 1) * 10), 0.118 * g, 0.09, 0.116 * g).cap((0, 0.4, 0), (0, 0.52, 0), 0.112 * g, 0.104)
        t.ell((0, 0.58, 0), 0.1, 0.05, 0.09)
        if dress:
            # a skirt flaring out over the hips
            t.cap((0, 0.4, 0), (0, 0.19, 0), 0.12 * g, 0.165 * g)
        if coat and v.get('long_coat'):
            t.cap((0, 0.4, 0), (0, 0.2, 0), 0.125 * g, 0.15 * g)

        def paint(x, y, z):
            front = z > 0.02
            if apron and front and abs(x) < 0.085 * g and y < 0.55 and (y < 0.46 or abs(x) < 0.06):
                return apron
            if coat:
                # an open coat shows the shirt down the middle
                if front and abs(x) < 0.03 and y > 0.36 and not v.get('closed'):
                    return top
                return coat
            if dress:
                return dress
            if y < 0.43:
                return legs_m if not v.get('overalls') else pm(f'{name}_over', v['overalls'], rough=0.8)
            if v.get('overalls') and front and abs(x) < 0.066 and y < 0.53:
                return pm(f'{name}_over', v['overalls'], rough=0.8)
            return top
        t.build(paint, 1500)
        if v.get('buttons'):
            for y in (0.36, 0.43, 0.5):
                ball(uid('btn'), 0.013, B(0.045, y, 0.118 * g), gold, segs=8)
        if v.get('bowtie'):
            bt_m = pm(f'{name}_bow', v['bowtie'])
            for sx in (-1, 1):
                ball(uid('bow'), 0.03, B(sx * 0.03, 0.6, 0.085), bt_m, scale=(1.2, 0.8, 0.5), segs=10)
            ball(uid('bow'), 0.015, B(0, 0.6, 0.095), bt_m, segs=8)
        if v.get('stethoscope'):
            tube = pm('tube', '#2a2a30', rough=0.4)
            torus(uid('steth'), 0.085, 0.009, B(0, 0.585, 0.02), tube, rot=(math.radians(70), 0, 0))
            ball(uid('steth'), 0.022, B(0.03, 0.47, 0.12), pm('steel', '#c8ced4', rough=0.25, metal=0.8), scale=(1, 0.5, 1), segs=10)
        if v.get('scarf'):
            sc = pm(f'{name}_scarf', v['scarf'], rough=0.9)
            torus(uid('scarf'), 0.085, 0.028, B(0, 0.6, 0), sc, rot=(math.radians(90), 0, 0))

    sleeve = coat or (dress if v.get('dress_sleeves') else None) or top
    for i, sx in enumerate((-1, 1)):
        with anim_group(f'arm{i}', B(sx * 0.15 * g, 0.53, 0)):
            a = Blob(0.004)
            a.cap((sx * 0.15 * g, 0.55, 0), (sx * 0.15 * g, 0.39, 0), 0.05, 0.044)
            a.build(sleeve, 400)
            h = Blob(0.004)
            h.ball((sx * 0.15 * g, 0.33, 0), 0.05)
            h.build(skin, 250)

    with anim_group('head', B(HX, HY, HZ)):
        hd = Blob(0.005)
        hd.ell(o(0, 0, 0), 0.128, 0.122, 0.12).ell(o(0, -0.07, 0.02), 0.08, 0.05, 0.08)
        hd.ell(o(0, -0.012, 0.125), 0.024, 0.022, 0.022)   # nose
        for sx in (-1, 1):
            hd.ell(o(sx * 0.125, -0.006, 0), 0.02, 0.034, 0.025)   # ears
        hd.ell(o(0, -0.058, 0.108), 0.03, 0.006, 0.02, neg=True)   # smile

        def face(x, y, z):
            lz, ly, lx = z - HZ, y - HY, x - HX
            if lz > 0.07 and abs(lx) > 0.05 and -0.055 < ly < -0.01:
                return cheek
            return skin
        hd.build(face, 1200)

        style = v.get('hair_style', 'short')
        hr = Blob(0.005)
        if style == 'bald':
            # a ring of hair round the back and sides, bald on top
            hr.ell(o(0, -0.005, -0.04), 0.132, 0.06, 0.1)
            for sx in (-1, 1):
                hr.ell(o(sx * 0.115, 0.0, 0.0), 0.03, 0.05, 0.06)
        else:
            hr.ell(o(0, 0.035, -0.022), 0.132, 0.1, 0.118)
            if style in ('short', 'neat'):
                hr.ell(o(0.035, 0.07, 0.075), 0.06, 0.028, 0.04)
            hr.ell(o(0, -0.02, -0.06), 0.1, 0.07, 0.07)
            if style == 'bun':
                hr.ball(o(0, 0.1, -0.1), 0.06)
            if style == 'ponytail':
                hr.cap(o(0, 0.06, -0.12), o(0, -0.14, -0.17), 0.045, 0.03)
            if style == 'braids':
                for sx in (-1, 1):
                    hr.cap(o(sx * 0.11, -0.02, -0.03), o(sx * 0.12, -0.2, 0.0), 0.032, 0.022)
            if style == 'curly':
                for k in range(9):
                    a = k / 9 * math.pi * 2
                    hr.ball(o(math.cos(a) * 0.09, 0.08 + math.sin(a * 2) * 0.01, math.sin(a) * 0.08 - 0.02), 0.05)
            if style == 'long':
                hr.cap(o(0, 0.0, -0.08), o(0, -0.2, -0.1), 0.11, 0.09)
        hr.build(hair, 700)
        if v.get('beard'):
            bd = Blob(0.004)
            bd.ell(o(0, -0.075, 0.075), 0.1, 0.075, 0.07)
            for sx in (-1, 1):
                bd.ell(o(sx * 0.09, -0.03, 0.05), 0.03, 0.06, 0.05)
            bd.build(pm(f'{name}_beard', v['beard'], rough=0.9), 500)
        if v.get('mustache'):
            ms = Blob(0.003)
            for sx in (-1, 1):
                ms.cap(o(sx * 0.005, -0.035, 0.128), o(sx * 0.06, -0.045, 0.108), 0.018, 0.01)
            ms.build(pm(f'{name}_mus', v['mustache'], rough=0.9), 200)
        if v.get('glasses'):
            fr = pm(f'{name}_frame', v['glasses'], rough=0.3, metal=0.5)
            for sx in (-1, 1):
                torus(uid('glass'), 0.04, 0.006, B(HX + sx * 0.05, HY + 0.028, HZ + 0.128), fr, rot=(math.radians(90), 0, 0), segs=20, rsegs=6)
            cyl(uid('bridge'), 0.005, 0.03, B(HX, HY + 0.035, HZ + 0.132), fr, verts=6, rot=(0, math.radians(90), 0), bev=0)

        hat = v.get('hat')
        top_y = HY + 0.105
        if hat == 'toque':
            white = pm('chef_white', '#fbfbf6', rough=0.7)
            cyl(uid('toque'), 0.1, 0.1, B(HX, top_y + 0.02, HZ - 0.01), white, verts=24)
            ball(uid('toque'), 0.13, B(HX, top_y + 0.1, HZ - 0.01), white, scale=(1, 1, 0.6), segs=20)
        elif hat == 'top_hat':
            blk, band = pm('silk', '#2a2230', rough=0.35), pm(f'{name}_band', v.get('band', '#8a2a3a'))
            cyl(uid('brim'), 0.19, 0.016, B(HX, top_y, HZ - 0.01), blk, verts=28)
            cyl(uid('crown'), 0.105, 0.19, B(HX, top_y + 0.1, HZ - 0.01), blk, verts=24)
            cyl(uid('band'), 0.108, 0.035, B(HX, top_y + 0.03, HZ - 0.01), band, verts=24, bev=0)
        elif hat == 'captain':
            navy, white = pm('cap_navy', '#1f2e4a', rough=0.5), pm('cap_white', '#f4f4ee', rough=0.6)
            cyl(uid('cap'), 0.135, 0.055, B(HX, top_y, HZ - 0.01), navy, verts=24)
            cyl(uid('cap'), 0.15, 0.03, B(HX, top_y + 0.04, HZ - 0.02), white, verts=24, r2=0.14)
            ball(uid('visor'), 0.09, B(HX, top_y - 0.02, HZ + 0.1), pm('visor', '#15151a', rough=0.3), scale=(1.1, 0.8, 0.15), segs=16)
            ball(uid('badge'), 0.022, B(HX, top_y + 0.02, HZ + 0.13), gold, scale=(1, 0.4, 1), segs=10)
        elif hat in ('sunhat', 'flat_straw'):
            straw = pm('sun_straw', '#e9c46a', '#f4d68a', scale=50, kind='wave', stretch=(1, 1, 5))
            tilt = math.radians(-14)
            cyl(uid('brim'), 0.27, 0.02, B(HX, top_y - 0.02, HZ - 0.015), straw, verts=32, r2=0.25, rot=(tilt, 0, 0))
            ball(uid('crown'), 0.13, B(HX, top_y + 0.01, HZ - 0.03), straw, scale=(1, 1, 0.75), segs=18)
            band = pm(f'{name}_band', v.get('band', '#3a8a36'))
            cyl(uid('band'), 0.133, 0.03, B(HX, top_y - 0.005, HZ - 0.03), band, verts=24, bev=0, rot=(tilt, 0, 0))
            if v.get('flower'):
                ball(uid('flower'), 0.035, B(HX + 0.11, top_y + 0.01, HZ + 0.05), pm(f'{name}_flower', v['flower']), segs=10)
                ball(uid('flower'), 0.015, B(HX + 0.115, top_y + 0.02, HZ + 0.08), pm('flower_mid', '#f2d23a'), segs=8)
        elif hat == 'flatcap':
            tweed = pm(f'{name}_cap', v.get('cap', '#7a6a58'), v.get('cap2', '#8e7e6a'), scale=70)
            ball(uid('cap'), 0.14, B(HX, top_y - 0.01, HZ - 0.005), tweed, scale=(1, 1.05, 0.45), segs=18)
            ball(uid('peak'), 0.08, B(HX, top_y - 0.03, HZ + 0.11), tweed, scale=(1.2, 0.7, 0.18), segs=14)
    finish(name, tex=512, vivid=1.1, ao_min=0.82, ao_dist=0.05)


FOLK = {
    'villager_grandpa': dict(skin='#f2c6a0', hair='#e8e6e0', hair_style='bald', beard='#ecebe6', glasses='#8a6a3a', hat='flatcap',
                             top='#b85a3a', top2='#c86a48', coat='#6a7a4a', coat2='#77875a', buttons=True, legs='#6a5a48', boot='#4a2e1a'),
    'villager_bramble': dict(skin='#f0c09a', hair='#6a4a2a', hair_style='neat', beard='#6a4a2a', hat='top_hat', band='#c0392b', girth=1.18,
                             top='#f4f1ea', coat='#5a3a8a', coat2='#6a4a9a', closed=True, buttons=True, bowtie='#c0392b', legs='#2a2438', boot='#1a1418'),
    'villager_ivy': dict(skin='#f6d0b0', hair='#c8642a', hair2='#d8743a', hair_style='braids', hat='sunhat', band='#3a8a36', flower='#ff6b8a',
                         top='#f2e6c8', overalls='#4a9a44', legs='#4a9a44', boot='#6a4422'),
    'villager_maya': dict(skin='#b87a52', cheek='#b8645a', hair='#2a1a14', hair_style='ponytail', top='#4a8ad0',
                          coat='#f7f7f2', coat2='#ffffff', long_coat=True, stethoscope=True, legs='#3a4a6a', boot='#2a2a30'),
    'villager_rosie': dict(skin='#f8d4b8', hair='#e8b84a', hair2='#f0c860', hair_style='bun', top='#e87aa0', dress='#e87aa0', dress2='#f08aae',
                           dress_sleeves=True, apron='#fbf6ee', legs='#f8d4b8', boot='#8a3a4a'),
    'villager_marco': dict(skin='#e8b48a', hair='#2a1e18', hair_style='short', mustache='#2a1e18', hat='toque', girth=1.14,
                           top='#fbfbf6', apron='#fbfbf6', scarf='#c0392b', legs='#3a3a40', boot='#1a1a1e'),
    'villager_finn': dict(skin='#e8b890', hair='#a8a49c', hair_style='short', beard='#b8b4ac', hat='captain', top='#f4f4ee',
                          coat='#1f2e4a', coat2='#2a3a58', closed=True, buttons=True, legs='#1f2e4a', boot='#15151a'),
    'villager_hazel': dict(skin='#f4cfae', hair='#8a8a90', hair2='#a0a0a8', hair_style='curly', glasses='#2a2a30', top='#e8e0c8',
                           coat='#5a7a5a', coat2='#6a8a68', long_coat=True, scarf='#d8a83a', legs='#4a4038', boot='#3a2a1a'),
}

MODELS = {name: (lambda n=name, v=spec: person(n, v)) for name, spec in FOLK.items()}

if __name__ == '__main__':
    main(MODELS)
