// 結果入りの共有カード画像（1200×630）
// /point-calc/地獄めぐりのslug/share-image?current=…&counts=…&days=… を開くと、その人のノルマを描いた PNG を返す
// （PHP でいう、GD で画像を作って header('Content-Type: image/png') で返すファイル）
import { getEventBySlug } from "@/lib/eventSource";
import { createResultOgImage } from "@/lib/ogImage";
import { calcSharedResult } from "@/lib/sharedResult";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return new Response("Not Found", { status: 404 });
  const query = new URL(request.url).searchParams;
  const image = await createResultOgImage(calcSharedResult(event, query));
  // 同じ URL なら結果も同じなので、1日はブラウザや Vercel に覚えておいてもらう
  image.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return image;
}
