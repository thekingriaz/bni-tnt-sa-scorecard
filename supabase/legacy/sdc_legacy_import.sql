-- SDC legacy import: Jun–Sep 2026 from BNI_TNT_SDC_Scorecard_Jun-Sep_2026 (Google Sheet). Safe to re-run.
-- Run AFTER sdc_migration.sql. Months are published for SDCs; the SA side of each month is untouched.

insert into sa_months (ym, status, published_at) values ('2026-06', 'draft', null) on conflict (ym) do nothing;
update sa_months set sdc_status='published', sdc_published_at=now() where ym='2026-06';
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 0, 'GREEN', 50, 75, 5, 4, 5, true, false, '{"net_growth":0,"traffic_light":15,"retention":0,"member":5,"telebridge":8,"palms":10,"visit":10,"ltrt":0}'::jsonb, 48.0, 100, 48.0, 'Red', 0.35, null, 12, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Max Prince' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Ainthinai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -1, 'GREEN', 80, 80, 4, 4, 4, false, true, '{"net_growth":0,"traffic_light":15,"retention":20,"member":10,"telebridge":10,"palms":10,"visit":0,"ltrt":5}'::jsonb, 70.0, 100, 70.0, 'Green', 0.8, null, 4, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Vijai' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Bamboo Kottai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -1, 'GREEN', 50, 75, 4, 4, 4, true, true, '{"net_growth":0,"traffic_light":15,"retention":0,"member":5,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 55.0, 100, 55.0, 'Amber', 0.6, null, 10, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Krain Bigstan' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Cmy Veli'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 0, 'GREEN', null, 60, 4, 4, 4, true, false, '{"net_growth":0,"traffic_light":15,"retention":0,"member":0,"telebridge":10,"palms":10,"visit":10,"ltrt":0}'::jsonb, 45.0, 100, 45.0, 'Red', 0.35, null, 13, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Askar Ali' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Dil Nadu'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 1, 'GREEN', 100, 95, 5, 4, 5, false, true, '{"net_growth":10,"traffic_light":15,"retention":20,"member":10,"telebridge":8,"palms":10,"visit":0,"ltrt":5}'::jsonb, 78.0, 100, 78.0, 'Green', 0.8, null, 1, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Gunaseelan' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Tamilan'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 1, 'GREEN', 100, 65, 4, 4, 4, false, true, '{"net_growth":10,"traffic_light":15,"retention":20,"member":0,"telebridge":10,"palms":10,"visit":0,"ltrt":5}'::jsonb, 70.0, 100, 70.0, 'Green', 0.8, null, 5, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Ramanthan' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Ejamaan'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 3, 'AMBER', 100, 65, 4, 3, 4, true, true, '{"net_growth":20,"traffic_light":0,"retention":20,"member":0,"telebridge":7.5,"palms":10,"visit":10,"ltrt":5}'::jsonb, 72.5, 100, 72.5, 'Green', 0.8, null, 2, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Dr.Gopalakrishnan' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Thamira'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -1, 'GREEN', null, 75, 4, 3, 4, true, true, '{"net_growth":0,"traffic_light":15,"retention":0,"member":5,"telebridge":7.5,"palms":10,"visit":10,"ltrt":5}'::jsonb, 52.5, 100, 52.5, 'Red', 0.35, null, 11, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Mariappan Mukesh' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Saral'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 3, 'GREEN', 50, 75, 5, 4, 5, false, true, '{"net_growth":20,"traffic_light":15,"retention":0,"member":5,"telebridge":8,"palms":10,"visit":0,"ltrt":5}'::jsonb, 63.0, 100, 63.0, 'Amber', 0.6, null, 7, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Rajesh' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Korkai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 3, 'AMBER', 100, 90, 4, 3, 4, false, true, '{"net_growth":20,"traffic_light":0,"retention":20,"member":10,"telebridge":7.5,"palms":10,"visit":0,"ltrt":5}'::jsonb, 72.5, 100, 72.5, 'Green', 0.8, null, 3, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Allwin' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Nanjil'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -2, 'GREEN', 100, 75, 5, 4, 5, false, false, '{"net_growth":0,"traffic_light":15,"retention":20,"member":5,"telebridge":8,"palms":10,"visit":0,"ltrt":0}'::jsonb, 58.0, 100, 58.0, 'Amber', 0.6, null, 8, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Ramadoss' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Kanya'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 1, 'AMBER', 100, 100, 4, 4, 4, false, true, '{"net_growth":10,"traffic_light":0,"retention":20,"member":10,"telebridge":10,"palms":10,"visit":0,"ltrt":5}'::jsonb, 65.0, 100, 65.0, 'Amber', 0.6, null, 6, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Mohamed Aneez' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Comorin'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -1, 'GREEN', null, 70, 4, 3, 4, false, false, '{"net_growth":0,"traffic_light":15,"retention":0,"member":5,"telebridge":7.5,"palms":10,"visit":0,"ltrt":0}'::jsonb, 37.5, 100, 37.5, 'Review', 0.15, null, 14, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Aravind' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Kumari'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 0, 'GREEN', null, 80, 5, 4, 5, true, true, '{"net_growth":0,"traffic_light":15,"retention":0,"member":10,"telebridge":8,"palms":10,"visit":10,"ltrt":5}'::jsonb, 58.0, 100, 58.0, 'Amber', 0.6, null, 9, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Vijai' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Kings'
on conflict (month_id, chapter_id) do nothing;

insert into sa_months (ym, status, published_at) values ('2026-07', 'draft', null) on conflict (ym) do nothing;
update sa_months set sdc_status='published', sdc_published_at=now() where ym='2026-07';
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 5, 'GREEN', 100, 80, 4, 4, 4, true, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 100.0, 100, 100.0, 'Gold', 1, null, 1, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Max Prince' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Ainthinai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 3, 'GREEN', 100, 80, 5, 5, 5, true, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 100.0, 100, 100.0, 'Gold', 1, null, 2, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Vijai' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Bamboo Kottai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -2, 'AMBER', null, 75, 5, 3, 5, true, true, '{"net_growth":0,"traffic_light":0,"retention":0,"member":5,"telebridge":6,"palms":10,"visit":10,"ltrt":5}'::jsonb, 36.0, 100, 36.0, 'Review', 0.15, null, 13, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Krain Bigstan' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Cmy Veli'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 1, 'GREEN', 50, 65, 5, 2, 5, true, true, '{"net_growth":10,"traffic_light":15,"retention":0,"member":0,"telebridge":4,"palms":10,"visit":10,"ltrt":5}'::jsonb, 54.0, 100, 54.0, 'Red', 0.35, null, 10, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Askar Ali' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Dil Nadu'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -4, 'GREEN', 66, 95, 4, 4, 4, true, true, '{"net_growth":0,"traffic_light":15,"retention":0,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 60.0, 100, 60.0, 'Amber', 0.6, null, 9, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Gunaseelan' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Tamilan'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 2, 'GREEN', 33, 70, 5, 5, 5, true, true, '{"net_growth":20,"traffic_light":15,"retention":0,"member":5,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 75.0, 100, 75.0, 'Green', 0.8, null, 6, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Ramanthan' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Ejamaan'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 3, 'GREEN', null, 70, 5, 5, 5, true, true, '{"net_growth":20,"traffic_light":15,"retention":0,"member":5,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 75.0, 100, 75.0, 'Green', 0.8, null, 7, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Dr.Gopalakrishnan' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Thamira'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 6, 'GREEN', null, 75, 5, 5, 5, true, true, '{"net_growth":20,"traffic_light":15,"retention":0,"member":5,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 75.0, 100, 75.0, 'Green', 0.8, null, 8, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Mariappan Mukesh' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Saral'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 8, 'GREEN', 100, 75, 4, 4, 4, true, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":5,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 95.0, 100, 95.0, 'Gold', 1, null, 3, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Rajesh' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Korkai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -5, 'AMBER', 80, 90, 5, 3, 5, false, true, '{"net_growth":0,"traffic_light":0,"retention":20,"member":10,"telebridge":6,"palms":10,"visit":0,"ltrt":5}'::jsonb, 51.0, 100, 51.0, 'Red', 0.35, null, 11, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Allwin' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Nanjil'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 15, 'GREEN', 100, 85, 4, 4, 4, false, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":10,"palms":10,"visit":0,"ltrt":5}'::jsonb, 90.0, 100, 90.0, 'Gold', 1, null, 4, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Ramadoss' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Kanya'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -3, 'AMBER', null, 100, 5, 1, 5, false, true, '{"net_growth":0,"traffic_light":0,"retention":0,"member":10,"telebridge":2,"palms":10,"visit":0,"ltrt":5}'::jsonb, 27.0, 100, 27.0, 'Review', 0.15, null, 14, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Mohamed Aneez' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Comorin'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -2, 'GREEN', 50, 70, 5, 3, 5, false, true, '{"net_growth":0,"traffic_light":15,"retention":0,"member":5,"telebridge":6,"palms":10,"visit":0,"ltrt":5}'::jsonb, 41.0, 100, 41.0, 'Red', 0.35, null, 12, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Aravind' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Kumari'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 7, 'GREEN', null, 80, 4, 4, 4, true, true, '{"net_growth":20,"traffic_light":15,"retention":0,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 80.0, 100, 80.0, 'Green', 0.8, null, 5, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Vijai' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Kings'
on conflict (month_id, chapter_id) do nothing;

insert into sa_months (ym, status, published_at) values ('2026-08', 'draft', null) on conflict (ym) do nothing;
update sa_months set sdc_status='published', sdc_published_at=now() where ym='2026-08';
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 18, 'GREEN', 75, 95, 4, 4, 4, true, true, '{"net_growth":20,"traffic_light":15,"retention":10,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 90.0, 100, 90.0, 'Gold', 1, null, 3, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Max Prince' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Ainthinai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 1, 'GREEN', 75, 80, 4, 0, 4, true, true, '{"net_growth":10,"traffic_light":15,"retention":10,"member":10,"telebridge":0,"palms":10,"visit":10,"ltrt":5}'::jsonb, 70.0, 100, 70.0, 'Green', 0.8, null, 8, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Vijai' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Bamboo Kottai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -1, 'AMBER', null, 65, 4, 4, 4, false, true, '{"net_growth":0,"traffic_light":0,"retention":0,"member":0,"telebridge":10,"palms":10,"visit":0,"ltrt":5}'::jsonb, 25.0, 100, 25.0, 'Review', 0.15, null, 14, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Krain Bigstan' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Cmy Veli'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 4, 'GREEN', 100, 90, 4, 4, 4, false, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":10,"palms":10,"visit":0,"ltrt":5}'::jsonb, 90.0, 100, 90.0, 'Gold', 1, null, 4, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Askar Ali' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Dil Nadu'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -1, 'GREEN', 75, 70, 4, 5, 4, false, true, '{"net_growth":0,"traffic_light":15,"retention":10,"member":5,"telebridge":10,"palms":10,"visit":0,"ltrt":5}'::jsonb, 55.0, 100, 55.0, 'Amber', 0.6, null, 9, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Gunaseelan' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Tamilan'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 2, 'GREEN', 100, 80, 4, 4, 4, false, false, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":10,"palms":10,"visit":0,"ltrt":0}'::jsonb, 85.0, 100, 85.0, 'Gold', 1, null, 5, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Ramanthan' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Ejamaan'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 8, 'GREEN', null, 80, 4, 3, 4, true, true, '{"net_growth":20,"traffic_light":15,"retention":0,"member":10,"telebridge":7.5,"palms":10,"visit":10,"ltrt":5}'::jsonb, 77.5, 100, 77.5, 'Green', 0.8, null, 7, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Dr.Gopalakrishnan' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Thamira'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 3, 'AMBER', null, 65, 4, 3, 4, false, true, '{"net_growth":20,"traffic_light":0,"retention":0,"member":0,"telebridge":7.5,"palms":10,"visit":0,"ltrt":5}'::jsonb, 42.5, 100, 42.5, 'Red', 0.35, null, 13, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Mariappan Mukesh' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Saral'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 6, 'GREEN', 100, 80, 4, 4, 4, true, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 100.0, 100, 100.0, 'Gold', 1, null, 1, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Rajesh' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Korkai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 2, 'GREEN', 100, 80, 4, 4, 4, true, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 100.0, 100, 100.0, 'Gold', 1, null, 2, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Allwin' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Nanjil'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 13, 'GREEN', 50, 80, 4, 4, 4, true, true, '{"net_growth":20,"traffic_light":15,"retention":0,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 80.0, 100, 80.0, 'Green', 0.8, null, 6, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Ramadoss' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Kanya'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -11, 'AMBER', 61, 80, 4, 4, 4, true, true, '{"net_growth":0,"traffic_light":0,"retention":0,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 45.0, 100, 45.0, 'Red', 0.35, null, 11, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Mohamed Aneez' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Comorin'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -4, 'AMBER', null, 80, 4, 4, 4, true, true, '{"net_growth":0,"traffic_light":0,"retention":0,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 45.0, 100, 45.0, 'Red', 0.35, null, 12, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Aravind' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Kumari'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 1, 'AMBER', null, 80, 4, 4, 4, true, true, '{"net_growth":10,"traffic_light":0,"retention":0,"member":10,"telebridge":10,"palms":10,"visit":10,"ltrt":5}'::jsonb, 55.0, 100, 55.0, 'Amber', 0.6, null, 10, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Vijai' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Kings'
on conflict (month_id, chapter_id) do nothing;

insert into sa_months (ym, status, published_at) values ('2026-09', 'draft', null) on conflict (ym) do nothing;
update sa_months set sdc_status='published', sdc_published_at=now() where ym='2026-09';
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 18, 'GREEN', 75, 95, 5, 4, 4, true, true, '{"net_growth":20,"traffic_light":15,"retention":10,"member":10,"telebridge":8,"palms":8,"visit":10,"ltrt":5}'::jsonb, 86.0, 100, 86.0, 'Gold', 1, null, 2, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Max Prince' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Ainthinai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 1, 'GREEN', 75, 80, 5, 0, 4, true, true, '{"net_growth":10,"traffic_light":15,"retention":10,"member":10,"telebridge":0,"palms":8,"visit":10,"ltrt":5}'::jsonb, 68.0, 100, 68.0, 'Amber', 0.6, null, 8, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Vijai' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Bamboo Kottai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -1, 'AMBER', null, 65, 4, 4, 4, false, true, '{"net_growth":0,"traffic_light":0,"retention":0,"member":0,"telebridge":10,"palms":10,"visit":0,"ltrt":5}'::jsonb, 25.0, 100, 25.0, 'Review', 0.15, null, 14, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Krain Bigstan' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Cmy Veli'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 4, 'GREEN', 100, 90, 4, 4, 4, false, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":10,"palms":10,"visit":0,"ltrt":5}'::jsonb, 90.0, 100, 90.0, 'Gold', 1, null, 1, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Askar Ali' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Dil Nadu'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -1, 'GREEN', 75, 70, 5, 5, 4, false, true, '{"net_growth":0,"traffic_light":15,"retention":10,"member":5,"telebridge":10,"palms":8,"visit":0,"ltrt":5}'::jsonb, 53.0, 100, 53.0, 'Red', 0.35, null, 9, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Gunaseelan' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Tamilan'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 2, 'GREEN', 100, 80, 5, 4, 4, false, false, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":8,"palms":8,"visit":0,"ltrt":0}'::jsonb, 81.0, 100, 81.0, 'Green', 0.8, null, 5, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Ramanthan' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Ejamaan'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 8, 'GREEN', null, 80, 4, 3, 4, true, true, '{"net_growth":20,"traffic_light":15,"retention":0,"member":10,"telebridge":7.5,"palms":10,"visit":10,"ltrt":5}'::jsonb, 77.5, 100, 77.5, 'Green', 0.8, null, 7, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Dr.Gopalakrishnan' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Thamira'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 3, 'AMBER', null, 65, 4, 3, 4, false, true, '{"net_growth":20,"traffic_light":0,"retention":0,"member":0,"telebridge":7.5,"palms":10,"visit":0,"ltrt":5}'::jsonb, 42.5, 100, 42.5, 'Red', 0.35, null, 11, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Mariappan Mukesh' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Saral'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 6, 'GREEN', 80, 90, 5, 4, 4, false, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":8,"palms":8,"visit":0,"ltrt":5}'::jsonb, 86.0, 100, 86.0, 'Gold', 1, null, 3, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Rajesh' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Korkai'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 2, 'GREEN', 80, 80, 4, 0, 4, false, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":0,"palms":10,"visit":0,"ltrt":5}'::jsonb, 80.0, 100, 80.0, 'Green', 0.8, null, 6, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Allwin' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Nanjil'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 2, 'GREEN', 80, 80, 5, 4, 4, false, true, '{"net_growth":20,"traffic_light":15,"retention":20,"member":10,"telebridge":8,"palms":8,"visit":0,"ltrt":5}'::jsonb, 86.0, 100, 86.0, 'Gold', 1, null, 4, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Ramadoss' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Kanya'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -11, 'AMBER', 80, 60, 4, 0, 4, false, true, '{"net_growth":0,"traffic_light":0,"retention":20,"member":0,"telebridge":0,"palms":10,"visit":0,"ltrt":5}'::jsonb, 35.0, 100, 35.0, 'Review', 0.15, null, 12, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Mohamed Aneez' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Comorin'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -4, 'AMBER', 80, 65, 5, 1, 4, false, true, '{"net_growth":0,"traffic_light":0,"retention":20,"member":0,"telebridge":2,"palms":8,"visit":0,"ltrt":5}'::jsonb, 35.0, 100, 35.0, 'Review', 0.15, null, 13, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Aravind' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Kumari'
on conflict (month_id, chapter_id) do nothing;
insert into sdc_entries (month_id, chapter_id, sdc_user_id, net_add, tl_status, retention_pct, member_score, meetings_total, telebridge_weeks, palms_weeks, visit_done, ltrt_attended, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, -12, 'AMBER', 80, 55, 5, 4, 4, true, true, '{"net_growth":0,"traffic_light":0,"retention":20,"member":0,"telebridge":8,"palms":8,"visit":10,"ltrt":5}'::jsonb, 51.0, 100, 51.0, 'Red', 0.35, null, 10, true, 'Imported from Google Sheet (SDC scorecard Jun-Sep 2026). Net add as entered there. No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sdc' and u.name='Vijai' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Kings'
on conflict (month_id, chapter_id) do nothing;
