// src/components/WidgetsGrid.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { Prayer, PrayerDayData, LocationInfo } from '../models/types';
import { calcQibla, compassDir, getFastingDuration, distanceToMecca } from '../models/prayerUtils';
import { ArabicText, SectionLabel } from './ui';
import { SunIcon, SunsetIcon } from './AppIcons';
import { NextPrayerWidget } from './NextPrayerCard';
import { Colors, Spacing, Radius, FontSize } from '../constants/theme';
import { useTranslation } from '../hooks/useLanguage';

interface Props { prayers:Prayer[]; dayData:PrayerDayData; location:LocationInfo|null; countdown:string; progress:number; }

export default function WidgetsGrid({ prayers, dayData, location, countdown, progress }: Props) {
  const t = useTranslation();
  const qibla       = location ? calcQibla(location.lat, location.lng) : 136;
  const hijri       = dayData.date.hijri;
  const fastingDur  = getFastingDuration(dayData.timings);
  const fajrTime    = prayers.find(p => p.name==='Fajr')?.time12h    ?? '--';
  const maghribTime = prayers.find(p => p.name==='Maghrib')?.time12h ?? '--';
  const notifiable  = prayers.filter(p => p.isNotifiable);
  const passedCount = notifiable.filter(p => p.hasPassed).length;
  const dist        = location ? Math.round(distanceToMecca(location.lat, location.lng)) : null;
  const nextPrayer  = notifiable.find(p => !p.hasPassed) ?? notifiable[0];

  return (
    <View style={styles.container}>
      <SectionLabel text={t('widgets')} />

      <View style={styles.grid}>
        {/* Qibla */}
        <View style={styles.widget}>
          <Text style={styles.wLabel}>{t('qibla')}</Text>
          <QiblaCompass angle={qibla} />
          <Text style={styles.wSub}>{Math.round(qibla)}° {compassDir(qibla)}</Text>
          {dist && <Text style={styles.wTiny}>{dist.toLocaleString()} {t('kmToMecca')}</Text>}
        </View>

        {/* Hijri */}
        <View style={styles.widget}>
          <Text style={styles.wLabel}>{t('hijriDate')}</Text>
          <ArabicText size={20} color={Colors.goldLight}>{hijri.month.ar}</ArabicText>
          <Text style={styles.hijriDay}>{hijri.day}</Text>
          <Text style={styles.wSub}>{hijri.year} AH</Text>
          <Text style={styles.wTiny}>{hijri.month.en}</Text>
        </View>

        {/* Fasting */}
        <View style={styles.widget}>
          <Text style={styles.wLabel}>{t('fasting')}</Text>
          <Text style={styles.bigStat}>{fastingDur}</Text>
          <Text style={styles.wSub}>{t('fastingWindow')}</Text>
          <View style={styles.fastingTimes}>
            <View style={styles.fastingRow}><SunIcon size={11} color={Colors.gold}/><Text style={styles.fastingTime}> {fajrTime}</Text></View>
            <View style={styles.fastingRow}><SunsetIcon size={11} color={Colors.goldLight}/><Text style={styles.fastingTime}> {maghribTime}</Text></View>
          </View>
        </View>

        {/* Tracker */}
        <View style={styles.widget}>
          <Text style={styles.wLabel}>{t('today')}</Text>
          <View style={styles.trackerRow}>
            <Text style={styles.bigStat}>{passedCount}</Text>
            <Text style={styles.trackerTotal}>/5</Text>
          </View>
          <Text style={styles.wSub}>{t('prayers')}</Text>
          <View style={styles.trackerDots}>
            {notifiable.map(p => <View key={p.name} style={[styles.dot, p.hasPassed && styles.dotDone]} />)}
          </View>
          <View style={styles.trackerNames}>
            {notifiable.map(p => <Text key={p.name} style={[styles.dotName, p.hasPassed && styles.dotNameDone]}>{p.name.slice(0,3)}</Text>)}
          </View>
        </View>
      </View>
    </View>
  );
}

function QiblaCompass({ angle }: { angle: number }) {
  const rad = (angle*Math.PI)/180;
  const cx=45,cy=45,r=38;
  const nx=cx+Math.sin(rad)*(r-8), ny=cy-Math.cos(rad)*(r-8);
  const tx=cx-Math.sin(rad)*18,    ty=cy+Math.cos(rad)*18;
  return (
    <Svg width={90} height={90}>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth={1.5}/>
      <Circle cx={cx} cy={cy} r={26} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5}/>
      <SvgText x={cx} y={12} fontSize={9} fill="#C9A84C" textAnchor="middle" fontWeight="700">N</SvgText>
      <Line x1={tx} y1={ty} x2={nx} y2={ny} stroke="#C9A84C" strokeWidth={3} strokeLinecap="round"/>
      <Line x1={cx} y1={cy} x2={tx} y2={ty} stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round"/>
      <Circle cx={cx} cy={cy} r={4} fill="#C9A84C"/>
      <Circle cx={nx} cy={ny} r={5} fill="rgba(201,168,76,0.15)" stroke="#C9A84C" strokeWidth={1}/>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop:8, paddingBottom:16},
  fullWidth: { paddingHorizontal:Spacing.lg, marginBottom:10 },
  grid: { justifyContent:'center', flexDirection:'row', flexWrap:'wrap', paddingHorizontal:Spacing.lg, gap:10 },
  widget: { flex:1, minWidth:'40%', maxWidth:'50%', backgroundColor:Colors.card, borderRadius:20, borderWidth:0.5, borderColor:Colors.borderSoft, padding:16, gap:3 },
  wLabel: { fontSize:9, color:Colors.textSecondary, letterSpacing:1, fontWeight:'600', marginBottom:6 },
  wSub: { fontSize:10, color:Colors.textSecondary },
  wTiny: { fontSize:9, color:Colors.textMuted, marginTop:2 },
  bigStat: { fontSize:28, fontWeight:'200', color:Colors.textPrimary, letterSpacing:-1, lineHeight:32 },
  hijriDay: { fontSize:36, fontWeight:'200', color:Colors.textPrimary, letterSpacing:-2, lineHeight:38 },
  fastingTimes: { marginTop:6, gap:4 },
  fastingRow: { flexDirection:'row', alignItems:'center' },
  fastingTime: { fontSize:11, color:Colors.textSecondary },
  trackerRow: { flexDirection:'row', alignItems:'flex-end', gap:2 },
  trackerTotal: { fontSize:16, color:Colors.textSecondary, marginBottom:3 },
  trackerDots: { flexDirection:'row', gap:4, marginTop:8 },
  dot: { flex:1, height:5, borderRadius:3, backgroundColor:Colors.borderSoft },
  dotDone: { backgroundColor:Colors.green },
  trackerNames: { flexDirection:'row', gap:4, marginTop:4 },
  dotName: { flex:1, fontSize:8, color:Colors.textMuted, textAlign:'center' },
  dotNameDone: { color:Colors.green },
});
