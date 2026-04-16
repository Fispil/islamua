// src/components/ui.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '../constants/theme';

export function Card({ children, style, highlighted }: { children: React.ReactNode; style?: ViewStyle; highlighted?: boolean }) {
  return <View style={[styles.card, highlighted && styles.cardHl, style]}>{children}</View>;
}

export function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

export function GoldPill({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const W = onPress ? TouchableOpacity : View;
  return <W onPress={onPress} style={[styles.goldPill, style]} activeOpacity={0.7}>{children}</W>;
}

export function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={[styles.toggle, value && styles.toggleOn]}>
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </TouchableOpacity>
  );
}

export function ArabicText({ children, size=18, color=Colors.gold, style }: { children: string; size?: number; color?: string; style?: TextStyle }) {
  return <Text style={[{ fontFamily:'serif', fontSize:size, color, lineHeight:size*1.6 }, style]}>{children}</Text>;
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

export function IslamicPattern() {
  const sizes = [8,12,8,12,16,12,8,12,8];
  return (
    <View style={styles.pattern}>
      {sizes.map((s,i) => <View key={i} style={[styles.diamond, { width:s*0.7, height:s*0.7 }]} />)}
    </View>
  );
}

export function LiveDot() {
  return <View style={styles.liveDot} />;
}

const styles = StyleSheet.create({
  card: { backgroundColor:Colors.card, borderRadius:Radius.xl, borderWidth:0.5, borderColor:Colors.borderSoft, padding:Spacing.xl },
  cardHl: { borderColor:Colors.goldBorder, backgroundColor:Colors.cardHover },
  sectionLabel: { fontSize:FontSize.xs, color:Colors.textSecondary, letterSpacing:1.2, fontWeight:'600', marginBottom:Spacing.md, paddingHorizontal:Spacing.xl },
  goldPill: { flexDirection:'row', alignItems:'center', backgroundColor:Colors.goldMuted, borderWidth:1, borderColor:Colors.goldBorder, borderRadius:Radius.full, paddingHorizontal:14, paddingVertical:7 },
  toggle: { width:38, height:22, borderRadius:11, backgroundColor:Colors.borderMedium, justifyContent:'center', paddingHorizontal:2 },
  toggleOn: { backgroundColor:'rgba(76,175,122,0.35)', borderWidth:1, borderColor:Colors.green },
  thumb: { width:16, height:16, borderRadius:8, backgroundColor:'rgba(255,255,255,0.5)' },
  thumbOn: { transform:[{ translateX:16 }], backgroundColor:Colors.green },
  divider: { height:0.5, backgroundColor:Colors.borderSoft, marginVertical:Spacing.sm },
  pattern: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, marginVertical:Spacing.md },
  diamond: { backgroundColor:'rgba(201,168,76,0.3)', transform:[{ rotate:'45deg' }], borderRadius:1 },
  liveDot: { width:6, height:6, borderRadius:3, backgroundColor:Colors.green, shadowColor:Colors.green, shadowOpacity:1, shadowRadius:4, elevation:4 },
});
