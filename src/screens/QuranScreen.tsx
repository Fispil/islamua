// src/screens/QuranScreen.tsx
//
// Main Quran screen — shows list of 114 surahs.
// Tapping a surah navigates to SurahReadScreen.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { useLanguage } from '../hooks/useLanguage';
import { getAllSurahs } from '../services/quranService';
import { SurahMeta } from '../models/quran';

export default function QuranScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [surahs, setSurahs] = useState<SurahMeta[] | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getAllSurahs().then(setSurahs);
  }, []);

  const filtered = useMemo(() => {
    if (!surahs) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter((s) => {
      const candidates = [
        String(s.number),
        s.nameAr,
        s.nameTransliteration,
        s.nameUk,
        s.nameEn,
      ].map((x) => x.toLowerCase());
      return candidates.some((c) => c.includes(q));
    });
  }, [surahs, filter]);

  const localizedName = (s: SurahMeta) =>
    language === 'uk' ? s.nameUk : s.nameEn;

  if (!surahs) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'uk' ? 'Коран' : 'Quran'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'uk' ? 'القرآن الكريم · 114 сур' : 'القرآن الكريم · 114 surahs'}
        </Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder={language === 'uk' ? 'Пошук сури…' : 'Search surah…'}
        placeholderTextColor={Colors.textMuted}
        value={filter}
        onChangeText={setFilter}
        autoCapitalize="none"
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.number)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push(`/quran/${item.number}`)}
            android_ripple={{ color: '#ffffff15' }}
          >
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>{item.number}</Text>
            </View>

            <View style={styles.rowContent}>
              <Text style={styles.rowName}>{localizedName(item)}</Text>
              <Text style={styles.rowMeta}>
                {item.nameTransliteration} · {item.ayahs}{' '}
                {language === 'uk' ? 'аятів' : 'verses'}
              </Text>
            </View>

            <Text style={styles.rowArabic}>{item.nameAr}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '700' },
  subtitle: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  search: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.cardHover,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 15,
  },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  rowPressed: { backgroundColor: Colors.cardHover },
  numberCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 168, 67, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 67, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberText: {
    color: Colors.goldLight,
    fontSize: 14,
    fontWeight: '700',
  },
  rowContent: { flex: 1 },
  rowName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  rowMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  rowArabic: {
    color: Colors.gold,
    fontSize: 22,
    marginLeft: 8,
    minWidth: 70,
    textAlign: 'right',
  },
});
