import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Account from "@/models/Account";

export const dynamic = "force-dynamic";

// Kept as a thin alias of PATCH /api/account for the existing ThemeSwitcher
// component, which was already wired to this path.
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { themeId } = await req.json().catch(() => ({}));
  await connectDB();
  const user = await User.findById((session.user as { id?: string }).id);
  if (!user?.accountId) return NextResponse.json({ error: "No account found" }, { status: 404 });

  if (typeof themeId === "string") {
    await Account.findByIdAndUpdate(user.accountId, { themeId });
  }
  return NextResponse.json({ ok: true });
}
