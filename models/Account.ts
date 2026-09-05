import { Schema, models, model } from "mongoose";

const AccountSchema = new Schema(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    email: { type: String },
    themeId: { type: String, default: "navy-tech" },

    // Google / Drive / YouTube
    googleTokens: { type: Schema.Types.Mixed },
    googleConnectedEmail: { type: String },
    youtubeChannelId: { type: String },
    driveFolderId: { type: String },
    drivePageToken: { type: String },
    driveChannelId: { type: String },
    driveChannelResourceId: { type: String },
    driveChannelExpiration: { type: String },

    // TikTok / Instagram (future - not wired to posting yet)
    tiktokTokens: { type: Schema.Types.Mixed },
    tiktokConnectedUsername: { type: String },
    instagramTokens: { type: Schema.Types.Mixed },
    instagramConnectedUsername: { type: String },

    // Scheduling preferences
    niche: { type: String },
    timezone: { type: String, default: "Africa/Lagos" },
    postsPerDayCap: { type: Number, default: 3 },

    // Post/series numbering ("Post 1:", "Part 1:", etc.) - toggleable
    useSeriesNumbering: { type: Boolean, default: false },
    seriesLabel: { type: String, default: "Post" },
    postNumberCounter: { type: Number, default: 0 },

    // Thumbnail selection (real frame picking, not AI generation - see lib/thumbnail.ts)
    autoSelectThumbnail: { type: Boolean, default: false },

    // House style notes injected into every AI caption prompt
    styleNotes: { type: String },

    // Discord/Slack webhook URL for publish/fail alerts
    notifyWebhookUrl: { type: String },
  },
  { timestamps: true }
);

export default models.Account || model("Account", AccountSchema);
