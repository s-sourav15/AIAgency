import SwiftUI

extension Color {
    static let rsPrimary = Color(red: 0.58, green: 0.29, blue: 0.10)       // #95491a
    static let rsPrimaryContainer = Color(red: 1.0, green: 0.62, blue: 0.40) // #ff9e67
    static let rsSecondary = Color(red: 0.34, green: 0.27, blue: 0.82)      // #5644d0
    static let rsSurface = Color(red: 0.98, green: 0.98, blue: 0.97)        // #faf9f8
    static let rsSurfaceContainer = Color(red: 0.93, green: 0.93, blue: 0.93) // #eeeeed
    static let rsOnSurface = Color(red: 0.10, green: 0.11, blue: 0.11)      // #1a1c1c
    static let rsOutline = Color(red: 0.53, green: 0.45, blue: 0.41)        // #877369
}

extension Font {
    static func headline(_ size: CGFloat, weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .default)
    }

    static func body(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }
}

/// Helper to load an image from either a local file path or a bundled asset name
struct AppImage: View {
    let path: String?
    var contentMode: ContentMode = .fill

    var body: some View {
        if let path {
            if path.hasPrefix("asset:") {
                let assetName = String(path.dropFirst(6))
                Image(assetName)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            } else {
                let url = URL(fileURLWithPath: path)
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().aspectRatio(contentMode: contentMode)
                    default:
                        placeholderGradient
                    }
                }
            }
        } else {
            placeholderGradient
        }
    }

    private var placeholderGradient: some View {
        LinearGradient(
            colors: [.rsPrimary.opacity(0.3), .rsSecondary.opacity(0.2)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}
