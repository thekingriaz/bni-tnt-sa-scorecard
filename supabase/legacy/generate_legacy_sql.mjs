// Generates legacy_import.sql from sheet_data.json (Jun–Sep 2026 as scored in the Google Sheet).
// Legacy months keep the sheet's points exactly (incl. the old /100 total with Mentoring), flagged legacy=true.
// Run: node generate_legacy_sql.mjs > legacy_import.sql
import fs from 'fs';
import { bandFor, DEFAULT_SETTINGS } from '../../api/_lib/scoring.js';

const data = JSON.parse(fs.readFileSync(new URL('./sheet_data.json', import.meta.url), 'utf8'));
const pct = s => Number(String(s).replace('%', ''));
const q = s => `'${String(s).replace(/'/g, "''")}'`;
let sql = `-- Legacy import: Jun–Sep 2026 from BNI_TNT_SA_Scorecard_Q2_2026 (Google Sheet). Safe to re-run.\n`;
for (const [ym, rows] of Object.entries(data)) {
  sql += `\ninsert into sa_months (ym, status, published_at) values (${q(ym)}, 'published', now()) on conflict (ym) do nothing;\n`;
  // rank within month by sheet total desc
  const ranked = [...rows].map(r => ({ r, total: Number(r[18]) })).sort((a, b) => b.total - a.total);
  const rankOf = new Map(); ranked.forEach((x, i) => rankOf.set(x.r[0], i + 1));
  for (const r of rows) {
    const [chapter, sa, member, memberPts, on, off, , trainPts, ment, mentPts, ret, retPts, o2o, o2oPts, ltrt, ltrtPts, jot, jotPts, total] = r;
    const points = { member: +memberPts, training: +trainPts, mentoring: +mentPts, retention: +retPts, one_to_one: +o2oPts, ltrt: +ltrtPts, visit: +jotPts };
    const band = bandFor(Number(total), DEFAULT_SETTINGS);
    sql += `insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, ${member}, ${pct(on)}, ${pct(off)}, ${pct(ment)}, ${pct(ret)}, ${o2o}, ${ltrt === 'Attended'}, ${jot === 'Done'}, ${q(JSON.stringify(points))}::jsonb, ${total}, 100, ${total}, ${q(band.label)}, ${band.multiplier}, null, ${rankOf.get(chapter)}, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name=${q(sa)} and u.chapter_id=c.id
where m.ym=${q(ym)} and c.name=${q(chapter)}
on conflict (month_id, chapter_id) do nothing;\n`;
  }
}
process.stdout.write(sql);
