-- BIGト餓鬼討伐大作戦！（2026年11月）の初期データ（第二弾。報酬は蜂須賀虎徹(竜宮の宴)など）
-- 期間は運営のプレスリリース（PR TIMES）より：2026/11/18(水)〜12/2(水)12:59。開始時刻は書かれていないため、メンテ明けの18:00とした
-- 報酬の一覧がまだないので、下書き（draft）で登録する。サイトには出ない。報酬を入れたら published にする
begin;
insert into events (slug, name, event_type, category, start_at, end_at, reward_end_at, point_unit, status, source_url)
values ('big-togaki-2026-11', 'BIGト餓鬼討伐大作戦！（2026年11月）', 'milestone', '大討伐', '2026-11-18T18:00:00+09:00', '2026-12-02T13:00:00+09:00', null, '体', 'draft', 'https://prtimes.jp/main/html/rd/p/000006611.000032953.html')
on conflict (slug) do update set name = excluded.name, event_type = excluded.event_type, category = excluded.category, start_at = excluded.start_at, end_at = excluded.end_at, reward_end_at = excluded.reward_end_at, point_unit = excluded.point_unit, source_url = excluded.source_url;
commit;
