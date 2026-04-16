// ios/PrayerWidget/PrayerWidget.swift
// Islam UA — Асоціація мусульман України
// Developer: Maksym Storozhuk

import WidgetKit
import SwiftUI

let APP_GROUP  = "group.com.maksymstorozhuk.islamua"
let DEFAULTS_KEY = "prayer_widget_data"

// Colours matching the app theme
private let cBG      = Color(hex: "#0D1B2A")
private let cCard    = Color(hex: "#1E3450")
private let cGold    = Color(hex: "#D4A843")
private let cGoldL   = Color(hex: "#F0C860")
private let cGreen   = Color(hex: "#52C97E")
private let cMuted   = Color(hex: "#9DB4CC")

struct PrayerWidgetData: Codable {
    var prayerName: String
    var arabicName: String
    var time12h:    String
    var countdown:  String
    var progressPercent: Int
    var currentPrayerName: String
    var currentPrayerTime: String
    var city:       String
    var hijriDay:   String
    var hijriMonth: String

    static var placeholder: PrayerWidgetData {
        PrayerWidgetData(
            prayerName: "Фаджр", arabicName: "الفجر",
            time12h: "05:39",   countdown: "8г 49хв",
            progressPercent: 22,
            currentPrayerName: "Іша", currentPrayerTime: "20:49",
            city: "Київ", hijriDay: "14", hijriMonth: "رمضان"
        )
    }
}

struct PrayerEntry: TimelineEntry {
    let date: Date
    let data: PrayerWidgetData
}

struct Provider: TimelineProvider {
    func placeholder(in _: Context) -> PrayerEntry { PrayerEntry(date: .now, data: .placeholder) }

    func getSnapshot(in _: Context, completion: @escaping (PrayerEntry) -> Void) {
        completion(PrayerEntry(date: .now, data: load()))
    }

    func getTimeline(in _: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
        let entry = PrayerEntry(date: .now, data: load())
        let next  = Calendar.current.date(byAdding: .minute, value: 5, to: .now)!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func load() -> PrayerWidgetData {
        guard
            let ud   = UserDefaults(suiteName: APP_GROUP),
            let raw  = ud.data(forKey: DEFAULTS_KEY),
            let data = try? JSONDecoder().decode(PrayerWidgetData.self, from: raw)
        else { return .placeholder }
        return data
    }
}

// ── Small widget (2×2) ────────────────────────────────────────────────────────
struct SmallWidgetView: View {
    let d: PrayerWidgetData
    var body: some View {
        ZStack {
            LinearGradient(colors: [cCard, cBG], startPoint: .topLeading, endPoint: .bottomTrailing)
            VStack(alignment: .leading, spacing: 4) {
                // Live dot + label
                HStack(spacing: 5) {
                    Circle().fill(cGreen).frame(width: 6, height: 6)
                    Text("НАСТУПНА МОЛИТВА")
                        .font(.system(size: 7, weight: .semibold))
                        .foregroundColor(cMuted).tracking(0.8)
                    Spacer()
                }
                Spacer()
                // Arabic
                Text(d.arabicName).font(.system(size: 17)).foregroundColor(cGoldL)
                // Name
                Text(d.prayerName)
                    .font(.system(size: 20, weight: .bold, design: .serif))
                    .foregroundColor(.white)
                // Time
                Text(d.time12h)
                    .font(.system(size: 18, weight: .light))
                    .foregroundColor(.white).kerning(-0.5)
                Spacer()
                // Countdown
                HStack(spacing: 3) {
                    Image(systemName: "timer").font(.system(size: 9)).foregroundColor(cGold)
                    Text(d.countdown)
                        .font(.system(size: 11, weight: .semibold)).foregroundColor(cGoldL)
                }
                // Progress bar
                GeometryReader { g in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2).fill(Color.white.opacity(0.08)).frame(height: 3)
                        RoundedRectangle(cornerRadius: 2).fill(cGold)
                            .frame(width: g.size.width * CGFloat(d.progressPercent) / 100, height: 3)
                    }
                }.frame(height: 3)
            }
            .padding(13)
        }
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(cGold.opacity(0.28), lineWidth: 1))
    }
}

// ── Medium widget (4×2) ───────────────────────────────────────────────────────
struct MediumWidgetView: View {
    let d: PrayerWidgetData
    var body: some View {
        ZStack {
            LinearGradient(colors: [cCard, Color(hex: "#162032")],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            HStack(spacing: 0) {
                // Left column
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 5) {
                        Circle().fill(cGreen).frame(width: 6, height: 6)
                        Text("НАСТУПНА МОЛИТВА")
                            .font(.system(size: 7, weight: .semibold))
                            .foregroundColor(cMuted).tracking(0.8)
                    }
                    Text(d.arabicName).font(.system(size: 18)).foregroundColor(cGoldL)
                    Text(d.prayerName)
                        .font(.system(size: 26, weight: .bold, design: .serif))
                        .foregroundColor(.white)
                    Spacer()
                    // Countdown pill
                    HStack(spacing: 5) {
                        Image(systemName: "timer").font(.system(size: 10)).foregroundColor(cGold)
                        Text(d.countdown).font(.system(size: 13, weight: .semibold)).foregroundColor(cGoldL)
                        Text("залишилось").font(.system(size: 9)).foregroundColor(cMuted)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 7)
                    .background(cGold.opacity(0.1))
                    .clipShape(Capsule())
                    .overlay(Capsule().strokeBorder(cGold.opacity(0.25), lineWidth: 1))
                }
                Spacer()
                Rectangle().fill(Color.white.opacity(0.06)).frame(width: 1).padding(.vertical, 8)
                Spacer()
                // Right column
                VStack(alignment: .trailing, spacing: 4) {
                    // City
                    HStack(spacing: 3) {
                        Image(systemName: "location").font(.system(size: 8)).foregroundColor(cMuted)
                        Text(d.city).font(.system(size: 9, weight: .medium)).foregroundColor(cMuted)
                    }
                    Spacer()
                    // Time
                    Text(d.time12h)
                        .font(.system(size: 32, weight: .ultraLight)).foregroundColor(.white).kerning(-1)
                    // Hijri
                    HStack(spacing: 3) {
                        Text(d.hijriDay).font(.system(size: 10)).foregroundColor(cMuted)
                        Text(d.hijriMonth).font(.system(size: 10)).foregroundColor(cGold)
                    }
                    Spacer()
                    // Progress
                    VStack(alignment: .trailing, spacing: 3) {
                        GeometryReader { g in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 2).fill(Color.white.opacity(0.08)).frame(height: 4)
                                RoundedRectangle(cornerRadius: 2).fill(cGold)
                                    .frame(width: g.size.width * CGFloat(d.progressPercent) / 100, height: 4)
                            }
                        }.frame(height: 4)
                        HStack {
                            Text(d.currentPrayerName).font(.system(size: 8)).foregroundColor(cMuted)
                            Spacer()
                            Text(d.prayerName).font(.system(size: 8)).foregroundColor(cMuted)
                        }
                    }
                }
            }
            .padding(16)
        }
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(cGold.opacity(0.28), lineWidth: 1))
    }
}

// ── Lock screen widget ────────────────────────────────────────────────────────
struct LockScreenView: View {
    let d: PrayerWidgetData
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "moon.stars").font(.system(size: 15))
            VStack(alignment: .leading, spacing: 1) {
                Text(d.prayerName).font(.system(size: 13, weight: .semibold))
                Text("\(d.time12h) · \(d.countdown)").font(.system(size: 10)).opacity(0.7)
            }
            Spacer()
        }
        .widgetAccentable()
    }
}

// ── Entry view dispatcher ─────────────────────────────────────────────────────
struct IslamUAWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: PrayerEntry
    var body: some View {
        switch family {
        case .systemSmall:            SmallWidgetView(d: entry.data)
        case .systemMedium:           MediumWidgetView(d: entry.data)
        case .accessoryRectangular:   LockScreenView(d: entry.data)
        case .accessoryCircular:
            VStack(spacing: 1) {
                Text(entry.data.arabicName).font(.system(size: 9))
                Text(entry.data.time12h).font(.system(size: 14, weight: .semibold))
            }.widgetAccentable()
        default: SmallWidgetView(d: entry.data)
        }
    }
}

// ── Widget bundle entry point ─────────────────────────────────────────────────
@main
struct IslamUAWidget: Widget {
    let kind = "IslamUAWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            IslamUAWidgetView(entry: entry)
                .containerBackground(.clear, for: .widget)
        }
        .configurationDisplayName("Islam UA")
        .description("Час молитов · Асоціація мусульман України")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryCircular])
    }
}

// ── Hex colour helper ─────────────────────────────────────────────────────────
extension Color {
    init(hex: String) {
        let s = Scanner(string: hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")))
        var rgb: UInt64 = 0
        s.scanHexInt64(&rgb)
        self.init(
            red:   Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8)  & 0xFF) / 255,
            blue:  Double( rgb        & 0xFF) / 255
        )
    }
}
