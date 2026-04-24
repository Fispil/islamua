// src/services/widgetService.ts
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Prayer, PrayerDayData, LocationInfo, PrayerTimings } from '../models/types';
import { getNextPrayer, getCountdown, getProgress, buildPrayers } from '../models/prayerUtils';

const NEXT_KEY = 'prayer_widget_data';
const ALL_KEY  = 'all_prayers_data';
const IOS_APP_GROUP = 'group.com.maksymstorozhuk.islamua';

// Cache keys for fallback hydration when app starts cold
const CACHE_TIMINGS_KEY  = 'last_timings';
const CACHE_LOCATION_KEY = 'last_location';
const CACHE_HIJRI_KEY    = 'last_hijri';

interface CachedHijri {
  day: string;
  month_ar: string;
}

// ── Build JSON payloads for both widget types ────────────────────────────
function buildWidgetPayloads(
  prayers: Prayer[],
  hijri: CachedHijri,
  city: string
): { nextPayload: string; allPayload: string } | null {
  const next = getNextPrayer(prayers);
  if (!next) return null;

  const notifiable = prayers.filter(p => p.isNotifiable);
  const current = notifiable.find(p => p.hasPassed) ?? notifiable[notifiable.length - 1];

  // Next prayer widget payload
  const nextData = {
    prayerName:        next.name,
    arabicName:        next.arabicName,
    time12h:           next.time12h,
    countdown:         getCountdown(next),
    progressPercent:   Math.round(getProgress(prayers, next) * 100),
    currentPrayerName: current?.name    ?? '',
    currentPrayerTime: current?.time12h ?? '',
    city,
    hijriDay:          hijri.day,
    hijriMonth:        hijri.month_ar,
  };

  // Calendar widget payload — all 5 prayers with states
  const notifiablePrayers = prayers.filter(p => p.isNotifiable);
  const allData = {
    city,
    hijriDay:       hijri.day,
    hijriMonth:     hijri.month_ar,
    nextPrayerName: next.name,
    prayers: notifiablePrayers.map(p => ({
      name:      p.name,
      arabic:    p.arabicName,
      time:      p.time12h,
      isNext:    p.name === next.name,
      hasPassed: p.hasPassed,
    })),
  };

  return {
    nextPayload: JSON.stringify(nextData),
    allPayload:  JSON.stringify(allData),
  };
}

// ── Main update — called by usePrayerTimes after API fetch ──────────────
export async function updateWidgetData(
  prayers: Prayer[],
  dayData: PrayerDayData,
  location: LocationInfo | null
): Promise<void> {
  const hijri: CachedHijri = {
    day:      dayData.date.hijri.day,
    month_ar: dayData.date.hijri.month.ar,
  };
  const city = location?.city ?? '';

  const payloads = buildWidgetPayloads(prayers, hijri, city);
  if (!payloads) return;

  // Cache raw data for cold-start hydration
  await AsyncStorage.setItem(CACHE_TIMINGS_KEY, JSON.stringify(dayData.timings));
  if (location) await AsyncStorage.setItem(CACHE_LOCATION_KEY, JSON.stringify(location));
  await AsyncStorage.setItem(CACHE_HIJRI_KEY, JSON.stringify(hijri));

  await writeBothToNative(payloads.nextPayload, payloads.allPayload);
}

// ── Fast cold-start write — called from root layout on app boot ─────────
export async function hydrateWidgetFromCache(): Promise<void> {
  try {
    const [timingsRaw, locRaw, hijriRaw] = await Promise.all([
      AsyncStorage.getItem(CACHE_TIMINGS_KEY),
      AsyncStorage.getItem(CACHE_LOCATION_KEY),
      AsyncStorage.getItem(CACHE_HIJRI_KEY),
    ]);
    if (!timingsRaw) return;

    const timings: PrayerTimings = JSON.parse(timingsRaw);
    const location: LocationInfo | null = locRaw ? JSON.parse(locRaw) : null;
    const hijri: CachedHijri = hijriRaw
      ? JSON.parse(hijriRaw)
      : { day: '', month_ar: '' };

    const prayers = buildPrayers(timings);
    const payloads = buildWidgetPayloads(prayers, hijri, location?.city ?? '');
    if (!payloads) return;

    await writeBothToNative(payloads.nextPayload, payloads.allPayload);
  } catch (e) {
    // Silent — widget will show its branded placeholder
  }
}

// ── Low-level native write for BOTH widgets ─────────────────────────────
async function writeBothToNative(nextJson: string, allJson: string): Promise<void> {
  if (Platform.OS === 'ios') {
    try {
      const { SharedGroupPreferences } = NativeModules;
      if (SharedGroupPreferences?.setItem) {
        await SharedGroupPreferences.setItem(NEXT_KEY, nextJson, IOS_APP_GROUP);
        await SharedGroupPreferences.setItem(ALL_KEY,  allJson,  IOS_APP_GROUP);
        SharedGroupPreferences.reloadAllTimelines?.();
      } else {
        await AsyncStorage.setItem(NEXT_KEY, nextJson);
        await AsyncStorage.setItem(ALL_KEY,  allJson);
      }
    } catch (e) {
      await AsyncStorage.setItem(NEXT_KEY, nextJson);
      await AsyncStorage.setItem(ALL_KEY,  allJson);
    }
  }

  if (Platform.OS === 'android') {
    try {
      await AsyncStorage.setItem(NEXT_KEY, nextJson);
      await AsyncStorage.setItem(ALL_KEY,  allJson);
      const { PrayerWidgetModule } = NativeModules;
      // Prefer the combined method that updates both widgets at once
      if (PrayerWidgetModule?.updateAllWidgets) {
        PrayerWidgetModule.updateAllWidgets(nextJson, allJson);
      } else if (PrayerWidgetModule?.updateWidget) {
        // Fallback — older module version
        PrayerWidgetModule.updateWidget(nextJson);
        PrayerWidgetModule.updateCalendarWidget?.(allJson);
      }
    } catch (e) {
      await AsyncStorage.setItem(NEXT_KEY, nextJson);
      await AsyncStorage.setItem(ALL_KEY,  allJson);
    }
  }
}
