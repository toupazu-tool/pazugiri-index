// 共有URL（?current=…&counts=…&days=…）から、その人のノルマの結果を計算し直す
// 共有カード画像（結果入りの OGP 画像）で使う。計算は画面と同じ関数を使うので、結果も画面と同じになる
import { calcExchangeTarget, parseExchangeCounts } from "./exchangeRewards";
import { unitOf, type EventData } from "./events";
import { calcMilestoneTarget, parseMilestoneTarget } from "./milestoneRewards";
import { calcDailyQuota, calcRemainingDays, type EventDay } from "./quota";

// イベント期間の日付の一覧（"2026-11-04" の形、日本時間）
export function listEventDates(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startIso.slice(0, 10)}T12:00:00+09:00`);
  const end = new Date(`${endIso.slice(0, 10)}T12:00:00+09:00`);
  for (let time = start.getTime(); time <= end.getTime(); time += 24 * 60 * 60 * 1000) {
    dates.push(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date(time)));
  }
  return dates;
}

// 選んだ内容を入れる URL の名前（交換所型は counts、到達型は target）
export const selectionParamOf = (event: EventData) => (event.type === "exchange" ? "counts" : "target");

// 共有URLの結果に関係する部分だけを、決まった順に取り出す（カード画像の URL に使う）
export function sharedQuery(event: EventData, query: URLSearchParams): URLSearchParams | null {
  const keys = ["current", selectionParamOf(event), "days"];
  if (!query.has("current") && !query.has(selectionParamOf(event))) return null; // 結果が入っていない普通のURL
  const out = new URLSearchParams();
  for (const key of keys) {
    const value = query.get(key);
    if (value !== null) out.set(key, value);
  }
  return out;
}

export type SharedResult = {
  eventName: string;
  unit: string;
  current: number;
  required: number;
  rest: number;
  dailyQuota: number; // 0 なら達成済み
  remainingDays: number;
  goal?: string; // 到達型の目標の報酬
};

export function calcSharedResult(event: EventData, query: URLSearchParams): SharedResult {
  const n = Number(query.get("current"));
  const current = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  const raw = query.get(selectionParamOf(event));
  const target = event.type === "exchange"
    ? calcExchangeTarget(parseExchangeCounts(raw, event.rewards), event.rewards)
    : calcMilestoneTarget(parseMilestoneTarget(raw, event.milestones), event.milestones, unitOf(event));
  // プレイする日：URL の days（"1101…"）。なければ全部の日
  const daysParam = query.get("days");
  const days: EventDay[] = listEventDates(event.start, event.end).map((date, i) => ({
    date,
    playable: daysParam ? daysParam[i] === "1" : true,
  }));
  const remainingDays = calcRemainingDays(days);
  return {
    eventName: event.name,
    unit: unitOf(event),
    current,
    required: target.requiredTotal,
    rest: Math.max(target.requiredTotal - current, 0),
    dailyQuota: calcDailyQuota(target.requiredTotal, current, remainingDays),
    remainingDays,
    goal: target.goalLabel,
  };
}
