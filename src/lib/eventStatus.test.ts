import { describe, expect, it } from "vitest";
import { eventStatusText, getEventPhase, pickTopEvents } from "./eventStatus";
import type { EventData } from "./events";

const jigoku: EventData = {
  slug: "jigoku",
  name: "地獄めぐり",
  type: "exchange",
  category: "シナリオイベント",
  start: "2026-11-04T18:00:00+09:00",
  end: "2026-11-18T13:00:00+09:00",
  exchangeEnd: "2026-11-25T13:00:00+09:00",
  rewards: [],
};
const gaki: EventData = {
  slug: "gaki",
  name: "大討伐",
  type: "milestone",
  category: "大討伐",
  start: "2026-11-18T15:00:00+09:00",
  end: "2026-12-02T13:00:00+09:00",
  milestones: [],
};
const at = (iso: string) => new Date(iso);

describe("getEventPhase", () => {
  it("開始前・開催中・交換期間中・終了を分ける", () => {
    expect(getEventPhase(jigoku, at("2026-11-04T17:59:00+09:00"))).toBe("upcoming");
    expect(getEventPhase(jigoku, at("2026-11-04T18:00:00+09:00"))).toBe("ongoing");
    expect(getEventPhase(jigoku, at("2026-11-18T13:00:00+09:00"))).toBe("exchange");
    expect(getEventPhase(jigoku, at("2026-11-25T13:00:00+09:00"))).toBe("ended");
  });

  it("到達型は交換期間がないので、終わったら終了", () => {
    expect(getEventPhase(gaki, at("2026-12-02T13:00:00+09:00"))).toBe("ended");
  });
});

describe("pickTopEvents", () => {
  const events = [gaki, jigoku]; // 新しいイベントが先頭

  it("開催中のイベントを大きいボタンにする", () => {
    expect(pickTopEvents(events, at("2026-11-10T12:00:00+09:00"))).toEqual({ main: jigoku, exchange: [] });
  });

  it("メンテの間（地獄めぐり終了〜大討伐開始）は、次のイベントを大きく、地獄めぐりを交換期間中で出す", () => {
    expect(pickTopEvents(events, at("2026-11-18T14:00:00+09:00"))).toEqual({ main: gaki, exchange: [jigoku] });
  });

  it("大討伐の開催中も、交換期限までは地獄めぐりを小さく出す", () => {
    expect(pickTopEvents(events, at("2026-11-20T12:00:00+09:00"))).toEqual({ main: gaki, exchange: [jigoku] });
  });

  it("交換期限を過ぎたら小さいボタンは消える", () => {
    expect(pickTopEvents(events, at("2026-11-25T13:00:00+09:00"))).toEqual({ main: gaki, exchange: [] });
  });

  it("どれも終わっていたら、いちばん新しく足したイベントを出す", () => {
    expect(pickTopEvents(events, at("2026-12-10T12:00:00+09:00")).main).toBe(gaki);
  });
});

describe("eventStatusText", () => {
  it("開催前は開始の日時", () => {
    expect(eventStatusText(gaki, at("2026-11-18T14:00:00+09:00"))).toBe("11/18 15時から");
  });

  it("開催中は残り時間", () => {
    expect(eventStatusText(jigoku, at("2026-11-15T10:00:00+09:00"))).toBe("開催中（残り3日3時間）");
  });

  it("交換期間中は残り日数と期限（13:00終了は12:59と書く）", () => {
    expect(eventStatusText(jigoku, at("2026-11-21T12:00:00+09:00"))).toBe("交換期間中（あと5日・11/25 12:59まで）");
  });

  it("終わったら終了", () => {
    expect(eventStatusText(jigoku, at("2026-11-26T12:00:00+09:00"))).toBe("終了");
  });
});
