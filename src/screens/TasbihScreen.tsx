// src/screens/TasbihScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArabicText } from '../components/ui';
import { BeadsIcon } from '../components/AppIcons';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';
import { useTranslation } from '../hooks/useLanguage';

export default function TasbihScreen() {
  const t = useTranslation();

  const DHIKR = [
    { en:'SubhanAllah',       ar:'سبحان الله',        translation:t('glorBeToAllah'),     goal:33  },
    { en:'Alhamdulillah',     ar:'الحمد لله',          translation:t('praiseAllah'),        goal:33  },
    { en:'Allahu Akbar',      ar:'الله أكبر',          translation:t('allahGreatest'),      goal:34  },
    { en:'Astaghfirullah',    ar:'أستغفر الله',        translation:t('seekForgiveness'),    goal:100 },
    { en:'La ilaha illallah', ar:'لا إله إلا الله',    translation:t('noGodButAllah'),      goal:100 },
    { en:'Salawat',           ar:'اللهم صل على محمد',  translation:t('blessingsOnProphet'), goal:100 },
  ];

  const [count, setCount]         = useState(0);
  const [idx, setIdx]             = useState(0);
  const [goal, setGoal]           = useState(33);
  const [pickerVisible, setPicker] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ringAnim  = useRef(new Animated.Value(0)).current;
  const dhikr = DHIKR[idx];
  const storageKey = `tasbih_${dhikr.en}`;

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(v => setCount(v ? parseInt(v) : 0));
    setGoal(dhikr.goal);
  }, [idx]);

  const tap = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = count + 1;
    setCount(next);
    await AsyncStorage.setItem(storageKey, String(next));
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue:0.92, duration:70, useNativeDriver:true }),
      Animated.timing(scaleAnim, { toValue:1,    duration:120, useNativeDriver:true }),
    ]).start();
    if (next % goal === 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(ringAnim, { toValue:1, duration:300, useNativeDriver:true }),
        Animated.timing(ringAnim, { toValue:0, duration:400, useNativeDriver:true }),
      ]).start();
    }
  };

  const reset = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCount(0); await AsyncStorage.setItem(storageKey, '0');
  };

  const progress  = (count % goal) / goal;
  const sets      = Math.floor(count / goal);
  const remaining = goal - (count % goal);
  const RING      = 180;
  const ringScale   = ringAnim.interpolate({ inputRange:[0,1], outputRange:[1,1.08] });
  const ringOpacity = ringAnim.interpolate({ inputRange:[0,0.5,1], outputRange:[0,0.6,0] });

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>{t('tasbihCounter')}</Text>
        <TouchableOpacity onPress={() => setPicker(true)} style={s.pickerBtn}>
          <Text style={s.pickerBtnText}>{t('chooseDhikrBtn')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setPicker(true)} style={s.dhikrCard} activeOpacity={0.8}>
        <ArabicText size={30} color={Colors.gold} style={{ textAlign:'center' }}>{dhikr.ar}</ArabicText>
        <Text style={s.dhikrEn}>{dhikr.en}</Text>
        <Text style={s.dhikrTrans}>{dhikr.translation}</Text>
      </TouchableOpacity>

      <View style={s.countArea}>
        <Animated.View style={[s.pulseRing, { transform:[{scale:ringScale}], opacity:ringOpacity, width:RING+20, height:RING+20, borderRadius:(RING+20)/2 }]} />
        <View style={{ width:RING, height:RING, alignItems:'center', justifyContent:'center' }}>
          <View style={[s.svgRing, { width:RING, height:RING, borderRadius:RING/2, borderWidth:5 }]} />
          <View style={s.countCenter}>
            <Text style={s.countNum}>{count}</Text>
            <Text style={s.countGoal}>/ {goal}</Text>
            <Text style={s.setsText}>{sets > 0 ? `${sets} ${sets===1?t('set'):t('sets')} ${t('complete')}` : `${remaining} ${t('remaining2')}`}</Text>
          </View>
        </View>
      </View>

      <View style={s.goalRow}>
        {[33,100,1000].map(g => (
          <TouchableOpacity key={g} onPress={() => setGoal(g)} style={[s.goalBtn, goal===g && s.goalBtnActive]} activeOpacity={0.75}>
            <Text style={[s.goalBtnText, goal===g && s.goalBtnTextActive]}>×{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.tapArea}>
        <Animated.View style={{ transform:[{scale:scaleAnim}] }}>
          <Pressable onPress={tap} style={s.tapButton}>
            <View style={s.tapInner}>
              <BeadsIcon size={56} color={Colors.gold} />
            </View>
          </Pressable>
        </Animated.View>
      </View>

      <TouchableOpacity onPress={reset} style={s.resetBtn} activeOpacity={0.7}>
        <Text style={s.resetText}>↺  {t('reset')}</Text>
      </TouchableOpacity>

      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPicker(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setPicker(false)}>
          <View style={s.sheet} onStartShouldSetResponder={() => true}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{t('chooseDhikr')}</Text>
            <ScrollView>
              {DHIKR.map((d,i) => (
                <TouchableOpacity key={d.en} onPress={() => { setIdx(i); setPicker(false); }} style={[s.dhikrRow, idx===i && s.dhikrRowActive]} activeOpacity={0.7}>
                  <View style={{ flex:1, gap:2 }}>
                    <ArabicText size={20} color={idx===i?Colors.gold:Colors.textPrimary}>{d.ar}</ArabicText>
                    <Text style={s.dhikrRowEn}>{d.en}</Text>
                  </View>
                  <Text style={s.dhikrRowGoal}>×{d.goal}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ height:24 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.background },
  header: { alignItems:'center', paddingTop:20, paddingBottom:4, gap:4 },
  title: { fontSize:FontSize.xl, fontWeight:'600', color:Colors.textPrimary },
  pickerBtn: { paddingVertical:4, paddingHorizontal:12 },
  pickerBtnText: { fontSize:FontSize.sm, color:Colors.gold, fontWeight:'500' },
  dhikrCard: { marginHorizontal:Spacing.lg, marginTop:Spacing.md, backgroundColor:Colors.card, borderRadius:Radius.xl, borderWidth:1, borderColor:Colors.goldBorder, padding:Spacing.xl, alignItems:'center', gap:4 },
  dhikrEn: { fontSize:FontSize.lg, fontWeight:'600', color:Colors.textPrimary },
  dhikrTrans: { fontSize:FontSize.sm, color:Colors.textSecondary },
  countArea: { alignItems:'center', justifyContent:'center', marginTop:Spacing.xl, height:200 },
  pulseRing: { position:'absolute', backgroundColor:'rgba(201,168,76,0.1)', borderWidth:2, borderColor:Colors.goldBorder },
  svgRing: { position:'absolute', borderColor:Colors.borderSoft },
  countCenter: { alignItems:'center' },
  countNum: { fontSize:72, fontWeight:'200', color:Colors.textPrimary, letterSpacing:-3, lineHeight:78 },
  countGoal: { fontSize:FontSize.md, color:Colors.textSecondary },
  setsText: { fontSize:FontSize.sm, color:Colors.gold, marginTop:2 },
  goalRow: { flexDirection:'row', justifyContent:'center', gap:10, marginTop:Spacing.lg },
  goalBtn: { paddingHorizontal:20, paddingVertical:9, borderRadius:Radius.md, borderWidth:1, borderColor:Colors.borderSoft, backgroundColor:Colors.card },
  goalBtnActive: { borderColor:Colors.gold, backgroundColor:Colors.goldMuted },
  goalBtnText: { fontSize:FontSize.md, color:Colors.textSecondary },
  goalBtnTextActive: { color:Colors.gold, fontWeight:'600' },
  tapArea: { alignItems:'center', marginTop:Spacing.xl },
  tapButton: { width:150, height:150, borderRadius:75, backgroundColor:Colors.card, borderWidth:1.5, borderColor:Colors.goldBorder, alignItems:'center', justifyContent:'center', shadowColor:Colors.gold, shadowOpacity:0.15, shadowRadius:20, shadowOffset:{width:0,height:4}, elevation:8 },
  tapInner: { alignItems:'center', justifyContent:'center' },
  resetBtn: { alignSelf:'center', marginTop:Spacing.lg, padding:Spacing.md },
  resetText: { fontSize:FontSize.md, color:Colors.textSecondary },
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' },
  sheet: { backgroundColor:Colors.card, borderTopLeftRadius:24, borderTopRightRadius:24, paddingTop:12, paddingHorizontal:Spacing.lg, maxHeight:'70%' },
  handle: { width:40, height:4, borderRadius:2, backgroundColor:Colors.textSecondary, alignSelf:'center', marginBottom:16 },
  sheetTitle: { fontSize:FontSize.xl, fontWeight:'600', color:Colors.textPrimary, marginBottom:Spacing.lg, textAlign:'center' },
  dhikrRow: { flexDirection:'row', alignItems:'center', paddingVertical:14, paddingHorizontal:12, borderRadius:Radius.md, gap:12, marginBottom:4 },
  dhikrRowActive: { backgroundColor:'rgba(201,168,76,0.08)' },
  dhikrRowEn: { fontSize:FontSize.sm, color:Colors.textSecondary },
  dhikrRowGoal: { fontSize:FontSize.sm, color:Colors.gold, fontWeight:'500' },
});
