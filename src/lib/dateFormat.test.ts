import { describe, expect, it } from "vitest";
import { formatDay, formatEnd, formatPeriod, formatShortPeriod, formatStart } from "./dateFormat";

describe("dateFormat", () => {
  it("日付には曜日を付け、年は頼まれたときだけ", () => {
    expect(formatDay("2026-11-04T18:00:00+09:00")).toBe("11/4（水）");
    expect(formatDay("2026-11-04T18:00:00+09:00", true)).toBe("2026/11/4（水）");
  });

  it("開始は時刻そのまま、終了・期限の13:00ちょうどは12:59", () => {
    expect(formatStart("2026-11-18T15:00:00+09:00")).toBe("11/18（水）15:00");
    expect(formatEnd("2026-11-25T13:00:00+09:00")).toBe("11/25（水）12:59");
    expect(formatEnd("2026-11-25T12:30:00+09:00")).toBe("11/25（水）12:30");
  });

  it("0時ちょうどの終了は、前の日の23:59になる", () => {
    expect(formatEnd("2026-12-01T00:00:00+09:00")).toBe("11/30（月）23:59");
  });

  it("期間は年を最初だけに付ける", () => {
    expect(formatPeriod("2026-11-04T18:00:00+09:00", "2026-11-18T13:00:00+09:00")).toBe("2026/11/4（水）18:00〜11/18（水）12:59");
  });

  it("年をまたぐ期間は、終わりにも年を付ける", () => {
    expect(formatPeriod("2026-12-28T18:00:00+09:00", "2027-01-08T13:00:00+09:00")).toBe("2026/12/28（月）18:00〜2027/1/8（金）12:59");
  });

  it("短い期間は時刻なし", () => {
    expect(formatShortPeriod("2026-11-04T18:00:00+09:00", "2026-11-18T13:00:00+09:00")).toBe("11/4（水）〜11/18（水）");
  });
});
