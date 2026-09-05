import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { getCurrentAccount } from "@/lib/sessionAccount";
import Post from "@/models/Post";
import ScheduleState from "@/models/ScheduleState";

export async function GET() {
  await connectDB();
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const accountId = account._id;

  const [total, published, scheduled, pending, viewsAgg, recentPosts, state] = await Promise.all([
    Post.countDocuments({ accountId }),
    Post.countDocuments({ accountId, status: "posted" }),
    Post.countDocuments({ accountId, status: "queued" }),
    Post.countDocuments({ accountId, status: "pending_review" }),
    Post.aggregate([
      { $match: { accountId } },
      { $group: { _id: null, totalViews: { $sum: "$views24h" } } },
    ]),
    Post.find({ accountId }).sort({ updatedAt: -1 }).limit(5).lean(),
    ScheduleState.findOne({ accountId }).lean(),
  ]);

  const totalViews = viewsAgg[0]?.totalViews || 0;

  const activity = recentPosts.map((p) => {
    let action = "AI analysis completed";
    if (p.status === "posted") action = "Video published successfully";
    else if (p.status === "queued") action = "Scheduled for posting";
    else if (p.status === "failed") action = "Publish failed";
    return {
      action,
      detail: p.driveFileName || p.caption?.slice(0, 40) || "Untitled",
      at: p.updatedAt,
    };
  });

  // Automation health - a plain composite of whether the pieces we can
  // actually verify are in a good state, not a fake percentage.
  let healthPoints = 0;
  const checks = [
    { label: "Drive connected", ok: Boolean(account.googleTokens && account.driveFolderId) },
    { label: "AI engine ready", ok: Boolean(process.env.GEMINI_API_KEY) },
    { label: "Scheduling active", ok: Boolean(state) },
    { label: "No recent publish failures", ok: !recentPosts.some((p) => p.status === "failed") },
  ];
  checks.forEach((c) => c.ok && healthPoints++);
  const healthPercent = Math.round((healthPoints / checks.length) * 100);

  // Onboarding checklist - same underlying signals as health, framed as
  // setup steps rather than ongoing health.
  const onboarding = [
    { label: "Connect Google", done: Boolean(account.googleTokens) },
    { label: "Set Drive folder", done: Boolean(account.driveFolderId) },
    { label: "Set your niche", done: Boolean(account.niche) },
    { label: "Approve your first clip", done: published > 0 || scheduled > 0 },
  ];

  // Approval streak - consecutive days with at least one post approved
  // (queued or posted), based on your own history only.
  const approvalDates = await Post.find({
    accountId,
    status: { $in: ["queued", "posted"] },
  })
    .select("createdAt")
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();

  const uniqueDays = Array.from(
    new Set(approvalDates.map((p) => new Date(p.createdAt).toISOString().slice(0, 10)))
  ).sort((a, b) => (a < b ? 1 : -1));

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (uniqueDays[i] === expected.toISOString().slice(0, 10)) streak++;
    else break;
  }

  return NextResponse.json({
    totalContent: total,
    published,
    scheduled,
    pending,
    totalViews,
    activity,
    health: { percent: healthPercent, checks },
    scheduleMode: state?.mode || "not_started",
    onboarding,
    approvalStreak: streak,
  });
}
