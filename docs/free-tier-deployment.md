# Free-Tier Deployment (No Supabase)

This repo is being kept compatible with low-cost/free hosting by design:

- Frontend/UI can run as static assets or a Next.js app on `Vercel Hobby`.
- Current e2e harness is static (`apps/web/e2e-harness`) and does not require any backend.
- Core logic lives in `packages/core` and `packages/renderer`, so storage can be swapped later without rewriting graph/layout code.

## Recommended Free-Tier Paths

1. `Vercel Hobby` + `Turso (libSQL/SQLite)`:
- Good fit for Next.js on Vercel.
- Simple relational model, low ops overhead, free tier available.

2. `Vercel Hobby` + `Neon Postgres`:
- Good if you want standard Postgres and SQL tooling.
- Free tier available; works well with serverless connection patterns.

3. `Cloudflare Pages/Workers` + `Cloudflare D1`:
- Good alternative if you want to keep both frontend + DB in Cloudflare’s free tier ecosystem.
- Requires adapting API routes to Workers runtime.

## What To Avoid (For Now)

- Supabase (per your request).
- Vendor-specific tight coupling in domain code.
- Heavy always-on servers (free tiers usually sleep or are limited).

## Storage Strategy For v1 (Cheapest)

Start with the spec’s `JSON file store`/uploaded JSON approach:

- Read-only hosting: ship `family.json` with the app.
- Editing: keep changes in browser `localStorage` and export JSON.
- Optional persistence later: add a repository adapter (`turso`, `neon`, or `d1`).

This keeps M1/M2 development moving without backend bills.

## Practical Recommendation For This Repo Right Now

- Use `Vercel Hobby` for the web app.
- Keep `JSON` as the source of truth for M1.
- Add a repository interface before M2 editing persistence.
- Choose `Turso` first for lowest friction/cost, or `Neon` if you prefer Postgres.

## E2E/Screenshot CI on Free Tier

- Use Playwright locally (`pnpm test:e2e`).
- In CI, run Playwright on GitHub Actions (free tier limits depend on repo visibility/account plan).
- Snapshot files are stored in the repo (generated via `pnpm test:e2e:update`).

## Sources (verify current limits before launch)

- Vercel pricing / Hobby: https://vercel.com/pricing
- Cloudflare D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare Pages pricing: https://developers.cloudflare.com/pages/platform/pricing/
- Neon pricing: https://neon.com/pricing
- Turso pricing: https://turso.tech/pricing
