// イベントのデータをどこから読むか（PHP でいう「DB から読む関数」をまとめたファイル）
// 環境変数 EVENTS_SOURCE が "db" のときは Neon の DB から、それ以外は今までどおり events.ts から読む
// DB を読むのはページを作るときだけ。結果は "use cache" で保存しておき、利用者が開くたびには DB に聞かない
import { cacheLife, cacheTag } from "next/cache";
import { events as fileEvents, type EventData } from "./events";
import { sampleEvents } from "./sampleEvents";
import { rowsToEvents, type EventRow, type RewardRow } from "./eventRows";

export async function getEvents(): Promise<EventData[]> {
  "use cache";
  cacheLife("max");
  cacheTag("events"); // 管理画面で保存したら、この名前で作り直す
  if (process.env.EVENTS_SOURCE !== "db") return fileEvents;
  return loadFromDb();
}

// slug からイベントを探す。開発中（npm run dev）だけ、画面確認用の仮イベントも探す
export async function getEventBySlug(slug: string): Promise<EventData | undefined> {
  const list = await getEvents();
  const all = process.env.NODE_ENV === "development" ? [...list, ...sampleEvents] : list;
  return all.find((event) => event.slug === slug);
}

async function loadFromDb(): Promise<EventData[]> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("EVENTS_SOURCE=db なのに DATABASE_URL がありません");
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  // 日時は、今までの events.ts と同じ「2026-11-04T18:00:00+09:00」（日本時間）の形で受け取る
  const jst = (col: string) => `to_char(${col} at time zone 'Asia/Tokyo', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"')`;
  const eventRows = (await sql.query(
    `select id, slug, name, event_type, category, point_unit,
            ${jst("start_at")} as start_at, ${jst("end_at")} as end_at,
            case when reward_end_at is null then null else ${jst("reward_end_at")} end as reward_end_at
       from events
      where status = 'published'
      order by start_at desc`,
  )) as EventRow[];
  const rewardRows = (await sql.query(
    `select r.event_id, i.name as item_name, r.quantity, r.cost_points, r.required_points, r.max_count,
            coalesce(r.icon_url, i.icon_url) as icon_url
       from event_rewards r
       join items i on i.id = r.item_id
       join events e on e.id = r.event_id
      where e.status = 'published'
      order by r.event_id, r.sort_order`,
  )) as RewardRow[];
  return rowsToEvents(eventRows, rewardRows);
}
