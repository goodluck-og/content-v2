import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { getCurrentAccount } from "@/lib/sessionAccount";
import ScheduleState from "@/models/ScheduleState";
import TimeSlot from "@/models/TimeSlot";

export async function GET() {
  await connectDB();
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const state = await ScheduleState.findOne({ accountId: account._id }).lean();
  if (!state) return NextResponse.json({ mode: "not_started" });

  const now = Date.now();
  const start = state.cycleStartDate ? new Date(state.cycleStartDate).getTime() : now;
  const end = state.cycleEndDate ? new Date(state.cycleEndDate).getTime() : now;
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.min(totalDays, Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24))));

  const lockedSlots = state.lockedSlotIds?.length
    ? await TimeSlot.find({ _id: { $in: state.lockedSlotIds } }).lean()
    : [];

  return NextResponse.json({
    mode: state.mode,
    daysElapsed,
    totalDays,
    lockedSlots: lockedSlots.map((s) => ({ hour: s.hour, minute: s.minute, avgEngagementScore: s.avgEngagementScore })),
    lastRelearnTriggerReason: state.lastRelearnTriggerReason,
  });
}
