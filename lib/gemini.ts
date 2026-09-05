import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getModel() {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName });
}

export async function generateCaption({
  frameBase64,
  niche,
  styleNotes,
}: {
  frameBase64: string;
  niche: string;
  styleNotes?: string;
}) {
  const styleInstruction = styleNotes
    ? `\nHouse style rules to always follow: ${styleNotes}`
    : "";

  const prompt = `You are the content intelligence engine for a ${niche || "short-form"} creator. Analyze this video frame. Identify visible character(s), franchise/source, and any watermark/logo/username. Then produce:
1. platform-specific captions (TikTok under 150 chars, YouTube SEO-friendly, Instagram concise/aesthetic)
2. 3 ranked YouTube title variants (best first), each under 100 characters, hook-driven
3. 8-12 relevant tags for YouTube's tag field (different from hashtags - single/short phrases, no # symbol)
${styleInstruction}
Return ONLY valid JSON: {character, source, captionVariants, hashtags, titleVariants, tags, watermarkDetected, watermarkNote}`;

  const result = await getModel().generateContent([
    { inlineData: { mimeType: "image/jpeg", data: frameBase64 } },
    { text: prompt },
  ]);
  const raw = result.response.text().replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(raw);
    return {
      character: String(parsed.character || ""),
      source: String(parsed.source || ""),
      captionVariants: {
        tiktok: String(parsed.captionVariants?.tiktok || parsed.caption || ""),
        youtube: String(parsed.captionVariants?.youtube || parsed.caption || ""),
        instagram: String(parsed.captionVariants?.instagram || parsed.caption || ""),
      },
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String).slice(0, 12) : [],
      titleVariants: Array.isArray(parsed.titleVariants) ? parsed.titleVariants.map(String).slice(0, 3) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 12) : [],
      watermarkDetected: Boolean(parsed.watermarkDetected),
      watermarkNote: String(parsed.watermarkNote || ""),
    };
  } catch {
    return {
      character: "", source: "", captionVariants: { tiktok: "", youtube: "", instagram: "" },
      hashtags: [], titleVariants: [], tags: [], watermarkDetected: false, watermarkNote: "",
    };
  }
}

/**
 * Translates an existing caption into another language - called on-demand
 * from the queue UI rather than automatically on every generation, to
 * avoid burning extra API calls when it's not needed.
 */
export async function translateCaption(caption: string, languageName: string) {
  const prompt = `Translate this short-form video caption into natural, casual ${languageName} suitable for TikTok/YouTube - not a literal translation, keep the tone and any emoji. Return ONLY the translated text, nothing else:\n\n${caption}`;
  return (await getModel().generateContent(prompt)).response.text().trim();
}

export async function generateText(prompt: string) {
  return (await getModel().generateContent(prompt)).response.text();
}
