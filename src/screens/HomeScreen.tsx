// src/screens/HomeScreen.tsx
import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useTranslation } from '../hooks/useLanguage';
import { enableNotifications, disableNotifications } from '../services/notificationService';
import IslamicHeader from '../components/IslamicHeader';
import NextPrayerCard from '../components/NextPrayerCard';
import PrayerTile from '../components/PrayerTile';
import WidgetsGrid from '../components/WidgetsGrid';
import NotifBanner from '../components/NotifBanner';
import { SectionLabel } from '../components/ui';
import { Colors } from '../constants/theme';

export default function HomeScreen() {
  const t = useTranslation();
  const {
    prayers, dayData, location,
    nextPrayer, currentPrayer,
    countdown, progress,
    loading, error,
    notifEnabled, prayerNotifs,
    refresh,
    togglePrayerNotif,
    setNotifEnabledState,
    reloadNotifSettings,
  } = usePrayerTimes();

  const [showBanner, setShowBanner] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleEnableNotif = async () => {
    const ok = await enableNotifications(prayers);
    if (!ok) {
      Alert.alert(t('permissionRequired'), t('permissionMsg'), [{ text: t('ok') }]);
    } else {
      setShowBanner(false);
      setNotifEnabledState(true);
      // Re-read settings so prayerNotifs also updates
      await reloadNotifSettings();
    }
  };

  if (loading && !prayers.length) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.loadingAr}>اللَّهُ أَكْبَرُ</Text>
          <Text style={s.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        <IslamicHeader location={location} dayData={dayData} />

        {error && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {showBanner && !notifEnabled && (
          <NotifBanner
            onEnable={handleEnableNotif}
            onDismiss={() => setShowBanner(false)}
          />
        )}

        {nextPrayer && (
          <NextPrayerCard
            nextPrayer={nextPrayer}
            currentPrayer={currentPrayer}
            countdown={countdown}
            progress={progress}
          />
        )}

        <SectionLabel text={t('todaysPrayers')} />
        <View style={s.list}>
          {prayers.map(prayer => (
            <PrayerTile
              key={prayer.name}
              prayer={prayer}
              isNext={nextPrayer?.name === prayer.name}
              notifEnabled={prayerNotifs[prayer.name] ?? false}
              showToggle={notifEnabled && prayer.isNotifiable}
              // ← instant: no refresh(), just toggle local state + background save
              onToggle={() => togglePrayerNotif(prayer.name)}
            />
          ))}
        </View>
        <View style={{ height: 12 }} />
        {dayData && <WidgetsGrid dayData={dayData} prayers={prayers} location={location} countdown={countdown} progress={progress} />}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  scroll:      { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingAr:   { fontFamily: 'serif', fontSize: 28, color: Colors.gold },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  errorBanner: { marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(229,62,62,0.1)', borderWidth: 1, borderColor: 'rgba(229,62,62,0.3)', borderRadius: 12, padding: 12 },
  errorText:   { fontSize: 13, color: '#FC8181' },
  list:        { paddingHorizontal: 16, marginBottom: 8 },
});
