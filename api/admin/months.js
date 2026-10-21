import { db, handler, fail, audit } from '../_lib/db.js';
import { loadMonth, ensureMonth, persistComputed } from '../_lib/compute.js';
import { loadSdcMonth, ensureSdcMonth, persistSdcComputed } from '../_lib/compute_sdc.js';

// programme = 'sa' (default) | 'sdc'   (query param on GET, body field on POST)
// GET                        -> list of months with status + averages for both programmes
// GET ?ym=YYYY-MM&programme= -> month detail (entries with live scores)
// POST {action:'create', ym, programme}
// POST {action:'publish'|'unpublish', ym, programme}
export default handler(async ({ req, session, body }) => {
  if (req.method === 'GET') {
    const ym = req.query?.ym;
    const programme = req.query?.programme === 'sdc' ? 'sdc' : 'sa';
    if (ym) {
      const m = programme === 'sdc' ? await loadSdcMonth(ym) : await loadMonth(ym);
      if (!m) throw fail('Month not found', 404);
      const { data: uploads } = await db.from('sa_uploads').select('id,kind,region,filename,summary,created_at').eq('month_id', m.month.id).order('created_at', { ascending: false });
      return { ...m, programme, uploads };
    }
    const { data: months } = await db.from('sa_months').select('*').order('ym', { ascending: false });
    const out = [];
    for (const mo of months || []) {
      const [m, d] = await Promise.all([loadMonth(mo.ym), loadSdcMonth(mo.ym)]);
      out.push({ ...mo,
        sa: { status: mo.status, region_avg: m.region_avg, entries: m.entries.length, filled: m.entries.filter(e => e.legacy || e.member_score !== null).length, payout_total: m.entries.reduce((a, e) => a + (e.computed.payout || 0), 0) },
        sdc: { status: mo.sdc_status, region_avg: d.region_avg, entries: d.entries.length, filled: d.entries.filter(e => e.legacy || e.member_score !== null || e.tl_status).length, payout_total: d.entries.reduce((a, e) => a + (e.computed.payout || 0), 0) },
        // backwards-compatible SA fields
        region_avg: m.region_avg, entries: m.entries.length, filled: m.entries.filter(e => e.legacy || e.member_score !== null).length, payout_total: m.entries.reduce((a, e) => a + (e.computed.payout || 0), 0) });
    }
    return { months: out };
  }
  if (req.method !== 'POST') throw fail('Method not allowed', 405);
  const { action, ym } = body;
  const programme = body.programme === 'sdc' ? 'sdc' : 'sa';
  const sdc = programme === 'sdc';
  if (action === 'create') {
    const month = sdc ? await ensureSdcMonth(ym, session.uid) : await ensureMonth(ym, session.uid);
    await audit(session.uid, 'month.create', { ym, programme });
    return { ok: true, month };
  }
  if (action === 'publish') {
    const m = sdc ? await persistSdcComputed(ym) : await persistComputed(ym);
    const patch = sdc ? { sdc_status: 'published', sdc_published_at: new Date().toISOString(), sdc_published_by: session.uid }
                      : { status: 'published', published_at: new Date().toISOString(), published_by: session.uid };
    const r = await db.from('sa_months').update(patch).eq('id', m.month.id);
    if (r.error) throw r.error;
    await audit(session.uid, 'month.publish', { ym, programme });
    return { ok: true };
  }
  if (action === 'unpublish') {
    const { data: mo } = await db.from('sa_months').select('id').eq('ym', ym).single();
    const patch = sdc ? { sdc_status: 'draft', sdc_published_at: null, sdc_published_by: null } : { status: 'draft', published_at: null, published_by: null };
    await db.from('sa_months').update(patch).eq('id', mo.id);
    await audit(session.uid, 'month.unpublish', { ym, programme });
    return { ok: true };
  }
  throw fail('Unknown action');
}, { role: 'admin' });
