import { Schema, models, model } from "mongoose";

const ScheduleStateSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true, unique: true },
    mode: { type: String, enum: ["exploring", "locked"], default: "exploring" },
    cycleStartDate: { type: Date },
    cycleEndDate: { type: Date },
    postsPerDay: { type: Number, default: 3 },

    // Needed by lib/scheduleEngine.ts's lockSlots/checkForRelearnTrigger -
    // without these, the engine can't remember which slots it locked in
    // or explain why it restarted learning.
    lockedSlotIds: [{ type: Schema.Types.ObjectId, ref: "TimeSlot" }],
    lastRelearnTriggerReason: { type: String },
  },
  { timestamps: true }
);

export default models.ScheduleState || model("ScheduleState", ScheduleStateSchema);
