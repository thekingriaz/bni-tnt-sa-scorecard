# BNI TNT SA Scorecard: Setup Guide (sa.bnitnt.in)

Same stack as the CRM: Supabase (database) + Vercel (hosting + API) + GitHub (source). About 30 minutes.

## 1. Supabase (database)

1. Go to https://supabase.com/dashboard, **New project**, name `bni-tnt-sa-scorecard`, region **Mumbai**, set a DB password (keep it, you won't need it in the app).
2. Open **SQL Editor**, paste the whole of `supabase/schema.sql`, click **Run**. It creates the tables, the 14 chapters, the 14 SAs (all with PIN `1234`), and your admin login.
3. Still in SQL Editor, paste `supabase/legacy/legacy_import.sql` and **Run**. This loads Jun to Sep 2026 exactly as the Google Sheet scored them (flagged "legacy").
4. **Project Settings > API**: copy
   - **Project URL** (https://xxxx.supabase.co)
   - **service_role** secret key (under "Project API keys"; click reveal). This key never goes in the browser; only Vercel holds it.

## 2. GitHub (source)

1. Create a **private** repo `bni-tnt-sa-scorecard` under your account (github.com/new).
2. Upload this whole folder (drag the folder contents into the repo on github.com, or use GitHub Desktop). Do not upload `node_modules`.

## 3. Vercel (hosting)

1. https://vercel.com/new, **Import** the `bni-tnt-sa-scorecard` repo. Framework preset: **Other**. Leave build settings empty (vercel.json handles it).
2. **Environment Variables** (add all four before the first deploy):

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | the Project URL from step 1.4 |
   | `SUPABASE_SERVICE_KEY` | the service_role key from step 1.4 |
   | `APP_SECRET` | any long random string (40+ characters), used to sign login sessions |
   | `JOTFORM_API_KEY` | Jotform > Settings > API > Create new key (Full access) |

3. **Deploy**. You get `https://bni-tnt-sa-scorecard.vercel.app`.
4. **Settings > Domains** in the Vercel project: add `sa.bnitnt.in`. Vercel shows a CNAME target (`cname.vercel-dns.com`).

## 4. BigRock DNS

In BigRock's **DNS Management** for bnitnt.in (same panel where `forms` and `visit` were added), add:

- Type **CNAME**, Host `sa`, Points to `cname.vercel-dns.com`, TTL default.

Vercel issues the SSL certificate automatically once DNS propagates (5 min to a few hours).

## 5. First login and go-live checklist

1. Open https://sa.bnitnt.in, **Admin** tab, sign in with `riaz@thekingsgroup.in` / `ChangeMe@2026`.
2. **Users**: click **Set password** on your own account and change it. Add your 3 admins (**Add admin**).
3. **Users**: set a real PIN for each of the 14 SAs (**Set PIN**). Share each PIN privately. Default `1234` must not stay.
4. **Users**: check the **Jotform name** of each SA matches how they write their name on the Chapter Visit Report form ("Visited By" / "Name"). The sync matches on that text.
5. **Settings**: confirm fee ₹49,040 and 2.5% (change when the team decides), 1-2-1 threshold 8.66, Mentoring off. Tick the event types that count as **online** training once the first training report is uploaded.
6. Sign out, open the **Support Ambassador** tab, pick a chapter, enter its PIN: you should see Jun to Sep history for that SA.

## 6. Monthly routine (admin, first week of each month)

1. BNI Connect > Reports > **Region Meeting Statistics > Chapter Statistics**: region Tirunelveli, From = To = last month. Export. Repeat for region Nagercoil & Tuticorin.
2. BNI Connect > Reports > **Region Member Training Report**: all events, From = 1st, To = last day of last month, Show "Members who have attended". Export for both regions.
3. App > **Months** > drop all 4 files on the upload box (upload Chapter Statistics first; training % needs the member count). The month opens automatically.
4. Click **Sync Jotform**.
5. Type per chapter: Member Score (Traffic Light), Retention %, LTRT attended, New members, Renewals (paid that month).
6. Check the scores and payouts, then **Publish month**. SAs see it only after publish. Unpublish if you need to correct something; publish again after.

## 7. When an SA changes

**Users > Replace a chapter's SA**: enter the new name and PIN, and the month from which the new SA takes over. The old SA is deactivated (keeps their history), the new SA starts fresh with no history.

## 8. Changing the commission base later

**Settings > Commission**: edit the fee and percentage. Draft months recalculate immediately. Published months keep the payout that was published (unpublish, then publish again to recalculate with the new base).

## Notes

- Scoring thresholds and the 5 bands live in `api/_lib/scoring.js` (DEFAULT_SETTINGS). Change there and redeploy if the team revises the scheme.
- The Google Sheet is no longer the source of truth after go-live. Keep it as an archive.
- `npm test` runs the parser and scoring checks against the real September 2026 exports in `test/fixtures`.
- `node test/mock-server.mjs` runs a local preview with fake data on http://localhost:4173 (admin: any email/password, SA PIN 1234).
