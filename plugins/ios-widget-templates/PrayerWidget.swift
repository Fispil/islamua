// ios/PrayerWidget/PrayerWidget.swift
// Islam UA — two widgets via WidgetBundle
//   1. NextPrayerWidget: matches the big NextPrayerCard from HomeScreen
//   2. CalendarWidget:   all 5 prayers for today
// Real-time via WidgetKit Timeline (60 entries ahead, one per minute)

import WidgetKit
import SwiftUI

let APP_GROUP = "group.com.maksymstorozhuk.islamua"
let NEXT_KEY  = "prayer_widget_data"
let ALL_KEY   = "all_prayers_data"

// ── App theme colours (mirrors src/constants/theme.ts) ────────────────────
private let cBG     = Color(red:  13/255, green:  27/255, blue:  42/255)
private let cCard   = Color(red:  30/255, green:  52/255, blue:  80/255)
private let cCardHi = Color(red:  42/255, green:  70/255, blue: 104/255)
private let cGold   = Color(red: 212/255, green: 168/255, blue:  67/255)
private let cGoldL  = Color(red: 240/255, green: 200/255, blue:  96/255)
private let cGreen  = Color(red:  82/255, green: 201/255, blue: 126/255)
private let cWhite  = Color(red: 240/255, green: 247/255, blue: 255/255)
private let cMuted  = Color(red: 157/255, green: 180/255, blue: 204/255)

// ═════════════════════════════════════════════════════════════════════════
// DATA MODELS — must mirror keys written by widgetService.ts
// ═════════════════════════════════════════════════════════════════════════

struct NextPrayerData: Codable {
    var prayerName: String
    var arabicName: String
    var time12h: String
    var countdown: String
    var progressPercent: Int
    var currentPrayerName: String
    var currentPrayerTime: String
    var city: String
    var hijriDay: String
    var hijriMonth: String

    static var placeholder: NextPrayerData {
        .init(prayerName: "Фаджр", arabicName: "الفجر", time12h: "05:39",
              countdown: "8г 49хв", progressPercent: 22,
              currentPrayerName: "Іша", currentPrayerTime: "20:49",
              city: "Київ", hijriDay: "14", hijriMonth: "رمضان")
    }
}

struct PrayerRow: Codable {
    var name: String
    var arabic: String
    var time: String
    var isNext: Bool
    var hasPassed: Bool
}

struct AllPrayersData: Codable {
    var city: String
    var hijriDay: String
    var hijriMonth: String
    var nextPrayerName: String
    var prayers: [PrayerRow]

    static var placeholder: AllPrayersData {
        .init(city: "Київ", hijriDay: "14", hijriMonth: "رمضان",
              nextPrayerName: "Фаджр",
              prayers: [
                .init(name: "Фаджр",  arabic: "الفجر",   time: "05:39", isNext: true,  hasPassed: false),
                .init(name: "Зухр",   arabic: "الظهر",   time: "12:32", isNext: false, hasPassed: false),
                .init(name: "Аср",    arabic: "العصر",   time: "16:18", isNext: false, hasPassed: false),
                .init(name: "Магріб", arabic: "المغرب",  time: "19:44", isNext: false, hasPassed: false),
                .init(name: "Іша",    arabic: "العشاء",  time: "21:12", isNext: false, hasPassed: false),
              ])
    }
}

extension Int {
    func clamped(_ lo: Int, _ hi: Int) -> Int { min(max(self, lo), hi) }
}

// ═════════════════════════════════════════════════════════════════════════
// NEXT PRAYER WIDGET — with 60-entry timeline for live countdown
// ═════════════════════════════════════════════════════════════════════════

struct NextPrayerEntry: TimelineEntry {
    let date: Date
    let data: NextPrayerData
}

struct NextProvider: TimelineProvider {
    func placeholder(in _: Context) -> NextPrayerEntry {
        NextPrayerEntry(date: .now, data: .placeholder)
    }
    func getSnapshot(in _: Context, completion: @escaping (NextPrayerEntry) -> Void) {
        completion(NextPrayerEntry(date: .now, data: load()))
    }
    func getTimeline(in _: Context, completion: @escaping (Timeline<NextPrayerEntry>) -> Void) {
        let base = load()
        var entries: [NextPrayerEntry] = []
        let now = Date()

        // 60 entries — one per minute for next hour
        // WidgetKit picks the right one as time advances → live countdown
        for i in 0..<60 {
            let date = Calendar.current.date(byAdding: .minute, value: i, to: now)!
            let updated = recomputeForTime(base: base, currentTime: date)
            entries.append(NextPrayerEntry(date: date, data: updated))
        }

        // Reload timeline 5 min before exhausting it
        let reload = Calendar.current.date(byAdding: .minute, value: 55, to: now)!
        completion(Timeline(entries: entries, policy: .after(reload)))
    }

    private func load() -> NextPrayerData {
        guard let ud = UserDefaults(suiteName: APP_GROUP),
              let raw = ud.data(forKey: NEXT_KEY),
              let data = try? JSONDecoder().decode(NextPrayerData.self, from: raw)
        else { return .placeholder }
        return data
    }

    // Recompute countdown + progress for a specific moment
    private func recomputeForTime(base: NextPrayerData, currentTime: Date) -> NextPrayerData {
        guard let nextDate = parseHHmm(base.time12h, relativeTo: currentTime),
              let curDate  = parseHHmm(base.currentPrayerTime, relativeTo: currentTime)
        else { return base }

        var n = base
        let diffSec = Int(nextDate.timeIntervalSince(currentTime))

        if diffSec > 0 {
            let h = diffSec / 3600
            let m = (diffSec % 3600) / 60
            n.countdown = (h == 0 && m == 0) ? "<1хв"
                        : (h == 0)           ? "\(m)хв"
                        : (m == 0)           ? "\(h)г"
                                             : "\(h)г \(m)хв"
        } else {
            n.countdown = "—"
        }

        let total   = nextDate.timeIntervalSince(curDate)
        let elapsed = currentTime.timeIntervalSince(curDate)
        if total > 0 {
            n.progressPercent = Int((elapsed / total) * 100).clamped(0, 100)
        }
        return n
    }

    private func parseHHmm(_ s: String, relativeTo ref: Date) -> Date? {
        let parts = s.split(separator: ":")
        guard parts.count >= 2,
              let h = Int(parts[0]),
              let m = Int(parts[1].prefix(2)) else { return nil }
        let cal = Calendar.current
        var comps = cal.dateComponents([.year, .month, .day], from: ref)
        comps.hour = h
        comps.minute = m
        var d = cal.date(from: comps)!
        // If time would have already passed, roll to tomorrow
        if d < ref.addingTimeInterval(-12 * 3600) {
            d = cal.date(byAdding: .day, value: 1, to: d)!
        }
        return d
    }
}

// ── Next prayer UI dispatch ──────────────────────────────────────────────
struct NextPrayerWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: NextPrayerEntry

    var body: some View {
        switch family {
        case .systemSmall:           SmallNextView(d: entry.data)
        case .systemMedium:          MediumNextView(d: entry.data)
        case .accessoryRectangular:  LockNextView(d: entry.data)
        case .accessoryCircular:
            VStack(spacing: 1) {
                Text(entry.data.arabicName).font(.system(size: 9))
                Text(entry.data.time12h).font(.system(size: 14, weight: .semibold))
            }.widgetAccentable()
        default: MediumNextView(d: entry.data)
        }
    }
}

struct MediumNextView: View {
    let d: NextPrayerData
    var body: some View {
        ZStack {
            LinearGradient(colors: [cCardHi, cCard],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 7) {
                    Circle().fill(cGreen).frame(width: 7, height: 7)
                    Text("НАСТУПНА МОЛИТВА").font(.system(size: 10, weight: .bold))
                        .foregroundColor(cMuted).tracking(1.0)
                    Spacer()
                }.padding(.bottom, 12)

                HStack(alignment: .lastTextBaseline) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text(d.prayerName).font(.system(size: 36, weight: .bold, design: .serif))
                            .foregroundColor(cWhite)
                        Text(d.arabicName).font(.system(size: 20))
                            .foregroundColor(cGold).padding(.top, -2)
                    }
                    Spacer()
                    Text(d.time12h).font(.system(size: 32, weight: .light))
                        .foregroundColor(cWhite).kerning(-1)
                }

                HStack(spacing: 4) {
                    Image(systemName: "timer").font(.system(size: 11)).foregroundColor(cGold)
                    Text(d.countdown).font(.system(size: 13, weight: .bold)).foregroundColor(cGoldL)
                    Text(" залишилось").font(.system(size: 11)).foregroundColor(cMuted)
                }
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(cGold.opacity(0.1)).clipShape(Capsule())
                .overlay(Capsule().strokeBorder(cGold.opacity(0.28), lineWidth: 1))
                .padding(.top, 12).padding(.bottom, 10)

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2).fill(Color.white.opacity(0.08)).frame(height: 4)
                        RoundedRectangle(cornerRadius: 2).fill(cGold)
                            .frame(width: geo.size.width * CGFloat(d.progressPercent) / 100, height: 4)
                    }
                }.frame(height: 4)

                HStack {
                    Text("\(d.currentPrayerName) (\(d.currentPrayerTime))")
                        .font(.system(size: 10)).foregroundColor(cMuted)
                    Spacer()
                    Text("\(d.prayerName) (\(d.time12h))")
                        .font(.system(size: 10)).foregroundColor(cMuted)
                }.padding(.top, 5)
            }.padding(18)
        }
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .overlay(RoundedRectangle(cornerRadius: 22).strokeBorder(cGold.opacity(0.28), lineWidth: 1))
    }
}

struct SmallNextView: View {
    let d: NextPrayerData
    var body: some View {
        ZStack {
            LinearGradient(colors: [cCardHi, cCard],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 5) {
                    Circle().fill(cGreen).frame(width: 6, height: 6)
                    Text("НАСТУПНА").font(.system(size: 8, weight: .bold))
                        .foregroundColor(cMuted).tracking(0.9)
                }
                Spacer()
                Text(d.prayerName).font(.system(size: 22, weight: .bold, design: .serif))
                    .foregroundColor(cWhite)
                Text(d.arabicName).font(.system(size: 16)).foregroundColor(cGold)
                Spacer()
                Text(d.time12h).font(.system(size: 22, weight: .light)).foregroundColor(cWhite)
                HStack(spacing: 3) {
                    Image(systemName: "timer").font(.system(size: 10)).foregroundColor(cGold)
                    Text(d.countdown).font(.system(size: 11, weight: .semibold)).foregroundColor(cGoldL)
                }.padding(.top, 4)
                GeometryReader { g in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2).fill(Color.white.opacity(0.08)).frame(height: 3)
                        RoundedRectangle(cornerRadius: 2).fill(cGold)
                            .frame(width: g.size.width * CGFloat(d.progressPercent) / 100, height: 3)
                    }
                }.frame(height: 3).padding(.top, 5)
            }.padding(14)
        }
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(cGold.opacity(0.28), lineWidth: 1))
    }
}

struct LockNextView: View {
    let d: NextPrayerData
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "moon.stars").font(.system(size: 15))
            VStack(alignment: .leading, spacing: 1) {
                Text(d.prayerName).font(.system(size: 13, weight: .semibold))
                Text("\(d.time12h) · \(d.countdown)").font(.system(size: 10)).opacity(0.7)
            }
            Spacer()
        }.widgetAccentable()
    }
}

// ═════════════════════════════════════════════════════════════════════════
// CALENDAR WIDGET — all 5 prayers for today
// ═════════════════════════════════════════════════════════════════════════

struct CalendarEntry: TimelineEntry {
    let date: Date
    let data: AllPrayersData
}

struct CalendarProvider: TimelineProvider {
    func placeholder(in _: Context) -> CalendarEntry {
        CalendarEntry(date: .now, data: .placeholder)
    }
    func getSnapshot(in _: Context, completion: @escaping (CalendarEntry) -> Void) {
        completion(CalendarEntry(date: .now, data: load()))
    }
    func getTimeline(in _: Context, completion: @escaping (Timeline<CalendarEntry>) -> Void) {
        let entry = CalendarEntry(date: .now, data: load())
        // Calendar refreshes every 5 minutes — enough to mark prayers as passed
        let next = Calendar.current.date(byAdding: .minute, value: 5, to: .now)!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
    private func load() -> AllPrayersData {
        guard let ud = UserDefaults(suiteName: APP_GROUP),
              let raw = ud.data(forKey: ALL_KEY),
              let data = try? JSONDecoder().decode(AllPrayersData.self, from: raw)
        else { return .placeholder }
        return data
    }
}

struct CalendarWidgetView: View {
    let entry: CalendarEntry
    var body: some View {
        ZStack {
            LinearGradient(colors: [cCardHi, cCard],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text(entry.data.city)
                        .font(.system(size: 13, weight: .bold)).foregroundColor(cWhite)
                    Spacer()
                    Text("\(entry.data.hijriDay) \(entry.data.hijriMonth)")
                        .font(.system(size: 11)).foregroundColor(cGold)
                }.padding(.bottom, 8)

                Rectangle().fill(cGold.opacity(0.15)).frame(height: 1).padding(.bottom, 6)

                ForEach(entry.data.prayers, id: \.name) { p in
                    HStack(spacing: 8) {
                        Circle().fill(cGreen).frame(width: 6, height: 6)
                            .opacity(p.isNext ? 1 : 0)
                        Text(p.name).font(.system(size: 14, weight: .bold))
                            .foregroundColor(colorForRow(p))
                            .frame(width: 80, alignment: .leading)
                        Text(p.arabic).font(.system(size: 13))
                            .foregroundColor(p.isNext ? cGold : cMuted)
                        Spacer()
                        Text(p.time).font(.system(size: 15, weight: .bold))
                            .foregroundColor(colorForRow(p))
                    }
                    .frame(maxHeight: .infinity)
                }
            }.padding(16)
        }
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .overlay(RoundedRectangle(cornerRadius: 22).strokeBorder(cGold.opacity(0.28), lineWidth: 1))
    }

    private func colorForRow(_ p: PrayerRow) -> Color {
        if p.isNext    { return cGoldL }
        if p.hasPassed { return Color(red: 107/255, green: 126/255, blue: 148/255) }
        return cWhite
    }
}

// ═════════════════════════════════════════════════════════════════════════
// WIDGET BUNDLE — both widgets registered together
// ═════════════════════════════════════════════════════════════════════════

struct NextPrayerWidget: Widget {
    let kind = "IslamUANextPrayer"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NextProvider()) { entry in
            NextPrayerWidgetView(entry: entry).containerBackground(.clear, for: .widget)
        }
        .configurationDisplayName("Islam UA · Наступна молитва")
        .description("Час до наступної молитви")
        .supportedFamilies([.systemSmall, .systemMedium,
                            .accessoryRectangular, .accessoryCircular])
    }
}

struct CalendarWidget: Widget {
    let kind = "IslamUACalendar"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
            CalendarWidgetView(entry: entry).containerBackground(.clear, for: .widget)
        }
        .configurationDisplayName("Islam UA · Календар")
        .description("Всі молитви на сьогодні")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

@main
struct IslamUAWidgetBundle: WidgetBundle {
    var body: some Widget {
        NextPrayerWidget()
        CalendarWidget()
    }
}
