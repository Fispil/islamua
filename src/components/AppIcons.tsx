// src/components/AppIcons.tsx
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

type P = { size?: number; color?: string };
const MC = MaterialCommunityIcons;
const IO = Ionicons;

export const FajrIcon      = ({size=22,color=Colors.gold}:P) => <MC name="weather-night" size={size} color={color}/>;
export const SunriseIcon   = ({size=22,color=Colors.gold}:P) => <MC name="weather-sunset-up" size={size} color={color}/>;
export const DhuhrIcon     = ({size=22,color=Colors.gold}:P) => <MC name="weather-sunny" size={size} color={color}/>;
export const AsrIcon       = ({size=22,color=Colors.gold}:P) => <MC name="weather-partly-cloudy" size={size} color={color}/>;
export const MaghribIcon   = ({size=22,color=Colors.gold}:P) => <MC name="weather-sunset" size={size} color={color}/>;
export const IshaIcon      = ({size=22,color=Colors.gold}:P) => <MC name="weather-night-partly-cloudy" size={size} color={color}/>;
export const PrayerTabIcon = ({size=24,color=Colors.gold}:P) => <MC name="mosque" size={size} color={color}/>;
export const QiblaTabIcon  = ({size=24,color=Colors.gold}:P) => <MC name="compass-rose" size={size} color={color}/>;
export const TasbihTabIcon = ({size=24,color=Colors.gold}:P) => <MC name="circle-multiple" size={size} color={color}/>;
export const CalendarTabIcon=({size=24,color=Colors.gold}:P) => <MC name="calendar-month" size={size} color={color}/>;
export const SettingsTabIcon=({size=24,color=Colors.gold}:P) => <MC name="cog" size={size} color={color}/>;
export const MosqueIcon    = ({size=32,color=Colors.gold}:P) => <MC name="mosque" size={size} color={color}/>;
export const CrescentIcon  = ({size=22,color=Colors.gold}:P) => <MC name="star-crescent" size={size} color={color}/>;
export const BellIcon      = ({size=20,color=Colors.gold}:P) => <IO name="notifications" size={size} color={color}/>;
export const LocationIcon  = ({size=14,color=Colors.goldLight}:P) => <IO name="location" size={size} color={color}/>;
export const CompassIcon   = ({size=24,color=Colors.gold}:P) => <MC name="compass" size={size} color={color}/>;
export const QuranTabIcon = ({size=24,color=Colors.gold}:P) => <MC name="book-open-variant" size={size} color={color}/>;
//@ts-expect-error
export const KaabaIcon     = ({size=32,color=Colors.gold}:P) => <MC name="kaaba" size={size} color={color}/>;
export const CalendarIcon  = ({size=24,color=Colors.gold}:P) => <MC name="calendar-today" size={size} color={color}/>;
export const TimerIcon     = ({size=14,color=Colors.gold}:P) => <MC name="timer-outline" size={size} color={color}/>;
export const CheckIcon     = ({size=14,color=Colors.green}:P) => <IO name="checkmark-circle" size={size} color={color}/>;
export const ChevronDownIcon=({size=14,color=Colors.goldLight}:P) => <IO name="chevron-down" size={size} color={color}/>;
export const ChevronRightIcon=({size=18,color=Colors.textSecondary}:P) => <IO name="chevron-forward" size={size} color={color}/>;
export const CloseIcon     = ({size=16,color=Colors.textSecondary}:P) => <IO name="close" size={size} color={color}/>;
export const SunIcon       = ({size=12,color=Colors.gold}:P) => <MC name="weather-sunny" size={size} color={color}/>;
export const SunsetIcon    = ({size=12,color=Colors.goldLight}:P) => <MC name="weather-sunset" size={size} color={color}/>;
export const ApiIcon       = ({size=20,color=Colors.gold}:P) => <MC name="api" size={size} color={color}/>;
export const PhoneIcon     = ({size=20,color=Colors.gold}:P) => <MC name="cellphone" size={size} color={color}/>;
export const BeadsIcon     = ({size=56,color=Colors.gold}:P) => <MC name="circle-multiple-outline" size={size} color={color}/>;
export const LanguageIcon  = ({size=20,color=Colors.gold}:P) => <IO name="language" size={size} color={color}/>;
export const RefreshIcon   = ({size=16,color=Colors.textSecondary}:P) => <IO name="refresh" size={size} color={color}/>;

export function getPrayerIcon(name:string, size=22, color=Colors.gold) {
  switch(name) {
    case 'Fajr':    return <FajrIcon    size={size} color={color}/>;
    case 'Sunrise': return <SunriseIcon size={size} color={color}/>;
    case 'Dhuhr':   return <DhuhrIcon   size={size} color={color}/>;
    case 'Asr':     return <AsrIcon     size={size} color={color}/>;
    case 'Maghrib': return <MaghribIcon size={size} color={color}/>;
    case 'Isha':    return <IshaIcon    size={size} color={color}/>;
    default:        return <DhuhrIcon   size={size} color={color}/>;
  }
}
