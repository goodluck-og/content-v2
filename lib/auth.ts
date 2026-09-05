import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Account from "@/models/Account";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user._id.toString(), name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    // Runs on every sign-in (both providers). For Google, upsert a User row
    // so both login methods share the same identity + linked Account.
    async signIn({ user, account }) {
      await connectDB();
      if (account?.provider === "google") {
        let dbUser = await User.findOne({ email: user.email?.toLowerCase() });
        if (!dbUser) {
          dbUser = await User.create({
            name: user.name,
            email: user.email?.toLowerCase(),
            googleId: account.providerAccountId,
            image: user.image,
          });
        } else if (!dbUser.googleId) {
          dbUser.googleId = account.providerAccountId;
          await dbUser.save();
        }
        user.id = dbUser._id.toString();
      }
      // Ensure every user has a linked content-autopilot Account (workspace).
      const dbUser = await User.findById(user.id);
      if (dbUser && !dbUser.accountId) {
        const newAccount = await Account.create({ ownerUserId: dbUser._id, email: dbUser.email });
        dbUser.accountId = newAccount._id;
        await dbUser.save();
        const { seedDefaultSlots } = await import("@/lib/seedSlots");
        await seedDefaultSlots(newAccount._id.toString());
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.userId as string;
      return session;
    },
  },
};
