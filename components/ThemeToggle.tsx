"use client";

import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition bg-gray-200 dark:bg-gray-800 hover:scale-105"
      aria-label="Toggle Theme"
    >
      {theme === "light" ? (
        <FiMoon className="text-gray-800" size={20} />
      ) : (
        <FiSun className="text-yellow-400" size={20} />
      )}
    </button>
  );
}
