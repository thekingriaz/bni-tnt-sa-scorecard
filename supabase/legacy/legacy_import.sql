-- Legacy import: Jun–Sep 2026 from BNI_TNT_SA_Scorecard_Q2_2026 (Google Sheet). Safe to re-run.

insert into sa_months (ym, status, published_at) values ('2026-06', 'published', now()) on conflict (ym) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 0, 2, 0, 55, 2.00, true, true, '{"member":5,"training":0,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 30, 100, 30, 'Review', 0.15, null, 7, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Vinoth Babu' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Ainthinai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 84, 8, 7, 0, 57, 2.00, true, false, '{"member":10,"training":10,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 35, 100, 35, 'Review', 0.15, null, 4, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Kamak' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Bamboo Kottai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 1, 8, 0, 75, 2.00, false, true, '{"member":5,"training":0,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":0,"visit":10}'::jsonb, 50, 100, 50, 'Red', 0.35, null, 2, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Esai Kumar' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Cmy Veli'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 95, 0, 7, 0, 69, 2.00, false, true, '{"member":10,"training":0,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":0,"visit":10}'::jsonb, 30, 100, 30, 'Review', 0.15, null, 8, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Kareem' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Dil Nadu'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 99, 1, 5, 0, 57, 2.00, true, true, '{"member":10,"training":0,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 35, 100, 35, 'Review', 0.15, null, 5, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Saravanan Manickam' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Tamilan'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 1, 14, 0, 29, 2.00, true, true, '{"member":5,"training":15,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 45, 100, 45, 'Red', 0.35, null, 3, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Abusalih' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Ejamaan'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 84, 1, 0, 50, 56, 2.00, true, true, '{"member":10,"training":0,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 35, 100, 35, 'Review', 0.15, null, 6, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Maria Anand' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Thamira'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 65, 1, 0, 0, 0, 2.00, false, false, '{"member":0,"training":0,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":0,"visit":0}'::jsonb, 10, 100, 10, 'Review', 0.15, null, 14, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Selvaratnam' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Saral'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 75, 1, 2, 0, 79, 2.00, true, true, '{"member":5,"training":0,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 55, 100, 55, 'Amber', 0.6, null, 1, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Valentine' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Korkai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 80, 1, 2, 0, 69, 2.00, true, false, '{"member":10,"training":0,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 25, 100, 25, 'Review', 0.15, null, 10, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Jimmy Bonson' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Nanjil'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 0, 0, 0, 0, 60, 2.00, true, false, '{"member":0,"training":0,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 15, 100, 15, 'Review', 0.15, null, 13, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Deva Shibin' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Kanya'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 1, 0, 0, 60, 2.00, true, true, '{"member":5,"training":0,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 30, 100, 30, 'Review', 0.15, null, 9, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Suresh' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Comorin'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 85, 0, 0, 0, 0, 2.00, true, false, '{"member":10,"training":0,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 25, 100, 25, 'Review', 0.15, null, 11, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Ramkumar' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Kumari'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 74, 1, 0, 0, 0, 2.00, true, false, '{"member":5,"training":0,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 20, 100, 20, 'Review', 0.15, null, 12, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Dr.Prashanth' and u.chapter_id=c.id
where m.ym='2026-06' and c.name='BNI Kings'
on conflict (month_id, chapter_id) do nothing;

insert into sa_months (ym, status, published_at) values ('2026-07', 'published', now()) on conflict (ym) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 95, 12, 0, 85, 79, 2.00, true, false, '{"member":10,"training":10,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 80, 100, 80, 'Green', 0.8, null, 1, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Vinoth Babu' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Ainthinai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 85, 1, 0, 85, 85, 2.00, true, true, '{"member":10,"training":0,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 80, 100, 80, 'Green', 0.8, null, 2, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Kamak' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Bamboo Kottai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 65, 1, 0, 85, 75, 2.00, true, true, '{"member":0,"training":0,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 70, 100, 70, 'Green', 0.8, null, 6, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Esai Kumar' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Cmy Veli'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 95, 0, 0, 85, 84, 2.00, true, true, '{"member":10,"training":0,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 80, 100, 80, 'Green', 0.8, null, 3, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Kareem' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Dil Nadu'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 1, 0, 85, 74, 2.00, true, false, '{"member":5,"training":0,"mentoring":20,"retention":15,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 55, 100, 55, 'Amber', 0.6, null, 10, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Saravanan Manickam' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Tamilan'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 0, 0, 85, 75, 2.00, true, true, '{"member":5,"training":0,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 75, 100, 75, 'Green', 0.8, null, 5, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Abusalih' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Ejamaan'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 65, 0, 0, 85, 62, 2.00, true, true, '{"member":0,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 45, 100, 45, 'Red', 0.35, null, 13, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Maria Anand' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Thamira'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 0, 0, 85, 0, 2.00, true, true, '{"member":5,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 50, 100, 50, 'Red', 0.35, null, 11, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Selvaratnam' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Saral'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 90, 1, 0, 85, 82, 2.00, true, true, '{"member":10,"training":0,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 80, 100, 80, 'Green', 0.8, null, 4, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Valentine' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Korkai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 65, 1, 0, 85, 60, 2.00, true, false, '{"member":0,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 35, 100, 35, 'Review', 0.15, null, 14, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Jimmy Bonson' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Nanjil'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 90, 0, 0, 85, 74, 2.00, true, false, '{"member":10,"training":0,"mentoring":20,"retention":15,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 60, 100, 60, 'Amber', 0.6, null, 8, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Deva Shibin' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Kanya'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 60, 6, 0, 85, 76, 2.00, true, false, '{"member":0,"training":0,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 60, 100, 60, 'Amber', 0.6, null, 9, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Suresh' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Comorin'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 2, 0, 85, 79, 2.00, true, false, '{"member":5,"training":0,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 65, 100, 65, 'Amber', 0.6, null, 7, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Ramkumar' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Kumari'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 75, 12, 0, 85, 0, 2.00, true, false, '{"member":5,"training":10,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 50, 100, 50, 'Red', 0.35, null, 12, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Dr.Ruth' and u.chapter_id=c.id
where m.ym='2026-07' and c.name='BNI Kings'
on conflict (month_id, chapter_id) do nothing;

insert into sa_months (ym, status, published_at) values ('2026-08', 'published', now()) on conflict (ym) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 95, 16, 0, 85, 50, 2.00, true, false, '{"member":10,"training":15,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 60, 100, 60, 'Amber', 0.6, null, 4, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Vinoth Babu' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Ainthinai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 85, 5, 0, 85, 56, 2.00, true, false, '{"member":10,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 45, 100, 45, 'Red', 0.35, null, 10, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Kamak' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Bamboo Kottai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 65, 1, 0, 85, 100, 2.00, true, false, '{"member":0,"training":0,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 60, 100, 60, 'Amber', 0.6, null, 5, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Esai Kumar' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Cmy Veli'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 80, 0, 0, 85, 54, 2.00, true, true, '{"member":10,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 55, 100, 55, 'Amber', 0.6, null, 6, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Kareem' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Dil Nadu'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 80, 0, 0, 85, 63, 2.00, true, false, '{"member":10,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 45, 100, 45, 'Red', 0.35, null, 11, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Saravanan Manickam' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Tamilan'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 80, 10, 0, 85, 76, 2.00, true, true, '{"member":10,"training":10,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 90, 100, 90, 'Gold', 1, null, 1, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Abusalih' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Ejamaan'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 75, 0, 0, 85, 59, 2.00, true, true, '{"member":5,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 50, 100, 50, 'Red', 0.35, null, 8, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Maria Anand' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Thamira'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 75, 1, 0, 85, 0, 2.00, true, true, '{"member":5,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 50, 100, 50, 'Red', 0.35, null, 9, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Selvaratnam' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Saral'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 90, 0, 0, 85, 79, 2.00, true, true, '{"member":10,"training":0,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 80, 100, 80, 'Green', 0.8, null, 2, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Valentine' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Korkai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 75, 0, 0, 85, 73, 2.00, true, false, '{"member":5,"training":0,"mentoring":20,"retention":15,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 55, 100, 55, 'Amber', 0.6, null, 7, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Jimmy Bonson' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Nanjil'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 90, 1, 0, 85, 58, 2.00, true, false, '{"member":10,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 45, 100, 45, 'Red', 0.35, null, 12, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Deva Shibin' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Kanya'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 75, 0, 0, 85, 67, 2.00, true, false, '{"member":5,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 40, 100, 40, 'Red', 0.35, null, 13, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Suresh' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Comorin'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 1, 0, 85, 79, 2.00, true, false, '{"member":5,"training":0,"mentoring":20,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 65, 100, 65, 'Amber', 0.6, null, 3, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Ramkumar' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Kumari'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 0, 0, 85, 0, 2.00, true, false, '{"member":5,"training":0,"mentoring":20,"retention":0,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 40, 100, 40, 'Red', 0.35, null, 14, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Dr.Ruth' and u.chapter_id=c.id
where m.ym='2026-08' and c.name='BNI Kings'
on conflict (month_id, chapter_id) do nothing;

insert into sa_months (ym, status, published_at) values ('2026-09', 'published', now()) on conflict (ym) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 90, 0, 10, 0, 84, 11.00, true, false, '{"member":10,"training":10,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 60, 100, 60, 'Amber', 0.6, null, 5, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Vinoth Babu' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Ainthinai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 84, 0, 10, 0, 85, 8.00, true, true, '{"member":10,"training":10,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 70, 100, 70, 'Green', 0.8, null, 1, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Kamak' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Bamboo Kottai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 100, 0, 10, 0, 87, 8.00, true, false, '{"member":10,"training":10,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 60, 100, 60, 'Amber', 0.6, null, 6, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Esai Kumar' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Cmy Veli'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 95, 0, 10, 0, 80, 9.00, true, true, '{"member":10,"training":10,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 70, 100, 70, 'Green', 0.8, null, 2, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Kareem' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Dil Nadu'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 100, 0, 0, 0, 72, 8.00, true, false, '{"member":10,"training":0,"mentoring":0,"retention":15,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 40, 100, 40, 'Red', 0.35, null, 13, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Saravanan Manickam' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Tamilan'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 95, 0, 10, 0, 78, 7.00, true, true, '{"member":10,"training":10,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 70, 100, 70, 'Green', 0.8, null, 3, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Abusalih' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Ejamaan'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 100, 0, 10, 0, 72, 6.00, true, false, '{"member":10,"training":10,"mentoring":0,"retention":15,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 50, 100, 50, 'Red', 0.35, null, 9, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Maria Anand' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Thamira'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 85, 0, 10, 0, 0, 5.00, false, false, '{"member":10,"training":10,"mentoring":0,"retention":0,"one_to_one":10,"ltrt":0,"visit":0}'::jsonb, 30, 100, 30, 'Review', 0.15, null, 14, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Selvaratnam' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Saral'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 100, 0, 10, 0, 75, 10.00, true, true, '{"member":10,"training":10,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":10}'::jsonb, 70, 100, 70, 'Green', 0.8, null, 4, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Valentine' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Korkai'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 80, 0, 0, 0, 75, 8.00, true, false, '{"member":10,"training":0,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 50, 100, 50, 'Red', 0.35, null, 10, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Jimmy Bonson' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Nanjil'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 80, 0, 10, 0, 75, 9.00, true, false, '{"member":10,"training":10,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 60, 100, 60, 'Amber', 0.6, null, 7, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Deva Shibin' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Kanya'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 75, 0, 10, 0, 75, 9.00, true, false, '{"member":5,"training":10,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 55, 100, 55, 'Amber', 0.6, null, 8, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Suresh' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Comorin'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 95, 0, 0, 0, 75, 17.00, true, false, '{"member":10,"training":0,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 50, 100, 50, 'Red', 0.35, null, 11, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Ramkumar' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Kumari'
on conflict (month_id, chapter_id) do nothing;
insert into sa_entries (month_id, chapter_id, sa_user_id, member_score, online_pct, offline_pct, mentoring_pct, retention_pct, one_to_one_per_member, ltrt_attended, jotform_done, points, total_raw, max_total, total_scaled, band, multiplier, payout, rank, legacy, notes)
select m.id, c.id, u.id, 70, 0, 0, 0, 75, 5.00, true, false, '{"member":5,"training":0,"mentoring":0,"retention":25,"one_to_one":10,"ltrt":5,"visit":0}'::jsonb, 45, 100, 45, 'Red', 0.35, null, 12, true, 'Imported from Google Sheet (old /100 scoring incl. Mentoring). No payout data.'
from sa_months m, sa_chapters c left join sa_users u on u.role='sa' and u.name='Dr.Ruth' and u.chapter_id=c.id
where m.ym='2026-09' and c.name='BNI Kings'
on conflict (month_id, chapter_id) do nothing;
