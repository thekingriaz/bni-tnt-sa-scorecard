// Shared scoring engine for the BNI TNT SA Scorecard.
// Pure functions. Used by the API (and copied verbatim into the frontend for live previews).

export const DEFAULT_SETTINGS = {
  go_live_ym: '2026-10',      // first scored month for both programmes; earlier months are baseline only (never shown, never published)
  fee_amount: 49040,          // ₹ per member (new or renewal)
  commission_pct: 2.5,        // % of fee_amount per member
  mentoring_enabled: false,   // paused: score out of 80, scaled to 100
  one_to_one_threshold: 8.66, // 1-2-1 per member per month (2 per week × 4.33)
  online_event_types: [],     // event types from the Training report counted as "online"
  thresholds: {
    member:    [{ min: 80, pts: 10 }, { min: 70, pts: 5 }],
    training:  [{ min: 20, pts: 20 }, { min: 15, pts: 15 }, { min: 10, pts: 10 }],
    mentoring: [{ min: 85, pts: 20 }, { min: 75, pts: 10 }, { min: 70, pts: 5 }],
    retention: [{ min: 75, pts: 25 }, { min: 70, pts: 15 }],
  },
  max_pts: { member: 10, training: 20, mentoring: 20, retention: 25, one_to_one: 10, ltrt: 5, visit: 10 },
  bands: [
    { min: 85, label: 'Gold',   emoji: '🏆', name: 'Exceptional',       multiplier: 1.00 },
    { min: 70, label: 'Green',  emoji: '✅', name: 'On Track',          multiplier: 0.80 },
    { min: 55, label: 'Amber',  emoji: '🟡', name: 'Needs Improvement', multiplier: 0.60 },
    { min: 40, label: 'Red',    emoji: '🔴', name: 'Underperforming',   multiplier: 0.35 },
    { min: 0,  label: 'Review', emoji: '⚠️', name: 'At Risk',           multiplier: 0.15 },
  ],
};

function attendancePts(e, max) { // LTRT / DCRT: meetings held share the points equally; else the single manual flag
  const held = ['ltrt_att', 'dcrt_att'].filter(k => e[k] === true || e[k] === false);
  if (held.length) return Math.round(held.filter(k => e[k] === true).length / held.length * max * 10) / 10;
  return e.ltrt_attended ? max : 0;
}

export function mergeSettings(stored) {
  const s = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  for (const k of Object.keys(stored || {})) {
    if (stored[k] !== null && stored[k] !== undefined) s[k] = stored[k];
  }
  return s;
}

function tier(value, tiers) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 0;
  const v = Number(value);
  for (const t of tiers) if (v >= t.min) return t.pts;
  return 0;
}

export function bandFor(scaled, settings) {
  const s = settings || DEFAULT_SETTINGS;
  for (const b of s.bands) if (scaled >= b.min) return b;
  return s.bands[s.bands.length - 1];
}

/**
 * entry fields (all optional / nullable):
 *  member_score, online_pct, offline_pct, mentoring_pct, retention_pct,
 *  one_to_one_per_member, ltrt_attended (bool), jotform_done (bool),
 *  new_members, renewals
 */
export function scoreEntry(entry, settings) {
  const s = settings || DEFAULT_SETTINGS;
  const e = entry || {};
  const online = Number(e.online_pct || 0);
  const offline = Number(e.offline_pct || 0);
  const combined = online + offline;

  const pts = {
    member:     tier(e.member_score, s.thresholds.member),
    training:   tier(combined, s.thresholds.training),
    mentoring:  s.mentoring_enabled ? tier(e.mentoring_pct, s.thresholds.mentoring) : 0,
    retention:  e.retention_na ? 0 : tier(e.retention_pct, s.thresholds.retention),
    one_to_one: (e.one_to_one_per_member !== null && e.one_to_one_per_member !== undefined &&
                 Number(e.one_to_one_per_member) >= Number(s.one_to_one_threshold)) ? s.max_pts.one_to_one : 0,
    ltrt:       attendancePts(e, s.max_pts.ltrt),
    visit:      e.jotform_done ? s.max_pts.visit : 0,
  };

  const maxTotal = Object.entries(s.max_pts)
    .filter(([k]) => k !== 'mentoring' || s.mentoring_enabled)
    .filter(([k]) => k !== 'retention' || !e.retention_na) // chapter under 12 months: no 1st-year retention on the 3+1 report
    .reduce((a, [, v]) => a + v, 0);

  const raw = Math.round(Object.values(pts).reduce((a, b) => a + b, 0) * 10) / 10;
  const scaled = maxTotal > 0 ? Math.round((raw / maxTotal) * 100 * 100) / 100 : 0;
  const band = bandFor(scaled, s);

  const members = Number(e.new_members || 0) + Number(e.renewals || 0);
  const perMember = Number(s.fee_amount) * Number(s.commission_pct) / 100;
  const basePayout = members * perMember;
  const payout = Math.round(basePayout * band.multiplier);

  return {
    points: pts,
    combined_training_pct: Math.round(combined * 100) / 100,
    total_raw: raw,
    max_total: maxTotal,
    total_scaled: scaled,
    band: band.label,
    band_emoji: band.emoji,
    band_name: band.name,
    multiplier: band.multiplier,
    members_paid: members,
    per_member_commission: Math.round(perMember * 100) / 100,
    base_payout: Math.round(basePayout),
    payout,
  };
}

/** "What do I need to reach the next band" hints. Returns array of {kpi, gain_raw, gain_scaled, action}. */
export function nextBandHints(entry, settings) {
  const s = settings || DEFAULT_SETTINGS;
  const cur = scoreEntry(entry, s);
  const next = [...s.bands].reverse().find(b => b.min > cur.total_scaled);
  if (!next) return { next: null, gap: 0, hints: [] };
  const gapScaled = Math.round((next.min - cur.total_scaled) * 100) / 100;
  const hints = [];
  const toScaled = raw => Math.round((raw / cur.max_total) * 100 * 100) / 100;
  const p = cur.points;

  if (!entry.jotform_done) hints.push({ kpi: 'visit', gain_raw: s.max_pts.visit, action: 'Submit the Chapter Visit Report on Jotform this month' });
  if (p.ltrt < s.max_pts.ltrt) hints.push({ kpi: 'ltrt', gain_raw: s.max_pts.ltrt - p.ltrt, action: 'Attend both the LTRT and the DCRT this month' });
  if (p.one_to_one < s.max_pts.one_to_one) {
    hints.push({ kpi: 'one_to_one', gain_raw: s.max_pts.one_to_one,
      action: `Lift chapter 1-2-1s to ${s.one_to_one_threshold} per member per month (now ${entry.one_to_one_per_member ?? 0})` });
  }
  if (p.member < s.max_pts.member) {
    const need = p.member === 0 ? s.thresholds.member[s.thresholds.member.length - 1].min : s.thresholds.member[0].min;
    hints.push({ kpi: 'member', gain_raw: tier(need, s.thresholds.member) - p.member, action: `Raise your own Traffic Light score to ${need}+ (now ${entry.member_score ?? 0})` });
  }
  if (p.training < s.max_pts.training) {
    const combined = Number(entry.online_pct || 0) + Number(entry.offline_pct || 0);
    const nextTier = [...s.thresholds.training].reverse().find(t => t.min > combined);
    if (nextTier) hints.push({ kpi: 'training', gain_raw: nextTier.pts - p.training, action: `Get ${nextTier.min}%+ of members into a training (now ${Math.round(combined * 10) / 10}%)` });
  }
  if (!entry.retention_na && p.retention < s.max_pts.retention) {
    const nextTier = [...s.thresholds.retention].reverse().find(t => t.min > Number(entry.retention_pct || 0));
    if (nextTier) hints.push({ kpi: 'retention', gain_raw: nextTier.pts - p.retention, action: `Push 1st-year retention to ${nextTier.min}%+ (now ${entry.retention_pct ?? 0}%)` });
  }
  if (s.mentoring_enabled && p.mentoring < s.max_pts.mentoring) {
    const nextTier = [...s.thresholds.mentoring].reverse().find(t => t.min > Number(entry.mentoring_pct || 0));
    if (nextTier) hints.push({ kpi: 'mentoring', gain_raw: nextTier.pts - p.mentoring, action: `Get mentoring completion to ${nextTier.min}%+` });
  }
  for (const h of hints) h.gain_scaled = toScaled(h.gain_raw);
  hints.sort((a, b) => b.gain_scaled - a.gain_scaled);
  return { next: next.label, next_emoji: next.emoji, next_min: next.min, gap: gapScaled, hints };
}
