"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { ThemeSwitcher, applyTheme } from "@/components/ThemeSwitcher";
import { THEMES } from "@/lib/themes";
import { ToastStack, Toast } from "@/components/ToastStack";

type AccountInfo = {
  themeId?: string;
  useSeriesNumbering?: boolean;
  seriesLabel?: string;
  autoSelectThumbnail?: boolean;
  driveFolderId?: string;
  niche?: string;
  postsPerDayCap?: number;
  googleConnected?: boolean;
  googleConnectedEmail?: string;
  styleNotes?: string;
  notifyWebhookUrl?: string;
};

export default function SettingsPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [folderInput, setFolderInput] = useState("");
  const [nicheInput, setNicheInput] = useState("");
  const [capInput, setCapInput] = useState(3);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function pushToast(message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2000);
  }

  useEffect(() => {
    fetch("/api/account")
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => {
        if (!d?.account) return;
        setAccount(d.account);
        setFolderInput(d.account.driveFolderId || "");
        setNicheInput(d.account.niche || "");
        setCapInput(d.account.postsPerDayCap || 3);
        if (d.account.themeId) {
          setThemeId(d.account.themeId);
          applyTheme(d.account.themeId);
        }
      })
      .catch(() => {});
  }, []);

  async function saveField(fields: Record<string, unknown>) {
    setSaving(true);
    await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setSaving(false);
    setAccount((a) => (a ? { ...a, ...fields } : a));
    pushToast("Saved");
  }

  if (!account) {
    return (
      <div className="flex min-h-screen bg-ink">
        <Sidebar />
        <main className="flex-1 px-8 py-8">
          <p className="text-cream/40 text-sm">Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <ToastStack toasts={toasts} />
      <main className="flex-1 px-8 py-8 max-w-2xl">
        <h1 className="text-white text-2xl font-bold">Settings</h1>
        <p className="text-cream/60 text-sm mt-1">Connections, appearance, and posting preferences.</p>

        {/* Google connection */}
        <div className="glass rounded-2xl p-5 mt-6">
          <p className="text-sm font-medium text-cream mb-2">Google account</p>
          {account.googleConnected ? (
            <p className="text-lime text-sm">✅ Connected as {account.googleConnectedEmail}</p>
          ) : (
            <a
              href="/api/auth/google"
              className="inline-block bg-lime text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              Connect Google
            </a>
          )}

          <div className="mt-4">
            <label className="text-xs text-cream/50">Google Drive folder ID to watch</label>
            <div className="flex gap-2 mt-1.5">
              <input
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="Paste the Drive folder ID"
                className="flex-1 bg-ink border border-cream/20 text-cream text-sm rounded-lg px-3 py-2 outline-none focus:border-lime"
              />
              <button
                onClick={() => saveField({ driveFolderId: folderInput })}
                disabled={saving}
                className="bg-teal text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="glass rounded-2xl p-5 mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-cream">Theme</p>
            <p className="text-xs text-cream/40">Choose the dashboard color palette</p>
          </div>
          <ThemeSwitcher accountId="me" currentThemeId={themeId} onChange={setThemeId} />
        </div>

        {/* Niche */}
        <div className="glass rounded-2xl p-5 mt-4">
          <p className="text-sm font-medium text-cream mb-2">Content niche</p>
          <p className="text-xs text-cream/40 mb-2">
            Helps the AI write better captions and pick a relevant benchmark.
          </p>
          <div className="flex gap-2">
            <input
              value={nicheInput}
              onChange={(e) => setNicheInput(e.target.value)}
              placeholder="e.g. Genshin Impact MMD edits"
              className="flex-1 bg-ink border border-cream/20 text-cream text-sm rounded-lg px-3 py-2 outline-none focus:border-lime"
            />
            <button
              onClick={() => saveField({ niche: nicheInput })}
              disabled={saving}
              className="bg-teal text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>

        {/* Posts per day cap */}
        <div className="glass rounded-2xl p-5 mt-4">
          <p className="text-sm font-medium text-cream mb-2">Posts per day cap</p>
          <p className="text-xs text-cream/40 mb-2">
            Keep this at 3 or lower — posting too often in a day is a common
            cause of reach suppression.
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              max={6}
              value={capInput}
              onChange={(e) => setCapInput(Number(e.target.value))}
              className="w-20 bg-ink border border-cream/20 text-cream text-sm rounded-lg px-3 py-2 outline-none focus:border-lime"
            />
            <button
              onClick={() => saveField({ postsPerDayCap: capInput })}
              disabled={saving}
              className="bg-teal text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>

        {/* Series numbering */}
        <div className="glass rounded-2xl p-5 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cream">Post numbering</p>
              <p className="text-xs text-cream/40">Prefix captions with &quot;Post 1&quot;, &quot;Part 1&quot;, etc.</p>
            </div>
            <button
              onClick={() => saveField({ useSeriesNumbering: !account.useSeriesNumbering })}
              className={`w-11 h-6 rounded-full transition relative ${
                account.useSeriesNumbering ? "bg-lime" : "bg-teal/60"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  account.useSeriesNumbering ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {account.useSeriesNumbering && (
            <div className="flex items-center gap-2 mt-3">
              <p className="text-xs text-cream/50">Label:</p>
              {["Post", "Part", "Ep"].map((label) => (
                <button
                  key={label}
                  onClick={() => saveField({ seriesLabel: label })}
                  className={`text-xs px-2.5 py-1 rounded-md border ${
                    account.seriesLabel === label
                      ? "bg-lime text-white border-lime"
                      : "border-cream/20 text-cream/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail selection */}
        <div className="glass rounded-2xl p-5 mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-cream">Smart thumbnail selection</p>
            <p className="text-xs text-cream/40 max-w-sm">
              Picks your best real video frame as the thumbnail. Not AI-generated
              art — that would need a paid image model.
            </p>
          </div>
          <button
            onClick={() => saveField({ autoSelectThumbnail: !account.autoSelectThumbnail })}
            className={`w-11 h-6 rounded-full transition relative shrink-0 ${
              account.autoSelectThumbnail ? "bg-lime" : "bg-teal/60"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                account.autoSelectThumbnail ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* House style notes */}
        <div className="glass rounded-2xl p-5 mt-4">
          <p className="text-sm font-medium text-cream mb-2">House style notes</p>
          <p className="text-xs text-cream/40 mb-2">
            Rules the AI should always follow, e.g. &quot;always mention MMD in the title&quot;.
          </p>
          <textarea
            defaultValue={account.styleNotes || ""}
            onBlur={(e) => saveField({ styleNotes: e.target.value })}
            rows={2}
            className="w-full bg-ink border border-cream/20 text-cream text-sm rounded-lg px-3 py-2 outline-none focus:border-lime"
          />
        </div>

        {/* Webhook alerts */}
        <div className="glass rounded-2xl p-5 mt-4">
          <p className="text-sm font-medium text-cream mb-2">Discord/Slack alerts</p>
          <p className="text-xs text-cream/40 mb-2">
            Paste a webhook URL to get notified when a post publishes or fails.
          </p>
          <input
            defaultValue={account.notifyWebhookUrl || ""}
            onBlur={(e) => saveField({ notifyWebhookUrl: e.target.value })}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full bg-ink border border-cream/20 text-cream text-sm rounded-lg px-3 py-2 outline-none focus:border-lime"
          />
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-6 text-xs text-cream/50 hover:text-cream border border-cream/20 px-3 py-2 rounded-md"
        >
          Sign out
        </button>
      </main>
    </div>
  );
}
