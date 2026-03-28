import Foundation

extension FileManager {
    /// App's Documents directory
    static var documentsDirectory: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    }

    /// Directory for custom ringtones
    static var ringtonesDirectory: URL {
        let url = documentsDirectory.appendingPathComponent("ringtones", isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    /// Directory for alarm wake images
    static var alarmImagesDirectory: URL {
        let url = documentsDirectory.appendingPathComponent("images/alarms", isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    /// Directory for vision board image
    static var visionDirectory: URL {
        let url = documentsDirectory.appendingPathComponent("images/vision", isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    /// Directory for avatar
    static var avatarDirectory: URL {
        let url = documentsDirectory.appendingPathComponent("images/avatar", isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    /// Save image data and return the file path
    @discardableResult
    static func saveImage(_ data: Data, to directory: URL, name: String = UUID().uuidString) -> String? {
        let url = directory.appendingPathComponent("\(name).jpg")
        do {
            try data.write(to: url)
            return url.path
        } catch {
            print("Failed to save image: \(error)")
            return nil
        }
    }

    /// Save audio file and return the file path
    @discardableResult
    static func saveAudio(_ data: Data, to directory: URL, name: String, ext: String = "caf") -> String? {
        let url = directory.appendingPathComponent("\(name).\(ext)")
        do {
            try data.write(to: url)
            return url.path
        } catch {
            print("Failed to save audio: \(error)")
            return nil
        }
    }

    /// Delete file at path
    static func deleteFile(at path: String) {
        try? FileManager.default.removeItem(atPath: path)
    }
}
