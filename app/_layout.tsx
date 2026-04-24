// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useLanguageProvider, LanguageContext } from '../src/hooks/useLanguage';
import { hydrateWidgetFromCache } from '../src/services/widgetService';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
  const { language, setLanguage, t, loaded } = useLanguageProvider();

  // Write fresh widget data IMMEDIATELY on app boot using cached timings.
  // This fixes widget showing placeholder when user just added widget but
  // hasn't yet opened the app today. Runs in background, doesn't block UI.
  useEffect(() => {
    hydrateWidgetFromCache();
  }, []);

  if (!loaded) return null;

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
