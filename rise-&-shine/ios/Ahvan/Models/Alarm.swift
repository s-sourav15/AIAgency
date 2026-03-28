import Foundation
import SwiftData

@Model
final class Alarm {
    @Attribute(.unique) var id: UUID
    var hour: Int
    var minute: Int
    var days: [DayOfWeek]
    var sound: AlarmSound
    var customSoundPath: String?
    var customSoundDurationSecs: Int?
    var focus: FocusCategory
    var enabled: Bool
    var wakeImagePath: String?
    var createdAt: Date

    init(
        hour: Int = 6,
        minute: Int = 30,
        days: [DayOfWeek] = DayOfWeek.allCases.filter { [.mon, .tue, .wed, .thu, .fri].contains($0) },
        sound: AlarmSound = .birdChirping,
        focus: FocusCategory = .wellness,
        enabled: Bool = true
    ) {
        self.id = UUID()
        self.hour = hour
        self.minute = minute
        self.days = days
        self.sound = sound
        self.customSoundPath = nil
        self.customSoundDurationSecs = nil
        self.focus = focus
        self.enabled = enabled
        self.wakeImagePath = nil
        self.createdAt = .now
    }

    /// Formatted time string e.g. "6:30"
    var timeString: String {
        String(format: "%d:%02d", displayHour, minute)
    }

    /// 12-hour display hour
    var displayHour: Int {
        let h = hour % 12
        return h == 0 ? 12 : h
    }

    /// "AM" or "PM"
    var period: String {
        hour < 12 ? "AM" : "PM"
    }

    /// Whether this is a one-time alarm (no repeat days)
    var isOneTime: Bool {
        days.isEmpty
    }

    /// Next fire date from now
    var nextFireDate: Date? {
        let calendar = Calendar.current
        let now = Date()

        if isOneTime {
            var components = calendar.dateComponents([.year, .month, .day], from: now)
            components.hour = hour
            components.minute = minute
            components.second = 0
            guard let date = calendar.date(from: components) else { return nil }
            return date > now ? date : calendar.date(byAdding: .day, value: 1, to: date)
        }

        // Find the next matching weekday
        let todayWeekday = calendar.component(.weekday, from: now)
        let sortedDays = days.sorted { $0.calendarWeekday < $1.calendarWeekday }

        for offset in 0..<8 {
            let targetWeekday = ((todayWeekday - 1 + offset) % 7) + 1
            if let day = sortedDays.first(where: { $0.calendarWeekday == targetWeekday }) {
                var components = calendar.dateComponents([.year, .month, .day], from: now)
                components.hour = hour
                components.minute = minute
                components.second = 0
                guard let baseDate = calendar.date(from: components) else { continue }
                guard let candidate = calendar.date(byAdding: .day, value: offset, to: baseDate) else { continue }

                if candidate > now {
                    // Verify weekday matches (handles week boundary)
                    let candidateWeekday = calendar.component(.weekday, from: candidate)
                    if candidateWeekday == day.calendarWeekday {
                        return candidate
                    }
                }
            }
        }
        return nil
    }
}
