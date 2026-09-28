'use client';
import { iconUrl, isDrawn } from '@/game/icons';
import { MODEL_ICONS } from '@/game/modelIcons';

// Shows an item icon: an emoji, or one of the hand painted icons (names starting with '@').
// With `id`, a building that has a picture rendered from its Blender model shows that instead.
export default function Ico({ i, id }: { i: string; id?: string }) {
  if (id && MODEL_ICONS.has(id)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/icons/${id}.webp`} alt="" draggable={false} className="inline-block h-[1.45em] w-[1.45em] object-contain align-[-0.35em]" />;
  }
  if (!isDrawn(i)) return <>{i}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={iconUrl(i)} alt="" draggable={false} className="inline-block h-[1.15em] w-[1.15em] align-[-0.2em]" />;
}
