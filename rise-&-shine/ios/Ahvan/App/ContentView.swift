import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var context
    @Query private var profiles: [Profile]
    @Query private var allAlarms: [Alarm]
    @ObservedObject private var scheduler = AlarmScheduler.shared
    @State private var selectedTab: Tab = .feed
    @State private var showWakeUp = false
    @State private var wakeAlarm: Alarm?

    enum Tab: String {
        case alarms, feed, profile
    }

    private var profile: Profile? { profiles.first }

    var body: some View {
        Group {
            if let profile, profile.hasCompletedOnboarding {
                mainApp
            } else {
                OnboardingView {
                    seedDefaultData()
                }
            }
        }
        .task {
            AlarmScheduler.shared.setup()
            await AlarmScheduler.shared.requestPermission()
            // Arm keep-alive for background alarm playback
            AlarmScheduler.shared.armNextAlarm(alarms: allAlarms)
        }
        .onChange(of: scheduler.firedAlarmID) { _, newID in
            guard let alarmID = newID else { return }
            if let alarm = allAlarms.first(where: { $0.id == alarmID }) {
                wakeAlarm = alarm
                showWakeUp = true
                AlarmScheduler.shared.playAlarmSound(for: alarm)
            }
            scheduler.firedAlarmID = nil
        }
        .onChange(of: allAlarms.map(\.enabled)) { _, _ in
            // Re-arm when alarms change
            AlarmScheduler.shared.armNextAlarm(alarms: allAlarms)
        }
    }

    @ViewBuilder
    private var mainApp: some View {
        ZStack {
            TabView(selection: $selectedTab) {
                AlarmsScreen(onWake: { alarm in
                    wakeAlarm = alarm
                    showWakeUp = true
                })
                .tag(Tab.alarms)

                FeedScreen()
                    .tag(Tab.feed)

                ProfileScreen()
                    .tag(Tab.profile)
            }
            .tabViewStyle(.automatic)
            .toolbar(.hidden, for: .tabBar)
            .overlay(alignment: .bottom) {
                customTabBar
            }

            if showWakeUp, let alarm = wakeAlarm {
                WakeUpScreen(alarm: alarm) {
                    AlarmScheduler.shared.stopAlarmSound()
                    showWakeUp = false
                    wakeAlarm = nil
                    selectedTab = .feed
                }
                .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: showWakeUp)
    }

    private var customTabBar: some View {
        HStack(spacing: 0) {
            tabButton(.alarms, icon: "alarm.fill", label: "Alarms")
            tabButton(.feed, icon: "sparkles", label: "Feed")
            tabButton(.profile, icon: "gearshape.fill", label: "Profile")
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 28)
        .background(.ultraThinMaterial)
        .clipShape(UnevenRoundedRectangle(topLeadingRadius: 28, topTrailingRadius: 28))
        .shadow(color: .black.opacity(0.04), radius: 20, y: -8)
    }

    private func tabButton(_ tab: Tab, icon: String, label: String) -> some View {
        Button {
            selectedTab = tab
        } label: {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 22))
                Text(label)
                    .font(.system(size: 11, weight: .semibold))
                    .textCase(.uppercase)
                    .tracking(0.5)
            }
            .foregroundStyle(selectedTab == tab ? Color.accentColor : .secondary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
            .background(
                selectedTab == tab
                    ? Capsule().fill(Color.accentColor.opacity(0.12))
                    : nil
            )
        }
        .buttonStyle(.plain)
    }

    private func seedDefaultData() {
        // Create profile if it doesn't exist
        if profiles.isEmpty {
            let newProfile = Profile()
            newProfile.hasCompletedOnboarding = true
            context.insert(newProfile)
        } else if let existing = profiles.first {
            existing.hasCompletedOnboarding = true
        }

        // Seed default tasks if none exist
        let descriptor = FetchDescriptor<TaskTemplate>()
        let existingTasks = (try? context.fetch(descriptor)) ?? []
        if existingTasks.isEmpty {
            for (i, task) in TaskTemplate.defaults.enumerated() {
                let template = TaskTemplate(
                    text: task.text,
                    subtext: task.subtext,
                    icon: task.icon,
                    sortOrder: i
                )
                context.insert(template)
            }
        }

        try? context.save()
    }
}
