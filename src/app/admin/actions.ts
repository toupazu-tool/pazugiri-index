"use server";
// 管理画面のボタンを押したときの処理（PHP でいう、フォームの送信先の PHP ファイル）
// どの処理も、最初に「オーナーがログインしているか」を確かめる
// 保存したら updateTag("events") で、トップ・一覧・イベントページを作り直す（数秒で本番に出る）
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { fromJstInput, sql } from "@/lib/adminData";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const intOrNull = (form: FormData, key: string) => {
  const v = text(form, key);
  if (v === "") return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.floor(n) : null;
};

// DB のエラー（決まりに合わない入力）を、画面に出せる短い文にする
function messageOf(error: unknown): string {
  const m = error instanceof Error ? error.message : String(error);
  if (m.includes("events_slug_key")) return "同じ URL 用の名前のイベントがもうあります";
  if (m.includes("events_slug_check")) return "URL 用の名前は、英小文字・数字・ハイフンだけにしてください";
  if (m.includes("items_name_key")) return "同じ名前の素材がもうあります";
  if (m.includes("violates check constraint")) return "入力が決まりに合いません（期間の前後、交換所型の期限、ポイントの欄などを確かめてください）";
  if (m.includes("violates foreign key") || m.includes("RESTRICT")) return "使われているので消せません";
  return m.slice(0, 200);
}

function back(path: string, msg: string, ok = true): never {
  redirect(`${path}?${ok ? "msg" : "error"}=${encodeURIComponent(msg)}`);
}

// ---------- イベント ----------

function eventFields(form: FormData) {
  return {
    slug: text(form, "slug"),
    name: text(form, "name"),
    event_type: text(form, "event_type"),
    category: text(form, "category"),
    point_unit: text(form, "point_unit") || "pt",
    start_at: fromJstInput(text(form, "start_at")),
    end_at: fromJstInput(text(form, "end_at")),
    reward_end_at: fromJstInput(text(form, "reward_end_at")),
    source_url: text(form, "source_url") || null,
    top_display: text(form, "top_display") || "auto",
    listed: form.get("listed") === "on",
  };
}

export async function createEvent(form: FormData) {
  await requireAdmin();
  const f = eventFields(form);
  let id: string;
  try {
    const rows = (await sql().query(
      `insert into events (slug, name, event_type, category, point_unit, start_at, end_at, reward_end_at, source_url, top_display, listed, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'draft') returning id`,
      [f.slug, f.name, f.event_type, f.category, f.point_unit, f.start_at, f.end_at, f.reward_end_at, f.source_url, f.top_display, f.listed],
    )) as { id: string }[];
    id = rows[0].id;
  } catch (error) {
    back("/admin/events/new", messageOf(error), false);
  }
  back(`/admin/events/${id}`, "下書きで作りました。報酬を入れてから公開してください");
}

export async function updateEvent(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const f = eventFields(form);
  try {
    await sql().query(
      `update events set slug=$2, name=$3, event_type=$4, category=$5, point_unit=$6, start_at=$7, end_at=$8,
              reward_end_at=$9, source_url=$10, top_display=$11, listed=$12 where id=$1`,
      [id, f.slug, f.name, f.event_type, f.category, f.point_unit, f.start_at, f.end_at, f.reward_end_at, f.source_url, f.top_display, f.listed],
    );
  } catch (error) {
    back(`/admin/events/${id}`, messageOf(error), false);
  }
  updateTag("events");
  back(`/admin/events/${id}`, "保存しました");
}

export async function setEventStatus(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const status = text(form, "status") === "published" ? "published" : "draft";
  if (status === "published") {
    const rows = (await sql().query(`select count(*)::int as n from event_rewards where event_id=$1`, [id])) as { n: number }[];
    if (!rows[0] || rows[0].n === 0) back(`/admin/events/${id}`, "報酬が1つもないので公開できません", false);
  }
  await sql().query(`update events set status=$2 where id=$1`, [id, status]);
  updateTag("events");
  back(`/admin/events/${id}`, status === "published" ? "公開しました（数秒でサイトに出ます）" : "下書きに戻しました（サイトから消えます）");
}

// ---------- 報酬 ----------

function rewardFields(form: FormData) {
  return {
    item_id: text(form, "item_id"),
    quantity: intOrNull(form, "quantity") ?? 1,
    points: intOrNull(form, "points"),
    max_count: intOrNull(form, "max_count"),
    icon_url: text(form, "icon_url") || null,
    sort_order: intOrNull(form, "sort_order") ?? 0,
  };
}

// イベントの形によって、ポイントを入れる欄（必要ポイント／到達ポイント）が変わる
async function pointsColumn(eventId: string): Promise<"cost_points" | "required_points"> {
  const rows = (await sql().query(`select event_type from events where id=$1`, [eventId])) as { event_type: string }[];
  return rows[0]?.event_type === "exchange" ? "cost_points" : "required_points";
}

export async function addReward(form: FormData) {
  await requireAdmin();
  const eventId = text(form, "event_id");
  const r = rewardFields(form);
  const col = await pointsColumn(eventId);
  try {
    // 並び順を空にしたら、いちばん最後に足す
    await sql().query(
      `insert into event_rewards (event_id, item_id, quantity, ${col}, max_count, icon_url, sort_order)
       values ($1,$2,$3,$4,$5,$6, coalesce(nullif($7,0), (select coalesce(max(sort_order),0)+10 from event_rewards where event_id=$1)))`,
      [eventId, r.item_id, r.quantity, r.points, r.max_count, r.icon_url, r.sort_order],
    );
  } catch (error) {
    back(`/admin/events/${eventId}`, messageOf(error), false);
  }
  updateTag("events");
  back(`/admin/events/${eventId}`, "報酬を足しました");
}

export async function updateReward(form: FormData) {
  await requireAdmin();
  const eventId = text(form, "event_id");
  const id = text(form, "id");
  const r = rewardFields(form);
  const col = await pointsColumn(eventId);
  try {
    await sql().query(
      `update event_rewards set item_id=$2, quantity=$3, ${col}=$4, max_count=$5, icon_url=$6, sort_order=$7 where id=$1`,
      [id, r.item_id, r.quantity, r.points, r.max_count, r.icon_url, r.sort_order],
    );
  } catch (error) {
    back(`/admin/events/${eventId}`, messageOf(error), false);
  }
  updateTag("events");
  back(`/admin/events/${eventId}`, "報酬を直しました");
}

export async function deleteReward(form: FormData) {
  await requireAdmin();
  const eventId = text(form, "event_id");
  await sql().query(`delete from event_rewards where id=$1`, [text(form, "id")]);
  updateTag("events");
  back(`/admin/events/${eventId}`, "報酬を消しました");
}

// ---------- 素材 ----------

export async function createItem(form: FormData) {
  await requireAdmin();
  const back_to = text(form, "back_to") || "/admin/items";
  try {
    await sql().query(`insert into items (name, kind, icon_url) values ($1,$2,$3)`, [
      text(form, "name"),
      text(form, "kind") || "material",
      text(form, "icon_url") || null,
    ]);
  } catch (error) {
    back(back_to, messageOf(error), false);
  }
  back(back_to, "素材を足しました");
}

export async function updateItem(form: FormData) {
  await requireAdmin();
  try {
    await sql().query(`update items set name=$2, kind=$3, icon_url=$4, is_active=$5 where id=$1`, [
      text(form, "id"),
      text(form, "name"),
      text(form, "kind"),
      text(form, "icon_url") || null,
      form.get("is_active") === "on",
    ]);
  } catch (error) {
    back("/admin/items", messageOf(error), false);
  }
  updateTag("events");
  back("/admin/items", "素材を直しました");
}
