import { db, handler, loadSettings } from '../_lib/db.js';
import { loadMonth } from '../_lib/compute.js';
import { nextBandHints } from '../_lib/scoring.js';

// GET: everything the SA dashboard needs. Only the SA's own entries (history by person), rank, region average.
export default handler(async ({ session }) => {
  if (session.role !== 'sa') return { error: 'SA accounts only' };
  const settings = await loadSettings();
  const { data: mine } = await db.from('sa_entries')
    .select('id, month:sa_months!inner(id,ym,status,published_at), chapter:sa_chapters(id,name)')
    .eq('sa_user_id', session.uid).eq('month.status', 'published');
  const yms = [...new Set((mine || []).map(e => e.month.ym))].sort();
  const history = [];
  for (const ym of yms) {
    const m = await loadMonth(ym, settings);
    const me = m.entries.find(e => e.sa_user_id === session.uid);
    if (!me) continue;
    history.push({
      ym, chapter: me.chapter.name, legacy: me.legacy,
      inputs: {
        member_score: me.member_score, online_pct: me.online_pct, offline_pct: me.offline_pct, training_unique: me.training_unique,
        member_count: me.member_count, mentoring_pct: me.mentoring_pct, retention_pct: me.retention_pct,
        one_to_one_per_member: me.one_to_one_per_member, ltrt_attended: me.ltrt_attended, jotform_done: me.jotform_done,
        new_members: me.new_members, renewals: me.renewals,
      },
      computed: me.computed,
      region_avg: m.region_avg, total_sas: m.entries.length,
      hints: me.legacy ? null : nextBandHints(me, settings),
    });
  }
  const { data: user } = await db.from('sa_users').select('id,name,chapter:sa_chapters(id,name,region)').eq('id', session.uid).single();
  return {
    user, settings: {
      fee_amount: settings.fee_amount, commission_pct: settings.commission_pct, mentoring_enabled: settings.mentoring_enabled,
      one_to_one_threshold: settings.one_to_one_threshold, thresholds: settings.thresholds, max_pts: settings.max_pts, bands: settings.bands,
    },
    history,
  };
}, { role: 'sa' });
