import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { getCurrentAccount } from "@/lib/sessionAccount";
import Post from "@/models/Post";

function csvEscape(val: unknown) {
  const s = String(val ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  await connectDB();
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const posts = await Post.find({ accountId: account._id }).sort({ createdAt: -1 }).limit(500).lean();

  const headers = [
    "driveFileName", "status", "caption", "detectedCharacter", "detectedSource",
    "postedAt", "views24h", "views7d", "likes", "comments", "engagementScore",
  ];
  const rows = posts.map((p) =>
    headers.map((h) => csvEscape((p as Record<string, unknown>)[h])).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="content-autopilot-report.csv"`,
    },
  });
}
