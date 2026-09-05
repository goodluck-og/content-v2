import { Schema, models, model } from "mongoose";

const PostSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true, index: true },
    driveFileId: { type: String },
    driveFileName: { type: String },
    platform: { type: String, default: "youtube" },

    caption: { type: String },
    captionVariants: {
      youtube: { type: String },
      tiktok: { type: String },
      instagram: { type: String },
    },
    hashtags: [{ type: String }],
    titleVariants: [{ type: String }],
    tags: [{ type: String }],
    translations: { type: Schema.Types.Mixed }, // { "es": "...", "pt": "..." } - generated on demand
    detectedCharacter: { type: String },
    detectedSource: { type: String },

    // AI/duplicate/repost-risk detection - the real anti-suppression checks
    contentHash: { type: String, index: true },
    possibleDuplicateOf: { type: Schema.Types.ObjectId, ref: "Post" },
    repostRiskLevel: { type: String, enum: ["none", "warning", "high"], default: "none" },
    repostRiskReasons: [{ type: String }],
    watermarkDetected: { type: Boolean, default: false },

    // series/part numbering
    partNumber: { type: Number },
    seriesLabel: { type: String },

    // thumbnail
    coverFrameUrl: { type: String },
    customThumbnailUrl: { type: String },

    status: {
      type: String,
      enum: ["draft", "pending_review", "queued", "posted", "failed"],
      default: "pending_review",
      index: true,
    },
    approved: { type: Boolean, default: false },
    doNotPost: { type: Boolean, default: false },
    publishError: { type: String, default: null },

    slotId: { type: Schema.Types.ObjectId, ref: "TimeSlot" },
    scheduledFor: { type: Date, index: true },
    postedAt: { type: Date },
    platformPostId: { type: String },

    // Performance metrics - field names matched to lib/scoring.ts exactly
    views24h: { type: Number, default: 0 },
    views7d: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Post || model("Post", PostSchema);
