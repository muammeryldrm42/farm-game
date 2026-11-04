# The app's icon: the duck on the pond (store/icon-art.webp, a square picture), cut to every size
# the store, the website and the phone ask for: the store icon, the web icons, the phone's launcher
# icons at every density (the adaptive icon's layer and the square and round icons of older
# phones) and the splash screens of phones before Android 12. The duck's outline is traced for the
# one-colour icons: Android 13's themed launcher icon and the notification icon of the status bar.
# (The island of tools/blender/icon.py was the icon before.)
# Run: python3 tools/store_art.py   (needs Pillow, numpy, scipy and scikit-image)
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as nd
from skimage import measure

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
ART = os.path.join(ROOT, 'store', 'icon-art.webp')
TOP, BOTTOM = (143, 208, 247), (63, 159, 216)  # the sky of the splash, light above and deeper below
DENSITY = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
SRC = Image.open(ART).convert('RGB')


def square(n):
    return SRC.resize((n, n), Image.LANCZOS)


def padded(n, k):
    """The picture k of the way across an n square, the rest its edge colours drawn out and blurred:
    for icons the phone cuts to a shape (a circle, a rounded square...), so the duck stays whole in
    any, and the edges a moving icon may show for a moment are only sky, grass and water."""
    m = round(n * k)
    a = np.asarray(square(m))
    lo = (n - m) // 2
    hi = n - m - lo
    out = Image.fromarray(np.pad(a, ((lo, hi), (lo, hi), (0, 0)), mode='edge'))
    out = out.filter(ImageFilter.GaussianBlur(max(1, lo / 3)))
    out.paste(Image.fromarray(a), (lo, lo))
    return out


def masked(im, shape):
    w, h = im.size
    big = Image.new('L', (w * 4, h * 4), 0)
    d = ImageDraw.Draw(big)
    if shape == 'round':
        d.ellipse((0, 0, w * 4 - 1, h * 4 - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), radius=w * 4 * 0.2, fill=255)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(im.convert('RGBA'), (0, 0), big.resize((w, h), Image.LANCZOS))
    return out


def sky(w, h):
    k = np.linspace(0, 1, h)[:, None, None]
    a = np.array(TOP)[None, None] + (np.array(BOTTOM) - np.array(TOP))[None, None] * k
    im = Image.fromarray(np.repeat(a, w, axis=1).round().astype(np.uint8))
    # a soft glow behind the middle
    glow = Image.new('L', (w, h), 0)
    r = min(w, h) * 0.36
    ImageDraw.Draw(glow).ellipse((w / 2 - r, h * 0.47 - r, w / 2 + r, h * 0.47 + r), fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(min(w, h) * 0.12))
    im.paste(Image.new('RGB', (w, h), (255, 255, 240)), (0, 0), glow)
    return im


def duck_mask():
    """The duck alone: its cream feathers, their warm shading, the beak and the mouth, as the one
    big shape they make together (the sky, water, grass and reeds around it are cooler or greener)."""
    a = np.asarray(SRC).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    k = g / np.maximum(r, 1)
    cream = (r > 200) & (b > 115) & (r >= g - 4) & (b < g + 10)
    shade = (r > 175) & (k > 0.6) & (k < 0.93) & (b > 35) & (b < 150)
    beak = (r > 225) & (b < 70) & (k > 0.55) & (k < 0.88)
    mouth = (r > 150) & (k < 0.6) & (b > 20)
    m = nd.binary_opening(cream | shade | beak | mouth, iterations=1)
    m = largest(m)
    m = nd.binary_fill_holes(nd.binary_closing(m, iterations=8))
    m = largest(nd.binary_opening(m, iterations=3))
    # the reeds in front of it leave dents in the body's lower edge: the body below the neck is
    # closed with a round brush wider than they are
    lower = np.zeros_like(m)
    lower[m.shape[0] * 11 // 20:] = True
    brush = disk(m.shape[0] // 16)
    p = m.shape[0] // 8
    m |= nd.binary_closing(np.pad(m, p), structure=brush)[p:-p, p:-p] & lower
    # the near eye (its white and its dark middle), left open in the one-colour icons
    eye = m & (((r > 225) & (np.abs(r - b) < 34)) | (r < 170))
    lab, _ = nd.label(nd.binary_closing(eye, iterations=3))
    y, x = 256 * SRC.height // 1254, 696 * SRC.width // 1254
    if lab[y, x]:
        m &= ~nd.binary_fill_holes(lab == lab[y, x])
    # smoothed, so the traced outline has no stair steps
    soft = nd.gaussian_filter(m.astype(float), 3)
    return soft


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def largest(m):
    lab, n = nd.label(m)
    if not n:
        return m
    sizes = nd.sum(m, lab, range(1, n + 1))
    return lab == (np.argmax(sizes) + 1)


def outline(soft, view, box):
    """The duck's outline as vector path data, fitted in the middle `box` of a `view` square."""
    p = np.pad(soft, 2)
    ys, xs = np.nonzero(p > 0.5)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    k = box / max(x1 - x0, y1 - y0)
    ox = (view - (x1 - x0) * k) / 2 - x0 * k
    oy = (view - (y1 - y0) * k) / 2 - y0 * k
    parts = []
    for c in measure.find_contours(p, 0.5):
        c = measure.approximate_polygon(c, tolerance=1.2)
        if len(c) < 4:
            continue
        pts = [f'{x * k + ox:.2f},{y * k + oy:.2f}' for y, x in c]
        parts.append('M' + ' L'.join(pts) + ' Z')
    return ' '.join(parts)


def vector(path, size, view, note):
    return (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        f'<!-- {note} (made by tools/store_art.py) -->\n'
        '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
        f'    android:width="{size}dp"\n'
        f'    android:height="{size}dp"\n'
        f'    android:viewportWidth="{view}"\n'
        f'    android:viewportHeight="{view}">\n'
        '    <path\n'
        '        android:fillColor="#FFFFFFFF"\n'
        '        android:fillType="evenOdd"\n'
        f'        android:pathData="{path}" />\n'
        '</vector>\n'
    )


def save(im, *path):
    p = os.path.join(ROOT, *path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    im.save(p, optimize=True)


def main():
    # the store icon: full square (the store rounds its corners itself), a 32 bit PNG as it asks for
    save(square(512).convert('RGBA'), 'store', 'icon-512.png')
    # the website: the tab's icon with round corners, the home screen icons (the phone rounds
    # those) and the one the phone may cut to any shape
    save(masked(square(192), 'square'), 'app', 'icon.png')
    save(square(180), 'app', 'apple-icon.png')
    save(square(192).convert('RGBA'), 'public', 'app-icon-192.png')
    save(square(512).convert('RGBA'), 'public', 'app-icon-512.png')
    save(padded(512, 0.84).convert('RGBA'), 'public', 'app-icon-maskable-512.png')
    for name, k in DENSITY.items():
        # the adaptive icon's layer: 108dp, the picture over the middle 74dp, so the 72dp the phone
        # shows (in a circle or any other shape) holds the whole duck
        n = round(108 * k)
        save(padded(n, 74 / 108).convert('RGBA'), 'android', 'app', 'src', 'main', 'res', f'mipmap-{name}', 'ic_launcher_foreground.png')
        # older phones: a square icon with round corners, and a round one
        n = round(48 * k)
        for shape, file in (('square', 'ic_launcher.png'), ('round', 'ic_launcher_round.png')):
            save(masked(square(n), shape), 'android', 'app', 'src', 'main', 'res', f'mipmap-{name}', file)
    # the splash screens of phones before Android 12 (later ones show the launcher icon in a circle
    # on the sky themselves): the same, the round icon on the sky
    for f in sorted(os.listdir(RES)):
        p = os.path.join(RES, f, 'splash.png')
        if not (f.startswith('drawable') and os.path.exists(p)):
            continue
        w, h = Image.open(p).size
        bg = sky(w, h)
        d = round(min(w, h) * 0.4)
        bg.paste(masked(square(d), 'round'), ((w - d) // 2, (h - d) // 2), masked(square(d), 'round'))
        bg.save(p, optimize=True)
    soft = duck_mask()
    with open(os.path.join(RES, 'drawable', 'ic_launcher_monochrome.xml'), 'w') as f:
        f.write(vector(outline(soft, 108, 50), 108, 108, 'The launcher icon in one colour, for the themed icons of Android 13 and later (the phone tints it to match the wallpaper): the duck of the icon, in the middle 50dp'))
    with open(os.path.join(RES, 'drawable', 'ic_stat_farm.xml'), 'w') as f:
        f.write(vector(outline(soft, 24, 21), 24, 24, "The small white duck shown in the status bar with the farm's notifications: the icon's duck"))
    print('store icon, web icons, launcher icons, splash screens and one-colour icons written')


main()
