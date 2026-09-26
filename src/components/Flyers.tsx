'use client';
import { useEffect, useRef } from 'react';
import { useStore, useVersion } from './ctx';
import { iconUrl, isDrawn } from '@/game/icons';

// Icons that fly from the farm to the storage button, coin counter or XP bar.
// Pure DOM with the Web Animations API, so it never re-renders React.
export default function Flyers() {
  const store = useStore();
  const v = useVersion();
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = layer.current;
    if (!el || !store.flyers.length) return;
    const list = store.flyers.splice(0);
    list.forEach((f, i) => {
      const from = store.toScreen(f.gx, f.gy, f.z);
      if (!from) return;
      const target = document.querySelector(`[data-fly="${f.target}"]`) as HTMLElement | null;
      let tx: number, ty: number;
      if (target) {
        const r = target.getBoundingClientRect();
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
      } else if (f.target === 'storage') {
        tx = window.innerWidth - 60;
        ty = window.innerHeight - 40;
      } else {
        tx = window.innerWidth - 120;
        ty = 28;
      }
      const span = document.createElement('span');
      if (isDrawn(f.icon)) {
        const img = document.createElement('img');
        img.src = iconUrl(f.icon);
        img.className = 'h-[1em] w-[1em]';
        span.appendChild(img);
      } else span.textContent = f.icon;
      span.className = 'emoji pointer-events-none fixed left-0 top-0 z-40 text-3xl';
      span.style.filter = 'drop-shadow(0 2px 0 rgba(0,0,0,0.3))';
      el.appendChild(span);
      const mx = (from.x + tx) / 2 + (Math.random() - 0.5) * 80;
      const my = Math.min(from.y, ty) - 80 - Math.random() * 40;
      const anim = span.animate(
        [
          { transform: `translate(${from.x - 15}px, ${from.y - 15}px) scale(0.6)`, opacity: 0 },
          { transform: `translate(${from.x - 15}px, ${from.y - 35}px) scale(1.15)`, opacity: 1, offset: 0.18 },
          { transform: `translate(${mx - 15}px, ${my - 15}px) scale(1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${tx - 15}px, ${ty - 15}px) scale(0.55)`, opacity: 0.9 },
        ],
        { duration: 850 + Math.random() * 150, delay: Math.min(i, 8) * 70, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'both' },
      );
      anim.onfinish = () => {
        span.remove();
        target?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 220 });
      };
    });
  }, [v, store]);

  return <div ref={layer} className="pointer-events-none fixed inset-0 z-40" />;
}
