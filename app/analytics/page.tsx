"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Sparkles, TrendingUp, Download, Layers } from "lucide-react";

type DigestResponse = {
  digest: string;
  postCount: number;
  benchmark?: { yourRate: string; nicheTypicalRange: string; note: string; disclaimer: string };
};

type Insights = {
  outliers: { _id: string; caption?: string; detectedCharacter?: string; engagementScore: number }[];
  avgScore: number;
  index: { character: string; source: string; count: number }[];
  onlyPostedOnce: { character: string; source: string; count: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<DigestResponse | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/digest/weekly").then((r) => r.json()),
      fetch("/api/insights").then((r) => r.json()),
    ])
      .then(([digestData, insightsData]) => {
        setData(digestData);
        setInsights(insightsData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <main className="flex-1 px-8 py-8 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Analytics</h1>
            <p className="text-cream/60 text-sm mt-1">Your weekly performance, in plain language.</p>
          </div>
          <a
            href="/api/export/csv"
            className="flex items-center gap-1.5 text-xs border border-cream/20 text-cream/70 px-3 py-2 rounded-lg hover:text-cream"
          >
            <Download size={14} /> Export CSV
          </a>
        </div>

        {loading && <p className="text-cream/40 text-sm mt-6">Loading…</p>}

        {!loading && data && (
          <>
            <div className="glass rounded-2xl p-5 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-lime" />
                <p className="text-xs font-medium text-lime uppercase tracking-wide">
                  This week ({data.postCount} posted)
                </p>
              </div>
              <p className="text-sm text-cream/90 leading-relaxed">{data.digest}</p>
            </div>

            {data.benchmark && (
              <div className="glass rounded-2xl p-5 mt-4">
                <p className="text-sm font-medium text-cream mb-3">Niche context</p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xl font-semibold text-cream">{data.benchmark.yourRate}</p>
                    <p className="text-[11px] text-cream/40">Your avg engagement</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-cream/60">{data.benchmark.nicheTypicalRange}</p>
                    <p className="text-[11px] text-cream/40">Typical for this niche</p>
                  </div>
                </div>
                <p className="text-xs text-cream/50 mt-3">{data.benchmark.note}</p>
                <p className="text-[10px] text-cream/30 mt-2 italic">{data.benchmark.disclaimer}</p>
              </div>
            )}
          </>
        )}

        {!loading && insights && insights.outliers.length > 0 && (
          <div className="glass rounded-2xl p-5 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-ember" />
              <p className="text-sm font-medium text-cream">Outliers — 2x+ your average</p>
            </div>
            <div className="space-y-2">
              {insights.outliers.slice(0, 5).map((o) => (
                <div key={o._id} className="flex items-center justify-between text-xs">
                  <p className="text-cream/70 truncate max-w-xs">{o.caption || o.detectedCharacter}</p>
                  <p className="text-ember font-medium">{o.engagementScore.toFixed(3)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && insights && insights.index.length > 0 && (
          <div className="glass rounded-2xl p-5 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={15} className="text-lime" />
              <p className="text-sm font-medium text-cream">Series index — what you&apos;ve covered</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.index.slice(0, 15).map((i) => (
                <div key={i.character} className="bg-teal/40 rounded-md px-2.5 py-1.5">
                  <p className="text-xs text-cream">{i.character}</p>
                  <p className="text-[10px] text-cream/40">{i.source} · {i.count}x</p>
                </div>
              ))}
            </div>
            {insights.onlyPostedOnce.length > 0 && (
              <p className="text-[11px] text-cream/40 mt-3">
                {insights.onlyPostedOnce.length} character{insights.onlyPostedOnce.length === 1 ? "" : "s"} posted
                only once — could be worth revisiting if it fits your niche.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
