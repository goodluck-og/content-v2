import crypto from "crypto";
import Post from "@/models/Post";

/**
 * Simple content fingerprint from the extracted frame, used to catch
 * accidental re-uploads of the same clip. Not a true perceptual hash
 * (that would need a library like `sharp` + pHash), but catches exact
 * or near-exact re-uploads cheaply. Upgrade path noted below.
 */
export function fingerprintFrame(frameBase64: string) {
  return crypto.createHash("sha256").update(frameBase64).digest("hex");
}

/**
 * Checks recent posts for the same account for a matching fingerprint.
 * Returns the matching Post if found, else null.
 *
 * TODO upgrade: swap sha256 exact-match for a perceptual hash (pHash/dHash)
 * so near-duplicate frames (slightly re-cropped/re-encoded clips) are also
 * caught, not just byte-identical ones.
 */
export async function findPossibleDuplicate(accountId: string, contentHash: string) {
  const match = await Post.findOne({ accountId, contentHash }).sort({ createdAt: -1 });
  return match;
}

/**
 * Jaccard similarity on word sets - catches cases where the same clip
 * was captioned differently (so the frame hash still matches) OR where
 * a near-identical caption gets generated for a visually different clip
 * of the same recycled scene. Cheap, no external calls.
 */
export function captionSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = Array.from(wordsA).filter((w) => wordsB.has(w)).length;
  const union = new Set([...Array.from(wordsA), ...Array.from(wordsB)]).size;
  return intersection / union;
}

/**
 * Checks recent posts (last 20) for caption similarity above threshold,
 * as a second, independent signal alongside the frame-hash check.
 */
export async function findSimilarCaption(accountId: string, caption: string, threshold = 0.6) {
  if (!caption) return null;
  const recent = await Post.find({ accountId }).sort({ createdAt: -1 }).limit(20).select("caption createdAt").lean();
  for (const post of recent) {
    if (post.caption && captionSimilarity(caption, post.caption) >= threshold) {
      return post;
    }
  }
  return null;
}
