import SwiftUI
import SwiftData

struct FeedScreen: View {
    @Environment(\.modelContext) private var context
    @Query private var profiles: [Profile]
    @Query(filter: #Predicate<TaskTemplate> { $0.isActive }, sort: \TaskTemplate.sortOrder)
    private var tasks: [TaskTemplate]
    @Query private var completions: [DailyCompletion]

    @State private var affirmation = ""
    @State private var insight = ""
    @State private var hasFetchedContent = false
    @State private var showAddTask = false
    @State private var editingTask: TaskTemplate?

    private var profile: Profile? { profiles.first }
    private var userName: String { profile?.userName.isEmpty == false ? profile!.userName : "Friend" }

    private var streak: StreakResult {
        StreakCalculator.calculate(tasks: tasks, completions: completions)
    }

    private var todayKey: String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: .now)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                greetingSection
                visionBoardCard
                affirmationCard
                statsRow
                morningTasksSection
                insightCard
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 100)
        }
        .background(Color(.systemGroupedBackground))
        .task { await loadContent() }
        .sheet(isPresented: $showAddTask) {
            TaskEditorSheet()
        }
        .sheet(item: $editingTask) { task in
            TaskEditorSheet(taskToEdit: task)
        }
    }

    // MARK: - Greeting

    private var timeGreeting: String {
        let hour = Calendar.current.component(.hour, from: .now)
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        case 17..<21: return "Good evening"
        default: return "Good night"
        }
    }

    private var timeHeadline: String {
        let hour = Calendar.current.component(.hour, from: .now)
        switch hour {
        case 5..<12: return "Ready to find\nyour light today?"
        case 12..<17: return "Keep pushing\ntoward your goals."
        case 17..<21: return "Wind down and\nreflect on today."
        default: return "Rest well,\ntomorrow awaits."
        }
    }

    private var greetingSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(timeGreeting), \(userName).")
                .font(.body(18))
                .italic()
                .foregroundStyle(.secondary)
            Text(timeHeadline)
                .font(.headline(34, weight: .heavy))
                .tracking(-0.5)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
    }

    // MARK: - Vision Board

    private var visionBoardCard: some View {
        ZStack(alignment: .bottomLeading) {
            AppImage(path: profile?.visionImagePath)
                .frame(height: 200)
                .clipped()

            LinearGradient(colors: [.clear, .black.opacity(0.6)], startPoint: .center, endPoint: .bottom)

            VStack(alignment: .leading, spacing: 4) {
                Text("YOUR GOAL")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(.white.opacity(0.7))
                Text(profile?.visionQuote ?? "Set your vision")
                    .font(.body(18))
                    .italic()
                    .foregroundStyle(.white)
                    .lineLimit(2)
            }
            .padding(16)
        }
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.08), radius: 12, y: 6)
    }

    // MARK: - Affirmation

    private var affirmationCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("DAILY AFFIRMATION")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(Color.accentColor)
                Spacer()
            }

            Image(systemName: "quote.opening")
                .font(.system(size: 28))
                .foregroundStyle(Color.accentColor)

            Text(affirmation.isEmpty ? "Today is a gift, and I am exactly where I need to be to grow." : affirmation)
                .font(.body(24))
                .lineSpacing(4)

            HStack(spacing: 8) {
                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 32, height: 1)
                Text("Mindful Reminder")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(24)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
    }

    // MARK: - Stats

    private var statsRow: some View {
        HStack(spacing: 16) {
            // Streak card
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Image(systemName: "flame.fill")
                        .foregroundStyle(Color.accentColor)
                    Spacer()
                    Text("LEVEL \(streak.streakLevel)")
                        .font(.system(size: 10, weight: .bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.accentColor.opacity(0.12))
                        .foregroundStyle(Color.accentColor)
                        .clipShape(Capsule())
                }
                Spacer()
                Text("\(streak.currentStreak)")
                    .font(.headline(40, weight: .heavy))
                Text("Day Streak")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(20)
            .frame(maxWidth: .infinity)
            .aspectRatio(1, contentMode: .fit)
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Completion card
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .stroke(Color(.systemGray4), lineWidth: 6)
                    Circle()
                        .trim(from: 0, to: Double(streak.completionToday.percentage) / 100.0)
                        .stroke(Color.accentColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Text("\(streak.completionToday.percentage)%")
                        .font(.headline(20, weight: .heavy))
                }
                .frame(width: 80, height: 80)

                Text("Complete")
                    .font(.system(size: 11, weight: .bold))
                    .textCase(.uppercase)
                    .tracking(1)
                    .foregroundStyle(.secondary)
            }
            .padding(20)
            .frame(maxWidth: .infinity)
            .aspectRatio(1, contentMode: .fit)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
        }
    }

    // MARK: - Tasks

    private var morningTasksSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Morning Tasks")
                    .font(.headline(20))
                Spacer()
                Text("\(streak.completionToday.completedTasks)/\(streak.completionToday.totalTasks)")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.accentColor)

                Button {
                    showAddTask = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(Color.accentColor)
                }
            }

            if tasks.isEmpty {
                Text("Add your morning ritual tasks")
                    .font(.body(16))
                    .foregroundStyle(.tertiary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
            } else {
                ForEach(tasks) { task in
                    taskRow(task)
                }
            }
        }
    }

    private func taskRow(_ task: TaskTemplate) -> some View {
        let isComplete = task.isCompleted(on: .now)

        return Button {
            toggleTask(task)
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .stroke(isComplete ? Color.accentColor : Color(.systemGray3), lineWidth: 2)
                        .frame(width: 26, height: 26)
                    if isComplete {
                        Circle()
                            .fill(Color.accentColor)
                            .frame(width: 26, height: 26)
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(task.text)
                        .font(.system(size: 16, weight: .semibold))
                        .strikethrough(isComplete)
                        .foregroundStyle(isComplete ? .secondary : .primary)
                    if !task.subtext.isEmpty {
                        Text(task.subtext)
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Image(systemName: task.icon)
                    .foregroundStyle(.tertiary)
            }
            .padding(16)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button {
                editingTask = task
            } label: {
                Label("Edit Task", systemImage: "pencil")
            }

            Button(role: .destructive) {
                task.isActive = false
                try? context.save()
            } label: {
                Label("Remove Task", systemImage: "trash")
            }
        }
    }

    // MARK: - Insight

    private var insightCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "sparkles")
                    .font(.system(size: 12))
                Text("MORNING INSIGHT")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(2)
            }
            .foregroundStyle(.white.opacity(0.8))

            Text(insight.isEmpty ? "Exposure to natural light within 30 minutes of waking resets your circadian rhythm." : insight)
                .font(.body(18))
                .italic()
                .foregroundStyle(.white)
                .lineSpacing(4)

            Text("— Wellness Guide")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white.opacity(0.5))
        }
        .padding(24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.rsSecondary.opacity(0.85))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Actions

    private func toggleTask(_ task: TaskTemplate) {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: .now)

        if let existing = task.completions.first(where: { calendar.isDate($0.completedDate, inSameDayAs: today) }) {
            context.delete(existing)
        } else {
            let completion = DailyCompletion(task: task)
            context.insert(completion)
        }
        try? context.save()
    }

    private func loadContent() async {
        guard !hasFetchedContent else { return }
        hasFetchedContent = true

        // Check cache first
        if let cached = profile?.aiContentCache[todayKey] {
            affirmation = cached.affirmation
            insight = cached.insight
            return
        }

        // Try Gemini
        let focus = profile?.defaultFocus ?? .wellness
        if let content = await GeminiService.shared.fetchDailyContent(
            userName: userName,
            focus: focus,
            streak: streak.currentStreak,
            visionQuote: profile?.visionQuote ?? ""
        ) {
            affirmation = content.affirmation
            insight = content.insight

            // Cache it
            profile?.aiContentCache[todayKey] = CachedContent(
                affirmation: content.affirmation,
                insight: content.insight,
                fetchedAt: .now
            )
            try? context.save()
            return
        }

        // Fallback to bundled content
        affirmation = ContentLoader.shared.randomAffirmation(for: focus)?.body ?? ""
        insight = ContentLoader.shared.randomInsight(for: focus)?.body ?? ""
    }
}

// MARK: - Task Editor Sheet

struct TaskEditorSheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    var taskToEdit: TaskTemplate?

    @State private var taskText = ""
    @State private var taskSubtext = ""
    @State private var selectedIcon = "checkmark"

    private var isEditing: Bool { taskToEdit != nil }

    private let iconOptions = [
        "drop.fill", "pencil.line", "wind", "figure.run",
        "book.fill", "cup.and.saucer.fill", "leaf.fill", "sun.max.fill",
        "heart.fill", "brain.head.profile", "music.note", "checkmark",
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("TASK NAME")
                        .font(.system(size: 12, weight: .bold))
                        .tracking(2)
                        .foregroundStyle(.secondary)

                    TextField("e.g. Drink water", text: $taskText)
                        .font(.system(size: 18, weight: .semibold))
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    Text("DESCRIPTION")
                        .font(.system(size: 12, weight: .bold))
                        .tracking(2)
                        .foregroundStyle(.secondary)

                    TextField("Optional subtitle", text: $taskSubtext)
                        .font(.system(size: 16))
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    Text("ICON")
                        .font(.system(size: 12, weight: .bold))
                        .tracking(2)
                        .foregroundStyle(.secondary)

                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 6), spacing: 12) {
                        ForEach(iconOptions, id: \.self) { iconName in
                            Button {
                                selectedIcon = iconName
                            } label: {
                                Image(systemName: iconName)
                                    .font(.system(size: 18))
                                    .frame(width: 44, height: 44)
                                    .background(selectedIcon == iconName ? Color.accentColor.opacity(0.15) : Color(.secondarySystemGroupedBackground))
                                    .foregroundStyle(selectedIcon == iconName ? Color.accentColor : .secondary)
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(selectedIcon == iconName ? Color.accentColor : .clear, lineWidth: 2)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    Button {
                        saveTask()
                    } label: {
                        Text(isEditing ? "Update Task" : "Add Task")
                            .font(.headline(18))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(taskText.isEmpty ? Color.gray : Color.accentColor)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .disabled(taskText.isEmpty)
                    .padding(.top, 8)
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 40)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(isEditing ? "Edit Task" : "New Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear {
                if let task = taskToEdit {
                    taskText = task.text
                    taskSubtext = task.subtext
                    selectedIcon = task.icon
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func saveTask() {
        if let task = taskToEdit {
            task.text = taskText.trimmingCharacters(in: .whitespaces)
            task.subtext = taskSubtext.trimmingCharacters(in: .whitespaces)
            task.icon = selectedIcon
        } else {
            let descriptor = FetchDescriptor<TaskTemplate>(sortBy: [SortDescriptor(\TaskTemplate.sortOrder, order: .reverse)])
            let maxOrder = (try? context.fetch(descriptor))?.first?.sortOrder ?? -1
            let task = TaskTemplate(
                text: taskText.trimmingCharacters(in: .whitespaces),
                subtext: taskSubtext.trimmingCharacters(in: .whitespaces),
                icon: selectedIcon,
                sortOrder: maxOrder + 1
            )
            context.insert(task)
        }
        try? context.save()
        dismiss()
    }
}
