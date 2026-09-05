import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { scheduleNextPost } from "@/lib/scheduling";

export async function POST(req: NextRequest) {
  await connectDB();
  const { postId, editedCaption } = await req.json();
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });
  const post = await Post.findById(postId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.doNotPost) return NextResponse.json({ error: "Post is marked draft/do-not-post" }, { status: 400 });
  if (editedCaption) post.caption = editedCaption;
  await post.save();
  try {
    const scheduled = await scheduleNextPost(post.accountId, postId);
    return NextResponse.json({ post: scheduled });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 409 });
  }
}
