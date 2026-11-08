import type { MetadataRoute } from "next";
import { events } from "@/lib/events";
import { site } from "@/lib/site";

// サイトのページ一覧（イベントは events.ts から自動で足される）
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/point-calc`, changeFrequency: "weekly", priority: 0.8 },
    ...events.map((event) => ({ url: `${site.url}/point-calc/${event.slug}`, changeFrequency: "daily" as const, priority: 0.9 })),
    { url: `${site.url}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
