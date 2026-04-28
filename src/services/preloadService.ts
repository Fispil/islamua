// src/services/preloadService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const CACHE_TIMINGS_KEY  = 'last_timings';
const CACHE_LOCATION_KEY = 'last_location';
const CACHE_HIJRI_KEY    = 'last_hijri';
const CACHE_DATE_KEY     = 'last_fetch_date';  // YYYY-MM-DD

const ALADHAN_BASE = 'https://api.aladhan.com/v1/timings';
const PRELOAD_TIMEOUT_MS = 4000;  // якщо API відповідає більше 4 сек — пропускаємо

/**
 * Перевіряє кеш і вирішує чи потрібен fetch:
 * - Якщо кеш від сьогодні → нічого не робимо, дані актуальні
 * - Якщо кеш старий → робимо fetch у фоні
 * - Якщо взагалі нема кешу → робимо fetch блокуючи splash
 */
export async function preloadPrayerData(): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const cachedDate = await AsyncStorage.getItem(CACHE_DATE_KEY);
    const cachedTimings = await AsyncStorage.getItem(CACHE_TIMINGS_KEY);

    // Якщо кеш від сьогодні і timings є → нічого не робимо
    if (cachedDate === today && cachedTimings) {
      return;
    }

    // Інакше — fetch свіжих даних із timeout
    await Promise.race([
      fetchAndCachePrayerTimes(today),
      // Якщо API повільний — не блокуємо splash більше 4 сек
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('preload timeout')), PRELOAD_TIMEOUT_MS)
      ),
    ]);
  } catch (e) {
    // Помилка — не блокуємо запуск. HomeScreen сам обробить.
    console.warn('preloadPrayerData failed:', e);
  }
}

async function fetchAndCachePrayerTimes(today: string): Promise<void> {
  // 1. Отримуємо локацію (з кешу якщо є — швидко)
  let lat: number;
  let lon: number;
  let cityName: string = '';

  const cachedLocRaw = await AsyncStorage.getItem(CACHE_LOCATION_KEY);
  if (cachedLocRaw) {
    const cachedLoc = JSON.parse(cachedLocRaw);
    lat = cachedLoc.latitude;
    lon = cachedLoc.longitude;
    cityName = cachedLoc.city ?? '';
  } else {
    // Без кешу локації — пропускаємо preload
    // (запитувати геолокацію тут не варто бо вона показує permission dialog)
    return;
  }

  // 2. Fetch AlAdhan API (method=3 = Muslim World League)
  const dateParts = today.split('-'); // ['2026', '04', '28']
  const url = `${ALADHAN_BASE}/${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  const response = await axios.get(url, {
    params: {
      latitude: lat,
      longitude: lon,
      method: 3,
    },
    timeout: 3500,
  });

  const data = response.data?.data;
  if (!data?.timings) return;

  // 3. Кешуємо
  await Promise.all([
    AsyncStorage.setItem(CACHE_TIMINGS_KEY, JSON.stringify(data.timings)),
    AsyncStorage.setItem(CACHE_DATE_KEY, today),
    AsyncStorage.setItem(CACHE_HIJRI_KEY, JSON.stringify({
      day:      data.date.hijri.day,
      month_ar: data.date.hijri.month.ar,
    })),
    AsyncStorage.setItem(CACHE_LOCATION_KEY, JSON.stringify({
      latitude: lat,
      longitude: lon,
      city: cityName,
    })),
  ]);
}
