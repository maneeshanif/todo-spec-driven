"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Calendar, Target, Loader2 } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import StatsCards from "@/components/dashboard/StatsCards";
import { useTaskStore } from "@/stores/task-store";
import { statsApi, UserStats } from "@/lib/api/stats";
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

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
  const { fetchTasks } = useTaskStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    loadStats();
  }, [fetchTasks]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await statsApi.getUserStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load statistics');
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock weekly productivity data
  const productivityData = [
    { day: 'Mon', rate: stats?.completion_rate || 0 },
    { day: 'Tue', rate: Math.min(100, (stats?.completion_rate || 0) * 1.1) },
    { day: 'Wed', rate: Math.min(100, (stats?.completion_rate || 0) * 0.9) },
    { day: 'Thu', rate: Math.min(100, (stats?.completion_rate || 0) * 1.05) },
    { day: 'Fri', rate: Math.min(100, (stats?.completion_rate || 0) * 0.95) },
    { day: 'Sat', rate: Math.min(100, (stats?.completion_rate || 0) * 0.8) },
    { day: 'Sun', rate: Math.min(100, (stats?.completion_rate || 0) * 0.85) },
  ];

  // Priority distribution data
  const priorityData = stats ? [
    { name: 'High', value: stats.tasks_by_priority.high, color: '#dc2626' },
    { name: 'Medium', value: stats.tasks_by_priority.medium, color: '#f59e0b' },
    { name: 'Low', value: stats.tasks_by_priority.low, color: '#10b981' },
  ] : [];

  // Activity data
  const activityData = stats ? [
    { name: 'Completed', value: stats.completed_tasks, color: '#16a34a' },
    { name: 'Pending', value: stats.pending_tasks, color: colors.goldDark },
    { name: 'Overdue', value: stats.overdue_tasks, color: '#dc2626' },
  ] : [];

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
              <div className="h-64">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.goldDark }} />
                  </div>
                ) : error ? (
                  <div className="h-full flex items-center justify-center text-sm" style={{ color: colors.textMuted }}>
                    {error}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={productivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                      <XAxis dataKey="day" stroke={colors.textMuted} />
                      <YAxis stroke={colors.textMuted} />
                      <Tooltip
                        contentStyle={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Completion Rate']}
                      />
                      <Line type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} dot={{ fill: "#16a34a" }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
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
              <div className="h-64">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.goldDark }} />
                  </div>
                ) : error ? (
                  <div className="h-full flex items-center justify-center text-sm" style={{ color: colors.textMuted }}>
                    {error}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
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
                <h2 className="text-xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Task Status Overview</h2>
              </div>
              <div className="h-64">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.goldDark }} />
                  </div>
                ) : error ? (
                  <div className="h-full flex items-center justify-center text-sm" style={{ color: colors.textMuted }}>
                    {error}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                      <XAxis dataKey="name" stroke={colors.textMuted} />
                      <YAxis stroke={colors.textMuted} />
                      <Tooltip
                        contentStyle={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Tasks">
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
