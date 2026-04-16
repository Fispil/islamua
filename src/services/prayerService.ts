// src/services/prayerService.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { PrayerDayData, LocationInfo } from '../models/types';

const BASE = 'https://api.aladhan.com/v1';
const CACHE_KEY = 'prayer_cache';
const LOC_KEY   = 'location_cache';
const METHOD = 3;

export async function fetchPrayerTimes(lat: number, lng: number, date?: Date): Promise<PrayerDayData | null> {
  const d = date ?? new Date();
  const dateStr = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
  const cacheId = `${CACHE_KEY}_${dateStr}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  try { const c = await AsyncStorage.getItem(cacheId); if (c) return JSON.parse(c); } catch {}
  try {
    const { data } = await axios.get(`${BASE}/timings/${dateStr}`, { params:{latitude:lat,longitude:lng,method:METHOD}, timeout:10000 });
    if (data.code === 200) { await AsyncStorage.setItem(cacheId, JSON.stringify(data.data)); return data.data; }
  } catch {}
  return null;
}

export async function fetchMonthlyTimes(lat: number, lng: number): Promise<PrayerDayData[]> {
  const now = new Date();
  try {
    const { data } = await axios.get(`${BASE}/calendar/${now.getFullYear()}/${now.getMonth()+1}`, { params:{latitude:lat,longitude:lng,method:METHOD}, timeout:15000 });
    if (data.code === 200) return data.data;
  } catch {}
  return [];
}

export async function getCurrentLocation(): Promise<LocationInfo> {
  let cached: LocationInfo | null = null;
  try { const r = await AsyncStorage.getItem(LOC_KEY); if (r) cached = JSON.parse(r); } catch {}
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return cached ?? defaultLocation();
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    let city='Unknown', country='', countryCode='';
    try {
      const [p] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      city = p.city ?? p.district ?? p.subregion ?? 'Unknown';
      country = p.country ?? ''; countryCode = p.isoCountryCode ?? '';
    } catch {}
    const loc: LocationInfo = { lat:pos.coords.latitude, lng:pos.coords.longitude, city, country, countryCode };
    await AsyncStorage.setItem(LOC_KEY, JSON.stringify(loc));
    return loc;
  } catch { return cached ?? defaultLocation(); }
}

function defaultLocation(): LocationInfo {
  return { lat:50.4501, lng:30.5234, city:'Kyiv', country:'Ukraine', countryCode:'UA' };
}
