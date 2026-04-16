// src/components/NotifBanner.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BellIcon, CloseIcon } from './AppIcons';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';
import { useTranslation } from '../hooks/useLanguage';

interface Props { onEnable:()=>void; onDismiss:()=>void; }

export default function NotifBanner({ onEnable, onDismiss }: Props) {
  const t = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}><BellIcon size={18} color={Colors.gold} /></View>
      <View style={styles.text}>
        <Text style={styles.title}>{t('enableReminders')}</Text>
        <Text style={styles.sub}>{t('enableRemindersDesc')}</Text>
      </View>
      <TouchableOpacity onPress={onEnable} style={styles.btn} activeOpacity={0.8}>
        <Text style={styles.btnText}>{t('enable')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDismiss} style={styles.close} activeOpacity={0.7}>
        <CloseIcon size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection:'row', alignItems:'center', gap:12, marginHorizontal:Spacing.lg, marginBottom:Spacing.md, backgroundColor:'rgba(201,168,76,0.08)', borderWidth:1, borderColor:'rgba(201,168,76,0.3)', borderRadius:Radius.lg, padding:14 },
  iconBox: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(201,168,76,0.12)', alignItems:'center', justifyContent:'center' },
  text: { flex:1 },
  title: { fontSize:FontSize.sm, fontWeight:'600', color:Colors.goldLight },
  sub: { fontSize:FontSize.xs, color:Colors.textSecondary, marginTop:1 },
  btn: { backgroundColor:Colors.gold, borderRadius:Radius.sm, paddingHorizontal:14, paddingVertical:7 },
  btnText: { fontSize:FontSize.xs, fontWeight:'700', color:Colors.background },
  close: { padding:4 },
});
