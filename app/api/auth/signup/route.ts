import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Account from "@/models/Account";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Email and an 8+ character password are required" }, { status: 400 });
  }

  await connectDB();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash });

  const account = await Account.create({ ownerUserId: user._id, email: user.email });
  user.accountId = account._id;
  await user.save();

  return NextResponse.json({ ok: true });
}
