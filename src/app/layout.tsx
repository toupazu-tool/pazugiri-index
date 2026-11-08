import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { pageMeta, site } from "@/lib/site";
import "./globals.css";

// 丸ゴシック体のフォントを読み込む
const rounded = M_PLUS_Rounded_1c({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  variable: "--font-rounded",
  preload: false, // 日本語フォントは大きいので、先読みしない
});

// サイト全体の基本の title や meta タグ（各ページで上書きできる）
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  ...pageMeta(`${site.name}｜${site.tagline}`, site.description, "/"),
};

// 検索エンジンやAI検索向けに「このサイトの名前」を伝える情報（構造化データ）
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  description: site.description,
  url: site.url,
  inLanguage: "ja",
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
