import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { latestEvent, shortDate } from "@/lib/events";
import { site } from "@/lib/site";

const cardClass = "rounded-2xl border border-notebook-line bg-notebook-paper px-4 py-6 shadow-[0_4px_8px_rgba(90,70,48,0.3)] sm:p-6";

// サイトのトップページ（ぱずぎり目録の入口）。ツールが増えたらここにカードを足す
export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 px-5 py-8 text-sm leading-relaxed">
        {/* 最初の「。」のあとで改行する（whitespace-pre-line で \n が改行になる） */}
        <p className="pt-2 text-center whitespace-pre-line">{site.description.replace("。", "。\n")}</p>

        <section className={cardClass}>
          <h2 className="flex items-center gap-3 text-xl font-extrabold">
            <img src="/to-top.svg" alt="" className="h-10 w-auto" />
            イベントノルマ計算ツール
          </h2>
          <p className="mt-3">イベント交換所で欲しい報酬を選ぶと、必要なポイントと1日あたりのノルマが分かります。</p>

          {/* いちばん新しいイベントへ1タップで行けるボタン */}
          <Link
            href={`/point-calc/${latestEvent.slug}`}
            className="mt-4 flex min-h-12 flex-col items-center justify-center rounded-xl bg-notebook-green px-4 py-2 text-center font-bold text-white shadow-md transition hover:opacity-90"
          >
            <span className="text-base">{latestEvent.name}のノルマを計算する</span>
            <span className="text-xs text-white/90">
              {shortDate(latestEvent.start)}〜{shortDate(latestEvent.end)}
            </span>
          </Link>
          <p className="mt-3 text-right">
            <Link href="/point-calc" className="text-notebook-green underline underline-offset-4">ほかのイベントを見る</Link>
          </p>
        </section>

        <section className={cardClass}>
          <h2 className="flex items-center gap-3 text-xl font-extrabold">
            <img src="/to-top.svg" alt="" className="h-10 w-auto" />
            絵巻守Lv早見表 | 経験値計算ツール
          </h2>
          <p className="mt-3">今の絵巻守Lvと経験値を入れると、次のレベルや目標レベルまでの残りが分かります。</p>
          <Link
            href="/emaki-level"
            className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-notebook-green px-4 py-2 text-center text-base font-bold text-white shadow-md transition hover:opacity-90"
          >
            絵巻守Lvを計算する
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
