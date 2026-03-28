import SwiftUI
import SwiftData

struct SettingsScreen: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @Query private var profiles: [Profile]
    @ObservedObject private var scheduler = AlarmScheduler.shared

    private var profile: Profile? { profiles.first }

    var body: some View {
        NavigationStack {
            List {
                // Profile
                Section {
                    NavigationLink {
                        EditProfileScreen()
                    } label: {
                        settingsRow(icon: "person.fill", title: "Edit Profile", color: .accentColor)
                    }
                }

                // Alarm
                Section("Alarm") {
                    NavigationLink {
                        SnoozeDurationScreen()
                    } label: {
                        HStack {
                            settingsRow(icon: "clock.fill", title: "Snooze Duration", color: .teal)
                            Spacer()
                            Text("\(profile?.snoozeDurationMinutes ?? 9)m")
                                .font(.system(size: 14))
                                .foregroundStyle(.secondary)
                        }
                    }

                    NavigationLink {
                        DefaultFocusScreen()
                    } label: {
                        HStack {
                            settingsRow(icon: "target", title: "Default Focus", color: .purple)
                            Spacer()
                            Text(profile?.defaultFocus.label ?? "Wellness")
                                .font(.system(size: 14))
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                // Notifications
                Section("Notifications") {
                    HStack {
                        settingsRow(icon: "bell.fill", title: "Notifications", color: .accentColor)
                        Spacer()
                        Text(scheduler.isAuthorized ? "Enabled" : "Disabled")
                            .font(.system(size: 14))
                            .foregroundStyle(scheduler.isAuthorized ? .green : .red)
                    }

                    if !scheduler.isAuthorized {
                        Button {
                            if let url = URL(string: UIApplication.openSettingsURLString) {
                                UIApplication.shared.open(url)
                            }
                        } label: {
                            HStack {
                                settingsRow(icon: "gear", title: "Open Settings", color: .gray)
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 12))
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                // Appearance
                Section("Appearance") {
                    NavigationLink {
                        ThemeScreen()
                    } label: {
                        HStack {
                            settingsRow(icon: "moon.fill", title: "Theme", color: .indigo)
                            Spacer()
                            Text((profile?.theme ?? "light").capitalized)
                                .font(.system(size: 14))
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                // About
                Section("About") {
                    HStack {
                        settingsRow(icon: "info.circle.fill", title: "Version", color: .secondary)
                        Spacer()
                        Text("1.0.0")
                            .font(.system(size: 14))
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        settingsRow(icon: "swift", title: "Built with", color: .orange)
                        Spacer()
                        Text("SwiftUI + SwiftData")
                            .font(.system(size: 14))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func settingsRow(icon: String, title: String, color: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(.white)
                .frame(width: 30, height: 30)
                .background(color)
                .clipShape(RoundedRectangle(cornerRadius: 7))
            Text(title)
                .font(.system(size: 16))
        }
    }
}

// MARK: - Edit Profile

struct EditProfileScreen: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query private var profiles: [Profile]

    @State private var name = ""

    private var profile: Profile? { profiles.first }

    var body: some View {
        List {
            Section("Display Name") {
                TextField("Your name", text: $name)
                    .font(.system(size: 18))
            }
        }
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { name = profile?.userName ?? "" }
        .onDisappear {
            let trimmed = name.trimmingCharacters(in: .whitespaces)
            if !trimmed.isEmpty, trimmed != profile?.userName {
                profile?.userName = trimmed
                try? context.save()
            }
        }
    }
}

// MARK: - Snooze Duration

struct SnoozeDurationScreen: View {
    @Environment(\.modelContext) private var context
    @Query private var profiles: [Profile]

    private var profile: Profile? { profiles.first }
    private let options = [1, 3, 5, 9, 10, 15, 20, 30]

    var body: some View {
        List {
            Section(footer: Text("How long the snooze lasts when you tap Snooze on the alarm screen.")) {
                ForEach(options, id: \.self) { minutes in
                    Button {
                        profile?.snoozeDurationMinutes = minutes
                        try? context.save()
                    } label: {
                        HStack {
                            Text("\(minutes) minutes")
                                .foregroundStyle(.primary)
                            Spacer()
                            if profile?.snoozeDurationMinutes == minutes {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(Color.accentColor)
                                    .font(.system(size: 14, weight: .bold))
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Snooze Duration")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Default Focus

struct DefaultFocusScreen: View {
    @Environment(\.modelContext) private var context
    @Query private var profiles: [Profile]

    private var profile: Profile? { profiles.first }

    var body: some View {
        List {
            Section(footer: Text("New alarms will use this focus category by default. This affects the wake-up quote and notification message.")) {
                ForEach(FocusCategory.allCases) { cat in
                    Button {
                        profile?.defaultFocus = cat
                        try? context.save()
                    } label: {
                        HStack(spacing: 14) {
                            Image(systemName: cat.icon)
                                .font(.system(size: 18))
                                .foregroundStyle(Color.accentColor)
                                .frame(width: 32)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(cat.label)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(.primary)
                                Text(cat.description)
                                    .font(.system(size: 12))
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if profile?.defaultFocus == cat {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(Color.accentColor)
                                    .font(.system(size: 14, weight: .bold))
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Default Focus")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Theme

struct ThemeScreen: View {
    @Environment(\.modelContext) private var context
    @Query private var profiles: [Profile]

    private var profile: Profile? { profiles.first }
    private let themes = ["light", "dark", "system"]

    var body: some View {
        List {
            Section(footer: Text("Controls the app's color scheme.")) {
                ForEach(themes, id: \.self) { theme in
                    Button {
                        profile?.theme = theme
                        try? context.save()
                    } label: {
                        HStack {
                            HStack(spacing: 12) {
                                Image(systemName: iconFor(theme))
                                    .font(.system(size: 18))
                                    .foregroundStyle(Color.accentColor)
                                    .frame(width: 32)
                                Text(theme.capitalized)
                                    .foregroundStyle(.primary)
                            }
                            Spacer()
                            if profile?.theme == theme {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(Color.accentColor)
                                    .font(.system(size: 14, weight: .bold))
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Theme")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func iconFor(_ theme: String) -> String {
        switch theme {
        case "dark": "moon.fill"
        case "system": "circle.lefthalf.filled"
        default: "sun.max.fill"
        }
    }
}
