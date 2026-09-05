"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Construction } from "lucide-react";

function SoonContent() {
  const params = useSearchParams();
  const feature = params.get("feature") || "This section";

  return (
    <div className="text-center max-w-sm">
      <Construction size={32} className="mx-auto text-cream/30 mb-4" />
      <h1 className="text-cream text-lg font-semibold mb-2">{feature} isn&apos;t built yet</h1>
      <p className="text-cream/50 text-sm">
        This is on the roadmap but not wired up yet. Dashboard, Review Queue,
        Automation, Analytics, and Settings are the parts that actually work
        right now.
      </p>
    </div>
  );
}

export default function SoonPage() {
  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center px-8">
        <Suspense fallback={<p className="text-cream/40 text-sm">Loading…</p>}>
          <SoonContent />
        </Suspense>
      </main>
    </div>
  );
}
