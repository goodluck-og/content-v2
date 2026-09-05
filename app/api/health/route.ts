import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
    hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    hasOAuthStateSecret: Boolean(process.env.OAUTH_STATE_SECRET),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  };
  const ok = Object.values(checks).every(Boolean);
  return NextResponse.json({ ok, checks, timestamp: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
