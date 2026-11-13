import { createSiteOgImage, OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE } from "@/lib/ogImage";

// トップページの共有カード（1200×630）。サイト全体を表す
export const alt = "ぱずぎり目録｜刀剣乱舞ぱずぎり非公式ファンサイト";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function Image() {
  return createSiteOgImage({
    title: "ぱずぎり目録",
    subtitle: "刀剣乱舞ぱずぎりの非公式ファンサイト",
    toolsLine: "ツールなど、楽しく遊ぶコンテンツまとめ",
  });
}
