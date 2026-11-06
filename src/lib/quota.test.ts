import { calcDailyQuota, calcRequiredTotal, calcRemainingDays } from "./quota";
import { describe, it, expect } from "vitest";

describe("calcDailyQuota", () => {
  it("割り切れるとき", () => {
    expect(calcDailyQuota(5000, 1000, 4)).toBe(1000);
  });

  it("割り切れないときは切り上げ", () => {
    expect(calcDailyQuota(8000, 1000, 3)).toBe(2334);
  });

  it("もう足りているときは0", () => {
    expect(calcDailyQuota(5000, 6000, 3)).toBe(0);
  });

  it("最終日だけ（0.5日）", () => {
    expect(calcDailyQuota(5000, 4000, 0.5)).toBe(2000);
  });
});

describe("calcRequiredTotal", () => {
  it("素材の個数を掛けて合計する", () => {
    const rewards = [
      { costPoints: 100, count: 2 },
      { costPoints: 250, count: 3 },
    ];
    expect(calcRequiredTotal(rewards)).toBe(950);
  });

  it("個数0の素材は合計に含めない", () => {
    const rewards = [
      { costPoints: 100, count: 0 },
      { costPoints: 250, count: 1 },
    ];
    expect(calcRequiredTotal(rewards)).toBe(250);
  });
});

export type EventDay = {
  date: string;
  playable: boolean;
}

describe("calcRemainingDays", () => {
  it("最終日を0.5日として計算する", () => {
    const days = [
      { date: "2026-11-06", playable: true },
      { date: "2026-11-07", playable: true },
    ];
    expect(calcRemainingDays(days, true)).toBe(1.5);
  });

  it("プレイしない日を除外する", () => {
    const days = [
      { date: "2026-11-06", playable: false },
      { date: "2026-11-07", playable: true },
    ];
    expect(calcRemainingDays(days, true)).toBe(0.5);
  });

  it("今日を含めない場合は1日減らす", () => {
    const days = [
      { date: "2026-11-06", playable: true },
      { date: "2026-11-07", playable: true },
      { date: "2026-11-08", playable: true },
    ];
    expect(calcRemainingDays(days, false)).toBe(1.5);
  });
});