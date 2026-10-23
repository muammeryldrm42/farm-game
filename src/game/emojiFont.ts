// The game's own emoji (made by tools/emoji_font.py: Noto Color Emoji cut down to the emoji the
// game shows). A device draws emoji with its system font, and one older than an emoji shows an
// empty box in its place: the beans, the goose and the donkey need Android 14, and the newest of
// the game's emoji (the blueberries, the wood, the stone...) are missing on Windows 10, on older
// iPhones and Macs, and on computers with no emoji font at all.
// - On Android the game always brings its own, so every phone shows the same pictures.
// - Elsewhere the system's emoji are used while they draw the newest emoji the game shows; when
//   they do not, the game's own are loaded, and kept only where the browser draws them in color
//   (Safari cannot draw this kind of font, but its systems that lack the emoji are few).
// The family name leads the emoji font lists of the page (globals.css, under the `farm-emoji`
// class) and of the farm's canvas text (render3d.ts), where it is skipped when not loaded.
export const EMOJI_FAMILY = 'Farm Emoji';

// one of the newest emoji the game shows (Emoji 15, the pea pod: a green one, as a gray one would
// pass for an empty box): a system that draws it draws them all
const PROBE = '\u{1FADB}';
const SYSTEM = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

// does the browser draw the probe in color with these fonts? (an emoji missing from them comes
// out as an empty box in one color, or not at all)
function inColor(fonts: string) {
  try {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 40;
    const c = cv.getContext('2d', { willReadFrequently: true });
    if (!c) return true;
    c.font = `32px ${fonts}`;
    c.textBaseline = 'top';
    c.fillStyle = '#000';
    c.fillText(PROBE, 2, 2);
    const d = c.getImageData(0, 0, 40, 40).data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 128 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 40) return true;
    }
    return false;
  } catch {
    // the page may not read its canvas (a privacy setting): the system's emoji, as before
    return true;
  }
}

let ready: Promise<boolean> | null = null;

// starts loading the font (once, where wanted): true when it is ready to draw with
export function loadEmojiFont(): Promise<boolean> {
  if (ready) return ready;
  const android = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  if (typeof document === 'undefined' || typeof FontFace === 'undefined' || !document.fonts || (!android && inColor(SYSTEM))) {
    ready = Promise.resolve(false);
    return ready;
  }
  const face = new FontFace(EMOJI_FAMILY, 'url(fonts/farm-emoji.woff2)', { display: 'block' });
  document.fonts.add(face);
  // (on Android at once, as it always was: the emoji wait for it a moment; elsewhere once it is
  // known to draw, the system's emoji meanwhile)
  if (android) document.documentElement.classList.add('farm-emoji');
  const drop = () => {
    // not found, not readable or not drawn: the device's own emoji, as before
    document.fonts.delete(face);
    document.documentElement.classList.remove('farm-emoji');
    return false;
  };
  ready = face.load().then(
    () => {
      if (android) return true;
      if (!inColor(`"${EMOJI_FAMILY}"`)) return drop();
      document.documentElement.classList.add('farm-emoji');
      return true;
    },
    drop,
  );
  return ready;
}
