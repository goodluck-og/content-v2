import Post from "@/models/Post";

/**
 * Flags your own videos performing 2x+ above your own average - a
 * genuinely useful signal ("what made THIS one work") without claiming
 * to know anything about competitors or the platform's internals.
 */
export async function findOutliers(accountId: unknown) {
  const posts = await Post.find({ accountId, status: "posted" })
    .select("caption detectedCharacter engagementScore views24h postedAt")
    .sort({ postedAt: -1 })
    .limit(100)
    .lean();

  if (posts.length < 3) return { outliers: [], avgScore: 0 };

  const avgScore = posts.reduce((sum, p) => sum + (p.engagementScore || 0), 0) / posts.length;
  const outliers = posts.filter((p) => (p.engagementScore || 0) >= avgScore * 2);

  return { outliers, avgScore: Number(avgScore.toFixed(4)) };
}

/**
 * Your own catalogue of characters/sources you've covered, with counts -
 * the "series index" - plus a simple content-gap flag for characters
 * mentioned once and never revisited (which may or may not be intentional,
 * shown as information, not a directive).
 */
export async function getSeriesIndex(accountId: unknown) {
  const posts = await Post.find({ accountId })
    .select("detectedCharacter detectedSource")
    .lean();

  const counts = new Map<string, { source: string; count: number }>();
  for (const p of posts) {
    if (!p.detectedCharacter) continue;
    const key = p.detectedCharacter;
    const existing = counts.get(key);
    if (existing) existing.count++;
    else counts.set(key, { source: p.detectedSource || "", count: 1 });
  }

  const index = Array.from(counts.entries())
    .map(([character, v]) => ({ character, source: v.source, count: v.count }))
    .sort((a, b) => b.count - a.count);

  const onlyPostedOnce = index.filter((i) => i.count === 1);

  return { index, onlyPostedOnce };
}
