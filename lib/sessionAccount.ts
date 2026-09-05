import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Account from "@/models/Account";

/**
 * Every session-scoped API route uses this instead of trusting a
 * client-supplied accountId - the account is always derived from
 * who's actually signed in server-side.
 */
export async function getCurrentAccount() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  await connectDB();
  const user = await User.findById((session.user as { id?: string }).id);
  if (!user?.accountId) return null;
  return Account.findById(user.accountId);
}
