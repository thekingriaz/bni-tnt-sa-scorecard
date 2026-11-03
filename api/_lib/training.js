import { db } from './db.js';
import { trainingPercents } from './parsers.js';

/**
 * Attendances that count for a month: the latest upload per region AND mode (an online and an in-person report for the
 * same region both count; re-uploading the same one replaces it). Each attendance carries its upload's mode.
 */
export function combinedAttendances(ups) {
  const latest = {}; for (const u of ups) latest[`${u.summary?.region || 'x'}|${u.summary?.mode || 'list'}`] = u;
  return Object.values(latest).flatMap(u => (u.summary?.attendances || []).map(a => ({ ...a, mode: u.summary?.mode || a.mode || null })));
}

/** Recompute online/offline % from stored training uploads of a month (after member counts or event-type list change). */
export async function recomputeTraining(monthId, settings, chapterIds) {
  const { data: ups } = await db.from('sa_uploads').select('id,summary,created_at').eq('month_id', monthId).eq('kind', 'training').order('created_at');
  if (!ups?.length) return;
  const { data: chapters } = await db.from('sa_chapters').select('id,key');
  const { data: entries } = await db.from('sa_entries').select('id,chapter_id,member_count').eq('month_id', monthId);
  const attendances = combinedAttendances(ups);
  for (const c of chapters) {
    if (chapterIds && !chapterIds.includes(c.id)) continue;
    const e = entries.find(x => x.chapter_id === c.id); if (!e) continue;
    if (!attendances.some(a => a.key === c.key)) continue;
    const t = trainingPercents(attendances, c.key, Number(e.member_count || 0), settings.online_event_types);
    await db.from('sa_entries').update({ online_pct: t.online_pct, offline_pct: t.offline_pct, training_unique: t.unique_members }).eq('id', e.id);
  }
}
