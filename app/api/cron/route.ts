import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Account from "@/models/Account";
import Post from "@/models/Post";
import ScheduleState from "@/models/ScheduleState";
import { syncAccountDrive } from "@/lib/drivePipeline";
import {
  updateTimeSlotAggregates,
  checkForStableBase,
  forceLockBestSlots,
  lockSlots,
  checkForRelearnTrigger,
  startExplorationCycle,
} from "@/lib/scheduleEngine";
import { seedDefaultSlots } from "@/lib/seedSlots";
import { downloadDriveFile, createDriveChangesWatch, getDriveStartPageToken } from "@/lib/drive";
import { uploadToYouTube } from "@/lib/youtube";
import { syncYoutubeStats } from "@/lib/youtubeStats";
import { notifyWebhook } from "@/lib/notify";

// Vercel Hobby cron hits this once a day (see vercel.json). This is the
// entire self-learning loop in one pass, per account:
//   1. Catch up on any Drive files the webhook missed (belt-and-suspenders)
//   2. Recompute each time slot's real performance (updateTimeSlotAggregates)
//   3. If still exploring: check for an early stable base, or force-lock at 30 days
//   4. If locked: check whether performance has dropped enough to restart learning
//   5. Publish any queued posts whose scheduled time has passed
//   6. Renew the Drive watch subscription before it expires
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const accounts = await Account.find({ googleTokens: { $exists: true } });
  const results: Record<string, unknown>[] = [];

  for (const account of accounts) {
    const accountId = account._id.toString();
    const summary: Record<string, unknown> = { accountId };

    try {
      await seedDefaultSlots(accountId);

      if (account.driveFolderId) {
        summary.drive = await syncAccountDrive(account);
      }

      summary.statsSync = await syncYoutubeStats(account);
      await updateTimeSlotAggregates(accountId);

      const state = await ScheduleState.findOne({ accountId });

      if (!state || state.mode === "exploring") {
        const early = await checkForStableBase(accountId);
        if (early) {
          await lockSlots(accountId, early);
          summary.schedule = "locked early - stable base found";
        } else if (state?.cycleEndDate && new Date() > new Date(state.cycleEndDate)) {
          const forced = await forceLockBestSlots(accountId);
          await lockSlots(accountId, forced);
          summary.schedule = "locked at 30-day mark";
        } else {
          summary.schedule = "still exploring";
        }
      } else if (state.mode === "locked") {
        const trigger = await checkForRelearnTrigger(accountId);
        if (trigger) {
          await startExplorationCycle(accountId, trigger.reason);
          summary.schedule = `relearning triggered: ${trigger.reason}`;
        } else {
          summary.schedule = "locked - performing normally";
        }
      }

      const due = await Post.find({
        accountId,
        status: "queued",
        scheduledFor: { $lte: new Date() },
      }).limit(10);

      let published = 0;
      for (const post of due) {
        try {
          const tempFilePath = await downloadDriveFile(account.googleTokens as Record<string, unknown>, post.driveFileId);
          const result = await uploadToYouTube({
            googleTokens: account.googleTokens as Record<string, unknown>,
            videoFilePath: tempFilePath,
            title: post.titleVariants?.[0] || post.captionVariants?.youtube || post.caption || "New video",
            description: post.caption || "",
            tags: post.tags?.length ? post.tags : post.hashtags || [],
          });
          post.status = "posted";
          post.postedAt = new Date();
          post.platformPostId = result.videoId;
          await post.save();
          published++;
          await notifyWebhook(account.notifyWebhookUrl, `✅ Published: ${post.caption?.slice(0, 80) || post.driveFileName}\n${result.url}`);
        } catch (err) {
          post.status = "failed";
          post.publishError = String(err);
          await post.save();
          await notifyWebhook(account.notifyWebhookUrl, `❌ Failed to publish: ${post.driveFileName || post._id}\n${String(err).slice(0, 200)}`);
        }
      }
      summary.published = published;

      if (
        account.driveChannelExpiration &&
        new Date(account.driveChannelExpiration).getTime() - Date.now() < 24 * 60 * 60 * 1000
      ) {
        try {
          const pageToken = await getDriveStartPageToken(account.googleTokens as Record<string, unknown>);
          const watch = await createDriveChangesWatch(
            account.googleTokens as Record<string, unknown>,
            `${req.nextUrl.origin}/api/drive/webhook`,
            accountId
          );
          account.drivePageToken = pageToken;
          account.driveChannelId = watch.channelId;
          account.driveChannelResourceId = watch.resourceId;
          account.driveChannelExpiration = watch.expiration;
          await account.save();
          summary.watchRenewed = true;
        } catch (err) {
          summary.watchRenewalFailed = String(err);
        }
      }
    } catch (error) {
      summary.error = String(error);
    }

    results.push(summary);
  }

  return NextResponse.json({ ok: true, ran: new Date().toISOString(), accounts: results });
}
