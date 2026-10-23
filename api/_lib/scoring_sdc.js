// SDC (Support Director Consultant) scoring engine. Pure functions, mirrors scoring.js.
import { DEFAULT_SETTINGS, bandFor } from './scoring.js';
import { attendancePoints } from './parsers.js';

export const SDC_DEFAULTS = {
  sdc_commission_pct: 7.5,     // % of fee_amount per member paid (fee_amount shared with SAs)
  sdc_thresholds: {
    net_growth: [{ min: 2, pts: 20 }, { min: 1, pts: 10 }],
    retention:  [{ min: 80, pts: 20 }, { min: 70, pts: 10 }],
    member:     [{ min: 80, pts: 10 }, { min: 70, pts: 5 }],
  },
  sdc_max_pts: { net_growth: 20, traffic_light: 15, retention: 20, member: 10, telebridge: 10, palms: 10, visit: 10, ltrt: 5 },
  visit_hours_limit: 24,
};

export const SDC_KPI_LABEL = {
  net_growth: 'Chapter Net Growth', traffic_light: 'All India Traffic Light', retention: 'Overall Renewal Rate',
  member: 'Your Member Score', telebridge: 'Weekly Tele-Bridge with LT', palms: 'PALMS on time', visit: 'Chapter Visit (within 24 h)', ltrt: 'LTRT / DCRT',
};

export function mergeSdcSettings(stored) {
  const s = JSON.parse(JSON.stringify(SDC_DEFAULTS));
  for (const k of Object.keys(stored || {})) if (stored[k] !== null && stored[k] !== undefined) s[k] = stored[k];
  if (!s.fee_amount) s.fee_amount = DEFAULT_SETTINGS.fee_amount;
  if (!s.bands) s.bands = DEFAULT_SETTINGS.bands;
  return s;
}

function tier(value, tiers) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return 0;
  const v = Number(value);
  for (const t of tiers) if (v >= t.min) return t.pts;
  return 0;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const dowName = d => DOW[d] ?? '';

/** All dates (YYYY-MM-DD) in month ym that fall on weekday dow (0 = Sun). */
export function meetingDates(ym, dow) {
  const [y, m] = ym.split('-').map(Number);
  if (dow === null || dow === undefined || !y || !m) return [];
  const out = [];
  const d = new Date(Date.UTC(y, m - 1, 1));
  while (d.getUTCMonth() === m - 1) {
    if (d.getUTCDay() === Number(dow)) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
export const meetingsInMonth = (ym, dow) => meetingDates(ym, dow).length;

/** Summarises sdc_weeks rows for one chapter-month into counts. */
export function weekCounts(weeks) {
  const w = weeks || [];
  const held = w.filter(x => !x.no_meeting);
  return {
    calendar: w.length,
    meetings_total: held.length,
    telebridge_weeks: held.filter(x => x.telebridge_done === true).length,
    palms_weeks: held.filter(x => x.palms_done === true).length,
    telebridge_pending: held.filter(x => x.telebridge_done === null || x.telebridge_done === undefined).length,
    palms_pending: held.filter(x => x.palms_done === null || x.palms_done === undefined).length,
  };
}

/** Points for a "weeks done out of meetings" KPI, one decimal, capped at max. */
export function weeklyPts(done, total, max) {
  if (!total) return 0;
  return Math.min(max, Math.round((Number(done || 0) / total) * max * 10) / 10);
}

/**
 * entry fields: net_add (effective, may be null), tl_status, retention_pct, member_score,
 *  meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, members_paid
 */
export function scoreSdcEntry(entry, settings) {
  const s = mergeSdcSettings(settings);
  const e = entry || {};
  const mp = s.sdc_max_pts;
  const meetings = Number(e.meetings_total || 0);
  const pts = {
    net_growth:    tier(e.net_add, s.sdc_thresholds.net_growth),
    traffic_light: String(e.tl_status || '').toUpperCase() === 'GREEN' ? mp.traffic_light : 0,
    retention:     tier(e.retention_pct, s.sdc_thresholds.retention),
    member:        tier(e.member_score, s.sdc_thresholds.member),
    telebridge:    weeklyPts(e.telebridge_weeks, meetings, mp.telebridge),
    palms:         weeklyPts(e.palms_weeks, meetings, mp.palms),
    visit:         e.visit_done ? mp.visit : 0,
    ltrt:          attendancePoints(e, mp.ltrt),
  };
  // A month with no meetings held at all (all weeks marked "no meeting"): the two weekly KPIs drop out and the rest is scaled.
  const weeklyApplies = meetings > 0 || e.legacy;
  // Chapter under 12 months: BNI publishes no Overall Retention, so Renewal Rate is not applicable and the rest is scaled.
  const retentionApplies = !e.retention_na;
  if (!retentionApplies) pts.retention = 0;
  const maxTotal = Object.entries(mp).filter(([k]) => (weeklyApplies || (k !== 'telebridge' && k !== 'palms')) && (retentionApplies || k !== 'retention')).reduce((a, [, v]) => a + v, 0);
  const raw = Math.round(Object.values(pts).reduce((a, b) => a + b, 0) * 10) / 10;
  const scaled = maxTotal > 0 ? Math.round((raw / maxTotal) * 100 * 100) / 100 : 0;
  const band = bandFor(scaled, s);

  const members = Number(e.members_paid || 0);
  const perMember = Number(s.fee_amount) * Number(s.sdc_commission_pct) / 100;
  const basePayout = members * perMember;
  const payout = Math.round(basePayout * band.multiplier);

  return {
    points: pts, total_raw: raw, max_total: maxTotal, total_scaled: scaled,
    band: band.label, band_emoji: band.emoji, band_name: band.name, multiplier: band.multiplier,
    members_paid: members, per_member_commission: Math.round(perMember * 100) / 100, base_payout: Math.round(basePayout), payout,
    meetings_total: meetings, retention_na: !retentionApplies,
  };
}

/** "What do I need to reach the next band" hints for SDCs. */
export function nextSdcBandHints(entry, settings) {
  const s = mergeSdcSettings(settings);
  const cur = scoreSdcEntry(entry, s);
  const next = [...s.bands].reverse().find(b => b.min > cur.total_scaled);
  if (!next) return { next: null, gap: 0, hints: [] };
  const gap = Math.round((next.min - cur.total_scaled) * 100) / 100;
  const mp = s.sdc_max_pts, p = cur.points, hints = [];
  const toScaled = raw => Math.round((raw / cur.max_total) * 100 * 100) / 100;
  if (p.net_growth < mp.net_growth) {
    const need = p.net_growth === 0 ? 1 : 2;
    hints.push({ kpi: 'net_growth', gain_raw: tier(need, s.sdc_thresholds.net_growth) - p.net_growth, action: `Get the chapter to net +${need} this month (now ${entry.net_add ?? 0})` });
  }
  if (p.traffic_light < mp.traffic_light) hints.push({ kpi: 'traffic_light', gain_raw: mp.traffic_light, action: `Bring the chapter to GREEN on the All India Traffic Lights (now ${entry.tl_status || 'not set'})` });
  if (!entry.retention_na && p.retention < mp.retention) {
    const nt = [...s.sdc_thresholds.retention].reverse().find(t => t.min > Number(entry.retention_pct || 0));
    if (nt) hints.push({ kpi: 'retention', gain_raw: nt.pts - p.retention, action: `Push overall renewal rate to ${nt.min}%+ (now ${entry.retention_pct ?? 0}%)` });
  }
  if (p.member < mp.member) {
    const nt = [...s.sdc_thresholds.member].reverse().find(t => t.min > Number(entry.member_score || 0));
    if (nt) hints.push({ kpi: 'member', gain_raw: nt.pts - p.member, action: `Raise your own Traffic Light score to ${nt.min}+ (now ${entry.member_score ?? 0})` });
  }
  const meetings = Number(entry.meetings_total || 0);
  if (meetings && p.telebridge < mp.telebridge) hints.push({ kpi: 'telebridge', gain_raw: mp.telebridge - p.telebridge, action: `Do the Tele-Bridge call every meeting week (${entry.telebridge_weeks || 0} of ${meetings} done)` });
  if (meetings && p.palms < mp.palms) hints.push({ kpi: 'palms', gain_raw: mp.palms - p.palms, action: `Get PALMS submitted on time every week (${entry.palms_weeks || 0} of ${meetings} on time)` });
  if (!entry.visit_done) hints.push({ kpi: 'visit', gain_raw: mp.visit, action: 'Visit the chapter and submit the Chapter Visit Report within 24 hours' });
  if (p.ltrt < mp.ltrt) hints.push({ kpi: 'ltrt', gain_raw: mp.ltrt - p.ltrt, action: 'Attend both the LTRT and the DCRT this month' });
  for (const h of hints) h.gain_scaled = toScaled(h.gain_raw);
  hints.sort((a, b) => b.gain_scaled - a.gain_scaled);
  return { next: next.label, next_emoji: next.emoji, next_min: next.min, gap, hints };
}

/**
 * PALMS on time from a Friday "Last Meeting Entered" report.
 * For each chapter, the week checked is its meeting date in the 7 days ending on the report date (asOf).
 * On time = the last meeting entered on BNI Connect is that meeting date or later.
 * weeks: sdc_weeks rows ({id, chapter_id, week_date, no_meeting}); rows: parsePalmsStatus output; keyToChapterId: {key: id}.
 * Returns { updates: [{week_id, chapter_id, week_date, palms_done, last}], skipped: [{chapter, reason}] }.
 */
export function palmsFromReport(weeks, rows, keyToChapterId, asOf) {
  const day = d => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  const end = day(asOf), start = end - 6 * 86400000;
  const updates = [], skipped = [];
  for (const r of rows) {
    const chId = keyToChapterId[r.key];
    if (!chId) { skipped.push({ chapter: r.chapter, reason: 'chapter not in the app' }); continue; }
    const w = (weeks || []).find(x => x.chapter_id === chId && day(String(x.week_date)) >= start && day(String(x.week_date)) <= end);
    if (!w) { skipped.push({ chapter: r.chapter, reason: 'no meeting of this month in the week ending ' + asOf }); continue; }
    if (w.no_meeting) { skipped.push({ chapter: r.chapter, reason: 'week marked no meeting' }); continue; }
    updates.push({ week_id: w.id, chapter_id: chId, week_date: String(w.week_date), palms_done: day(r.last) >= day(String(w.week_date)), last: r.last });
  }
  return { updates, skipped };
}

// ---------- Tele-Bridge 48-hour deadline ----------
export const TELEBRIDGE_DEADLINE = { days: 2, time: '09:30', tz_offset_min: 330 }; // meeting date + 2 days, 09:30 IST

/** UTC ms of the Tele-Bridge deadline for a meeting date (YYYY-MM-DD). */
export function telebridgeDeadlineUtc(weekDate, rule = TELEBRIDGE_DEADLINE) {
  const [y, m, d] = String(weekDate).slice(0, 10).split('-').map(Number);
  const [hh, mm] = rule.time.split(':').map(Number);
  return Date.UTC(y, m - 1, d + rule.days, hh, mm) - rule.tz_offset_min * 60000;
}

/** Offset (ms) of an IANA time zone from UTC at a given instant. */
function tzOffsetMs(ms, tz) {
  const p = {}; for (const x of new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms))) p[x.type] = x.value;
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
}
/** "YYYY-MM-DD HH:MM:SS" wall-clock time in zone tz -> UTC ms. */
export function zonedToUtcMs(str, tz) {
  const [d, t = '00:00:00'] = String(str).trim().split(/[ T]/);
  const [y, mo, da] = d.split('-').map(Number); const [h, mi, se = 0] = t.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, da, h, mi, se);
  if (!tz) return guess;
  let utc = guess - tzOffsetMs(guess, tz);
  const off2 = tzOffsetMs(utc, tz); if (guess - off2 !== utc) utc = guess - off2; // DST edge
  return utc;
}
/** UTC ms -> "DD Mon, HH:MM" in IST, for display. */
export function istLabel(ms) {
  const d = new Date(ms + 330 * 60000);
  return `${String(d.getUTCDate()).padStart(2, '0')} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
