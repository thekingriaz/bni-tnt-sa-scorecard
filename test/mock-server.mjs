// Local preview server with an in-memory fake backend. For UI checks only; the real app uses Supabase.
// node test/mock-server.mjs  -> http://localhost:4173
import http from 'http'; import fs from 'fs'; import path from 'path';
import { scoreEntry, nextBandHints, DEFAULT_SETTINGS } from '../api/_lib/scoring.js';
import { parseChapterStatistics, parseTrainingReport, trainingPercents, parseTrafficLights } from '../api/_lib/parsers.js';
import { scoreSdcEntry, nextSdcBandHints, meetingDates, weekCounts, mergeSdcSettings } from '../api/_lib/scoring_sdc.js';

const PUB = path.resolve(new URL('../public', import.meta.url).pathname);
const legacy = JSON.parse(fs.readFileSync(new URL('../supabase/legacy/sheet_data.json', import.meta.url)));
const chapters = ['BNI Ainthinai','BNI Bamboo Kottai','BNI Cmy Veli','BNI Dil Nadu','BNI Tamilan','BNI Ejamaan','BNI Thamira','BNI Saral','BNI Korkai','BNI Nanjil','BNI Kanya','BNI Comorin','BNI Kumari','BNI Kings']
  .map((name, i) => ({ id: i + 1, name, key: name.toLowerCase().replace(/^bni\s+/, '').replace(/[^a-z0-9]/g, ''), region: i < 8 ? 'Tirunelveli' : 'Nagercoil & Tuticorin', sort_order: i + 1 }));
const sas = chapters.map((c, i) => ({ id: 100 + i, role: 'sa', name: legacy['2026-09'][i][1], chapter_id: c.id, active: true, jotform_alias: legacy['2026-09'][i][1], chapter: { name: c.name } }));
const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); settings.online_event_types = ['Member Success Program']; settings.jotform_form_id = '261212882805052';
const pct = s => Number(String(s).replace('%', ''));
let user = null;
const months = {};
// ---- SDC mock state ----
const MD = { ainthinai: 2, bambookottai: 3, cmyveli: 4, dilnadu: 5, tamilan: 2, ejamaan: 3, thamira: 4, saral: 4, korkai: 2, nanjil: 4, kanya: 2, comorin: 5, kumari: 3, kings: 2 };
chapters.forEach(c => c.meeting_day = MD[c.key]);
const sdcLegacy = JSON.parse(fs.readFileSync(new URL('../supabase/legacy/sdc_sheet_data.json', import.meta.url)));
const sdcs = chapters.map((c, i) => ({ id: 200 + i, role: 'sdc', name: sdcLegacy['2026-09'][i][4], chapter_id: c.id, active: true, jotform_alias: sdcLegacy['2026-09'][i][4], chapter: { name: c.name } }));
const sdcMonths = {};
for (const [ym, rows] of Object.entries(sdcLegacy)) {
  sdcMonths[ym] = { ym, sdc_status: 'published', entries: rows.map((r, i) => ({ id: Number(ym.replace('-', '')) * 100 + 50 + i, chapter_id: i + 1, sdc_user_id: 200 + i, legacy: true,
    net_add: +r[5], tl_status: r[7], retention_pct: pct(r[9]) || null, member_score: +r[11], meetings_total: +r[3], telebridge_weeks: +r[13], palms_weeks: +r[15], visit_done: r[17] === 'Done', ltrt_attended: r[19] === 'Attended',
    points: { net_growth: +r[6], traffic_light: +r[8], retention: +r[10], member: +r[12], telebridge: +r[14], palms: +r[16], visit: +r[18], ltrt: +r[20] }, total_raw: +r[21], max_total: 100, total_scaled: +r[21],
    band: ['Gold','Green','Amber','Red','Review'][[85,70,55,40,0].findIndex(m => +r[21] >= m)], multiplier: [1,.8,.6,.35,.15][[85,70,55,40,0].findIndex(m => +r[21] >= m)], payout: null })), weeks: [] };
}
function makeSdcMonth(ym) { const weeks = []; let wid = 1;
  const entries = chapters.map((c, i) => { for (const d of meetingDates(ym, c.meeting_day)) weeks.push({ id: Number(ym.replace('-', '')) * 1000 + wid++, chapter_id: c.id, week_date: d, no_meeting: false, telebridge_done: null, telebridge_auto: false, palms_done: null });
    return { id: Number(ym.replace('-', '')) * 100 + 50 + i, chapter_id: c.id, sdc_user_id: 200 + i, legacy: false, net_add: null, member_count: [102, 60, 45, 60, 38, 55, 50, 40, 70, 48, 61, 40, 36, 33][i], tl_status: i % 4 === 2 ? 'AMBER' : 'GREEN', tl_auto: true, tl_score: 80, retention_pct: 75, member_score: 80, visit_done: null, visit_auto: false, ltrt_attended: null, notes: null }; });
  return { ym, sdc_status: 'draft', entries, weeks, uploads: [] }; }
sdcMonths['2026-10'] = makeSdcMonth('2026-10');
const sdcSettings = () => mergeSdcSettings({ ...settings, sdc_commission_pct: 7.5 });
function loadSdcMonth(ym) { const m = sdcMonths[ym]; if (!m) return null; const sa = months[ym];
  const prevYm = (() => { const [y, mo] = ym.split('-').map(Number); return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`; })();
  const rows = m.entries.map(e => { const w = m.weeks.filter(x => x.chapter_id === e.chapter_id); const saE = sa?.entries.find(x => x.chapter_id === e.chapter_id);
    const prev = sdcMonths[prevYm]?.entries.find(x => x.chapter_id === e.chapter_id)?.member_count ?? (e.member_count ? e.member_count - (e.chapter_id % 3) + 1 : null);
    const derived = e.member_count != null && prev != null ? Math.round(e.member_count - prev) : null;
    const counts = e.legacy ? {} : weekCounts(w);
    const eff = { ...e, ...counts, prev_member_count: prev, net_add_derived: derived, net_add: e.net_add ?? derived, members_paid: (saE?.new_members || 0) + (saE?.renewals || 0), new_members: saE?.new_members ?? null, renewals: saE?.renewals ?? null };
    const computed = e.legacy ? { points: e.points, total_raw: e.total_raw, max_total: 100, total_scaled: e.total_scaled, band: e.band, multiplier: e.multiplier, payout: null, members_paid: null, meetings_total: e.meetings_total, legacy: true } : scoreSdcEntry(eff, sdcSettings());
    return { ...eff, weeks: w, chapter: chapters[e.chapter_id - 1], sdc: sdcs.find(s => s.id === e.sdc_user_id), computed }; });
  [...rows].sort((a, b) => b.computed.total_scaled - a.computed.total_scaled).forEach((r, i) => r.computed.rank = i + 1);
  const avg = Math.round(rows.reduce((a, r) => a + r.computed.total_scaled, 0) / rows.length * 100) / 100;
  return { month: { ym, status: months[ym]?.status || 'draft', sdc_status: m.sdc_status, id: ym }, programme: 'sdc', entries: rows, region_avg: avg, settings: sdcSettings(), uploads: m.uploads || [] }; }
for (const [ym, rows] of Object.entries(legacy)) {
  months[ym] = { ym, status: 'published', entries: rows.map((r, i) => ({ id: Number(ym.replace('-', '')) * 100 + i, chapter_id: i + 1, sa_user_id: 100 + i, legacy: true,
    member_score: +r[2], online_pct: pct(r[4]), offline_pct: pct(r[5]), mentoring_pct: pct(r[8]), retention_pct: pct(r[10]), one_to_one_per_member: +r[12], ltrt_attended: r[14] === 'Attended', jotform_done: r[16] === 'Done', new_members: 0, renewals: 0,
    points: { member: +r[3], training: +r[7], mentoring: +r[9], retention: +r[11], one_to_one: +r[13], ltrt: +r[15], visit: +r[17] }, total_raw: +r[18], max_total: 100, total_scaled: +r[18], band: ['Gold','Green','Amber','Red','Review'][[85,70,55,40,0].findIndex(m => +r[18] >= m)], multiplier: [1,.8,.6,.35,.15][[85,70,55,40,0].findIndex(m => +r[18] >= m)], payout: null })) };
}
// Oct 2026 draft with real Sep uploads applied as sample
months['2026-10'] = { ym: '2026-10', status: 'draft', uploads: [], entries: chapters.map((c, i) => ({ id: 20261000 + i, chapter_id: c.id, sa_user_id: 100 + i, legacy: false,
  member_score: [90,84,100,95,100,95,100,85,100,80,80,75,95,70][i], online_pct: null, offline_pct: null, member_count: null, retention_pct: [84,85,87,80,72,78,72,0,75,75,75,75,75,75][i], one_to_one_per_member: null,
  ltrt_attended: i !== 7, jotform_done: [false,true,false,true,false,true,false,false,true,false,false,false,false,false][i], jotform_auto: false, new_members: [2,1,0,1,0,1,0,0,1,0,1,0,0,0][i], renewals: [5,3,2,4,1,2,1,1,3,2,2,1,1,0][i], notes: null })) };

function computed(e) { return e.legacy ? { points: e.points, total_raw: e.total_raw, max_total: e.max_total, total_scaled: e.total_scaled, band: e.band, multiplier: e.multiplier, payout: e.payout, combined_training_pct: e.online_pct + e.offline_pct, members_paid: null } : scoreEntry(e, settings); }
function loadMonth(ym) { const m = months[ym]; if (!m) return null; const rows = m.entries.map(e => ({ ...e, chapter: chapters[e.chapter_id - 1], sa: sas.find(s => s.id === e.sa_user_id), computed: computed(e) }));
  [...rows].sort((a, b) => b.computed.total_scaled - a.computed.total_scaled).forEach((r, i) => r.computed.rank = i + 1);
  const avg = Math.round(rows.reduce((a, r) => a + r.computed.total_scaled, 0) / rows.length * 100) / 100;
  return { month: { ym, status: m.status, id: ym }, entries: rows, region_avg: avg, settings, uploads: m.uploads || [] }; }

const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); let body = '';
  for await (const ch of req) body += ch; body = body ? JSON.parse(body) : {};
  const p = u.pathname;
  if (p.startsWith('/api/')) {
    if (p === '/api/auth/me') return json(res, 200, { user, chapters });
    if (p === '/api/auth/logout') { user = null; return json(res, 200, { ok: true }); }
    if (p === '/api/auth/login') { if (body.mode === 'admin') user = { id: 1, role: 'admin', name: 'Mohamed Riaz' }; else { const pool = body.mode === 'sdc' ? sdcs : sas; const s = pool.find(x => x.chapter_id === Number(body.chapter_id)); if (!s || body.pin !== '1234') return json(res, 401, { error: 'Wrong PIN for this chapter' }); user = { id: s.id, role: s.role, name: s.name, chapter_id: s.chapter_id }; } return json(res, 200, { ok: true, user }); }
    if (!user) return json(res, 401, { error: 'Not signed in' });
    if (p === '/api/sa/dashboard' && user.role === 'sdc') { const me = sdcs.find(s => s.id === user.id); const history = [];
      for (const ym of Object.keys(sdcMonths).sort()) { const m = loadSdcMonth(ym); if (m.month.sdc_status !== 'published') continue; const e = m.entries.find(x => x.sdc_user_id === me.id); if (!e) continue;
        history.push({ ym, chapter: e.chapter.name, legacy: e.legacy, meeting_day: 'Tue', inputs: { ...e, calendar_weeks: e.legacy ? e.meetings_total : e.weeks.length, weeks: e.legacy ? [] : e.weeks.map(w => ({ date: w.week_date, no_meeting: w.no_meeting, telebridge: w.telebridge_done, palms: w.palms_done })) }, computed: e.computed, region_avg: m.region_avg, total_sas: m.entries.length, hints: e.legacy ? null : nextSdcBandHints(e, sdcSettings()) }); }
      const ss = sdcSettings(); return json(res, 200, { user: { id: me.id, name: me.name, chapter: chapters[me.chapter_id - 1] }, programme: 'sdc', settings: { fee_amount: ss.fee_amount, commission_pct: ss.sdc_commission_pct, thresholds: ss.sdc_thresholds, max_pts: ss.sdc_max_pts, bands: ss.bands }, history }); }
    if (p === '/api/sa/dashboard') { const me = sas.find(s => s.id === user.id); const history = [];
      for (const ym of Object.keys(months).sort()) { const m = loadMonth(ym); if (m.month.status !== 'published') continue; const e = m.entries.find(x => x.sa_user_id === me.id); if (!e) continue;
        history.push({ ym, chapter: e.chapter.name, legacy: e.legacy, inputs: e, computed: e.computed, region_avg: m.region_avg, total_sas: m.entries.length, hints: e.legacy ? null : nextBandHints(e, settings) }); }
      return json(res, 200, { user: { id: me.id, name: me.name, chapter: chapters[me.chapter_id - 1] }, settings, history }); }
    if (p === '/api/admin/months' && req.method === 'GET') { const ym = u.searchParams.get('ym'); const sdc = u.searchParams.get('programme') === 'sdc'; if (ym) return json(res, 200, sdc ? loadSdcMonth(ym) : loadMonth(ym));
      return json(res, 200, { months: [...new Set([...Object.keys(months), ...Object.keys(sdcMonths)])].sort().reverse().map(ym => { const m = loadMonth(ym); const d = loadSdcMonth(ym);
        const sum = (mm, st) => mm ? { status: st, region_avg: mm.region_avg, entries: mm.entries.length, filled: mm.entries.filter(e => e.legacy || e.member_score !== null).length, payout_total: mm.entries.reduce((a, e) => a + (e.computed.payout || 0), 0) } : { status: 'draft', region_avg: 0, entries: 0, filled: 0, payout_total: 0 };
        return { ym, status: m?.month.status || 'draft', sdc_status: d?.month.sdc_status || 'draft', sa: sum(m, m?.month.status || 'draft'), sdc: sum(d, d?.month.sdc_status || 'draft'), ...sum(m, m?.month.status || 'draft') }; }) }); }
    if (p === '/api/admin/months' && body.programme === 'sdc') { if (body.action === 'create' && !sdcMonths[body.ym]) sdcMonths[body.ym] = makeSdcMonth(body.ym); if (body.action === 'publish') sdcMonths[body.ym].sdc_status = 'published'; if (body.action === 'unpublish') sdcMonths[body.ym].sdc_status = 'draft'; return json(res, 200, { ok: true }); }
    if (p === '/api/admin/months') { if (body.action === 'create' && !months[body.ym]) months[body.ym] = { ym: body.ym, status: 'draft', uploads: [], entries: chapters.map((c, i) => ({ id: Date.now() + i, chapter_id: c.id, sa_user_id: 100 + i, legacy: false, member_score: null, online_pct: null, offline_pct: null, retention_pct: null, one_to_one_per_member: null, ltrt_attended: null, jotform_done: null, new_members: 0, renewals: 0 })) };
      if (body.action === 'publish') months[body.ym].status = 'published'; if (body.action === 'unpublish') months[body.ym].status = 'draft'; return json(res, 200, { ok: true }); }
    if (p === '/api/admin/entries' && body.programme === 'sdc') { for (const m of Object.values(sdcMonths)) { if (body.week_id) { const w = m.weeks.find(x => x.id === Number(body.week_id)); if (w) { for (const k of ['no_meeting', 'telebridge_done', 'palms_done']) if (k in body) w[k] = body[k]; if ('telebridge_done' in body) w.telebridge_auto = false; } }
        const e = m.entries.find(x => x.id === Number(body.id)); if (e) { for (const k of Object.keys(body)) if (!['id', 'programme'].includes(k)) e[k] = body[k] === '' ? null : (['ltrt_attended', 'visit_done', 'notes', 'tl_status'].includes(k) ? body[k] : Number(body[k])); if ('tl_status' in body) e.tl_auto = false; } } return json(res, 200, { ok: true }); }
    if (p === '/api/admin/entries') { for (const m of Object.values(months)) { const e = m.entries.find(x => x.id === Number(body.id)); if (e) { for (const k of Object.keys(body)) if (k !== 'id') e[k] = body[k] === '' ? null : (['ltrt_attended', 'jotform_done', 'notes'].includes(k) ? body[k] : Number(body[k])); } } return json(res, 200, { ok: true }); }
    if (p === '/api/admin/upload') { try { let parsed, updated = [];
        if (body.kind === 'traffic_lights') { parsed = parseTrafficLights(body.rows, body.ym); const m = sdcMonths[parsed.month] || (sdcMonths[parsed.month] = makeSdcMonth(parsed.month)); for (const r of parsed.rows) { const c = chapters.find(x => x.key === r.key); if (!c) continue; const e = m.entries.find(x => x.chapter_id === c.id); Object.assign(e, { tl_status: r.status, tl_score: r.score, tl_auto: true }); updated.push({ chapter: c.name, status: r.status, score: r.score }); } m.uploads.push({ kind: 'traffic_lights', region: 'All India', created_at: new Date().toISOString() }); return json(res, 200, { ok: true, kind: 'traffic_lights', month: parsed.month, updated, unmatched: [], warning: null }); }
        if (body.kind === 'chapter_statistics') { parsed = parseChapterStatistics(body.text); const m = months[parsed.month]; for (const r of parsed.rows) { const c = chapters.find(x => x.key === r.key); const e = m.entries.find(x => x.chapter_id === c.id); e.member_count = r.mem_avg; e.one_to_one_per_member = r.one_to_one_per_member; updated.push(r); } }
        else { parsed = parseTrainingReport(body.text); const m = months[parsed.month]; for (const key of new Set(parsed.attendances.map(a => a.key))) { const c = chapters.find(x => x.key === key); const e = m.entries.find(x => x.chapter_id === c.id); const t = trainingPercents(parsed.attendances, key, e.member_count || 0, settings.online_event_types); Object.assign(e, { online_pct: t.online_pct, offline_pct: t.offline_pct, training_unique: t.unique_members }); updated.push({ ...t, needs_member_count: !e.member_count }); } }
        months[parsed.month].uploads.push({ kind: body.kind, region: parsed.region, created_at: new Date().toISOString() });
        return json(res, 200, { ok: true, month: parsed.month, region: parsed.region, updated, unmatched: [], warning: null }); } catch (e) { return json(res, 400, { error: e.message }); } }
    if (p === '/api/admin/jotform' && body.programme === 'sdc') { const m = sdcMonths[body.ym]; let n = 0; for (const w of m.weeks) { if (w.telebridge_auto === false && w.telebridge_done !== null) continue; w.telebridge_done = (w.id % 3) !== 0; w.telebridge_auto = true; n++; } m.entries.forEach((e, i) => { if (!(e.visit_auto === false && e.visit_done !== null)) { e.visit_done = i % 4 === 0; e.visit_auto = true; } });
      return json(res, 200, { ok: true, programme: 'sdc', total_submissions: 6, telebridge: { form: '221121498823050', submissions: 40, weeks_updated: n, unmatched: [] }, results: chapters.map((c, i) => ({ chapter: c.name, sdc: sdcs[i].name, submissions: i % 4 === 0 ? 1 : i % 4 === 1 ? 1 : 0, matched: i % 4 === 0, late: i % 4 === 1, visit_date: '2026-10-07', submitted: i % 4 === 1 ? '2026-10-10' : '2026-10-07', submitters: i % 4 < 2 ? [sdcs[i].name] : [] })) }); }
    if (p === '/api/admin/jotform') return json(res, 200, { ok: true, total_submissions: 9, results: chapters.map((c, i) => ({ chapter: c.name, sa: sas[i].name, submissions: i % 3 === 0 ? 1 : 0, matched: i % 3 === 0, submitters: i % 3 === 0 ? [sas[i].name] : [] })) });
    if (p === '/api/admin/settings' && req.method === 'GET') return json(res, 200, { settings, chapters, known_event_types: ['Feature Presentation Workshop', 'Member Success Program'] });
    if (p === '/api/admin/settings') { Object.assign(settings, body); return json(res, 200, { ok: true, settings }); }
    if (p === '/api/admin/users' && req.method === 'GET') return json(res, 200, { users: [{ id: 1, role: 'admin', name: 'Mohamed Riaz', email: 'riaz@thekingsgroup.in', active: true }, ...sas, ...sdcs] });
    if (p === '/api/admin/users') return json(res, 200, { ok: true });
    return json(res, 404, { error: 'no mock for ' + p });
  }
  const f = path.join(PUB, p === '/' || p === '/admin' || p === '/login' ? 'index.html' : p);
  if (fs.existsSync(f)) { res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : 'text/plain' }); fs.createReadStream(f).pipe(res); } else { res.writeHead(404); res.end('not found'); }
}).listen(4173, () => console.log('mock on http://localhost:4173'));
