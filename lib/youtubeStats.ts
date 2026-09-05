import { google } from "googleapis";
import { getAuthenticatedClient } from "@/lib/googleAuth";
import { calculateEngagementScore } from "@/lib/scoring";
import Post from "@/models/Post";

/**
 * Pulls real view/like/comment counts for all recently-posted videos on
 * an account and updates their Post records + engagement scores.
 * videos.list with part=statistics works with the same OAuth token
 * already granted (youtube.upload includes read access to your own
 * video stats) - no extra scope needed.
 */
export async function syncYoutubeStats(account: {
  _id: unknown;
  googleTokens: Record<string, unknown>;
}) {
  const posts = await Post.find({
    accountId: account._id,
    status: "posted",
    platformPostId: { $exists: true, $ne: null },
  }).limit(50);

  if (posts.length === 0) return { updated: 0 };

  const authClient = getAuthenticatedClient(account.googleTokens);
  const youtube = google.youtube({ version: "v3", auth: authClient });

  const videoIds = posts.map((p) => p.platformPostId).filter(Boolean) as string[];
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) chunks.push(videoIds.slice(i, i + 50));

  const statsById = new Map<string, { views: number; likes: number; comments: number }>();

  for (const chunk of chunks) {
    const res = await youtube.videos.list({ part: ["statistics"], id: chunk });
    for (const item of res.data.items || []) {
      statsById.set(item.id as string, {
        views: Number(item.statistics?.viewCount || 0),
        likes: Number(item.statistics?.likeCount || 0),
        comments: Number(item.statistics?.commentCount || 0),
      });
    }
  }

  let updated = 0;
  for (const post of posts) {
    const stats = statsById.get(post.platformPostId as string);
    if (!stats) continue;

    const ageHours = post.postedAt ? (Date.now() - new Date(post.postedAt).getTime()) / 3600000 : 999;
    if (ageHours <= 24) post.views24h = stats.views;
    if (ageHours <= 168) post.views7d = stats.views;
    post.likes = stats.likes;
    post.comments = stats.comments;
    // YouTube's public API doesn't expose share count or watch-time
    // completion rate - those need the separate YouTube Analytics API
    // (OAuth + channel-owner report access), which is a bigger
    // integration than this pass covers. Scored on what's available.
    post.engagementScore = calculateEngagementScore({
      completionRate: post.completionRate || 0,
      shares: post.shares || 0,
      comments: post.comments,
      likes: post.likes,
      views24h: Math.max(post.views24h, 1),
    });
    await post.save();
    updated++;
  }

  return { updated };
}
