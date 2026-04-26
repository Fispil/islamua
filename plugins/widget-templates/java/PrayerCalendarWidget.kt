package com.maksymstorozhuk.islamua

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject

class PrayerCalendarWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            try { updateAppWidget(context, appWidgetManager, id) }
            catch (e: Exception) { Log.e(TAG, "Failed to update calendar widget $id", e) }
        }
        scheduleNextUpdate(context)
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        scheduleNextUpdate(context)
        updateAllWidgets(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
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
            ACTION_TICK -> {
                updateAllWidgets(context)
                scheduleNextUpdate(context)
            }
        }
    }

    companion object {
        private const val TAG = "IslamUACalendarWidget"
        private const val PREFS = "prayer_widget_prefs"
        private const val TIMINGS_KEY = "all_prayers_data"
        private const val ACTION_TICK = "com.maksymstorozhuk.islamua.CALENDAR_TICK"
        private const val REQUEST_CODE = 8766

        fun scheduleNextUpdate(context: Context) {
            try {
                val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val intent = Intent(context, PrayerCalendarWidget::class.java).apply { action = ACTION_TICK }
                val pi = PendingIntent.getBroadcast(
                    context, REQUEST_CODE, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                // Calendar widget refreshes every 5 minutes — no need for per-second updates
                val nextTick = System.currentTimeMillis() + 5 * 60_000

                when {
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
                        if (am.canScheduleExactAlarms()) {
                            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTick, pi)
                        } else {
                            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTick, pi)
                        }
                    }
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.M -> {
                        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTick, pi)
                    }
                    else -> {
                        am.setExact(AlarmManager.RTC_WAKEUP, nextTick, pi)
                    }
                }
            } catch (_: Exception) {}
        }

        fun cancelAlarm(context: Context) {
            try {
                val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val intent = Intent(context, PrayerCalendarWidget::class.java).apply { action = ACTION_TICK }
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
                val ids = mgr.getAppWidgetIds(ComponentName(context, PrayerCalendarWidget::class.java))
                for (id in ids) updateAppWidget(context, mgr, id)
            } catch (e: Exception) { Log.e(TAG, "updateAllWidgets failed", e) }
        }

        fun updateAppWidget(context: Context, mgr: AppWidgetManager, id: Int) {
            try {
                val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                val json = prefs.getString(TIMINGS_KEY, null)
                val views = RemoteViews(context.packageName, R.layout.prayer_calendar_widget)

                if (!json.isNullOrBlank()) {
                    try {
                        val d = JSONObject(json)
                        val cityName = d.optString("city", "")
                        val hijriDay = d.optString("hijriDay", "")
                        val hijriMonth = d.optString("hijriMonth", "")

                        views.setTextViewText(R.id.calendarCity, cityName.ifEmpty { "Islam UA" })
                        val hijriText = if (hijriDay.isNotEmpty()) "$hijriDay $hijriMonth" else ""
                        views.setTextViewText(R.id.calendarHijri, hijriText)

                        val prayers = d.optJSONArray("prayers")
                        if (prayers != null && prayers.length() >= 5) {
                            val rowIds = listOf(
                                Triple(R.id.row1Name, R.id.row1Arabic, R.id.row1Time) to R.id.row1Indicator,
                                Triple(R.id.row2Name, R.id.row2Arabic, R.id.row2Time) to R.id.row2Indicator,
                                Triple(R.id.row3Name, R.id.row3Arabic, R.id.row3Time) to R.id.row3Indicator,
                                Triple(R.id.row4Name, R.id.row4Arabic, R.id.row4Time) to R.id.row4Indicator,
                                Triple(R.id.row5Name, R.id.row5Arabic, R.id.row5Time) to R.id.row5Indicator
                            )
                            for (i in 0 until 5) {
                                val (texts, indicator) = rowIds[i]
                                renderPrayerRow(views, texts.first, texts.second, texts.third, indicator,
                                    prayers.getJSONObject(i))
                            }
                        } else {
                            setCalendarPlaceholder(views)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "JSON parse failed", e)
                        setCalendarPlaceholder(views)
                    }
                } else {
                    setCalendarPlaceholder(views)
                }

                try {
                    val intent = Intent(context, MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    }
                    val pi = PendingIntent.getActivity(
                        context, 1, intent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    views.setOnClickPendingIntent(R.id.calendarRoot, pi)
                } catch (_: Exception) {}

                mgr.updateAppWidget(id, views)
            } catch (e: Exception) { Log.e(TAG, "updateAppWidget $id failed", e) }
        }

        private fun renderPrayerRow(
            views: RemoteViews,
            nameId: Int, arabicId: Int, timeId: Int, indicatorId: Int,
            p: JSONObject
        ) {
            val name = p.optString("name", "—")
            val arabic = p.optString("arabic", "")
            val time = p.optString("time", "—")
            val isNext = p.optBoolean("isNext", false)
            val hasPassed = p.optBoolean("hasPassed", false)

            views.setTextViewText(nameId, name)
            views.setTextViewText(arabicId, arabic)
            views.setTextViewText(timeId, time)

            // Colours via setTextColor (RemoteViews-safe API)
            val color = when {
                isNext    -> 0xFFF0C860.toInt()  // gold for next
                hasPassed -> 0xFF6B7E94.toInt()  // muted for past
                else      -> 0xFFF0F7FF.toInt()  // white for future
            }
            views.setTextColor(nameId, color)
            views.setTextColor(timeId, color)
            views.setTextColor(arabicId,
                if (isNext) 0xFFF0C860.toInt() else 0xFF9DB4CC.toInt()
            )

            // Show/hide indicator dot — INVISIBLE keeps space, GONE removes
            views.setViewVisibility(indicatorId, if (isNext) View.VISIBLE else View.INVISIBLE)
        }

        private fun setCalendarPlaceholder(views: RemoteViews) {
            views.setTextViewText(R.id.calendarCity, "Islam UA")
            views.setTextViewText(R.id.calendarHijri, "Відкрийте додаток")

            val rowData = listOf(
                Triple("Фаджр",  "الفجر",  R.id.row1Name to R.id.row1Arabic) to R.id.row1Time,
                Triple("Зухр",   "الظهر",  R.id.row2Name to R.id.row2Arabic) to R.id.row2Time,
                Triple("Аср",    "العصر",  R.id.row3Name to R.id.row3Arabic) to R.id.row3Time,
                Triple("Магріб", "المغرب", R.id.row4Name to R.id.row4Arabic) to R.id.row4Time,
                Triple("Іша",    "العشاء", R.id.row5Name to R.id.row5Arabic) to R.id.row5Time
            )
            val indicators = listOf(
                R.id.row1Indicator, R.id.row2Indicator, R.id.row3Indicator,
                R.id.row4Indicator, R.id.row5Indicator
            )
            for (i in rowData.indices) {
                val (data, timeId) = rowData[i]
                val (name, arabic, ids) = data
                views.setTextViewText(ids.first, name)
                views.setTextViewText(ids.second, arabic)
                views.setTextViewText(timeId, "—")
                views.setTextColor(ids.first, 0xFF6B7E94.toInt())
                views.setTextColor(timeId, 0xFF6B7E94.toInt())
                views.setTextColor(ids.second, 0xFF9DB4CC.toInt())
                views.setViewVisibility(indicators[i], View.INVISIBLE)
            }
        }
    }
}
