import { db, handler, fail, audit, loadSettings } from '../_lib/db.js';
import { ensureMonth } from '../_lib/compute.js';
import { normChapter } from '../_lib/parsers.js';

// POST { ym } -> pulls "BNI Chapter Visit Report" submissions for that month from Jotform and marks jotform_done
// for chapters where the submitter matches the SA's jotform_alias. Manual overrides (jotform_auto=false) are left alone.
export default handler(async ({ req, session, body }) => {
  if (req.method !== 'POST') throw fail('POST only', 405);
  const apiKey = process.env.JOTFORM_API_KEY;
  if (!apiKey) throw fail('JOTFORM_API_KEY is not set in Vercel environment variables');
  const settings = await loadSettings();
  const formId = settings.jotform_form_id;
  const ym = body.ym; if (!/^\d{4}-\d{2}$/.test(ym || '')) throw fail('ym must be YYYY-MM');
  const month = await ensureMonth(ym, session.uid);
  if (month.status === 'published') throw fail('Month is published. Unpublish to re-sync.');

  const [y, m] = ym.split('-').map(Number);
  const start = `${ym}-01 00:00:00`;
  const nextYm = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  const end = `${nextYm}-01 00:00:00`;
  const filter = encodeURIComponent(JSON.stringify({ 'created_at:gt': start, 'created_at:lt': end }));
  const url = `https://api.jotform.com/form/${formId}/submissions?apiKey=${apiKey}&limit=1000&filter=${filter}`;
  const resp = await fetch(url);
  if (!resp.ok) throw fail(`Jotform API error ${resp.status}`);
  const json = await resp.json();
  const subs = json.content || [];

  const { data: chapters } = await db.from('sa_chapters').select('id,name,key');
  const { data: entries } = await db.from('sa_entries').select('id,chapter_id,jotform_done,jotform_auto, sa:sa_users(id,name,jotform_alias)').eq('month_id', month.id);

  const findAnswer = (s, ...labels) => {
    for (const a of Object.values(s.answers || {})) {
      const t = (a.text || a.name || '').toLowerCase();
      if (labels.some(l => t.includes(l))) {
        const v = a.prettyFormat || a.answer;
        if (v && typeof v === 'object') return v.datetime || [v.year, v.month, v.day].filter(Boolean).join('-') || Object.values(v).join(' ');
        return v ? String(v) : '';
      }
    }
    return '';
  };

  const results = [];
  for (const c of chapters) {
    const e = entries.find(x => x.chapter_id === c.id); if (!e) continue;
    const mine = subs.filter(s => normChapter(findAnswer(s, 'select chapter', 'chapter')) === c.key);
    const alias = (e.sa?.jotform_alias || e.sa?.name || '').toLowerCase().trim();
    const match = mine.find(s => {
      const who = (findAnswer(s, 'visited by') + ' ' + findAnswer(s, 'name')).toLowerCase();
      return alias && who.includes(alias);
    });
    const row = { chapter: c.name, sa: e.sa?.name || null, submissions: mine.length, matched: !!match, submitters: mine.map(s => findAnswer(s, 'visited by') || findAnswer(s, 'name')) };
    if (e.jotform_auto === false && e.jotform_done !== null) { row.skipped = 'manual override'; results.push(row); continue; }
    const done = !!match;
    await db.from('sa_entries').update({ jotform_done: done, jotform_auto: true, jotform_submission_id: match ? match.id : null }).eq('id', e.id);
    results.push(row);
  }
  await audit(session.uid, 'jotform.sync', { ym, submissions: subs.length });
  return { ok: true, ym, total_submissions: subs.length, results };
}, { role: 'admin' });
