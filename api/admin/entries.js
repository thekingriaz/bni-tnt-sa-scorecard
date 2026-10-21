import { db, handler, fail, audit } from '../_lib/db.js';

const EDITABLE = ['member_score', 'online_pct', 'offline_pct', 'training_unique', 'member_count', 'mentoring_pct', 'retention_pct',
  'one_to_one_per_member', 'ltrt_attended', 'jotform_done', 'new_members', 'renewals', 'notes', 'sa_user_id'];

// PUT { id, ...fields }  -> updates one entry (manual inputs / overrides)
export default handler(async ({ req, session, body }) => {
  if (req.method !== 'PUT' && req.method !== 'POST') throw fail('PUT only', 405);
  const id = Number(body.id);
  if (!id) throw fail('Missing entry id');
  const { data: existing } = await db.from('sa_entries').select('id, legacy, month:sa_months(ym,status)').eq('id', id).single();
  if (!existing) throw fail('Entry not found', 404);
  if (existing.legacy) throw fail('Legacy (imported) months are read-only');
  const patch = { updated_at: new Date().toISOString(), updated_by: session.uid };
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
