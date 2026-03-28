import Foundation

struct ContentEntry: Codable, Identifiable {
    let id: String
    let contentType: String
    let category: String?
    let body: String
    let attribution: String?
}

struct VisionPreset: Identifiable {
    let id: String
    let name: String
    let imageName: String  // Asset catalog name
    let quote: String
}

final class ContentLoader: @unchecked Sendable {
    static let shared = ContentLoader()

    private var entries: [ContentEntry] = []

    private init() {
        loadBundledContent()
    }

    // MARK: - Vision Presets (bundled images)

    static let visionPresets: [VisionPreset] = [
        VisionPreset(id: "upsc", name: "UPSC", imageName: "preset_upsc", quote: "LBSNAA: The ultimate destination."),
        VisionPreset(id: "home", name: "Dream Home", imageName: "preset_home", quote: "Building my dream home, one day at a time."),
        VisionPreset(id: "travel", name: "Travel", imageName: "preset_travel", quote: "The world is my classroom."),
        VisionPreset(id: "fitness", name: "Fitness", imageName: "preset_fitness", quote: "Stronger every single day."),
    ]

    // MARK: - Daily Content

    func randomAffirmation(for focus: FocusCategory? = nil) -> ContentEntry? {
        let pool = entries.filter { entry in
            entry.contentType == "affirmation" &&
            (entry.category == nil || entry.category == focus?.rawValue)
        }
        return pool.randomElement()
    }

    func randomInsight(for focus: FocusCategory? = nil) -> ContentEntry? {
        let pool = entries.filter { entry in
            entry.contentType == "insight" &&
            (entry.category == nil || entry.category == focus?.rawValue)
        }
        return pool.randomElement()
    }

    func randomQuote() -> ContentEntry? {
        entries.filter { $0.contentType == "quote" }.randomElement()
    }

    // MARK: - Private

    private func loadBundledContent() {
        guard let url = Bundle.main.url(forResource: "default_content", withExtension: "json"),
              let data = try? Data(contentsOf: url) else {
            print("Failed to load default_content.json")
            entries = Self.fallbackEntries
            return
        }

        do {
            entries = try JSONDecoder().decode([ContentEntry].self, from: data)
        } catch {
            print("Failed to decode content: \(error)")
            entries = Self.fallbackEntries
        }
    }

    /// Hardcoded fallback in case the JSON file is missing
    private static let fallbackEntries: [ContentEntry] = [
        ContentEntry(id: "f1", contentType: "affirmation", category: nil, body: "Today is a gift, and I am exactly where I need to be to grow.", attribution: "Mindful Reminder"),
        ContentEntry(id: "f2", contentType: "insight", category: nil, body: "Exposure to natural light within 30 minutes of waking resets your circadian rhythm.", attribution: "Wellness Guide"),
        ContentEntry(id: "f3", contentType: "quote", category: nil, body: "The sun is a daily reminder that we too can rise again from the darkness.", attribution: nil),
    ]
}
