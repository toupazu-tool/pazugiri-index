// 管理画面で使う DB の読み書き（PHP でいう、管理画面用の SELECT／INSERT／UPDATE をまとめたファイル）
// 管理画面は毎回 DB を直接読む（キャッシュしない）。公開ページの作り直しは actions.ts で行う
import { neon } from "@neondatabase/serverless";

export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL が設定されていません");
  return neon(url);
}

// 日時は「2026-11-18T18:00」（日本時間、画面の入力欄の形）でやりとりする
const JST = (col: string) => `to_char(${col} at time zone 'Asia/Tokyo', 'YYYY-MM-DD"T"HH24:MI')`;
export const fromJstInput = (value: string) => (value ? `${value}:00+09:00` : null);

export type AdminEvent = {
  id: string;
  slug: string;
  name: string;
  event_type: "exchange" | "milestone";
  category: string;
  point_unit: string;
  start_at: string;
  end_at: string;
  reward_end_at: string | null;
  status: "draft" | "published";
  source_url: string | null;
  top_display: "auto" | "show" | "hide";
  listed: boolean;
  reward_count: number;
};

export type AdminReward = {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  cost_points: number | null;
  required_points: number | null;
  max_count: number | null;
  icon_url: string | null;
  item_icon_url: string | null;
  sort_order: number;
};

export type AdminItem = { id: string; name: string; kind: string; icon_url: string | null; is_active: boolean };

const EVENT_COLUMNS = `e.id, e.slug, e.name, e.event_type, e.category, e.point_unit,
  ${JST("e.start_at")} as start_at, ${JST("e.end_at")} as end_at,
  case when e.reward_end_at is null then null else ${JST("e.reward_end_at")} end as reward_end_at,
  e.status, e.source_url, e.top_display, e.listed,
  (select count(*)::int from event_rewards r where r.event_id = e.id) as reward_count`;

export async function listEvents(): Promise<AdminEvent[]> {
  return (await sql().query(`select ${EVENT_COLUMNS} from events e order by e.start_at desc`)) as AdminEvent[];
}

export async function getEvent(id: string): Promise<AdminEvent | null> {
  const rows = (await sql().query(`select ${EVENT_COLUMNS} from events e where e.id = $1`, [id])) as AdminEvent[];
  return rows[0] ?? null;
}

export async function listRewards(eventId: string): Promise<AdminReward[]> {
  return (await sql().query(
    `select r.id, r.item_id, i.name as item_name, r.quantity, r.cost_points, r.required_points, r.max_count,
            r.icon_url, i.icon_url as item_icon_url, r.sort_order
       from event_rewards r join items i on i.id = r.item_id
      where r.event_id = $1
      order by r.sort_order, coalesce(r.required_points, r.cost_points)`,
    [eventId],
  )) as AdminReward[];
}

export async function listItems(): Promise<AdminItem[]> {
  return (await sql().query(`select id, name, kind, icon_url, is_active from items order by is_active desc, name`)) as AdminItem[];
}
