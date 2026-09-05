import { google } from "googleapis";
import crypto from "crypto";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/userinfo.email",
];

function stateSecret() {
  return process.env.OAUTH_STATE_SECRET || process.env.CRON_SECRET || "development-only-change-me";
}

export function getOAuthClient() {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
}

export function createOAuthState(accountId: string) {
  const sig = crypto.createHmac("sha256", stateSecret()).update(accountId).digest("hex").slice(0, 32);
  return `${accountId}.${sig}`;
}

export function verifyOAuthState(state: string) {
  const [accountId, signature] = state.split(".");
  if (!accountId || !signature) return null;
  const expected = crypto.createHmac("sha256", stateSecret()).update(accountId).digest("hex").slice(0, 32);
  if (signature.length !== expected.length) return null;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? accountId : null;
}

export function getAuthUrl(accountId: string) {
  return getOAuthClient().generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES, state: createOAuthState(accountId) });
}

export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await getOAuthClient().getToken(code);
  return tokens;
}

export function getAuthenticatedClient(googleTokens: Record<string, unknown>) {
  const client = getOAuthClient();
  client.setCredentials(googleTokens);
  return client;
}
