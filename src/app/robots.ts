import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// 検索エンジンへの案内（全部見てOK、サイトマップはここ）
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
