# The models' phone copies: each model in public/models whose textures are bigger than the game
# keeps in low quality (512 px, LOW_TEX in src/game/render3d.ts) gets a copy in public/models/s
# with its textures already at that size, the shapes untouched (the same Blender model). The
# website loads these in low quality (every player's start): a fraction of the download (the
# barn's 1 MB is 0.3 MB), and no full size picture to decode and shrink on the phone. High
# quality and the Android app load the originals. The farmhouse and the manor, which keep their
# full textures in every quality, have no copy.
#
# Run: python3 tools/phone_models.py   (again whenever a model is added or changed; it remakes
#      only the copies older than their model, and removes copies whose model is gone)
import io
import json
import os
import struct
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'public', 'models')
OUT = os.path.join(SRC, 's')
MAX = 512
KEEP = {'farmhouse', 'manor'}


def read_glb(path):
    b = open(path, 'rb').read()
    magic, _ver, _total = struct.unpack_from('<III', b, 0)
    assert magic == 0x46546C67, path
    jlen, jtype = struct.unpack_from('<II', b, 12)
    assert jtype == 0x4E4F534A
    j = json.loads(b[20:20 + jlen])
    off = 20 + jlen
    bin_ = b''
    if off < len(b):
        blen, btype = struct.unpack_from('<II', b, off)
        assert btype == 0x004E4942
        bin_ = b[off + 8:off + 8 + blen]
    return j, bin_


def write_glb(path, j, bin_):
    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    bin_ += b'\0' * (-len(bin_) % 4)
    total = 12 + 8 + len(js) + (8 + len(bin_) if bin_ else 0)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js)
        if bin_:
            f.write(struct.pack('<II', len(bin_), 0x004E4942) + bin_)


def shrink(data, mime):
    im = Image.open(io.BytesIO(data))
    if max(im.size) <= MAX:
        return None
    k = MAX / max(im.size)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    out = io.BytesIO()
    if mime == 'image/png':
        im.save(out, 'PNG', optimize=True)
    else:
        im.convert('RGB').save(out, 'JPEG', quality=85, optimize=True)
    return out.getvalue()


def copy(name):
    j, bin_ = read_glb(os.path.join(SRC, name + '.glb'))
    views = j.get('bufferViews', [])
    new = {}
    for im in j.get('images', []):
        v = im.get('bufferView')
        if v is None or v in new:
            continue
        bv = views[v]
        o = bv.get('byteOffset', 0)
        s = shrink(bin_[o:o + bv['byteLength']], im.get('mimeType', 'image/jpeg'))
        if s is not None:
            new[v] = s
    if not new:
        return False
    # the binary chunk again, every view in its old order, the pictures swapped for their copies
    out = bytearray()
    for i in sorted(range(len(views)), key=lambda i: views[i].get('byteOffset', 0)):
        bv = views[i]
        o = bv.get('byteOffset', 0)
        data = new.get(i, bin_[o:o + bv['byteLength']])
        out += b'\0' * (-len(out) % 4)
        bv['byteOffset'] = len(out)
        bv['byteLength'] = len(data)
        out += data
    j['buffers'][0]['byteLength'] = len(out)
    write_glb(os.path.join(OUT, name + '.glb'), j, bytes(out))
    return True


def main():
    os.makedirs(OUT, exist_ok=True)
    names = sorted(f[:-4] for f in os.listdir(SRC) if f.endswith('.glb') and f[:-4] not in KEEP)
    made = kept = none = 0
    for n in names:
        src, dst = os.path.join(SRC, n + '.glb'), os.path.join(OUT, n + '.glb')
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            kept += 1
            continue
        if copy(n):
            made += 1
        else:
            none += 1
            if os.path.exists(dst):
                os.remove(dst)
    gone = 0
    for f in os.listdir(OUT):
        if f.endswith('.glb') and (f[:-4] not in names or not os.path.exists(os.path.join(SRC, f))):
            os.remove(os.path.join(OUT, f))
            gone += 1
    size = lambda d, fs: sum(os.path.getsize(os.path.join(d, f + '.glb')) for f in fs)
    have = [f[:-4] for f in os.listdir(OUT) if f.endswith('.glb')]
    print(f'{made} made, {kept} up to date, {none} need none, {gone} removed; {len(have)} copies '
          f'{size(OUT, have) / 1048576:.1f} MB for {size(SRC, have) / 1048576:.1f} MB of models')


if __name__ == '__main__':
    sys.exit(main())
