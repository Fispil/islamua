package com.maksymstorozhuk.islamua

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import android.util.Log
import android.widget.RemoteViews
import org.json.JSONObject

class PrayerAppWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        Log.d(TAG, "onUpdate called for ${appWidgetIds.size} widgets")
        for (id in appWidgetIds) {
            try { updateAppWidget(context, appWidgetManager, id) }
            catch (e: Exception) { Log.e(TAG, "Failed to update widget $id", e) }
        }
        // Schedule next real-time tick
        scheduleNextUpdate(context)
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        Log.d(TAG, "onEnabled — first widget installed, starting 1-minute alarm")
        scheduleNextUpdate(context)
        updateAllWidgets(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        Log.d(TAG, "onDisabled — last widget removed, cancelling alarm")
        cancelAlarm(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON" -> {
                scheduleNextUpdate(context)
                updateAllWidgets(context)
            }
            ACTION_TICK -> updateAllWidgets(context)
        }
    }

    companion object {
        private const val TAG = "IslamUAWidget"
        private const val PREFS = "prayer_widget_prefs"
        private const val KEY = "prayer_widget_data"
        private const val ACTION_TICK = "com.maksymstorozhuk.islamua.WIDGET_TICK"
        private const val REQUEST_CODE = 8765

        // ── Real-time scheduling ─────────────────────────────────────────
        // Android minimum updatePeriodMillis is 30 min. For per-second
        // countdown we use AlarmManager scheduled every 60 seconds instead.
        fun scheduleNextUpdate(context: Context) {
            try {
                val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val intent = Intent(context, PrayerAppWidget::class.java).apply {
                    action = ACTION_TICK
                }
                val pi = PendingIntent.getBroadcast(
                    context, REQUEST_CODE, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                // Wake at next full minute boundary
                val now = System.currentTimeMillis()
                val nextMinute = now + (60_000 - now % 60_000)

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC, nextMinute, pi)
                } else {
                    am.setExact(AlarmManager.RTC, nextMinute, pi)
                }
                Log.d(TAG, "Next tick scheduled for ${nextMinute - now}ms from now")
            } catch (e: Exception) { Log.e(TAG, "scheduleNextUpdate failed", e) }
        }

        fun cancelAlarm(context: Context) {
            try {
                val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val intent = Intent(context, PrayerAppWidget::class.java).apply {
                    action = ACTION_TICK
                }
                val pi = PendingIntent.getBroadcast(
                    context, REQUEST_CODE, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                am.cancel(pi)
            } catch (_: Exception) {}
        }

        fun updateAllWidgets(context: Context) {
            try {
                val mgr = AppWidgetManager.getInstance(context)
                val ids = mgr.getAppWidgetIds(
                    ComponentName(context, PrayerAppWidget::class.java)
                )
                for (id in ids) updateAppWidget(context, mgr, id)
            } catch (e: Exception) { Log.e(TAG, "updateAllWidgets failed", e) }
        }

        fun updateAppWidget(context: Context, mgr: AppWidgetManager, id: Int) {
            try {
                val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                val json = prefs.getString(KEY, null)
                val views = RemoteViews(context.packageName, R.layout.prayer_widget)

                if (!json.isNullOrBlank()) {
                    try {
                        val d = JSONObject(json)
                        val prayerName = d.optString("prayerName", "")
                        val arabicName = d.optString("arabicName", "")
                        val nextTime   = d.optString("time12h", "")
                        val curName    = d.optString("currentPrayerName", "")
                        val curTime    = d.optString("currentPrayerTime", "")

                        // ── Compute countdown LIVE from next prayer time ──
                        val (countdown, progress) = computeLiveCountdown(
                            nextTime, curTime
                        )

                        if (prayerName.isNotEmpty() && nextTime.isNotEmpty()) {
                            views.setTextViewText(R.id.prayerName, prayerName)
                            views.setTextViewText(R.id.arabicName, arabicName.ifEmpty { "—" })
                            views.setTextViewText(R.id.prayerTime, nextTime)
                            views.setTextViewText(R.id.countdown, countdown)
                            views.setProgressBar(R.id.progressBar, 100, progress, false)
                            views.setTextViewText(
                                R.id.fromLabel,
                                if (curName.isNotEmpty()) "$curName ($curTime)" else ""
                            )
                            views.setTextViewText(R.id.toLabel, "$prayerName ($nextTime)")
                        } else {
                            setPlaceholder(views)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "JSON parse failed", e)
                        setPlaceholder(views)
                    }
                } else {
                    setPlaceholder(views)
                }

                try {
                    val intent = Intent(context, MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    }
                    val pi = PendingIntent.getActivity(
                        context, 0, intent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    views.setOnClickPendingIntent(R.id.widgetRoot, pi)
                } catch (_: Exception) {}

                mgr.updateAppWidget(id, views)
            } catch (e: Exception) { Log.e(TAG, "updateAppWidget $id failed", e) }
        }

        // Compute "Xг Yхв" countdown based on current time + stored next time (HH:MM)
        private fun computeLiveCountdown(nextTimeStr: String, curTimeStr: String): Pair<String, Int> {
            try {
                val now   = java.util.Calendar.getInstance()
                val nextP = parseHHmm(nextTimeStr)
                val curP  = parseHHmm(curTimeStr)
                if (nextP == null) return Pair("—", 0)

                val nowMins  = now.get(java.util.Calendar.HOUR_OF_DAY) * 60 + now.get(java.util.Calendar.MINUTE)
                var nextMins = nextP.first * 60 + nextP.second
                // If next prayer is tomorrow (e.g. after Isha waiting for Fajr)
                if (nextMins <= nowMins) nextMins += 24 * 60

                val diffMins = nextMins - nowMins
                val hours = diffMins / 60
                val mins  = diffMins % 60

                val countdown = when {
                    hours > 0 && mins > 0 -> "${hours}г ${mins}хв"
                    hours > 0             -> "${hours}г"
                    mins > 0              -> "${mins}хв"
                    else                  -> "0хв"
                }

                // Progress: elapsed / total interval
                val progress = if (curP != null) {
                    var curMins = curP.first * 60 + curP.second
                    if (curMins > nowMins) curMins -= 24 * 60  // current from yesterday
                    val total = nextMins - curMins
                    val elapsed = nowMins - curMins
                    if (total > 0) ((elapsed * 100f) / total).toInt().coerceIn(0, 100)
                    else 0
                } else 0

                return Pair(countdown, progress)
            } catch (_: Exception) {
                return Pair("—", 0)
            }
        }

        private fun parseHHmm(s: String): Pair<Int, Int>? {
            val parts = s.split(":")
            if (parts.size < 2) return null
            val h = parts[0].trim().toIntOrNull() ?: return null
            val m = parts[1].trim().take(2).toIntOrNull() ?: return null
            return Pair(h, m)
        }

        private fun setPlaceholder(v: RemoteViews) {
            v.setTextViewText(R.id.prayerName, "Islam UA")
            v.setTextViewText(R.id.arabicName, "السلام عليكم")
            v.setTextViewText(R.id.prayerTime, "")
            v.setTextViewText(R.id.countdown,  "Відкрийте додаток")
            v.setProgressBar(R.id.progressBar, 100, 0, false)
            v.setTextViewText(R.id.fromLabel, "для оновлення даних")
            v.setTextViewText(R.id.toLabel,   "")
        }
    }
}
