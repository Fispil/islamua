// src/services/quranService.ts
//
// Loads bundled Quran data once and caches in memory.
// All Quran content is offline (assets/quran/quran-data.json) — no API calls.

import { QuranData, SurahMeta, Verse, TranslationLang } from '../models/quran';

let cached: QuranData | null = null;
let loading: Promise<QuranData> | null = null;

/**
 * Loads Quran data from bundled asset.
 * First call takes ~100-200ms (parsing JSON), subsequent calls are instant.
 */
export async function loadQuranData(): Promise<QuranData> {
  if (cached) return cached;
  if (loading) return loading;

  loading = (async () => {
    // Bundled with Metro bundler — included in app binary
    const data = require('../../assets/quran/quran-data.json') as QuranData;
    cached = data;
    return data;
  })();

  return loading;
}

/** Returns metadata for all 114 surahs (always fast — small data) */
export async function getAllSurahs(): Promise<SurahMeta[]> {
  const data = await loadQuranData();
  return data.meta.surahs;
}

/** Returns metadata for a specific surah */
export async function getSurahMeta(num: number): Promise<SurahMeta | null> {
  const data = await loadQuranData();
  return data.meta.surahs.find((s) => s.number === num) ?? null;
}

/**
 * Returns all verses of a given surah, with arabic + chosen translation.
 * Fast — just iterates 1..ayahs.
 */
export async function getSurahVerses(
  num: number,
  lang: TranslationLang = 'uk'
): Promise<Verse[]> {
  const data = await loadQuranData();
  const meta = data.meta.surahs.find((s) => s.number === num);
  if (!meta) return [];

  const verses: Verse[] = [];
  for (let v = 1; v <= meta.ayahs; v++) {
    const key = `${num}:${v}`;
    verses.push({
      surah: num,
      verse: v,
      ar: data.ar[key] ?? '',
      translation: data[lang][key] ?? '',
    });
  }
  return verses;
}

/** Search verses by translation text. Returns max 50 hits. */
export async function searchQuran(
  query: string,
  lang: TranslationLang = 'uk'
): Promise<Verse[]> {
  if (!query.trim() || query.trim().length < 3) return [];
  const data = await loadQuranData();
  const q = query.toLowerCase().trim();
  const hits: Verse[] = [];

  for (const [key, text] of Object.entries(data[lang])) {
    if (text.toLowerCase().includes(q)) {
      const [s, v] = key.split(':').map(Number);
      hits.push({
        surah: s,
        verse: v,
        ar: data.ar[key] ?? '',
        translation: text,
      });
      if (hits.length >= 50) break;
    }
  }
  return hits;
}
