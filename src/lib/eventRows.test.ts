import { describe, expect, it } from "vitest";
import { FALLBACK_ICON, rewardName, rowsToEvents, type EventRow, type RewardRow } from "./eventRows";

const exchangeRow: EventRow = {
  id: "e1", slug: "jigoku-meguri-2026", name: "地獄めぐり", event_type: "exchange", category: "シナリオイベント",
  point_unit: "pt", start_at: "2026-11-04T18:00:00+09:00", end_at: "2026-11-18T13:00:00+09:00",
  reward_end_at: "2026-11-25T13:00:00+09:00",
};
const milestoneRow: EventRow = {
  id: "e2", slug: "big-togaki-2026-10", name: "BIGト餓鬼討伐大作戦", event_type: "milestone", category: "大討伐",
  point_unit: "体", start_at: "2026-10-14T18:00:00+09:00", end_at: "2026-11-04T13:00:00+09:00",
  reward_end_at: "2026-11-11T13:00:00+09:00",
};
const rewards: RewardRow[] = [
  { event_id: "e1", item_name: "小判", quantity: 10, cost_points: 10, required_points: null, max_count: null, icon_url: "/rewards/koban-10.png" },
  { event_id: "e1", item_name: "麦", quantity: 1, cost_points: 100, required_points: null, max_count: 3, icon_url: "/rewards/wheat.png" },
  { event_id: "e2", item_name: "宝玉", quantity: 50, cost_points: null, required_points: 500, max_count: null, icon_url: null },
];

describe("rewardName", () => {
  it("2個以上なら ×数 を付ける", () => {
    expect(rewardName("小判", 10000)).toBe("小判×10000");
    expect(rewardName("麦", 1)).toBe("麦");
  });
});

describe("rowsToEvents", () => {
  const [jigoku, togaki] = rowsToEvents([exchangeRow, milestoneRow], rewards);

  it("交換所型は events.ts と同じ形になる（上限なしは999、単位 pt は書かない）", () => {
    expect(jigoku).toEqual({
      slug: "jigoku-meguri-2026", name: "地獄めぐり", type: "exchange", category: "シナリオイベント",
      start: "2026-11-04T18:00:00+09:00", end: "2026-11-18T13:00:00+09:00", exchangeEnd: "2026-11-25T13:00:00+09:00",
      rewards: [
        { name: "小判×10", costPoints: 10, maxCount: 999, image: "/rewards/koban-10.png", amount: 10 },
        { name: "麦", costPoints: 100, maxCount: 3, image: "/rewards/wheat.png", amount: 1 },
      ],
    });
  });

  it("到達型は単位と受け取り期限を持ち、画像がない報酬は仮のアイコン", () => {
    expect(togaki).toMatchObject({ type: "milestone", unit: "体", rewardEnd: "2026-11-11T13:00:00+09:00" });
    expect(togaki.type === "milestone" && togaki.milestones).toEqual([
      { name: "宝玉×50", requiredPoints: 500, image: FALLBACK_ICON, amount: 50 },
    ]);
  });

  it("ほかのイベントの報酬は混ざらない", () => {
    expect(jigoku.type === "exchange" && jigoku.rewards.length).toBe(2);
  });
});
