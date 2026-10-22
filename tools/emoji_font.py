# The game's own emoji font for Android: Noto Color Emoji (SIL Open Font License 1.1) cut down to
# the emoji the game shows, into public/fonts/farm-emoji.woff2. An Android phone draws emoji with
# its system font, and one older than an emoji shows an empty box instead (the beans, the goose
# and the donkey need Android 14, the blueberries Android 11). The game loads this font on Android
# only (src/game/emojiFont.ts), so every phone shows the same pictures.
#
# Run: pip install fonttools brotli
#      python3 tools/emoji_font.py [path/to/NotoColorEmoji.ttf]
#      (default: /usr/share/fonts/truetype/noto/NotoColorEmoji.ttf, from fonts-noto-color-emoji)
# Run it again whenever an emoji is added to the game.
import glob
import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = sys.argv[1] if len(sys.argv) > 1 else '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
OUT = os.path.join(ROOT, 'public', 'fonts', 'farm-emoji.woff2')

# the code points below U+1F000 that are emoji by default (Emoji_Presentation in the Unicode
# emoji data); any other symbol there counts only when written with the emoji selector U+FE0F
BMP_EMOJI = set()
for a, b in [(0x231A, 0x231B), (0x23E9, 0x23EC), (0x23F0, 0x23F0), (0x23F3, 0x23F3), (0x25FD, 0x25FE), (0x2614, 0x2615),
             (0x2648, 0x2653), (0x267F, 0x267F), (0x2693, 0x2693), (0x26A1, 0x26A1), (0x26AA, 0x26AB), (0x26BD, 0x26BE),
             (0x26C4, 0x26C5), (0x26CE, 0x26CE), (0x26D4, 0x26D4), (0x26EA, 0x26EA), (0x26F2, 0x26F3), (0x26F5, 0x26F5),
             (0x26FA, 0x26FA), (0x26FD, 0x26FD), (0x2705, 0x2705), (0x270A, 0x270B), (0x2728, 0x2728), (0x274C, 0x274C),
             (0x274E, 0x274E), (0x2753, 0x2755), (0x2757, 0x2757), (0x2795, 0x2797), (0x27B0, 0x27B0), (0x27BF, 0x27BF),
             (0x2B1B, 0x2B1C), (0x2B50, 0x2B50), (0x2B55, 0x2B55)]:
    BMP_EMOJI.update(range(a, b + 1))
JOINERS = {0x200D, 0xFE0F, 0x20E3}


def wanted(text):
    out = set()
    for i, ch in enumerate(text):
        cp = ord(ch)
        nxt = ord(text[i + 1]) if i + 1 < len(text) else 0
        if cp >= 0x1F000 or cp in BMP_EMOJI or (nxt == 0xFE0F and cp > 0x7F) or (0xE0020 <= cp <= 0xE007F):
            out.add(cp)
        elif cp in JOINERS:
            out.add(cp)
    return out


def main():
    files = []
    for pat in ['src/**/*.ts', 'src/**/*.tsx', 'app/**/*.tsx', 'src/locales/*.json']:
        files += glob.glob(os.path.join(ROOT, pat), recursive=True)
    cps = set()
    for f in files:
        with open(f, encoding='utf-8') as fh:
            cps |= wanted(fh.read())
    font = TTFont(SRC)
    have = font.getBestCmap()
    keep = sorted(cp for cp in cps if cp in have or cp in JOINERS)
    missing = sorted(cp for cp in cps if cp not in have and cp not in JOINERS)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']          # keep the copyright and the license in the font
    opts.name_languages = ['*']
    opts.notdef_outline = False
    opts.glyph_names = False
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=keep)
    sub.subset(font)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    font.flavor = 'woff2'
    font.save(OUT)
    print(f'{len(keep)} code points from {len(files)} files -> {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) // 1024} KB)')
    if missing:
        print('not in the font:', ' '.join(f'U+{cp:04X}' for cp in missing))


if __name__ == '__main__':
    main()
