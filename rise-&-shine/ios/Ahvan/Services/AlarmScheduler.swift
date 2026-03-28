import Foundation
import UserNotifications
import AVFoundation
import SwiftData

@MainActor
final class AlarmScheduler: NSObject, ObservableObject, @unchecked Sendable {
    static let shared = AlarmScheduler()
    @Published var isAuthorized = false
    /// Set when an alarm notification fires — ContentView observes this to show WakeUpScreen
    @Published var firedAlarmID: UUID?

    private let center = UNUserNotificationCenter.current()
    private var audioPlayer: AVAudioPlayer?
    private var silentPlayer: AVAudioPlayer?
    private var alarmTimer: Timer?

    override init() {
        super.init()
    }

    /// Call once on app launch to set up foreground notification handling
    func setup() {
        center.delegate = self
    }

    // MARK: - Keep-Alive Audio Session

    /// Start a silent audio loop to keep the app alive when the screen locks.
    /// This is how Alarmy, Sleep Cycle, etc. ensure alarms fire from background.
    func startKeepAlive() {
        guard silentPlayer == nil else { return }

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: .mixWithOthers)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("[Ahvan] Keep-alive audio session error: \(error)")
            return
        }

        // Use the silent.caf file from the bundle — 1 second of silence, looped
        guard let silentURL = Bundle.main.url(forResource: "silent", withExtension: "caf") else {
            print("[Ahvan] silent.caf not found in bundle")
            return
        }

        do {
            silentPlayer = try AVAudioPlayer(contentsOf: silentURL)
            silentPlayer?.numberOfLoops = -1
            silentPlayer?.volume = 0.01  // Nearly silent
            silentPlayer?.play()
            print("[Ahvan] Keep-alive started — app will stay active when screen locks")
        } catch {
            print("[Ahvan] Keep-alive player error: \(error)")
        }
    }

    /// Stop the silent keep-alive audio
    func stopKeepAlive() {
        silentPlayer?.stop()
        silentPlayer = nil
        alarmTimer?.invalidate()
        alarmTimer = nil
        print("[Ahvan] Keep-alive stopped")
    }

    /// Schedule an in-app timer that fires at the alarm time (works while app is alive).
    /// This is the PRIMARY alarm mechanism when the app is in foreground/keep-alive.
    /// The UNNotification is the FALLBACK for when the app is killed.
    func scheduleInAppTimer(for alarm: Alarm) {
        guard alarm.enabled, let fireDate = alarm.nextFireDate else { return }

        let interval = fireDate.timeIntervalSince(.now)
        guard interval > 0 else { return }

        // Cancel any existing timer
        alarmTimer?.invalidate()

        let alarmID = alarm.id
        alarmTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: false) { [weak self] _ in
            DispatchQueue.main.async {
                print("[Ahvan] In-app timer fired for alarm \(alarmID)")
                self?.firedAlarmID = alarmID
            }
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        print("[Ahvan] In-app timer set for \(formatter.string(from: fireDate)) (\(Int(interval))s from now)")
    }

    /// Start keep-alive and set timers for the next enabled alarm
    func armNextAlarm(alarms: [Alarm]) {
        // Find the nearest enabled alarm
        let enabledAlarms = alarms.filter { $0.enabled }
        guard let nearest = enabledAlarms.compactMap({ alarm -> (Alarm, Date)? in
            guard let date = alarm.nextFireDate else { return nil }
            return (alarm, date)
        }).min(by: { $0.1 < $1.1 }) else {
            stopKeepAlive()
            return
        }

        startKeepAlive()
        scheduleInAppTimer(for: nearest.0)
    }

    // MARK: - Alarm Audio Playback

    /// Play alarm sound using AVAudioPlayer (overrides silent mode via .playback category)
    func playAlarmSound(for alarm: Alarm) {
        // Stop the silent keep-alive first
        silentPlayer?.stop()
        silentPlayer = nil

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("[Ahvan] Audio session error: \(error)")
        }

        var soundURL: URL?
        if alarm.sound == .custom, let fileName = alarm.customSoundPath {
            if let libraryDir = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first {
                soundURL = libraryDir.appendingPathComponent("Sounds/\(fileName)")
            }
        } else if alarm.sound != .silent, let assetName = alarm.sound.assetName {
            soundURL = Bundle.main.url(forResource: assetName, withExtension: "caf")
        }

        guard let url = soundURL else {
            print("[Ahvan] No sound URL found for alarm")
            return
        }

        do {
            audioPlayer = try AVAudioPlayer(contentsOf: url)
            audioPlayer?.numberOfLoops = -1  // Loop until dismissed
            audioPlayer?.volume = 1.0
            audioPlayer?.play()
            print("[Ahvan] Playing alarm sound: \(url.lastPathComponent)")
        } catch {
            print("[Ahvan] Audio player error: \(error)")
        }
    }

    /// Stop alarm sound playback
    func stopAlarmSound() {
        audioPlayer?.stop()
        audioPlayer = nil
        print("[Ahvan] Alarm sound stopped")
    }

    // MARK: - Permission

    @discardableResult
    func requestPermission() async -> Bool {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            isAuthorized = granted
            print("[Ahvan] Notification permission: \(granted ? "GRANTED" : "DENIED")")
            return granted
        } catch {
            print("[Ahvan] Notification permission error: \(error)")
            return false
        }
    }

    func checkPermission() async {
        let settings = await center.notificationSettings()
        isAuthorized = settings.authorizationStatus == .authorized
    }

    // MARK: - Schedule (Notification fallback)

    func scheduleAlarm(_ alarm: Alarm) {
        guard alarm.enabled else {
            cancelAlarm(alarm)
            return
        }

        let alarmID = alarm.id.uuidString
        center.removePendingNotificationRequests(withIdentifiers: pendingIDs(for: alarmID, days: alarm.days, isOneTime: alarm.isOneTime))

        if alarm.isOneTime {
            scheduleOneTime(alarm)
        } else {
            for day in alarm.days {
                scheduleRepeating(alarm, weekday: day)
            }
        }
    }

    func scheduleAllAlarms(_ alarms: [Alarm]) {
        center.removeAllPendingNotificationRequests()
        for alarm in alarms where alarm.enabled {
            scheduleAlarm(alarm)
        }
    }

    func cancelAlarm(_ alarm: Alarm) {
        let ids = pendingIDs(for: alarm.id.uuidString, days: alarm.days, isOneTime: alarm.isOneTime)
        center.removePendingNotificationRequests(withIdentifiers: ids)
    }

    // MARK: - Snooze

    func scheduleSnooze(minutes: Int, alarm: Alarm) {
        let content = makeContent(for: alarm, isSnooze: true)
        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(minutes * 60),
            repeats: false
        )
        let request = UNNotificationRequest(
            identifier: "\(alarm.id.uuidString)-snooze",
            content: content,
            trigger: trigger
        )
        center.add(request) { error in
            if let error { print("[Ahvan] Snooze schedule error: \(error)") }
        }
    }

    /// Fires a confirmation notification in 5 seconds to verify notifications work
    func scheduleConfirmation(for alarm: Alarm) {
        let content = UNMutableNotificationContent()
        content.title = "Alarm Set"
        content.body = "Your \(alarm.displayHour):\(String(format: "%02d", alarm.minute)) \(alarm.period) alarm is scheduled."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
        let request = UNNotificationRequest(identifier: "confirm-\(alarm.id.uuidString)", content: content, trigger: trigger)
        center.add(request) { error in
            if let error {
                print("[Ahvan] Confirmation failed: \(error)")
            } else {
                print("[Ahvan] Confirmation notification in 5 seconds")
            }
        }
    }

    // MARK: - Debug

    func printPendingNotifications() {
        center.getPendingNotificationRequests { requests in
            print("[Ahvan] Pending notifications: \(requests.count)")
            for req in requests {
                if let trigger = req.trigger as? UNCalendarNotificationTrigger {
                    print("  - \(req.identifier): \(trigger.dateComponents)")
                } else if let trigger = req.trigger as? UNTimeIntervalNotificationTrigger {
                    print("  - \(req.identifier): in \(trigger.timeInterval)s")
                }
            }
        }
    }

    // MARK: - Private

    private func pendingIDs(for alarmID: String, days: [DayOfWeek], isOneTime: Bool) -> [String] {
        if isOneTime {
            return [alarmID]
        }
        return days.map { "\(alarmID)-\($0.rawValue)" } + ["\(alarmID)-snooze"]
    }

    private func scheduleOneTime(_ alarm: Alarm) {
        let content = makeContent(for: alarm)
        var components = DateComponents()
        components.hour = alarm.hour
        components.minute = alarm.minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(
            identifier: alarm.id.uuidString,
            content: content,
            trigger: trigger
        )
        center.add(request) { error in
            if let error {
                print("[Ahvan] Failed to schedule one-time alarm: \(error)")
            } else {
                print("[Ahvan] Scheduled one-time alarm at \(alarm.hour):\(String(format: "%02d", alarm.minute))")
            }
        }
    }

    private func scheduleRepeating(_ alarm: Alarm, weekday: DayOfWeek) {
        let content = makeContent(for: alarm)
        var components = DateComponents()
        components.hour = alarm.hour
        components.minute = alarm.minute
        components.weekday = weekday.calendarWeekday

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(
            identifier: "\(alarm.id.uuidString)-\(weekday.rawValue)",
            content: content,
            trigger: trigger
        )
        center.add(request) { error in
            if let error {
                print("[Ahvan] Failed to schedule repeating alarm: \(error)")
            } else {
                print("[Ahvan] Scheduled alarm for weekday \(weekday.fullLabel) at \(alarm.hour):\(String(format: "%02d", alarm.minute))")
            }
        }
    }

    private func makeContent(for alarm: Alarm, isSnooze: Bool = false) -> UNMutableNotificationContent {
        let content = UNMutableNotificationContent()
        content.title = isSnooze ? "Snooze Over" : "Ahvan"
        content.body = motivationalSnippet(for: alarm.focus)
        content.categoryIdentifier = "ALARM"
        content.interruptionLevel = .timeSensitive

        // Set sound — verify file exists in bundle
        if alarm.sound == .custom, let fileName = alarm.customSoundPath {
            content.sound = UNNotificationSound(named: UNNotificationSoundName(fileName))
            print("[Ahvan] Notification sound: custom \(fileName)")
        } else if alarm.sound != .silent, let assetName = alarm.sound.assetName {
            let soundFile = "\(assetName).caf"
            if Bundle.main.url(forResource: assetName, withExtension: "caf") != nil {
                content.sound = UNNotificationSound(named: UNNotificationSoundName(soundFile))
                print("[Ahvan] Notification sound: \(soundFile) (found in bundle)")
            } else {
                print("[Ahvan] WARNING: \(soundFile) NOT found in bundle — using default")
                content.sound = .defaultCriticalSound(withAudioVolume: 1.0)
            }
        } else {
            content.sound = .default
        }

        return content
    }

    private func motivationalSnippet(for focus: FocusCategory) -> String {
        switch focus {
        case .career: "Time to build the future you've been dreaming about."
        case .wellness: "Your body is ready for a beautiful day."
        case .creativity: "The world is waiting for your creative spark."
        case .mindfulness: "Be present. This moment is yours."
        }
    }
}

// MARK: - Alarm ID Extraction

extension AlarmScheduler {
    nonisolated func extractAlarmID(from identifier: String) -> UUID? {
        if identifier.hasPrefix("confirm-") { return nil }

        var cleaned = identifier
        if cleaned.hasSuffix("-snooze") {
            cleaned = String(cleaned.dropLast("-snooze".count))
        }

        if let uuid = UUID(uuidString: cleaned) { return uuid }

        if let lastDash = cleaned.lastIndex(of: "-") {
            let prefix = String(cleaned[cleaned.startIndex..<lastDash])
            if let uuid = UUID(uuidString: prefix) { return uuid }
        }

        return nil
    }
}

// MARK: - Foreground Notification Support

extension AlarmScheduler: UNUserNotificationCenterDelegate {
    /// App is in foreground — show wake screen and play sound immediately
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let identifier = notification.request.identifier
        let category = notification.request.content.categoryIdentifier

        if category == "ALARM", let alarmID = extractAlarmID(from: identifier) {
            DispatchQueue.main.async {
                print("[Ahvan] Alarm fired (foreground notification): \(alarmID)")
                self.firedAlarmID = alarmID
            }
            completionHandler([.sound])
        } else {
            completionHandler([.banner, .sound, .badge])
        }
    }

    /// User tapped notification (app was in background) — show wake screen
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let identifier = response.notification.request.identifier
        let category = response.notification.request.content.categoryIdentifier

        if category == "ALARM", let alarmID = extractAlarmID(from: identifier) {
            DispatchQueue.main.async {
                print("[Ahvan] Alarm tapped (background): \(alarmID)")
                self.firedAlarmID = alarmID
            }
        }
        completionHandler()
    }
}
