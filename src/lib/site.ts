import type { Metadata } from "next";

// サイト全体で使う共通の情報（PHPの config.php のようなもの）
export const site = {
  name: "ぱずぎり目録",
  tagline: "刀剣乱舞ぱずぎり非公式ファンサイト",
  description: "刀剣乱舞ぱずぎりの非公式ファンサイトです。ツールなど、楽しく遊ぶためのコンテンツをまとめています。",
  // 独自ドメイン。環境変数があればそちらを優先する
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pazugiri-index.com",
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

export const emakiTool = {
  title: "絵巻守Lv 経験値計算",
  description:
    "刀剣乱舞ぱずぎりの絵巻守レベルについて、今の経験値から次のレベルや目標レベルまでの残りが分かる非公式ツールです。",
};

// イベントごとの計算ツールのタイトル。イベント名はイベントデータから自動で入る
export function toolTitle(eventName: string) {
  return `ぱずぎり ${eventName} イベントノルマ計算ツール｜${site.name}`;
}

// ページごとの title・説明文・共有カードの情報をまとめて作る
// （PHPで、ページごとに <title> と meta タグを出す関数を作るイメージ）
export function pageMeta(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: site.name, locale: "ja_JP", type: "website" },
    twitter: { card: "summary_large_image" },
  };
}
