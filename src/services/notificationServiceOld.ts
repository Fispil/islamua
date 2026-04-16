// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Prayer } from '../models/types';
import { to12h } from '../models/prayerUtils';
import { translations, Language } from '../constants/i18n';

const SETTINGS_KEY = 'notification_settings';
const LANG_KEY = 'app_language';
const REMINDER_MINUTES = 15;

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowList:true, shouldPlaySound:true, shouldSetBadge:false, shouldShowBanner:true }),
});

export interface NotifSettings { masterEnabled: boolean; prayers: Record<string, boolean>; }
const DEFAULT: NotifSettings = { masterEnabled:false, prayers:{ Fajr:true, Dhuhr:true, Asr:true, Maghrib:true, Isha:true } };

export async function loadSettings(): Promise<NotifSettings> {
  try { const r = await AsyncStorage.getItem(SETTINGS_KEY); if (r) return { ...DEFAULT, ...JSON.parse(r) }; } catch {}
  return { ...DEFAULT };
}
export async function saveSettings(s: NotifSettings) { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

async function getLang(): Promise<Language> {
  try { const l = await AsyncStorage.getItem(LANG_KEY); if (l==='en'||l==='uk') return l; } catch {}
  return 'en';
}

export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-adhan', { name:'Prayer Time (Adhan)', importance:Notifications.AndroidImportance.HIGH, vibrationPattern:[0,400,200,400], lightColor:'#C9A84C' });
    await Notifications.setNotificationChannelAsync('prayer-reminder', { name:'Prayer Reminder (15 min)', importance:Notifications.AndroidImportance.DEFAULT, lightColor:'#C9A84C' });
  }
  const { status: ex } = await Notifications.getPermissionsAsync();
  if (ex === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function schedulePair(prayer: Prayer, lang: Language): Promise<void> {
  const T = translations[lang];
  const [h, m] = prayer.time.split(':').map(Number);

  // Adhan notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${prayer.arabicName}  —  ${prayer.name}`,
      body: `${T.notifAdhanBody} ${to12h(prayer.time)}\n\nاللَّهُ أَكْبَرُ`,
      sound: '../assets/adhan.mp3',
      data: { prayerName: prayer.name, type: 'adhan' },
      color: '#C9A84C',
      ...(Platform.OS === 'android' && { channelId: 'prayer-adhan' }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
  });

  // 15-min reminder
  const totalMins = h*60+m-REMINDER_MINUTES;
  const remH = Math.floor(((totalMins%1440)+1440)%1440/60);
  const remM = ((totalMins%1440)+1440)%1440%60;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${prayer.name} ${T.notifReminderTitle}`,
      body: `${prayer.arabicName} — ${T.notifReminderBody} ${to12h(prayer.time)}. ${T.notifTimeToPrepare}`,
      sound: 'default',
      data: { prayerName: prayer.name, type: 'reminder' },
      color: '#C9A84C',
      ...(Platform.OS === 'android' && { channelId: 'prayer-reminder' }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: remH, minute: remM },
  });
}

export async function scheduleAllNotifications(prayers: Prayer[]): Promise<void> {
  const settings = await loadSettings();
  if (!settings.masterEnabled) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const lang = await getLang();
  for (const p of prayers.filter(p => p.isNotifiable))
    if (settings.prayers[p.name]) await schedulePair(p, lang);
}

export async function cancelAll() { await Notifications.cancelAllScheduledNotificationsAsync(); }

export async function enableNotifications(prayers: Prayer[]): Promise<boolean> {
  const granted = await requestPermission();
  if (!granted) return false;
  const s = await loadSettings(); s.masterEnabled = true;
  await saveSettings(s); await scheduleAllNotifications(prayers); return true;
}
export async function disableNotifications(): Promise<void> {
  const s = await loadSettings(); s.masterEnabled = false;
  await saveSettings(s); await cancelAll();
}
export async function togglePrayerNotif(name: string, enabled: boolean, prayers: Prayer[]): Promise<void> {
  const s = await loadSettings(); s.prayers[name] = enabled;
  await saveSettings(s); await scheduleAllNotifications(prayers);
}
