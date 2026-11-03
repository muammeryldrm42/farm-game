// public/webview.html: the page shown where the game cannot run because the browser engine is too
// old (Chrome or Android System WebView before 94: the game's code does not even load there, and
// the start up screen would stay up for good). In the Android app, Capacitor shows it in place of
// the game when the phone's WebView is older (capacitor.config.json: minWebViewVersion, errorPath);
// the game's page sends there any engine that cannot run it (app/layout.tsx). It says what to
// update, in the player's language (as the game picks it: the one chosen, else the device's), with
// Google Play buttons in the app. Its script is old style JavaScript, so those engines run it; the
// texts come from src/locales (written here as \u escapes).
//
// Run: node tools/old_engine_page.mjs   (npm run build runs it first)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = "This phone's Android System WebView is too old for Talons Farm. Update it (and Chrome) from Google Play, then open the game again.";
const WEB = 'This browser is too old for Talons Farm. Update it, then open the game again.';

const texts = { en: [APP, WEB] };
const dir = path.join(ROOT, 'src', 'locales');
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith('.json') || f === 'names.json') continue;
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (!d[APP] || !d[WEB]) throw new Error(`${f}: the old engine texts are missing`);
  texts[f.slice(0, -5)] = [d[APP], d[WEB]];
}
// every character past ASCII as \u: the page stays plain ASCII
const json = JSON.stringify(texts).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Talons Farm</title>
<style>
html,body{margin:0;height:100%;background:#3f9fd8;color:#fff;font:600 17px/1.45 system-ui,-apple-system,Roboto,sans-serif}
.w{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100%;padding:24px;box-sizing:border-box;text-align:center}
img{max-width:70vw;max-height:35vh;margin-bottom:18px}
p{max-width:520px;margin:0 0 18px;text-shadow:0 2px 0 #1d5f8a}
a{display:inline-block;margin:6px;padding:12px 20px;border-radius:14px;background:#5cb82e;color:#fff;text-decoration:none;box-shadow:0 4px 0 #3d8a1c}
</style>
</head>
<body>
<div class="w"><img src="logo.webp" alt="Talons Farm"><p id="m"></p><div id="b"></div></div>
<script>
(function () {
  var T = ${json};
  var l = null;
  try { l = localStorage.getItem('talons-farm-lang'); } catch (e) {}
  if (!T[l]) {
    var n = (navigator.language || 'en').toLowerCase().replace(/_/g, '-');
    l = n.indexOf('zh') === 0 ? (/hant|tw|hk|mo/.test(n) ? 'zht' : 'zh') : n.split('-')[0].replace(/^in$/, 'id');
    if (!T[l]) l = 'en';
  }
  var C = window.Capacitor;
  var app = !!(C && C.getPlatform && C.getPlatform() === 'android') || /; wv\\)/.test(navigator.userAgent);
  var h = document.documentElement;
  h.lang = l === 'zht' ? 'zh-Hant' : l === 'zh' ? 'zh-Hans' : l;
  if (l === 'ar' || l === 'ur') h.dir = 'rtl';
  document.getElementById('m').textContent = T[l][app ? 0 : 1];
  function add(name, id) {
    var a = document.createElement('a');
    a.href = 'https://play.google.com/store/apps/details?id=' + id;
    a.textContent = name;
    document.getElementById('b').appendChild(a);
  }
  if (app) { add('Android System WebView', 'com.google.android.webview'); add('Google Chrome', 'com.android.chrome'); }
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'public', 'webview.html'), html);
console.log(`public/webview.html: ${Object.keys(texts).length} languages`);
