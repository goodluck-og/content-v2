import mongoose from "mongoose";
import TimeSlot from "@/models/TimeSlot";
import ScheduleState from "@/models/ScheduleState";
import Post from "@/models/Post";

const MIN_POSTS_FOR_CONFIDENCE = 5; // min posts in a slot before trusting it
const STABLE_MARGIN = 0.15; // top slots must beat others by 15%+ avg score
const RELEARN_DROP_THRESHOLD = 0.25; // 25% drop vs rolling avg triggers relearn
const RELEARN_MIN_POSTS = 5;
const CYCLE_DAYS = 30;
const SLOTS_TO_LOCK = 3;

/**
 * Checks whether a clear winning set of time slots has emerged early,
 * before the full 30-day exploration window ends.
 * Returns the slot ids to lock if a stable base is found, else null.
 */
export async function checkForStableBase(accountId: string) {
  const slots = await TimeSlot.find({ accountId, status: "candidate" }).lean();

  const confidentSlots = slots.filter((s) => s.postCount >= MIN_POSTS_FOR_CONFIDENCE);
  if (confidentSlots.length < SLOTS_TO_LOCK) return null;

  const sorted = [...confidentSlots].sort((a, b) => b.avgEngagementScore - a.avgEngagementScore);
  const top = sorted.slice(0, SLOTS_TO_LOCK);
  const rest = sorted.slice(SLOTS_TO_LOCK);

  if (rest.length === 0) return top.map((s) => s._id);

  const topMinScore = Math.min(...top.map((s) => s.avgEngagementScore));
  const bestOfRest = Math.max(...rest.map((s) => s.avgEngagementScore));

  // top slots must clearly beat the rest by the margin, and have low variance
  const marginMet = topMinScore > bestOfRest * (1 + STABLE_MARGIN);
  const lowVariance = top.every((s) => s.variance < topMinScore * 0.3);

  if (marginMet && lowVariance) {
    return top.map((s) => s._id);
  }

  return null;
}

/**
 * Runs at the end of the 30-day window if no early stable base was found.
 * Just picks the top 3 performing slots regardless of margin.
 */
export async function forceLockBestSlots(accountId: string) {
  const slots = await TimeSlot.find({ accountId, status: "candidate" })
    .sort({ avgEngagementScore: -1 })
    .limit(SLOTS_TO_LOCK)
    .lean();
  return slots.map((s) => s._id);
}

/**
 * Lock in a set of slots and update ScheduleState + retire the rest.
 */
export async function lockSlots(accountId: string, slotIds: mongoose.Types.ObjectId[]) {
  await TimeSlot.updateMany(
    { accountId, _id: { $in: slotIds } },
    { $set: { status: "locked" } }
  );
  await TimeSlot.updateMany(
    { accountId, _id: { $nin: slotIds }, status: "candidate" },
    { $set: { status: "retired" } }
  );
  await ScheduleState.findOneAndUpdate(
    { accountId },
    { mode: "locked", lockedSlotIds: slotIds },
    { upsert: true }
  );
}

/**
 * Checks locked slots against their own rolling average to see if
 * performance has meaningfully dropped, and should trigger a relearn cycle.
 */
export async function checkForRelearnTrigger(accountId: string) {
  const state = await ScheduleState.findOne({ accountId });
  if (!state || state.mode !== "locked") return null;

  for (const slotId of state.lockedSlotIds) {
    const slot = await TimeSlot.findById(slotId).lean();
    if (!slot) continue;

    const recentPosts = await Post.find({ accountId, slotId, status: "posted" })
      .sort({ postedAt: -1 })
      .limit(RELEARN_MIN_POSTS)
      .lean();

    if (recentPosts.length < RELEARN_MIN_POSTS) continue;

    const recentAvg =
      recentPosts.reduce((sum, p) => sum + (p.engagementScore || 0), 0) / recentPosts.length;

    const historicalAvg = slot.avgEngagementScore;

    if (historicalAvg > 0 && recentAvg < historicalAvg * (1 - RELEARN_DROP_THRESHOLD)) {
      return {
        reason: `Slot ${slot.hour}:${slot.minute} dropped ${Math.round(
          (1 - recentAvg / historicalAvg) * 100
        )}% below its rolling average over last ${RELEARN_MIN_POSTS} posts.`,
        slotId,
      };
    }
  }

  return null;
}

/**
 * Starts a fresh 30-day exploration cycle (initial or re-learn).
 */
export async function startExplorationCycle(accountId: string, reason?: string) {
  const start = new Date();
  const end = new Date(start.getTime() + CYCLE_DAYS * 24 * 60 * 60 * 1000);

  await TimeSlot.updateMany(
    { accountId, status: "locked" },
    { $set: { status: "candidate" } }
  );

  await ScheduleState.findOneAndUpdate(
    { accountId },
    {
      mode: "exploring",
      cycleStartDate: start,
      cycleEndDate: end,
      lockedSlotIds: [],
      lastRelearnTriggerReason: reason || null,
    },
    { upsert: true }
  );
}


export async function updateTimeSlotAggregates(accountId: string) {
  const slots = await TimeSlot.find({ accountId });
  for (const slot of slots) {
    const posts = await Post.find({ accountId, slotId: slot._id, status: "posted" }).select("engagementScore").lean();
    if (!posts.length) continue;
    const values = posts.map(p => p.engagementScore || 0);
    const avg = values.reduce((a,b)=>a+b,0) / values.length;
    const variance = values.reduce((a,b)=>a + Math.pow(b-avg,2),0) / values.length;
    slot.avgEngagementScore = Number(avg.toFixed(4));
    slot.variance = Number(variance.toFixed(4));
    slot.postCount = values.length;
    await slot.save();
  }
}
