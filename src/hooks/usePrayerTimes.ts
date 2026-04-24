// src/hooks/usePrayerTimes.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { fetchPrayerTimes, getCurrentLocation } from '../services/prayerService';
import { loadSettings, scheduleAllNotifications, saveSettings } from '../services/notificationService';
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
  // Instant toggle — no API refetch, updates local state immediately
  togglePrayerNotif: (name: string) => Promise<void>;
  setNotifEnabledState: (val: boolean) => void;
  reloadNotifSettings: () => Promise<void>;
}

export function usePrayerTimes(): PrayerState {
  const [prayers, setPrayers]     = useState<Prayer[]>([]);
  const [dayData, setDayData]     = useState<PrayerDayData | null>(null);
  const [location, setLocation]   = useState<LocationInfo | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [countdown, setCountdown] = useState('--:--');
  const [progress, setProgress]   = useState(0);
  const [notifEnabled, setNotifEnabled]   = useState(false);
  const [prayerNotifs, setPrayerNotifs]   = useState<Record<string,boolean>>({});
  const ref        = useRef<Prayer[]>([]);
  const dayDataRef = useRef<PrayerDayData | null>(null);
  const prayerNotifsRef = useRef<Record<string,boolean>>({});

  // Keep ref in sync so toggle closure always sees latest value
  useEffect(() => { prayerNotifsRef.current = prayerNotifs; }, [prayerNotifs]);

  // ── Full refresh (initial load + pull-to-refresh) ──────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const loc  = await getCurrentLocation(); setLocation(loc);
      const data = await fetchPrayerTimes(loc.lat, loc.lng);
      if (data) {
        const built = buildPrayers(data.timings);
        setPrayers(built); ref.current = built;
        setDayData(data);  dayDataRef.current = data;
        const s = await loadSettings();
        setNotifEnabled(s.masterEnabled);
        setPrayerNotifs(s.prayers);
        prayerNotifsRef.current = s.prayers;
        if (s.masterEnabled) await scheduleAllNotifications(built);
        await updateWidgetData(built, data, loc);
      } else { setError('Could not load prayer times.'); }
    } catch { setError('Error loading. Pull to refresh.'); }
    finally  { setLoading(false); }
  }, []);

  // ── Reload only notification settings (no GPS / API call) ─────────────────
  const reloadNotifSettings = useCallback(async () => {
    const s = await loadSettings();
    setNotifEnabled(s.masterEnabled);
    setPrayerNotifs(s.prayers);
    prayerNotifsRef.current = s.prayers;
  }, []);

  // ── Instant per-prayer toggle — updates UI immediately, no refresh() ───────
  const togglePrayerNotif = useCallback(async (name: string) => {
    const current = prayerNotifsRef.current;
    const newVal  = !(current[name] ?? true);

    // 1. Update UI immediately (no delay)
    const updated = { ...current, [name]: newVal };
    setPrayerNotifs(updated);
    prayerNotifsRef.current = updated;

    // 2. Persist to AsyncStorage + reschedule in background
    const s = await loadSettings();
    s.prayers[name] = newVal;
    await saveSettings(s);
    if (s.masterEnabled) await scheduleAllNotifications(ref.current);
  }, []);

  // ── Expose setNotifEnabled so HomeScreen can update after banner enable ────
  const setNotifEnabledState = useCallback((val: boolean) => {
    setNotifEnabled(val);
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => { refresh(); }, [refresh]);

  // ── Re-read notif settings when app comes to foreground ───────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        await reloadNotifSettings();
        if (dayDataRef.current) {
          const rebuilt = buildPrayers(dayDataRef.current.timings);
          setPrayers(rebuilt); ref.current = rebuilt;
        }
      }
    });
    return () => sub.remove();
  }, [reloadNotifSettings]);

  // ── Live 1-second countdown ticker ─────────────────────────────────────────
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
    nextPrayer:    prayers.length ? getNextPrayer(prayers)    : null,
    currentPrayer: prayers.length ? getCurrentPrayer(prayers) : null,
    countdown, progress, loading, error,
    notifEnabled, prayerNotifs,
    refresh, togglePrayerNotif, setNotifEnabledState, reloadNotifSettings,
  };
}
