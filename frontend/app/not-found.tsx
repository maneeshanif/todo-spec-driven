import Link from 'next/link';

// Luxury color palette
const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
  textLight: "#ffffff",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.bg }}>
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-light" style={{ color: colors.border, fontFamily: "serif" }}>404</h1>
        <h2 className="text-3xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Page Not Found</h2>
        <p className="max-w-md mx-auto text-sm" style={{ color: colors.textMuted, fontStyle: "italic" }}>
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/">
            <button
              className="px-8 py-3 text-xs tracking-[0.2em] uppercase border transition-all duration-300 hover:opacity-80"
              style={{ backgroundColor: "transparent", borderColor: colors.border, color: colors.text }}
            >
              Go Home
            </button>
          </Link>
          <Link href="/dashboard">
            <button
              className="px-8 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-90"
              style={{ backgroundColor: colors.goldDark, color: colors.textLight }}
            >
              Go to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
