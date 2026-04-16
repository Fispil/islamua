// src/services/widgetService.ts
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Prayer, PrayerDayData, LocationInfo } from '../models/types';
import { getNextPrayer, getCountdown, getProgress } from '../models/prayerUtils';

const WIDGET_KEY = 'prayer_widget_data';

export async function updateWidgetData(prayers: Prayer[], dayData: PrayerDayData, location: LocationInfo | null): Promise<void> {
  const next = getNextPrayer(prayers);
  if (!next) return;
  const notifiable = prayers.filter(p => p.isNotifiable);
  const current = notifiable.find(p => p.hasPassed) ?? notifiable[notifiable.length-1];
  const data = {
    prayerName: next.name, arabicName: next.arabicName, time12h: next.time12h,
    countdown: getCountdown(next), progressPercent: Math.round(getProgress(prayers, next)*100),
    currentPrayerName: current?.name ?? '', currentPrayerTime: current?.time12h ?? '',
    city: location?.city ?? '', hijriDay: dayData.date.hijri.day, hijriMonth: dayData.date.hijri.month.ar,
  };
  const json = JSON.stringify(data);
  if (Platform.OS === 'ios') {
    try {
      const { SharedGroupPreferences } = NativeModules;
      if (SharedGroupPreferences) { await SharedGroupPreferences.setItem(WIDGET_KEY, json, 'group.com.yourname.prayerapp'); SharedGroupPreferences.reloadAllTimelines?.(); }
    } catch { await AsyncStorage.setItem(WIDGET_KEY, json); }
  }
  if (Platform.OS === 'android') {
    try {
      await AsyncStorage.setItem(WIDGET_KEY, json);
      NativeModules.PrayerWidgetModule?.updateWidget(json);
    } catch { await AsyncStorage.setItem(WIDGET_KEY, json); }
  }
}
