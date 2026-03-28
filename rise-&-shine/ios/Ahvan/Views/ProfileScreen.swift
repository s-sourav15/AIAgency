import SwiftUI
import SwiftData
import PhotosUI

struct ProfileScreen: View {
    @Environment(\.modelContext) private var context
    @Query private var profiles: [Profile]
    @Query(filter: #Predicate<TaskTemplate> { $0.isActive }, sort: \TaskTemplate.sortOrder)
    private var tasks: [TaskTemplate]
    @Query private var completions: [DailyCompletion]

    @State private var isEditingVision = false
    @State private var editQuote = ""
    @State private var visionImageItem: PhotosPickerItem?
    @State private var profileImageItem: PhotosPickerItem?
    @State private var showResetAlert = false
    @State private var showSettings = false

    private var profile: Profile? { profiles.first }
    private var userName: String { profile?.userName ?? "Friend" }

    private var streak: StreakResult {
        StreakCalculator.calculate(tasks: tasks, completions: completions)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                profileHeader
                visionBoardSection
                statsCards
                settingsSection
                quoteSection
                resetButton
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 120)
        }
        .background(Color(.systemGroupedBackground))
        .alert("Reset Everything?", isPresented: $showResetAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Reset", role: .destructive) { resetProfile() }
        } message: {
            Text("This will clear all your data, alarms, and tasks. This cannot be undone.")
        }
    }

    // MARK: - Header

    private var profileHeader: some View {
        HStack(spacing: 20) {
            // Avatar with photo picker
            PhotosPicker(selection: $profileImageItem, matching: .images) {
                ZStack(alignment: .bottomTrailing) {
                    Circle()
                        .fill(Color.accentColor.opacity(0.1))
                        .frame(width: 100, height: 100)
                        .overlay {
                            if let path = profile?.profileImagePath {
                                AppImage(path: path)
                                    .clipShape(Circle())
                            } else {
                                Image(systemName: "person.crop.circle.fill")
                                    .font(.system(size: 50))
                                    .foregroundStyle(.tertiary)
                            }
                        }

                    Image(systemName: "pencil")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 28, height: 28)
                        .background(Color.accentColor)
                        .clipShape(Circle())
                }
            }
            .buttonStyle(.plain)
            .onChange(of: profileImageItem) { _, newItem in
                Task {
                    if let data = try? await newItem?.loadTransferable(type: Data.self) {
                        profile?.profileImagePath = FileManager.saveImage(data, to: FileManager.avatarDirectory, name: "avatar")
                        try? context.save()
                    }
                }
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(userName)
                    .font(.headline(32, weight: .heavy))
                    .tracking(-0.5)

                Text("Finding clarity in every sunrise.")
                    .font(.body(16))
                    .italic()
                    .foregroundStyle(.secondary)

                HStack(spacing: 8) {
                    if streak.currentStreak > 0 {
                        badgePill("Early Bird Gold", color: .accentColor)
                    }
                    let year = Calendar.current.component(.year, from: profile?.createdAt ?? .now)
                    badgePill("Since \(year)", color: .secondary)
                }
                .padding(.top, 2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
    }

    private func badgePill(_ text: String, color: Color) -> some View {
        Text(text.uppercased())
            .font(.system(size: 10, weight: .bold))
            .tracking(1)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.1))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }

    // MARK: - Vision Board

    private var visionBoardSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Vision Board")
                    .font(.headline(18))
                    .foregroundStyle(.secondary)
                Spacer()
                Button(isEditingVision ? "Done" : "Edit") {
                    if isEditingVision {
                        saveVision()
                    } else {
                        editQuote = profile?.visionQuote ?? ""
                    }
                    isEditingVision.toggle()
                }
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Color.accentColor)
                .textCase(.uppercase)
            }

            if isEditingVision {
                visionEditMode
            } else {
                visionViewMode
            }
        }
    }

    private var visionViewMode: some View {
        HStack(spacing: 16) {
            AppImage(path: profile?.visionImagePath)
                .frame(width: 80, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 4) {
                Text("Your Vision")
                    .font(.headline(16))
                Text("\"\(profile?.visionQuote ?? "")\"")
                    .font(.body(14))
                    .italic()
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var visionEditMode: some View {
        VStack(spacing: 16) {
            PhotosPicker(selection: $visionImageItem, matching: .images) {
                HStack {
                    Image(systemName: "photo")
                    Text("Change Image")
                        .font(.system(size: 14, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(12)
                .background(Color(.tertiarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            .onChange(of: visionImageItem) { _, newItem in
                Task {
                    if let data = try? await newItem?.loadTransferable(type: Data.self) {
                        profile?.visionImagePath = FileManager.saveImage(data, to: FileManager.visionDirectory, name: "vision")
                        try? context.save()
                    }
                }
            }

            TextField("Your motivation quote", text: $editQuote, axis: .vertical)
                .font(.body(16))
                .italic()
                .padding(12)
                .background(Color(.tertiarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .lineLimit(2...4)

            // Presets
            HStack(spacing: 8) {
                ForEach(ContentLoader.visionPresets) { preset in
                    Button {
                        editQuote = preset.quote
                        profile?.visionImagePath = "asset:\(preset.imageName)"
                    } label: {
                        Text(preset.name)
                            .font(.system(size: 11, weight: .bold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.accentColor.opacity(0.1))
                            .foregroundStyle(Color.accentColor)
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .padding(20)
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Stats

    private var statsCards: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 0) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(Color.accentColor)
                Spacer()
                Text("\(streak.currentStreak)")
                    .font(.headline(40, weight: .heavy))
                    .foregroundStyle(Color.accentColor)
                Text("Day Streak")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(20)
            .frame(maxWidth: .infinity)
            .aspectRatio(1, contentMode: .fit)
            .background(.background)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.04), radius: 8, y: 4)

            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .stroke(Color(.systemGray4), lineWidth: 6)
                    Circle()
                        .trim(from: 0, to: Double(streak.completionToday.percentage) / 100.0)
                        .stroke(Color.rsSecondary, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Text("\(streak.completionToday.percentage)%")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color.rsSecondary)
                }
                .frame(width: 64, height: 64)

                Spacer()

                VStack(spacing: 2) {
                    Text("Tasks")
                        .font(.headline(28, weight: .heavy))
                        .foregroundStyle(Color.rsSecondary)
                    Text("Completion")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.secondary)
                }
            }
            .padding(20)
            .frame(maxWidth: .infinity)
            .aspectRatio(1, contentMode: .fit)
            .background(.background)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
        }
    }

    // MARK: - Settings

    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Settings & Preferences")
                .font(.headline(18))
                .foregroundStyle(.secondary)

            Button {
                showSettings = true
            } label: {
                VStack(spacing: 2) {
                    settingsRowView(icon: "bell.fill", title: "Notifications",
                               subtitle: AlarmScheduler.shared.isAuthorized ? "Enabled" : "Disabled",
                               color: .accentColor)
                    settingsRowView(icon: "moon.fill", title: "Theme",
                               subtitle: (profile?.theme ?? "light").capitalized,
                               color: .rsSecondary)
                    settingsRowView(icon: "clock.fill", title: "Snooze Duration",
                               subtitle: "\(profile?.snoozeDurationMinutes ?? 9) minutes",
                               color: .teal)
                    settingsRowView(icon: "info.circle.fill", title: "About",
                               subtitle: "Version 1.0.0",
                               color: .secondary)
                }
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(.plain)
            .sheet(isPresented: $showSettings) {
                SettingsScreen()
            }
        }
    }

    private func settingsRowView(icon: String, title: String, subtitle: String, color: Color) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(color)
                .frame(width: 36, height: 36)
                .background(color.opacity(0.1))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.system(size: 16, weight: .semibold))
                Text(subtitle).font(.system(size: 12)).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13))
                .foregroundStyle(.tertiary)
        }
        .padding(16)
        .background(.background)
    }

    // MARK: - Quote

    private var quoteSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\u{201C}")
                .font(.system(size: 60, design: .serif))
                .foregroundStyle(Color.accentColor.opacity(0.2))
                .offset(y: 20)

            Text("The way you start your day determines the way you live your life. Keep shining, \(userName).")
                .font(.body(22))
                .italic()
                .lineSpacing(6)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Reset

    private var resetButton: some View {
        Button {
            showResetAlert = true
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "arrow.counterclockwise")
                Text("Reset Everything")
                    .font(.headline(16))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color(.secondarySystemGroupedBackground))
            .foregroundStyle(.red)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: - Actions

    private func saveVision() {
        profile?.visionQuote = editQuote
        try? context.save()
    }

    private func resetProfile() {
        if let profile {
            profile.hasCompletedOnboarding = false
            profile.userName = ""
            profile.visionQuote = ""
            profile.visionImagePath = nil
            profile.aiContentCache = [:]
            profile.longestStreak = 0
        }
        // Delete all alarms, tasks, completions
        try? context.delete(model: Alarm.self)
        try? context.delete(model: TaskTemplate.self)
        try? context.delete(model: DailyCompletion.self)
        try? context.save()
        AlarmScheduler.shared.scheduleAllAlarms([])
    }
}
