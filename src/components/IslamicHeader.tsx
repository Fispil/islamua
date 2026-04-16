// src/components/IslamicHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LocationInfo, PrayerDayData } from '../models/types';
import { ArabicText, IslamicPattern, LiveDot } from './ui';
import { CrescentIcon, LocationIcon, ChevronDownIcon } from './AppIcons';
import { Colors, FontSize, Spacing } from '../constants/theme';
import { useTranslation } from '../hooks/useLanguage';

interface Props { location: LocationInfo | null; dayData: PrayerDayData | null; onLocationPress?: () => void; }

export default function IslamicHeader({ location, dayData, onLocationPress }: Props) {
  const t = useTranslation();
  const now = new Date();
  const MONTHS = [t('january'),t('february'),t('march'),t('april'),t('may'),t('june'),
                  t('july'),t('august'),t('september'),t('october'),t('november'),t('december')];
  const DAYS   = [t('sunday'),t('monday'),t('tuesday'),t('wednesday'),t('thursday'),t('friday'),t('saturday')];
  const dateStr = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const hijri = dayData?.date.hijri;

  return (
    <LinearGradient colors={['#0a1520', Colors.background]} style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onLocationPress} activeOpacity={0.75} style={styles.locationPill}>
          <LiveDot />
          <LocationIcon size={12} color={Colors.goldLight} />
          <Text style={styles.locationText}>
            {location ? `${location.city}, ${location.countryCode}` : t('locating')}
          </Text>
          <ChevronDownIcon size={12} color={Colors.goldLight} />
        </TouchableOpacity>
        <View style={styles.crescentBox}><CrescentIcon size={22} color={Colors.gold} /></View>
      </View>

      <IslamicPattern />

      <ArabicText size={20} style={styles.bismillah}>{t('bismillah')}</ArabicText>
      <Text style={styles.bismillahSub}>{t('bismillahTranslation')}</Text>
      <Text style={styles.companyName}>Асоціація мусульман України</Text>

      <View style={styles.dateCard}>
        {hijri && (
          <ArabicText size={16} color={Colors.goldLight}>
            {`${hijri.day} ${hijri.month.ar} ${hijri.year}هـ`}
          </ArabicText>
        )}
        <Text style={styles.gregorian}>{dateStr}</Text>
        {hijri?.month.number === 9 && (
          <View style={styles.ramadanBadge}>
            <Text style={styles.ramadanText}>{t('ramadanMubarak')}</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop:56, paddingBottom:20, paddingHorizontal:Spacing.xl, alignItems:'center' },
  topRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:'100%', marginBottom:4 },
  locationPill: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'rgba(201,168,76,0.1)', borderWidth:1, borderColor:Colors.goldBorder, borderRadius:999, paddingHorizontal:14, paddingVertical:8 },
  locationText: { fontSize:FontSize.sm, color:Colors.goldLight, fontWeight:'500' },
  crescentBox: { width:38, height:38, borderRadius:19, backgroundColor:'rgba(201,168,76,0.1)', borderWidth:1, borderColor:Colors.goldBorder, alignItems:'center', justifyContent:'center' },
  bismillah: { textAlign:'center', marginTop:4 },
  bismillahSub: { fontSize:FontSize.xs, color:Colors.textSecondary, textAlign:'center', marginTop:4, marginBottom:14 },
  companyName: { fontSize:FontSize.xl, color:Colors.textPrimary, textAlign:'center', marginTop:4, marginBottom:14, fontWeight: '600' },
  dateCard: { alignItems:'center', backgroundColor:'rgba(26,40,64,0.6)', borderWidth:0.5, borderColor:Colors.borderSoft, borderRadius:14, paddingHorizontal:20, paddingVertical:12, gap:3 },
  gregorian: { fontSize:FontSize.sm, color:Colors.textSecondary },
  ramadanBadge: { marginTop:6, backgroundColor:'rgba(76,175,122,0.15)', borderWidth:1, borderColor:'rgba(76,175,122,0.3)', borderRadius:999, paddingHorizontal:12, paddingVertical:3 },
  ramadanText: { fontSize:FontSize.xs, color:Colors.green, fontWeight:'600' },
});
