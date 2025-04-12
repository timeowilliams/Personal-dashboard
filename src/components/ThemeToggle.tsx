// components/ThemeToggle.jsx
import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Set dark mode as default
    const savedTheme = localStorage.getItem("theme");

    // If no saved theme, default to dark
    if (!savedTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      // Otherwise use saved preference
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      } else {
        setIsDark(false);
      }
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-blue-500" />
      )}
    </button>
  );
};

export default ThemeToggle;
