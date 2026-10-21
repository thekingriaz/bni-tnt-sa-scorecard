// Generates sdc_legacy_import.sql from sdc_sheet_data.json (Jun–Sep 2026 as scored in BNI_TNT_SDC_Scorecard_Jun-Sep_2026).
// Legacy months keep the sheet's points exactly, flagged legacy=true, no payout. Run: node generate_sdc_legacy_sql.mjs > sdc_legacy_import.sql
import fs from 'fs';
import { bandFor, DEFAULT_SETTINGS } from '../../api/_lib/scoring.js';
import { meetingsInMonth } from '../../api/_lib/scoring_sdc.js';

const data = JSON.parse(fs.readFileSync(new URL('./sdc_sheet_data.json', import.meta.url), 'utf8'));
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const pct = s => Number(String(s).replace('%', ''));
const q = s => `'${String(s).replace(/'/g, "''")}'`;
let sql = `-- SDC legacy import: Jun–Sep 2026 from BNI_TNT_SDC_Scorecard_Jun-Sep_2026 (Google Sheet). Safe to re-run.\n-- Run AFTER sdc_migration.sql. Months are published for SDCs; the SA side of each month is untouched.\n`;
for (const [ym, rows] of Object.entries(data)) {
  sql += `\ninsert into sa_months (ym, status, published_at) values (${q(ym)}, 'draft', null) on conflict (ym) do nothing;\n`;
  sql += `update sa_months set sdc_status='published', sdc_published_at=now() where ym=${q(ym)};\n`;
  const ranked = [...rows].map(r => ({ r, total: Number(r[21]) })).sort((a, b) => b.total - a.total);
  const rankOf = new Map(); ranked.forEach((x, i) => rankOf.set(x.r[1], i + 1));
  for (const r of rows) {
    const [, chapter, day, meetings, sdc, net, netPts, tl, tlPts, ret, retPts, member, memberPts, tbW, tbPts, palmsW, palmsPts, visit, visitPts, ltrt, ltrtPts, total] = r;
    if (Number(meetings) !== meetingsInMonth(ym, DOW[day])) console.error(`WARN ${ym} ${chapter}: sheet says ${meetings} meetings, calendar says ${meetingsInMonth(ym, DOW[day])}`);
    const points = { net_growth: +netPts, traffic_light: +tlPts, retention: +retPts, member: +memberPts, telebridge: +tbPts, palms: +palmsPts, visit: +visitPts, ltrt: +ltrtPts };
    const sum = Object.values(points).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - Number(total)) > 0.01) console.error(`WARN ${ym} ${chapter}: points sum ${sum} != total ${total}`);
    const band = bandFor(Number(total), DEFAULT_SETTINGS);
    const retention = pct(ret) === 0 ? 'null' : pct(ret); // 0% on the sheet = not entered (retention is cumulative, never truly 0)
    sql += `insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, ${net}, ${q(tl)}, ${retention}, ${member}, ${meetings}, ${tbW}, ${palmsW}, ${visit === 'Done'}, ${ltrt === 'Attended'}, ${q(JSON.stringify(points))}::jsonb, ${total}, 100, ${total}, ${q(band.label)}, ${band.multiplier}, null, ${rankOf.get(chapter)}, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name=${q(sdc)} and u.chapter_id=c.id
where m.ym=${q(ym)} and c.name=${q(chapter)}
on conflict (month_id, chapter_id) do nothing;\n`;
  }
}
process.stdout.write(sql);
