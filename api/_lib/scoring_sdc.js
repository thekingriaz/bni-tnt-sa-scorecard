// SDC (Support Director Consultant) scoring engine. Pure functions, mirrors scoring.js.
import { DEFAULT_SETTINGS, bandFor } from './scoring.js';

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
    ltrt:          e.ltrt_attended ? mp.ltrt : 0,
  };
  // A month with no meetings held at all (all weeks marked "no meeting"): the two weekly KPIs drop out and the rest is scaled.
  const weeklyApplies = meetings > 0 || e.legacy;
  const maxTotal = Object.entries(mp).filter(([k]) => weeklyApplies || (k !== 'telebridge' && k !== 'palms')).reduce((a, [, v]) => a + v, 0);
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
    meetings_total: meetings,
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
  if (p.retention < mp.retention) {
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
  if (!entry.ltrt_attended) hints.push({ kpi: 'ltrt', gain_raw: mp.ltrt, action: 'Attend the LTRT / DCRT this month' });
  for (const h of hints) h.gain_scaled = toScaled(h.gain_raw);
  hints.sort((a, b) => b.gain_scaled - a.gain_scaled);
  return { next: next.label, next_emoji: next.emoji, next_min: next.min, gap, hints };
}
