// src/hooks/usePrayerTimes.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { fetchPrayerTimes, getCurrentLocation } from '../services/prayerService';
import { loadSettings, scheduleAllNotifications } from '../services/notificationServiceOld';
import { updateWidgetData } from '../services/widgetService';
import { buildPrayers, getNextPrayer, getCurrentPrayer, getCountdown, getProgress } from '../models/prayerUtils';
import { Prayer, PrayerDayData, LocationInfo } from '../models/types';

export interface PrayerState {
  prayers: Prayer[]; dayData: PrayerDayData | null; location: LocationInfo | null;
  nextPrayer: Prayer | null; currentPrayer: Prayer | null;
  countdown: string; progress: number;
  loading: boolean; error: string | null;
  notifEnabled: boolean; prayerNotifs: Record<string, boolean>;
  refresh: () => Promise<void>;
}

export function usePrayerTimes(): PrayerState {
  const [prayers, setPrayers]   = useState<Prayer[]>([]);
  const [dayData, setDayData]   = useState<PrayerDayData | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [countdown, setCountdown] = useState('--:--');
  const [progress, setProgress]   = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [prayerNotifs, setPrayerNotifs] = useState<Record<string,boolean>>({});
  const ref = useRef<Prayer[]>([]);
  const dayDataRef = useRef<PrayerDayData | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const loc = await getCurrentLocation(); setLocation(loc);
      const data = await fetchPrayerTimes(loc.lat, loc.lng);
      if (data) {
        const built = buildPrayers(data.timings);
        setPrayers(built); ref.current = built; setDayData(data);
        const s = await loadSettings();
        setNotifEnabled(s.masterEnabled); setPrayerNotifs(s.prayers);
        if (s.masterEnabled) await scheduleAllNotifications(built);
        await updateWidgetData(built, data, loc);
      } else { setError('Could not load prayer times.'); }
    } catch { setError('Error loading. Pull to refresh.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        const s = await loadSettings(); setNotifEnabled(s.masterEnabled); setPrayerNotifs(s.prayers);
        if (ref.current.length > 0) {
          const now = new Date(); const nowMins = now.getHours()*60+now.getMinutes();
          // Re-use buildPrayers so the post-Isha wrap fix applies here too
          if (dayDataRef.current) {
            const rebuilt = buildPrayers(dayDataRef.current.timings);
            setPrayers(rebuilt); ref.current = rebuilt;
          }
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const tick = () => {
      const ps = ref.current; if (!ps.length) return;
      const next = getNextPrayer(ps);
      if (next) { setCountdown(getCountdown(next)); setProgress(getProgress(ps, next)); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return {
    prayers, dayData, location,
    nextPrayer: prayers.length ? getNextPrayer(prayers) : null,
    currentPrayer: prayers.length ? getCurrentPrayer(prayers) : null,
    countdown, progress, loading, error, notifEnabled, prayerNotifs, refresh,
  };
}
