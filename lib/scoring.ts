// Weighted engagement score. Shares + completion rate matter more than raw likes
// because they correlate more strongly with algorithmic push.
export function calculateEngagementScore(post: {
  completionRate: number; // 0-1
  shares: number;
  comments: number;
  likes: number;
  views24h: number;
}) {
  const views = Math.max(post.views24h, 1);
  const normalizedShares = post.shares / views;
  const normalizedComments = post.comments / views;
  const normalizedLikes = post.likes / views;

  const score =
    post.completionRate * 0.4 +
    normalizedShares * 0.3 +
    normalizedComments * 0.2 +
    normalizedLikes * 0.1;

  return Number(score.toFixed(4));
}
