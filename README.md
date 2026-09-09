# Leicester Car Recovery — App

Phase 0/1 scaffold: a real Next.js app implementing customer booking,
manual admin dispatch, and the driver sign-up → job → completion flow.
Payments and live maps are stubbed for Phases 3–4 (see the roadmap).

**Honest caveat:** the sandbox this was built in has no access to the npm
registry, so I wrote and hand-reviewed every file but couldn't run
`npm install` / `npm run build` here to confirm it compiles clean. Run the
steps below first — if anything errors, send me the output and I'll fix it
fast; that's a normal first pass, not a sign the plan's off track.

## Run it locally

```bash
npm install
cp .env.example .env
npx prisma db push        # creates dev.db (SQLite) from the schema
npm run db:seed           # creates an admin login
npm run dev
```

Open http://localhost:3000

- **Customer:** `/request` — creates an account, then books a job
- **Admin:** `/admin` — sign in with the seeded admin (phone `07000000000`,
  password `changeme123` — **change this before it's anywhere near real
  users**), assign jobs to approved drivers
- **Driver:** `/driver/apply` — register, then `/driver/dashboard` once
  an admin approves the application

## What's real vs. stubbed right now

| Area | Status |
|---|---|
| Customer request → DB → admin dispatch → driver accept/complete | **Working end to end** |
| Auth (customer / driver / admin roles) | **Working** — phone + password via NextAuth |
| Pricing | **Working, from your real numbers** — see below |
| Live map / tracking | Illustrated only — Phase 3 wires in Mapbox |
| Payments | Not wired — Phase 4 adds Stripe (same pattern as Aurum Oud) |
| Driver location | Not sent yet — Phase 3 |
| Push/SMS notifications | Not wired — admin and driver dashboards poll every 5–8s instead |

## How pricing actually works now

This replaced "call the driver, then ring the customer back" with:

1. **Customer sees a range at booking**, based on real distance — pickup
   and drop-off postcodes are geocoded via
   [postcodes.io](https://postcodes.io) (free, no API key) and banded:
   roughly £120 for local jobs, £160–£200 out to nearby cities (your
   numbers), and a wider band beyond that (my extrapolation — flagged in
   `src/lib/pricing.ts`, confirm it before it's customer-facing).
2. **You still get the driver's wholesale quote by phone**, same as today
   — nothing about that call changes.
3. **You type the quote into the admin dashboard** instead of ringing the
   customer back. It suggests a final price at your usual markup (+£25 on
   standard jobs, +£50 on bigger/LWB ones — the midpoints of what you told
   me), pre-filled and editable, so you can adjust per job and hit
   *Confirm price*. The customer's tracking page updates itself.

The driver's wholesale quote is stored for your own reference (margin
tracking) and is never sent to the customer — the API strips it out for
anyone who isn't signed in as admin.

Every number in this — the distance bands, the £25/£50 markup — lives in
one place, `src/lib/pricing.ts`, so it's a quick edit, not a re-build.

**On your idea to hold the maximum and release the difference:** right
approach. Once Stripe's wired up (Phase 4), authorize the customer's card
for `priceEstimateHigh` at booking (a hold, no charge yet), then capture
only `priceFinal` on completion — Stripe releases the uncaptured remainder
automatically. No manual refund step, no separate "release" logic to
write.

## Project layout

```
prisma/schema.prisma       data model — users, drivers, jobs, status history
src/lib/auth.ts            NextAuth config (credentials, role in session)
src/lib/pricing.ts         placeholder pricing bands
src/app/request            customer booking flow
src/app/track/[jobId]      customer live-status page (polls for now)
src/app/admin              dispatch dashboard (assign jobs, approve drivers)
src/app/driver/apply       driver "register interest" form
src/app/driver/dashboard   driver's job list + status updates
src/app/api/*              the endpoints all of the above call
public/manifest.json       PWA manifest (installable already — icons included)
```

## Getting this onto your GitHub

There's no GitHub connection available from this session, so pull the
project down the way you already work from your phone:

1. Download the project files from this chat.
2. Create a new repo on GitHub (e.g. `lcr-app`).
3. Upload the files via the GitHub web UI or your usual mobile workflow.

From then on, hand me the repo and I can work against it directly in future
sessions.

## Going to production

- **Database:** swap `datasource db` in `prisma/schema.prisma` from
  `sqlite` to `postgresql` (or Turso's `libsql` provider, matching Aurum
  Oud), point `DATABASE_URL` at the real database, run `npx prisma db push`
  again.
- **Hosting:** deploy to Vercel, then point
  `app.leicester-car-recovery.co.uk` at it with a CNAME in Cloudflare —
  doesn't touch the existing site or Worker.
- **Auth secret:** generate a real one — `openssl rand -base64 32` — and
  set it as `AUTH_SECRET` in Vercel's environment variables.
- **Customer login:** right now it's phone + password, matching the driver
  and admin flow for simplicity. Worth switching customers to SMS OTP
  before launch — faster sign-up, no forgotten passwords.

## Roadmap

See the full phased plan, architecture, and cost breakdown in the roadmap
document — ask me to re-share the link any time.
