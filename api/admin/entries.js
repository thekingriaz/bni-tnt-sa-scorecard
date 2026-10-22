import { db, handler, fail, audit } from '../_lib/db.js';
import { parsePalmsStatus } from '../_lib/parsers.js';
import { palmsFromReport } from '../_lib/scoring_sdc.js';

const EDITABLE = ['member_score', 'online_pct', 'offline_pct', 'training_unique', 'member_count', 'mentoring_pct', 'retention_pct',
  'one_to_one_per_member', 'ltrt_attended', 'jotform_done', 'new_members', 'renewals', 'notes', 'sa_user_id'];
const SDC_EDITABLE = ['net_add', 'member_count', 'tl_status', 'tl_score', 'retention_pct', 'member_score', 'ltrt_attended', 'visit_done', 'notes', 'sdc_user_id'];
const WEEK_EDITABLE = ['no_meeting', 'telebridge_done', 'palms_done'];

// PUT { id, ...fields }                              -> updates one SA entry
// PUT { programme:'sdc', id, ...fields }             -> updates one SDC entry (manual inputs / overrides)
// PUT { programme:'sdc', week_id, ...fields }        -> updates one week row (no_meeting / telebridge_done / palms_done)
export default handler(async ({ req, session, body }) => {
  if (req.method !== 'PUT' && req.method !== 'POST') throw fail('PUT only', 405);
  const now = new Date().toISOString();

  // POST { programme:'sdc', action:'palms_report', ym, as_of:'YYYY-MM-DD', text } -> ticks that week's PALMS for every chapter in the pasted report
  if (body.programme === 'sdc' && body.action === 'palms_report') {
    const ym = body.ym, asOf = body.as_of;
    if (!/^\d{4}-\d{2}$/.test(ym || '') || !/^\d{4}-\d{2}-\d{2}$/.test(asOf || '')) throw fail('ym and as_of (report date) are required');
    const { data: month } = await db.from('sa_months').select('id,sdc_status').eq('ym', ym).maybeSingle();
    if (!month) throw fail('Open the month first');
    if (month.sdc_status === 'published') throw fail('Month is published. Unpublish to edit.');
    const rows = parsePalmsStatus(body.text);
    if (!rows.length) throw fail('No chapter rows found. Paste the table with chapter names and the "Last Meeting Entered" dates.');
    const [{ data: weeks }, { data: chapters }] = await Promise.all([
      db.from('sdc_weeks').select('id,chapter_id,week_date,no_meeting').eq('month_id', month.id),
      db.from('sa_chapters').select('id,key,name'),
    ]);
    const keyMap = {}; for (const c of chapters || []) keyMap[c.key] = c.id;
    const { updates, skipped } = palmsFromReport(weeks, rows, keyMap, asOf);
    await Promise.all(updates.map(u => db.from('sdc_weeks').update({ palms_done: u.palms_done, updated_at: now, updated_by: session.uid }).eq('id', u.week_id)));
    const seen = new Set(rows.map(r => keyMap[r.key]).filter(Boolean));
    const missing = (chapters || []).filter(c => !seen.has(c.id)).map(c => c.name);
    await audit(session.uid, 'sdc_palms.report', { ym, as_of: asOf, on_time: updates.filter(u => u.palms_done).length, late: updates.filter(u => !u.palms_done).length });
    const name = id => (chapters || []).find(c => c.id === id)?.name || id;
    return { ok: true, as_of: asOf, updates: updates.map(u => ({ chapter: name(u.chapter_id), week_date: u.week_date, last: u.last, on_time: u.palms_done })), skipped, missing };
  }

  if (body.programme === 'sdc' && body.week_id) {
    const id = Number(body.week_id);
    const { data: w } = await db.from('sdc_weeks').select('id, month:sa_months(ym,sdc_status)').eq('id', id).single();
    if (!w) throw fail('Week not found', 404);
    if (w.month.sdc_status === 'published') throw fail('Month is published. Unpublish to edit.');
    const patch = { updated_at: now, updated_by: session.uid };
    for (const k of WEEK_EDITABLE) {
      if (!(k in body)) continue;
      const v = body[k];
      patch[k] = v === null || v === '' || v === undefined ? null : Boolean(v);
    }
    if ('no_meeting' in patch) patch.no_meeting = !!patch.no_meeting;
    if ('telebridge_done' in patch) patch.telebridge_auto = false; // manual override wins
    const r = await db.from('sdc_weeks').update(patch).eq('id', id);
    if (r.error) throw r.error;
    await audit(session.uid, 'sdc_week.update', { id, ym: w.month.ym, patch });
    return { ok: true };
  }

  const id = Number(body.id);
  if (!id) throw fail('Missing entry id');

  if (body.programme === 'sdc') {
    const { data: existing } = await db.from('sdc_entries').select('id, legacy, month:sa_months(ym,sdc_status)').eq('id', id).single();
    if (!existing) throw fail('Entry not found', 404);
    if (existing.legacy) throw fail('Legacy (imported) months are read-only');
    const patch = { updated_at: now, updated_by: session.uid };
    for (const k of SDC_EDITABLE) {
      if (!(k in body)) continue;
      let v = body[k];
      if (v === '' || v === undefined) v = null;
      if (['ltrt_attended', 'visit_done'].includes(k)) v = v === null ? null : Boolean(v);
      else if (k === 'tl_status') { v = v === null ? null : String(v).toUpperCase(); if (v && !['GREEN', 'AMBER', 'RED', 'GREY'].includes(v)) throw fail('tl_status must be GREEN, AMBER, RED or GREY'); }
      else if (k !== 'notes' && v !== null) { v = Number(v); if (Number.isNaN(v)) throw fail(`${k} must be a number`); }
      patch[k] = v;
    }
    if ('visit_done' in patch) patch.visit_auto = false;
    if ('tl_status' in patch) patch.tl_auto = false;
    const r = await db.from('sdc_entries').update(patch).eq('id', id);
    if (r.error) throw r.error;
    await audit(session.uid, 'sdc_entry.update', { id, ym: existing.month.ym, patch });
    return { ok: true };
  }

  const { data: existing } = await db.from('sa_entries').select('id, legacy, month:sa_months(ym,status)').eq('id', id).single();
  if (!existing) throw fail('Entry not found', 404);
  if (existing.legacy) throw fail('Legacy (imported) months are read-only');
  const patch = { updated_at: now, updated_by: session.uid };
  for (const k of EDITABLE) {
    if (!(k in body)) continue;
    let v = body[k];
    if (v === '' || v === undefined) v = null;
    if (['ltrt_attended', 'jotform_done'].includes(k)) v = v === null ? null : Boolean(v);
    else if (k !== 'notes' && v !== null) { v = Number(v); if (Number.isNaN(v)) throw fail(`${k} must be a number`); }
    patch[k] = v;
  }
  if ('jotform_done' in patch) patch.jotform_auto = false; // manual override wins
  const r = await db.from('sa_entries').update(patch).eq('id', id);
  if (r.error) throw r.error;
  await audit(session.uid, 'entry.update', { id, ym: existing.month.ym, patch });
  return { ok: true };
}, { role: 'admin' });
