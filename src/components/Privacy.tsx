'use client';
// The privacy policy: shown in the game (Settings) and as its own page (/privacy) for the store
// listing. Written in English here, in the player's language from the locale files.
import { getLang, t } from '@/game/i18n';

// who to write to about it
export const PRIVACY_CONTACT = 'CONTACT_EMAIL';
// the day this version took effect
const UPDATED = new Date(2026, 9, 11);

const SECTIONS: { title: string; lines: string[] }[] = [
  {
    title: 'In short',
    lines: [
      'Talons Farm does not collect, store or share any personal information. There are no accounts, no ads, no in-app purchases and no analytics or tracking.',
    ],
  },
  {
    title: 'What stays on your device',
    lines: [
      'Your farm (your progress, buildings, animals and items) and your settings (such as language, sound, graphics and notifications) are saved only on your device, in the game\'s own storage. We never receive them.',
      'Uninstalling the game or clearing its data deletes them. You can also delete your farm at any time with Settings, Start over.',
      'If you export a save code to move your farm to another device, the code holds only your game progress and goes only where you paste it. We do not receive it.',
      'If backup is turned on on your phone, Android may include the game\'s data in your own Google backup, so your farm can come back on a new phone. This is handled by Google under its privacy policy; we do not receive it.',
    ],
  },
  {
    title: 'The internet time check',
    lines: [
      'The game also works offline. When your device is online, the game checks the current time now and then, so that farm timers cannot be skipped by changing the device\'s clock.',
      'For this the Android app makes a plain request to www.google.com/generate_204 and to cloudflare.com/cdn-cgi/trace, and the web version asks the game\'s own website. Only the time is read from the answer. No game data and no personal information is sent.',
      'As with any connection on the internet, these services see your device\'s IP address. Google and Cloudflare handle it under their own privacy policies.',
      'To keep farm time right after the phone restarts, the Android app also reads how long the phone has been on since it last started and how many times it has started. These numbers stay on your device.',
    ],
  },
  {
    title: 'Notifications',
    lines: [
      'If you allow notifications, the game reminds you when things on your farm are ready: crops, animals, goods and the daily gift. The game schedules these reminders on your phone itself; no server is involved.',
      'You can turn them off at any time in the game\'s settings or in your phone\'s settings.',
    ],
  },
  {
    title: 'Permissions the Android app asks for',
    lines: [
      'Internet: for the time check above.',
      'Notifications, starting with the phone and keeping it awake briefly: to show the reminders above, also after the phone restarts.',
      'Vibration: a short buzz when you pick something up to move it.',
    ],
  },
  {
    title: 'Children',
    lines: [
      'Talons Farm is made for players of all ages. As it collects no personal information from anyone, it collects none from children either.',
    ],
  },
  {
    title: 'Other services',
    lines: [
      'The game contains no advertising, analytics or social media components. Downloading and updating the game through Google Play is covered by Google\'s privacy policy.',
    ],
  },
  {
    title: 'Changes to this policy',
    lines: [
      'If this policy changes, the new version is published on this page with a new date.',
    ],
  },
];

export function PrivacyText() {
  let updated: string;
  try { updated = new Intl.DateTimeFormat(getLang() === 'zht' ? 'zh-TW' : getLang(), { dateStyle: 'long' }).format(UPDATED); } catch { updated = UPDATED.toDateString(); }
  return (
    <div className="rtl-text select-text text-sm leading-relaxed text-[#5a3a1a]" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
      <p className="text-xs text-[#8a6a44]">{t('Talons Farm by Talons Protocol')} · {t('Last updated: {date}', { date: updated })}</p>
      {SECTIONS.map((s) => (
        <section key={s.title} className="mt-4">
          <h3 className="mb-1 font-bold">{t(s.title)}</h3>
          {s.lines.map((l) => <p key={l} className="mb-1.5">{t(l)}</p>)}
        </section>
      ))}
      <section className="mt-4">
        <h3 className="mb-1 font-bold">{t('Contact')}</h3>
        <p>{t('Questions about this policy: {email}', { email: PRIVACY_CONTACT })}</p>
      </section>
    </div>
  );
}
