import Foundation

enum FocusCategory: String, Codable, CaseIterable, Identifiable {
    case career
    case wellness
    case creativity
    case mindfulness

    var id: String { rawValue }

    var label: String {
        rawValue.capitalized
    }

    var icon: String {
        switch self {
        case .career: "briefcase.fill"
        case .wellness: "leaf.fill"
        case .creativity: "paintpalette.fill"
        case .mindfulness: "heart.fill"
        }
    }

    var description: String {
        switch self {
        case .career: "Ambition, focus, and professional growth strategies."
        case .wellness: "Vibrant health, physical energy, and holistic balance."
        case .creativity: "Unlocking imagination and expressive morning flow."
        case .mindfulness: "Inner peace, presence, and intentional awareness."
        }
    }
}

enum AlarmSound: String, Codable, CaseIterable, Identifiable {
    case birdChirping = "bird_chirping"
    case oceanWaves = "ocean_waves"
    case forestMist = "forest_mist"
    case gentlePiano = "gentle_piano"
    case morningBells = "morning_bells"
    case sunriseChime = "sunrise_chime"
    case silent
    case custom

    var id: String { rawValue }

    var label: String {
        switch self {
        case .birdChirping: "Birds Chirping"
        case .oceanWaves: "Ocean Waves"
        case .forestMist: "Forest Mist"
        case .gentlePiano: "Gentle Piano"
        case .morningBells: "Morning Bells"
        case .sunriseChime: "Sunrise Chime"
        case .silent: "Silent"
        case .custom: "Custom"
        }
    }

    var subtitle: String {
        switch self {
        case .birdChirping: "Gentle morning birds"
        case .oceanWaves: "Calm ocean surf"
        case .forestMist: "Soft forest ambience"
        case .gentlePiano: "Gentle keys & soft melody"
        case .morningBells: "Warm bell tones"
        case .sunriseChime: "Bright chime sequence"
        case .silent: "No sound"
        case .custom: "Your uploaded audio"
        }
    }

    /// Filename of the bundled audio asset (without extension)
    var assetName: String? {
        if self == .custom || self == .silent { return nil }
        return rawValue
    }
}

enum DayOfWeek: Int, Codable, CaseIterable, Identifiable {
    case mon = 2, tue = 3, wed = 4, thu = 5, fri = 6, sat = 7, sun = 1

    var id: Int { rawValue }

    var shortLabel: String {
        switch self {
        case .mon: "M"
        case .tue: "T"
        case .wed: "W"
        case .thu: "T"
        case .fri: "F"
        case .sat: "S"
        case .sun: "S"
        }
    }

    var fullLabel: String {
        switch self {
        case .mon: "MON"
        case .tue: "TUE"
        case .wed: "WED"
        case .thu: "THU"
        case .fri: "FRI"
        case .sat: "SAT"
        case .sun: "SUN"
        }
    }

    /// Maps to Calendar weekday component (Sunday = 1)
    var calendarWeekday: Int { rawValue }
}
