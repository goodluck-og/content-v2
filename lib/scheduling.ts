import Account from "@/models/Account";
import Post from "@/models/Post";
import TimeSlot from "@/models/TimeSlot";

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute") };
}

function zonedDate(year: number, month: number, day: number, hour: number, minute: number, timeZone: string) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const p = localParts(guess, timeZone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const targetUTC = Date.UTC(year, month - 1, day, hour, minute);
  return new Date(guess.getTime() + (targetUTC - asUTC));
}

export async function scheduleNextPost(accountId: string, postId: string) {
  const account = await Account.findById(accountId).lean();
  if (!account) throw new Error("Account not found");

  const statefulSlots = await TimeSlot.find({
    accountId,
    status: { $in: ["locked", "candidate"] },
  }).sort({ hour: 1, minute: 1 }).lean();

  if (!statefulSlots.length) throw new Error("No posting time slots are configured");

  const slots = statefulSlots.filter((s) => s.status === "locked").length
    ? statefulSlots.filter((s) => s.status === "locked")
    : statefulSlots;

  const now = new Date();
  const tz = account.timezone || "Africa/Lagos";
  const cap = Math.max(1, Math.min(12, account.postsPerDayCap || 3));

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const probe = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const day = localParts(probe, tz);
    const candidates = slots
      .map((slot) => ({ slot, date: zonedDate(day.year, day.month, day.day, slot.hour, slot.minute, tz) }))
      .filter(({ date }) => dayOffset > 0 || date.getTime() > now.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const candidate of candidates) {
      const start = new Date(candidate.date);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      const count = await Post.countDocuments({
        accountId,
        status: { $in: ["queued", "posted"] },
        scheduledFor: { $gte: start, $lt: end },
      });
      if (count < cap) {
        const post = await Post.findByIdAndUpdate(
          postId,
          { slotId: candidate.slot._id, scheduledFor: candidate.date, status: "queued", approved: true, doNotPost: false, publishError: null },
          { new: true }
        );
        if (!post) throw new Error("Post not found");
        return post;
      }
    }
  }

  throw new Error("No open posting slot found in the next 14 days");
}
