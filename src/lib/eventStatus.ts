// イベントが今どの状態か（開催前・開催中・交換期間中・終了）を決める
// トップのボタンとイベント一覧で使う。時刻は呼び出し側から渡す（テストしやすくするため）
import { formatEnd, formatStart } from "./dateFormat";
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
 * トップに出すイベントを選ぶ。開催前のイベントは出さない（メンテ中に次のイベントを見せないため）
 * main：大きいボタン。開催中 → それがなければ、始まっているイベントのうちいちばん新しく足したもの
 * exchange：その下の小さいボタン。終わって交換期間中のイベント（main と同じものは除く）
 */
export function pickTopEvents(events: EventData[], now: Date): { main: EventData | null; exchange: ExchangeEvent[] } {
  const started = events.filter((event) => getEventPhase(event, now) !== "upcoming");
  const ongoing = started.find((event) => getEventPhase(event, now) === "ongoing");
  const main = ongoing ?? started[0] ?? null;
  const exchange = started.filter(
    (event): event is ExchangeEvent => event !== main && getEventPhase(event, now) === "exchange",
  );
  return { main, exchange };
}

/** 期限の文。交換所型「交換は11/25（水）12:59まで」、到達型は受け取り期限がわかるときだけ */
export function deadlineText(event: EventData): string {
  if (event.type === "exchange") return `交換は${formatEnd(event.exchangeEnd)}まで`;
  if (event.rewardEnd) return `受け取りは${formatEnd(event.rewardEnd)}まで`;
  return "";
}

/** ボタンや一覧に出す、短い状態の文（期限の日時は deadlineText で別に出す） */
export function eventStatusText(event: EventData, now: Date): string {
  const phase = getEventPhase(event, now);
  if (phase === "upcoming") return `${formatStart(event.start)}から`;
  if (phase === "ongoing") {
    const diff = new Date(event.end).getTime() - now.getTime();
    return `開催中（残り${Math.floor(diff / DAY_MS)}日${Math.floor((diff % DAY_MS) / HOUR_MS)}時間）`;
  }
  if (phase === "exchange" && event.type === "exchange") {
    const leftDays = Math.ceil((new Date(event.exchangeEnd).getTime() - now.getTime()) / DAY_MS);
    return `交換期間中（あと${leftDays}日）`;
  }
  return "終了";
}
