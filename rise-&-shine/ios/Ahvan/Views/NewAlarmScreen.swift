import SwiftUI
import SwiftData
import PhotosUI
import UniformTypeIdentifiers

struct NewAlarmScreen: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    var alarmToEdit: Alarm?

    @State private var selectedTime = {
        var components = DateComponents()
        components.hour = 6
        components.minute = 30
        return Calendar.current.date(from: components) ?? .now
    }()
    @State private var selectedDays: Set<DayOfWeek> = [.mon, .tue, .wed, .thu, .fri]
    @State private var selectedSound: AlarmSound = .birdChirping
    @State private var selectedFocus: FocusCategory = .wellness
    @State private var wakeImageItem: PhotosPickerItem?
    @State private var wakeImageData: Data?
    @State private var showFilePicker = false
    @State private var customSoundDisplayName: String?
    @State private var customSoundFileName: String?

    private var isEditing: Bool { alarmToEdit != nil }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 28) {
                    headerSection
                    timePicker
                    daysSection
                    focusSection
                    soundSection
                    wakeImageSection
                    saveButton

                    if isEditing {
                        deleteButton
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
            .background(Color(.systemGroupedBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.secondary)
                            .frame(width: 32, height: 32)
                            .background(Color(.secondarySystemGroupedBackground))
                            .clipShape(Circle())
                    }
                }
            }
            .onAppear {
                if let alarm = alarmToEdit {
                    populateFromAlarm(alarm)
                }
            }
            .fileImporter(
                isPresented: $showFilePicker,
                allowedContentTypes: [.audio],
                allowsMultipleSelection: false
            ) { result in
                handleAudioImport(result)
            }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 4) {
            Text(isEditing ? "Adjust your wake-up call" : "What time shall we wake?")
                .font(.body(18))
                .italic()
                .foregroundStyle(.secondary)
            Text(isEditing ? "Edit Alarm" : "New Alarm")
                .font(.headline(34, weight: .heavy))
        }
        .padding(.top, 16)
    }

    // MARK: - Time Picker

    private var timePicker: some View {
        DatePicker("", selection: $selectedTime, displayedComponents: .hourAndMinute)
            .datePickerStyle(.wheel)
            .labelsHidden()
            .frame(height: 160)
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Days

    private var daysSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("REPEAT ON")
                .font(.system(size: 12, weight: .bold))
                .tracking(2)
                .foregroundStyle(.secondary)

            HStack(spacing: 8) {
                ForEach(DayOfWeek.allCases) { day in
                    let isSelected = selectedDays.contains(day)
                    Button {
                        if isSelected { selectedDays.remove(day) }
                        else { selectedDays.insert(day) }
                    } label: {
                        Text(day.shortLabel)
                            .font(.system(size: 14, weight: .bold))
                            .frame(width: 40, height: 40)
                            .background(isSelected ? Color.accentColor : Color(.secondarySystemGroupedBackground))
                            .foregroundStyle(isSelected ? .white : .secondary)
                            .clipShape(Circle())
                    }
                }
            }
        }
    }

    // MARK: - Focus

    private var focusSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("WAKE-UP FOCUS")
                    .font(.system(size: 12, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("Changes visual theme")
                    .font(.body(13))
                    .italic()
                    .foregroundStyle(Color.accentColor)
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 2), spacing: 12) {
                ForEach(FocusCategory.allCases) { cat in
                    let isSelected = selectedFocus == cat
                    Button { selectedFocus = cat } label: {
                        VStack(spacing: 8) {
                            Image(systemName: cat.icon)
                                .font(.system(size: 22))
                            Text(cat.label)
                                .font(.system(size: 13, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 20)
                        .background(isSelected ? Color.accentColor.opacity(0.1) : Color(.secondarySystemGroupedBackground))
                        .foregroundStyle(isSelected ? Color.accentColor : .secondary)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(isSelected ? Color.accentColor : .clear, lineWidth: 2)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Sound

    private var soundSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("ALARM SOUND")
                .font(.system(size: 12, weight: .bold))
                .tracking(2)
                .foregroundStyle(.secondary)

            VStack(spacing: 0) {
                ForEach(AlarmSound.allCases.filter { $0 != .custom }) { sound in
                    soundRow(sound)
                    Divider().padding(.leading, 14)
                }

                // Custom sound row
                Button {
                    showFilePicker = true
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Custom Sound")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.primary)
                            Text(customSoundDisplayName ?? "Upload your own audio")
                                .font(.system(size: 12))
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if selectedSound == .custom {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(Color.accentColor)
                        } else {
                            Image(systemName: "square.and.arrow.down")
                                .foregroundStyle(Color.accentColor)
                        }
                    }
                    .padding(14)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func soundRow(_ sound: AlarmSound) -> some View {
        Button {
            selectedSound = sound
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(sound.label)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.primary)
                    Text(sound.subtitle)
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if selectedSound == sound {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Color.accentColor)
                }
            }
            .padding(14)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    // MARK: - Wake Image

    private var wakeImageSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("WAKE-UP IMAGE")
                .font(.system(size: 12, weight: .bold))
                .tracking(2)
                .foregroundStyle(.secondary)

            PhotosPicker(selection: $wakeImageItem, matching: .images) {
                HStack {
                    if wakeImageData != nil || (isEditing && alarmToEdit?.wakeImagePath != nil) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text("Image selected")
                            .font(.system(size: 16, weight: .semibold))
                    } else {
                        Image(systemName: "photo.on.rectangle")
                            .foregroundStyle(Color.accentColor)
                        Text("Choose background image")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.tertiary)
                }
                .padding(16)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            .onChange(of: wakeImageItem) { _, newItem in
                Task {
                    wakeImageData = try? await newItem?.loadTransferable(type: Data.self)
                }
            }

            Text("This image appears when your alarm goes off.")
                .font(.system(size: 12))
                .foregroundStyle(.tertiary)
        }
    }

    // MARK: - Save

    private var saveButton: some View {
        VStack(spacing: 12) {
            Button {
                saveAlarm()
            } label: {
                HStack(spacing: 8) {
                    Text(isEditing ? "Update Alarm" : "Save Alarm")
                        .font(.headline(18))
                    Image(systemName: "checkmark.circle.fill")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(Color.accentColor)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: Color.accentColor.opacity(0.2), radius: 12, y: 6)
            }

            if let next = nextFireDescription {
                Text(next)
                    .font(.body(14))
                    .italic()
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.top, 8)
    }

    private var deleteButton: some View {
        Button(role: .destructive) {
            if let alarm = alarmToEdit {
                AlarmScheduler.shared.cancelAlarm(alarm)
                context.delete(alarm)
                try? context.save()
            }
            dismiss()
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "trash")
                Text("Delete Alarm")
                    .font(.headline(16))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .foregroundStyle(.red)
        }
    }

    private var nextFireDescription: String? {
        let components = Calendar.current.dateComponents([.hour, .minute], from: selectedTime)
        guard let hour = components.hour, let minute = components.minute else { return nil }

        var dc = DateComponents()
        dc.hour = hour
        dc.minute = minute
        guard let target = Calendar.current.nextDate(after: .now, matching: dc, matchingPolicy: .nextTime) else { return nil }

        let diff = target.timeIntervalSince(.now)
        let hours = Int(diff) / 3600
        let mins = (Int(diff) % 3600) / 60
        return "Wake up in \(hours) hours and \(mins) minutes"
    }

    // MARK: - Actions

    private func populateFromAlarm(_ alarm: Alarm) {
        var components = DateComponents()
        components.hour = alarm.hour
        components.minute = alarm.minute
        if let date = Calendar.current.date(from: components) {
            selectedTime = date
        }
        selectedDays = Set(alarm.days)
        selectedSound = alarm.sound
        selectedFocus = alarm.focus
        if alarm.sound == .custom, let path = alarm.customSoundPath {
            customSoundDisplayName = URL(fileURLWithPath: path).lastPathComponent
            customSoundFileName = path
        }
    }

    private func saveAlarm() {
        let components = Calendar.current.dateComponents([.hour, .minute], from: selectedTime)
        let sortedDays = Array(selectedDays).sorted { $0.rawValue < $1.rawValue }

        if let alarm = alarmToEdit {
            alarm.hour = components.hour ?? 6
            alarm.minute = components.minute ?? 30
            alarm.days = sortedDays
            alarm.sound = selectedSound
            alarm.focus = selectedFocus

            if selectedSound == .custom {
                alarm.customSoundPath = customSoundFileName
            } else {
                alarm.customSoundPath = nil
            }

            if let data = wakeImageData {
                alarm.wakeImagePath = FileManager.saveImage(data, to: FileManager.alarmImagesDirectory, name: alarm.id.uuidString)
            }

            try? context.save()
            AlarmScheduler.shared.scheduleAlarm(alarm)
            AlarmScheduler.shared.scheduleInAppTimer(for: alarm)
            AlarmScheduler.shared.scheduleConfirmation(for: alarm)
            AlarmScheduler.shared.printPendingNotifications()
        } else {
            let alarm = Alarm(
                hour: components.hour ?? 6,
                minute: components.minute ?? 30,
                days: sortedDays,
                sound: selectedSound,
                focus: selectedFocus
            )

            if selectedSound == .custom {
                alarm.customSoundPath = customSoundFileName
            }

            if let data = wakeImageData {
                alarm.wakeImagePath = FileManager.saveImage(data, to: FileManager.alarmImagesDirectory, name: alarm.id.uuidString)
            }

            context.insert(alarm)
            try? context.save()
            AlarmScheduler.shared.scheduleAlarm(alarm)
            AlarmScheduler.shared.scheduleInAppTimer(for: alarm)
            AlarmScheduler.shared.startKeepAlive()
            AlarmScheduler.shared.scheduleConfirmation(for: alarm)
            AlarmScheduler.shared.printPendingNotifications()
        }

        dismiss()
    }

    private func handleAudioImport(_ result: Result<[URL], Error>) {
        guard case .success(let urls) = result, let url = urls.first else { return }
        guard url.startAccessingSecurityScopedResource() else { return }
        defer { url.stopAccessingSecurityScopedResource() }

        // Copy to Library/Sounds so iOS can find it for notifications
        guard let libraryDir = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first else { return }
        let soundsDir = libraryDir.appendingPathComponent("Sounds", isDirectory: true)
        try? FileManager.default.createDirectory(at: soundsDir, withIntermediateDirectories: true)

        let destFileName = "custom_\(UUID().uuidString).\(url.pathExtension)"
        let destURL = soundsDir.appendingPathComponent(destFileName)

        do {
            try FileManager.default.copyItem(at: url, to: destURL)
            customSoundDisplayName = url.lastPathComponent
            customSoundFileName = destFileName
            selectedSound = .custom
        } catch {
            print("Failed to import audio: \(error)")
        }
    }
}
