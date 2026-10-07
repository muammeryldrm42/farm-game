// Paints surface textures off the main thread: a kind comes in, its pixels go back.
import { paintSurface, type SurfaceKind } from './texpaint';

self.onmessage = (e: MessageEvent<SurfaceKind>) => {
  const kind = e.data;
  const px = paintSurface(kind);
  (self as unknown as Worker).postMessage({ kind, ...px }, [px.albedo.buffer, px.normal.buffer]);
};
