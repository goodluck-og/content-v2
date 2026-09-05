"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CalPost = { _id: string; driveFileName?: string; caption?: string; status: string };

export default function CalendarPage() {
  const [byDate, setByDate] = useState<Record<string, CalPost[]>>({});
  const [cursor, setCursor] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/videos/calendar")
      .then((r) => r.json())
      .then((d) => setByDate(d.byDate || {}))
      .finally(() => setLoading(false));
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function key(day: number) {
    return new Date(year, month, day).toISOString().slice(0, 10);
  }

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <main className="flex-1 px-8 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="text-cream/50 hover:text-cream">
              <ChevronLeft size={18} />
            </button>
            <p className="text-cream text-sm font-medium w-32 text-center">
              {cursor.toLocaleString("default", { month: "long", year: "numeric" })}
            </p>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="text-cream/50 hover:text-cream">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading && <p className="text-cream/40 text-sm">Loading…</p>}

        {!loading && (
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <p key={d} className="text-[11px] text-cream/40 text-center pb-1">{d}</p>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const posts = byDate[key(day)] || [];
              return (
                <div key={i} className="glass rounded-lg p-2 min-h-[80px]">
                  <p className="text-xs text-cream/50 mb-1">{day}</p>
                  {posts.slice(0, 2).map((p) => (
                    <div
                      key={p._id}
                      className={`text-[10px] rounded px-1.5 py-1 mb-1 truncate ${
                        p.status === "posted" ? "bg-lime/20 text-lime" : "bg-ember/20 text-ember"
                      }`}
                      title={p.caption}
                    >
                      {p.driveFileName || p.caption?.slice(0, 20)}
                    </div>
                  ))}
                  {posts.length > 2 && (
                    <p className="text-[9px] text-cream/30">+{posts.length - 2} more</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
