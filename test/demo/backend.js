// In-browser fake backend for the shareable demo. Intercepts fetch('/api/...') and answers from invented October 2026 data.
// Uses the real scoring engines, so every score, band and payout is computed exactly as on the live app.
import { scoreEntry, nextBandHints, DEFAULT_SETTINGS } from '../../api/_lib/scoring.js';
import { scoreSdcEntry, nextSdcBandHints, meetingDates, weekCounts, mergeSdcSettings, dowName } from '../../api/_lib/scoring_sdc.js';

const YM = '2026-10';
const NAMES = ['BNI Ainthinai', 'BNI Bamboo Kottai', 'BNI Cmy Veli', 'BNI Dil Nadu', 'BNI Tamilan', 'BNI Ejamaan', 'BNI Thamira', 'BNI Saral', 'BNI Korkai', 'BNI Nanjil', 'BNI Kanya', 'BNI Comorin', 'BNI Kumari', 'BNI Kings'];
const MD = [2, 3, 4, 5, 2, 3, 4, 4, 2, 4, 2, 5, 3, 2];
const chapters = NAMES.map((name, i) => ({ id: i + 1, name, key: name.toLowerCase().replace(/^bni\s+/, '').replace(/[^a-z0-9]/g, ''), region: i < 8 ? 'Tirunelveli' : 'Nagercoil & Tuticorin', sort_order: i + 1, meeting_day: MD[i], active: true }));

// Invented people (demo only)
const SA_NAMES = ['Arun Prakash', 'Deepa Raman', 'Karthik Selvam', 'Fathima Begum', 'Gokul Nathan', 'Hari Krishnan', 'Indira Devi', 'Jagan Mohan', 'Kavitha Murugan', 'Lakshman Rao', 'Meena Sundar', 'Naveen Joseph', 'Priya Anand', 'Rahul Dev'];
const SDC_NAMES = ['Sathish Kumar', 'Tharun Raj', 'Uma Shankar', 'Vasanth Babu', 'Yasmin Banu', 'Anand Vel', 'Bala Murali', 'Chitra Lekha', 'Dinesh Pandian', 'Elango Ravi', 'Ganesh Moorthy', 'Hema Latha', 'Imran Khan', 'Jeeva Rathinam'];
const sas = chapters.map((c, i) => ({ id: 100 + i, role: 'sa', name: SA_NAMES[i], chapter_id: c.id, active: true, chapter: { name: c.name } }));
const sdcs = chapters.map((c, i) => ({ id: 200 + i, role: 'sdc', name: SDC_NAMES[i], chapter_id: c.id, active: true, chapter: { name: c.name } }));

const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
settings.go_live_ym = YM;
const sdcSettings = () => mergeSdcSettings({ ...settings, sdc_commission_pct: 7.5 });

// SA October: [member, online%, offline%, trained, members, retention(null = under 12 months), 1-2-1, LTRT, DCRT, visit, new, renewals]
const SA_ROWS = [
  [92, 12, 10, 22, 100, 78, 9.4, true, true, true, 4, 6],
  [85, 9, 8, 10, 60, 72, 9.0, true, true, true, 1, 3],
  [78, 6, 5, 4, 40, 75, 7.2, false, true, true, 0, 2],
  [88, 10, 12, 13, 60, 50, 8.9, true, true, false, 2, 4],
  [74, 8, 4, 5, 42, 70, 8.7, true, false, true, 1, 2],
  [95, 15, 9, 7, 29, 80, 10.1, true, true, true, 2, 1],
  [66, 10, 4, 4, 29, 59.3, 6.0, true, false, false, 0, 1],
  [82, 11, 9, 10, 52, null, 8.8, true, true, false, 3, 0],
  [90, 10, 8, 9, 51, 84.6, 9.2, true, true, true, 1, 5],
  [72, 7, 5, 6, 47, 57.1, 8.0, true, true, true, 0, 2],
  [80, 9, 7, 12, 72, 70, 8.7, true, true, false, 1, 3],
  [76, 6, 6, 4, 37, 75, 7.8, true, false, true, 0, 1],
  [70, 4, 4, 2, 29, 75, 8.0, true, false, true, 1, 1],
  [79, 8, 6, 5, 38, null, 9.0, true, true, true, 0, 2],
];
const months = { [YM]: { ym: YM, status: 'published', uploads: [], entries: SA_ROWS.map((r, i) => ({ id: 20261000 + i, chapter_id: i + 1, sa_user_id: 100 + i, legacy: false,
  member_score: r[0], online_pct: r[1], offline_pct: r[2], training_unique: r[3], member_count: r[4], retention_pct: r[5], retention_na: r[5] === null, one_to_one_per_member: r[6],
  ltrt_att: r[7], dcrt_att: r[8], jotform_done: r[9], jotform_auto: true, new_members: r[10], renewals: r[11], new_2y: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0][i], ren_2y: [2, 1, 0, 1, 0, 0, 0, 0, 2, 0, 1, 0, 0, 1][i], notes: null })) } };

// SDC October: [joined, left, TL score, overall retention(null = n/a), member, visit, LTRT, DCRT, Tele-Bridge misses, PALMS misses]
const SDC_ROWS = [
  [4, 1, 95, 83.5, 90, true, true, true, 0, 0], [2, 1, 80, 84.9, 82, true, true, true, 1, 0], [1, 2, 65, 86.7, 76, false, false, true, 2, 1],
  [3, 0, 90, 79.7, 88, true, true, true, 0, 0], [1, 1, 70, 72, 74, true, true, true, 1, 1], [2, 0, 80, 78.3, 85, true, true, true, 0, 1],
  [0, 2, 80, 76, 68, false, true, false, 3, 2], [3, 1, 65, null, 80, true, true, true, 0, 0], [2, 0, 90, 90.5, 92, true, true, true, 0, 0],
  [1, 0, 80, 68.6, 75, true, true, true, 1, 0], [1, 1, 80, 78.4, 80, false, true, true, 0, 1], [0, 3, 60, 68.1, 66, false, true, false, 2, 2],
  [1, 2, 65, 75, 70, true, true, false, 1, 0], [2, 1, 71, 78, 78, true, true, true, 0, 0],
];
const tlOf = s => s >= 70 ? 'GREEN' : s >= 50 ? 'AMBER' : s >= 30 ? 'RED' : 'GREY';
function makeSdcMonth(ym, filled) {
  const weeks = []; let wid = 1;
  const entries = chapters.map((c, i) => {
    const r = SDC_ROWS[i]; const dates = meetingDates(ym, c.meeting_day);
    dates.forEach((d, k) => weeks.push({ id: Number(ym.replace('-', '')) * 1000 + wid++, chapter_id: c.id, week_date: d, no_meeting: false,
      telebridge_done: filled ? k >= r[8] : null, telebridge_auto: filled, palms_done: filled ? k >= r[9] : null }));
    return { id: Number(ym.replace('-', '')) * 100 + 50 + i, chapter_id: c.id, sdc_user_id: 200 + i, legacy: false,
      joined: filled ? r[0] : null, left_count: filled ? r[1] : null, net_add: filled ? r[0] - r[1] : null, net_add_auto: filled, member_count: SA_ROWS[i][4],
      tl_status: filled ? tlOf(r[2]) : null, tl_score: filled ? r[2] : null, tl_auto: filled, retention_pct: filled ? r[3] : null, retention_na: filled && r[3] === null,
      member_score: filled ? r[4] : null, visit_done: filled ? r[5] : null, visit_auto: filled, ltrt_att: filled ? r[6] : null, dcrt_att: filled ? r[7] : null, notes: null };
  });
  return { ym, sdc_status: filled ? 'published' : 'draft', entries, weeks, uploads: [] };
}
const sdcMonths = { [YM]: makeSdcMonth(YM, true) };

function loadMonth(ym) {
  const m = months[ym]; if (!m) return null;
  const rows = m.entries.map(e => ({ ...e, chapter: chapters[e.chapter_id - 1], sa: sas.find(s => s.id === e.sa_user_id), computed: scoreEntry(e, settings) }));
  [...rows].sort((a, b) => b.computed.total_scaled - a.computed.total_scaled).forEach((r, i) => r.computed.rank = i + 1);
  const avg = Math.round(rows.reduce((a, r) => a + r.computed.total_scaled, 0) / rows.length * 100) / 100;
  return { month: { ym, status: m.status, id: ym }, entries: rows, region_avg: avg, settings, uploads: m.uploads, go_live_ym: YM };
}
function loadSdcMonth(ym) {
  const m = sdcMonths[ym]; if (!m) return null; const sa = months[ym];
  const rows = m.entries.map(e => {
    const w = m.weeks.filter(x => x.chapter_id === e.chapter_id); const saE = sa?.entries.find(x => x.chapter_id === e.chapter_id);
    const eff = { ...e, ...weekCounts(w), prev_member_count: e.member_count != null && e.net_add != null ? e.member_count - e.net_add : null, net_add_derived: null,
      members_paid: (saE?.new_members || 0) + (saE?.renewals || 0), new_members: saE?.new_members ?? null, renewals: saE?.renewals ?? null, new_2y: saE?.new_2y ?? 0, ren_2y: saE?.ren_2y ?? 0 };
    return { ...eff, weeks: w, chapter: chapters[e.chapter_id - 1], sdc: sdcs.find(s => s.id === e.sdc_user_id), computed: scoreSdcEntry(eff, sdcSettings()) };
  });
  [...rows].sort((a, b) => b.computed.total_scaled - a.computed.total_scaled).forEach((r, i) => r.computed.rank = i + 1);
  const avg = Math.round(rows.reduce((a, r) => a + r.computed.total_scaled, 0) / rows.length * 100) / 100;
  return { month: { ym, status: months[ym]?.status || 'draft', sdc_status: m.sdc_status, id: ym }, programme: 'sdc', entries: rows, region_avg: avg, settings: sdcSettings(), uploads: m.uploads, go_live_ym: YM };
}

let user = null;
const DEMO_OFF = 'Demo: uploads are switched off. On the live app this file would be read and the month filled in.';
function handle(p, q, method, body) {
  if (p === 'auth/me') return [200, { user, chapters }];
  if (p === 'auth/logout') { user = null; return [200, { ok: true }]; }
  if (p === 'auth/login') {
    if (body.mode === 'admin') { user = { id: 1, role: 'admin', name: 'Admin (demo)' }; return [200, { ok: true, user }]; }
    const pool = body.mode === 'sdc' ? sdcs : sas; const s = pool.find(x => x.chapter_id === Number(body.chapter_id));
    if (!s) return [400, { error: 'Pick a chapter' }];
    if (body.pin !== '1234') return [401, { error: 'Wrong PIN. In this demo every PIN is 1234.' }];
    user = { id: s.id, role: s.role, name: s.name, chapter_id: s.chapter_id }; return [200, { ok: true, user }];
  }
  if (!user) return [401, { error: 'Not signed in' }];

  if (p === 'sa/dashboard' && user.role === 'sdc') {
    const me = sdcs.find(s => s.id === user.id); const history = []; const ss = sdcSettings();
    for (const ym of Object.keys(sdcMonths).sort()) {
      const m = loadSdcMonth(ym); if (m.month.sdc_status !== 'published') continue; const e = m.entries.find(x => x.sdc_user_id === me.id); if (!e) continue;
      history.push({ ym, chapter: e.chapter.name, legacy: false, meeting_day: dowName(e.chapter.meeting_day), inputs: { ...e, calendar_weeks: e.weeks.length,
        weeks: e.weeks.map(w => ({ date: w.week_date, no_meeting: w.no_meeting, telebridge: w.telebridge_done, palms: w.palms_done })) },
        computed: e.computed, region_avg: m.region_avg, total_sas: m.entries.length, hints: nextSdcBandHints(e, ss) });
    }
    return [200, { user: { id: me.id, name: me.name, chapter: chapters[me.chapter_id - 1] }, programme: 'sdc', settings: { fee_amount: ss.fee_amount, commission_pct: ss.sdc_commission_pct, thresholds: ss.sdc_thresholds, max_pts: ss.sdc_max_pts, bands: ss.bands }, history }];
  }
  if (p === 'sa/dashboard') {
    const me = sas.find(s => s.id === user.id); const history = [];
    for (const ym of Object.keys(months).sort()) {
      const m = loadMonth(ym); if (m.month.status !== 'published') continue; const e = m.entries.find(x => x.sa_user_id === me.id); if (!e) continue;
      history.push({ ym, chapter: e.chapter.name, legacy: false, inputs: e, computed: e.computed, region_avg: m.region_avg, total_sas: m.entries.length, hints: nextBandHints(e, settings) });
    }
    return [200, { user: { id: me.id, name: me.name, chapter: chapters[me.chapter_id - 1] }, programme: 'sa', settings, history }];
  }
  if (p === 'admin/months' && method === 'GET') {
    const ym = q.get('ym'); if (ym) return [200, q.get('programme') === 'sdc' ? loadSdcMonth(ym) : loadMonth(ym)];
    const all = [...new Set([...Object.keys(months), ...Object.keys(sdcMonths)])].sort().reverse();
    return [200, { go_live_ym: YM, months: all.map(ym => { const m = loadMonth(ym), d = loadSdcMonth(ym);
      const sum = (mm, st) => mm ? { status: st, region_avg: mm.region_avg, entries: mm.entries.length, filled: mm.entries.filter(e => e.member_score !== null).length, payout_total: mm.entries.reduce((a, e) => a + (e.computed.payout || 0), 0) } : { status: 'draft', region_avg: 0, entries: 0, filled: 0, payout_total: 0 };
      return { ym, status: m?.month.status || 'draft', sdc_status: d?.month.sdc_status || 'draft', sa: sum(m, m?.month.status || 'draft'), sdc: sum(d, d?.month.sdc_status || 'draft'), ...sum(m, m?.month.status || 'draft') }; }) }];
  }
  if (p === 'admin/months') {
    if (body.action === 'create') {
      if (body.ym < YM) return [400, { error: 'The scorecard starts from October 2026.' }];
      if (!months[body.ym]) months[body.ym] = { ym: body.ym, status: 'draft', uploads: [], entries: chapters.map((c, i) => ({ id: Date.now() + i, chapter_id: c.id, sa_user_id: 100 + i, legacy: false, member_score: null, online_pct: null, offline_pct: null, member_count: null, retention_pct: null, one_to_one_per_member: null, ltrt_att: null, dcrt_att: null, jotform_done: null, new_members: 0, renewals: 0 })) };
      if (!sdcMonths[body.ym]) sdcMonths[body.ym] = makeSdcMonth(body.ym, false);
      return [200, { ok: true }];
    }
    const target = body.programme === 'sdc' ? sdcMonths[body.ym] : months[body.ym]; const key = body.programme === 'sdc' ? 'sdc_status' : 'status';
    if (target && body.action === 'publish') target[key] = 'published';
    if (target && body.action === 'unpublish') target[key] = 'draft';
    return [200, { ok: true }];
  }
  if (p === 'admin/entries') {
    if (body.action === 'palms_report') return [400, { error: DEMO_OFF }];
    const bool = ['ltrt_att', 'dcrt_att', 'ltrt_attended', 'jotform_done', 'visit_done', 'retention_na', 'no_meeting', 'telebridge_done', 'palms_done'];
    const val = (k, v) => v === '' || v === null || v === undefined ? (k === 'retention_na' ? false : null) : bool.includes(k) ? Boolean(v) : ['notes', 'tl_status'].includes(k) ? v : Number(v);
    if (body.programme === 'sdc') {
      for (const m of Object.values(sdcMonths)) {
        if (m.sdc_status === 'published' && (m.weeks.some(w => w.id === Number(body.week_id)) || m.entries.some(e => e.id === Number(body.id)))) return [400, { error: 'Month is published. Unpublish to edit.' }];
        if (body.week_id) { const w = m.weeks.find(x => x.id === Number(body.week_id)); if (w) { for (const k of ['no_meeting', 'telebridge_done', 'palms_done']) if (k in body) w[k] = val(k, body[k]); if ('telebridge_done' in body) w.telebridge_auto = false; } }
        const e = m.entries.find(x => x.id === Number(body.id));
        if (e) { for (const k of Object.keys(body)) if (!['id', 'programme'].includes(k)) e[k] = val(k, body[k]); if ('tl_status' in body) e.tl_auto = false; if ('net_add' in body) e.net_add_auto = false; if ('visit_done' in body) e.visit_auto = false; if ('retention_pct' in body && e.retention_pct !== null) e.retention_na = false; }
      }
      return [200, { ok: true }];
    }
    for (const m of Object.values(months)) {
      const e = m.entries.find(x => x.id === Number(body.id)); if (!e) continue;
      if (m.status === 'published') return [400, { error: 'Month is published. Unpublish to edit.' }];
      for (const k of Object.keys(body)) if (k !== 'id') e[k] = val(k, body[k]);
      if ('jotform_done' in body) e.jotform_auto = false; if ('retention_pct' in body && e.retention_pct !== null) e.retention_na = false;
    }
    return [200, { ok: true }];
  }
  if (p === 'admin/upload') return [400, { error: DEMO_OFF }];
  if (p === 'admin/jotform') return [400, { error: 'Demo: Jotform sync is switched off. On the live app this pulls the Tele-Bridge and visit forms.' }];
  if (p === 'admin/settings' && method === 'GET') return [200, { settings: { ...settings, sdc_commission_pct: 7.5, telebridge_form_id: '(demo)', jotform_form_id: '(demo)' }, chapters, known_event_types: ['Feature Presentation Workshop', 'Member Success Program'] }];
  if (p === 'admin/settings') return [400, { error: 'Demo: settings are read-only. On the live app this saves the fees and percentages.' }];
  if (p === 'admin/users' && method === 'GET') return [200, { users: [{ id: 1, role: 'admin', name: 'Admin (demo)', email: 'admin@example.com', active: true }, ...sas, ...sdcs] }];
  if (p === 'admin/users') return [400, { error: 'Demo: users are read-only.' }];
  return [404, { error: 'Not available in the demo' }];
}

const realFetch = window.fetch.bind(window);
window.fetch = async (input, opts = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (!url.startsWith('/api/')) return realFetch(input, opts);
  const u = new URL(url, 'https://demo.local'); const p = u.pathname.slice(5);
  let body = {}; try { body = opts.body ? JSON.parse(opts.body) : {}; } catch (e) { body = {}; }
  await new Promise(r => setTimeout(r, 120));
  const [code, obj] = handle(p, u.searchParams, (opts.method || 'GET').toUpperCase(), body);
  return new Response(JSON.stringify(obj), { status: code, headers: { 'Content-Type': 'application/json' } });
};
