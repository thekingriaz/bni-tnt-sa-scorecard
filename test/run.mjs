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

// ---------- SDC ----------
import { scoreSdcEntry, nextSdcBandHints, meetingsInMonth, meetingDates, weekCounts, weeklyPts } from '../api/_lib/scoring_sdc.js';
import { parseTrafficLights } from '../api/_lib/parsers.js';
// meetings-in-month, Jun 2026: Tue=5, Wed=4, Thu=4, Fri=4 ; Sep 2026: Tue=5, Wed=5, Thu=4, Fri=4 ; Jul 2026: Tue=4, Wed=5
assert.deepEqual([2, 3, 4, 5].map(d => meetingsInMonth('2026-06', d)), [5, 4, 4, 4]);
assert.deepEqual([2, 3, 4, 5].map(d => meetingsInMonth('2026-09', d)), [5, 5, 4, 4]);
assert.deepEqual([2, 3].map(d => meetingsInMonth('2026-07', d)), [4, 5]);
assert.deepEqual(meetingDates('2026-06', 2), ['2026-06-02', '2026-06-09', '2026-06-16', '2026-06-23', '2026-06-30']);
assert.equal(meetingsInMonth('2026-06', null), 0);
// week counts: no-meeting weeks drop out of the denominator
const wc = weekCounts([{ no_meeting: false, telebridge_done: true, palms_done: true }, { no_meeting: true, telebridge_done: null, palms_done: null }, { no_meeting: false, telebridge_done: false, palms_done: null }, { no_meeting: false, telebridge_done: true, palms_done: true }]);
assert.deepEqual([wc.calendar, wc.meetings_total, wc.telebridge_weeks, wc.palms_weeks, wc.palms_pending], [4, 3, 2, 2, 1]);
assert.equal(weeklyPts(4, 5, 10), 8); assert.equal(weeklyPts(3, 4, 10), 7.5); assert.equal(weeklyPts(0, 0, 10), 0); assert.equal(weeklyPts(6, 5, 10), 10);
// Sep 2026 Ainthinai as on the sheet: 18 net, GREEN, 75%, 95, TB 4/5, PALMS 4/5, Done, Attended -> 86
const sdcS = { fee_amount: 49040, sdc_commission_pct: 7.5 };
const ain = scoreSdcEntry({ net_add: 18, tl_status: 'GREEN', retention_pct: 75, member_score: 95, meetings_total: 5, telebridge_weeks: 4, palms_weeks: 4, visit_done: true, ltrt_attended: true, members_paid: 4 }, sdcS);
assert.equal(ain.total_raw, 86); assert.equal(ain.total_scaled, 86); assert.equal(ain.band, 'Gold'); assert.equal(ain.max_total, 100);
assert.equal(ain.per_member_commission, 3678); assert.equal(ain.payout, 4 * 3678);
// Sep Saral: 3 net, AMBER, 0%, 65, TB 3/4, PALMS 4/4, Not done, Attended -> 42.5 Red
const sar = scoreSdcEntry({ net_add: 3, tl_status: 'AMBER', retention_pct: 0, member_score: 65, meetings_total: 4, telebridge_weeks: 3, palms_weeks: 4, visit_done: false, ltrt_attended: true, members_paid: 2 }, sdcS);
assert.equal(sar.total_raw, 42.5); assert.equal(sar.band, 'Red'); assert.equal(sar.payout, Math.round(2 * 3678 * 0.35));
// net add +1 = 10, 0 = 0, null = 0
assert.equal(scoreSdcEntry({ net_add: 1 }, sdcS).points.net_growth, 10); assert.equal(scoreSdcEntry({ net_add: 0 }, sdcS).points.net_growth, 0); assert.equal(scoreSdcEntry({}, sdcS).points.net_growth, 0);
// no meetings held at all: weekly KPIs drop out, max 80, scaled
const nm = scoreSdcEntry({ net_add: 2, tl_status: 'GREEN', retention_pct: 80, member_score: 80, meetings_total: 0, visit_done: true, ltrt_attended: true }, sdcS);
assert.equal(nm.max_total, 80); assert.equal(nm.total_scaled, 100);
// hints
const sh = nextSdcBandHints({ net_add: 3, tl_status: 'AMBER', retention_pct: 0, member_score: 65, meetings_total: 4, telebridge_weeks: 3, palms_weeks: 4, visit_done: false, ltrt_attended: true }, sdcS);
assert.equal(sh.next, 'Amber'); assert.equal(sh.hints[0].kpi, 'traffic_light'); assert.equal(sh.hints[0].gain_scaled, 15);
// Traffic Lights parser (rows as produced by SheetJS sheet_to_json header:1)
const tl = parseTrafficLights([
  ['ALL INDIA CHAPTER TRAFFIC LIGHTS - Sept 2026'], [],
  ['Region', 'Chapter', 'Members', 'Growth', 'Retention', 'Referrals / Member', 'Visitors', 'Conversion', 'Attendance', 'Score', 'Status', 'Rank'],
  ['Tirunelveli', 'BNI Ainthinai', 102, 18, 84, 1.94, 6.42, 13.77, 96.13, 95, 'GREEN', 44],
  ['Nagercoil & Tuticorin', 'BNI Comorin.', 40, -11, 0.5, 1, 3, 20, 90, 45, 'Red', 1200],
], '2026-09');
assert.equal(tl.rows.length, 2); assert.equal(tl.rows[0].key, 'ainthinai'); assert.equal(tl.rows[0].status, 'GREEN'); assert.equal(tl.rows[0].score, 95); assert.equal(tl.rows[0].growth, 18);
assert.equal(tl.rows[1].key, 'comorin'); assert.equal(tl.rows[1].status, 'RED');
// status derived from score when the sheet has no Status column
const tl2 = parseTrafficLights([['Chapter Name', 'Score'], ['BNI Kanya', 72], ['BNI Kings', 55], ['BNI Saral', 30]], '2026-09');
assert.deepEqual(tl2.rows.map(r => r.status), ['GREEN', 'AMBER', 'RED']);
console.log('SDC checks passed ✓');

// ---------- PALMS from the Friday "Last Meeting Entered" report ----------
import { parsePalmsStatus, readDate } from '../api/_lib/parsers.js';
import { palmsFromReport } from '../api/_lib/scoring_sdc.js';
assert.equal(readDate('Oct 16, 2026'), '2026-10-16'); assert.equal(readDate('16 Oct 2026'), '2026-10-16'); assert.equal(readDate('16/10/2026'), '2026-10-16'); assert.equal(readDate('Sept 9, 2026'), '2026-09-09');
const pasted = `Region Name\tChapter Name\tLast Meeting Entered
Nagercoil & Tuticorin\tBNI Comorin\tOct 16, 2026
Nagercoil & Tuticorin\tBNI Kanya\tOct 13, 2026
Tirunelveli\tBNI Bamboo Kottai\tOct 14, 2026
Tirunelveli\tBNI Dil Nadu\tOct 9, 2026
Tirunelveli BNI Cmy Veli Oct 15, 2026`;
const pr = parsePalmsStatus(pasted);
assert.deepEqual(pr.map(r => [r.key, r.last]), [['comorin', '2026-10-16'], ['kanya', '2026-10-13'], ['bambookottai', '2026-10-14'], ['dilnadu', '2026-10-09'], ['cmyveli', '2026-10-15']]);
const wk = [
  { id: 1, chapter_id: 12, week_date: '2026-10-09' }, { id: 2, chapter_id: 12, week_date: '2026-10-16' },   // Comorin Fri
  { id: 3, chapter_id: 11, week_date: '2026-10-13' },                                                       // Kanya Tue
  { id: 4, chapter_id: 2, week_date: '2026-10-14', no_meeting: true },                                      // Bamboo Kottai Wed, holiday
  { id: 5, chapter_id: 4, week_date: '2026-10-16' },                                                        // Dil Nadu Fri, last entered 9 Oct = late
];
const res = palmsFromReport(wk, pr, { comorin: 12, kanya: 11, bambookottai: 2, dilnadu: 4 }, '2026-10-16');
assert.deepEqual(res.updates.map(u => [u.week_id, u.palms_done]), [[2, true], [3, true], [5, false]]);
assert.deepEqual(res.skipped.map(s => s.chapter), ['BNI Bamboo Kottai', 'BNI Cmy Veli']);
console.log('PALMS report checks passed ✓');

// ---------- Tele-Bridge 48h deadline ----------
import { telebridgeDeadlineUtc, zonedToUtcMs, istLabel } from '../api/_lib/scoring_sdc.js';
const dl = telebridgeDeadlineUtc('2026-10-20'); // Ainthinai Tue 20 Oct -> Thu 22 Oct 09:30 IST
assert.equal(new Date(dl).toISOString(), '2026-10-22T04:00:00.000Z'); assert.equal(istLabel(dl), '22 Oct, 09:30');
assert.equal(telebridgeDeadlineUtc('2026-10-30'), Date.UTC(2026, 10, 1, 4, 0)); // month rollover: 1 Nov 09:30 IST
assert.equal(zonedToUtcMs('2026-10-22 09:29:00', 'Asia/Kolkata') <= dl, true);
assert.equal(zonedToUtcMs('2026-10-22 09:31:00', 'Asia/Kolkata') <= dl, false);
// Jotform account on US Eastern: 21 Oct 23:59 EDT = 22 Oct 09:29 IST -> on time; 22 Oct 00:05 EDT = 09:35 IST -> late
assert.equal(zonedToUtcMs('2026-10-21 23:59:00', 'America/New_York') <= dl, true);
assert.equal(zonedToUtcMs('2026-10-22 00:05:00', 'America/New_York') <= dl, false);
console.log('Tele-Bridge deadline checks passed ✓');

// ---------- Membership Activity by Chapter (net growth source) ----------
import { parseMembershipActivity } from '../api/_lib/parsers.js';
const ma1 = parseMembershipActivity(F('membership-activity-tirunelveli-sep2026.xls'));
assert.equal(ma1.region, 'Tirunelveli'); assert.equal(ma1.month, '2026-09'); assert.equal(ma1.rows.length, 8);
assert.deepEqual(ma1.rows.find(r => r.key === 'ainthinai'), { chapter: 'BNI Ainthinai', key: 'ainthinai', start: 100, joined: 2, left: 0, end: 102, change: 2 });
assert.deepEqual(ma1.rows.find(r => r.key === 'bambookottai'), { chapter: 'BNI Bamboo Kottai', key: 'bambookottai', start: 62, joined: 0, left: 1, end: 61, change: -1 });
const ma2 = parseMembershipActivity(F('membership-activity-nagercoil-tuticorin-sep2026.xls'));
assert.equal(ma2.region, 'Nagercoil & Tuticorin'); assert.equal(ma2.rows.length, 6);
assert.deepEqual(['kings', 'nanjil'].map(k => { const r = ma2.rows.find(x => x.key === k); return [r.joined, r.left, r.change, r.end]; }), [[0, 8, -8, 38], [3, 2, 1, 47]]);
for (const r of [...ma1.rows, ...ma2.rows]) assert.equal(r.change, r.joined - r.left);
assert.throws(() => parseMembershipActivity(F('chapter-statistics-tirunelveli-sep2026.xls')), /not a Membership Activity/);
console.log('Membership Activity checks passed ✓');

// ---------- Real All India Traffic Lights export (Sept 2026): two score columns, repeated chapter names, no colour column ----------
const tlReal = JSON.parse(F('traffic-lights-sep2026-rows.json'));
const tr = parseTrafficLights(tlReal, null, ['Tirunelveli', 'Nagercoil & Tuticorin']);
assert.equal(tr.month, '2026-09'); assert.match(tr.score_column, /Sept 2026/);
assert.equal(tr.rows.length, 14);                                  // only our two regions
const byK = Object.fromEntries(tr.rows.map(r => [r.key, r]));
assert.equal(byK.kings.region, 'Nagercoil & Tuticorin'); assert.equal(byK.kings.score, 55); assert.equal(byK.kings.status, 'AMBER'); // not Tirupur's / Kottayam's Kings
assert.equal(byK.ainthinai.score, 95); assert.equal(byK.ainthinai.status, 'GREEN');
assert.equal(byK.dilnadu.score, 90);                               // Sept column, not Aug (65)
assert.equal(byK.tamilan.status, 'GREEN'); assert.equal(byK.saral.status, 'AMBER'); assert.equal(byK.comorin.score, 60);
assert.equal(tr.rows.filter(r => r.status === 'GREEN').length, 9);
assert.equal(parseTrafficLights(tlReal, '2026-08', ['Tirunelveli', 'Nagercoil & Tuticorin']).rows.find(r => r.key === 'dilnadu').score, 65); // explicit month picks Aug
console.log('Real Traffic Lights checks passed ✓');
