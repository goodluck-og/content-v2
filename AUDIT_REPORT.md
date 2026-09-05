# Content Autopilot — Engineering Audit

## Executive result

The supplied project was not production-ready when received. The root route was still the stock Next.js starter, the Drive webhook was a stub, approvals did not calculate a real future schedule, the scheduler was not wired to a deployment-safe worker, OAuth tokens were being returned by the accounts API, and the Gemini configuration referenced an outdated model.

This revision addresses those defects and upgrades the interface substantially.

## Critical fixes

| Area | Before | After |
|---|---|---|
| Root page | Stock Next.js starter | Redirects to `/dashboard` |
| Dashboard | Basic approval list | Command-center UI with responsive navigation, KPI cards, analytics, 3D visual layer, queue and automation health |
| Manage | Plain list | Studio-style content library with filters/search/sort |
| Drive | Webhook stub | Drive Changes watch + webhook processing + manual sync |
| Drive thumbnails | Base64 stored in DB from manual input | Server-side OAuth thumbnail proxy |
| Approval | Queued with no real scheduled timestamp | Timezone-aware future slot assignment + daily cap |
| YouTube | Manual publish endpoint only | Cron worker processes due queued posts |
| Duplicate uploads | Possible | Atomic `publishing` claim reduces concurrent double uploads |
| OAuth | Raw account ID in state | HMAC-signed state |
| API security | Account API could return OAuth tokens | Public account responses explicitly select safe fields |
| AI | `gemini-1.5-flash` | Configurable `gemini-2.5-flash` default |
| Learning engine | Mostly library code | Cron updates slot aggregates and triggers lock/relearn logic |
| Scheduling state | Could remain uninitialized | Seed creates a 30-day exploration state |
| Metadata | Create Next App | Content Autopilot metadata |

## Remaining external requirements

1. MongoDB Atlas connection.
2. Gemini API key.
3. Google OAuth client and enabled Drive + YouTube APIs.
4. Production HTTPS URL for Drive push notifications.
5. `CRON_SECRET` and `OAUTH_STATE_SECRET` in Vercel.
6. Vercel plan capable of the configured 5-minute cron cadence, or an external worker if using Hobby.
7. YouTube API project verification may be required before uploads can be made public; Google's current API documentation says unverified projects created after July 28, 2020 are restricted to private uploads.
8. TikTok and Instagram still need their approved developer/API integrations.

## Validation note

A full `npm run build` could not be completed inside the audit container because the package registry/network was unavailable and the supplied `node_modules` directory was incomplete. The project was therefore validated through source inspection, route/model consistency checks, JSON/config validation and dependency-free static review. Run `npm ci && npm run build` in your local machine or CI before production deployment.
