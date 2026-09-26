'use client';
import { iconUrl, isDrawn } from '@/game/icons';

// Shows an item icon: an emoji, or one of the hand painted icons (names starting with '@').
export default function Ico({ i }: { i: string }) {
  if (!isDrawn(i)) return <>{i}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={iconUrl(i)} alt="" draggable={false} className="inline-block h-[1.15em] w-[1.15em] align-[-0.2em]" />;
}
