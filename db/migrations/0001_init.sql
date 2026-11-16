-- ぱずぎり目録 v2.0.0 のテーブル（PHP + MySQL でいう CREATE TABLE をまとめたファイル）
-- 日時はすべてタイムゾーン付き（timestamptz）。ID は自動で振る uuid

-- 更新日時（updated_at）を、行を書き換えたときに自動で今の時刻にする
create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 素材マスタ（小判、召喚チケット、経験値の書…）
create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,                   -- 素材名（重複なし）
  kind text not null default 'material'
    check (kind in ('material', 'sword', 'koban', 'other')), -- 素材／刀剣男士／小判／その他
  icon_url text,                               -- アイコン画像
  is_active boolean not null default true,     -- 新規登録の選択肢に出すか（素材は消さずに false にする）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- イベント
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), -- URL 用の名前（英小文字・数字・ハイフン）
  name text not null,                          -- イベント名
  event_type text not null
    check (event_type in ('exchange', 'milestone')), -- 交換所型／ポイント到達型
  category text not null,                      -- 画面のラベル（シナリオイベント、大討伐…）
  start_at timestamptz not null,               -- 開始日時
  end_at timestamptz not null,                 -- 終了日時（12:59まで → 13:00:00）
  reward_end_at timestamptz,                   -- 交換期限（交換所型・必須）／報酬の受け取り期限（到達型・わかれば）
  point_unit text not null default 'pt',       -- ポイントの単位（pt、体 など。画面と保存画像に出す）
  status text not null default 'draft'
    check (status in ('draft', 'published')),  -- 下書き／公開（下書きはどこにも出ない）
  source_url text,                             -- お知らせ（公式X）の URL
  top_display text not null default 'auto'
    check (top_display in ('auto', 'show', 'hide')), -- トップの表示：自動／いつも出す／出さない
  top_from timestamptz,                        -- トップに出す期間（空なら自動）
  top_until timestamptz,
  listed boolean not null default true,        -- イベント一覧ページに出すか
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at),
  -- 交換所型は交換期限が必須。期限を入れるなら終了以降
  check (event_type <> 'exchange' or reward_end_at is not null),
  check (reward_end_at is null or reward_end_at >= end_at),
  check (point_unit <> ''),
  check (top_from is null or top_until is null or top_until > top_from)
);

-- イベントの報酬
create table event_rewards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade, -- イベントを消すと報酬も消える
  item_id uuid not null references items (id) on delete restrict,  -- 使われている素材は消せない
  quantity integer not null default 1 check (quantity >= 1),       -- 1回でもらえる数（小判×10000 → 10000）
  cost_points integer check (cost_points >= 0),                    -- 交換所型：1回の交換に必要なポイント
  required_points integer check (required_points >= 0),            -- 到達型：もらえるポイント（累計）
  max_count integer check (max_count >= 0),                        -- 交換できる上限（空なら上限なし、0 は交換済み）
  icon_url text,                                                   -- この報酬だけの画像（空なら素材の画像）
  sort_order integer not null default 0,                           -- 表示順
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 必要ポイントと到達ポイントは、どちらか片方だけ入れる
  check (num_nonnulls(cost_points, required_points) = 1)
);

create index event_rewards_event_sort on event_rewards (event_id, sort_order);
create index events_status_start on events (status, start_at desc);

-- 報酬の種類がイベントの形と合っているかを確かめる
-- （交換所型の報酬は必要ポイント、到達型の報酬は到達ポイント）
create function check_reward_matches_event() returns trigger language plpgsql as $$
declare
  t text;
begin
  select event_type into t from events where id = new.event_id;
  if t = 'exchange' and new.cost_points is null then
    raise exception '交換所型のイベントの報酬には cost_points（必要ポイント）が必要です';
  end if;
  if t = 'milestone' and new.required_points is null then
    raise exception '到達型のイベントの報酬には required_points（到達ポイント）が必要です';
  end if;
  return new;
end;
$$;

-- 報酬が入っているイベントの形を、あとから変えられないようにする（報酬と食い違うため）
create function check_event_type_change() returns trigger language plpgsql as $$
begin
  if new.event_type <> old.event_type and exists (select 1 from event_rewards where event_id = new.id) then
    raise exception '報酬が入っているイベントは、交換所型・到達型を変えられません（先に報酬を消してください）';
  end if;
  return new;
end;
$$;

create trigger event_rewards_match_event before insert or update on event_rewards
  for each row execute function check_reward_matches_event();
create trigger events_type_change before update of event_type on events
  for each row execute function check_event_type_change();

create trigger items_updated_at before update on items for each row execute function set_updated_at();
create trigger events_updated_at before update on events for each row execute function set_updated_at();
create trigger event_rewards_updated_at before update on event_rewards for each row execute function set_updated_at();

-- お問い合わせ（フォームを作るときに使う）
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('data_error', 'request', 'bug', 'other')), -- データの間違い／要望／不具合／その他
  body text not null,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'done')),               -- 対応状況
  created_at timestamptz not null default now()
);
