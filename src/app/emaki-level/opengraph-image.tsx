import { createToolOgImage, OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE } from "@/lib/ogImage";

// 絵巻守ページの共有カード（1200×630）
export const alt = "ぱずぎり 絵巻守Lv早見表｜ぱずぎり目録";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function Image() {
  return createToolOgImage({
    title: "絵巻守Lv早見表",
    subtitle: "絵巻守Lvの経験値表と次のLvまでの残りがわかる",
  });
}
