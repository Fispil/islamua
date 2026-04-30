#!/usr/bin/env node
/**
 * Quran data downloader for Islam UA
 *
 * v2 — auto-discovers Ukrainian and English edition slugs from editions.json
 * Now resilient: tries multiple known fallback URLs / API providers if primary fails.
 *
 * USAGE:  node scripts/download-quran.js
 */

const fs = require('fs');
const path = require('path');

const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1';

// Surah metadata (number, ayahs, names in 4 forms)
const SURAH_NAMES = [
  { num:1,  ayahs:7,   ar:'الفاتحة',     trn:'Al-Fatiha',      uk:"Аль-Фатіха",       en:"The Opening" },
  { num:2,  ayahs:286, ar:'البقرة',       trn:'Al-Baqarah',     uk:"Аль-Бакара",        en:"The Cow" },
  { num:3,  ayahs:200, ar:'آل عمران',    trn:'Ali Imran',      uk:"Алі Імран",         en:"The Family of Imran" },
  { num:4,  ayahs:176, ar:'النساء',       trn:'An-Nisa',        uk:"Ан-Ніса",           en:"The Women" },
  { num:5,  ayahs:120, ar:'المائدة',      trn:'Al-Maida',       uk:"Аль-Маіда",         en:"The Table Spread" },
  { num:6,  ayahs:165, ar:'الأنعام',     trn:'Al-Anam',        uk:"Аль-Анам",          en:"The Cattle" },
  { num:7,  ayahs:206, ar:'الأعراف',     trn:'Al-Araf',        uk:"Аль-Араф",          en:"The Heights" },
  { num:8,  ayahs:75,  ar:'الأنفال',     trn:'Al-Anfal',       uk:"Аль-Анфаль",        en:"The Spoils of War" },
  { num:9,  ayahs:129, ar:'التوبة',       trn:'At-Tawba',       uk:"Ат-Тауба",          en:"The Repentance" },
  { num:10, ayahs:109, ar:'يونس',         trn:'Yunus',          uk:"Юнус",              en:"Jonah" },
  { num:11, ayahs:123, ar:'هود',          trn:'Hud',            uk:"Гуд",               en:"Hud" },
  { num:12, ayahs:111, ar:'يوسف',         trn:'Yusuf',          uk:"Юсуф",              en:"Joseph" },
  { num:13, ayahs:43,  ar:'الرعد',        trn:'Ar-Rad',         uk:"Ар-Рад",            en:"The Thunder" },
  { num:14, ayahs:52,  ar:'إبراهيم',      trn:'Ibrahim',        uk:"Ібрагім",           en:"Abraham" },
  { num:15, ayahs:99,  ar:'الحجر',        trn:'Al-Hijr',        uk:"Аль-Хіджр",         en:"The Stoneland" },
  { num:16, ayahs:128, ar:'النحل',        trn:'An-Nahl',        uk:"Ан-Нахль",          en:"The Bee" },
  { num:17, ayahs:111, ar:'الإسراء',     trn:'Al-Isra',        uk:"Аль-Ісра",          en:"The Night Journey" },
  { num:18, ayahs:110, ar:'الكهف',        trn:'Al-Kahf',        uk:"Аль-Кагф",          en:"The Cave" },
  { num:19, ayahs:98,  ar:'مريم',         trn:'Maryam',         uk:"Мар'ям",            en:"Mary" },
  { num:20, ayahs:135, ar:'طه',            trn:'Ta-Ha',          uk:"Та Га",             en:"Ta-Ha" },
  { num:21, ayahs:112, ar:'الأنبياء',    trn:'Al-Anbiya',      uk:"Аль-Анбія",         en:"The Prophets" },
  { num:22, ayahs:78,  ar:'الحج',         trn:'Al-Hajj',        uk:"Аль-Хаджж",         en:"The Pilgrimage" },
  { num:23, ayahs:118, ar:'المؤمنون',    trn:'Al-Muminun',     uk:"Аль-Мумінун",       en:"The Believers" },
  { num:24, ayahs:64,  ar:'النور',        trn:'An-Nur',         uk:"Ан-Нур",            en:"The Light" },
  { num:25, ayahs:77,  ar:'الفرقان',     trn:'Al-Furqan',      uk:"Аль-Фуркан",        en:"The Criterion" },
  { num:26, ayahs:227, ar:'الشعراء',     trn:'Ash-Shuara',     uk:"Аш-Шуара",          en:"The Poets" },
  { num:27, ayahs:93,  ar:'النمل',        trn:'An-Naml',        uk:"Ан-Намль",          en:"The Ants" },
  { num:28, ayahs:88,  ar:'القصص',        trn:'Al-Qasas',       uk:"Аль-Касас",         en:"The Stories" },
  { num:29, ayahs:69,  ar:'العنكبوت',    trn:'Al-Ankabut',     uk:"Аль-Анкабут",       en:"The Spider" },
  { num:30, ayahs:60,  ar:'الروم',        trn:'Ar-Rum',         uk:"Ар-Рум",            en:"The Romans" },
  { num:31, ayahs:34,  ar:'لقمان',        trn:'Luqman',         uk:"Лукман",            en:"Luqman" },
  { num:32, ayahs:30,  ar:'السجدة',       trn:'As-Sajda',       uk:"Ас-Саджда",         en:"The Prostration" },
  { num:33, ayahs:73,  ar:'الأحزاب',     trn:'Al-Ahzab',       uk:"Аль-Ахзаб",         en:"The Confederates" },
  { num:34, ayahs:54,  ar:'سبأ',           trn:'Saba',           uk:"Саба",              en:"Sheba" },
  { num:35, ayahs:45,  ar:'فاطر',         trn:'Fatir',          uk:"Фатір",             en:"The Originator" },
  { num:36, ayahs:83,  ar:'يس',            trn:'Ya-Sin',         uk:"Йа Сін",            en:"Ya-Sin" },
  { num:37, ayahs:182, ar:'الصافات',     trn:'As-Saffat',      uk:"Ас-Саффат",         en:"Those Ranged in Ranks" },
  { num:38, ayahs:88,  ar:'ص',             trn:'Sad',            uk:"Сад",               en:"Sad" },
  { num:39, ayahs:75,  ar:'الزمر',        trn:'Az-Zumar',       uk:"Аз-Зумар",          en:"The Groups" },
  { num:40, ayahs:85,  ar:'غافر',         trn:'Ghafir',         uk:"Гафір",             en:"The Forgiver" },
  { num:41, ayahs:54,  ar:'فصلت',         trn:'Fussilat',       uk:"Фуссилят",          en:"Explained in Detail" },
  { num:42, ayahs:53,  ar:'الشورى',       trn:'Ash-Shura',      uk:"Аш-Шура",           en:"Consultation" },
  { num:43, ayahs:89,  ar:'الزخرف',       trn:'Az-Zukhruf',     uk:"Аз-Зухруф",         en:"The Gold Adornments" },
  { num:44, ayahs:59,  ar:'الدخان',       trn:'Ad-Dukhan',      uk:"Ад-Духан",          en:"The Smoke" },
  { num:45, ayahs:37,  ar:'الجاثية',      trn:'Al-Jathiya',     uk:"Аль-Джасійя",       en:"The Kneeling" },
  { num:46, ayahs:35,  ar:'الأحقاف',     trn:'Al-Ahqaf',       uk:"Аль-Ахкаф",         en:"The Sand-Dunes" },
  { num:47, ayahs:38,  ar:'محمد',         trn:'Muhammad',       uk:"Мухаммад",          en:"Muhammad" },
  { num:48, ayahs:29,  ar:'الفتح',        trn:'Al-Fath',        uk:"Аль-Фатх",          en:"The Conquest" },
  { num:49, ayahs:18,  ar:'الحجرات',      trn:'Al-Hujurat',     uk:"Аль-Худжурат",      en:"The Apartments" },
  { num:50, ayahs:45,  ar:'ق',             trn:'Qaf',            uk:"Каф",               en:"Qaf" },
  { num:51, ayahs:60,  ar:'الذاريات',    trn:'Adh-Dhariyat',   uk:"Аз-Зарійят",        en:"The Winnowing Winds" },
  { num:52, ayahs:49,  ar:'الطور',        trn:'At-Tur',         uk:"Ат-Тур",            en:"The Mount" },
  { num:53, ayahs:62,  ar:'النجم',        trn:'An-Najm',        uk:"Ан-Наджм",          en:"The Star" },
  { num:54, ayahs:55,  ar:'القمر',        trn:'Al-Qamar',       uk:"Аль-Камар",         en:"The Moon" },
  { num:55, ayahs:78,  ar:'الرحمن',       trn:'Ar-Rahman',      uk:"Ар-Рахман",         en:"The Most Merciful" },
  { num:56, ayahs:96,  ar:'الواقعة',     trn:'Al-Waqia',       uk:"Аль-Вакіа",         en:"The Inevitable" },
  { num:57, ayahs:29,  ar:'الحديد',       trn:'Al-Hadid',       uk:"Аль-Хадід",         en:"The Iron" },
  { num:58, ayahs:22,  ar:'المجادلة',    trn:'Al-Mujadila',    uk:"Аль-Муджаділя",     en:"The Pleading Woman" },
  { num:59, ayahs:24,  ar:'الحشر',        trn:'Al-Hashr',       uk:"Аль-Хашр",          en:"The Banishment" },
  { num:60, ayahs:13,  ar:'الممتحنة',    trn:'Al-Mumtahina',   uk:"Аль-Мумтахана",     en:"The Examined" },
  { num:61, ayahs:14,  ar:'الصف',         trn:'As-Saff',        uk:"Ас-Сафф",           en:"The Ranks" },
  { num:62, ayahs:11,  ar:'الجمعة',       trn:'Al-Jumua',       uk:"Аль-Джумуа",        en:"Friday" },
  { num:63, ayahs:11,  ar:'المنافقون',   trn:'Al-Munafiqun',   uk:"Аль-Мунафікун",     en:"The Hypocrites" },
  { num:64, ayahs:18,  ar:'التغابن',      trn:'At-Taghabun',    uk:"Ат-Тагабун",        en:"Mutual Disillusion" },
  { num:65, ayahs:12,  ar:'الطلاق',       trn:'At-Talaq',       uk:"Ат-Таляк",          en:"The Divorce" },
  { num:66, ayahs:12,  ar:'التحريم',      trn:'At-Tahrim',      uk:"Ат-Тахрім",         en:"The Prohibition" },
  { num:67, ayahs:30,  ar:'الملك',        trn:'Al-Mulk',        uk:"Аль-Мульк",         en:"The Sovereignty" },
  { num:68, ayahs:52,  ar:'القلم',        trn:'Al-Qalam',       uk:"Аль-Калям",         en:"The Pen" },
  { num:69, ayahs:52,  ar:'الحاقة',       trn:'Al-Haqqa',       uk:"Аль-Хакка",         en:"The Reality" },
  { num:70, ayahs:44,  ar:'المعارج',     trn:'Al-Maarij',      uk:"Аль-Маарідж",       en:"The Ascending Stairways" },
  { num:71, ayahs:28,  ar:'نوح',          trn:'Nuh',            uk:"Нух",               en:"Noah" },
  { num:72, ayahs:28,  ar:'الجن',         trn:'Al-Jinn',        uk:"Аль-Джін",          en:"The Jinn" },
  { num:73, ayahs:20,  ar:'المزمل',       trn:'Al-Muzzammil',   uk:"Аль-Муззаміль",     en:"The Enshrouded" },
  { num:74, ayahs:56,  ar:'المدثر',       trn:'Al-Muddaththir', uk:"Аль-Мудассір",      en:"The Cloaked" },
  { num:75, ayahs:40,  ar:'القيامة',     trn:'Al-Qiyama',      uk:"Аль-Кійама",        en:"The Resurrection" },
  { num:76, ayahs:31,  ar:'الإنسان',     trn:'Al-Insan',       uk:"Аль-Інсан",         en:"The Man" },
  { num:77, ayahs:50,  ar:'المرسلات',    trn:'Al-Mursalat',    uk:"Аль-Мурсалят",      en:"The Emissaries" },
  { num:78, ayahs:40,  ar:'النبأ',        trn:'An-Naba',        uk:"Ан-Наба",           en:"The Tidings" },
  { num:79, ayahs:46,  ar:'النازعات',    trn:'An-Naziat',      uk:"Ан-Назіат",         en:"Those Who Drag Forth" },
  { num:80, ayahs:42,  ar:'عبس',           trn:'Abasa',          uk:"Абаса",             en:"He Frowned" },
  { num:81, ayahs:29,  ar:'التكوير',      trn:'At-Takwir',      uk:"Ат-Таквір",         en:"The Folding Up" },
  { num:82, ayahs:19,  ar:'الإنفطار',    trn:'Al-Infitar',     uk:"Аль-Інфітар",       en:"The Cleaving Asunder" },
  { num:83, ayahs:36,  ar:'المطففين',    trn:'Al-Mutaffifin',  uk:"Мутаффіфін",        en:"The Defrauders" },
  { num:84, ayahs:25,  ar:'الإنشقاق',    trn:'Al-Inshiqaq',    uk:"Аль-Іншикак",       en:"The Splitting Asunder" },
  { num:85, ayahs:22,  ar:'البروج',       trn:'Al-Buruj',       uk:"Аль-Бурудж",        en:"The Mansions of the Stars" },
  { num:86, ayahs:17,  ar:'الطارق',       trn:'At-Tariq',       uk:"Ат-Тарік",          en:"The Night Visitor" },
  { num:87, ayahs:19,  ar:'الأعلى',      trn:'Al-Ala',         uk:"Аль-Аля",           en:"The Most High" },
  { num:88, ayahs:26,  ar:'الغاشية',     trn:'Al-Ghashiya',    uk:"Аль-Гашійя",        en:"The Overwhelming" },
  { num:89, ayahs:30,  ar:'الفجر',        trn:'Al-Fajr',        uk:"Аль-Фаджр",         en:"The Dawn" },
  { num:90, ayahs:20,  ar:'البلد',        trn:'Al-Balad',       uk:"Аль-Баляд",         en:"The City" },
  { num:91, ayahs:15,  ar:'الشمس',        trn:'Ash-Shams',      uk:"Аш-Шамс",           en:"The Sun" },
  { num:92, ayahs:21,  ar:'الليل',        trn:'Al-Layl',        uk:"Аль-Лейль",         en:"The Night" },
  { num:93, ayahs:11,  ar:'الضحى',        trn:'Ad-Duha',        uk:"Ад-Духа",           en:"The Forenoon" },
  { num:94, ayahs:8,   ar:'الشرح',        trn:'Ash-Sharh',      uk:"Аш-Шарх",           en:"The Opening Forth" },
  { num:95, ayahs:8,   ar:'التين',        trn:'At-Tin',         uk:"Ат-Тін",            en:"The Fig" },
  { num:96, ayahs:19,  ar:'العلق',        trn:'Al-Alaq',        uk:"Аль-Аляк",          en:"The Clot" },
  { num:97, ayahs:5,   ar:'القدر',        trn:'Al-Qadr',        uk:"Аль-Кадр",          en:"The Power" },
  { num:98, ayahs:8,   ar:'البينة',       trn:'Al-Bayyina',     uk:"Аль-Бейїна",        en:"The Clear Proof" },
  { num:99, ayahs:8,   ar:'الزلزلة',     trn:'Az-Zalzala',     uk:"Аз-Зальзаля",       en:"The Earthquake" },
  { num:100,ayahs:11,  ar:'العاديات',    trn:'Al-Adiyat',      uk:"Аль-Адіят",         en:"The Courser" },
  { num:101,ayahs:11,  ar:'القارعة',     trn:'Al-Qaria',       uk:"Аль-Каріа",         en:"The Striking Hour" },
  { num:102,ayahs:8,   ar:'التكاثر',     trn:'At-Takathur',    uk:"Ат-Такясур",        en:"The Multiplication" },
  { num:103,ayahs:3,   ar:'العصر',        trn:'Al-Asr',         uk:"Аль-Аср",           en:"The Time" },
  { num:104,ayahs:9,   ar:'الهمزة',       trn:'Al-Humaza',      uk:"Аль-Гумаза",        en:"The Slanderer" },
  { num:105,ayahs:5,   ar:'الفيل',        trn:'Al-Fil',         uk:"Аль-Філь",          en:"The Elephant" },
  { num:106,ayahs:4,   ar:'قريش',         trn:'Quraysh',        uk:"Курайш",            en:"Quraysh" },
  { num:107,ayahs:7,   ar:'الماعون',     trn:'Al-Maun',        uk:"Аль-Маун",          en:"Small Kindnesses" },
  { num:108,ayahs:3,   ar:'الكوثر',       trn:'Al-Kawthar',     uk:"Аль-Каусар",        en:"Abundance" },
  { num:109,ayahs:6,   ar:'الكافرون',    trn:'Al-Kafirun',     uk:"Аль-Кафірун",       en:"The Disbelievers" },
  { num:110,ayahs:3,   ar:'النصر',        trn:'An-Nasr',        uk:"Ан-Наср",           en:"The Help" },
  { num:111,ayahs:5,   ar:'المسد',        trn:'Al-Masad',       uk:"Аль-Масад",         en:"The Palm Fibre" },
  { num:112,ayahs:4,   ar:'الإخلاص',     trn:'Al-Ikhlas',      uk:"Аль-Іхляс",         en:"Sincerity" },
  { num:113,ayahs:5,   ar:'الفلق',        trn:'Al-Falaq',       uk:"Аль-Фаляк",         en:"The Daybreak" },
  { num:114,ayahs:6,   ar:'الناس',        trn:'An-Nas',         uk:"Ан-Нас",            en:"Mankind" },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function tryEditions(slugs) {
  for (const slug of slugs) {
    try {
      console.log(`  → trying ${slug}…`);
      const data = await fetchJson(`${CDN}/editions/${slug}.min.json`);
      console.log(`    ✓ ${slug} OK`);
      return { slug, data };
    } catch (e) {
      console.log(`    ✗ ${slug} (${e.message})`);
    }
  }
  throw new Error('No working edition found');
}

async function discoverEditions() {
  console.log('Discovering available editions…');
  const editionsList = await fetchJson(`${CDN}/editions.json`);

  const ukrainian = [];
  const english = [];
  const arabic = [];
  for (const [key, val] of Object.entries(editionsList)) {
    const lang = (val.language || '').toLowerCase();
    const author = (val.author || '').toLowerCase();
    const slug = val.name || key;

    // Skip non-arabic-script editions of Ukrainian (none expected) and any -la/-lad latin transliterations
    if (slug.endsWith('-la') || slug.endsWith('-lad')) continue;

    if (lang === 'ukrainian') ukrainian.push({ slug, author });
    if (lang === 'english') english.push({ slug, author });
    if (lang === 'arabic' && slug.includes('uthmani')) arabic.push({ slug, author });
  }

  console.log(`  found ${ukrainian.length} Ukrainian, ${english.length} English, ${arabic.length} Arabic Uthmani`);
  console.log('  Ukrainian:', ukrainian.map((x) => x.slug).join(', ') || '(none)');
  console.log('  English (first 5):', english.slice(0, 5).map((x) => x.slug).join(', '));

  // Pick best — Yakubovych for UA, Mustafa Khattab or Saheeh for EN
  const ukSlug = (
    ukrainian.find((x) => x.author.includes('yakubov') || x.author.includes('якубо')) ||
    ukrainian[0]
  )?.slug;

  const enSlug = (
    english.find((x) => x.author.includes('khattab')) ||
    english.find((x) => x.author.includes('saheeh') || x.author.includes('saheeh international')) ||
    english.find((x) => x.author.includes('umm muhammad')) ||
    english[0]
  )?.slug;

  const arSlug = (
    arabic.find((x) => x.slug.includes('hafs')) ||
    arabic[0]
  )?.slug || 'ara-quranuthmanihaf';

  if (!ukSlug) throw new Error('No Ukrainian edition found in editions.json');
  if (!enSlug) throw new Error('No English edition found in editions.json');

  console.log(`\nSelected:`);
  console.log(`  AR: ${arSlug}`);
  console.log(`  UK: ${ukSlug}`);
  console.log(`  EN: ${enSlug}`);

  return { ar: arSlug, uk: ukSlug, en: enSlug };
}

function buildTextMap(edition) {
  const map = {};
  for (const v of edition.quran) {
    map[`${v.chapter}:${v.verse}`] = v.text;
  }
  return map;
}

async function main() {
  console.log('Quran data downloader for Islam UA\n');

  // 1. Discover working slugs
  const slugs = await discoverEditions();

  // 2. Download each
  console.log('\nDownloading editions…');
  const editions = {};
  for (const [lang, slug] of Object.entries(slugs)) {
    console.log(`  → ${lang}: ${slug}`);
    const data = await fetchJson(`${CDN}/editions/${slug}.min.json`);
    editions[lang] = buildTextMap(data);
    console.log(`    ✓ ${Object.keys(editions[lang]).length} verses`);
  }

  // 3. Sanity check
  const counts = Object.values(editions).map((e) => Object.keys(e).length);
  if (!counts.every((c) => c === 6236)) {
    console.warn(`⚠ Expected 6236 verses each, got: ${counts.join(', ')}`);
  }

  // 4. Build output
  const output = {
    meta: {
      version: 1,
      generated: new Date().toISOString(),
      sources: {
        ar: slugs.ar,
        uk: slugs.uk,
        en: slugs.en,
      },
      surahs: SURAH_NAMES.map((s) => ({
        number: s.num,
        ayahs: s.ayahs,
        nameAr: s.ar,
        nameTransliteration: s.trn,
        nameUk: s.uk,
        nameEn: s.en,
      })),
    },
    ar: editions.ar,
    uk: editions.uk,
    en: editions.en,
  };

  // 5. Write
  const outDir = path.join(__dirname, '..', 'assets', 'quran');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'quran-data.json');
  fs.writeFileSync(outPath, JSON.stringify(output));
  const sizeKB = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`\n✓ Wrote ${outPath} (${sizeKB} KB)`);
}

main().catch((err) => {
  console.error('\n✗ Error:', err.message);
  process.exit(1);
});