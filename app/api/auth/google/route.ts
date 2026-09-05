import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAuthUrl } from "@/lib/googleAuth";

export async function GET(req: NextRequest) {
  // Prefer the signed-in user's own account; fall back to an explicit
  // accountId query param for server-to-server / testing use.
  let accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    await connectDB();
    const user = await User.findById((session.user as { id?: string }).id);
    accountId = user?.accountId?.toString() || null;
  }
  if (!accountId) {
    return NextResponse.json({ error: "No account found for this user" }, { status: 400 });
  }

  const url = getAuthUrl(accountId);
  return NextResponse.redirect(url);
}
