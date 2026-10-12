# The icon art (tools/blender/icon.py, on a clear background) laid on the sky: the store icon,
# the phone's launcher icons at every density (the adaptive icon's foreground layer and the round
# and square icons of older phones) and the splash screens.
# Run: python3 tools/store_art.py <icon art.png>
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, '..', 'android', 'app', 'src', 'main', 'res')
STORE = os.path.join(HERE, '..', 'store')
TOP, BOTTOM = (143, 208, 247), (63, 159, 216)  # the sky, light above and deeper below
DENSITY = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def sky(w, h):
    im = Image.new('RGBA', (w, h))
    px = im.load()
    for y in range(h):
        k = y / max(1, h - 1)
        c = tuple(round(TOP[i] + (BOTTOM[i] - TOP[i]) * k) for i in range(3))
        for x in range(w):
            px[x, y] = (*c, 255)
    # a soft glow behind the middle
    glow = Image.new('L', (w, h), 0)
    r = min(w, h) * 0.36
    ImageDraw.Draw(glow).ellipse((w / 2 - r, h * 0.47 - r, w / 2 + r, h * 0.47 + r), fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(min(w, h) * 0.12))
    im.paste(Image.new('RGBA', (w, h), (255, 255, 240, 255)), (0, 0), glow)
    return im


def art(src):
    a = src.split()[3].point(lambda v: 255 if v > 8 else 0)
    box = a.getbbox()
    cut = src.crop(box)
    # how far the art reaches from its middle, for fitting it in a circle
    m = cut.split()[3]
    w, h = cut.size
    cx, cy = w / 2, h / 2
    reach = 0
    px = m.load()
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if px[x, y] > 8:
                reach = max(reach, math.hypot(x - cx, y - cy))
    return cut, reach


def fit(canvas, cut, reach, radius, nudge=0.0):
    """The art on the canvas, scaled so it reaches `radius` from the middle at most."""
    k = radius / reach
    im = cut.resize((max(1, round(cut.width * k)), max(1, round(cut.height * k))), Image.LANCZOS)
    x = (canvas.width - im.width) // 2
    y = (canvas.height - im.height) // 2 + round(nudge * canvas.height)
    canvas.alpha_composite(im, (x, y))
    return canvas


def masked(im, shape):
    w, h = im.size
    big = Image.new('L', (w * 4, h * 4), 0)
    d = ImageDraw.Draw(big)
    if shape == 'round':
        d.ellipse((0, 0, w * 4 - 1, h * 4 - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), radius=w * 4 * 0.2, fill=255)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(im, (0, 0), big.resize((w, h), Image.LANCZOS))
    return out


def main(path):
    src = Image.open(path).convert('RGBA')
    cut, reach = art(src)
    os.makedirs(STORE, exist_ok=True)
    # the store icon: full square (the store rounds its corners itself)
    fit(sky(512, 512), cut, reach, 512 * 0.47).convert('RGB').save(os.path.join(STORE, 'icon-512.png'))
    for name, k in DENSITY.items():
        d = os.path.join(RES, f'mipmap-{name}')
        os.makedirs(d, exist_ok=True)
        # the adaptive icon's foreground: 108dp, the art inside the 66dp circle every mask keeps
        n = round(108 * k)
        fit(Image.new('RGBA', (n, n), (0, 0, 0, 0)), cut, reach, n * 34 / 108).save(os.path.join(d, 'ic_launcher_foreground.png'))
        # older phones: a square icon with round corners, and a round one
        n = round(48 * k)
        for shape, file in (('square', 'ic_launcher.png'), ('round', 'ic_launcher_round.png')):
            masked(fit(sky(n, n), cut, reach, n * 0.43), shape).save(os.path.join(d, file))
    # the splash screens: the island on the sky, a third of the screen's short side across
    for f in sorted(os.listdir(RES)):
        p = os.path.join(RES, f, 'splash.png')
        if not (f.startswith('drawable') and os.path.exists(p)):
            continue
        w, h = Image.open(p).size
        fit(sky(w, h), cut, reach, min(w, h) * 0.2).convert('RGB').save(p)
    print('store icon, launcher icons and splash screens written')


main(sys.argv[1])
