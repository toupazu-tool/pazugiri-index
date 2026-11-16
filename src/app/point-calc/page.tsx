import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EventStatusLabel } from "@/components/TopEventButtons";
import { shortDate } from "@/lib/events";
import { getEvents } from "@/lib/eventSource";
import { pageMeta, site, tool } from "@/lib/site";

export const metadata = pageMeta(`${tool.title}｜イベント一覧｜${site.name}`, tool.description, "/point-calc");

const cardClass = "rounded-2xl border border-notebook-line bg-notebook-paper px-4 py-5 shadow-[0_4px_8px_rgba(90,70,48,0.3)] sm:p-6";

// イベントの一覧ページ。events.ts（または DB）のイベントが自動で並ぶ
export default async function PointCalcListPage() {
  const events = await getEvents();
  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 px-5 py-8 text-sm leading-relaxed">
        <div className="pt-2 text-center">
          <h1 className="flex flex-col items-center justify-center gap-2 text-2xl font-extrabold sm:flex-row sm:gap-3">
            <img src="/to-top.svg" alt="" className="h-12 w-auto" />
            イベントノルマ計算ツール
          </h1>
          <p className="mt-3">計算したいイベントを選んでください。</p>
        </div>

        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.slug}>
              <Link href={`/point-calc/${event.slug}`} className={`${cardClass} block transition hover:-translate-y-0.5`}>
                <span className="inline-block rounded-sm bg-notebook-green px-2 py-1 text-xs font-bold text-white">{event.category}</span>
                <span className="mt-2 block text-xl font-extrabold tracking-widest">{event.name}</span>
                <span className="mt-1 block text-notebook-muted">
                  {event.start.slice(0, 4)}年 {shortDate(event.start)}〜{shortDate(event.end)}{event.type === "exchange" && `（交換は${shortDate(event.exchangeEnd)}まで）`}
                </span>
                {/* 開催中・交換期間中などの状態（開いた人のブラウザの時刻で出す） */}
                <EventStatusLabel event={event} />
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <SiteFooter />
    </>
  );
}
