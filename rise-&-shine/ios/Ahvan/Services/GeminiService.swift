import Foundation

/// Calls Gemini API once per day for personalized affirmation + insight.
/// Falls back to bundled content on failure.
final class GeminiService: @unchecked Sendable {
    static let shared = GeminiService()

    // Use the lightest model to minimize cost
    private let model = "gemini-3-flash-preview"
    private let baseURL = "https://generativelanguage.googleapis.com/v1beta/models"

    // TODO: Replace with your Gemini API key
    private var apiKey: String {
        Bundle.main.object(forInfoDictionaryKey: "GEMINI_API_KEY") as? String ?? ""
    }

    private init() {}

    struct DailyContent {
        let affirmation: String
        let insight: String
    }

    /// Fetch personalized content. Returns nil on failure (caller should use fallback).
    func fetchDailyContent(
        userName: String,
        focus: FocusCategory,
        streak: Int,
        visionQuote: String
    ) async -> DailyContent? {
        guard !apiKey.isEmpty else {
            print("Gemini API key not configured")
            return nil
        }

        let prompt = """
        You are a warm, motivational morning coach for an app called Ahvan.

        The user's name is \(userName). They are on a \(streak)-day morning routine streak. \
        Their focus category is "\(focus.rawValue)" and their personal vision is: "\(visionQuote)".

        Generate exactly two pieces of content:
        1. A personalized morning affirmation (1-2 sentences, warm and specific to their focus and streak).
        2. A morning insight or tip (1 sentence, practical and related to their focus category).

        Respond in this exact JSON format, nothing else:
        {"affirmation": "...", "insight": "..."}
        """

        let url = URL(string: "\(baseURL)/\(model):generateContent?key=\(apiKey)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10

        let body: [String: Any] = [
            "contents": [
                ["parts": [["text": prompt]]]
            ],
            "generationConfig": [
                "temperature": 0.9,
                "maxOutputTokens": 200,
            ]
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                print("Gemini API error: \((response as? HTTPURLResponse)?.statusCode ?? -1)")
                return nil
            }

            return parseResponse(data)
        } catch {
            print("Gemini fetch error: \(error)")
            return nil
        }
    }

    private func parseResponse(_ data: Data) -> DailyContent? {
        // Gemini response structure:
        // { "candidates": [{ "content": { "parts": [{ "text": "..." }] } }] }
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let candidates = json["candidates"] as? [[String: Any]],
              let content = candidates.first?["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let text = parts.first?["text"] as? String else {
            return nil
        }

        // Extract JSON from the response text (may have markdown code fences)
        let cleaned = text
            .replacingOccurrences(of: "```json", with: "")
            .replacingOccurrences(of: "```", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard let jsonData = cleaned.data(using: .utf8),
              let parsed = try? JSONSerialization.jsonObject(with: jsonData) as? [String: String],
              let affirmation = parsed["affirmation"],
              let insight = parsed["insight"] else {
            return nil
        }

        return DailyContent(affirmation: affirmation, insight: insight)
    }
}
