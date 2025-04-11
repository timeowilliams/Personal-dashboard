// components/DashboardLayout.jsx
"use client";
import React from "react";
import Sidebar from "./Sidebar";
import { Bell, Sun, Moon } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import BackgroundAnimation from "./BackgroundAnimation";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  loading?: boolean;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  loading,
  activeCategory,
  setActiveCategory,
}) => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen">
      <BackgroundAnimation />
      <Sidebar
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        <header className="relative glassmorphism-card px-6 py-4 rounded-xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <h1 className="text-2xl font-medium">
                {isAuthenticated ? `${user?.name}'s ${title}` : title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="h-9 w-9 rounded-full bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-800/40 flex items-center justify-center transition-colors"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>

              <ThemeToggle className="h-9 w-9 rounded-full bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-800/40 flex items-center justify-center transition-colors">
                <Sun size={18} className="hidden dark:block" />
                <Moon size={18} className="block dark:hidden" />
              </ThemeToggle>

              {isAuthenticated && (
                <div className="flex items-center gap-2 ml-2">
                  {user?.image && (
                    <img
                      src={user.image}
                      alt="Profile"
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="text-sm">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="absolute top-4 right-6 flex items-center space-x-2">
              <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
              <span className="text-sm text-muted-foreground">
                Refreshing...
              </span>
            </div>
          )}
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <main className="relative z-10">{children}</main>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
