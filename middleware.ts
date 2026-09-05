export { default } from "next-auth/middleware";

export const config = {
  // Protect everything except the auth pages, NextAuth's own API routes, and static assets.
  matcher: [
    "/((?!login|signup|api/auth|api/health|api/cron|api/drive|_next/static|_next/image|favicon.ico).*)",
  ],
};
