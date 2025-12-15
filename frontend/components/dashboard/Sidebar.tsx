"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Mic
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

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

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: CheckSquare, label: "All Tasks", href: "/tasks" },
  { icon: Calendar, label: "Today", href: "/tasks/today" },
  { icon: Calendar, label: "Upcoming", href: "/tasks/upcoming" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: MessageSquare, label: "AI Chat", href: "/ai-chat" },
  { icon: Mic, label: "Voice Assistant", href: "/voice" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    // IMPORTANT: Wait for logout to complete before redirecting
    await logout();
    // Wait a bit more for localStorage to be cleared (async operation)
    await new Promise(resolve => setTimeout(resolve, 150));
    window.location.href = "/login";
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0, width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-screen flex flex-col z-50"
      style={{ backgroundColor: colors.bgAlt, borderRight: `1px solid ${colors.border}` }}
    >
      {/* Header */}
      <div
        className="p-6 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        {!collapsed && (
          <Link href="/dashboard">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Sparkles className="w-5 h-5" style={{ color: colors.goldDark }} />
              <span
                className="text-sm tracking-[0.2em] uppercase"
                style={{ color: colors.goldDark }}
              >
                TaskFlow®
              </span>
            </motion.div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg transition-colors hover:opacity-70"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" style={{ color: colors.textMuted }} />
          ) : (
            <ChevronLeft className="w-5 h-5" style={{ color: colors.textMuted }} />
          )}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-light"
              style={{ backgroundColor: colors.goldDark, color: colors.textLight }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: colors.text }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: colors.textMuted }}>{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{
                      backgroundColor: isActive ? colors.goldDark : 'transparent',
                      color: isActive ? colors.textLight : colors.textMuted
                    }}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm tracking-wide">{item.label}</span>
                    )}
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4" style={{ borderTop: `1px solid ${colors.border}` }}>
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-70",
            collapsed && "justify-center"
          )}
          style={{ color: "#8b2635" }}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm tracking-wide">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
