"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from 'lucide-react'; // Example icons

const ThemeToggle = () => {
  // 1. next-themes hook to manage state
  const { theme, setTheme } = useTheme();
  
  // 2. State to handle hydration mismatch on initial load
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder until hydration is complete
    return <button className="p-2 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></button>;
  }
  
  // 3. Render the correct button based on the current theme
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-full transition-colors duration-200 
                 text-gray-900 bg-gray-100 
                 dark:text-gray-100 dark:bg-gray-800 
                 hover:ring-2 ring-blue-500/50"
      aria-label={`Switch to ${isDark ? 'Light Mode' : 'Dark Mode'}`}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;