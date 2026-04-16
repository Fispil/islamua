// src/screens/CalendarScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMonthlyTimes, getCurrentLocation } from '../services/prayerService';
import { buildPrayers } from '../models/prayerUtils';
import { PrayerDayData } from '../models/types';
import { ArabicText } from '../components/ui';
import { CalendarIcon, getPrayerIcon } from '../components/AppIcons';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';
import { useTranslation } from '../hooks/useLanguage';

export default function CalendarScreen() {
  const t = useTranslation();
  const MONTHS = [t('january'),t('february'),t('march'),t('april'),t('may'),t('june'),
                  t('july'),t('august'),t('september'),t('october'),t('november'),t('december')];
  const DAYS_SHORT = [t('sun'),t('mon'),t('tue'),t('wed'),t('thu'),t('fri'),t('sat')];

  const [monthData, setMonthData]   = useState<PrayerDayData[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [loading, setLoading]       = useState(true);
  const now = new Date();

  useEffect(() => {
    (async () => {
      const loc = await getCurrentLocation();
      const data = await fetchMonthlyTimes(loc.lat, loc.lng);
      setMonthData(data); setLoading(false);
    })();
  }, []);

  const selectedData = monthData[selectedDay-1] ?? null;
  const prayers      = selectedData ? buildPrayers(selectedData.timings) : [];
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>{t('prayerCalendar')}</Text>
        <Text style={s.subtitle}>{MONTHS[now.getMonth()]} {now.getFullYear()}</Text>
      </View>

      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={Array.from({length:daysInMonth},(_,i)=>i+1)}
        keyExtractor={d=>String(d)}
        contentContainerStyle={s.dayStrip}
        initialScrollIndex={Math.max(0,selectedDay-4)}
        getItemLayout={(_,i)=>({length:60,offset:i*60,index:i})}
        renderItem={({item:day}) => {
          const isSelected = day===selectedDay, isToday = day===now.getDate();
          const weekday = new Date(now.getFullYear(),now.getMonth(),day).getDay();
          const isFriday = weekday===5;
          return (
            <TouchableOpacity onPress={()=>setSelectedDay(day)} activeOpacity={0.7}
              style={[s.dayCell, isSelected&&s.dayCellSelected, isToday&&!isSelected&&s.dayCellToday]}>
              <Text style={[s.dayName, isSelected&&s.dayCellTextSelected, isFriday&&!isSelected&&s.dayFriday]}>
                {DAYS_SHORT[weekday]}
              </Text>
              <Text style={[s.dayNum, isSelected&&s.dayCellTextSelected]}>{day}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={s.dividerLine} />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.gold} />
          <Text style={s.loadingText}>{t('loadingCalendar')}</Text>
        </View>
      ) : !selectedData ? (
        <View style={s.center}><Text style={s.loadingText}>{t('noData')}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Hijri date card */}
          <View style={s.hijriCard}>
            <CalendarIcon size={26} color={Colors.gold} />
            <View style={{flex:1}}>
              <ArabicText size={18} color={Colors.gold}>
                {`${selectedData.date.hijri.day} ${selectedData.date.hijri.month.ar}`}
              </ArabicText>
              <Text style={s.hijriYear}>{selectedData.date.hijri.year} AH · {selectedData.date.hijri.month.en}</Text>
            </View>
            <View style={s.gregorianPill}>
              <Text style={s.gregorianText}>{selectedDay} {MONTHS[now.getMonth()]}</Text>
            </View>
          </View>

          {prayers.map(prayer => (
            <View key={prayer.name} style={s.prayerRow}>
              <View style={s.prayerIcon}>{getPrayerIcon(prayer.name, 18, Colors.gold)}</View>
              <View style={{flex:1,gap:1}}>
                <Text style={s.prayerName}>{prayer.name}</Text>
                <ArabicText size={13} color={Colors.textSecondary}>{prayer.arabicName}</ArabicText>
              </View>
              <Text style={s.prayerTime}>{prayer.time12h}</Text>
            </View>
          ))}
          <View style={{height:32}} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.background },
  header: { alignItems:'center', paddingTop:20, paddingBottom:12, gap:2 },
  title: { fontSize:FontSize.xl, fontWeight:'600', color:Colors.textPrimary },
  subtitle: { fontSize:FontSize.sm, color:Colors.textSecondary },
  dayStrip: { paddingHorizontal:12, paddingVertical:8, gap:4 },
  dayCell: { width:52, height:60, borderRadius:Radius.md, backgroundColor:Colors.card, borderWidth:0.5, borderColor:Colors.borderSoft, alignItems:'center', justifyContent:'center', marginHorizontal:4, gap:2 },
  dayCellSelected: { backgroundColor:Colors.gold, borderColor:Colors.gold },
  dayCellToday: { borderColor:Colors.goldBorder, backgroundColor:'rgba(201,168,76,0.1)' },
  dayName: { fontSize:9, color:Colors.textSecondary, fontWeight:'500' },
  dayNum: { fontSize:FontSize.lg, fontWeight:'600', color:Colors.textPrimary },
  dayCellTextSelected: { color:Colors.background },
  dayFriday: { color:Colors.gold },
  dividerLine: { height:0.5, backgroundColor:Colors.borderSoft },
  center: { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  loadingText: { fontSize:FontSize.md, color:Colors.textSecondary },
  scroll: { padding:Spacing.lg },
  hijriCard: { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:Colors.card, borderRadius:Radius.lg, borderWidth:1, borderColor:Colors.goldBorder, padding:Spacing.lg, marginBottom:Spacing.lg },
  hijriYear: { fontSize:FontSize.xs, color:Colors.textSecondary, marginTop:2 },
  gregorianPill: { backgroundColor:Colors.goldMuted, borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:Colors.goldBorder },
  gregorianText: { fontSize:FontSize.xs, color:Colors.gold, fontWeight:'600' },
  prayerRow: { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:Colors.card, borderRadius:Radius.md, borderWidth:0.5, borderColor:Colors.borderSoft, padding:Spacing.lg, marginBottom:8 },
  prayerIcon: { width:40, height:40, borderRadius:11, backgroundColor:'rgba(201,168,76,0.07)', alignItems:'center', justifyContent:'center' },
  prayerName: { fontSize:FontSize.base, fontWeight:'500', color:Colors.textPrimary },
  prayerTime: { fontSize:FontSize.lg, fontWeight:'300', color:Colors.textPrimary, letterSpacing:-0.5 },
});
