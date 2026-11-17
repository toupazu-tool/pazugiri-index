import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PointCalc } from "@/components/PointCalc";
import { getEventBySlug, getEvents } from "@/lib/eventSource";
import { OG_IMAGE_SIZE } from "@/lib/ogImage";
import { sharedQuery } from "@/lib/sharedResult";
import { pageMeta, site, tool, toolTitle } from "@/lib/site";

// [slug] はURLの一部を変数として受け取るフォルダ名
// （PHPの $_GET['event'] のように、/point-calc/jigoku-meguri-2026 の「jigoku-meguri-2026」が入る）

// ビルドのときに、イベントの数だけページを先に作っておく
export async function generateStaticParams() {
  return (await getEvents()).map((event) => ({ slug: event.slug }));
}

// イベントごとの title や説明文
// 共有URL（結果入り）で開かれたときは、共有カードをその人の結果入りの画像にする（X や LINE に貼ったとき用）
export async function generateMetadata({ params, searchParams }: PageProps<"/point-calc/[slug]">) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  const meta = pageMeta(toolTitle(event.name), tool.description, `/point-calc/${event.slug}`);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const shared = sharedQuery(event, query);
  if (!shared) return meta; // 普通のURLは今までどおり、イベントページ共通のカード（opengraph-image）
  const image = { url: `/point-calc/${event.slug}/share-image?${shared}`, ...OG_IMAGE_SIZE, alt: `${event.name}のノルマ` };
  return {
    ...meta,
    openGraph: { ...meta.openGraph, images: [image] },
    twitter: { card: "summary_large_image" as const, images: [image.url] },
  };
}

// 上の generateMetadata は URL のパラメータ（開いた人ごとに違う）を読むので、
// 「ここは開いたときに作る部分がある」と Next.js に知らせる目印（ページの本体は前もって作ったまま）
async function Connection() {
  await connection();
  return null;
}

// params（URLのイベント名）は、この中で初めて読む。
// ページ本体で先に待ってしまうと、共通の枠を先に出せなくなる（Next.js 16 の推奨）。
async function PointCalcForSlug({
  params,
}: Pick<PageProps<"/point-calc/[slug]">, "params">) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
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
      <Suspense>
        <Connection />
      </Suspense>
    </Suspense>
  );
}
