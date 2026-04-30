// src/constants/i18n.ts
// Complete translations for English (en) and Ukrainian (uk)
// Usage: import { useTranslation } from '../hooks/useLanguage';
//        const t = useTranslation();
//        t('nextPrayer') => 'Next Prayer' or 'Наступна молитва'

export type Language = 'en' | 'uk';

export type TranslationKey = keyof typeof translations.en;

export const translations = {
  en: {
    // ── App general ──────────────────────────────────────────────
    appName: 'Prayer Times',

    // ── Header ───────────────────────────────────────────────────
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
    bismillahTranslation: 'In the name of Allah, the Most Gracious, the Most Merciful',
    locating: 'Locating...',
    ramadanMubarak: 'Ramadan Mubarak  رمضان كريم',

    // ── Prayer names ──────────────────────────────────────────────
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',

    // ── Home screen ───────────────────────────────────────────────
    nextPrayer: 'NEXT PRAYER',
    remaining: 'remaining',
    todaysPrayers: "TODAY'S PRAYERS",
    widgets: 'WIDGETS',
    pullToRefresh: 'Pull down to refresh',

    // ── Next prayer card ──────────────────────────────────────────
    loading: 'Loading prayer times...',
    errorMsg: 'Unable to fetch prayer times. Check your connection.',
    errorPull: 'Something went wrong. Pull to refresh.',

    // ── Notification banner ───────────────────────────────────────
    enableReminders: 'Enable Prayer Reminders',
    enableRemindersDesc: 'Get notified at each prayer time',
    enable: 'Enable',

    // ── Widgets ───────────────────────────────────────────────────
    qibla: 'QIBLA',
    qiblaFull: 'Qibla Direction',
    hijriDate: 'HIJRI DATE',
    fasting: 'FASTING',
    fastingWindow: 'window',
    today: 'TODAY',
    prayers: 'prayers',
    kmToMecca: 'km to Mecca',

    // ── Qibla screen ──────────────────────────────────────────────
    qiblaDirectionAr: 'اتجاه القبلة',
    yourLocation: 'Your Location',
    gettingLocation: 'Getting location...',
    facingQibla: 'Facing Qibla',
    rotateQibla: 'Rotate to find Qibla',
    distanceToMecca: 'Distance to Mecca',
    masjidAlHaram: 'Masjid al-Haram, Mecca',
    fromNorth: 'from North (clockwise)',
    yourCoords: 'Your coordinates',
    degreesN: '°N',
    degreesE: '°E',

    // ── Tasbih screen ─────────────────────────────────────────────
    tasbihCounter: 'Tasbih Counter',
    chooseDhikr: 'Choose Dhikr',
    chooseDhikrBtn: 'Choose Dhikr  ›',
    reset: 'Reset',
    sets: 'sets',
    set: 'set',
    complete: 'complete',
    remaining2: 'remaining',
    glorBeToAllah: 'Glory be to Allah',
    praiseAllah: 'Praise be to Allah',
    allahGreatest: 'Allah is the Greatest',
    seekForgiveness: 'I seek forgiveness from Allah',
    noGodButAllah: 'There is no god but Allah',
    blessingsOnProphet: 'Blessings upon the Prophet ﷺ',

    // ── Calendar screen ───────────────────────────────────────────
    prayerCalendar: 'Prayer Calendar',
    loadingCalendar: 'Loading calendar...',
    noData: 'No data available',
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
    fri: 'Fri', sat: 'Sat', sun: 'Sun',

    // ── Settings screen ───────────────────────────────────────────
    settings: 'Settings',
    notifications: 'NOTIFICATIONS',
    prayerNotifications: 'Prayer Notifications',
    prayerNotifDesc: 'Adhan at prayer time + reminder 15 min before',
    testNotifications: 'TEST NOTIFICATIONS',
    testNotifInfo: 'Tap a button to instantly receive a sample notification — no need to wait for prayer time.',
    sendTestAdhan: 'Send Test Adhan',
    sendTestAdhanDesc: 'Fires immediately — simulates prayer time',
    sendTestReminder: 'Send Test Reminder',
    sendTestReminderDesc: 'Fires immediately — simulates 15-min warning',
    send: 'Send',
    calculationMethod: 'CALCULATION METHOD',
    muslimWorldLeague: 'Muslim World League',
    isna: 'Islamic Society of North America',
    egyptian: 'Egyptian General Authority',
    ummAlQura: 'Umm Al-Qura, Makkah',
    karachi: 'Univ. of Islamic Sciences, Karachi',
    about: 'ABOUT',
    prayerTimesApi: 'Prayer Times API',
    poweredByAladhan: 'Powered by AlAdhan.com',
    version: 'Version',
    language: 'LANGUAGE',
    languageLabel: 'App Language',
    languageDesc: 'Choose display language',
    english: 'English',
    ukrainian: 'Українська',

    // ── Dua ───────────────────────────────────────────────────────
    duaAr: 'رَبَّنَا تَقَبَّلْ مِنَّا',
    duaTranslation: '"Our Lord, accept from us"',

    // ── Permission alerts ─────────────────────────────────────────
    permissionRequired: 'Permission Required',
    permissionMsg: 'Please enable notifications in Settings → Notifications.',
    ok: 'OK',

    // ── Months ───────────────────────────────────────────────────
    january: 'January', february: 'February', march: 'March',
    april: 'April', may: 'May', june: 'June',
    july: 'July', august: 'August', september: 'September',
    october: 'October', november: 'November', december: 'December',

    // ── Weekdays ─────────────────────────────────────────────────
    sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday',
    wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday',
    saturday: 'Saturday',

    // ── Tab bar ──────────────────────────────────────────────────
    tabPrayer: 'Prayer',
    tabQibla: 'Qibla',
    tabTasbih: 'Tasbih',
    tabCalendar: 'Calendar',
    tabSettings: 'Settings',
    tabQuran: 'Quran',

    // ── Notification content ──────────────────────────────────────
    notifAdhanTitle: 'Prayer',
    notifAdhanBody: 'It is time for prayer.',
    notifReminderTitle: 'in 15 minutes',
    notifReminderBody: 'prayer starts at',
    notifTimeToPrepare: 'Time to prepare.',
  },

  uk: {
    // ── App general ──────────────────────────────────────────────
    appName: 'Час Молитви',

    // ── Header ───────────────────────────────────────────────────
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
    bismillahTranslation: 'В ім\'я Аллаха, Милостивого, Милосердного',
    locating: 'Визначення місця...',
    ramadanMubarak: 'Рамадан Мубарак  رمضان كريم',

    // ── Prayer names ──────────────────────────────────────────────
    fajr: 'Фаджр',
    sunrise: 'Схід сонця',
    dhuhr: 'Зухр',
    asr: 'Аср',
    maghrib: 'Магріб',
    isha: 'Іша',

    // ── Home screen ───────────────────────────────────────────────
    nextPrayer: 'НАСТУПНА МОЛИТВА',
    remaining: 'залишилось',
    todaysPrayers: 'МОЛИТВИ СЬОГОДНІ',
    widgets: 'ВІДЖЕТИ',
    pullToRefresh: 'Потягніть вниз для оновлення',

    // ── Next prayer card ──────────────────────────────────────────
    loading: 'Завантаження часу молитов...',
    errorMsg: 'Не вдалося отримати час молитов. Перевірте з\'єднання.',
    errorPull: 'Щось пішло не так. Потягніть для оновлення.',

    // ── Notification banner ───────────────────────────────────────
    enableReminders: 'Увімкнути нагадування',
    enableRemindersDesc: 'Отримуйте сповіщення в час кожної молитви',
    enable: 'Увімкнути',

    // ── Widgets ───────────────────────────────────────────────────
    qibla: 'КІБЛА',
    qiblaFull: 'Напрямок Кібли',
    hijriDate: 'ХІДЖРІ ДАТА',
    fasting: 'ПІСТ',
    fastingWindow: 'вікно',
    today: 'СЬОГОДНІ',
    prayers: 'молитви',
    kmToMecca: 'км до Мекки',

    // ── Qibla screen ──────────────────────────────────────────────
    qiblaDirectionAr: 'اتجاه القبلة',
    yourLocation: 'Ваше місцезнаходження',
    gettingLocation: 'Визначення місця...',
    facingQibla: 'Обличчям до Кібли',
    rotateQibla: 'Повертайте, щоб знайти Кіблу',
    distanceToMecca: 'Відстань до Мекки',
    masjidAlHaram: 'Масджид аль-Харам, Мекка',
    fromNorth: 'від Півночі (за годинниковою стрілкою)',
    yourCoords: 'Ваші координати',
    degreesN: '°Пн',
    degreesE: '°Сх',

    // ── Tasbih screen ─────────────────────────────────────────────
    tasbihCounter: 'Лічильник Тасбіху',
    chooseDhikr: 'Вибрати Зікр',
    chooseDhikrBtn: 'Вибрати Зікр  ›',
    reset: 'Скинути',
    sets: 'підходів',
    set: 'підхід',
    complete: 'завершено',
    remaining2: 'залишилось',
    glorBeToAllah: 'Слава Аллаху',
    praiseAllah: 'Хвала Аллаху',
    allahGreatest: 'Аллах Найвеличніший',
    seekForgiveness: 'Прошу прощення у Аллаха',
    noGodButAllah: 'Немає бога крім Аллаха',
    blessingsOnProphet: 'Благословення на Пророка ﷺ',

    // ── Calendar screen ───────────────────────────────────────────
    prayerCalendar: 'Календар молитов',
    loadingCalendar: 'Завантаження календаря...',
    noData: 'Дані недоступні',
    mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт',
    fri: 'Пт', sat: 'Сб', sun: 'Нд',

    // ── Settings screen ───────────────────────────────────────────
    settings: 'Налаштування',
    notifications: 'СПОВІЩЕННЯ',
    prayerNotifications: 'Сповіщення про молитви',
    prayerNotifDesc: 'Азан у час молитви + нагадування за 15 хв',
    testNotifications: 'ТЕСТ СПОВІЩЕНЬ',
    testNotifInfo: 'Натисніть кнопку щоб миттєво отримати тестове сповіщення — не чекайте часу молитви.',
    sendTestAdhan: 'Надіслати тест азану',
    sendTestAdhanDesc: 'Приходить миттєво — імітує час молитви',
    sendTestReminder: 'Надіслати тест нагадування',
    sendTestReminderDesc: 'Приходить миттєво — імітує попередження за 15 хв',
    send: 'Надіслати',
    calculationMethod: 'МЕТОД РОЗРАХУНКУ',
    muslimWorldLeague: 'Ліга Мусульманського Світу',
    isna: 'Ісламське Товариство Північної Америки',
    egyptian: 'Єгипетський комітет дослідження',
    ummAlQura: 'Університет Умм аль-Кура, Мекка',
    karachi: 'Університет ісламських наук, Карачі',
    about: 'ПРО ДОДАТОК',
    prayerTimesApi: 'API часу молитов',
    poweredByAladhan: 'На основі AlAdhan.com',
    version: 'Версія',
    language: 'Мова',
    languageLabel: 'Мова додатку',
    languageDesc: 'Оберіть мову відображення',
    english: 'English',
    ukrainian: 'Українська',

    // ── Dua ───────────────────────────────────────────────────────
    duaAr: 'رَبَّنَا تَقَبَّلْ مِنَّا',
    duaTranslation: '"Господи наш, прийми дари від нас"',

    // ── Permission alerts ─────────────────────────────────────────
    permissionRequired: 'Потрібен дозвіл',
    permissionMsg: 'Увімкніть сповіщення в Налаштування → Сповіщення.',
    ok: 'OK',

    // ── Months ───────────────────────────────────────────────────
    january: 'Січень', february: 'Лютий', march: 'Березень',
    april: 'Квітень', may: 'Травень', june: 'Червень',
    july: 'Липень', august: 'Серпень', september: 'Вересень',
    october: 'Жовтень', november: 'Листопад', december: 'Грудень',

    // ── Weekdays ─────────────────────────────────────────────────
    sunday: 'Неділя', monday: 'Понеділок', tuesday: 'Вівторок',
    wednesday: 'Середа', thursday: 'Четвер', friday: 'П\'ятниця',
    saturday: 'Субота',

    // ── Tab bar ──────────────────────────────────────────────────
    tabPrayer: 'Молитва',
    tabQibla: 'Кібла',
    tabTasbih: 'Тасбіх',
    tabCalendar: 'Календар',
    tabQuran: 'Коран',
    tabSettings: 'Параметри',

    // ── Notification content ──────────────────────────────────────
    notifAdhanTitle: 'Молитва',
    notifAdhanBody: 'Настав час молитви.',
    notifReminderTitle: 'через 15 хвилин',
    notifReminderBody: 'Молитва починається о',
    notifTimeToPrepare: 'Час підготуватись.',
  },
} as const;
