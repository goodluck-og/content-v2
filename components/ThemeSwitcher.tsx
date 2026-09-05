"use client";

import { useState } from "react";
import { Palette, X } from "lucide-react";
import { THEMES } from "@/lib/themes";

export function applyTheme(themeId: string) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  root.style.setProperty("--color-ink", theme.colors.ink);
  root.style.setProperty("--color-teal", theme.colors.teal);
  root.style.setProperty("--color-lime", theme.colors.lime);
  root.style.setProperty("--color-ember", theme.colors.ember);
  root.style.setProperty("--color-cream", theme.colors.cream);
  root.style.setProperty("--background", theme.colors.ink);
  root.style.setProperty("--foreground", theme.colors.cream);
}

export function ThemeSwitcher({
  accountId,
  currentThemeId,
  onChange,
}: {
  accountId: string;
  currentThemeId: string;
  onChange: (themeId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  async function selectTheme(themeId: string) {
    applyTheme(themeId);
    onChange(themeId);
    setOpen(false);
    if (typeof window !== "undefined") localStorage.setItem("theme", themeId);
    try {
      await fetch("/api/accounts/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, themeId }),
      });
    } catch {
      // Non-fatal: theme still applied locally even if the account sync fails.
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs border border-teal/40 text-cream/70 px-2.5 py-1.5 rounded-md hover:text-cream transition"
      >
        <Palette size={14} />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-20 bg-ink border border-teal/40 rounded-lg p-3 w-64 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-cream/50 uppercase tracking-wide">Choose a theme</p>
            <button onClick={() => setOpen(false)}>
              <X size={14} className="text-cream/40" />
            </button>
          </div>
          <div className="space-y-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTheme(t.id)}
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-teal/20 transition ${
                  currentThemeId === t.id ? "bg-teal/30" : ""
                }`}
              >
                <div className="flex -space-x-1">
                  {[t.colors.ink, t.colors.teal, t.colors.lime, t.colors.ember, t.colors.cream].map(
                    (c, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-black/20"
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
                <span className="text-xs text-cream/80">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
