"use client";

import { useEffect } from "react";
import { applyTheme } from "./ThemeSwitcher";
import { THEMES } from "@/lib/themes";

export function ThemeInit() {
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    applyTheme(saved || THEMES[0].id);
  }, []);
  return null;
}
