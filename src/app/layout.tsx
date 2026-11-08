import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

// 丸ゴシックのフォントを読み込む
const rounded = M_PLUS_Rounded_1c({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  variable: "--font-rounded",
  preload: false, // 日本語フォントは大きいので、先読みしない
});

export const metadata: Metadata = {
  title: "ぱずぎり イベントノルマ・ポイント計算ツール｜とうぱず目録",
  description:
    "刀剣乱舞ぱずぎりのイベント交換所で欲しい報酬を選ぶと、必要なポイントと1日あたりのノルマが分かる非公式ツールです。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${rounded.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}