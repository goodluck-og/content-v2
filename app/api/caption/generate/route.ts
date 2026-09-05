import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { getCurrentAccount } from "@/lib/sessionAccount";
import { generateCaption } from "@/lib/gemini";
import { fingerprintFrame, findPossibleDuplicate, findSimilarCaption } from "@/lib/duplicateDetection";
import { checkRepostRisk } from "@/lib/repostRisk";
import Account from "@/models/Account";
import Post from "@/models/Post";

// Manual test path: upload a frame directly (no Drive file needed yet).
// Useful for confirming the AI pipeline works before full Drive automation
// is proven end-to-end. Once the webhook/cron pipeline is trusted, this
// becomes mostly a debugging tool.
export async function POST(req: NextRequest) {
  await connectDB();
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { frameBase64, driveFileId, driveFileName } = await req.json();
  if (!frameBase64) {
    return NextResponse.json({ error: "frameBase64 is required" }, { status: 400 });
  }

  const contentHash = fingerprintFrame(frameBase64);
  const duplicate = await findPossibleDuplicate(account._id.toString(), contentHash);
  const result = await generateCaption({ frameBase64, niche: account.niche || "", styleNotes: account.styleNotes });

  const repostRisk = checkRepostRisk({
    driveFileName,
    isDuplicateOfExisting: Boolean(duplicate),
  });
  if (result.watermarkDetected && repostRisk.level === "none") {
    repostRisk.level = "warning";
    repostRisk.reasons.push(result.watermarkNote || "AI detected a possible watermark in the frame.");
  }

  // Second, independent duplicate signal: caption text similarity, catches
  // cases the frame hash alone would miss.
  const similarCaptionMatch = await findSimilarCaption(
    account._id.toString(),
    result.captionVariants?.tiktok || ""
  );
  if (similarCaptionMatch && repostRisk.level !== "high") {
    repostRisk.level = repostRisk.level === "warning" ? "high" : "warning";
    repostRisk.reasons.push("Caption text closely matches a recently posted clip - check it's not accidentally a repeat.");
  }

  let finalCaption = result.captionVariants?.tiktok || result.captionVariants?.youtube || "";
  let partNumber: number | undefined;
  let seriesLabel: string | undefined;

  if (account.useSeriesNumbering) {
    const updated = await Account.findByIdAndUpdate(
      account._id,
      { $inc: { postNumberCounter: 1 } },
      { new: true }
    );
    partNumber = updated?.postNumberCounter || 1;
    seriesLabel = updated?.seriesLabel || "Post";
    finalCaption = `${seriesLabel} ${partNumber}: ${finalCaption}`;
  }

  const post = await Post.create({
    accountId: account._id,
    driveFileId: driveFileId || `manual-test-${Date.now()}`,
    driveFileName: driveFileName || "Manual test upload",
    platform: "youtube",
    caption: finalCaption,
    captionVariants: result.captionVariants,
    hashtags: result.hashtags,
    titleVariants: result.titleVariants,
    tags: result.tags,
    detectedCharacter: result.character,
    detectedSource: result.source,
    coverFrameUrl: `data:image/jpeg;base64,${frameBase64}`,
    contentHash,
    possibleDuplicateOf: duplicate?._id,
    repostRiskLevel: repostRisk.level,
    repostRiskReasons: repostRisk.reasons,
    watermarkDetected: Boolean(result.watermarkDetected),
    partNumber,
    seriesLabel,
    status: "pending_review",
  });

  return NextResponse.json({
    post,
    duplicateWarning: duplicate
      ? `This looks similar to a clip posted on ${duplicate.postedAt || duplicate.createdAt}.`
      : null,
  });
}
