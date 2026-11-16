import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EventListCard } from "@/components/TopEventButtons";
import { formatPeriodParts } from "@/lib/dateFormat";
import { deadlineText } from "@/lib/eventStatus";
import { getEvents } from "@/lib/eventSource";
import { pageMeta, site, tool } from "@/lib/site";

export const metadata = pageMeta(`${tool.title}｜イベント一覧｜${site.name}`, tool.description, "/point-calc");

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
              {/* カードの中で要るのは名前と日時だけなので、報酬の一覧は外して渡す（ブラウザに送る量を減らす） */}
              <EventListCard event={event.type === "exchange" ? { ...event, rewards: [] } : { ...event, milestones: [] }}>
                <span className="inline-block rounded-sm bg-notebook-green px-2 py-1 text-xs font-bold text-white">{event.category}</span>
                <span className="mt-2 block text-xl font-extrabold tracking-widest">{event.name}</span>
                <span className="mt-1 block text-notebook-muted">{formatPeriodParts(event.start, event.end).map((part) => <span key={part} className="inline-block">{part}</span>)}</span>
                {deadlineText(event) && <span className="block text-notebook-muted">{deadlineText(event)}</span>}
              </EventListCard>
            </li>
          ))}
        </ul>
      </main>

      <SiteFooter />
    </>
  );
}
