import Foundation
import SwiftData

@Model
final class TaskTemplate {
    @Attribute(.unique) var id: UUID
    var text: String
    var subtext: String
    var icon: String
    var sortOrder: Int
    var isActive: Bool
    var createdAt: Date

    @Relationship(deleteRule: .cascade, inverse: \DailyCompletion.task)
    var completions: [DailyCompletion]

    init(
        text: String,
        subtext: String = "",
        icon: String = "checkmark",
        sortOrder: Int = 0,
        isActive: Bool = true
    ) {
        self.id = UUID()
        self.text = text
        self.subtext = subtext
        self.icon = icon
        self.sortOrder = sortOrder
        self.isActive = isActive
        self.createdAt = .now
        self.completions = []
    }

    /// Check if this task is completed for a given date
    func isCompleted(on date: Date) -> Bool {
        let calendar = Calendar.current
        return completions.contains { calendar.isDate($0.completedDate, inSameDayAs: date) }
    }

    /// Default tasks seeded on first launch
    static let defaults: [(text: String, subtext: String, icon: String)] = [
        ("Drink water", "Hydration is key", "drop.fill"),
        ("3 Gratitude items", "Write them in your journal", "pencil.line"),
        ("Deep breathing", "3 sets of 5 breaths", "wind"),
    ]
}
