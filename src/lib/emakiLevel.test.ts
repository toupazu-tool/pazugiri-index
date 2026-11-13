import { describe, it, expect } from "vitest";
import {
  cumulativeToNext,
  needAtLevel,
  levelStartXp,
  validateCurrentXp,
  remainingToNext,
  progressPercent,
  remainingToTarget,
  isPredictedLevel,
  CONFIRMED_MAX_LEVEL,
  levelTable,
} from "./emakiLevel";

// ゲーム画面のスクショから取った「次のレベルへの累計」
const measuredCumulative: Record<number, number> = {
  1: 105,
  2: 574,
  3: 1549,
  5: 5416,
  9: 22860,
  14: 67484,
  16: 93602,
  24: 252759,
  26: 307520,
  30: 436653,
  31: 473241,
  38: 787655,
  42: 1023402,
  46: 1311367,
  50: 1663115,
};

describe("cumulativeToNext", () => {
  it("実測15点が1の位まで一致する", () => {
    for (const [level, expected] of Object.entries(measuredCumulative)) {
      expect(cumulativeToNext(Number(level)), `T(${level})`).toBe(expected);
    }
  });

  it("Lv29とLv30の必要量が倍率の元の数字と一致する", () => {
    expect(needAtLevel(29)).toBe(33105);
    expect(needAtLevel(30)).toBe(34803);
    expect(cumulativeToNext(30) - cumulativeToNext(29)).toBe(34803);
    expect(cumulativeToNext(29) - cumulativeToNext(28)).toBe(33105);
  });
});

describe("needAtLevel / levelStartXp", () => {
  it("Lv1の必要量は105、開始は0", () => {
    expect(needAtLevel(1)).toBe(105);
    expect(levelStartXp(1)).toBe(0);
  });

  it("必要量は累計の差と同じ", () => {
    for (const level of [2, 3, 30, 31, 38, 50]) {
      expect(needAtLevel(level)).toBe(cumulativeToNext(level) - cumulativeToNext(level - 1));
    }
  });
});

describe("validateCurrentXp", () => {
  it("レベルの範囲に入っていればOK", () => {
    expect(validateCurrentXp(3, 1283).ok).toBe(true);
    expect(validateCurrentXp(1, 0).ok).toBe(true);
    expect(validateCurrentXp(31, 473241).ok).toBe(true);
  });

  it("少なすぎるとエラー", () => {
    const result = validateCurrentXp(31, 400000);
    expect(result.ok).toBe(false);
  });

  it("多すぎるとエラー", () => {
    const result = validateCurrentXp(3, 2000);
    expect(result.ok).toBe(false);
  });
});

describe("remainingToNext / progressPercent / remainingToTarget", () => {
  it("次のレベルまでの残りを出す", () => {
    expect(remainingToNext(3, 1283)).toBe(266);
  });

  it("レベルの中での進み具合を出す", () => {
    // Lv3 は 574〜1549、必要は 975。1283 なら (1283-574)/975
    const percent = progressPercent(3, 1283);
    expect(percent).not.toBeNull();
    expect(percent!).toBeCloseTo(((1283 - 574) / 975) * 100);
  });

  it("目標レベルまでの残りを出す", () => {
    // Lv46になるには T(45) に届く必要がある
    expect(remainingToTarget(992654, 46)).toBe(cumulativeToNext(45) - 992654);
  });

  it("すでに目標に届いているときは0", () => {
    expect(remainingToTarget(1663115, 50)).toBe(0);
  });
});

describe("isPredictedLevel", () => {
  it("Lv50までは確認済み、51以上は予測", () => {
    expect(isPredictedLevel(CONFIRMED_MAX_LEVEL)).toBe(false);
    expect(isPredictedLevel(CONFIRMED_MAX_LEVEL + 1)).toBe(true);
  });
});

describe("levelTable", () => {
  it("レベル累計はそのレベルになったときの累計で、必要経験値は次のLvまでの必要量", () => {
    const rows = levelTable(CONFIRMED_MAX_LEVEL);
    expect(rows).toHaveLength(CONFIRMED_MAX_LEVEL);
    expect(rows[0]).toMatchObject({ level: 1, levelCumulative: 0, need: 105 });
    expect(rows[1]).toMatchObject({ level: 2, levelCumulative: 105, need: 469 });
    expect(rows[2]).toMatchObject({ level: 3, levelCumulative: 574, need: 975 });
    const last = rows[CONFIRMED_MAX_LEVEL - 1];
    expect(last).toMatchObject({
      level: 50,
      levelCumulative: 1_568_474,
      need: 94_641,
    });
    expect(last.levelCumulative).toBe(cumulativeToNext(49));
    expect(last.need).toBe(needAtLevel(50));
  });
});
