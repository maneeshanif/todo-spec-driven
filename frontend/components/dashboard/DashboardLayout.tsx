"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useTaskStore } from '@/stores/task-store';
import TaskList from '@/components/tasks/TaskList';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';

// Luxury color palette
const colors = {
  bg: "#f8f5f0",
  bgAlt: "#f0ebe3",
  goldDark: "#a08339",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5dfd5",
  textLight: "#ffffff",
  red: "#8b2635",
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { fetchTasks, loading, error, tasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <header className="border-b backdrop-blur-sm" style={{ backgroundColor: `${colors.bgAlt}cc`, borderColor: colors.border }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light" style={{ color: colors.text, fontFamily: "serif" }}>My Tasks</h1>
            <p className="text-sm" style={{ color: colors.textMuted }}>Welcome back, {user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-90"
            style={{ backgroundColor: colors.red, color: colors.textLight }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 border" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
            <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
          </div>
        )}
        <TaskList tasks={tasks} loading={loading} />
        <CreateTaskModal />
      </main>
    </div>
  );
}