// three.js's Draco loader names its own copies of the decoder with `new URL(..., import.meta.url)`,
// which webpack would copy into _next/static/media (1.3 MB never used: the game fetches the
// decoder from public/draco, see render3d.ts). A plain base address in place of import.meta.url
// leaves those names as unused strings, and nothing is copied (see next.config.mjs).
module.exports = function dracoUrl(src) {
  return src.replace(/import\.meta\.url/g, '"https://localhost/"');
};
