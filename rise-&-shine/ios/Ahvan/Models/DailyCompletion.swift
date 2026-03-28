import Foundation
import SwiftData

@Model
final class DailyCompletion {
    @Attribute(.unique) var id: UUID
    var completedDate: Date
    var completedAt: Date
    var task: TaskTemplate?

    init(task: TaskTemplate, date: Date = .now) {
        self.id = UUID()
        self.completedDate = Calendar.current.startOfDay(for: date)
        self.completedAt = .now
        self.task = task
    }
}
