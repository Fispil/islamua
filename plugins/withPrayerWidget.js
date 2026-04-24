// plugins/withPrayerWidget.js
// Injects Islam UA widgets into Expo-generated android/ and ios/.
// Two Android widgets: next-prayer (with live countdown) + calendar (all 5).

const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
  withEntitlementsPlist,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE = 'com.maksymstorozhuk.islamua';
const APP_GROUP = 'group.com.maksymstorozhuk.islamua';

// ══════════════════════════════════════════════════════════════════════════
// ANDROID — register TWO widget receivers in manifest
// ══════════════════════════════════════════════════════════════════════════

function withWidgetReceivers(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application[0];
    if (!app.receiver) app.receiver = [];

    // ── Receiver 1: Next Prayer widget ──
    if (!app.receiver.some((r) => r.$['android:name'] === '.PrayerAppWidget')) {
      app.receiver.push({
        $: {
          'android:name': '.PrayerAppWidget',
          'android:exported': 'true',
          'android:label': '@string/widget_label',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
              { $: { 'android:name': 'com.maksymstorozhuk.islamua.WIDGET_TICK' } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/prayer_widget_info',
            },
          },
        ],
      });
    }

    // ── Receiver 2: Calendar widget ──
    if (!app.receiver.some((r) => r.$['android:name'] === '.PrayerCalendarWidget')) {
      app.receiver.push({
        $: {
          'android:name': '.PrayerCalendarWidget',
          'android:exported': 'true',
          'android:label': '@string/calendar_widget_label',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
              { $: { 'android:name': 'com.maksymstorozhuk.islamua.CALENDAR_TICK' } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/prayer_calendar_widget_info',
            },
          },
        ],
      });
    }

    return config;
  });
}

function withWidgetPackage(config) {
  return withMainApplication(config, (config) => {
    let src = config.modResults.contents;
    if (src.includes('PrayerWidgetPackage()')) return config;

    // toMutableList() syntax
    if (src.includes('.packages.toMutableList()')) {
      src = src.replace(
        /val packages = PackageList\(this\)\.packages\.toMutableList\(\)/,
        `val packages = PackageList(this).packages.toMutableList()
                packages.add(PrayerWidgetPackage())`
      );
      console.log('[withPrayerWidget] PrayerWidgetPackage registered (toMutableList)');
      config.modResults.contents = src;
      return config;
    }

    // apply {} syntax (SDK 55 default)
    const applyMatch = src.match(/PackageList\(this\)\.packages\.apply\s*\{([\s\S]*?)\n(\s*)\}/);
    if (applyMatch) {
      const [fullMatch, innerContent, indent] = applyMatch;
      const replacement = `PackageList(this).packages.apply {${innerContent}\n${indent}  add(PrayerWidgetPackage())\n${indent}}`;
      src = src.replace(fullMatch, replacement);
      console.log('[withPrayerWidget] PrayerWidgetPackage registered (apply {})');
      config.modResults.contents = src;
      return config;
    }

    console.warn('[withPrayerWidget] Could not find pattern in MainApplication.kt. Add manually: packages.add(PrayerWidgetPackage())');
    return config;
  });
}

function withAndroidWidgetFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const templateDir = path.join(projectRoot, 'plugins', 'widget-templates');
      if (!fs.existsSync(templateDir)) {
        console.warn('[withPrayerWidget Android] widget-templates folder missing');
        return config;
      }

      const javaDir = path.join(platformRoot, 'app/src/main/java', ...PACKAGE.split('.'));
      const resDir = path.join(platformRoot, 'app/src/main/res');

      const copyFile = (src, dst) => {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
        console.log(`[withPrayerWidget Android] + ${path.basename(src)}`);
      };
      const copyDir = (srcDir, dstDir) => {
        if (!fs.existsSync(srcDir)) return;
        for (const item of fs.readdirSync(srcDir)) {
          const s = path.join(srcDir, item);
          const d = path.join(dstDir, item);
          if (fs.statSync(s).isDirectory()) copyDir(s, d);
          else copyFile(s, d);
        }
      };

      copyDir(path.join(templateDir, 'java'), javaDir);
      copyDir(path.join(templateDir, 'res/layout'), path.join(resDir, 'layout'));
      copyDir(path.join(templateDir, 'res/xml'), path.join(resDir, 'xml'));
      copyDir(path.join(templateDir, 'res/drawable'), path.join(resDir, 'drawable'));

      mergeXmlResource(path.join(templateDir, 'res/values/widget_strings.xml'),
                       path.join(resDir, 'values/strings.xml'), 'string');
      mergeXmlResource(path.join(templateDir, 'res/values/widget_styles.xml'),
                       path.join(resDir, 'values/styles.xml'), 'style');

      return config;
    },
  ]);
}

function mergeXmlResource(srcFile, dstFile, itemTag) {
  if (!fs.existsSync(srcFile)) return;
  if (!fs.existsSync(dstFile)) {
    fs.mkdirSync(path.dirname(dstFile), { recursive: true });
    fs.copyFileSync(srcFile, dstFile);
    return;
  }
  const src = fs.readFileSync(srcFile, 'utf8');
  let dst = fs.readFileSync(dstFile, 'utf8');
  const regex = new RegExp(`<${itemTag}[^>]*name="([^"]+)"[\\s\\S]*?</${itemTag}>`, 'g');
  const matches = src.match(regex) || [];
  let added = 0;
  for (const item of matches) {
    const nameMatch = item.match(/name="([^"]+)"/);
    if (nameMatch && !dst.includes(`name="${nameMatch[1]}"`)) {
      dst = dst.replace('</resources>', `    ${item}\n</resources>`);
      added++;
    }
  }
  if (added > 0) {
    fs.writeFileSync(dstFile, dst);
    console.log(`[withPrayerWidget Android] merged ${added} ${itemTag}(s)`);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// iOS
// ══════════════════════════════════════════════════════════════════════════

function withAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    const existing = config.modResults['com.apple.security.application-groups'] || [];
    if (!existing.includes(APP_GROUP)) existing.push(APP_GROUP);
    config.modResults['com.apple.security.application-groups'] = existing;
    return config;
  });
}

function withIosWidgetFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const templateDir = path.join(projectRoot, 'plugins', 'ios-widget-templates');
      if (!fs.existsSync(templateDir)) return config;

      const appName = config.modRequest.projectName || 'islamua';
      const mainAppDir = path.join(platformRoot, appName);
      const widgetDir = path.join(platformRoot, 'PrayerWidget');
      fs.mkdirSync(widgetDir, { recursive: true });

      const copyFile = (src, dst) => {
        if (!fs.existsSync(src)) return;
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
        console.log(`[withPrayerWidget iOS] + ${path.relative(platformRoot, dst)}`);
      };

      copyFile(path.join(templateDir, 'PrayerWidget.swift'), path.join(widgetDir, 'PrayerWidget.swift'));
      copyFile(path.join(templateDir, 'Info.plist'), path.join(widgetDir, 'Info.plist'));
      copyFile(path.join(templateDir, 'PrayerWidget.entitlements'), path.join(widgetDir, 'PrayerWidget.entitlements'));

      if (fs.existsSync(mainAppDir)) {
        copyFile(path.join(templateDir, 'SharedGroupPreferences.swift'),
                 path.join(mainAppDir, 'SharedGroupPreferences.swift'));
        copyFile(path.join(templateDir, 'SharedGroupPreferences.m'),
                 path.join(mainAppDir, 'SharedGroupPreferences.m'));
      }

      return config;
    },
  ]);
}

module.exports = (config) => {
  config = withWidgetReceivers(config);
  config = withWidgetPackage(config);
  config = withAndroidWidgetFiles(config);
  config = withAppGroupEntitlement(config);
  config = withIosWidgetFiles(config);
  return config;
};
