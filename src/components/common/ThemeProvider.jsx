"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    async function loadTheme() {
      try {
        const response = await fetch("/api/admin/settings/preferences");
        const data = await response.json();

        if (data.success && data.data?.theme) {
          setTheme(data.data.theme);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    }

    loadTheme();
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.add("light");
    } else {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      root.classList.add(mediaQuery.matches ? "dark" : "light");

      const handleChange = (event) => {
        root.classList.remove("light", "dark");
        root.classList.add(event.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
