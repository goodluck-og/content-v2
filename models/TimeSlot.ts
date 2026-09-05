import { Schema, models, model } from "mongoose";

const TimeSlotSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true, index: true },
    hour: { type: Number, required: true },
    minute: { type: Number, required: true },
    status: { type: String, enum: ["candidate", "locked", "retired"], default: "candidate" },

    // Rolling performance aggregates - computed by
    // lib/scheduleEngine.ts's updateTimeSlotAggregates(), which the cron
    // job must call for the learning engine to actually learn anything.
    avgEngagementScore: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.TimeSlot || model("TimeSlot", TimeSlotSchema);
