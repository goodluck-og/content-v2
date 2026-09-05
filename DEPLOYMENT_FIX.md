# Deployment fix

## Why an older/default page can appear on Vercel

This project previously declared a `*/5 * * * *` Vercel cron. Vercel Hobby only permits cron jobs that run once per day; a more frequent cron expression can cause deployment validation to fail. The project now uses a daily Vercel cron so it can deploy on Hobby.

For true 5-minute scheduled publishing, either:
- use Vercel Pro and change `vercel.json` back to `*/5 * * * *`, or
- keep Hobby and call `/api/cron` from an external scheduler every 5 minutes using `Authorization: Bearer <CRON_SECRET>`.

Drive push notifications remain event-driven for Drive changes, so ingestion does not depend on the daily Vercel cron.

## Deployment

The folder containing `package.json`, `app/`, `lib/`, `models/`, `public/`, and `vercel.json` is the Vercel project root.

After changing environment variables, redeploy the Production deployment.

Use `/api/health` after deployment to verify that the required environment variables are present and MongoDB is reachable. It never returns secret values.
