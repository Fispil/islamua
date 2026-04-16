// src/models/types.ts
export interface PrayerTimings {
  Fajr: string; Sunrise: string; Dhuhr: string;
  Asr: string;  Maghrib: string; Isha: string;
}
export interface HijriMonth { number: number; en: string; ar: string; }
export interface HijriDate  { day: string; month: HijriMonth; year: string; weekday: { en: string }; }
export interface GregorianDate { day: string; month: { en: string; number: string }; year: string; weekday: { en: string }; }
export interface PrayerDayData {
  timings: PrayerTimings;
  date: { hijri: HijriDate; gregorian: GregorianDate; };
}
export interface Prayer {
  name: string; arabicName: string; time: string; time12h: string;
  icon: string; isNotifiable: boolean; hasPassed: boolean; minutesSinceMidnight: number;
}
export interface LocationInfo {
  lat: number; lng: number; city: string; country: string; countryCode: string;
}
