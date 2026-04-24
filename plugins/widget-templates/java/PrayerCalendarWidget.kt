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
            ACTION_TICK -> updateAllWidgets(context)
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
                val intent = Intent(context, PrayerCalendarWidget::class.java).apply {
                    action = ACTION_TICK
                }
                val pi = PendingIntent.getBroadcast(
                    context, REQUEST_CODE, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                val now = System.currentTimeMillis()
                val nextMinute = now + (60_000 - now % 60_000)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC, nextMinute, pi)
                } else {
                    am.setExact(AlarmManager.RTC, nextMinute, pi)
                }
            } catch (e: Exception) { Log.e(TAG, "scheduleNextUpdate failed", e) }
        }

        fun cancelAlarm(context: Context) {
            try {
                val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val intent = Intent(context, PrayerCalendarWidget::class.java).apply {
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
                    ComponentName(context, PrayerCalendarWidget::class.java)
                )
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
                        val nextPrayerName = d.optString("nextPrayerName", "")

                        views.setTextViewText(R.id.calendarCity, cityName.ifEmpty { "—" })
                        val hijriText = if (hijriDay.isNotEmpty()) "$hijriDay $hijriMonth" else ""
                        views.setTextViewText(R.id.calendarHijri, hijriText)

                        // Prayers array: [{name, arabic, time, isNext, hasPassed}, ...]
                        val prayers = d.optJSONArray("prayers")
                        if (prayers != null && prayers.length() >= 5) {
                            renderPrayerRow(views,
                                R.id.row1Name, R.id.row1Arabic, R.id.row1Time, R.id.row1Indicator,
                                prayers.getJSONObject(0))
                            renderPrayerRow(views,
                                R.id.row2Name, R.id.row2Arabic, R.id.row2Time, R.id.row2Indicator,
                                prayers.getJSONObject(1))
                            renderPrayerRow(views,
                                R.id.row3Name, R.id.row3Arabic, R.id.row3Time, R.id.row3Indicator,
                                prayers.getJSONObject(2))
                            renderPrayerRow(views,
                                R.id.row4Name, R.id.row4Arabic, R.id.row4Time, R.id.row4Indicator,
                                prayers.getJSONObject(3))
                            renderPrayerRow(views,
                                R.id.row5Name, R.id.row5Arabic, R.id.row5Time, R.id.row5Indicator,
                                prayers.getJSONObject(4))
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

                // Tap to open app
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

            // Colours:
            //  isNext    → gold (#F0C860)
            //  hasPassed → muted (#6B7E94)
            //  future    → white (#F0F7FF)
            val color = when {
                isNext    -> 0xFFF0C860.toInt()
                hasPassed -> 0xFF6B7E94.toInt()
                else      -> 0xFFF0F7FF.toInt()
            }
            views.setTextColor(nameId, color)
            views.setTextColor(timeId, color)
            views.setTextColor(arabicId,
                if (isNext) 0xFFF0C860.toInt() else 0xFF9DB4CC.toInt()
            )

            // Green dot indicator for next prayer
            views.setViewVisibility(indicatorId,
                if (isNext) android.view.View.VISIBLE else android.view.View.INVISIBLE
            )
        }

        private fun setCalendarPlaceholder(views: RemoteViews) {
            views.setTextViewText(R.id.calendarCity, "Islam UA")
            views.setTextViewText(R.id.calendarHijri, "Відкрийте додаток")
            val empty = arrayOf(
                Triple(R.id.row1Name, R.id.row1Arabic, R.id.row1Time),
                Triple(R.id.row2Name, R.id.row2Arabic, R.id.row2Time),
                Triple(R.id.row3Name, R.id.row3Arabic, R.id.row3Time),
                Triple(R.id.row4Name, R.id.row4Arabic, R.id.row4Time),
                Triple(R.id.row5Name, R.id.row5Arabic, R.id.row5Time)
            )
            val names = arrayOf("Фаджр", "Зухр", "Аср", "Магріб", "Іша")
            val arabics = arrayOf("الفجر", "الظهر", "العصر", "المغرب", "العشاء")
            empty.forEachIndexed { i, ids ->
                views.setTextViewText(ids.first, names[i])
                views.setTextViewText(ids.second, arabics[i])
                views.setTextViewText(ids.third, "—")
                views.setTextColor(ids.first, 0xFF6B7E94.toInt())
                views.setTextColor(ids.third, 0xFF6B7E94.toInt())
                views.setTextColor(ids.second, 0xFF9DB4CC.toInt())
            }
            arrayOf(R.id.row1Indicator, R.id.row2Indicator, R.id.row3Indicator,
                    R.id.row4Indicator, R.id.row5Indicator).forEach {
                views.setViewVisibility(it, android.view.View.INVISIBLE)
            }
        }
    }
}
