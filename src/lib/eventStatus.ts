// イベントが今どの状態か（開催前・開催中・交換期間中・終了）を決める
// トップのボタンとイベント一覧で使う。時刻は呼び出し側から渡す（テストしやすくするため）
import type { EventData, ExchangeEvent } from "./events";

export type EventPhase = "upcoming" | "ongoing" | "exchange" | "ended";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export function getEventPhase(event: EventData, now: Date): EventPhase {
  const time = now.getTime();
  if (time < new Date(event.start).getTime()) return "upcoming";
  if (time < new Date(event.end).getTime()) return "ongoing";
  if (event.type === "exchange" && time < new Date(event.exchangeEnd).getTime()) return "exchange";
  return "ended";
}

/**
 * トップに出すイベントを選ぶ
 * main：大きいボタン。開催中 → いちばん早く始まる開催前 → いちばん新しく足したイベント の順で選ぶ
 * exchange：その下の小さいボタン。終わって交換期間中のイベント（main と同じものは除く）
 */
export function pickTopEvents(events: EventData[], now: Date): { main: EventData | null; exchange: ExchangeEvent[] } {
  const ongoing = events.find((event) => getEventPhase(event, now) === "ongoing");
  const upcoming = events
    .filter((event) => getEventPhase(event, now) === "upcoming")
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
  const main = ongoing ?? upcoming ?? events[0] ?? null;
  const exchange = events.filter(
    (event): event is ExchangeEvent => event !== main && getEventPhase(event, now) === "exchange",
  );
  return { main, exchange };
}

// "2026-11-18T15:00:00+09:00" → 日本時間の「11/18」「15:00」
function tokyoParts(date: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { md: `${Number(get("month"))}/${Number(get("day"))}`, hour: Number(get("hour")), hm: `${get("hour")}:${get("minute")}` };
}

/** ボタンや一覧に出す、短い状態の文 */
export function eventStatusText(event: EventData, now: Date): string {
  const phase = getEventPhase(event, now);
  if (phase === "upcoming") {
    const { md, hour } = tokyoParts(new Date(event.start));
    return `${md} ${hour}時から`;
  }
  if (phase === "ongoing") {
    const diff = new Date(event.end).getTime() - now.getTime();
    return `開催中（残り${Math.floor(diff / DAY_MS)}日${Math.floor((diff % DAY_MS) / HOUR_MS)}時間）`;
  }
  if (phase === "exchange" && event.type === "exchange") {
    const exchangeEnd = new Date(event.exchangeEnd);
    const leftDays = Math.ceil((exchangeEnd.getTime() - now.getTime()) / DAY_MS);
    // 13:00終了なら「12:59まで」と書く（イベントページと同じ）
    const { md, hm } = tokyoParts(new Date(exchangeEnd.getTime() - 60 * 1000));
    return `交換期間中（あと${leftDays}日・${md} ${hm}まで）`;
  }
  return "終了";
}
