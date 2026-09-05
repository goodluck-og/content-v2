# Content Autopilot

Drive → AI caption → self-learning scheduled posting to YouTube.

## What this merge fixed

The previous version had solid infrastructure (real Drive push notifications,
timezone-aware scheduling, NextAuth login) but the database models were
missing most of the fields the AI/ML learning engine needed - so the
scheduling engine, duplicate detection, and repost-risk checks were silently
failing to persist their data. That's been fixed, plus the pieces that were
referenced in code but never built:

- **Models rewritten** (`models/Account.ts`, `models/Post.ts`,
  `models/TimeSlot.ts`, `models/ScheduleState.ts`) - every field every lib
  file actually references is now declared.
- **`/api/drive/webhook`** - was referenced by `lib/drive.ts`'s watch setup
  but never built. This is the real automation trigger: Google calls it the
  moment a new file lands in the watched Drive folder.
- **`/api/drive/thumbnail`** - proxies a Drive video's thumbnail so the
  browser never needs a raw Google token.
- **`/api/cron`** - was an empty stub. Now runs the full daily pass: syncs
  Drive as a backup, recomputes each time slot's real engagement score,
  checks for an early stable base or force-locks at 30 days, checks for a
  relearn trigger, publishes anything due, and renews the Drive watch
  subscription before it expires.
- **Session-scoped API routes restored**: `/api/caption/generate` (includes
  a manual test-upload path so you can confirm the AI pipeline works before
  full Drive automation is proven), `/api/videos`, `/api/schedule/status`,
  `/api/digest/weekly`, `/api/stats`.
- **Real pages built**: `/queue` (Review Queue), `/automation` (shows the
  actual learning engine status), `/settings` (theme, series numbering,
  thumbnail toggle, Drive folder, niche, posts-per-day cap), `/analytics`
  (weekly digest + niche benchmark).
- **Sidebar fixed** - was decorative buttons with no real navigation. Now
  uses real routing; nav items with no page built yet are honestly labeled
  "Soon" instead of pretending to work.
- **Dashboard home rebuilt** - was hardcoded fake numbers (128, 96, 24,
  284.5K) matching a design mockup. Now pulls real counts from your account.
- Fixed a redirect bug that sent people to `/dashboard` (a 404) after
  connecting Google - the actual dashboard route is `/`.

## How the automation actually runs

1. You connect Google (Drive read + YouTube upload scopes) once, in Settings
   or from the dashboard banner.
2. A Drive "watch" subscription is created automatically - Google will POST
   to `/api/drive/webhook` the moment something changes in your folder.
3. New videos get their caption/hashtags/character generated via Gemini,
   checked for duplicates and watermark/repost risk, and land in
   `/queue` as `pending_review`.
4. You approve (or bulk-approve) - the post gets assigned a time slot and
   `scheduledFor` date via `lib/scheduling.ts`, respecting your daily cap.
5. The daily cron job (`/api/cron`, see `vercel.json`) publishes anything
   whose scheduled time has passed, recomputes slot performance, and
   locks in or relearns your best posting times.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Required env vars: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`,
`OAUTH_STATE_SECRET`, `GEMINI_API_KEY`. `CRON_SECRET` is optional but
recommended once deployed (protects `/api/cron` from being called by
anyone but Vercel).

## Still not built

- TikTok / Instagram posting (on hold - TikTok needs developer app review)
- True AI-*generated* thumbnails (current version smart-picks your best
  real frame instead, which is free - generation needs a paid image model)
- Calendar, Accounts, Performance, Content Studio nav items (marked "Soon"
  in the sidebar, not built)

## Batch 2 additions

- Real YouTube stats sync (`lib/youtubeStats.ts`) - views/likes/comments now
  real, wired into cron before slot aggregation runs
- Discord/Slack webhook alerts on publish/fail (`lib/notify.ts`, set in Settings)
- 3 ranked AI title variants + YouTube tag suggestions (used as the real
  video title/tags on publish, not just the caption)
- On-demand caption translation (`/api/post/translate`) - 7 languages
- House style notes - injected into every AI prompt (Settings page)
- Caption-text-similarity duplicate check, alongside the existing frame hash
- SEO checklist (`lib/seoScore.ts`) - transparent, rules-based, not a
  black-box score
- Outlier detector + series index / content-gap view (`/analytics`)
- Visual calendar (`/calendar`) - real data, month view
- Failed-post retry (`/api/post/retry`, shown at the bottom of `/queue`)
- CSV export (`/api/export/csv`, button on `/analytics`)
- Onboarding checklist + approval streak (data in `/api/stats`)

## Not yet built (from the 28-feature list)

Multi-channel switcher, emailed digest, API quota tracker, video
length/aspect-ratio validator, full retention-graph/comment-inbox (need the
separate YouTube Analytics API - bigger integration than public stats),
multi-language UI button (backend endpoint exists, no button wired yet),
light/dark mode toggle, SEO checklist shown per-post in the UI (backend
function exists, not called from a route yet).
