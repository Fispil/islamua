package com.maksymstorozhuk.islamua

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PrayerWidgetModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx) {

    override fun getName(): String = "PrayerWidgetModule"

    // Called by React Native to update the "next prayer" widget
    @ReactMethod
    fun updateWidget(jsonData: String) {
        ctx.getSharedPreferences("prayer_widget_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("prayer_widget_data", jsonData)
            .apply()

        PrayerAppWidget.updateAllWidgets(ctx)
    }

    // Called by React Native to update the calendar widget (all 5 prayers)
    @ReactMethod
    fun updateCalendarWidget(jsonData: String) {
        ctx.getSharedPreferences("prayer_widget_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("all_prayers_data", jsonData)
            .apply()

        PrayerCalendarWidget.updateAllWidgets(ctx)
    }

    // Single helper — updates both widgets at once
    @ReactMethod
    fun updateAllWidgets(nextPrayerJson: String, allPrayersJson: String) {
        val prefs = ctx.getSharedPreferences("prayer_widget_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("prayer_widget_data", nextPrayerJson)
            .putString("all_prayers_data", allPrayersJson)
            .apply()

        PrayerAppWidget.updateAllWidgets(ctx)
        PrayerCalendarWidget.updateAllWidgets(ctx)
    }
}
