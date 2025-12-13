"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { useTaskStore } from "@/stores/task-store";
import Sidebar from "@/components/dashboard/Sidebar";
import TaskList from "@/components/tasks/TaskList";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

// Luxury color palette
const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
};

export default function UpcomingPage() {
  const { fetchTasks, loading, error, tasks } = useTaskStore();

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 7);

    fetchTasks({
      due_date_start: tomorrow.toISOString(),
      due_date_end: nextWeek.toISOString(),
    });
  }, [fetchTasks]);

  const upcomingTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return dueDate >= tomorrow && dueDate <= nextWeek;
  });

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.bg }}>
      <Sidebar />

      <main className="flex-1 ml-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-sm border-b" style={{ backgroundColor: `${colors.bgAlt}cc`, borderColor: colors.border }}>
          <div className="px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-3" style={{ backgroundColor: `${colors.goldDark}15` }}>
                <CalendarDays className="w-6 h-6" style={{ color: colors.goldDark }} />
              </div>
              <div>
                <h1 className="text-3xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Upcoming</h1>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Tasks due in the next 7 days
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border p-6"
            style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>
                {upcomingTasks.length} upcoming tasks
              </h2>
            </div>

            {error && (
              <div className="mb-6 p-4 border" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
                <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
              </div>
            )}

            <TaskList tasks={upcomingTasks} loading={loading} />
          </motion.div>
        </div>
      </main>

      <CreateTaskModal />
    </div>
  );
}
