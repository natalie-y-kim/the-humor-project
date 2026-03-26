"use client";

import { useEffect, useState } from "react";

type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

function resolveTheme(preference: ThemePreference) {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return preference;
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const nextPreference =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";

    setPreference(nextPreference);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      root.dataset.theme = resolveTheme(preference);
    };

    applyTheme();

    if (preference !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [preference]);

  const updatePreference = (nextPreference: ThemePreference) => {
    window.localStorage.setItem(STORAGE_KEY, nextPreference);
    setPreference(nextPreference);
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Theme mode">
      {(["light", "dark", "system"] as ThemePreference[]).map((option) => (
        <button
          key={option}
          type="button"
          className="theme-toggle-button"
          data-active={preference === option}
          data-value={option}
          onClick={() => updatePreference(option)}
        >
          {option === "system" ? "System" : option === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  );
}
