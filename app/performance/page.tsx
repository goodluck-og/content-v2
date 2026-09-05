"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Activity, TrendingUp, TimerReset, Target } from "lucide-react";

type Stat = {
  label: string;
  value: string;
  delta?: string;
};

export default function PerformancePage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, digestRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/digest/weekly"),
        ]);

        const statsData = statsRes.ok ? await statsRes.json() : null;
        const digestData = digestRes.ok ? await digestRes.json() : null;

        const next: Stat[] = [
          { label: "Published", value: String(statsData?.published ?? 0) },
          { label: "Scheduled", value: String(statsData?.scheduled ?? 0) },
          { label: "Pending review", value: String(statsData?.pending ?? 0) },
          { label: "Total views", value: String(statsData?.totalViews ?? 0) },
          { label: "AI health", value: `${statsData?.health?.percent ?? 0}%` },
          { label: "Approval streak", value: `${statsData?.approvalStreak ?? 0} days` },
        ];

        if (digestData?.benchmark?.yourRate) {
          next.push({ label: "Avg engagement", value: String(digestData.benchmark.yourRate) });
        }

        setStats(next);
      } catch {
        setStats([
          { label: "Published", value: "0" },
          { label: "Scheduled", value: "0" },
          { label: "Pending review", value: "0" },
        ]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <main className="flex-1 px-8 py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">Performance</h1>
            <p className="text-cream/60 text-sm mt-1">Track how your content is doing, with plain-English summaries.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-cream/40 text-sm mt-6">Loading performance data…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {stats.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-4">
                  <p className="text-[11px] uppercase tracking-wide text-cream/40">{stat.label}</p>
                  <p className="text-2xl font-semibold text-white mt-2">{stat.value}</p>
                  {stat.delta && <p className="text-emerald text-[11px] mt-2">{stat.delta}</p>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-lime" />
                  <p className="text-sm font-medium text-cream">Growth snapshot</p>
                </div>
                <p className="text-sm text-cream/70 leading-relaxed">
                  Your best-performing videos are usually the ones that match your niche and are published at the same times your AI scheduler is learning to prefer.
                </p>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-ember" />
                  <p className="text-sm font-medium text-cream">Optimization cues</p>
                </div>
                <ul className="space-y-2 text-sm text-cream/70">
                  <li>• Keep your posting cadence within your daily cap.</li>
                  <li>• Review low-performing clips and test different hooks.</li>
                  <li>• Use a stronger niche angle and consistent series labels.</li>
                </ul>
              </div>
            </div>

            <div className="glass rounded-2xl p-5 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-teal" />
                <p className="text-sm font-medium text-cream">AI performance notes</p>
              </div>
              <div className="space-y-3 text-sm text-cream/70">
                <p>• Content quality and posting timing are the main drivers of view lift.</p>
                <p>• Keep the automatic thumbnail selection enabled for stronger click-through rate.</p>
                <p>• Review the weekly digest and analytics pages for concrete ideas on what to keep, stop, or test.</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
