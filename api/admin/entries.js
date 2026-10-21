import { db, handler, fail, audit } from '../_lib/db.js';

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
