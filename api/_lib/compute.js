import { db, loadSettings } from './db.js';
import { scoreEntry } from './scoring.js';

/** Loads a month's entries joined with chapter + SA, computes live scores for non-legacy rows, assigns ranks. */
export async function loadMonth(ym, settings) {
  const s = settings || (await loadSettings());
  const { data: month } = await db.from('sa_months').select('*').eq('ym', ym).maybeSingle();
  if (!month) return null;
  const { data: entries, error } = await db.from('sa_entries')
    .select('*, chapter:sa_chapters(id,name,region,sort_order), sa:sa_users(id,name,active)')
    .eq('month_id', month.id);
  if (error) throw error;
  const rows = (entries || []).map(e => ({ ...e, computed: e.legacy ? legacyComputed(e) : scoreEntry(e, s) }));
  rows.sort((a, b) => b.computed.total_scaled - a.computed.total_scaled || (a.chapter?.sort_order || 0) - (b.chapter?.sort_order || 0));
  rows.forEach((r, i) => { r.computed.rank = i + 1; });
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.computed.total_scaled, 0) / rows.length * 100) / 100 : 0;
  return { month, entries: rows.sort((a, b) => (a.chapter?.sort_order || 0) - (b.chapter?.sort_order || 0)), region_avg: avg, settings: s };
}

function legacyComputed(e) {
  return {
    points: e.points, total_raw: Number(e.total_raw), max_total: Number(e.max_total), total_scaled: Number(e.total_scaled),
    band: e.band, multiplier: Number(e.multiplier), payout: e.payout === null ? null : Number(e.payout),
    combined_training_pct: Number(e.online_pct || 0) + Number(e.offline_pct || 0), members_paid: null, legacy: true,
  };
}

/** Ensures a month row exists and has an entry for every active chapter (with the chapter's current SA). */
export async function ensureMonth(ym, userId) {
  if (!/^\d{4}-\d{2}$/.test(ym)) throw new Error('Month must be YYYY-MM');
  let { data: month } = await db.from('sa_months').select('*').eq('ym', ym).maybeSingle();
  if (!month) {
    const ins = await db.from('sa_months').insert({ ym }).select().single();
    if (ins.error) throw ins.error; month = ins.data;
  }
  const { data: chapters } = await db.from('sa_chapters').select('id').eq('active', true);
  const { data: sas } = await db.from('sa_users').select('id,chapter_id').eq('role', 'sa').eq('active', true);
  const saByChapter = {}; for (const u of sas || []) saByChapter[u.chapter_id] = u.id;
  const { data: existing } = await db.from('sa_entries').select('chapter_id').eq('month_id', month.id);
  const have = new Set((existing || []).map(e => e.chapter_id));
  const missing = (chapters || []).filter(c => !have.has(c.id)).map(c => ({ month_id: month.id, chapter_id: c.id, sa_user_id: saByChapter[c.id] || null, updated_by: userId }));
  if (missing.length) { const r = await db.from('sa_entries').insert(missing); if (r.error) throw r.error; }
  return month;
}

/** Writes computed fields into the entries (used on publish). */
export async function persistComputed(ym) {
  const m = await loadMonth(ym);
  if (!m) throw new Error('Month not found');
  for (const e of m.entries) {
    if (e.legacy) continue;
    const c = e.computed;
    const r = await db.from('sa_entries').update({
      points: c.points, total_raw: c.total_raw, max_total: c.max_total, total_scaled: c.total_scaled,
      band: c.band, multiplier: c.multiplier, payout: c.payout, rank: c.rank, updated_at: new Date().toISOString(),
    }).eq('id', e.id);
    if (r.error) throw r.error;
  }
  return m;
}
