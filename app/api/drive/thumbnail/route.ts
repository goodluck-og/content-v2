import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Account from "@/models/Account";
import { getDriveVideo, fetchDriveThumbnail } from "@/lib/drive";

// Proxies a Drive video's thumbnail through our own server so the browser
// never needs a direct Google access token. Used as the <img src> for
// coverFrameUrl on pending-review cards.
export async function GET(req: NextRequest) {
  await connectDB();
  const accountId = req.nextUrl.searchParams.get("accountId");
  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!accountId || !fileId) {
    return NextResponse.json({ error: "accountId and fileId required" }, { status: 400 });
  }

  const account = await Account.findById(accountId);
  if (!account?.googleTokens) {
    return NextResponse.json({ error: "Account not connected" }, { status: 404 });
  }

  try {
    const file = await getDriveVideo(account.googleTokens, fileId);
    if (!file.thumbnailLink) {
      return NextResponse.json({ error: "No thumbnail available yet" }, { status: 404 });
    }
    const { base64, contentType } = await fetchDriveThumbnail(account.googleTokens, file.thumbnailLink);
    return new NextResponse(Buffer.from(base64, "base64"), {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
