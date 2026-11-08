import { event } from "@/lib/event";

// サイト全体で使う共通の情報（PHPの config.php のようなもの）
export const site = {
  name: "ぱずぎり目録",
  tagline: "刀剣乱舞ぱずぎり非公式ファンサイト",
  // 独自ドメインにしたら、ここだけ書き換えればOK
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://toupazu-point-calc.vercel.app",
  // Googleアナリティクスの測定ID（公開されても問題ないID）
  gaId: "G-81QCC06BVD",
  // お問い合わせ用のメールアドレス（フォームができるまで）
  email: "toupazu.tool@gmail.com",
};

export const tool = {
  title: "ぱずぎり イベントノルマ計算ツール",
  description:
    "刀剣乱舞ぱずぎりのイベント交換所で欲しい報酬を選ぶと、必要なポイントと1日あたりのノルマが分かる非公式ツールです。",
};

// 検索結果やタブに出るタイトル。イベント名はイベントデータから自動で入る
export const seoTitle = `ぱずぎり ${event.name} イベントノルマ計算ツール｜${site.name}`;
