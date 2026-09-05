import Account from "@/models/Account";
import Post from "@/models/Post";
import { fetchDriveThumbnail, listNewDriveVideos } from "@/lib/drive";
import { generateCaption } from "@/lib/gemini";
import { fingerprintFrame, findPossibleDuplicate } from "@/lib/duplicateDetection";
import { checkRepostRisk } from "@/lib/repostRisk";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AccountDoc = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DriveFile = any;

export async function processDriveVideo(account: AccountDoc, file: DriveFile) {
  if (!file?.id || !file.mimeType?.startsWith("video/")) return null;
  if (account.driveFolderId && !(file.parents || []).includes(account.driveFolderId)) return null;

  const existing = await Post.findOne({ accountId: account._id.toString(), driveFileId: file.id });
  if (existing) return existing;
  if (!account.googleTokens) throw new Error("Google account is not connected");
  if (!file.thumbnailLink) throw new Error("Drive has not generated a thumbnail for this video yet");

  const thumbnail = await fetchDriveThumbnail(account.googleTokens, file.thumbnailLink);
  const contentHash = fingerprintFrame(thumbnail.base64);
  const duplicate = await findPossibleDuplicate(account._id.toString(), contentHash);
  const result = await generateCaption({ frameBase64: thumbnail.base64, niche: account.niche || "short-form content" });
  const risk = checkRepostRisk({ driveFileName: file.name, isDuplicateOfExisting: Boolean(duplicate) });
  if (result.watermarkDetected && risk.level === "none") {
    risk.level = "warning";
    risk.reasons.push(result.watermarkNote || "AI detected a possible watermark or username.");
  }

  let finalCaption = result.captionVariants.tiktok || result.captionVariants.youtube || "New short-form video";
  let partNumber: number | undefined;
  let seriesLabel: string | undefined;
  if (account.useSeriesNumbering) {
    const updated = await Account.findByIdAndUpdate(account._id, { $inc: { postNumberCounter: 1 } }, { new: true }).lean();
    partNumber = updated?.postNumberCounter || 1;
    seriesLabel = updated?.seriesLabel || "Post";
    finalCaption = `${seriesLabel} ${partNumber}: ${finalCaption}`;
  }

  return Post.create({
    accountId: account._id.toString(),
    driveFileId: file.id,
    driveFileName: file.name,
    platform: "youtube",
    caption: finalCaption,
    captionVariants: result.captionVariants,
    hashtags: result.hashtags,
    detectedCharacter: result.character,
    detectedSource: result.source,
    coverFrameUrl: `/api/drive/thumbnail?accountId=${account._id}&fileId=${file.id}`,
    contentHash,
    possibleDuplicateOf: duplicate?._id,
    repostRiskLevel: risk.level,
    repostRiskReasons: risk.reasons,
    watermarkDetected: Boolean(result.watermarkDetected),
    partNumber,
    seriesLabel,
    status: "pending_review",
  });
}

export async function syncAccountDrive(account: AccountDoc) {
  if (!account.googleTokens || !account.driveFolderId) return { discovered: 0, created: 0 };
  const files = await listNewDriveVideos(account.googleTokens, account.driveFolderId);
  let created = 0;
  for (const file of files.slice(0, 20)) {
    const before = await Post.exists({ accountId: account._id.toString(), driveFileId: file.id });
    if (before) continue;
    try { await processDriveVideo(account, file); created++; } catch (error) { console.error("Drive processing failed", file.id, error); }
  }
  return { discovered: files.length, created };
}
