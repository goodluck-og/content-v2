"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Sparkles,
  BarChart3,
  Settings,
  Radio,
  Calendar,
  Users,
  Gauge,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, live: true },
  { label: "Review Queue", href: "/queue", icon: ListChecks, live: true },
  { label: "Automation", href: "/automation", icon: Radio, live: true },
  { label: "Analytics", href: "/analytics", icon: BarChart3, live: true },
  { label: "Performance", href: "/performance", icon: Gauge, live: true },
  { label: "Creator Studio", href: "/creator-studio", icon: Sparkles, live: true },
  { label: "Settings", href: "/settings", icon: Settings, live: true },
  { label: "Calendar", href: "/calendar", icon: Calendar, live: true },
  { label: "Accounts", href: "/soon?feature=Accounts", icon: Users, live: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-teal/40 min-h-screen flex flex-col gap-1.5 px-5 py-6">
      <p className="text-white font-bold text-lg mb-4">Content Autopilot</p>
      {NAV_ITEMS.map(({ label, href, icon: Icon, live }) => {
        const active = href === "/" ? pathname === "/" : pathname?.startsWith(href.split("?")[0]);
        return (
          <Link
            key={label}
            href={href}
            className={`flex items-center justify-between text-left text-sm px-3 py-2.5 rounded-lg transition ${
              active ? "bg-lime text-white font-medium" : "text-cream/70 hover:bg-teal/60"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Icon size={16} />
              {label}
            </span>
            {!live && (
              <span className="text-[9px] uppercase tracking-wide bg-ink/40 text-cream/40 px-1.5 py-0.5 rounded">
                Soon
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}
