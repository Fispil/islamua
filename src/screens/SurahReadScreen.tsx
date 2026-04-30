// src/screens/SurahReadScreen.tsx
//
// Displays all verses of a single surah:
//   - Header: surah name, transliteration, ayah count
//   - Bismillah (except surah 1 where it's part of verses, and surah 9 where it's omitted)
//   - List of verses: arabic + chosen translation
//   - Translation language toggle (UA / EN)
//   - Font size adjustment

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { useLanguage } from '../hooks/useLanguage';
import { getSurahMeta, getSurahVerses } from '../services/quranService';
import { SurahMeta, Verse, TranslationLang } from '../models/quran';

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';

export default function SurahReadScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const router = useRouter();
  const { language } = useLanguage();

  const surahNum = Number(surahId);
  const [meta, setMeta] = useState<SurahMeta | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [translLang, setTranslLang] = useState<TranslationLang>(
    language === 'uk' ? 'uk' : 'en'
  );
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const m = await getSurahMeta(surahNum);
      if (!alive) return;
      setMeta(m);
      const v = await getSurahVerses(surahNum, translLang);
      if (!alive) return;
      setVerses(v);
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [surahNum, translLang]);

  if (!loaded || !meta) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const showBismillah = meta.number !== 1 && meta.number !== 9;
  const arSize = { sm: 22, md: 28, lg: 34 }[fontSize];
  const trSize = { sm: 13, md: 15, lg: 17 }[fontSize];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>←</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {meta.number}. {language === 'uk' ? meta.nameUk : meta.nameEn}
          </Text>
          <Text style={styles.headerSub}>
            {meta.nameTransliteration} · {meta.ayahs}{' '}
            {language === 'uk' ? 'аятів' : 'verses'}
          </Text>
        </View>

        <Text style={styles.headerArabic}>{meta.nameAr}</Text>
      </View>

      <View style={styles.controls}>
        {/* Translation language toggle */}
        <View style={styles.segment}>
          <SegmentButton
            label="UA"
            active={translLang === 'uk'}
            onPress={() => setTranslLang('uk')}
          />
          <SegmentButton
            label="EN"
            active={translLang === 'en'}
            onPress={() => setTranslLang('en')}
          />
        </View>

        {/* Font size toggle */}
        <View style={styles.segment}>
          <SegmentButton
            label="A−"
            active={fontSize === 'sm'}
            onPress={() => setFontSize('sm')}
          />
          <SegmentButton
            label="A"
            active={fontSize === 'md'}
            onPress={() => setFontSize('md')}
          />
          <SegmentButton
            label="A+"
            active={fontSize === 'lg'}
            onPress={() => setFontSize('lg')}
          />
        </View>
      </View>

      <FlatList
        data={verses}
        keyExtractor={(v) => `${v.surah}:${v.verse}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          showBismillah ? (
            <View style={styles.bismillahWrap}>
              <Text style={[styles.bismillah, { fontSize: arSize + 2 }]}>
                {BISMILLAH}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.verseCard}>
            <View style={styles.verseHeader}>
              <View style={styles.verseNumCircle}>
                <Text style={styles.verseNumText}>{item.verse}</Text>
              </View>
            </View>
            <Text
              style={[styles.verseArabic, { fontSize: arSize, lineHeight: arSize * 1.8 }]}
            >
              {item.ar}
            </Text>
            <Text
              style={[styles.verseTrans, { fontSize: trSize, lineHeight: trSize * 1.5 }]}
            >
              {item.translation}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segBtn, active && styles.segBtnActive]}
      android_ripple={{ color: '#ffffff20' }}
    >
      <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  back: { color: Colors.textPrimary, fontSize: 28, paddingHorizontal: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  headerSub: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  headerArabic: { color: Colors.gold, fontSize: 20, marginLeft: 8 },

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 3,
  },
  segBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  segBtnActive: { backgroundColor: 'rgba(212, 168, 67, 0.22)' },
  segBtnText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  segBtnTextActive: { color: Colors.goldLight },

  list: { paddingHorizontal: 12, paddingBottom: 32 },

  bismillahWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  bismillah: {
    color: Colors.gold,
    textAlign: 'center',
  },

  verseCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  verseHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  verseNumCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 168, 67, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 67, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseNumText: { color: Colors.goldLight, fontWeight: '700', fontSize: 13 },

  verseArabic: {
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  verseTrans: {
    color: Colors.textPrimary,
    opacity: 0.92,
  },
});
