// src/models/prayerUtils.ts
import { Prayer, PrayerTimings, HijriDate } from './types';

export const PRAYER_META: Record<string, { arabic: string; icon: string; notifiable: boolean }> = {
  Fajr:    { arabic: 'الفجر',  icon: '🌙', notifiable: true  },
  Sunrise: { arabic: 'الشروق', icon: '🌅', notifiable: false },
  Dhuhr:   { arabic: 'الظهر',  icon: '☀️', notifiable: true  },
  Asr:     { arabic: 'العصر',  icon: '🌤', notifiable: true  },
  Maghrib: { arabic: 'المغرب', icon: '🌇', notifiable: true  },
  Isha:    { arabic: 'العشاء', icon: '🌃', notifiable: true  },
};
const ORDER = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];

export function cleanTime(t: string) { return t.split(' ')[0]; }
export function to12h(t: string): string {
  // 24-hour format — pad hours and minutes
  const [hS, mS] = t.split(':');
  return `${hS.padStart(2,'0')}:${mS.padStart(2,'0')}`;
}
export function toMinutes(t: string) { const [h,m] = t.split(':').map(Number); return h*60+m; }
export function nowMinutes() { const n = new Date(); return n.getHours()*60+n.getMinutes(); }

export function buildPrayers(timings: PrayerTimings): Prayer[] {
  const nowMins = nowMinutes();

  // Build raw list first (hasPassed temporarily false)
  const raw = ORDER.map(name => {
    const t    = cleanTime(timings[name as keyof PrayerTimings]);
    const mins = toMinutes(t);
    const meta = PRAYER_META[name];
    return { name, arabicName: meta.arabic, time: t, time12h: to12h(t),
      icon: meta.icon, isNotifiable: meta.notifiable,
      hasPassed: false, minutesSinceMidnight: mins };
  });

  // Determine next notifiable prayer
  const notifiable = raw.filter(p => p.isNotifiable);
  const nextPrayer = notifiable.find(p => p.minutesSinceMidnight > nowMins) ?? notifiable[0];

  // ── Key fix ────────────────────────────────────────────────────────────────
  // After Isha (late night), getNextPrayer wraps to Fajr.
  // In this window ALL prayers have minutesSinceMidnight < nowMins,
  // so without this fix everything shows as passed — including tomorrow's Fajr.
  // Islamic prayer day starts at Fajr, so in the post-Isha window
  // we treat the next cycle as fresh: nothing has passed yet.
  const wrappedToFajr =
    nextPrayer.name === 'Fajr' &&
    notifiable.every(p => p.minutesSinceMidnight <= nowMins);

  return raw.map(p => ({
    ...p,
    hasPassed: wrappedToFajr ? false : p.minutesSinceMidnight < nowMins,
  }));
}

export function getNextPrayer(prayers: Prayer[]): Prayer | null {
  const nowMins = nowMinutes();
  const notif = prayers.filter(p => p.isNotifiable);
  return notif.find(p => p.minutesSinceMidnight > nowMins) ?? notif[0];
}
export function getCurrentPrayer(prayers: Prayer[]): Prayer | null {
  const nowMins = nowMinutes(); let cur: Prayer | null = null;
  for (const p of prayers.filter(p => p.isNotifiable))
    if (p.minutesSinceMidnight <= nowMins) cur = p;
  return cur;
}
export function getCountdown(next: Prayer): string {
  const now = new Date();
  const nowSecs = now.getHours()*3600+now.getMinutes()*60+now.getSeconds();
  let targetSecs = next.minutesSinceMidnight*60;
  if (targetSecs <= nowSecs) targetSecs += 24*3600;
  const diff = targetSecs - nowSecs;
  const h = Math.floor(diff/3600); const m = Math.floor((diff%3600)/60); const s = diff%60;
  if (h > 0) return `${h}h ${m.toString().padStart(2,'0')}m`;
  return `${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
}
export function getProgress(prayers: Prayer[], next: Prayer): number {
  const nowMins = nowMinutes();
  const notif = prayers.filter(p => p.isNotifiable);
  const nextIdx = notif.findIndex(p => p.name === next.name);
  const prev = notif[(nextIdx-1+notif.length)%notif.length];
  if (!prev) return 0;
  let span = next.minutesSinceMidnight - prev.minutesSinceMidnight;
  if (span <= 0) span += 24*60;
  let elapsed = nowMins - prev.minutesSinceMidnight;
  if (elapsed < 0) elapsed += 24*60;
  return Math.min(Math.max(elapsed/span,0),1);
}
export function getFastingDuration(timings: PrayerTimings): string {
  const fajr = toMinutes(cleanTime(timings.Fajr));
  const magh = toMinutes(cleanTime(timings.Maghrib));
  const diff = magh - fajr;
  return `${Math.floor(diff/60)}h ${diff%60}m`;
}
export function isRamadan(hijri: HijriDate) { return hijri.month.number === 9; }
export function calcQibla(lat: number, lng: number): number {
  const mLat=(21.4225*Math.PI)/180, mLng=(39.8262*Math.PI)/180;
  const uLat=(lat*Math.PI)/180,     uLng=(lng*Math.PI)/180;
  const y=Math.sin(mLng-uLng)*Math.cos(mLat);
  const x=Math.cos(uLat)*Math.sin(mLat)-Math.sin(uLat)*Math.cos(mLat)*Math.cos(mLng-uLng);
  return ((Math.atan2(y,x)*180/Math.PI)+360)%360;
}
export function distanceToMecca(lat: number, lng: number): number {
  const R=6371, dLat=((21.4225-lat)*Math.PI)/180, dLng=((39.8262-lng)*Math.PI)/180;
  const a=Math.sin(dLat/2)**2+Math.cos((lat*Math.PI)/180)*Math.cos((21.4225*Math.PI)/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
export function compassDir(deg: number) {
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg/45)%8];
}
