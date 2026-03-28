import SwiftUI
import SwiftData
import PhotosUI

struct OnboardingView: View {
    @Environment(\.modelContext) private var context
    @Query private var profiles: [Profile]

    let onComplete: () -> Void

    @State private var currentStep = 0
    @State private var userName = ""
    @State private var selectedFocus: FocusCategory = .wellness
    @State private var visionQuote = ""
    @State private var selectedPreset: String?
    @State private var visionImageItem: PhotosPickerItem?
    @State private var visionImageData: Data?

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()

            VStack(spacing: 0) {
                // Progress dots
                HStack(spacing: 8) {
                    ForEach(0..<4, id: \.self) { i in
                        Circle()
                            .fill(i <= currentStep ? Color.accentColor : Color.secondary.opacity(0.2))
                            .frame(width: 8, height: 8)
                    }
                }
                .padding(.top, 20)

                TabView(selection: $currentStep) {
                    welcomeStep.tag(0)
                    nameStep.tag(1)
                    focusStep.tag(2)
                    visionStep.tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut(duration: 0.3), value: currentStep)
            }
        }
        .tint(.orange)
    }

    // MARK: - Step 0: Welcome

    private var welcomeStep: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "sunrise.fill")
                .font(.system(size: 80))
                .foregroundStyle(.orange.gradient)

            Text("Ahvan")
                .font(.system(size: 40, weight: .heavy, design: .default))
                .italic()
                .foregroundStyle(.orange)

            Text("Not just an alarm.\nA daily motivating engine.")
                .font(.system(size: 20, weight: .medium, design: .serif))
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)

            Spacer()

            nextButton("Let's Begin")
        }
        .padding(32)
    }

    // MARK: - Step 1: Name

    private var nameStep: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("What's your name?")
                .font(.system(size: 36, weight: .heavy))
                .multilineTextAlignment(.center)

            Text("We'll use this to personalize your mornings.")
                .font(.system(size: 18, weight: .medium, design: .serif))
                .foregroundStyle(.secondary)
                .italic()

            TextField("Your name", text: $userName)
                .font(.system(size: 24, weight: .semibold))
                .multilineTextAlignment(.center)
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)

            Spacer()

            nextButton("Continue")
                .disabled(userName.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(32)
    }

    // MARK: - Step 2: Focus

    private var focusStep: some View {
        VStack(spacing: 24) {
            VStack(spacing: 8) {
                Text("What drives you?")
                    .font(.system(size: 36, weight: .heavy))
                Text("Pick a focus for your morning motivation.")
                    .font(.system(size: 18, weight: .medium, design: .serif))
                    .foregroundStyle(.secondary)
                    .italic()
            }
            .padding(.top, 40)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                ForEach(FocusCategory.allCases) { category in
                    Button {
                        selectedFocus = category
                    } label: {
                        VStack(spacing: 12) {
                            Image(systemName: category.icon)
                                .font(.system(size: 28))
                            Text(category.label)
                                .font(.system(size: 16, weight: .bold))
                            Text(category.description)
                                .font(.system(size: 12))
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                                .lineLimit(2)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(20)
                        .background(
                            selectedFocus == category
                                ? Color.accentColor.opacity(0.1)
                                : Color(.secondarySystemBackground)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(selectedFocus == category ? Color.accentColor : .clear, lineWidth: 2)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)

            Spacer()

            nextButton("Continue")
        }
        .padding(32)
    }

    // MARK: - Step 3: Vision

    private var visionStep: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Set your vision")
                        .font(.system(size: 36, weight: .heavy))
                    Text("This will greet you every morning.")
                        .font(.system(size: 18, weight: .medium, design: .serif))
                        .foregroundStyle(.secondary)
                        .italic()
                }
                .padding(.top, 40)

                // Presets
                Text("PICK A PRESET")
                    .font(.system(size: 12, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(ContentLoader.visionPresets) { preset in
                        Button {
                            selectedPreset = preset.id
                            visionQuote = preset.quote
                            visionImageData = nil
                        } label: {
                            VStack(spacing: 8) {
                                Image(systemName: presetIcon(preset.id))
                                    .font(.system(size: 24))
                                Text(preset.name)
                                    .font(.system(size: 14, weight: .bold))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                            .background(
                                selectedPreset == preset.id
                                    ? Color.accentColor.opacity(0.1)
                                    : Color(.secondarySystemBackground)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(selectedPreset == preset.id ? Color.accentColor : .clear, lineWidth: 2)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                }

                // Or upload custom
                Text("OR UPLOAD YOUR OWN")
                    .font(.system(size: 12, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 8)

                PhotosPicker(selection: $visionImageItem, matching: .images) {
                    HStack {
                        Image(systemName: "photo.on.rectangle")
                        Text("Choose from Photos")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .onChange(of: visionImageItem) { _, newItem in
                    Task {
                        if let data = try? await newItem?.loadTransferable(type: Data.self) {
                            visionImageData = data
                            selectedPreset = nil
                        }
                    }
                }

                // Quote input
                TextField("Your motivational quote", text: $visionQuote, axis: .vertical)
                    .font(.system(size: 18, weight: .medium, design: .serif))
                    .italic()
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .lineLimit(2...4)

                // Finish button
                Button {
                    finishOnboarding()
                } label: {
                    Text("Start My Journey")
                        .font(.system(size: 18, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .padding(.top, 8)
            }
            .padding(32)
        }
    }

    // MARK: - Helpers

    private func nextButton(_ title: String) -> some View {
        Button {
            withAnimation {
                currentStep += 1
            }
        } label: {
            Text(title)
                .font(.system(size: 18, weight: .bold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(Color.accentColor)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    private func presetIcon(_ id: String) -> String {
        switch id {
        case "upsc": "building.columns.fill"
        case "home": "house.fill"
        case "travel": "airplane"
        case "fitness": "figure.run"
        default: "star.fill"
        }
    }

    private func finishOnboarding() {
        let profile: Profile
        if let existing = profiles.first {
            profile = existing
        } else {
            profile = Profile()
            context.insert(profile)
        }

        profile.userName = userName.trimmingCharacters(in: .whitespaces)
        profile.defaultFocus = selectedFocus
        profile.visionQuote = visionQuote

        // Save vision image
        if let imageData = visionImageData {
            profile.visionImagePath = FileManager.saveImage(imageData, to: FileManager.visionDirectory, name: "vision")
        } else if let preset = ContentLoader.visionPresets.first(where: { $0.id == selectedPreset }) {
            // For bundled preset images, store the asset name as the path with a prefix
            profile.visionImagePath = "asset:\(preset.imageName)"
        }

        profile.hasCompletedOnboarding = true
        try? context.save()

        onComplete()
    }
}
