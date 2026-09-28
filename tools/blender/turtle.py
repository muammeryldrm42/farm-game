# Loggerhead sea turtles (Caretta caretta) for the turtle beach: a nesting mother and a
# hatchling. Built in game coordinates (y up, +z the front) from metaballs like animals.py.
# Parts the game moves: `head` and the four flippers `flip0..3` (front left, front right, rear
# left, rear right; left is -x), each pivoting at its shoulder or hip.
# Run: python3 tools/blender/turtle.py [names...]   (see kit.main)
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from animals import B, Blob  # noqa: E402
from kit import anim_group, ball, finish, main, pm  # noqa: E402


def scutes(base, seam, rim, L):
    """Paint the carapace plates: five vertebral plates down the middle, four costal plates on
    each side and a ring of small marginal plates round the rim, with dark seams between."""
    def paint(x, y, z):
        u, w = z / L, abs(x) / (L * 0.78)
        if w > 0.86 or y < 0.3 * L:
            a = math.atan2(z, x)
            return seam if abs(math.sin(a * 11)) < 0.16 else rim
        if abs(w - 0.3) < 0.045 or abs(w - 0.66) < 0.04:
            return seam
        cuts = (0.55, 0.2, -0.15, -0.5) if w < 0.3 else (0.42, 0.02, -0.38)
        return seam if any(abs(u - k) < 0.05 for k in cuts) else base
    return paint


def turtle(name, L=0.2, hatchling=False):
    """One turtle, carapace length 2 * L. The mother is reddish brown over a cream shell below and
    yellow brown skin; a hatchling is dark grey brown all over."""
    if hatchling:
        # loggerhead hatchlings are brown with darker seams and paler flipper edges: lighter than
        # life here so they read as little turtles on the sand, not as shadows
        base, seam, rim = pm('ht_shell', '#8a6440', '#a07850', scale=30), pm('ht_seam', '#4a3424'), pm('ht_rim', '#b89068', '#c8a078', scale=30)
        skin, skin_d, belly = pm('ht_skin', '#9a7a58', '#b08e6a', scale=40), pm('ht_skin_d', '#6a5038'), pm('ht_belly', '#d8c8a8')
    else:
        base, seam, rim = pm('lh_shell', '#94461e', '#b0602e', scale=24), pm('lh_seam', '#4a2410'), pm('lh_rim', '#c08040', '#d49a58', scale=30)
        skin, skin_d, belly = pm('lh_skin', '#b87a3a', '#d4a050', scale=40), pm('lh_skin_d', '#7a4a22'), pm('lh_belly', '#ecd8a0', '#f6e6b8', scale=30)
    # carapace: a long dome, heart shaped, tapering at the back
    c = Blob(0.006 if not hatchling else 0.005)
    c.ell((0, 0.08 * L / 0.2, 0.05 * L), 0.76 * L, 0.34 * L, 0.95 * L)
    c.ell((0, 0.07 * L / 0.2, -0.55 * L), 0.55 * L, 0.24 * L, 0.5 * L)
    c.build(scutes(base, seam, rim, L), 1400)
    # plastron: a flatter cream shield underneath
    p = Blob(0.006)
    p.ell((0, 0.045 * L / 0.2, 0.0), 0.66 * L, 0.14 * L, 0.86 * L)
    p.build(belly, 500)

    top = skin_d if hatchling else pm('lh_scale', '#8a4a1e', '#a05a28', scale=30)

    def skin_paint(x, y, z):
        # brown scales on top edged with the yellow skin, plain yellow below
        if y < 0.058 * L / 0.2:
            return skin
        return skin if (abs(math.sin(x * 32 / L)) < 0.18 or abs(math.sin(z * 30 / L)) < 0.18) else top

    # the big loggerhead head on a short neck
    hz = 0.98 * L
    with anim_group('head', B(0, 0.08 * L / 0.2, 0.8 * L)):
        h = Blob(0.005)
        h.cap((0, 0.075 * L / 0.2, 0.75 * L), (0, 0.085 * L / 0.2, hz), 0.17 * L, 0.2 * L)
        h.ell((0, 0.09 * L / 0.2, hz + 0.12 * L), 0.25 * L, 0.2 * L, 0.28 * L)
        h.ell((0, 0.075 * L / 0.2, hz + 0.34 * L), 0.16 * L, 0.13 * L, 0.12 * L)
        h.build(lambda x, y, z: (skin if y < 0.075 * L / 0.2 else skin_paint(x, y, z)), 900)
        eye = pm('lh_eye', '#141010')
        for sx in (-1, 1):
            ball('eye', 0.035 * L, B(sx * 0.19 * L, 0.11 * L / 0.2, hz + 0.22 * L), eye, segs=10)
    # flippers: long curved front paddles, short rear ones, splayed out to the sides
    for i, (sx, z0, rear) in enumerate(((-1, 0.55, False), (1, 0.55, False), (-1, -0.6, True), (1, -0.6, True))):
        piv = (sx * 0.55 * L, 0.06 * L / 0.2, z0 * L)
        with anim_group(f'flip{i}', B(*piv)):
            f = Blob(0.004)
            if rear:
                f.ell((sx * 0.8 * L, 0.055 * L / 0.2, (z0 - 0.12) * L), 0.34 * L, 0.06 * L, 0.2 * L)
                f.ell((sx * 1.0 * L, 0.05 * L / 0.2, (z0 - 0.22) * L), 0.18 * L, 0.05 * L, 0.14 * L)
            else:
                f.ell((sx * 0.8 * L, 0.06 * L / 0.2, (z0 - 0.04) * L), 0.36 * L, 0.07 * L, 0.2 * L)
                f.ell((sx * 1.15 * L, 0.055 * L / 0.2, (z0 - 0.18) * L), 0.3 * L, 0.055 * L, 0.15 * L)
                f.ell((sx * 1.42 * L, 0.05 * L / 0.2, (z0 - 0.34) * L), 0.16 * L, 0.045 * L, 0.1 * L)
            f.build(skin_paint, 350)
    # a stubby tail
    t = Blob(0.004)
    t.cap((0, 0.06 * L / 0.2, -0.95 * L), (0, 0.05 * L / 0.2, -1.15 * L), 0.08 * L, 0.03 * L)
    t.build(skin, 80)
    finish(name, tex=512, vivid=1.1, ao_min=0.85 if hatchling else 0.62, ao_dist=0.08)


MODELS = {'sea_turtle': lambda: turtle('sea_turtle'), 'turtle_hatchling': lambda: turtle('turtle_hatchling', hatchling=True)}

if __name__ == '__main__':
    main(MODELS)
