import { db, handler, fail, audit, loadSettings } from '../_lib/db.js';
import { ensureMonth } from '../_lib/compute.js';
import { parseChapterStatistics, parseTrainingReport, parseTrafficLights, parseMembershipActivity, parseChapterRetention, parseCommissionReport, matchAttendance, trainingPercents, normChapter } from '../_lib/parsers.js';
import { ensureSdcMonth } from '../_lib/compute_sdc.js';
import { recomputeTraining } from '../_lib/training.js';

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

// POST { kind: 'chapter_statistics'|'training', filename, text }   (text = raw file contents; month read from the file)
// POST { kind: 'traffic_lights', filename, ym, rows }               (rows = sheet as array of arrays, parsed in the browser with SheetJS)
// Entries for that month are created/updated. Chapter Statistics feeds both programmes (member count -> SDC net add).
export default handler(async ({ req, session, body }) => {
  if (req.method !== 'POST') throw fail('POST only', 405);
  const { kind, filename, text } = body;
  if (!text && !['traffic_lights', 'chapter_retention', 'attendance'].includes(kind)) throw fail('No file content received');
  const settings = await loadSettings();
  const { data: chapters } = await db.from('sa_chapters').select('id,name,key').eq('active', true);
  const byKey = {}; for (const c of chapters) byKey[c.key] = c;

  let parsed, month, updated = [], unmatched = [], summary;
  if (kind === 'chapter_statistics') {
    parsed = parseChapterStatistics(text);
    month = await ensureMonth(parsed.month, session.uid);
    const sdcMonth = await ensureSdcMonth(parsed.month, session.uid);
    const baseline = parsed.month < settings.go_live_ym; // pre-go-live months only hold member counts; their scores are never shown
    const saLocked = !baseline && month.status === 'published', sdcLocked = !baseline && sdcMonth.sdc_status === 'published';
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
    if (!saLocked && !baseline) await recomputeTraining(month.id, settings, updated.map(u => byKey[normChapter(u.chapter)].id));
    summary = { region: parsed.region, month: parsed.month, chapters: updated.length, unmatched, sa_locked: saLocked, baseline };
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
  } else if (kind === 'membership_activity') {
    // SDC Chapter Net Growth = Joined minus Left for the month, straight from BNI Connect
    parsed = parseMembershipActivity(text);
    month = await ensureSdcMonth(parsed.month, session.uid);
    const baseline = parsed.month < settings.go_live_ym;
    if (!baseline && month.sdc_status === 'published') throw fail(`${parsed.month} is already published for SDCs. Unpublish it first if you need to re-upload.`);
    const { data: entries } = await db.from('sdc_entries').select('id,chapter_id,net_add,net_add_auto').eq('month_id', month.id);
    for (const r of parsed.rows) {
      const c = byKey[r.key];
      if (!c) { unmatched.push(r.chapter); continue; }
      const e = (entries || []).find(x => x.chapter_id === c.id); if (!e) continue;
      const manual = e.net_add_auto === false && e.net_add !== null && e.net_add !== undefined;
      const patch = { joined: r.joined, left_count: r.left, member_count: r.end, updated_at: new Date().toISOString(), updated_by: session.uid };
      if (!manual) { patch.net_add = r.change; patch.net_add_auto = true; }
      const up = await db.from('sdc_entries').update(patch).eq('id', e.id);
      if (up.error) throw up.error;
      updated.push({ chapter: c.name, joined: r.joined, left: r.left, change: r.change, end: r.end, kept_manual: manual });
    }
    summary = { region: parsed.region, month: parsed.month, chapters: updated.length, unmatched };
  } else if (kind === 'attendance') {
    // LTRT / DCRT attendance sheet (colours read in the browser): one file updates both SDCs and SAs
    const meeting = body.meeting === 'dcrt' ? 'dcrt' : 'ltrt';
    if (!/^\d{4}-\d{2}$/.test(body.ym || '')) throw fail('Could not tell which month this attendance sheet is for');
    parsed = { month: body.ym, region: meeting.toUpperCase() };
    const saMonth = await ensureMonth(body.ym, session.uid); const sdcMonth = await ensureSdcMonth(body.ym, session.uid);
    month = saMonth;
    const { data: users } = await db.from('sa_users').select('id,role,name,jotform_alias,chapter_id,active').in('role', ['sa', 'sdc']).eq('active', true);
    const keyOf = {}; for (const c of chapters) keyOf[c.id] = c.key;
    const { matches, unmatched: um } = matchAttendance(body.records, (users || []).map(u => ({ ...u, chapter_key: keyOf[u.chapter_id] })));
    const col = meeting + '_att';
    const jobs = [];
    for (const m of matches) for (const u of m.users) {
      const tbl = u.role === 'sdc' ? 'sdc_entries' : 'sa_entries', mo = u.role === 'sdc' ? sdcMonth : saMonth;
      if ((u.role === 'sdc' ? mo.sdc_status : mo.status) === 'published') continue;
      jobs.push(db.from(tbl).update({ [col]: m.record.attended, updated_at: new Date().toISOString(), updated_by: session.uid }).eq('month_id', mo.id).eq('chapter_id', u.chapter_id));
      updated.push({ role: u.role, name: u.name, chapter: chapters.find(c => c.id === u.chapter_id)?.name, as: m.record.name, attended: m.record.attended });
    }
    for (const r of await Promise.all(jobs)) if (r.error) throw r.error; // parallel: sequential writes came close to the 30 s limit
    unmatched = um.map(r => `${r.name} (${r.programme.toUpperCase()}${r.chapter ? ', ' + r.chapter : ''})`);
    summary = { meeting, month: body.ym, matched: updated.length, unmatched };
  } else if (kind === 'commission') {
    // Region Commission Report: one row per paid invoice -> New members + Renewals per chapter (SA month; SDC payout reads the same)
    parsed = parseCommissionReport(text, settings.fee_types || undefined);
    month = await ensureMonth(parsed.month, session.uid);
    if (month.status === 'published') throw fail(`${parsed.month} is already published for SAs. Unpublish it first if you need to re-upload.`);
    const per = {};
    for (const r of parsed.rows) {
      const c = byKey[r.key]; if (!c) { if (!unmatched.includes(r.chapter)) unmatched.push(r.chapter); continue; }
      const p = per[c.id] || (per[c.id] = { chapter: c.name, new_members: 0, renewals: 0, new_2y: 0, ren_2y: 0, two_year: 0, fee_total: 0, unknown: 0 });
      if (r.type === 'new') p.new_members++; else if (r.type === 'renewal') p.renewals++; else p.unknown++;
      if (r.years === 2) { p.two_year++; if (r.type === 'new') p.new_2y++; else if (r.type === 'renewal') p.ren_2y++; }
      p.fee_total = Math.round((p.fee_total + r.fee) * 100) / 100;
    }
    // a region file only covers its own chapters: set those (zero for its chapters with no invoices), leave the other region alone
    const { data: regionOf } = await db.from('sa_chapters').select('id,region').eq('active', true);
    const regionsInFile = new Set(Object.keys(per).map(id => regionOf.find(x => x.id === Number(id))?.region));
    const cjobs = [];
    for (const c of regionOf.filter(x => regionsInFile.has(x.region))) {
      const p = per[c.id] || { chapter: chapters.find(x => x.id === c.id)?.name, new_members: 0, renewals: 0, new_2y: 0, ren_2y: 0, two_year: 0, fee_total: 0, unknown: 0 };
      cjobs.push(db.from('sa_entries').update({ new_members: p.new_members, renewals: p.renewals, new_2y: p.new_2y, ren_2y: p.ren_2y, updated_at: new Date().toISOString(), updated_by: session.uid }).eq('month_id', month.id).eq('chapter_id', c.id));
      updated.push(p);
    }
    for (const r of await Promise.all(cjobs)) if (r.error) throw r.error;
    parsed.region = [...regionsInFile].join(', ');
    summary = { month: parsed.month, chapters: updated.length, unmatched, unknown_fees: parsed.unknown.map(u => `${u.chapter} ${u.name} ${u.fee}`) };
    if (parsed.unknown.length) unmatched.push(...parsed.unknown.map(u => `fee ${u.fee} not recognised (${u.chapter}, ${u.name})`));
  } else if (kind === 'chapter_retention') {
    // 3+1 Traffic Lights, sheet "Chapter NPS (Total to Date)": Overall Retention Rate (Rolling) -> SDC Renewal %
    const { data: chRegions } = await db.from('sa_chapters').select('region').eq('active', true);
    parsed = parseChapterRetention(body.rows, [...new Set((chRegions || []).map(c => c.region))], filename, body.ym);
    if (!parsed.month) throw fail('Could not read the month from the file name (expected "... 2026-10 ..."). Rename the file or pick the month.');
    // one file feeds both programmes: SDC Renewal % = Overall Retention, SA 1st-Year Retention = First Year Retention
    const sdcMonth = await ensureSdcMonth(parsed.month, session.uid);
    const saMonth = await ensureMonth(parsed.month, session.uid);
    month = sdcMonth;
    const baseline = parsed.month < settings.go_live_ym;
    const sdcLocked = !baseline && sdcMonth.sdc_status === 'published', saLocked = !baseline && saMonth.status === 'published';
    if (sdcLocked && saLocked) throw fail(`${parsed.month} is already published for SAs and SDCs. Unpublish it first if you need to re-upload.`);
    const rjobs = [], now = new Date().toISOString();
    for (const r of parsed.rows) {
      const c = byKey[r.key]; if (!c) { unmatched.push(r.chapter); continue; }
      if (!sdcLocked) rjobs.push(db.from('sdc_entries').update({ retention_pct: r.overall_pct, retention_na: r.overall_pct === null, updated_at: now, updated_by: session.uid }).eq('month_id', sdcMonth.id).eq('chapter_id', c.id));
      if (!saLocked) rjobs.push(db.from('sa_entries').update({ retention_pct: r.first_year_pct, retention_na: r.first_year_pct === null, updated_at: now, updated_by: session.uid }).eq('month_id', saMonth.id).eq('chapter_id', c.id));
      updated.push({ chapter: c.name, overall_pct: r.overall_pct, first_year_pct: r.first_year_pct, young: r.young });
    }
    if (sdcLocked) parsed.lockNote = 'SDC month is published, so only SA 1st-year retention was updated.';
    if (saLocked) parsed.lockNote = 'SA month is published, so only SDC renewal % was updated.';
    for (const r of await Promise.all(rjobs)) if (r.error) throw r.error;
    const found = new Set(updated.map(u => normChapter(u.chapter)));
    unmatched = chapters.filter(c => !found.has(c.key)).map(c => c.name);
    parsed.region = '3+1';
    summary = { month: parsed.month, chapters: updated.length, missing: unmatched, sa_locked: saLocked, sdc_locked: sdcLocked };
  } else if (kind === 'traffic_lights') {
    const { data: chRegions } = await db.from('sa_chapters').select('region').eq('active', true);
    const regions = [...new Set((chRegions || []).map(c => c.region))];
    parsed = parseTrafficLights(body.rows, null, regions); // month comes from the file's latest "Score <Month YYYY>" column
    if (!parsed.month) { if (!/^\d{4}-\d{2}$/.test(body.ym || '')) throw fail('Could not read the month from the file'); parsed.month = body.ym; }
    month = await ensureSdcMonth(parsed.month, session.uid);
    const tlBaseline = parsed.month < settings.go_live_ym;
    if (!tlBaseline && month.sdc_status === 'published') throw fail(`${parsed.month} is already published for SDCs. Unpublish it first if you need to re-upload.`);
    const { data: entries } = await db.from('sdc_entries').select('id,chapter_id,tl_status,tl_auto').eq('month_id', month.id);
    for (const r of parsed.rows) {
      const c = byKey[r.key];
      if (!c) continue; // the all-India file lists ~1500 chapters; only ours matter
      const e = (entries || []).find(x => x.chapter_id === c.id); if (!e) continue;
      const patch = { tl_score: r.score, tl_growth: r.growth, updated_at: new Date().toISOString(), updated_by: session.uid };
      const manual = !tlBaseline && e.tl_auto === false && e.tl_status !== null;
      if (!manual) { patch.tl_status = r.status; patch.tl_auto = true; }
      const up = await db.from('sdc_entries').update(patch).eq('id', e.id);
      if (up.error) throw up.error;
      updated.push({ chapter: c.name, status: r.status, score: r.score, growth: r.growth, kept_manual: manual });
    }
    const found = new Set(updated.map(u => normChapter(u.chapter)));
    unmatched = chapters.filter(c => !found.has(c.key)).map(c => c.name);
    parsed.region = 'All India';
    summary = { month: parsed.month, chapters: updated.length, missing: unmatched, score_column: parsed.score_column };
  } else throw fail('kind must be chapter_statistics, training, membership_activity, commission, chapter_retention or traffic_lights');

  await db.from('sa_uploads').insert({ month_id: month.id, kind, region: parsed.region, filename, summary, uploaded_by: session.uid });
  await audit(session.uid, 'upload', { kind, filename, month: parsed.month, region: parsed.region });
  const warning = !unmatched.length ? null
    : kind === 'traffic_lights' ? `Our chapters not found in the file: ${unmatched.join(', ')}. Set their status by hand.`
    : kind === 'commission' ? `Check: ${unmatched.join('; ')}.`
    : kind === 'attendance' ? `Not matched to an active SA / SDC (set by hand if needed): ${unmatched.join(', ')}.`
    : `Chapters not found in the app: ${unmatched.join(', ')}. Add them in Settings > Chapters.`;
  if (kind === 'traffic_lights') {
    const note2 = parsed.month < settings.go_live_ym ? `This is the ${parsed.month} report: that month is before go-live and is not scored. Upload the report whose latest score column is the month you are scoring.` : null;
    return { ok: true, kind, month: parsed.month, region: parsed.region, score_column: parsed.score_column, updated, unmatched, warning: [warning, note2].filter(Boolean).join(' ') || null };
  }
  const note = parsed.lockNote || (kind === 'chapter_statistics' && summary?.sa_locked ? `${parsed.month} is published for SAs, so only the SDC member counts were updated.` : null);
  return { ok: true, kind, month: parsed.month, region: parsed.region, updated, unmatched, event_types: parsed.event_types || null, warning: [warning, note].filter(Boolean).join(' ') || null };
}, { role: 'admin' });
