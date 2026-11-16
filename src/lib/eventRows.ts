// DB の行を、画面で使う形（events.ts と同じ EventData）に直す
// DB に関係なく動くので、テストで確かめられる
import type { EventData } from "./events";

export type EventRow = {
  id: string;
  slug: string;
  name: string;
  event_type: "exchange" | "milestone";
  category: string;
  point_unit: string;
  start_at: string;
  end_at: string;
  reward_end_at: string | null;
};

export type RewardRow = {
  event_id: string;
  item_name: string;
  quantity: number;
  cost_points: number | null;
  required_points: number | null;
  max_count: number | null;
  icon_url: string | null;
};

// 画像がまだない素材に出す仮のアイコン
export const FALLBACK_ICON = "/icon.png";
// 上限なし（DB では空）は、画面では今までどおり 999 回として扱う
export const UNLIMITED_COUNT = 999;

// 「素材名 ×数」（1個なら数は付けない）。例：小判 ＋ 10000 → 小判×10000
export function rewardName(itemName: string, quantity: number): string {
  return quantity > 1 ? `${itemName}×${quantity}` : itemName;
}

export function rowsToEvents(eventRows: EventRow[], rewardRows: RewardRow[]): EventData[] {
  return eventRows.map((e): EventData => {
    const rows = rewardRows.filter((r) => r.event_id === e.id);
    const base = {
      slug: e.slug,
      name: e.name,
      category: e.category,
      start: e.start_at,
      end: e.end_at,
      ...(e.point_unit && e.point_unit !== "pt" ? { unit: e.point_unit } : {}),
    };
    if (e.event_type === "exchange") {
      return {
        ...base,
        type: "exchange",
        exchangeEnd: e.reward_end_at ?? e.end_at,
        rewards: rows.map((r) => ({
          name: rewardName(r.item_name, r.quantity),
          costPoints: r.cost_points ?? 0,
          maxCount: r.max_count ?? UNLIMITED_COUNT,
          image: r.icon_url ?? FALLBACK_ICON,
          amount: r.quantity,
        })),
      };
    }
    return {
      ...base,
      type: "milestone",
      ...(e.reward_end_at ? { rewardEnd: e.reward_end_at } : {}),
      milestones: rows.map((r) => ({
        name: rewardName(r.item_name, r.quantity),
        requiredPoints: r.required_points ?? 0,
        image: r.icon_url ?? FALLBACK_ICON,
        amount: r.quantity,
      })),
    };
  });
}
