import { describe, expect, it } from "vitest";
import { getScheduleImageLayout, SCHEDULE_IMAGE_HEADERS, scheduleImageFilename } from "./scheduleTableImage";

describe("scheduleImageFilename", () => {
  it("イベントの名前を入れる", () => {
    expect(scheduleImageFilename("jigoku-meguri-2026")).toBe("jigoku-meguri-2026-schedule.png");
  });
});

describe("getScheduleImageLayout", () => {
  it("幅は絵巻守の保存画像と同じ880、文字の大きさもそろえる", () => {
    const layout = getScheduleImageLayout(15, 4, false);
    expect(layout.width).toBe(880);
    expect(layout.titleSize).toBe(48);
    expect(layout.cellSize).toBe(26);
    expect(layout.rowH).toBe(46);
    expect(layout.headerH).toBe(48);
    expect(layout.summaryRows).toBe(2);
  });

  it("行が増えると、1行ぶん（46）ずつ高くなる", () => {
    const a = getScheduleImageLayout(15, 4, false);
    const b = getScheduleImageLayout(16, 4, false);
    expect(b.height - a.height).toBe(46);
  });

  it("目標の行（到達型）があると、まとめの枠が高くなる", () => {
    const exchange = getScheduleImageLayout(15, 4, false);
    const milestone = getScheduleImageLayout(15, 4, true);
    expect(milestone.summaryHeight).toBeGreaterThan(exchange.summaryHeight);
    expect(milestone.tableTop - exchange.tableTop).toBe(milestone.summaryHeight - exchange.summaryHeight);
  });

  it("表はまとめの下、フッターは表の下に来る", () => {
    const layout = getScheduleImageLayout(15, 4, false);
    expect(layout.tableTop).toBeGreaterThan(layout.summaryTop + layout.summaryHeight);
    expect(layout.footerTop).toBeGreaterThan(layout.tableTop + layout.tableHeight);
    expect(layout.height).toBeGreaterThan(layout.footerTop);
  });

  it("見出しは画面の予定表と同じ", () => {
    expect(SCHEDULE_IMAGE_HEADERS).toEqual(["日付", "目標", "累計"]);
  });
});
