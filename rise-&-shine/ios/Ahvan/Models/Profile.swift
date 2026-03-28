import Foundation
import SwiftData

@Model
final class Profile {
    var userName: String
    var profileImagePath: String?
    var visionImagePath: String?
    var visionQuote: String
    var theme: String
    var notificationsEnabled: Bool
    var snoozeDurationMinutes: Int
    var longestStreak: Int
    var aiContentCache: [String: CachedContent]
    var hasCompletedOnboarding: Bool
    var defaultFocus: FocusCategory
    var createdAt: Date

    init(
        userName: String = "",
        visionQuote: String = "Every sunrise is an invitation to brighten someone's day.",
        theme: String = "light",
        notificationsEnabled: Bool = true,
        snoozeDurationMinutes: Int = 9,
        defaultFocus: FocusCategory = .wellness
    ) {
        self.userName = userName
        self.profileImagePath = nil
        self.visionImagePath = nil
        self.visionQuote = visionQuote
        self.theme = theme
        self.notificationsEnabled = notificationsEnabled
        self.snoozeDurationMinutes = snoozeDurationMinutes
        self.longestStreak = 0
        self.aiContentCache = [:]
        self.hasCompletedOnboarding = false
        self.defaultFocus = defaultFocus
        self.createdAt = .now
    }
}

struct CachedContent: Codable {
    let affirmation: String
    let insight: String
    let fetchedAt: Date
}
