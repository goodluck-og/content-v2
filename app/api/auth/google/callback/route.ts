import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { exchangeCodeForTokens, getAuthenticatedClient, verifyOAuthState } from "@/lib/googleAuth";
import { createDriveChangesWatch, getDriveStartPageToken } from "@/lib/drive";
import { seedDefaultSlots } from "@/lib/seedSlots";
import Account from "@/models/Account";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  await connectDB();
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const accountId = state ? verifyOAuthState(state) : null;
  if (!code || !accountId) return NextResponse.json({ error: "Invalid OAuth state or missing code" }, { status: 400 });

  const account = await Account.findById(accountId);
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  const tokens = await exchangeCodeForTokens(code);
  const authClient = getAuthenticatedClient(tokens as Record<string, unknown>);
  const oauth2 = google.oauth2({ version: "v2", auth: authClient });
  const { data: userInfo } = await oauth2.userinfo.get();
  const youtube = google.youtube({ version: "v3", auth: authClient });
  const { data: channelData } = await youtube.channels.list({ part: ["id"], mine: true });
  account.googleTokens = tokens;
  account.googleConnectedEmail = userInfo.email || undefined;
  account.youtubeChannelId = channelData.items?.[0]?.id;

  if (account.driveFolderId) {
    try {
      const pageToken = await getDriveStartPageToken(account.googleTokens as Record<string, unknown>);
      const watch = await createDriveChangesWatch(account.googleTokens as Record<string, unknown>, `${req.nextUrl.origin}/api/drive/webhook`, account._id.toString());
      account.drivePageToken = pageToken;
      account.driveChannelId = watch.channelId;
      account.driveChannelResourceId = watch.resourceId;
      account.driveChannelExpiration = watch.expiration;
    } catch (error) {
      console.error("Drive watch setup failed", error);
    }
  }
  await account.save();
  await seedDefaultSlots(account._id.toString());

  const dashboardUrl = new URL("/", req.nextUrl.origin);
  dashboardUrl.searchParams.set("connected", "google");
  return NextResponse.redirect(dashboardUrl);
}
