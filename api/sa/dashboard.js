import { db, handler, loadSettings } from '../_lib/db.js';
import { loadMonths } from '../_lib/compute.js';
import { nextBandHints } from '../_lib/scoring.js';
import { loadSdcMonths } from '../_lib/compute_sdc.js';
import { nextSdcBandHints, mergeSdcSettings, dowName } from '../_lib/scoring_sdc.js';

// GET: everything the SA / SDC dashboard needs. Only the person's own entries (history by person), rank, region average.
export default handler(async ({ session }) => {
  if (session.role === 'sdc') return sdcDashboard(session);
  if (session.role !== 'sa') return { error: 'SA / SDC accounts only' };
  const settings = await loadSettings();
  const { data: mine } = await db.from('sa_entries')
    .select('id, month:sa_months!inner(id,ym,status,published_at), chapter:sa_chapters(id,name)')
    .eq('sa_user_id', session.uid).eq('month.status', 'published');
  const yms = [...new Set((mine || []).map(e => e.month.ym))].sort();
  const history = [];
  const loaded = await loadMonths(yms, settings);
  for (const m of loaded) {
    const ym = m.month.ym;
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
    user, programme: 'sa', settings: {
      fee_amount: settings.fee_amount, commission_pct: settings.commission_pct, mentoring_enabled: settings.mentoring_enabled,
      one_to_one_threshold: settings.one_to_one_threshold, thresholds: settings.thresholds, max_pts: settings.max_pts, bands: settings.bands,
    },
    history,
  };
}, { role: 'sa' });

async function sdcDashboard(session) {
  const settings = mergeSdcSettings(await loadSettings());
  const { data: mine } = await db.from('sdc_entries')
    .select('id, month:sa_months!inner(id,ym,sdc_status)')
    .eq('sdc_user_id', session.uid).eq('month.sdc_status', 'published');
  const yms = [...new Set((mine || []).map(e => e.month.ym))].sort();
  const history = [];
  const loaded = await loadSdcMonths(yms, settings);
  for (const m of loaded) {
    const ym = m.month.ym;
    const me = m.entries.find(e => e.sdc_user_id === session.uid);
    if (!me) continue;
    history.push({
      ym, chapter: me.chapter.name, legacy: me.legacy, meeting_day: dowName(me.chapter.meeting_day),
      inputs: {
        net_add: me.net_add, net_add_derived: me.net_add_derived, member_count: me.member_count, prev_member_count: me.prev_member_count,
        tl_status: me.tl_status, tl_score: me.tl_score, retention_pct: me.retention_pct, member_score: me.member_score,
        meetings_total: me.meetings_total, calendar_weeks: me.legacy ? me.meetings_total : me.weeks.length,
        telebridge_weeks: me.telebridge_weeks, palms_weeks: me.palms_weeks,
        visit_done: me.visit_done, visit_hours: me.visit_hours, ltrt_attended: me.ltrt_attended,
        new_members: me.new_members, renewals: me.renewals,
        weeks: me.legacy ? [] : me.weeks.map(w => ({ date: w.week_date, no_meeting: w.no_meeting, telebridge: w.telebridge_done, palms: w.palms_done })),
      },
      computed: me.computed,
      region_avg: m.region_avg, total_sas: m.entries.length,
      hints: me.legacy ? null : nextSdcBandHints(me, settings),
    });
  }
  const { data: user } = await db.from('sa_users').select('id,name,chapter:sa_chapters(id,name,region,meeting_day)').eq('id', session.uid).single();
  return {
    user, programme: 'sdc',
    settings: { fee_amount: settings.fee_amount, commission_pct: settings.sdc_commission_pct, thresholds: settings.sdc_thresholds, max_pts: settings.sdc_max_pts, bands: settings.bands },
    history,
  };
}
