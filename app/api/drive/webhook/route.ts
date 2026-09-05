import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Account from "@/models/Account";
import { syncAccountDrive } from "@/lib/drivePipeline";

// Google calls this automatically whenever something changes in the
// watched Drive folder (see createDriveChangesWatch in lib/drive.ts,
// set up right after the Google OAuth callback). This is what makes
// the pipeline actually automatic instead of needing a manual trigger.
//
// Google's push notifications carry no body - just headers. The
// "token" we set when creating the watch is the account's own ID,
// so we know whose Drive folder to re-scan.
export async function POST(req: NextRequest) {
  await connectDB();

  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");
  const token = req.headers.get("x-goog-channel-token"); // the accountId we set at watch creation

  // "sync" is Google's initial handshake message when the watch is first
  // created - not an actual change, nothing to process yet.
  if (resourceState === "sync") {
    return NextResponse.json({ ok: true, message: "watch confirmed" });
  }

  if (!token) {
    return NextResponse.json({ error: "Missing channel token" }, { status: 400 });
  }

  const account = await Account.findById(token);
  if (!account) {
    return NextResponse.json({ error: "Unknown account for this channel" }, { status: 404 });
  }

  // Extra safety: confirm the channel ID matches what we stored, so a
  // stale/forged notification can't trigger a re-scan.
  if (account.driveChannelId && account.driveChannelId !== channelId) {
    return NextResponse.json({ error: "Channel ID mismatch" }, { status: 403 });
  }

  try {
    const result = await syncAccountDrive(account);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Drive webhook processing failed", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Google sometimes verifies the endpoint with a GET first
export async function GET() {
  return NextResponse.json({ ok: true });
}
