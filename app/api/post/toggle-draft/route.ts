import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export async function POST(req: NextRequest) {
  await connectDB();
  const { postId, doNotPost } = await req.json();

  const post = await Post.findByIdAndUpdate(
    postId,
    { doNotPost, status: doNotPost ? "draft" : "pending_review" },
    { new: true }
  );

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ post });
}
