import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import Account from "@/models/Account";
import { uploadToYouTube } from "@/lib/youtube";
import { downloadDriveFile } from "@/lib/drive";

// Called by the cron/scheduler once a queued post's scheduledFor time
// has passed. Downloads the video from Drive to a temp file, uploads it
// to YouTube, then updates the Post with the result.
export async function POST(req: NextRequest) {
  await connectDB();
  const { postId } = await req.json();

  const post = await Post.findById(postId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const account = await Account.findById(post.accountId);
  if (!account?.googleTokens) {
    return NextResponse.json({ error: "Google account not connected for this account" }, { status: 400 });
  }

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
    await post.save();

    return NextResponse.json({ post, youtubeUrl: result.url });
  } catch (err) {
    post.status = "failed";
    await post.save();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
