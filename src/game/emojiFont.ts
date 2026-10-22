// The game's own emoji on Android (made by tools/emoji_font.py: Noto Color Emoji cut down to the
// emoji the game shows). A phone draws emoji with its system font, and one older than an emoji
// shows an empty box in its place (the beans, the goose and the donkey need Android 14), so on
// Android the game brings its own and every phone shows the same pictures. Elsewhere the system's
// emoji are used as before. The family name leads the emoji font lists of the page (globals.css,
// under the `farm-emoji` class) and of the farm's canvas text (render3d.ts), where it is skipped
// when not loaded.
export const EMOJI_FAMILY = 'Farm Emoji';

let ready: Promise<boolean> | null = null;

// starts loading the font (once): true when it is ready to draw with
export function loadEmojiFont(): Promise<boolean> {
  if (ready) return ready;
  if (typeof document === 'undefined' || typeof FontFace === 'undefined' || !document.fonts || !/Android/i.test(navigator.userAgent)) {
    ready = Promise.resolve(false);
    return ready;
  }
  const face = new FontFace(EMOJI_FAMILY, 'url(fonts/farm-emoji.woff2)', { display: 'block' });
  document.fonts.add(face);
  document.documentElement.classList.add('farm-emoji');
  ready = face.load().then(
    () => true,
    () => {
      // not found or not readable: the phone's own emoji, as before
      document.fonts.delete(face);
      document.documentElement.classList.remove('farm-emoji');
      return false;
    },
  );
  return ready;
}
