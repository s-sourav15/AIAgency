import SwiftUI
import SwiftData

struct MotivateScreen: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query private var profiles: [Profile]

    @State private var selected: FocusCategory

    init(currentFocus: FocusCategory = .wellness) {
        _selected = State(initialValue: currentFocus)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    header

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        ForEach(FocusCategory.allCases) { cat in
                            focusCard(cat)
                        }
                    }

                    quoteBlock

                    Button {
                        profiles.first?.defaultFocus = selected
                        try? context.save()
                        dismiss()
                    } label: {
                        Text("Save Selection")
                            .font(.headline(18))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(Color.accentColor)
                            .foregroundStyle(.white)
                            .clipShape(Capsule())
                            .shadow(color: Color.accentColor.opacity(0.2), radius: 12, y: 6)
                    }
                    .padding(.top, 8)
                }
                .padding(24)
            }
            .background(Color(.systemGroupedBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark").foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("What fuels your")
                .font(.headline(34, weight: .heavy))
            + Text(" spirit today?")
                .font(.headline(34, weight: .heavy))
                .foregroundColor(Color.accentColor)

            Text("Choose a focus for your daily wisdom and morning reflections.")
                .font(.body(18))
                .italic()
                .foregroundStyle(.secondary)
                .lineSpacing(4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func focusCard(_ category: FocusCategory) -> some View {
        let isSelected = selected == category
        return Button { selected = category } label: {
            VStack(alignment: .leading, spacing: 12) {
                ZStack {
                    Circle()
                        .fill(isSelected ? Color.accentColor : Color.accentColor.opacity(0.1))
                        .frame(width: 44, height: 44)
                    Image(systemName: category.icon)
                        .font(.system(size: 20))
                        .foregroundStyle(isSelected ? .white : Color.accentColor)
                }

                Text(category.label)
                    .font(.headline(18))
                    .foregroundStyle(.primary)

                Text(category.description)
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
                    .multilineTextAlignment(.leading)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .background(isSelected ? Color.accentColor.opacity(0.08) : Color(.systemBackground))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? Color.accentColor.opacity(0.3) : Color(.separator).opacity(0.2), lineWidth: isSelected ? 2 : 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(alignment: .topTrailing) {
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Color.accentColor)
                        .padding(12)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var quoteBlock: some View {
        VStack(spacing: 8) {
            Image(systemName: "quote.closing")
                .font(.system(size: 28))
                .foregroundStyle(.tertiary)

            Text("The sun is a daily reminder that we too can rise again from the darkness, that we too can shine our own light.")
                .font(.body(16))
                .italic()
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
        }
        .padding(.vertical, 12)
    }
}
