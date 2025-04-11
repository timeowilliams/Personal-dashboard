// components/DashboardLayout.jsx
import React from "react";
import BackgroundAnimation from "./BackgroundAnimation";
import ThemeToggle from "./ThemeToggle";

const DashboardLayout = ({ children, title, loading }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
       <BackgroundAnimation />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="relative glassmorphism-card px-8 py-6 rounded-xl backdrop-blur-md bg-white/30 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/20 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl"></div>
          <div className="flex justify-between items-center relative">
            <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
            <ThemeToggle />
    {loading && (
      <div className="flex items-center space-x-2">
        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span>Refreshing data...</span>
      </div>
    )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;