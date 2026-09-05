import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { scheduleNextPost } from "@/lib/scheduling";

export async function POST(req: NextRequest) {
  await connectDB();
  const { postIds } = await req.json();
  if (!Array.isArray(postIds) || postIds.length === 0) return NextResponse.json({ error: "postIds array required" }, { status: 400 });
  const updated = [];
  for (const id of postIds.slice(0, 20)) {
    const post = await Post.findById(id);
    if (!post || post.doNotPost) continue;
    try { updated.push(await scheduleNextPost(post.accountId, post._id.toString())); } catch (error) { console.error("Scheduling failed", id, error); }
  }
  return NextResponse.json({ updated: updated.length, posts: updated });
}
