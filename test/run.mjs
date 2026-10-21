// node test/run.mjs : parser + scoring checks against real September 2026 BNI Connect exports.
import fs from 'fs'; import assert from 'assert';
import { parseChapterStatistics, parseTrainingReport, trainingPercents } from '../api/_lib/parsers.js';
import { scoreEntry, nextBandHints, DEFAULT_SETTINGS } from '../api/_lib/scoring.js';
const F = p => fs.readFileSync(new URL('./fixtures/' + p, import.meta.url), 'utf8');
const cs = parseChapterStatistics(F('chapter-statistics-tirunelveli-sep2026.xls'));
assert.equal(cs.region, 'Tirunelveli'); assert.equal(cs.month, '2026-09'); assert.equal(cs.rows.length, 8);
assert.deepEqual(cs.rows.find(r => r.key === 'ainthinai'), { ...cs.rows.find(r => r.key === 'ainthinai'), mem_avg: 102, one_to_one_per_member: 11.06 });
const t1 = parseTrainingReport(F('training-tirunelveli-sep2026.xls')); const t2 = parseTrainingReport(F('training-nagercoil-tuticorin-sep2026.xls'));
assert.equal(t1.month, '2026-09'); assert.equal(t2.region, 'Nagercoil & Tuticorin');
assert.equal(t1.by_chapter.ainthinai.unique_members, 11); assert.equal(t1.by_chapter.dilnadu.unique_members, 14); assert.equal(t2.by_chapter.kanya.unique_members, 13);
const dn = trainingPercents(t1.attendances, 'dilnadu', 60, ['Member Success Program']);
assert.equal(dn.unique_members, 14); assert.equal(dn.online_pct + dn.offline_pct > 23, true);
// scoring
const s = DEFAULT_SETTINGS;
const gold = scoreEntry({ member_score: 90, online_pct: 5, offline_pct: 16, retention_pct: 80, one_to_one_per_member: 9, ltrt_attended: true, jotform_done: true, new_members: 2, renewals: 3 }, s);
assert.equal(gold.total_raw, 80); assert.equal(gold.total_scaled, 100); assert.equal(gold.band, 'Gold'); assert.equal(gold.payout, Math.round(5 * 1226));
const amber = scoreEntry({ member_score: 84, online_pct: 0, offline_pct: 10, retention_pct: 85, one_to_one_per_member: 8.46, ltrt_attended: true, jotform_done: false, new_members: 0, renewals: 2 }, s);
assert.equal(amber.total_raw, 50); assert.equal(amber.total_scaled, 62.5); assert.equal(amber.band, 'Amber'); assert.equal(amber.payout, Math.round(2 * 1226 * 0.6));
const empty = scoreEntry({}, s); assert.equal(empty.total_scaled, 0); assert.equal(empty.band, 'Review');
const h = nextBandHints({ member_score: 84, online_pct: 0, offline_pct: 10, retention_pct: 85, one_to_one_per_member: 8.46, ltrt_attended: true, jotform_done: false }, s);
assert.equal(h.next, 'Green'); assert.equal(h.hints[0].kpi, 'visit'); assert.equal(h.hints[0].gain_scaled, 12.5);
// mentoring enabled -> out of 100
const m100 = scoreEntry({ member_score: 90, mentoring_pct: 90 }, { ...s, mentoring_enabled: true }); assert.equal(m100.max_total, 100); assert.equal(m100.total_raw, 30);
// bad file
assert.throws(() => parseChapterStatistics('<html>nope</html>'), /Not a BNI Connect export/);
console.log('All checks passed ✓');
