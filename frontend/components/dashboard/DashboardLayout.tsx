"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useTaskStore } from '@/stores/task-store';
import TaskList from '@/components/tasks/TaskList';
import { Button } from '@/components/ui/button';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { fetchTasks, loading, error, tasks } = useTaskStore();

  useEffect(() => {
    // Fetch tasks when dashboard loads
    fetchTasks();
  }, [fetchTasks]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Tasks</h1>
            <p className="text-sm text-neutral-400">Welcome back, {user?.name}</p>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="border-neutral-700 hover:bg-neutral-800"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <TaskList tasks={tasks} loading={loading} />
        <CreateTaskModal />
      </main>
    </div>
  );
}
