// src/screens/QiblaScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Magnetometer } from 'expo-sensors';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { getCurrentLocation } from '../services/prayerService';
import { calcQibla, compassDir, distanceToMecca } from '../models/prayerUtils';
import { LocationInfo } from '../models/types';
import { ArabicText } from '../components/ui';
import { useTranslation } from '../hooks/useLanguage';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';

export default function QiblaScreen() {
  const t = useTranslation();
  const [location, setLocation] = useState<LocationInfo|null>(null);
  const [heading, setHeading]   = useState(0);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getCurrentLocation().then(loc => { setLocation(loc); setLoading(false); });
  }, []);

  useEffect(() => {
    const sub = Magnetometer.addListener(d => {
      let a = Math.atan2(d.y, d.x)*(180/Math.PI);
      if (a < 0) a += 360;
      setHeading(a);
    });
    Magnetometer.setUpdateInterval(100);
    return () => sub.remove();
  }, []);

  const qibla  = location ? calcQibla(location.lat, location.lng) : 136;
  const needle = qibla - heading;
  const aligned = Math.abs((needle+360)%360) < 5 || Math.abs((needle+360)%360) > 355;
  const dist   = location ? Math.round(distanceToMecca(location.lat, location.lng)) : null;

  const cx=150,cy=150,R=130,rad=(needle*Math.PI)/180;
  const tipX=cx+Math.sin(rad)*(R-20), tipY=cy-Math.cos(rad)*(R-20);
  const tailX=cx-Math.sin(rad)*55,   tailY=cy+Math.cos(rad)*55;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>{t('qiblaFull')}</Text>
        <ArabicText size={16}>{t('qiblaDirectionAr')}</ArabicText>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.gold} size="large" />
          <Text style={s.loadingText}>{t('gettingLocation')}</Text>
        </View>
      ) : (
        <View style={s.content}>
          {/* Info card */}
          <View style={s.infoCard}>
            <View style={{ flex:1, gap:2 }}>
              <Text style={s.infoLabel}>{t('yourLocation')}</Text>
              <Text style={s.infoCity}>{location ? `${location.city}, ${location.country}` : '--'}</Text>
              {location && <Text style={s.infoCoords}>{location.lat.toFixed(4)}{t('degreesN')}, {location.lng.toFixed(4)}{t('degreesE')}</Text>}
            </View>
            <View style={s.angleBox}>
              <Text style={s.angleNum}>{Math.round(qibla)}°</Text>
              <Text style={s.angleDir}>{compassDir(qibla)}</Text>
            </View>
          </View>

          {/* Compass */}
          <View style={s.compassWrap}>
            <Svg width={300} height={300}>
              <Circle cx={cx} cy={cy} r={R} fill="none" stroke={aligned ? Colors.green : Colors.goldBorder} strokeWidth={1.5}/>
              {Array.from({length:36}).map((_,i) => {
                const a=(i*10*Math.PI)/180, major=i%9===0;
                const inner=major?R-14:R-8;
                return <Line key={i} x1={cx+Math.sin(a)*inner} y1={cy-Math.cos(a)*inner} x2={cx+Math.sin(a)*R} y2={cy-Math.cos(a)*R} stroke={Colors.borderSoft} strokeWidth={0.7}/>;
              })}
              {(['N','E','S','W'] as const).map((d,i) => {
                const a=(i*90*Math.PI)/180;
                return <SvgText key={d} x={cx+Math.sin(a)*(R-22)} y={cy-Math.cos(a)*(R-22)+4} fontSize={11} fill={d==='N'?Colors.gold:Colors.textSecondary} textAnchor="middle" fontWeight="700">{d}</SvgText>;
              })}
              <Circle cx={cx} cy={cy} r={R-40} fill="none" stroke={Colors.borderSoft} strokeWidth={0.5}/>
              <Line x1={tailX} y1={tailY} x2={tipX} y2={tipY} stroke={aligned?Colors.green:Colors.gold} strokeWidth={3.5} strokeLinecap="round"/>
              <Line x1={cx} y1={cy} x2={tailX} y2={tailY} stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round"/>
              <Circle cx={tipX} cy={tipY} r={10} fill="rgba(201,168,76,0.15)" stroke={aligned?Colors.green:Colors.gold} strokeWidth={1}/>
              <Circle cx={cx} cy={cy} r={8} fill={aligned?Colors.green:Colors.gold}/>
              <SvgText x={cx} y={cy+R+20} fontSize={12} fill={Colors.textSecondary} textAnchor="middle">{Math.round(heading)}°</SvgText>
            </Svg>
          </View>

          {/* Status */}
          <View style={[s.statusBadge, aligned && s.statusAligned]}>
            <Text style={[s.statusText, aligned && s.statusTextAligned]}>
              {aligned ? `✓  ${t('facingQibla')}` : `⟳  ${t('rotateQibla')}`}
            </Text>
          </View>

          {/* Distance */}
          {dist && (
            <View style={s.distCard}>
              <Text style={{ fontSize:32 }}>🕌</Text>
              <View>
                <Text style={s.infoLabel}>{t('distanceToMecca')}</Text>
                <Text style={s.distValue}>{dist.toLocaleString()} km</Text>
                <Text style={s.infoCoords}>{t('masjidAlHaram')}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.background },
  header: { alignItems:'center', paddingTop:20, paddingBottom:8, gap:4 },
  title: { fontSize:FontSize.xl, fontWeight:'600', color:Colors.textPrimary },
  center: { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  loadingText: { fontSize:FontSize.md, color:Colors.textSecondary },
  content: { flex:1, paddingHorizontal:Spacing.lg, gap:Spacing.lg },
  infoCard: { flexDirection:'row', alignItems:'center', backgroundColor:Colors.card, borderRadius:Radius.xl, borderWidth:1, borderColor:Colors.goldBorder, padding:Spacing.xl, gap:12 },
  infoLabel: { fontSize:FontSize.xs, color:Colors.textSecondary, letterSpacing:0.8 },
  infoCity: { fontSize:FontSize.lg, fontWeight:'600', color:Colors.textPrimary },
  infoCoords: { fontSize:FontSize.xs, color:Colors.textSecondary },
  angleBox: { alignItems:'center', backgroundColor:'rgba(201,168,76,0.12)', borderRadius:Radius.md, padding:14, borderWidth:1, borderColor:Colors.goldBorder },
  angleNum: { fontSize:22, fontWeight:'200', color:Colors.textPrimary, letterSpacing:-1 },
  angleDir: { fontSize:12, color:Colors.gold, fontWeight:'700' },
  compassWrap: { alignItems:'center' },
  statusBadge: { alignSelf:'center', backgroundColor:Colors.card, borderRadius:999, borderWidth:1, borderColor:Colors.borderSoft, paddingHorizontal:24, paddingVertical:11 },
  statusAligned: { backgroundColor:'rgba(76,175,122,0.12)', borderColor:'rgba(76,175,122,0.4)' },
  statusText: { fontSize:FontSize.md, color:Colors.textSecondary, fontWeight:'500' },
  statusTextAligned: { color:Colors.green },
  distCard: { flexDirection:'row', alignItems:'center', gap:16, backgroundColor:Colors.card, borderRadius:Radius.xl, borderWidth:0.5, borderColor:Colors.borderSoft, padding:Spacing.xl, marginBottom:Spacing.xl },
  distValue: { fontSize:28, fontWeight:'200', color:Colors.textPrimary, letterSpacing:-1 },
});
