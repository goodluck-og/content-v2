"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { ThemeSwitcher, applyTheme } from "@/components/ThemeSwitcher";
import { THEMES } from "@/lib/themes";
import { CheckCircle2, Clock3, FileText } from "lucide-react";

type AccountInfo = {
  driveFolderId?: string;
  googleConnected: boolean;
  themeId?: string;
};

type Stats = {
  totalContent: number;
  published: number;
  scheduled: number;
  pending: number;
  totalViews: number;
  activity: { action: string; detail: string; at: string }[];
  health: { percent: number; checks: { label: string; ok: boolean }[] };
  scheduleMode: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [folderInput, setFolderInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account")
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data?.account) return;
        setAccount(data.account);
        setFolderInput(data.account.driveFolderId || "");
        if (data.account.themeId) {
          setThemeId(data.account.themeId);
          applyTheme(data.account.themeId);
        }
      })
      .catch(() => {});

    fetch("/api/stats")
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => {
        if (d && !d.error) setStats(d);
      })
      .catch(() => {});
  }, []);

  async function saveFolder() {
    setSaving(true);
    await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driveFolderId: folderInput }),
    });
    setSaving(false);
    setAccount((a) => (a ? { ...a, driveFolderId: folderInput } : a));
  }

  const firstName = session?.user?.name?.split(" ")[0] || session?.user?.email || "there";

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />

      <main className="flex-1 px-8 py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Welcome back, {firstName} 👋</h1>
            <p className="text-cream/60 text-sm mt-1">
              {stats?.scheduleMode === "locked"
                ? "Your AI Content Autopilot is running on its learned best times."
                : stats?.scheduleMode === "exploring"
                ? "Your AI Content Autopilot is still learning your best posting times."
                : "Connect Google and set a Drive folder to get started."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher accountId="me" currentThemeId={themeId} onChange={setThemeId} />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-cream/60 hover:text-cream border border-cream/20 px-3 py-1.5 rounded-md"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-6 glass rounded-2xl p-4">
          {account?.googleConnected ? (
            <p className="text-lime text-sm">✅ Google Drive & YouTube connected</p>
          ) : (
            <div>
              <p className="text-cream/70 text-sm mb-2">
                Connect your Google account to enable Drive monitoring and YouTube publishing.
              </p>
              <a
                href="/api/auth/google"
                className="inline-block bg-lime text-white text-sm font-medium rounded-lg px-4 py-2"
              >
                Connect Google
              </a>
            </div>
          )}

          <div className="mt-4 flex gap-2 items-center">
            <input
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="Google Drive folder ID to watch"
              className="flex-1 bg-ink border border-cream/20 text-cream text-sm rounded-lg px-3 py-2 outline-none focus:border-lime"
            />
            <button
              onClick={saveFolder}
              disabled={saving}
              className="bg-teal text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save folder"}
            </button>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <StatCard value={String(stats?.totalContent ?? "–")} label="Total Content" accentClass="text-lime" />
          <StatCard value={String(stats?.published ?? "–")} label="Published" accentClass="text-cream/70" />
          <StatCard value={String(stats?.scheduled ?? "–")} label="Scheduled" accentClass="text-ember" />
          <StatCard value={String(stats?.totalViews ?? "–")} label="Total Views" accentClass="text-lime" />
        </div>

        <div className="flex gap-4 mt-6">
          <div className="flex-[2] glass rounded-2xl p-5 min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-cream/70 text-sm">Review Queue</p>
              <Link href="/queue" className="text-xs text-lime">View all →</Link>
            </div>
            {stats && stats.pending > 0 ? (
              <p className="text-sm text-cream/80 mt-4">
                {stats.pending} clip{stats.pending === 1 ? "" : "s"} waiting for your review.
              </p>
            ) : (
              <div className="mt-4 h-[140px] flex items-center justify-center text-cream/30 text-xs border border-dashed border-cream/20 rounded-lg">
                Nothing pending — new clips from Drive will show up here
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-lime rounded-2xl p-4">
              <p className="text-white font-bold text-sm">Autopilot Core</p>
              <p className="text-white/80 text-xs mt-1">
                {stats?.health.percent === 100 ? "All systems operational" : "Some setup still needed"}
              </p>
            </div>
            <Link href="/automation" className="glass rounded-2xl p-4 block">
              <p className="text-white text-sm font-medium">
                Automation Health: {stats?.health.percent ?? 0}%
              </p>
              <div className="mt-2 space-y-1">
                {stats?.health.checks.map((c) => (
                  <p key={c.label} className={`text-[11px] ${c.ok ? "text-lime" : "text-ember"}`}>
                    {c.ok ? "●" : "○"} {c.label}
                  </p>
                ))}
              </div>
            </Link>
            <div className="glass rounded-2xl p-4 flex-1">
              <p className="text-white text-sm font-medium mb-2">Recent Activity</p>
              {stats && stats.activity.length > 0 ? (
                <div className="space-y-2">
                  {stats.activity.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      {a.action.includes("published") ? (
                        <CheckCircle2 size={12} className="text-lime mt-0.5 shrink-0" />
                      ) : a.action.includes("Scheduled") ? (
                        <Clock3 size={12} className="text-ember mt-0.5 shrink-0" />
                      ) : (
                        <FileText size={12} className="text-cream/40 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="text-cream/70">{a.action}</p>
                        <p className="text-cream/40">{a.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-cream/50 text-xs">No activity yet — connect a Drive folder to get started.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
