import { createToolOgImage, OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE } from "@/lib/ogImage";

// イベントノルマ計算ツールの共有カード（1200×630）
export const alt = "ぱずぎり イベントノルマ計算ツール｜ぱずぎり目録";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function Image() {
  return createToolOgImage({
    title: "イベントノルマ計算ツール",
    subtitle: "欲しい報酬から1日のノルマがわかる",
  });
}
