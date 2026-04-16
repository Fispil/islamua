// src/components/NextPrayerCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Prayer } from '../models/types';
import { ArabicText, LiveDot } from './ui';
import { TimerIcon, getPrayerIcon } from './AppIcons';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';
import { useTranslation } from '../hooks/useLanguage';

interface Props { nextPrayer:Prayer; currentPrayer:Prayer|null; countdown:string; progress:number; }

export default function NextPrayerCard({ nextPrayer, currentPrayer, countdown, progress }: Props) {
  const t = useTranslation();
  return (
    <LinearGradient colors={['#1e3050', Colors.card]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.container}>
      <View style={styles.labelRow}>
        <LiveDot />
        <Text style={styles.label}>{t('nextPrayer')}</Text>
      </View>
      <View style={styles.mainRow}>
        <View style={styles.nameBlock}>
          <View style={styles.iconAndName}>
            <View style={styles.iconBox}>{getPrayerIcon(nextPrayer.name, 26, Colors.gold)}</View>
            <View>
              <Text style={styles.prayerName}>{nextPrayer.name}</Text>
              <ArabicText size={20} color={Colors.gold}>{nextPrayer.arabicName}</ArabicText>
            </View>
          </View>
        </View>
        <Text style={styles.prayerTime}>{nextPrayer.time12h}</Text>
      </View>
      <View style={styles.countdownChip}>
        <TimerIcon size={14} color={Colors.gold} />
        <Text style={styles.countdownText}> {countdown}</Text>
        <Text style={styles.countdownLabel}> {t('remaining')}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width:`${Math.round(progress*100)}%` }]} />
      </View>
      {currentPrayer && (
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>{currentPrayer.name} ({currentPrayer.time12h})</Text>
          <Text style={styles.progressLabel}>{nextPrayer.name} ({nextPrayer.time12h})</Text>
        </View>
      )}
    </LinearGradient>
  );
}

// Compact widget variant
interface WProps { nextPrayer:Prayer; countdown:string; progress:number; }
export function NextPrayerWidget({ nextPrayer, countdown, progress }: WProps) {
  const t = useTranslation();
  return (
    <LinearGradient colors={['#1e3050','#162032']} start={{x:0,y:0}} end={{x:1,y:1}} style={widget.container}>
      <View style={widget.topRow}>
        <Text style={widget.label}>{t('nextPrayer')}</Text>
        <LiveDot />
      </View>
      <View style={widget.center}>
        <View style={widget.iconCircle}>{getPrayerIcon(nextPrayer.name, 22, Colors.gold)}</View>
        <ArabicText size={18} color={Colors.goldLight} style={{marginTop:6}}>{nextPrayer.arabicName}</ArabicText>
        <Text style={widget.enName}>{nextPrayer.name}</Text>
      </View>
      <Text style={widget.time}>{nextPrayer.time12h}</Text>
      <View style={widget.countdownRow}>
        <TimerIcon size={11} color={Colors.gold} />
        <Text style={widget.countdown}> {countdown}</Text>
      </View>
      <View style={widget.track}>
        <View style={[widget.fill, { width:`${Math.round(progress*100)}%` }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal:Spacing.lg, marginBottom:Spacing.lg, borderRadius:Radius.xxl, borderWidth:1, borderColor:Colors.goldBorder, padding:Spacing.xxl, shadowColor:Colors.gold, shadowOpacity:0.12, shadowRadius:20, shadowOffset:{width:0,height:8}, elevation:8 },
  labelRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:Spacing.lg },
  label: { fontSize:FontSize.xs, color:Colors.textSecondary, letterSpacing:1.4, fontWeight:'600' },
  mainRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:Spacing.xl },
  nameBlock: { flex:1 },
  iconAndName: { flexDirection:'row', alignItems:'center', gap:14 },
  iconBox: { width:52, height:52, borderRadius:16, backgroundColor:'rgba(201,168,76,0.12)', borderWidth:1, borderColor:Colors.goldBorder, alignItems:'center', justifyContent:'center' },
  prayerName: { fontSize:36, fontWeight:'700', color:Colors.textPrimary, lineHeight:40, fontFamily:'serif' },
  prayerTime: { fontSize:32, fontWeight:'200', color:Colors.textPrimary, letterSpacing:-1.5 },
  countdownChip: { flexDirection:'row', alignItems:'center', alignSelf:'flex-start', backgroundColor:'rgba(201,168,76,0.1)', borderWidth:1, borderColor:'rgba(201,168,76,0.25)', borderRadius:999, paddingHorizontal:16, paddingVertical:9, marginBottom:Spacing.lg },
  countdownText: { fontSize:FontSize.md, color:Colors.goldLight, fontWeight:'600', letterSpacing:0.5 },
  countdownLabel: { fontSize:FontSize.xs, color:Colors.textSecondary },
  progressTrack: { height:4, backgroundColor:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden', marginBottom:6 },
  progressFill: { height:'100%', backgroundColor:Colors.gold, borderRadius:2 },
  progressLabels: { flexDirection:'row', justifyContent:'space-between' },
  progressLabel: { fontSize:10, color:Colors.textSecondary },
});
const widget = StyleSheet.create({
  container: { borderRadius:Radius.xl, borderWidth:1, borderColor:Colors.goldBorder, padding:16, shadowColor:Colors.gold, shadowOpacity:0.1, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:6 },
  topRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  label: { fontSize:9, color:Colors.textSecondary, letterSpacing:1, fontWeight:'600' },
  center: { alignItems:'center', marginBottom:10 },
  iconCircle: { width:48, height:48, borderRadius:24, backgroundColor:'rgba(201,168,76,0.12)', borderWidth:1, borderColor:Colors.goldBorder, alignItems:'center', justifyContent:'center' },
  enName: { fontSize:FontSize.sm, color:Colors.textSecondary, fontWeight:'500', marginTop:2 },
  time: { fontSize:28, fontWeight:'200', color:Colors.textPrimary, letterSpacing:-1, textAlign:'center', marginBottom:8 },
  countdownRow: { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(201,168,76,0.08)', borderRadius:999, paddingVertical:5, paddingHorizontal:12, alignSelf:'center', marginBottom:10 },
  countdown: { fontSize:FontSize.xs, color:Colors.goldLight, fontWeight:'600' },
  track: { height:3, backgroundColor:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' },
  fill: { height:'100%', backgroundColor:Colors.gold, borderRadius:2 },
});
