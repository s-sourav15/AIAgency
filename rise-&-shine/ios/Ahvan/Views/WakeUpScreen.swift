import SwiftUI
import SwiftData

struct WakeUpScreen: View {
    let alarm: Alarm
    let onDismiss: () -> Void

    @State private var currentTime = Date()
    @State private var appeared = false
    @Query private var profiles: [Profile]

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    private var profile: Profile? { profiles.first }

    private var timeString: String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: currentTime)
    }

    private var dateString: String {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMMM d"
        return f.string(from: currentTime)
    }

    var body: some View {
        // Use Color as base — overlay keeps content within safe area
        Color.black
            .ignoresSafeArea()
            .overlay {
                AppImage(path: alarm.wakeImagePath ?? profile?.visionImagePath)
                    .ignoresSafeArea()
            }
            .overlay {
                LinearGradient(
                    stops: [
                        .init(color: .black.opacity(0.5), location: 0),
                        .init(color: .black.opacity(0.1), location: 0.35),
                        .init(color: .black.opacity(0.1), location: 0.55),
                        .init(color: .black.opacity(0.65), location: 1),
                    ],
                    startPoint: .top, endPoint: .bottom
                )
                .ignoresSafeArea()
            }
            .overlay {
                // Content — automatically constrained to safe area
                VStack(spacing: 0) {

                    // Top: temperature centered
                    Text("72° Clear")
                        .font(.system(size: 12, weight: .semibold))
                        .tracking(1)
                        .textCase(.uppercase)
                        .foregroundStyle(.white.opacity(0.6))
                        .frame(maxWidth: .infinity)
                        .padding(.top, 12)

                    Spacer()

                    // Center: date + time + quote
                    VStack(spacing: 10) {
                        Text(dateString.uppercased())
                            .font(.system(size: 12, weight: .semibold))
                            .tracking(2)
                            .foregroundStyle(.white.opacity(0.7))

                        Text(timeString)
                            .font(.system(size: 64, weight: .heavy, design: .rounded))
                            .tracking(-2)
                            .foregroundStyle(.white)
                            .shadow(color: .black.opacity(0.3), radius: 20)

                        Text(quoteForAlarm)
                            .font(.system(size: 14, weight: .medium))
                            .italic()
                            .foregroundStyle(.white.opacity(0.85))
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(.ultraThinMaterial.opacity(0.35))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .padding(.horizontal, 40)
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 20)

                    Spacer()

                    // Bottom: buttons + insights
                    VStack(spacing: 10) {
                        Button(action: onDismiss) {
                            HStack(spacing: 8) {
                                Image(systemName: "alarm")
                                    .font(.system(size: 16))
                                Text("Dismiss Alarm")
                                    .font(.system(size: 16, weight: .bold))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.accentColor)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }

                        Button {
                            let mins = profile?.snoozeDurationMinutes ?? 9
                            AlarmScheduler.shared.scheduleSnooze(minutes: mins, alarm: alarm)
                            onDismiss()
                        } label: {
                            Text("Snooze · \(profile?.snoozeDurationMinutes ?? 9)m")
                                .font(.system(size: 14, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(.white.opacity(0.15))
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(.white.opacity(0.2), lineWidth: 1)
                                )
                        }

                        HStack(spacing: 8) {
                            insightPill(icon: "sun.max", label: "Sunlight", value: "14:02")
                            insightPill(icon: "moon.zzz", label: "Sleep", value: "7h 45m")
                            insightPill(icon: "drop", label: "Hydrate", value: "Start")
                        }
                        .padding(.top, 2)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 8)
                }
            }
            .onReceive(timer) { currentTime = $0 }
            .statusBarHidden()
            .onAppear {
                withAnimation(.easeOut(duration: 0.8)) { appeared = true }
            }
    }

    private var quoteForAlarm: String {
        switch alarm.focus {
        case .career: "The future belongs to those who wake up early for it."
        case .wellness: "The sun is a daily reminder that we too can rise again."
        case .creativity: "Every morning is a blank canvas. Paint something beautiful."
        case .mindfulness: "Be present. This moment is yours."
        }
    }

    private func insightPill(icon: String, label: String, value: String) -> some View {
        VStack(spacing: 3) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(.white.opacity(0.6))
            Text(label.uppercased())
                .font(.system(size: 7, weight: .bold))
                .tracking(0.5)
                .foregroundStyle(.white.opacity(0.4))
            Text(value)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial.opacity(0.25))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(.white.opacity(0.1), lineWidth: 1)
        )
    }
}
