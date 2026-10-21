import { db, loadSettings } from './db.js';
import { scoreSdcEntry, meetingDates, weekCounts } from './scoring_sdc.js';

const prevYm = ym => { const [y, m] = ym.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; };

/** Loads an SDC month: entries + weeks joined with chapter + SDC, live scores for non-legacy rows, ranks. */
export async function loadSdcMonth(ym, settings) {
  const s = settings || (await loadSettings());
  const { data: month } = await db.from('sa_months').select('*').eq('ym', ym).maybeSingle();
  if (!month) return null;
  const [{ data: entries, error }, { data: weeks }, { data: saRows }, { data: prevMonth }] = await Promise.all([
    db.from('sdc_entries').select('*, chapter:sa_chapters(id,name,region,sort_order,meeting_day), sdc:sa_users!sdc_entries_sdc_user_id_fkey(id,name,active)').eq('month_id', month.id),
    db.from('sdc_weeks').select('*').eq('month_id', month.id).order('week_date'),
    db.from('sa_entries').select('chapter_id,new_members,renewals,member_count').eq('month_id', month.id),
    db.from('sa_months').select('id').eq('ym', prevYm(ym)).maybeSingle(),
  ]);
  if (error) throw error;
  let prevCounts = {};
  if (prevMonth) {
    const [{ data: a }, { data: b }] = await Promise.all([
      db.from('sa_entries').select('chapter_id,member_count').eq('month_id', prevMonth.id),
      db.from('sdc_entries').select('chapter_id,member_count').eq('month_id', prevMonth.id),
    ]);
    for (const r of [...(a || []), ...(b || [])]) if (r.member_count !== null && r.member_count !== undefined) prevCounts[r.chapter_id] = Number(r.member_count);
  }
  const saByChapter = {}; for (const r of saRows || []) saByChapter[r.chapter_id] = r;

  const rows = (entries || []).map(e => {
    const w = (weeks || []).filter(x => x.chapter_id === e.chapter_id);
    const sa = saByChapter[e.chapter_id];
    const memberCount = e.member_count ?? sa?.member_count ?? null;
    const prev = prevCounts[e.chapter_id];
    const derived = (memberCount !== null && prev !== undefined) ? Math.round(Number(memberCount) - prev) : null;
    const counts = e.legacy ? { meetings_total: e.meetings_total, telebridge_weeks: e.telebridge_weeks, palms_weeks: e.palms_weeks } : weekCounts(w);
    const effective = {
      ...e, ...counts,
      member_count: memberCount, prev_member_count: prev ?? null, net_add_derived: derived,
      net_add: e.net_add ?? derived,
      members_paid: (Number(sa?.new_members || 0) + Number(sa?.renewals || 0)),
      new_members: sa?.new_members ?? null, renewals: sa?.renewals ?? null,
    };
    return { ...effective, weeks: w, computed: e.legacy ? legacyComputed(e) : scoreSdcEntry(effective, s) };
  });
  rows.sort((a, b) => b.computed.total_scaled - a.computed.total_scaled || (a.chapter?.sort_order || 0) - (b.chapter?.sort_order || 0));
  rows.forEach((r, i) => { r.computed.rank = i + 1; });
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.computed.total_scaled, 0) / rows.length * 100) / 100 : 0;
  return { month, entries: rows.sort((a, b) => (a.chapter?.sort_order || 0) - (b.chapter?.sort_order || 0)), region_avg: avg, settings: s };
}

function legacyComputed(e) {
  return {
    points: e.points, total_raw: Number(e.total_raw), max_total: Number(e.max_total), total_scaled: Number(e.total_scaled),
    band: e.band, multiplier: Number(e.multiplier), payout: e.payout === null ? null : Number(e.payout), members_paid: null,
    meetings_total: e.meetings_total, legacy: true,
  };
}

/** Ensures the month row, one sdc_entries row per active chapter (with the current SDC) and one sdc_weeks row per meeting date. */
export async function ensureSdcMonth(ym, userId) {
  if (!/^\d{4}-\d{2}$/.test(ym)) throw new Error('Month must be YYYY-MM');
  let { data: month } = await db.from('sa_months').select('*').eq('ym', ym).maybeSingle();
  if (!month) {
    const ins = await db.from('sa_months').insert({ ym }).select().single();
    if (ins.error) throw ins.error; month = ins.data;
  }
  const { data: chapters } = await db.from('sa_chapters').select('id,meeting_day').eq('active', true);
  const { data: sdcs } = await db.from('sa_users').select('id,chapter_id').eq('role', 'sdc').eq('active', true);
  const byChapter = {}; for (const u of sdcs || []) byChapter[u.chapter_id] = u.id;
  const { data: existing } = await db.from('sdc_entries').select('chapter_id').eq('month_id', month.id);
  const have = new Set((existing || []).map(e => e.chapter_id));
  const missing = (chapters || []).filter(c => !have.has(c.id)).map(c => ({ month_id: month.id, chapter_id: c.id, sdc_user_id: byChapter[c.id] || null, updated_by: userId }));
  if (missing.length) { const r = await db.from('sdc_entries').insert(missing); if (r.error) throw r.error; }
  // weeks
  const { data: wk } = await db.from('sdc_weeks').select('chapter_id,week_date').eq('month_id', month.id);
  const haveW = new Set((wk || []).map(w => `${w.chapter_id}|${w.week_date}`));
  const newW = [];
  for (const c of chapters || []) for (const d of meetingDates(ym, c.meeting_day)) if (!haveW.has(`${c.id}|${d}`)) newW.push({ month_id: month.id, chapter_id: c.id, week_date: d, updated_by: userId });
  if (newW.length) { const r = await db.from('sdc_weeks').insert(newW); if (r.error) throw r.error; }
  return month;
}

/** Writes computed fields into sdc_entries (used on publish). */
export async function persistSdcComputed(ym) {
  const m = await loadSdcMonth(ym);
  if (!m) throw new Error('Month not found');
  for (const e of m.entries) {
    if (e.legacy) continue;
    const c = e.computed;
    const r = await db.from('sdc_entries').update({
      points: c.points, total_raw: c.total_raw, max_total: c.max_total, total_scaled: c.total_scaled,
      band: c.band, multiplier: c.multiplier, payout: c.payout, rank: c.rank, updated_at: new Date().toISOString(),
    }).eq('id', e.id);
    if (r.error) throw r.error;
  }
  return m;
}
