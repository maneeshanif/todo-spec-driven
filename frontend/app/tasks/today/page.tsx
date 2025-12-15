"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun } from "lucide-react";
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

export default function TodayPage() {
  const { fetchTasks, loading, error, tasks } = useTaskStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    // Fetch all tasks, then filter on client side
    fetchTasks();
  }, [fetchTasks]);

  const todayTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
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
                <Sun className="w-6 h-6" style={{ color: colors.goldDark }} />
              </div>
              <div>
                <h1 className="text-3xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>Today</h1>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
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
                {todayTasks.length} tasks due today
              </h2>
            </div>

            {error && (
              <div className="mb-6 p-4 border" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
                <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
              </div>
            )}

            <TaskList tasks={todayTasks} loading={loading} />
          </motion.div>
        </div>
      </main>

      <CreateTaskModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}
