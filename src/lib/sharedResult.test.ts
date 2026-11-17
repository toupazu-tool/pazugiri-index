import { describe, expect, it } from "vitest";
import { calcSharedResult, sharedQuery } from "./sharedResult";
import type { EventData } from "./events";

const jigoku: EventData = {
  slug: "jigoku", name: "地獄めぐり", type: "exchange", category: "シナリオイベント",
  start: "2026-11-04T18:00:00+09:00", end: "2026-11-18T13:00:00+09:00", exchangeEnd: "2026-11-25T13:00:00+09:00",
  rewards: [
    { name: "A", costPoints: 500, maxCount: 5, image: "/a.png", amount: 1 },
    { name: "B", costPoints: 8000, maxCount: 1, image: "/b.png", amount: 1 },
    { name: "C", costPoints: 1000, maxCount: 6, image: "/c.png", amount: 1 },
  ],
};
const togaki: EventData = {
  slug: "togaki", name: "BIGト餓鬼討伐大作戦", type: "milestone", category: "大討伐", unit: "体",
  start: "2026-10-14T18:00:00+09:00", end: "2026-11-04T13:00:00+09:00",
  milestones: [
    { name: "小判×1000", requiredPoints: 250, image: "/k.png", amount: 1000 },
    { name: "小判×5000", requiredPoints: 150000, image: "/k.png", amount: 5000 },
  ],
};
const q = (s: string) => new URLSearchParams(s);

describe("sharedQuery", () => {
  it("結果が入っていないURLは null", () => {
    expect(sharedQuery(jigoku, q(""))).toBeNull();
    expect(sharedQuery(jigoku, q("utm_source=x"))).toBeNull();
  });

  it("結果に関係する部分だけを決まった順で取り出す", () => {
    expect(sharedQuery(jigoku, q("days=1&x=9&counts=1,2&current=10"))?.toString()).toBe("current=10&counts=1%2C2&days=1");
    expect(sharedQuery(togaki, q("current=5&target=1"))?.toString()).toBe("current=5&target=1");
  });
});

describe("calcSharedResult", () => {
  it("交換所型：画面と同じ計算（上限を超えた数は上限に収める）", () => {
    // 2×500 ＋ 1×8000 ＋ 6×1000（9は上限6に） ＝ 15,000。15日（初日・最終日は0.5日）→ 14日
    const r = calcSharedResult(jigoku, q("current=1000&counts=2,1,9&days=111111111111111"));
    expect(r).toMatchObject({ unit: "pt", required: 15000, rest: 14000, remainingDays: 14, dailyQuota: 1000 });
  });

  it("到達型：目標の報酬の到達ポイントがゴールで、単位と目標を持つ", () => {
    const r = calcSharedResult(togaki, q("current=60000&target=1&days=1111111111111111111111"));
    expect(r).toMatchObject({ unit: "体", required: 150000, rest: 90000, remainingDays: 21, dailyQuota: 4286, goal: "小判×5000（150,000体）" });
  });

  it("目標に届いていれば1日の目安は0（達成済み）", () => {
    expect(calcSharedResult(togaki, q("current=200000&target=1")).dailyQuota).toBe(0);
  });
});
