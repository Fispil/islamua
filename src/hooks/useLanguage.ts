// src/hooks/useLanguage.ts
// Global language state — read anywhere with useTranslation()
// Persists to AsyncStorage so language survives app restarts

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKey } from '../constants/i18n';

const LANG_KEY = 'app_language';

// ── Context ────────────────────────────────────────────────────────────────
interface LangContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
}

import { createContext as RC } from 'react';
export const LanguageContext = RC<LangContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key) => translations.en[key] as string,
});

// ── Provider hook (used once in _layout.tsx) ───────────────────────────────
export function useLanguageProvider() {
  const [language, setLangState] = useState<Language>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved === 'en' || saved === 'uk') setLangState(saved);
      setLoaded(true);
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLangState(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const val = translations[language][key];
      return (val as string) ?? (translations.en[key] as string) ?? key;
    },
    [language]
  );

  return { language, setLanguage, t, loaded };
}

// ── Consumer hook (used in every screen/component) ─────────────────────────
export function useTranslation() {
  return useContext(LanguageContext).t;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return { language: ctx.language, setLanguage: ctx.setLanguage };
}
