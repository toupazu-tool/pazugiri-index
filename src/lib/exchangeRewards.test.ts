import { describe, expect, it } from "vitest";
import { calcExchangeTarget, formatExchangeCounts, parseExchangeCounts } from "./exchangeRewards";
import type { Reward } from "./events";

const rewards: Reward[] = [
  { name: "A", costPoints: 500, maxCount: 5, image: "/a.png", amount: 1 },
  { name: "B", costPoints: 8000, maxCount: 1, image: "/b.png", amount: 1 },
  { name: "C", costPoints: 10, maxCount: 0, image: "/c.png", amount: 1 },
];

describe("parseExchangeCounts", () => {
  it("値がないときは全部0", () => {
    expect(parseExchangeCounts(null, rewards)).toEqual([0, 0, 0]);
  });

  it("上限を超えた数・マイナス・小数・数字以外をそろえる", () => {
    expect(parseExchangeCounts("9,-1,3", rewards)).toEqual([5, 0, 0]);
    expect(parseExchangeCounts("2.7,abc", rewards)).toEqual([2, 0, 0]);
  });

  it("足りない分は0で埋める", () => {
    expect(parseExchangeCounts("3", rewards)).toEqual([3, 0, 0]);
  });
});

describe("formatExchangeCounts", () => {
  it("カンマ区切りにする（今までの共有URLと同じ形）", () => {
    expect(formatExchangeCounts([3, 1, 0])).toBe("3,1,0");
  });
});

describe("calcExchangeTarget", () => {
  it("必要ポイントの合計を出し、印は持たない", () => {
    expect(calcExchangeTarget([2, 1, 0], rewards)).toEqual({ requiredTotal: 9000, milestones: [] });
  });
});
