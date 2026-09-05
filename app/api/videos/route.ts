import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { getCurrentAccount } from "@/lib/sessionAccount";
import Post from "@/models/Post";

export async function GET(req: NextRequest) {
  await connectDB();
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const sortBy = req.nextUrl.searchParams.get("sortBy") || "newest";

  const query: Record<string, unknown> = { accountId: account._id };
  if (status) query.status = status;

  let sort: Record<string, 1 | -1> = { createdAt: -1 };
  if (sortBy === "views") sort = { views24h: -1 };
  if (sortBy === "engagement") sort = { engagementScore: -1 };

  const posts = await Post.find(query).sort(sort).limit(100).lean();
  return NextResponse.json({ posts });
}
