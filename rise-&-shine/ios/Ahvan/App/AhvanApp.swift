import SwiftUI
import SwiftData

@main
struct AhvanApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [
            Profile.self,
            Alarm.self,
            TaskTemplate.self,
            DailyCompletion.self,
        ])
    }
}
