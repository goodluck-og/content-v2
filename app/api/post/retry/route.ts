import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { getCurrentAccount } from "@/lib/sessionAccount";
import Post from "@/models/Post";
import { downloadDriveFile } from "@/lib/drive";
import { uploadToYouTube } from "@/lib/youtube";

// Manual retry for a failed post - shows the same publish logic the cron
// job uses, but triggered on demand from the Review Queue's failed list.
export async function POST(req: NextRequest) {
  await connectDB();
  const account = await getCurrentAccount();
  if (!account?.googleTokens) return NextResponse.json({ error: "Not signed in or Google not connected" }, { status: 401 });

  const { postId } = await req.json();
  const post = await Post.findOne({ _id: postId, accountId: account._id });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  try {
    const tempFilePath = await downloadDriveFile(account.googleTokens, post.driveFileId);
    const result = await uploadToYouTube({
      googleTokens: account.googleTokens,
      videoFilePath: tempFilePath,
      title: post.titleVariants?.[0] || post.captionVariants?.youtube || post.caption || "New video",
      description: post.caption || "",
      tags: post.tags?.length ? post.tags : post.hashtags || [],
    });
    post.status = "posted";
    post.postedAt = new Date();
    post.platformPostId = result.videoId;
    post.publishError = null;
    await post.save();
    return NextResponse.json({ ok: true, post });
  } catch (err) {
    post.publishError = String(err);
    await post.save();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
