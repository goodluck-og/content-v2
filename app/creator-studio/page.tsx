"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Wand2, Sparkles, Bot, CalendarClock } from "lucide-react";

type StudioIdea = {
  title: string;
  hook: string;
  angle: string;
  format: string;
};

export default function CreatorStudioPage() {
  const [ideas, setIdeas] = useState<StudioIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/stats");
        const data = res.ok ? await res.json() : null;

        const picked = [
          {
            title: "Hook-driven short with a niche-specific payoff",
            hook: "Start with the problem your audience feels right away.",
            angle: data?.scheduleMode === "locked" ? "Lean into your highest-performing content pattern." : "Test a fresh angle while the AI keeps learning the best slot.",
            format: "20–35s short + on-screen text",
          },
          {
            title: "Series build-up clip",
            hook: "Reveal the setup before the real payoff.",
            angle: "Create a recognizable pattern people can follow weekly.",
            format: "15–25s, punchy cut, strong CTA",
          },
          {
            title: "Opinion / myth-bust clip",
            hook: "Open with a bold claim or common misconception.",
            angle: "Make the answer clear in 1 sentence, then demonstrate it.",
            format: "20–40s breakdown with example",
          },
        ];

        setIdeas(picked);
      } catch {
        setIdeas([
          {
            title: "Niche angle test",
            hook: "Open with the exact pain point of your target viewer.",
            angle: "Use your strongest recurring theme and repeat the pattern.",
            format: "20–30s short",
          },
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
        <div>
          <h1 className="text-white text-2xl font-bold">Creator Studio</h1>
          <p className="text-cream/60 text-sm mt-1">AI-inspired content ideas and production direction for your next batch.</p>
        </div>

        {loading ? (
          <p className="text-cream/40 text-sm mt-6">Loading ideas…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {ideas.map((idea, index) => (
                <div key={index} className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {index % 2 === 0 ? <Wand2 size={16} className="text-lime" /> : <Sparkles size={16} className="text-ember" />}
                    <p className="text-sm font-medium text-cream">{idea.title}</p>
                  </div>
                  <div className="space-y-3 text-sm text-cream/70">
                    <p><span className="text-white">Hook:</span> {idea.hook}</p>
                    <p><span className="text-white">Angle:</span> {idea.angle}</p>
                    <p><span className="text-white">Format:</span> {idea.format}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-5 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={16} className="text-teal" />
                <p className="text-sm font-medium text-cream">AI production workflow</p>
              </div>
              <div className="space-y-2 text-sm text-cream/70">
                <p>• Start with one strong niche angle and repeat it with slight variations.</p>
                <p>• Use a bold hook in the first 1–2 seconds.</p>
                <p>• Match each clip to the right posting window and keep the thumbnail compelling.</p>
                <p>• Review your queue and approve the best versions, then let the scheduler publish them.</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-5 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarClock size={16} className="text-lime" />
                <p className="text-sm font-medium text-cream">Publishing rhythm</p>
              </div>
              <p className="text-sm text-cream/70">
                Keep your posting plan consistent and avoid overloading a single day. The AI scheduler works best when it has enough examples to learn from without over-posting.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
