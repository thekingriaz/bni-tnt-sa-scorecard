import { db, handler, fail, audit, loadSettings } from '../_lib/db.js';
import { ensureMonth } from '../_lib/compute.js';
import { ensureSdcMonth } from '../_lib/compute_sdc.js';
import { normChapter } from '../_lib/parsers.js';

// POST { ym }                    -> SA: pulls "BNI Chapter Visit Report" submissions for that month and marks jotform_done
//                                   for chapters where the submitter matches the SA's jotform_alias.
// POST { ym, programme:'sdc' }   -> SDC: same visit form matched to the SDC (visit_done only if submitted within 24 h of the visit date),
//                                   plus "Support DC Tele-bridge Call" submissions ticked into the weekly grid by meeting date.
// Manual overrides (…_auto=false) are left alone.
export default handler(async ({ req, session, body }) => {
  if (req.method !== 'POST') throw fail('POST only', 405);
  const apiKey = process.env.JOTFORM_API_KEY;
  if (!apiKey) throw fail('JOTFORM_API_KEY is not set in Vercel environment variables');
  const settings = await loadSettings();
  const ym = body.ym; if (!/^\d{4}-\d{2}$/.test(ym || '')) throw fail('ym must be YYYY-MM');
  const sdc = body.programme === 'sdc';
  const month = sdc ? await ensureSdcMonth(ym, session.uid) : await ensureMonth(ym, session.uid);
  if ((sdc ? month.sdc_status : month.status) === 'published') throw fail('Month is published. Unpublish to re-sync.');

  const [y, m] = ym.split('-').map(Number);
  const nextYm = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  const timing = {}; const t0 = Date.now();
  const fetchSubs = async (formId, start, end) => {
    const ts = Date.now();
    const filter = encodeURIComponent(JSON.stringify({ 'created_at:gt': start, 'created_at:lt': end }));
    const resp = await fetch(`https://api.jotform.com/form/${formId}/submissions?apiKey=${apiKey}&limit=1000&filter=${filter}`);
    if (!resp.ok) throw fail(`Jotform API error ${resp.status} (form ${formId})`);
    const out = (await resp.json()).content || [];
    timing['form_' + formId] = Date.now() - ts;
    return out;
  };
  const findAnswer = (s, ...labels) => {
    for (const a of Object.values(s.answers || {})) {
      const t = (a.text || a.name || '').toLowerCase();
      if (labels.some(l => t.includes(l))) {
        const v = a.prettyFormat || a.answer;
        if (v && typeof v === 'object') return v.datetime || [v.year, v.month, v.day].filter(Boolean).join('-') || Object.values(v).join(' ');
        return v ? String(v) : '';
      }
    }
    return '';
  };
  // Jotform dates arrive as "2026-09-15", "09-15-2026", "15/09/2026", "{year,month,day}" joined as "2026-9-15" or "September 15, 2026"
  const toDate = str => {
    const s = String(str || '').trim(); if (!s) return null;
    let mm;
    if ((mm = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return `${mm[1]}-${mm[2].padStart(2, '0')}-${mm[3].padStart(2, '0')}`;
    if ((mm = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(s))) { // MM-DD-YYYY (Jotform default) unless the first part cannot be a month
      const a = Number(mm[1]), b = Number(mm[2]);
      const [mo, d] = a > 12 ? [b, a] : [a, b];
      return `${mm[3]}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };
  const dayDiff = (a, b) => Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 86400000);

  const tbForm = sdc ? settings.telebridge_form_id : null;
  const tbAfter = new Date(Date.UTC(y, m, 15)).toISOString().slice(0, 10); // calls happen after the meeting, sometimes next month
  const [{ data: chapters }, visitSubs, tbSubs] = await Promise.all([
    db.from('sa_chapters').select('id,name,key'),
    fetchSubs(settings.jotform_form_id, `${ym}-01 00:00:00`, `${nextYm}-01 00:00:00`),
    tbForm ? fetchSubs(tbForm, `${ym}-01 00:00:00`, `${tbAfter} 00:00:00`) : Promise.resolve([]),
  ]);
  const results = [];

  if (!sdc) {
    const { data: entries } = await db.from('sa_entries').select('id,chapter_id,jotform_done,jotform_auto, sa:sa_users!sa_entries_sa_user_id_fkey(id,name,jotform_alias)').eq('month_id', month.id);
    const saPatches = [];
    for (const c of chapters) {
      const e = entries.find(x => x.chapter_id === c.id); if (!e) continue;
      const mine = visitSubs.filter(s => normChapter(findAnswer(s, 'select chapter', 'chapter')) === c.key);
      const alias = (e.sa?.jotform_alias || e.sa?.name || '').toLowerCase().trim();
      const match = mine.find(s => { const who = (findAnswer(s, 'visited by') + ' ' + findAnswer(s, 'name')).toLowerCase(); return alias && who.includes(alias); });
      const row = { chapter: c.name, sa: e.sa?.name || null, submissions: mine.length, matched: !!match, submitters: mine.map(s => findAnswer(s, 'visited by') || findAnswer(s, 'name')) };
      if (e.jotform_auto === false && e.jotform_done !== null) { row.skipped = 'manual override'; results.push(row); continue; }
      saPatches.push(db.from('sa_entries').update({ jotform_done: !!match, jotform_auto: true, jotform_submission_id: match ? match.id : null }).eq('id', e.id));
      results.push(row);
    }
    await Promise.all(saPatches);
    await audit(session.uid, 'jotform.sync', { ym, submissions: visitSubs.length });
    return { ok: true, ym, total_submissions: visitSubs.length, results };
  }

  // ---------- SDC: chapter visits (24 h rule) ----------
  const limitDays = 1; // submitted on the visit date or the next calendar day counts as "within 24 hours"
  const [{ data: entries }, { data: weeks }] = await Promise.all([
    db.from('sdc_entries').select('id,chapter_id,visit_done,visit_auto, sdc:sa_users!sdc_entries_sdc_user_id_fkey(id,name,jotform_alias)').eq('month_id', month.id),
    db.from('sdc_weeks').select('*').eq('month_id', month.id),
  ]);
  const entryPatches = [];
  for (const c of chapters) {
    const e = entries.find(x => x.chapter_id === c.id); if (!e) continue;
    const mine = visitSubs.filter(s => normChapter(findAnswer(s, 'select chapter', 'chapter')) === c.key);
    const alias = (e.sdc?.jotform_alias || e.sdc?.name || '').toLowerCase().trim();
    const theirs = mine.filter(s => { const who = (findAnswer(s, 'visited by') + ' ' + findAnswer(s, 'name')).toLowerCase(); return alias && who.includes(alias); })
      .map(s => { const vd = toDate(findAnswer(s, 'visit date', 'date')); const sd = (s.created_at || '').slice(0, 10); const late = vd && sd ? dayDiff(sd, vd) : null;
        return { s, visit_date: vd, submitted: sd, late_days: late, on_time: late !== null && late >= 0 && late <= limitDays }; });
    const match = theirs.find(t => t.on_time) || theirs[0] || null;
    const row = { chapter: c.name, sdc: e.sdc?.name || null, submissions: mine.length, matched: !!(match && match.on_time), late: !!(match && !match.on_time),
      visit_date: match?.visit_date || null, submitted: match?.submitted || null, submitters: mine.map(s => findAnswer(s, 'visited by') || findAnswer(s, 'name')) };
    if (e.visit_auto === false && e.visit_done !== null) { row.skipped = 'manual override'; results.push(row); continue; }
    entryPatches.push({ id: e.id, visit_done: row.matched, visit_auto: true, visit_submission_id: match ? match.s.id : null, visit_hours: match && match.late_days !== null ? match.late_days * 24 : null });
    results.push(row);
  }
  await Promise.all(entryPatches.map(p => db.from('sdc_entries').update(p).eq('id', p.id)));

  // ---------- SDC: tele-bridge weeks ----------
  let weeksTouched = 0, tbUnmatched = [];
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); // IST
  if (tbForm) {
    const byChapter = {}; for (const w of weeks || []) (byChapter[w.chapter_id] = byChapter[w.chapter_id] || []).push(w);
    const hit = new Map(); // week id -> submission id
    for (const s of tbSubs) {
      const key = normChapter(findAnswer(s, 'select your chapter', 'chapter'));
      const c = chapters.find(x => x.key === key);
      const md = toDate(findAnswer(s, 'date of the chapter meeting', 'meeting'));
      if (!c || !md || md.slice(0, 7) !== ym) { if (c && md) continue; tbUnmatched.push({ chapter: findAnswer(s, 'chapter'), date: md }); continue; }
      const ws = byChapter[c.id] || [];
      let best = null, bestD = 99;
      for (const w of ws) { const d = Math.abs(dayDiff(md, w.week_date)); if (d < bestD) { best = w; bestD = d; } }
      if (best && bestD <= 3 && !hit.has(best.id)) hit.set(best.id, s.id);
    }
    const weekPatches = [];
    for (const w of weeks || []) {
      if (w.telebridge_auto === false && w.telebridge_done !== null) continue; // manual
      const done = hit.has(w.id) ? true : (w.week_date > today ? null : false); // future weeks stay blank
      if (w.telebridge_done === done && w.telebridge_auto) continue;
      weekPatches.push({ id: w.id, telebridge_done: done, telebridge_auto: true, telebridge_submission_id: hit.get(w.id) || null, updated_at: new Date().toISOString(), updated_by: session.uid });
    }
    await Promise.all(weekPatches.map(p => db.from('sdc_weeks').update(p).eq('id', p.id)));
    weeksTouched = weekPatches.length;
  }
  await audit(session.uid, 'jotform.sync_sdc', { ym, visits: visitSubs.length, telebridge: tbSubs.length });
  timing.total = Date.now() - t0;
  return { ok: true, ym, programme: 'sdc', total_submissions: visitSubs.length, results, timing,
    telebridge: { form: tbForm || null, submissions: tbSubs.length, weeks_updated: weeksTouched, unmatched: tbUnmatched.slice(0, 20) } };
}, { role: 'admin' });
