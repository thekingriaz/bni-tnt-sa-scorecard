# BNI TNT SA Scorecard

Monthly performance scorecard for BNI TNT Support Ambassadors. Admins upload two BNI Connect exports per region, type five manual inputs per chapter, sync Jotform visit reports and publish. Each SA signs in with a PIN and sees only their own score, band, rupee payout, rank, region average, trend and "how to reach the next band".

- Live: https://sa.bnitnt.in
- Setup: see SETUP-GUIDE.md
- Stack: Vercel (static `public/` + Node serverless `api/`), Supabase Postgres, no frontend framework.

```
api/_lib/scoring.js    scoring engine, bands, payout, next-band hints (single source of truth)
api/_lib/parsers.js    BNI Connect SpreadsheetML parsers (Chapter Statistics, Member Training Report)
api/auth/*             PIN / password login (JWT cookie)
api/sa/dashboard.js    SA view data
api/admin/*            months, entries, uploads, settings, users, jotform sync
public/index.html      the whole UI
supabase/schema.sql    database + seed (chapters, SAs, first admin)
supabase/legacy/       Jun–Sep 2026 import from the Google Sheet
test/                  fixture-based checks + local mock server
```
