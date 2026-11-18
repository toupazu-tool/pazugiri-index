import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// 検索エンジンへの案内（管理画面と API 以外は見てOK、サイトマップはここ）
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
