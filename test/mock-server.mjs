// Local preview server with an in-memory fake backend. For UI checks only; the real app uses Supabase.
// node test/mock-server.mjs  -> http://localhost:4173
import http from 'http'; import fs from 'fs'; import path from 'path';
import { scoreEntry, nextBandHints, DEFAULT_SETTINGS } from '../api/_lib/scoring.js';
import { parseChapterStatistics, parseTrainingReport, trainingPercents } from '../api/_lib/parsers.js';

const PUB = path.resolve(new URL('../public', import.meta.url).pathname);
const legacy = JSON.parse(fs.readFileSync(new URL('../supabase/legacy/sheet_data.json', import.meta.url)));
const chapters = ['BNI Ainthinai','BNI Bamboo Kottai','BNI Cmy Veli','BNI Dil Nadu','BNI Tamilan','BNI Ejamaan','BNI Thamira','BNI Saral','BNI Korkai','BNI Nanjil','BNI Kanya','BNI Comorin','BNI Kumari','BNI Kings']
  .map((name, i) => ({ id: i + 1, name, key: name.toLowerCase().replace(/^bni\s+/, '').replace(/[^a-z0-9]/g, ''), region: i < 8 ? 'Tirunelveli' : 'Nagercoil & Tuticorin', sort_order: i + 1 }));
const sas = chapters.map((c, i) => ({ id: 100 + i, role: 'sa', name: legacy['2026-09'][i][1], chapter_id: c.id, active: true, jotform_alias: legacy['2026-09'][i][1], chapter: { name: c.name } }));
const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); settings.online_event_types = ['Member Success Program']; settings.jotform_form_id = '261212882805052';
let user = null;
const months = {};
const pct = s => Number(String(s).replace('%', ''));
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
    if (p === '/api/auth/login') { if (body.mode === 'admin') user = { id: 1, role: 'admin', name: 'Mohamed Riaz' }; else { const s = sas.find(x => x.chapter_id === Number(body.chapter_id)); if (!s || body.pin !== '1234') return json(res, 401, { error: 'Wrong PIN for this chapter' }); user = { id: s.id, role: 'sa', name: s.name, chapter_id: s.chapter_id }; } return json(res, 200, { ok: true, user }); }
    if (!user) return json(res, 401, { error: 'Not signed in' });
    if (p === '/api/sa/dashboard') { const me = sas.find(s => s.id === user.id); const history = [];
      for (const ym of Object.keys(months).sort()) { const m = loadMonth(ym); if (m.month.status !== 'published') continue; const e = m.entries.find(x => x.sa_user_id === me.id); if (!e) continue;
        history.push({ ym, chapter: e.chapter.name, legacy: e.legacy, inputs: e, computed: e.computed, region_avg: m.region_avg, total_sas: m.entries.length, hints: e.legacy ? null : nextBandHints(e, settings) }); }
      return json(res, 200, { user: { id: me.id, name: me.name, chapter: chapters[me.chapter_id - 1] }, settings, history }); }
    if (p === '/api/admin/months' && req.method === 'GET') { const ym = u.searchParams.get('ym'); if (ym) return json(res, 200, loadMonth(ym));
      return json(res, 200, { months: Object.keys(months).sort().reverse().map(ym => { const m = loadMonth(ym); return { ym, status: m.month.status, region_avg: m.region_avg, entries: m.entries.length, filled: m.entries.filter(e => e.legacy || e.member_score !== null).length, payout_total: m.entries.reduce((a, e) => a + (e.computed.payout || 0), 0) }; }) }); }
    if (p === '/api/admin/months') { if (body.action === 'create' && !months[body.ym]) months[body.ym] = { ym: body.ym, status: 'draft', uploads: [], entries: chapters.map((c, i) => ({ id: Date.now() + i, chapter_id: c.id, sa_user_id: 100 + i, legacy: false, member_score: null, online_pct: null, offline_pct: null, retention_pct: null, one_to_one_per_member: null, ltrt_attended: null, jotform_done: null, new_members: 0, renewals: 0 })) };
      if (body.action === 'publish') months[body.ym].status = 'published'; if (body.action === 'unpublish') months[body.ym].status = 'draft'; return json(res, 200, { ok: true }); }
    if (p === '/api/admin/entries') { for (const m of Object.values(months)) { const e = m.entries.find(x => x.id === Number(body.id)); if (e) { for (const k of Object.keys(body)) if (k !== 'id') e[k] = body[k] === '' ? null : (['ltrt_attended', 'jotform_done', 'notes'].includes(k) ? body[k] : Number(body[k])); } } return json(res, 200, { ok: true }); }
    if (p === '/api/admin/upload') { try { let parsed, updated = [];
        if (body.kind === 'chapter_statistics') { parsed = parseChapterStatistics(body.text); const m = months[parsed.month]; for (const r of parsed.rows) { const c = chapters.find(x => x.key === r.key); const e = m.entries.find(x => x.chapter_id === c.id); e.member_count = r.mem_avg; e.one_to_one_per_member = r.one_to_one_per_member; updated.push(r); } }
        else { parsed = parseTrainingReport(body.text); const m = months[parsed.month]; for (const key of new Set(parsed.attendances.map(a => a.key))) { const c = chapters.find(x => x.key === key); const e = m.entries.find(x => x.chapter_id === c.id); const t = trainingPercents(parsed.attendances, key, e.member_count || 0, settings.online_event_types); Object.assign(e, { online_pct: t.online_pct, offline_pct: t.offline_pct, training_unique: t.unique_members }); updated.push({ ...t, needs_member_count: !e.member_count }); } }
        months[parsed.month].uploads.push({ kind: body.kind, region: parsed.region, created_at: new Date().toISOString() });
        return json(res, 200, { ok: true, month: parsed.month, region: parsed.region, updated, unmatched: [], warning: null }); } catch (e) { return json(res, 400, { error: e.message }); } }
    if (p === '/api/admin/jotform') return json(res, 200, { ok: true, total_submissions: 9, results: chapters.map((c, i) => ({ chapter: c.name, sa: sas[i].name, submissions: i % 3 === 0 ? 1 : 0, matched: i % 3 === 0, submitters: i % 3 === 0 ? [sas[i].name] : [] })) });
    if (p === '/api/admin/settings' && req.method === 'GET') return json(res, 200, { settings, chapters, known_event_types: ['Feature Presentation Workshop', 'Member Success Program'] });
    if (p === '/api/admin/settings') { Object.assign(settings, body); return json(res, 200, { ok: true, settings }); }
    if (p === '/api/admin/users' && req.method === 'GET') return json(res, 200, { users: [{ id: 1, role: 'admin', name: 'Mohamed Riaz', email: 'riaz@thekingsgroup.in', active: true }, ...sas] });
    if (p === '/api/admin/users') return json(res, 200, { ok: true });
    return json(res, 404, { error: 'no mock for ' + p });
  }
  const f = path.join(PUB, p === '/' || p === '/admin' || p === '/login' ? 'index.html' : p);
  if (fs.existsSync(f)) { res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : 'text/plain' }); fs.createReadStream(f).pipe(res); } else { res.writeHead(404); res.end('not found'); }
}).listen(4173, () => console.log('mock on http://localhost:4173'));
