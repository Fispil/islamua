// app/_layout.tsx
//
// Тримає splash screen видимим доки:
//   1. Контекст мови ініціалізований
//   2. AsyncStorage cache читається
//   3. Часи молитов завантажені (з кешу або API)
//   4. Віджет оновлений
//
// Тільки після цього splash зникає і відкривається готовий до використання
// додаток. Користувач не бачить порожнього екрану з "Loading..."

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useLanguageProvider, LanguageContext } from '../src/hooks/useLanguage';
import { hydrateWidgetFromCache } from '../src/services/widgetService';
import { preloadPrayerData } from '../src/services/preloadService';
import { Colors } from '../src/constants/theme';

// Запобігаємо автоматичному прибиранню splash screen
// Splash залишається видимим доки ми явно не викличемо hideAsync()
SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore — splash може бути вже не активний на деяких пристроях
});

// Тримаємо splash 200мс після того як готові — щоб не було різкого переходу
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function RootLayout() {
  const { language, setLanguage, t, loaded: langLoaded } = useLanguageProvider();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Чекаємо доки контекст мови готовий
        if (!langLoaded) return;

        // Паралельно: 
        // 1. Оновлюємо віджет із кешу (швидко, <100мс)
        // 2. Завантажуємо часи молитов (з кешу якщо свіжий, інакше API)
        await Promise.all([
          hydrateWidgetFromCache(),
          preloadPrayerData(),
        ]);
      } catch (e) {
        // Якщо щось зламалось — все одно продовжуємо.
        // Користувач побачить fallback стан в HomeScreen.
        console.warn('Preload failed:', e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, [langLoaded]);

  // Ховаємо splash тільки коли реально все готово
  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  // Поки готуємось — рендеримо null, splash залишається на екрані
  if (!langLoaded || !appReady) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </LanguageContext.Provider>
  );
}
