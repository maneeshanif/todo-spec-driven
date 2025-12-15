"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { useTaskStore } from "@/stores/task-store";
import { useMemo } from "react";

// Luxury color palette (Cream theme)
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

export default function StatsCards() {
  const { tasks, loading } = useTaskStore();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    
    // Calculate overdue tasks
    const now = new Date();
    const overdue = tasks.filter(t => {
      if (t.completed || !t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate < now;
    }).length;

    return { total, completed, pending, overdue };
  }, [tasks]);

  const cards = [
    {
      title: "Total Tasks",
      value: stats.total,
      icon: TrendingUp,
      iconColor: colors.goldDark,
      bgColor: `${colors.goldDark}15`,
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      iconColor: "#16a34a",
      bgColor: "#16a34a15",
    },
    {
      title: "In Progress",
      value: stats.pending,
      icon: Clock,
      iconColor: "#ca8a04",
      bgColor: "#ca8a0415",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      iconColor: "#dc2626",
      bgColor: "#dc262615",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse"
            style={{ backgroundColor: colors.border }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden border p-6 transition-all duration-300 hover:shadow-lg"
          style={{ backgroundColor: `${colors.bgAlt}80`, borderColor: colors.border }}
        >
          {/* Content */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3"
                style={{ backgroundColor: card.bgColor }}
              >
                <card.icon className="w-6 h-6" style={{ color: card.iconColor }} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs tracking-wider uppercase" style={{ color: colors.textMuted }}>{card.title}</p>
              <p className="text-3xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>
                {card.value}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
