// Real causes of TikTok/YouTube suppressing reach, and what we can actually
// check for automatically before a clip gets posted. This does NOT try to
// trick platform detection - it just avoids the common mistakes that
// genuinely cause suppression (see README for the full explanation).

export type RepostRiskFlag = {
  level: "none" | "warning" | "high";
  reasons: string[];
};

/**
 * Basic heuristic checks on file metadata. Full watermark pixel-detection
 * would need a vision model pass on a frame (can wire into the Gemini call
 * that already runs for captions - add a "does this frame contain a visible
 * watermark/logo" question to that same prompt to avoid an extra API call).
 */
export function checkRepostRisk({
  driveFileName,
  isDuplicateOfExisting,
}: {
  driveFileName?: string;
  isDuplicateOfExisting: boolean;
}): RepostRiskFlag {
  const reasons: string[] = [];

  const filenameSignals = ["capcut", "tiktok_", "download", "ssstik", "snaptik"];
  const nameLower = (driveFileName || "").toLowerCase();
  const matchedSignal = filenameSignals.find((s) => nameLower.includes(s));

  if (matchedSignal) {
    reasons.push(
      `Filename contains "${matchedSignal}" - suggests this was exported from another app or downloaded/re-shared, which often carries a watermark.`
    );
  }

  if (isDuplicateOfExisting) {
    reasons.push("This clip's frame matches a previously posted video - reposting can suppress reach.");
  }

  if (reasons.length === 0) return { level: "none", reasons: [] };
  if (reasons.length === 1) return { level: "warning", reasons };
  return { level: "high", reasons };
}
