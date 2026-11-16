import { describe, expect, it } from "vitest";
import { calcMilestoneTarget, countReached, parseMilestoneTarget, sortMilestones } from "./milestoneRewards";
import type { MilestoneReward } from "./events";

// わざと順番をばらばらにしておく
const milestones: MilestoneReward[] = [
  { name: "B", requiredPoints: 3000, image: "/b.png", amount: 1 },
  { name: "A", requiredPoints: 1000, image: "/a.png", amount: 1 },
  { name: "C", requiredPoints: 6000, image: "/c.png", amount: 1 },
];

describe("sortMilestones", () => {
  it("到達ポイントの少ない順に並べ、元の配列は変えない", () => {
    expect(sortMilestones(milestones).map((m) => m.name)).toEqual(["A", "B", "C"]);
    expect(milestones[0].name).toBe("B");
  });
});

describe("parseMilestoneTarget", () => {
  it("値がないときは最後の報酬", () => {
    expect(parseMilestoneTarget(null, milestones)).toBe(2);
    expect(parseMilestoneTarget("", milestones)).toBe(2);
  });

  it("範囲内の整数はそのまま", () => {
    expect(parseMilestoneTarget("0", milestones)).toBe(0);
    expect(parseMilestoneTarget("1", milestones)).toBe(1);
  });

  it("範囲外・小数・数字以外は最後の報酬", () => {
    expect(parseMilestoneTarget("9", milestones)).toBe(2);
    expect(parseMilestoneTarget("-1", milestones)).toBe(2);
    expect(parseMilestoneTarget("1.5", milestones)).toBe(2);
    expect(parseMilestoneTarget("abc", milestones)).toBe(2);
  });
});

describe("calcMilestoneTarget", () => {
  it("目標の報酬の到達ポイントが必要ポイントになる（合計ではない）", () => {
    expect(calcMilestoneTarget(1, milestones).requiredTotal).toBe(3000);
    expect(calcMilestoneTarget(2, milestones).requiredTotal).toBe(6000);
  });

  it("グラフ用の印を少ない順で全部持つ", () => {
    expect(calcMilestoneTarget(0, milestones).milestones).toEqual([
      { label: "A", points: 1000 },
      { label: "B", points: 3000 },
      { label: "C", points: 6000 },
    ]);
  });
});

describe("countReached", () => {
  it("ちょうど到達したらもらえた数に入る", () => {
    expect(countReached(0, milestones)).toBe(0);
    expect(countReached(2999, milestones)).toBe(1);
    expect(countReached(3000, milestones)).toBe(2);
    expect(countReached(99999, milestones)).toBe(3);
  });
});
