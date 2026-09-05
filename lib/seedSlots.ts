import TimeSlot from "@/models/TimeSlot";
import ScheduleState from "@/models/ScheduleState";

const DEFAULT_CANDIDATE_SLOTS = [
  { hour: 12, minute: 0 }, { hour: 15, minute: 30 }, { hour: 18, minute: 0 },
  { hour: 19, minute: 30 }, { hour: 21, minute: 0 }, { hour: 22, minute: 30 },
];

export async function seedDefaultSlots(accountId: string) {
  const existing = await TimeSlot.countDocuments({ accountId });
  if (existing === 0) await TimeSlot.insertMany(DEFAULT_CANDIDATE_SLOTS.map(s => ({ ...s, accountId, status: "candidate" })));
  await ScheduleState.findOneAndUpdate({ accountId }, { $setOnInsert: { accountId, mode: "exploring", cycleStartDate: new Date(), cycleEndDate: new Date(Date.now() + 30*24*60*60*1000), postsPerDay: 3 } }, { upsert: true });
}
