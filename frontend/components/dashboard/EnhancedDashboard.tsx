"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskStore } from "@/stores/task-store";
import { useUIStore } from "@/stores/ui-store";
import Sidebar from "./Sidebar";
import StatsCards from "./StatsCards";
import TaskList from "@/components/tasks/TaskList";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { Plus, Filter, ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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

export default function EnhancedDashboard() {
  const { user } = useAuth();
  const { fetchTasks, loading, error, tasks, filters, setFilters, clearFilters } = useTaskStore();
  const { openModal, closeModal, modals } = useUIStore();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const isCreateModalOpen = modals['create-task'] || false;

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Update active filter badges
  useEffect(() => {
    const badges: string[] = [];
    if (filters.completed !== undefined) {
      badges.push(filters.completed ? 'Completed' : 'Pending');
    }
    if (filters.priority) {
      badges.push(`Priority: ${filters.priority}`);
    }
    if (filters.sortBy && filters.sortBy !== 'created_at') {
      badges.push(`Sort: ${filters.sortBy}`);
    }
    setActiveFilters(badges);
  }, [filters]);

  const handleFilterByStatus = (status: boolean | undefined) => {
    setFilters({ completed: status });
  };

  const handleFilterByPriority = (priority: string | undefined) => {
    setFilters({ priority });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters({ sortBy, sortOrder });
  };

  const handleClearFilters = () => {
    clearFilters();
  };

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
                  Welcome back, <span style={{ color: colors.goldDark }}>{user?.name}</span>
                </h1>
                <p className="text-sm tracking-wide" style={{ color: colors.textMuted, fontStyle: "italic" }}>
                  Here's what's happening with your tasks today
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
        <div className="p-8 space-y-8">
          {/* Stats Cards */}
          <StatsCards />

          {/* Tasks Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border p-6"
            style={{ backgroundColor: `${colors.bgAlt}80`, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2
                  className="text-2xl font-light"
                  style={{ color: colors.text, fontFamily: "serif" }}
                >
                  Your Tasks
                </h2>
                {/* Active filter badges */}
                {activeFilters.length > 0 && (
                  <div className="flex items-center gap-2">
                    {activeFilters.map((badge, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded"
                        style={{ backgroundColor: `${colors.goldDark}20`, color: colors.goldDark }}
                      >
                        {badge}
                      </span>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" style={{ color: colors.textMuted }} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {/* Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs tracking-wider uppercase"
                      style={{ borderColor: colors.border, color: colors.textMuted }}
                    >
                      <Filter className="w-3 h-3 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>By Status</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleFilterByStatus(undefined)}>
                      All Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFilterByStatus(false)}>
                      Pending Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFilterByStatus(true)}>
                      Completed Only
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>By Priority</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleFilterByPriority(undefined)}>
                      All Priorities
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFilterByPriority('high')}>
                      High Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFilterByPriority('medium')}>
                      Medium Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFilterByPriority('low')}>
                      Low Priority
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs tracking-wider uppercase"
                      style={{ borderColor: colors.border, color: colors.textMuted }}
                    >
                      <ArrowUpDown className="w-3 h-3 mr-2" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleSort('created_at', 'desc')}>
                      Newest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('created_at', 'asc')}>
                      Oldest First
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSort('due_date', 'asc')}>
                      Due Date (Earliest)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('due_date', 'desc')}>
                      Due Date (Latest)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSort('priority', 'desc')}>
                      Priority (High to Low)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('priority', 'asc')}>
                      Priority (Low to High)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSort('title', 'asc')}>
                      Title (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('title', 'desc')}>
                      Title (Z-A)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 border" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
                <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
              </div>
            )}

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
