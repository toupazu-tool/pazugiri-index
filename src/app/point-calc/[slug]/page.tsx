import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PointCalc } from "@/components/PointCalc";
import { events, getEvent } from "@/lib/events";
import { pageMeta, site, tool, toolTitle } from "@/lib/site";

// [slug] はURLの一部を変数として受け取るフォルダ名
// （PHPの $_GET['event'] のように、/point-calc/jigoku-meguri-2026 の「jigoku-meguri-2026」が入る）

// ビルドのときに、イベントの数だけページを先に作っておく
export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

// イベントごとの title や説明文
export async function generateMetadata({ params }: PageProps<"/point-calc/[slug]">) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return {};
  return pageMeta(toolTitle(event.name), tool.description, `/point-calc/${event.slug}`);
}

// params（URLのイベント名）は、この中で初めて読む。
// ページ本体で先に待ってしまうと、共通の枠を先に出せなくなる（Next.js 16 の推奨）。
async function PointCalcForSlug({
  params,
}: Pick<PageProps<"/point-calc/[slug]">, "params">) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound(); // 無いイベントは「ページが見つかりません」にする

  // 検索エンジンやAI検索向けに「これは無料のWebツールです」と伝える情報
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `ぱずぎり ${event.name} イベントノルマ計算ツール`,
    description: tool.description,
    url: `${site.url}/point-calc/${event.slug}`,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    inLanguage: "ja",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
    publisher: { "@type": "Organization", name: site.name },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PointCalc event={event} />
    </>
  );
}

export default function PointCalcPage({ params }: PageProps<"/point-calc/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-2xl px-5 py-16 text-center text-sm text-notebook-muted">
          読み込み中…
        </div>
      }
    >
      <PointCalcForSlug params={params} />
    </Suspense>
  );
}
