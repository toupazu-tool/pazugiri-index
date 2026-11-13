import { EmakiLevelCalc } from "@/components/EmakiLevelCalc";
import { emakiTool, pageMeta, site } from "@/lib/site";

export const metadata = pageMeta(`${emakiTool.title}｜${site.name}`, emakiTool.description, "/emaki-level");

export default function EmakiLevelPage() {
  // 検索エンジンやAI検索向けに「これは無料のWebツールです」と伝える情報
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: emakiTool.title,
    description: emakiTool.description,
    url: `${site.url}/emaki-level`,
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
      <EmakiLevelCalc />
    </>
  );
}
