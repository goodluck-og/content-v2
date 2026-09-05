import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Account from "@/models/Account";

export const dynamic = "force-dynamic";

async function currentAccount() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  await connectDB();
  const user = await User.findById((session.user as { id?: string }).id);
  if (!user?.accountId) return null;
  return Account.findById(user.accountId);
}

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { googleTokens, tiktokTokens, instagramTokens, ...safe } = account.toObject();
  return NextResponse.json({
    account: {
      ...safe,
      googleConnected: Boolean(googleTokens),
      tiktokConnected: Boolean(tiktokTokens),
      instagramConnected: Boolean(instagramTokens),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = await req.json();
  if (typeof body.driveFolderId === "string") account.driveFolderId = body.driveFolderId;
  if (typeof body.themeId === "string") account.themeId = body.themeId;
  if (typeof body.niche === "string") account.niche = body.niche;
  if (typeof body.useSeriesNumbering === "boolean") account.useSeriesNumbering = body.useSeriesNumbering;
  if (typeof body.seriesLabel === "string") account.seriesLabel = body.seriesLabel;
  if (typeof body.autoSelectThumbnail === "boolean") account.autoSelectThumbnail = body.autoSelectThumbnail;
  if (typeof body.postsPerDayCap === "number") account.postsPerDayCap = body.postsPerDayCap;
  if (typeof body.styleNotes === "string") account.styleNotes = body.styleNotes;
  if (typeof body.notifyWebhookUrl === "string") account.notifyWebhookUrl = body.notifyWebhookUrl;
  await account.save();
  return NextResponse.json({ ok: true, account });
}
