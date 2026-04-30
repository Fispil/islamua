// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { PrayerTabIcon, QiblaTabIcon, TasbihTabIcon, CalendarTabIcon, QuranTabIcon, SettingsTabIcon } from '../../src/components/AppIcons';
import { Colors } from '../../src/constants/theme';
import { useTranslation } from '../../src/hooks/useLanguage';

function TabIcon({ focused, Icon, label }: { focused:boolean; Icon:any; label:string }) {
  const color = focused ? Colors.gold : Colors.textSecondary;
  return (
    <View style={s.tabItem}>
      <Icon size={24} color={color} />
      <Text style={[s.tabLabel, focused && s.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const t = useTranslation();
  return (
    <Tabs screenOptions={{ headerShown:false, tabBarStyle:s.tabBar, tabBarShowLabel:false }}>
      <Tabs.Screen name="index"    options={{ title:t('tabPrayer'),   tabBarIcon:({focused})=><TabIcon focused={focused} Icon={PrayerTabIcon}   label={t('tabPrayer')}   /> }} />
      <Tabs.Screen name="qibla"    options={{ title:t('tabQibla'),    tabBarIcon:({focused})=><TabIcon focused={focused} Icon={QiblaTabIcon}    label={t('tabQibla')}    /> }} />
      <Tabs.Screen name="tasbih"   options={{ title:t('tabTasbih'),   tabBarIcon:({focused})=><TabIcon focused={focused} Icon={TasbihTabIcon}   label={t('tabTasbih')}   /> }} />
      <Tabs.Screen name="calendar" options={{ title:t('tabCalendar'), tabBarIcon:({focused})=><TabIcon focused={focused} Icon={CalendarTabIcon} label={t('tabCalendar')} /> }} />
      <Tabs.Screen name="quran" options={{ title:t('tabQuran'), tabBarIcon:({focused})=><TabIcon focused={focused} Icon={QuranTabIcon} label={t('tabQuran')} /> }} />
      <Tabs.Screen name="settings" options={{ title:t('tabSettings'), tabBarIcon:({focused})=><TabIcon focused={focused} Icon={SettingsTabIcon} label={t('tabSettings')} /> }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: { backgroundColor:Colors.card, borderTopWidth:0.5, borderTopColor:Colors.goldBorder, height:72, paddingTop:15, paddingBottom:15, elevation:0, shadowOpacity:0, paddingLeft: 15, paddingRight: 15, justifyContent:'space-between' },
  tabItem: { alignItems:'center', justifyContent:'center', gap:1, width: 100 },
  tabLabel: { fontSize:9, color:Colors.textSecondary, fontWeight:'500', letterSpacing:0.3 },
  tabLabelActive: { color:Colors.gold },
});
