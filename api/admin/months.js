import { db, handler, fail, audit } from '../_lib/db.js';
import { loadMonth, ensureMonth, persistComputed } from '../_lib/compute.js';

// GET            -> list of months with status + averages
// GET ?ym=YYYY-MM -> month detail (entries with live scores)
// POST {action:'create', ym}
// POST {action:'publish'|'unpublish', ym}
export default handler(async ({ req, session, body }) => {
  if (req.method === 'GET') {
    const ym = req.query?.ym;
    if (ym) {
      const m = await loadMonth(ym);
      if (!m) throw fail('Month not found', 404);
      const { data: uploads } = await db.from('sa_uploads').select('id,kind,region,filename,summary,created_at').eq('month_id', m.month.id).order('created_at', { ascending: false });
      return { ...m, uploads };
    }
    const { data: months } = await db.from('sa_months').select('*').order('ym', { ascending: false });
    const out = [];
    for (const mo of months || []) {
      const m = await loadMonth(mo.ym);
      out.push({ ...mo, region_avg: m.region_avg, entries: m.entries.length,
        filled: m.entries.filter(e => e.legacy || e.member_score !== null).length,
        payout_total: m.entries.reduce((a, e) => a + (e.computed.payout || 0), 0) });
    }
    return { months: out };
  }
  if (req.method !== 'POST') throw fail('Method not allowed', 405);
  const { action, ym } = body;
  if (action === 'create') {
    const month = await ensureMonth(ym, session.uid);
    await audit(session.uid, 'month.create', { ym });
    return { ok: true, month };
  }
  if (action === 'publish') {
    const m = await persistComputed(ym);
    const r = await db.from('sa_months').update({ status: 'published', published_at: new Date().toISOString(), published_by: session.uid }).eq('id', m.month.id);
    if (r.error) throw r.error;
    await audit(session.uid, 'month.publish', { ym });
    return { ok: true };
  }
  if (action === 'unpublish') {
    const { data: mo } = await db.from('sa_months').select('id').eq('ym', ym).single();
    await db.from('sa_months').update({ status: 'draft', published_at: null, published_by: null }).eq('id', mo.id);
    await audit(session.uid, 'month.unpublish', { ym });
    return { ok: true };
  }
  throw fail('Unknown action');
}, { role: 'admin' });
