// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { loadSettings, enableNotifications, disableNotifications, togglePrayerNotif } from '../services/notificationService';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useTranslation, useLanguage } from '../hooks/useLanguage';
import { ArabicText } from '../components/ui';
import { BellIcon, ApiIcon, PhoneIcon, TimerIcon, CheckIcon, LanguageIcon } from '../components/AppIcons';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';

const PRAYER_NAMES = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];

export default function SettingsScreen() {
  const t = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { prayers } = usePrayerTimes();
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [prayerToggles, setPrayerToggles] = useState<Record<string,boolean>>({});
  const [calcMethod, setCalcMethod]       = useState(3);
  const [testSent, setTestSent]           = useState<'adhan'|'reminder'|null>(null);

  const METHODS = [
    { id:3, label:t('muslimWorldLeague') },
    { id:2, label:t('isna') },
    { id:5, label:t('egyptian') },
    { id:4, label:t('ummAlQura') },
    { id:1, label:t('karachi') },
  ];

    // Load on mount
  useEffect(() => {
    loadSettings().then(s => {
      setMasterEnabled(s.masterEnabled);
      setPrayerToggles(s.prayers);
    });
  }, []);

  // Re-read whenever screen comes back into focus (e.g. toggled from HomeScreen)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadSettings().then(s => {
          setMasterEnabled(s.masterEnabled);
          setPrayerToggles(s.prayers);
        });
      }
    });
    return () => sub.remove();
  }, []);

  async function handleMasterToggle(val: boolean) {
    if (val) {
      const granted = await enableNotifications(prayers);
      if (!granted) { Alert.alert(t('permissionRequired'), t('permissionMsg'), [{text:t('ok')}]); return; }
      setMasterEnabled(true);
    } else { await disableNotifications(); setMasterEnabled(false); }
  }

  async function handlePrayerToggle(name: string, val: boolean) {
    await togglePrayerNotif(name, val, prayers);
    setPrayerToggles(prev => ({ ...prev, [name]:val }));
  }

  async function sendTestAdhan() {
    await Notifications.scheduleNotificationAsync({
      content: { title:`الفجر  —  Fajr`, body:`${t('notifAdhanBody')} 05:39\n\nاللَّهُ أَكْبَرُ`, sound:'default', color:'#C9A84C' },
      trigger: null,
    });
    setTestSent('adhan'); setTimeout(() => setTestSent(null), 3000);
  }

  async function sendTestReminder() {
    await Notifications.scheduleNotificationAsync({
      content: { title:`Fajr ${t('notifReminderTitle')}`, body:`الفجر — ${t('notifReminderBody')} 05:39. ${t('notifTimeToPrepare')}`, sound:'default', color:'#C9A84C' },
      trigger: null,
    });
    setTestSent('reminder'); setTimeout(() => setTestSent(null), 3000);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{t('settings')}</Text>
          <ArabicText size={14} color={Colors.textSecondary}>{t('settings') === 'Налаштування' ? 'الإعدادات' : 'الإعدادات'}</ArabicText>
        </View>

        {/* ── Language switcher ── */}
        <Text style={s.sectionLabel}>{t('language')}</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={s.iconBox}><LanguageIcon size={18} color={Colors.gold} /></View>
              <View>
                <Text style={s.rowTitle}>{t('languageLabel')}</Text>
                <Text style={s.rowSub}>{t('languageDesc')}</Text>
              </View>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.langRow}>
            {(['en','uk'] as const).map(lang => (
              <TouchableOpacity key={lang} onPress={() => setLanguage(lang)} style={[s.langBtn, language===lang && s.langBtnActive]} activeOpacity={0.75}>
                <Text style={[s.langBtnText, language===lang && s.langBtnTextActive]}>
                  {lang==='en' ? t('english') : t('ukrainian')}
                </Text>
                {language===lang && <CheckIcon size={14} color={Colors.gold} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Notifications ── */}
        <Text style={s.sectionLabel}>{t('notifications')}</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={s.iconBox}><BellIcon size={18} color={Colors.gold} /></View>
              <View>
                <Text style={s.rowTitle}>{t('prayerNotifications')}</Text>
                <Text style={s.rowSub}>{t('prayerNotifDesc')}</Text>
              </View>
            </View>
            <Switch value={masterEnabled} onValueChange={handleMasterToggle}
              trackColor={{false:Colors.borderMedium,true:'rgba(76,175,122,0.35)'}}
              thumbColor={masterEnabled?Colors.green:'#888'} ios_backgroundColor={Colors.borderMedium} />
          </View>
          {masterEnabled && (
            <>
              <View style={s.divider} />
              {PRAYER_NAMES.map(name => (
                <View key={name} style={s.subRow}>
                  <Text style={s.subRowLabel}>{name}</Text>
                  <Switch value={prayerToggles[name]??true} onValueChange={val=>handlePrayerToggle(name,val)}
                    trackColor={{false:Colors.borderMedium,true:'rgba(76,175,122,0.35)'}}
                    thumbColor={(prayerToggles[name]??true)?Colors.green:'#888'} ios_backgroundColor={Colors.borderMedium}
                    style={{transform:[{scale:0.85}]}} />
                </View>
              ))}
            </>
          )}
        </View>

        {/* ── Test notifications ── */}
        <Text style={s.sectionLabel}>{t('testNotifications')}</Text>
        <View style={s.card}>
          <Text style={s.testInfo}>{t('testNotifInfo')}</Text>
          <View style={s.divider} />
          <TouchableOpacity onPress={sendTestAdhan} style={s.testBtn} activeOpacity={0.7}>
            <View style={s.testBtnLeft}>
              <View style={[s.testIconBox,{backgroundColor:'rgba(201,168,76,0.12)'}]}><BellIcon size={16} color={Colors.gold}/></View>
              <View>
                <Text style={s.rowTitle}>{t('sendTestAdhan')}</Text>
                <Text style={s.rowSub}>{t('sendTestAdhanDesc')}</Text>
              </View>
            </View>
            {testSent==='adhan' ? <CheckIcon size={18} color={Colors.green}/> : <View style={s.sendBtn}><Text style={s.sendBtnText}>{t('send')}</Text></View>}
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity onPress={sendTestReminder} style={s.testBtn} activeOpacity={0.7}>
            <View style={s.testBtnLeft}>
              <View style={[s.testIconBox,{backgroundColor:'rgba(76,175,122,0.1)'}]}><TimerIcon size={16} color={Colors.green}/></View>
              <View>
                <Text style={s.rowTitle}>{t('sendTestReminder')}</Text>
                <Text style={s.rowSub}>{t('sendTestReminderDesc')}</Text>
              </View>
            </View>
            {testSent==='reminder' ? <CheckIcon size={18} color={Colors.green}/> : <View style={[s.sendBtn,{backgroundColor:Colors.green}]}><Text style={s.sendBtnText}>{t('send')}</Text></View>}
          </TouchableOpacity>
        </View>

        {/* ── Calculation method ── */}
        <Text style={s.sectionLabel}>{t('calculationMethod')}</Text>
        <View style={s.card}>
          {METHODS.map((m,i) => (
            <React.Fragment key={m.id}>
              {i>0 && <View style={s.divider}/>}
              <TouchableOpacity onPress={()=>setCalcMethod(m.id)} style={s.methodRow} activeOpacity={0.7}>
                <Text style={s.methodLabel}>{m.label}</Text>
                {calcMethod===m.id && <CheckIcon size={18} color={Colors.gold}/>}
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* ── About ── */}
        <Text style={s.sectionLabel}>{t('about')}</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={s.iconBox}><ApiIcon size={18} color={Colors.gold}/></View>
              <View>
                <Text style={s.rowTitle}>{t('prayerTimesApi')}</Text>
                <Text style={s.rowSub}>{t('poweredByAladhan')}</Text>
              </View>
            </View>
          </View>
          <View style={s.divider}/>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={s.iconBox}><PhoneIcon size={18} color={Colors.gold}/></View>
              <View>
                <Text style={s.rowTitle}>{t('version')}</Text>
                <Text style={s.rowSub}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dua */}
        <View style={s.duaCard}>
          <ArabicText size={22} color={Colors.gold} style={{textAlign:'center'}}>{t('duaAr')}</ArabicText>
          <Text style={s.duaTrans}>{t('duaTranslation')}</Text>
        </View>
        <View style={{height:32}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.background },
  scroll: { paddingHorizontal:Spacing.lg, paddingTop:20 },
  header: { alignItems:'center', marginBottom:Spacing.xl, gap:4 },
  title: { fontSize:FontSize.xl, fontWeight:'600', color:Colors.textPrimary },
  sectionLabel: { fontSize:10, color:Colors.textSecondary, letterSpacing:1.2, fontWeight:'600', marginBottom:Spacing.sm, marginTop:Spacing.lg },
  card: { backgroundColor:Colors.card, borderRadius:Radius.lg, borderWidth:0.5, borderColor:Colors.borderSoft, overflow:'hidden' },
  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:Spacing.lg },
  rowLeft: { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  iconBox: { width:34, height:34, borderRadius:10, backgroundColor:'rgba(201,168,76,0.1)', alignItems:'center', justifyContent:'center' },
  rowTitle: { fontSize:FontSize.base, fontWeight:'500', color:Colors.textPrimary },
  rowSub: { fontSize:FontSize.xs, color:Colors.textSecondary, marginTop:1 },
  divider: { height:0.5, backgroundColor:Colors.borderSoft, marginHorizontal:Spacing.lg },
  subRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:10, paddingHorizontal:Spacing.xxl+4 },
  subRowLabel: { fontSize:FontSize.md, color:Colors.textPrimary },
  methodRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:Spacing.lg },
  methodLabel: { fontSize:FontSize.md, color:Colors.textPrimary, flex:1 },
  langRow: { flexDirection:'row', gap:10, padding:Spacing.lg },
  langBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:10, borderRadius:Radius.md, borderWidth:1, borderColor:Colors.borderSoft, backgroundColor:Colors.surface },
  langBtnActive: { borderColor:Colors.gold, backgroundColor:Colors.goldMuted },
  langBtnText: { fontSize:FontSize.md, color:Colors.textSecondary, fontWeight:'500' },
  langBtnTextActive: { color:Colors.gold },
  testInfo: { fontSize:FontSize.xs, color:Colors.textSecondary, lineHeight:18, padding:Spacing.lg, paddingBottom:Spacing.md },
  testBtn: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:Spacing.lg },
  testBtnLeft: { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  testIconBox: { width:34, height:34, borderRadius:10, alignItems:'center', justifyContent:'center' },
  sendBtn: { backgroundColor:Colors.gold, borderRadius:8, paddingHorizontal:14, paddingVertical:6 },
  sendBtnText: { fontSize:FontSize.xs, fontWeight:'700', color:Colors.background },
  duaCard: { marginTop:Spacing.xxl, backgroundColor:Colors.card, borderRadius:Radius.xl, borderWidth:1, borderColor:Colors.goldBorder, padding:Spacing.xxl, gap:8, alignItems:'center' },
  duaTrans: { fontSize:FontSize.sm, color:Colors.textSecondary, textAlign:'center' },
});
