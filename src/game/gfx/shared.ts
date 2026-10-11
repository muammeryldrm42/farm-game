// Uniforms shared by every animated shader (water, wind). The renderer advances them once a frame.
export const U = {
  time: { value: 0 },
  wind: { value: 1 },
  // the meadow thins out far from the camera (low quality: see thinOut in foliage.ts)
  thin: { value: 0 },
};
