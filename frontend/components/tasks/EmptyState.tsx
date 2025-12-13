"use client";

// Luxury color palette
const colors = {
  text: "#1a1a1a",
  textMuted: "#666666",
  goldDark: "#a08339",
};

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="text-5xl mb-6" style={{ color: colors.goldDark }}>◇</div>
      <h3
        className="text-2xl font-light mb-2"
        style={{ color: colors.text, fontFamily: "serif" }}
      >
        No tasks yet
      </h3>
      <p
        className="text-center max-w-md text-sm"
        style={{ color: colors.textMuted, fontStyle: "italic" }}
      >
        Begin your journey by creating your first task. Click the "New Task" button to get started.
      </p>
    </div>
  );
}