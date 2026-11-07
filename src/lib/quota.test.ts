import { calcDailyQuota, calcRequiredTotal, calcRemainingDays, calcSchedule } from "./quota";
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

describe("calcRemainingDays", () => {
  it("初日と最終日は0.5日、間の日は1日", () => {
    const days = [
      { date: "2026-11-04", playable: true },
      { date: "2026-11-05", playable: true },
      { date: "2026-11-06", playable: true },
    ];
    expect(calcRemainingDays(days)).toBe(2);
  });

  it("プレイしない日を除外する", () => {
    const days = [
      { date: "2026-11-04", playable: false },
      { date: "2026-11-05", playable: true },
      { date: "2026-11-06", playable: true },
    ];
    expect(calcRemainingDays(days)).toBe(1.5);
  });

  it("全部外すと0日", () => {
    const days = [
      { date: "2026-11-04", playable: false },
      { date: "2026-11-05", playable: false },
    ];
    expect(calcRemainingDays(days)).toBe(0);
  });
});

//11/4〜11/18の15日分を作る
function makeDays(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    date: `2026-11-${String(4 + i).padStart(2, "0")}`,
    playable: true,
  }));
}

describe("calcSchedule", () => {
  it("初日と最終日は半分、間は1日分", () => {
    const schedule = calcSchedule(makeDays(3), 0, 1000);
    expect(schedule.map((day) => day.target)).toEqual([250, 500, 250]);
  });

  it("マイナスにならず、最後にぴったり届く", () => {
    const schedule = calcSchedule(makeDays(15), 0, 55635);
    expect(schedule.every((day) => day.target >= 0)).toBe(true);
    expect(schedule[schedule.length - 1].cumulative).toBe(55635);
  });

  it("もう足りているときは全部0", () => {
    const schedule = calcSchedule(makeDays(3), 2000, 1000);
    expect(schedule.every((day) => day.target === 0)).toBe(true);
  });

  it("残りが少なくてもマイナスにならない", () => {
    const schedule = calcSchedule(makeDays(3), 0, 1);
    expect(schedule.map((day) => day.target)).toEqual([1, 0, 0]);
  });
});
