"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CycleProgressRing } from "@/components/CycleProgressRing";
import { Info } from "lucide-react";

type ScheduleStatus = {
  mode: string;
  daysElapsed?: number;
  totalDays?: number;
  lockedSlots?: { hour: number; minute: number; avgEngagementScore: number }[];
  lastRelearnTriggerReason?: string;
};

function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, "0")} ${period}`;
}

export default function AutomationPage() {
  const [status, setStatus] = useState<ScheduleStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedule/status")
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <main className="flex-1 px-8 py-8 max-w-3xl">
        <h1 className="text-white text-2xl font-bold">Automation</h1>
        <p className="text-cream/60 text-sm mt-1">
          The self-learning engine that finds your best posting times.
        </p>

        {loading && <p className="text-cream/40 text-sm mt-6">Loading…</p>}

        {!loading && status?.mode === "not_started" && (
          <div className="glass rounded-2xl p-6 mt-6 text-sm text-cream/60">
            No learning cycle has started yet — this kicks off automatically the
            first time your Google account is connected with a Drive folder set.
          </div>
        )}

        {!loading && status && status.mode !== "not_started" && (
          <>
            <div className="mt-6">
              <CycleProgressRing
                daysElapsed={status.daysElapsed || 0}
                totalDays={status.totalDays || 30}
                mode={status.mode}
              />
            </div>

            <div className="glass rounded-2xl p-5 mt-5">
              <div className="flex items-start gap-2 mb-3">
                <Info size={15} className="text-cream/40 mt-0.5 shrink-0" />
                <p className="text-xs text-cream/50">
                  {status.mode === "exploring"
                    ? "Posting across rotating candidate time slots to find which ones perform best for this account specifically — not general TikTok/YouTube advice."
                    : "Locked onto your best-performing time slots. If real performance drops 25%+ below their own rolling average, learning restarts automatically."}
                </p>
              </div>

              {status.lockedSlots && status.lockedSlots.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-cream/40 uppercase tracking-wide mb-2">
                    Locked posting times
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {status.lockedSlots.map((s, i) => (
                      <div key={i} className="bg-lime/10 border border-lime/30 rounded-lg px-3 py-2">
                        <p className="text-sm font-medium text-lime">
                          {formatTime(s.hour, s.minute)}
                        </p>
                        <p className="text-[10px] text-cream/40">
                          score {s.avgEngagementScore.toFixed(3)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {status.lastRelearnTriggerReason && (
                <div className="mt-4 pt-4 border-t border-cream/10">
                  <p className="text-xs text-cream/40 uppercase tracking-wide mb-1">
                    Last relearn trigger
                  </p>
                  <p className="text-xs text-cream/60">{status.lastRelearnTriggerReason}</p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="glass rounded-2xl p-5 mt-5">
          <p className="text-sm font-medium text-cream mb-2">How this actually runs</p>
          <p className="text-xs text-cream/50 leading-relaxed">
            A daily job (Vercel Cron, once a day) recomputes each time slot&apos;s
            real engagement score from posted videos, checks whether a clear
            winner has emerged, and locks in your best 3 slots — either early if
            the data is decisive, or automatically at the 30-day mark either way.
            It also re-syncs Drive as a backup in case a push notification was
            missed, and publishes anything that&apos;s due.
          </p>
        </div>
      </main>
    </div>
  );
}
