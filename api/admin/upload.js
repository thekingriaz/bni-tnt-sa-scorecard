import { db, handler, fail, audit, loadSettings } from '../_lib/db.js';
import { ensureMonth } from '../_lib/compute.js';
import { parseChapterStatistics, parseTrainingReport, parseTrafficLights, trainingPercents, normChapter } from '../_lib/parsers.js';
import { ensureSdcMonth } from '../_lib/compute_sdc.js';
import { recomputeTraining } from '../_lib/training.js';

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

// POST { kind: 'chapter_statistics'|'training', filename, text }   (text = raw file contents; month read from the file)
// POST { kind: 'traffic_lights', filename, ym, rows }               (rows = sheet as array of arrays, parsed in the browser with SheetJS)
// Entries for that month are created/updated. Chapter Statistics feeds both programmes (member count -> SDC net add).
export default handler(async ({ req, session, body }) => {
  if (req.method !== 'POST') throw fail('POST only', 405);
  const { kind, filename, text } = body;
  if (!text && kind !== 'traffic_lights') throw fail('No file content received');
  const settings = await loadSettings();
  const { data: chapters } = await db.from('sa_chapters').select('id,name,key').eq('active', true);
  const byKey = {}; for (const c of chapters) byKey[c.key] = c;

  let parsed, month, updated = [], unmatched = [], summary;
  if (kind === 'chapter_statistics') {
    parsed = parseChapterStatistics(text);
    month = await ensureMonth(parsed.month, session.uid);
    const sdcMonth = await ensureSdcMonth(parsed.month, session.uid);
    const saLocked = month.status === 'published', sdcLocked = sdcMonth.sdc_status === 'published';
    if (saLocked && sdcLocked) throw fail(`${parsed.month} is published for both SAs and SDCs. Unpublish it first if you need to re-upload.`);
    for (const r of parsed.rows) {
      const c = byKey[r.key] || byKey[normChapter(r.chapter)];
      if (!c) { unmatched.push(r.chapter); continue; }
      if (!saLocked) {
        const up = await db.from('sa_entries').update({
          member_count: r.mem_avg, one_to_one_per_member: r.one_to_one_per_member,
          updated_at: new Date().toISOString(), updated_by: session.uid,
        }).eq('month_id', month.id).eq('chapter_id', c.id);
        if (up.error) throw up.error;
      }
      // SDC programme shares the member count (drives Chapter Net Growth); written even on legacy SDC rows so the next month has a baseline
      if (!sdcLocked || saLocked) {
        await db.from('sdc_entries').update({ member_count: r.mem_avg, updated_at: new Date().toISOString(), updated_by: session.uid }).eq('month_id', month.id).eq('chapter_id', c.id);
      }
      updated.push({ chapter: c.name, member_count: r.mem_avg, one_to_one_per_member: r.one_to_one_per_member });
    }
    // If a training upload already happened for these chapters, recompute its % with the new member counts
    if (!saLocked) await recomputeTraining(month.id, settings, updated.map(u => byKey[normChapter(u.chapter)].id));
    summary = { region: parsed.region, month: parsed.month, chapters: updated.length, unmatched, sa_locked: saLocked };
  } else if (kind === 'training') {
    parsed = parseTrainingReport(text);
    month = await ensureMonth(parsed.month, session.uid);
    if (month.status === 'published') throw fail(`${parsed.month} is already published. Unpublish it first if you need to re-upload.`);
    // Store raw attendances in the upload summary so online/offline can be recomputed when the event-type list changes
    const { data: entries } = await db.from('sa_entries').select('id,chapter_id,member_count').eq('month_id', month.id);
    const entryByChapter = {}; for (const e of entries || []) entryByChapter[e.chapter_id] = e;
    const chapterKeys = new Set(parsed.attendances.map(a => a.key));
    for (const key of chapterKeys) {
      const c = byKey[key];
      if (!c) { unmatched.push(parsed.by_chapter[key].chapter); continue; }
      const e = entryByChapter[c.id];
      const memberCount = e?.member_count ? Number(e.member_count) : 0;
      const t = trainingPercents(parsed.attendances, key, memberCount, settings.online_event_types);
      const up = await db.from('sa_entries').update({
        online_pct: t.online_pct, offline_pct: t.offline_pct, training_unique: t.unique_members,
        updated_at: new Date().toISOString(), updated_by: session.uid,
      }).eq('id', e.id);
      if (up.error) throw up.error;
      updated.push({ chapter: c.name, ...t, member_count: memberCount, needs_member_count: memberCount === 0 });
    }
    // Chapters in this region with zero attendances: set 0/0 so the month is complete
    summary = { region: parsed.region, month: parsed.month, chapters: updated.length, unmatched, event_types: parsed.event_types,
      attendances: parsed.attendances.map(a => ({ key: a.key, member_key: a.member_key, event_type: a.event_type })) };
  } else if (kind === 'traffic_lights') {
    if (!/^\d{4}-\d{2}$/.test(body.ym || '')) throw fail('Pick the month this Traffic Lights report is for');
    parsed = parseTrafficLights(body.rows, body.ym);
    month = await ensureSdcMonth(parsed.month, session.uid);
    if (month.sdc_status === 'published') throw fail(`${parsed.month} is already published for SDCs. Unpublish it first if you need to re-upload.`);
    const { data: entries } = await db.from('sdc_entries').select('id,chapter_id,tl_status,tl_auto').eq('month_id', month.id);
    for (const r of parsed.rows) {
      const c = byKey[r.key];
      if (!c) continue; // the all-India file lists ~1500 chapters; only ours matter
      const e = (entries || []).find(x => x.chapter_id === c.id); if (!e) continue;
      const patch = { tl_score: r.score, tl_growth: r.growth, updated_at: new Date().toISOString(), updated_by: session.uid };
      const manual = e.tl_auto === false && e.tl_status !== null;
      if (!manual) { patch.tl_status = r.status; patch.tl_auto = true; }
      const up = await db.from('sdc_entries').update(patch).eq('id', e.id);
      if (up.error) throw up.error;
      updated.push({ chapter: c.name, status: r.status, score: r.score, growth: r.growth, kept_manual: manual });
    }
    const found = new Set(updated.map(u => normChapter(u.chapter)));
    unmatched = chapters.filter(c => !found.has(c.key)).map(c => c.name);
    parsed.region = 'All India';
    summary = { month: parsed.month, chapters: updated.length, missing: unmatched, rows_in_file: parsed.rows.length, header: parsed.header };
  } else throw fail('kind must be chapter_statistics, training or traffic_lights');

  await db.from('sa_uploads').insert({ month_id: month.id, kind, region: parsed.region, filename, summary, uploaded_by: session.uid });
  await audit(session.uid, 'upload', { kind, filename, month: parsed.month, region: parsed.region });
  const warning = !unmatched.length ? null
    : kind === 'traffic_lights' ? `Our chapters not found in the file: ${unmatched.join(', ')}. Set their status by hand.`
    : `Chapters not found in the app: ${unmatched.join(', ')}. Add them in Settings > Chapters.`;
  const note = summary?.sa_locked ? `${parsed.month} is published for SAs, so only the SDC member counts were updated.` : null;
  return { ok: true, kind, month: parsed.month, region: parsed.region, updated, unmatched, event_types: parsed.event_types || null, warning: [warning, note].filter(Boolean).join(' ') || null };
}, { role: 'admin' });
