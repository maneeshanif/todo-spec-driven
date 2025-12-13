"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Palette, Shield, Save } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import Sidebar from "@/components/dashboard/Sidebar";

// Luxury color palette
const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  gold: "#c9a962",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
  textLight: "#ffffff",
};

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("cream");

  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.bg }}>
      <Sidebar />

      <main className="flex-1 ml-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-sm border-b" style={{ backgroundColor: `${colors.bgAlt}cc`, borderColor: colors.border }}>
          <div className="px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-3" style={{ backgroundColor: `${colors.goldDark}15` }}>
                <Shield className="w-6 h-6" style={{ color: colors.goldDark }} />
              </div>
              <div>
                <h1 className="text-3xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Settings</h1>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Manage your account and preferences
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-4xl">
          <div className="space-y-6">
            {/* Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border p-6"
              style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
            >
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5" style={{ color: colors.goldDark }} />
                <h2 className="text-xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Profile</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs tracking-wider uppercase mb-2" style={{ color: colors.textMuted }}>
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border focus:outline-none"
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  />
                </div>

                <div>
                  <label className="block text-xs tracking-wider uppercase mb-2" style={{ color: colors.textMuted }}>
                    Email
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="w-full px-4 py-3 border focus:outline-none"
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Notifications Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border p-6"
              style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5" style={{ color: colors.goldDark }} />
                <h2 className="text-xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Notifications</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span style={{ color: colors.text }}>Email notifications</span>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="w-5 h-5 accent-[#a08339]"
                  />
                </label>
              </div>
            </motion.div>

            {/* Appearance Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border p-6"
              style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-5 h-5" style={{ color: colors.goldDark }} />
                <h2 className="text-xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Appearance</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs tracking-wider uppercase mb-2" style={{ color: colors.textMuted }}>
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-4 py-3 border focus:outline-none"
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  >
                    <option value="cream">Cream (Luxury)</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="px-8 py-4 text-xs tracking-[0.3em] uppercase transition-all duration-300 hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: colors.goldDark, color: colors.textLight }}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
