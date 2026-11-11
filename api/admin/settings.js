import { db, handler, fail, audit, loadSettings } from '../_lib/db.js';
import { recomputeTraining } from '../_lib/training.js';

const KEYS = ['senior_commission_pct', 'fee_types', 'royalty_pct', 'fee_amount', 'commission_pct', 'sdc_commission_pct', 'telebridge_form_id', 'mentoring_enabled', 'one_to_one_threshold', 'online_event_types', 'jotform_form_id', 'thresholds', 'bands', 'max_pts'];

// GET -> settings + chapters + known event types (from uploads)
// PUT { key: value, ... } -> update; recomputes training % for draft months when the online list changes
export default handler(async ({ req, session, body }) => {
  if (req.method === 'GET') {
    const settings = await loadSettings();
    const { data: chapters } = await db.from('sa_chapters').select('*').order('sort_order');
    const { data: ups } = await db.from('sa_uploads').select('summary').eq('kind', 'training').order('created_at', { ascending: false }).limit(12);
    const seen = new Set(); for (const u of ups || []) for (const t of u.summary?.event_types || []) seen.add(t);
    return { settings, chapters, known_event_types: [...seen].sort() };
  }
  if (req.method !== 'PUT' && req.method !== 'POST') throw fail('PUT only', 405);
  const patch = {};
  for (const k of KEYS) if (k in body) patch[k] = body[k];
  if ('fee_amount' in patch) patch.fee_amount = Number(patch.fee_amount);
  if ('commission_pct' in patch) patch.commission_pct = Number(patch.commission_pct);
  if ('sdc_commission_pct' in patch) patch.sdc_commission_pct = Number(patch.sdc_commission_pct);
  if ('senior_commission_pct' in patch) patch.senior_commission_pct = Number(patch.senior_commission_pct);
  if ('fee_types' in patch) {
    const cur = (await loadSettings()).fee_types;
    patch.fee_types = cur.map(t => { const u = (patch.fee_types || []).find(x => x.key === t.key) || {};
      const fee = u.fee === undefined ? t.fee : Number(u.fee), rd = u.rd === undefined ? t.rd : Number(u.rd);
      if (!(fee > 0) || !(rd >= 0) || rd >= fee) throw fail(`${t.label}: enter a fee above 0 and a BNI tech fee below the fee`);
      return { ...t, fee, rd }; });
  }
  if ('royalty_pct' in patch) { patch.royalty_pct = Number(patch.royalty_pct); if (!(patch.royalty_pct >= 0 && patch.royalty_pct < 100)) throw fail('BNI royalty % must be between 0 and 99'); }
  if ('one_to_one_threshold' in patch) patch.one_to_one_threshold = Number(patch.one_to_one_threshold);
  if ('mentoring_enabled' in patch) patch.mentoring_enabled = Boolean(patch.mentoring_enabled);
  if ('online_event_types' in patch) patch.online_event_types = [...new Set((patch.online_event_types || []).map(s => String(s).trim()).filter(Boolean))];
  for (const [key, value] of Object.entries(patch)) {
    const r = await db.from('sa_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    if (r.error) throw r.error;
  }
  if ('online_event_types' in patch) {
    const settings = await loadSettings();
    const { data: drafts } = await db.from('sa_months').select('id').eq('status', 'draft');
    for (const m of drafts || []) await recomputeTraining(m.id, settings);
  }
  if (body.chapters) { // optional chapter edits: [{id?, name, key, region, sort_order, active}]
    for (const c of body.chapters) {
      const row = { name: c.name, key: c.key, region: c.region, sort_order: Number(c.sort_order || 0), active: c.active !== false, meeting_day: c.meeting_day === '' || c.meeting_day === undefined || c.meeting_day === null ? null : Number(c.meeting_day) };
      if ('senior_user_id' in c) row.senior_user_id = c.senior_user_id ? Number(c.senior_user_id) : null;
      const r = c.id ? await db.from('sa_chapters').update(row).eq('id', c.id) : await db.from('sa_chapters').insert(row);
      if (r.error) throw r.error;
      // a changed Senior DC applies to SDC months not yet published
      if (c.id && 'senior_user_id' in c) {
        const { data: open } = await db.from('sa_months').select('id').eq('sdc_status', 'draft').gte('ym', (await loadSettings()).go_live_ym || '2026-10');
        if (open?.length) await db.from('sdc_entries').update({ senior_user_id: row.senior_user_id }).eq('chapter_id', c.id).in('month_id', open.map(m => m.id));
      }
    }
  }
  await audit(session.uid, 'settings.update', patch);
  return { ok: true, settings: await loadSettings() };
}, { role: 'admin' });
