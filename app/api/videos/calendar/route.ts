import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { getCurrentAccount } from "@/lib/sessionAccount";
import Post from "@/models/Post";

export async function GET() {
  await connectDB();
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const posts = await Post.find({
    accountId: account._id,
    $or: [{ scheduledFor: { $exists: true } }, { postedAt: { $exists: true } }],
  })
    .select("driveFileName caption status scheduledFor postedAt")
    .lean();

  const byDate: Record<string, typeof posts> = {};
  for (const p of posts) {
    const date = p.postedAt || p.scheduledFor;
    if (!date) continue;
    const key = new Date(date).toISOString().slice(0, 10);
    byDate[key] = byDate[key] || [];
    byDate[key].push(p);
  }

  return NextResponse.json({ byDate });
}
