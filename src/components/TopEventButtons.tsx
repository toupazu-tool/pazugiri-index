"use client";

// トップの「イベントノルマ計算ツール」のボタン
// 開いた人のブラウザの時刻で、開催中・交換期間中を出し分ける（トップは前もって作るページなので、ここで判定する）
import Link from "next/link";
import { events, shortDate, type EventData } from "@/lib/events";
import { eventStatusText, getEventPhase, pickTopEvents, type EventPhase } from "@/lib/eventStatus";
import { useNow } from "@/lib/useNow";

// 開催中・開催前：緑で塗ったボタン（主役）
const filledClass = "flex min-h-12 flex-col items-center justify-center rounded-xl bg-notebook-green px-4 py-2 text-center font-bold text-white shadow-md transition hover:opacity-90";
// 交換期間中・終了：白地に緑の枠（まだ使えることが分かるよう、グレーにはしない）
const outlineClass = "flex min-h-11 flex-col items-center justify-center rounded-xl border-2 border-notebook-green bg-white px-4 py-2 text-center font-bold text-notebook-green transition hover:bg-notebook-beige";

// ボタンの文言。終わったあとはノルマより交換が用事なので言い方を変える
function buttonLabel(name: string, phase: EventPhase | null) {
  if (phase === "exchange") return `${name}の交換を確認する`;
  if (phase === "ended") return `${name}のページを見る`;
  return `${name}のノルマを計算する`;
}

export function TopEventButtons() {
  const now = useNow();
  return <TopEventButtonsView events={events} now={now} />;
}

// 見た目の部分。イベント一覧と時刻を外から受け取る（画面の確認やテストで、好きな日時にできるように）
export function TopEventButtonsView({ events, now }: { events: EventData[]; now: Date | null }) {
  // 時刻が入るまで（サーバーで作るとき）は、いちばん新しいイベントだけを出す
  const { main, exchange } = now ? pickTopEvents(events, now) : { main: events[0] ?? null, exchange: [] };
  if (!main) return null;
  const mainPhase = now ? getEventPhase(main, now) : null;
  const mainFilled = mainPhase === null || mainPhase === "ongoing" || mainPhase === "upcoming";

  return (
    <div className="mt-4 space-y-2">
      <Link href={`/point-calc/${main.slug}`} className={mainFilled ? filledClass : outlineClass}>
        <span className="text-base">{buttonLabel(main.name, mainPhase)}</span>
        <span className={`text-xs ${mainFilled ? "text-white/90" : "text-notebook-muted"}`}>
          {shortDate(main.start)}〜{shortDate(main.end)}
          {now && <>　{eventStatusText(main, now)}</>}
        </span>
      </Link>
      {now && exchange.map((event: EventData) => (
        <Link key={event.slug} href={`/point-calc/${event.slug}`} className={outlineClass}>
          <span className="text-sm">{buttonLabel(event.name, "exchange")}</span>
          <span className="text-xs text-notebook-red">{eventStatusText(event, now)}</span>
        </Link>
      ))}
    </div>
  );
}

// イベント一覧のカードに出す、小さな状態のラベル
export function EventStatusLabel({ event }: { event: EventData }) {
  const now = useNow();
  if (!now) return null;
  const phase = getEventPhase(event, now);
  const color = phase === "ongoing"
    ? "border-notebook-red text-notebook-red"
    : phase === "exchange"
      ? "border-notebook-green text-notebook-green"
      : "border-notebook-line text-notebook-muted";
  return (
    <span className={`mt-2 inline-block -rotate-2 rounded-sm border px-2 py-0.5 text-xs font-bold ${color}`}>
      {eventStatusText(event, now)}
    </span>
  );
}
