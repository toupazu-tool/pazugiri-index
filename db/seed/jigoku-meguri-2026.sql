-- 地獄めぐり（2026）の初期データ。src/lib/events.ts から自動で作成（中身は events.ts と同じ）
-- 何度流しても同じ結果になる（すでにあれば上書き）
begin;
insert into items (name, kind, icon_url) values
  ('11月召喚チケット', 'other', '/rewards/icons/summon-ticket.svg'),
  ('11月10回召喚チケット', 'other', '/rewards/icons/summon-ticket-10.svg'),
  ('小判', 'koban', '/rewards/icons/koban.svg'),
  ('おみやげ人形焼き', 'material', '/rewards/icons/ema-ningyoyaki.svg'),
  ('経験値の書・小', 'material', '/rewards/icons/exp-book-small.svg'),
  ('経験値の書・中', 'material', '/rewards/icons/exp-book-medium.svg'),
  ('経験値の書・大', 'material', '/rewards/icons/exp-book-large.svg'),
  ('ハート回復薬・小', 'material', '/rewards/icons/heart-potion.svg'),
  ('絵馬経験値の勾玉・小', 'material', '/rewards/icons/magatama.svg'),
  ('絵馬Pt', 'other', '/rewards/icons/ema-points.svg'),
  ('赤の絵具', 'material', '/rewards/icons/red-paint.svg'),
  ('黄の絵具', 'material', '/rewards/icons/yellow-paint.svg'),
  ('麦', 'material', '/rewards/icons/wheat.svg'),
  ('水', 'material', '/rewards/icons/water.svg'),
  ('骨付き肉', 'material', '/rewards/icons/meat.svg'),
  ('臼と杵', 'material', '/rewards/icons/mortar.svg'),
  ('昆布', 'material', '/rewards/icons/kombu.svg'),
  ('お米', 'material', '/rewards/icons/rice.svg'),
  ('塩', 'material', '/rewards/icons/salt.svg'),
  ('大豆', 'material', '/rewards/icons/soybeans.svg'),
  ('火打ち石', 'material', '/rewards/icons/flint.svg'),
  ('紙', 'material', '/rewards/icons/paper.svg'),
  ('筆', 'material', '/rewards/icons/brush.svg'),
  ('サンゴ', 'material', '/rewards/icons/coral.svg'),
  ('ウロコ', 'material', '/rewards/icons/scale.svg')
on conflict (name) do update set kind = excluded.kind, icon_url = coalesce(excluded.icon_url, items.icon_url);

insert into events (slug, name, event_type, category, start_at, end_at, reward_end_at, point_unit, status)
values ('jigoku-meguri-2026', '地獄めぐり', 'exchange', 'シナリオイベント', '2026-11-04T18:00:00+09:00', '2026-11-18T13:00:00+09:00', '2026-11-25T13:00:00+09:00', 'pt', 'published')
on conflict (slug) do update set name = excluded.name, event_type = excluded.event_type, category = excluded.category, start_at = excluded.start_at, end_at = excluded.end_at, reward_end_at = excluded.reward_end_at, point_unit = excluded.point_unit, status = excluded.status;

delete from event_rewards where event_id = (select id from events where slug = 'jigoku-meguri-2026');
insert into event_rewards (event_id, item_id, quantity, cost_points, max_count, icon_url, sort_order)
select e.id, i.id, v.quantity, v.points, v.max_count, v.icon_url, v.sort_order
from (values
  ('11月召喚チケット', 1, 500, 5, null::text, 10),
  ('11月10回召喚チケット', 1, 8000, 1, null::text, 20),
  ('小判', 10000, 4000, 3, null::text, 30),
  ('小判', 10, 10, null::integer, null::text, 40),
  ('おみやげ人形焼き', 1, 1000, 6, null::text, 50),
  ('経験値の書・小', 5, 100, 5, null::text, 60),
  ('経験値の書・中', 1, 500, 3, null::text, 70),
  ('経験値の書・大', 1, 2000, 1, null::text, 80),
  ('ハート回復薬・小', 3, 100, 3, null::text, 90),
  ('絵馬経験値の勾玉・小', 5, 200, 5, null::text, 100),
  ('絵馬Pt', 50, 300, 5, null::text, 110),
  ('絵馬Pt', 300, 1500, 1, null::text, 120),
  ('赤の絵具', 1, 2000, 1, null::text, 130),
  ('黄の絵具', 1, 2000, 1, null::text, 140),
  ('麦', 1, 100, 3, null::text, 150),
  ('水', 1, 50, 3, null::text, 160),
  ('骨付き肉', 1, 200, 3, null::text, 170),
  ('臼と杵', 1, 250, 3, null::text, 180),
  ('昆布', 1, 50, 3, null::text, 190),
  ('お米', 1, 50, 3, null::text, 200),
  ('塩', 1, 150, 3, null::text, 210),
  ('大豆', 1, 50, 3, null::text, 220),
  ('火打ち石', 1, 150, 3, null::text, 230),
  ('紙', 1, 100, 3, null::text, 240),
  ('筆', 1, 100, 3, null::text, 250),
  ('サンゴ', 1, 350, 2, null::text, 260),
  ('ウロコ', 1, 565, 3, null::text, 270)
) as v (item_name, quantity, points, max_count, icon_url, sort_order)
join items i on i.name = v.item_name
cross join (select id from events where slug = 'jigoku-meguri-2026') e;

commit;