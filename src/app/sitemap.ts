import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// サイトのページ一覧（ページが増えたらここに足す）
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
