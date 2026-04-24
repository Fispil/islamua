// src/components/PrayerTile.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Prayer } from '../models/types';
import { ArabicText, Toggle } from './ui';
import { getPrayerIcon, CheckIcon } from './AppIcons';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';

interface Props { prayer:Prayer; isNext:boolean; notifEnabled:boolean; showToggle:boolean; onToggle:()=>void; }

export default function PrayerTile({ prayer, isNext, notifEnabled, showToggle, onToggle }: Props) {
  const iconColor = isNext ? Colors.gold : prayer.hasPassed ? Colors.textMuted : Colors.textSecondary;
  const isFajr = prayer.name === 'Fajr';
  
  return (
    <View style={[styles.container, isNext && styles.containerNext, prayer.hasPassed && !isNext && styles.containerPassed]}>
      {isNext && <View style={styles.accentBar} />}
      <View style={[styles.iconBox, isNext && styles.iconBoxNext]}>
        {getPrayerIcon(prayer.name, 20, iconColor as '#e3b345')}
      </View>
      <View style={styles.nameBlock}>
        <View style={styles.nameRow}>
          <Text style={[styles.nameEn, prayer.hasPassed && !isNext && styles.namePassed]}>{prayer.name}</Text>
          {isNext && <View style={styles.nextBadge}><Text style={styles.nextBadgeText}>Next</Text></View>}
          {prayer.hasPassed && !isNext && <CheckIcon size={14} color={Colors.green} />}
        </View>
        <ArabicText size={13} color={isNext ? Colors.gold : Colors.textSecondary}>{prayer.arabicName}</ArabicText>
      </View>
      <Text style={[styles.time, isNext && styles.timeNext]}>{prayer.time12h}</Text>
      {showToggle && <Toggle value={notifEnabled} onToggle={onToggle} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:Colors.card, borderRadius:Radius.lg, borderWidth:0.5, borderColor:Colors.borderSoft, marginBottom:8, paddingHorizontal:16, paddingVertical:14, overflow:'hidden' },
  containerNext: { backgroundColor:'#1e3050', borderColor:Colors.goldBorder, paddingLeft:15 },
  containerPassed: { opacity:0.55 },
  accentBar: { position:'absolute', left:0, top:0, bottom:0, width:3, backgroundColor:Colors.gold, borderTopLeftRadius:Radius.lg, borderBottomLeftRadius:Radius.lg },
  iconBox: { width:44, height:60, borderRadius:12, backgroundColor:'rgba(201,168,76,0.07)', borderWidth:0.5, borderColor:Colors.borderSoft, alignItems:'center', justifyContent:'center' },
  iconBoxNext: { backgroundColor:'rgba(201,168,76,0.15)', borderColor:Colors.goldBorder },
  nameBlock: { flex:1, gap:1 },
  nameRow: { flexDirection:'row', alignItems:'center', gap:8 },
  nameEn: { fontSize:FontSize.base, fontWeight:'600', color:Colors.textPrimary },
  namePassed: { color:Colors.textSecondary },
  nextBadge: { backgroundColor:'rgba(201,168,76,0.18)', borderRadius:999, paddingHorizontal:8, paddingVertical:2 },
  nextBadgeText: { fontSize:10, color:Colors.gold, fontWeight:'700' },
  time: { fontSize:17, fontWeight:'300', color:Colors.textPrimary, letterSpacing:-0.5 },
  timeNext: { color:Colors.goldLight, fontWeight:'500' },
});
