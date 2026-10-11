'use client';
// The privacy policy as a page of its own (for the store listing): in the language of the
// address (?lang=tr), else the one chosen in the game, else the device's.
import { useEffect, useState } from 'react';
import { LANG_IDS, initLang, setLang, t, type Lang } from '@/game/i18n';
import { PrivacyText } from '@/components/Privacy';

export default function PrivacyPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const want = new URLSearchParams(location.search).get('lang');
    const go = want && (LANG_IDS as string[]).includes(want) ? setLang(want as Lang) : initLang();
    go.catch(() => undefined).finally(() => setReady(true));
  }, []);
  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#fff6df]" style={{ touchAction: 'pan-y' }}>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold text-[#5d3a1f]">{ready ? `🚜 Talons Farm · ${t('Privacy policy')}` : 'Talons Farm'}</h1>
        {ready && <PrivacyText />}
      </div>
    </main>
  );
}
