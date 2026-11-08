import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { seoTitle, site, tool } from "@/lib/site";
import "./globals.css";

// 丸ゴシックのフォントを読み込む
const rounded = M_PLUS_Rounded_1c({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  variable: "--font-rounded",
  preload: false, // 日本語フォントは大きいので、先読みしない
});

// 検索結果や共有カードに出る情報（PHPで <head> に書いていた meta タグをまとめて作ってくれる）
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: seoTitle,
  description: tool.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: seoTitle,
    description: tool.description,
    url: "/",
    siteName: site.name,
    locale: "ja_JP",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

// AI検索や検索エンジン向けに「これは無料のWebツールです」と伝える情報（構造化データ）
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: tool.title,
  description: tool.description,
  url: site.url,
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  inLanguage: "ja",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  publisher: { "@type": "Organization", name: site.name },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${rounded.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
      {/* アクセス解析。本番サイトだけで動かす（確認用URLやPCでの確認は数えない） */}
      {process.env.VERCEL_ENV === "production" && <GoogleAnalytics gaId={site.gaId} />}
    </html>
  );
}
