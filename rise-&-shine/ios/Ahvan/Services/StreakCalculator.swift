import Foundation
import SwiftData

struct StreakResult {
    let currentStreak: Int
    let streakLevel: Int
    let longestStreak: Int
    let completionToday: CompletionResult
}

struct CompletionResult {
    let totalTasks: Int
    let completedTasks: Int

    var percentage: Int {
        guard totalTasks > 0 else { return 0 }
        return (completedTasks * 100) / totalTasks
    }
}

struct StreakCalculator {

    /// Calculate streak from SwiftData context
    static func calculate(
        tasks: [TaskTemplate],
        completions: [DailyCompletion]
    ) -> StreakResult {
        let activeTasks = tasks.filter(\.isActive)
        let today = Calendar.current.startOfDay(for: .now)

        let todayResult = completionForDate(today, activeTasks: activeTasks, completions: completions)

        guard !activeTasks.isEmpty else {
            return StreakResult(currentStreak: 0, streakLevel: 1, longestStreak: 0, completionToday: todayResult)
        }

        let activeTaskCount = activeTasks.count

        // Group completions by date
        let calendar = Calendar.current
        var completionsByDate: [Date: Set<UUID>] = [:]
        for completion in completions {
            guard let task = completion.task, activeTasks.contains(where: { $0.id == task.id }) else { continue }
            let day = calendar.startOfDay(for: completion.completedDate)
            completionsByDate[day, default: []].insert(task.id)
        }

        // Find dates where ALL active tasks were completed
        let fullyCompletedDates = completionsByDate
            .filter { $0.value.count >= activeTaskCount }
            .map(\.key)
            .sorted(by: >)

        // Walk backwards to find current streak
        var currentStreak = 0
        var checkDate = today

        // Allow today or yesterday as the streak start
        if !fullyCompletedDates.contains(today) {
            checkDate = calendar.date(byAdding: .day, value: -1, to: today)!
        }

        for date in fullyCompletedDates {
            if calendar.isDate(date, inSameDayAs: checkDate) {
                currentStreak += 1
                checkDate = calendar.date(byAdding: .day, value: -1, to: checkDate)!
            } else if date < checkDate {
                break
            }
        }

        // Find longest streak
        var longestStreak = 0
        var runningStreak = 0
        var prevDate: Date?

        for date in fullyCompletedDates {
            if let prev = prevDate {
                let diff = calendar.dateComponents([.day], from: date, to: prev).day ?? 0
                if diff == 1 {
                    runningStreak += 1
                } else {
                    longestStreak = max(longestStreak, runningStreak)
                    runningStreak = 1
                }
            } else {
                runningStreak = 1
            }
            prevDate = date
        }
        longestStreak = max(longestStreak, runningStreak)

        let streakLevel = max(1, (currentStreak / 7) + 1)

        return StreakResult(
            currentStreak: currentStreak,
            streakLevel: streakLevel,
            longestStreak: longestStreak,
            completionToday: todayResult
        )
    }

    private static func completionForDate(
        _ date: Date,
        activeTasks: [TaskTemplate],
        completions: [DailyCompletion]
    ) -> CompletionResult {
        let calendar = Calendar.current
        let todayCompletions = completions.filter { calendar.isDate($0.completedDate, inSameDayAs: date) }
        let completedTaskIDs = Set(todayCompletions.compactMap { $0.task?.id })
        let completedCount = activeTasks.filter { completedTaskIDs.contains($0.id) }.count

        return CompletionResult(totalTasks: activeTasks.count, completedTasks: completedCount)
    }
}
