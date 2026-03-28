import SwiftUI
import SwiftData

struct AlarmsScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Alarm.hour) private var alarms: [Alarm]
    @Query private var profiles: [Profile]

    var onWake: ((Alarm) -> Void)? = nil

    @State private var showNewAlarm = false
    @State private var editingAlarm: Alarm?

    private var userName: String { profiles.first?.userName ?? "Friend" }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                VStack(spacing: 24) {
                    header
                    alarmsList
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 120)
            }
            .background(Color(.systemGroupedBackground))

            addButton
        }
        .sheet(isPresented: $showNewAlarm) {
            NewAlarmScreen()
        }
        .sheet(item: $editingAlarm) { alarm in
            NewAlarmScreen(alarmToEdit: alarm)
        }
    }

    // MARK: - Header

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: .now)
        switch hour {
        case 5..<12: return "Good Morning,"
        case 12..<17: return "Good Afternoon,"
        case 17..<21: return "Good Evening,"
        default: return "Good Night,"
        }
    }

    private var subGreeting: String {
        let hour = Calendar.current.component(.hour, from: .now)
        switch hour {
        case 5..<12: return "The sun is waiting for your light."
        case 12..<17: return "Keep the momentum going."
        case 17..<21: return "Reflect on how far you've come today."
        default: return "Rest well, tomorrow awaits."
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(greeting)
                .font(.headline(34, weight: .heavy))
                .tracking(-0.5)
            + Text(" \(userName)")
                .font(.headline(34, weight: .heavy))
                .foregroundColor(Color.accentColor)

            Text(subGreeting)
                .font(.body(18))
                .italic()
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
    }

    // MARK: - Alarms List

    private var alarmsList: some View {
        VStack(spacing: 16) {
            if alarms.isEmpty {
                emptyState
            } else {
                ForEach(alarms) { alarm in
                    alarmCard(alarm)
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "alarm")
                .font(.system(size: 48))
                .foregroundStyle(.tertiary)
            Text("No alarms yet")
                .font(.headline(18))
                .foregroundStyle(.secondary)
            Text("Tap + to set your first alarm")
                .font(.system(size: 14))
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    private func alarmCard(_ alarm: Alarm) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                // Time
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(alarm.timeString)
                        .font(.headline(48, weight: .heavy))
                        .tracking(-2)
                        .foregroundStyle(alarm.enabled ? .primary : .secondary)
                    Text(alarm.period)
                        .font(.headline(18, weight: .bold))
                        .foregroundStyle(alarm.enabled ? .secondary : .tertiary)
                }

                // Days
                HStack(spacing: 4) {
                    if alarm.isOneTime {
                        Text("ONE TIME")
                            .font(.system(size: 11, weight: .bold))
                            .tracking(1)
                            .foregroundStyle(alarm.enabled ? Color.accentColor : .secondary)
                    } else {
                        ForEach(alarm.days) { day in
                            Text(day.fullLabel)
                                .font(.system(size: 10, weight: .bold))
                                .fixedSize()
                                .padding(.horizontal, 6)
                                .padding(.vertical, 3)
                                .background(alarm.enabled ? Color.accentColor.opacity(0.1) : Color.secondary.opacity(0.05))
                                .foregroundStyle(alarm.enabled ? Color.accentColor : .secondary)
                                .clipShape(Capsule())
                        }
                    }
                }

                // Sound
                HStack(spacing: 4) {
                    Image(systemName: "bell.fill")
                        .font(.system(size: 12))
                    Text(alarm.sound.label)
                        .font(.system(size: 12, weight: .semibold))
                }
                .foregroundStyle(.tertiary)
            }

            Spacer()

            Toggle("", isOn: Binding(
                get: { alarm.enabled },
                set: { newValue in
                    alarm.enabled = newValue
                    if newValue {
                        AlarmScheduler.shared.scheduleAlarm(alarm)
                    } else {
                        AlarmScheduler.shared.cancelAlarm(alarm)
                    }
                    try? context.save()
                }
            ))
            .labelsHidden()
            .tint(Color.accentColor)
        }
        .padding(20)
        .background(alarm.enabled ? Color(.systemBackground) : Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .opacity(alarm.enabled ? 1 : 0.7)
        .contentShape(Rectangle())
        .onTapGesture {
            editingAlarm = alarm
        }
        .contextMenu {
            Button {
                editingAlarm = alarm
            } label: {
                Label("Edit Alarm", systemImage: "pencil")
            }

            if let onWake {
                Button {
                    onWake(alarm)
                } label: {
                    Label("Preview Wake Screen", systemImage: "sun.max.fill")
                }
            }

            Button(role: .destructive) {
                AlarmScheduler.shared.cancelAlarm(alarm)
                context.delete(alarm)
                try? context.save()
            } label: {
                Label("Delete Alarm", systemImage: "trash")
            }
        }
    }

    // MARK: - Add Button

    private var addButton: some View {
        Button {
            showNewAlarm = true
        } label: {
            Image(systemName: "plus")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 60, height: 60)
                .background(Color.accentColor)
                .clipShape(Circle())
                .shadow(color: Color.accentColor.opacity(0.3), radius: 12, y: 6)
        }
        .padding(.trailing, 24)
        .padding(.bottom, 100)
    }
}
