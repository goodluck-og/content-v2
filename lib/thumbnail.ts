// HONEST NOTE: Gemini's free tier reads images, it doesn't generate them.
// True AI-generated thumbnails (a brand new image, not from the video)
// need a paid image model - Google's Imagen via Vertex AI, or DALL-E,
// or the Canva API (you already have a Canva connector available, which
// could be wired in later as a no-extra-cost path since it's part of
// your existing Canva account rather than a new paid API).
//
// What this DOES do right now, for free: picks which extracted frame from
// the video looks like the strongest thumbnail candidate (highest visual
// contrast / most centered subject), instead of just using frame #1.
// This is "smart selection," not "generation" - the toggle in settings
// is named autoSelectThumbnail for that reason, not autoGenerateThumbnail.

export function scoreFrameCandidate(frame: {
  brightness: number; // 0-255 avg
  hasFace: boolean; // if a face-detection pass was run
}) {
  // Simple heuristic: mid-brightness frames with a detected subject
  // read better as thumbnails than very dark/blown-out ones.
  const brightnessScore = 1 - Math.abs(frame.brightness - 140) / 140;
  const subjectScore = frame.hasFace ? 0.3 : 0;
  return Number((brightnessScore * 0.7 + subjectScore).toFixed(3));
}

/**
 * Given several candidate frames (base64), returns the index of the
 * best-scoring one. Actual brightness/face detection would run via a
 * lightweight image library (e.g. sharp) in the frame-extraction worker -
 * not built yet, this is the scoring function it will call into.
 */
export function pickBestFrame(
  candidates: { brightness: number; hasFace: boolean }[]
): number {
  if (candidates.length === 0) return -1;
  let bestIndex = 0;
  let bestScore = -Infinity;
  candidates.forEach((c, i) => {
    const score = scoreFrameCandidate(c);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });
  return bestIndex;
}
