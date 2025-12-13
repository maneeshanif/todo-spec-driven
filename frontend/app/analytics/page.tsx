"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Calendar, Target } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import StatsCards from "@/components/dashboard/StatsCards";

// Luxury color palette
const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.bg }}>
      <Sidebar />

      <main className="flex-1 ml-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-sm border-b" style={{ backgroundColor: `${colors.bgAlt}cc`, borderColor: colors.border }}>
          <div className="px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-3" style={{ backgroundColor: `${colors.goldDark}15` }}>
                <BarChart3 className="w-6 h-6" style={{ color: colors.goldDark }} />
              </div>
              <div>
                <h1 className="text-3xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Analytics</h1>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Track your productivity and insights
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Stats Overview */}
          <StatsCards />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Productivity Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border p-6"
              style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5" style={{ color: "#16a34a" }} />
                <h2 className="text-xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Productivity Trend</h2>
              </div>
              <div className="h-64 flex items-center justify-center text-sm italic" style={{ color: colors.textMuted }}>
                Chart placeholder - Integrate with Recharts
              </div>
            </motion.div>

            {/* Task Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border p-6"
              style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-5 h-5" style={{ color: colors.goldDark }} />
                <h2 className="text-xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Task Distribution</h2>
              </div>
              <div className="h-64 flex items-center justify-center text-sm italic" style={{ color: colors.textMuted }}>
                Chart placeholder - Integrate with Recharts
              </div>
            </motion.div>

            {/* Weekly Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border p-6 lg:col-span-2"
              style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-5 h-5" style={{ color: colors.goldDark }} />
                <h2 className="text-xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Weekly Activity</h2>
              </div>
              <div className="h-64 flex items-center justify-center text-sm italic" style={{ color: colors.textMuted }}>
                Chart placeholder - Integrate with Recharts
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
