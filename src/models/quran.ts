// src/models/quran.ts

export interface SurahMeta {
  number: number;              // 1-114
  ayahs: number;               // verse count
  nameAr: string;              // الفاتحة
  nameTransliteration: string; // Al-Fatiha
  nameUk: string;              // Аль-Фатіха
  nameEn: string;              // The Opening
}

export interface QuranData {
  meta: {
    version: number;
    generated: string;
    sources: { ar: string; uk: string; en: string };
    surahs: SurahMeta[];
  };
  ar: Record<string, string>; // "1:1" → arabic text
  uk: Record<string, string>; // "1:1" → ukrainian text
  en: Record<string, string>; // "1:1" → english text
}

export type TranslationLang = 'uk' | 'en';

export interface Verse {
  surah: number;
  verse: number;
  ar: string;
  translation: string;
}
