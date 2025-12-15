"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/task-store';
import { useUIStore } from '@/stores/ui-store';
import TaskList from '@/components/tasks/TaskList';
import Sidebar from "@/components/dashboard/Sidebar";
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

export default function DashboardLayout() {
  const { user } = useAuthStore();
  const { fetchTasks, loading, error, tasks } = useTaskStore();
  const { openModal, closeModal, modals } = useUIStore();

  const isCreateModalOpen = modals['create-task'] || false;

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.bg }}>
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-[280px] transition-all duration-300">
        {/* Header */}
        <header
          className="sticky top-0 z-40 backdrop-blur-sm border-b"
          style={{ backgroundColor: `${colors.bg}ee`, borderColor: colors.border }}
        >
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-3xl font-light mb-1"
                  style={{ color: colors.text, fontFamily: "serif" }}
                >
                  All Tasks
                </h1>
                <p className="text-sm tracking-wide" style={{ color: colors.textMuted }}>
                  Manage and organize your tasks
                </p>
              </div>
              <Button
                className="px-6 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-300"
                style={{ backgroundColor: colors.goldDark, color: colors.textLight }}
                size="lg"
                onClick={() => openModal('create-task')}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 border" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
              <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border p-6"
            style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-2xl font-light"
                style={{ color: colors.text, fontFamily: "serif" }}
              >
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </h2>
            </div>

            <TaskList tasks={tasks} loading={loading} />
          </motion.div>
        </div>
      </main>

      <CreateTaskModal 
        open={isCreateModalOpen}
        onClose={() => closeModal('create-task')}
      />
    </div>
  );
}