import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/lib/site";

// このページ専用の title や説明文（layout.tsx の設定を上書きする）
export const metadata: Metadata = {
  title: `プライバシーポリシー｜${site.name}`,
  description: `${site.name}での入力内容の保存方法やアクセス解析について説明しています。`,
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy" },
};

// 見出しと本文の組み合わせ（同じ形を何度も使うので部品にする）
function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="border-b-2 border-notebook-line pb-1 text-base font-extrabold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

const linkClass = "text-notebook-green underline underline-offset-4 break-all";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 text-sm leading-relaxed">
        <article className="space-y-6 rounded-2xl border border-notebook-line bg-notebook-paper px-4 py-6 shadow-[0_4px_8px_rgba(90,70,48,0.3)] sm:p-8">
          <h1 className="text-center text-2xl font-extrabold">プライバシーポリシー</h1>
          <p>{site.name}（以下「当サイト」）での情報の扱いについて説明します。</p>

          <Item title="1. 入力内容の保存について">
            <p>
              ノルマ計算ツールに入力した内容（所持ポイント、欲しい報酬の数、プレイする日）や、絵巻守Lv計算ツールに入力した内容（今のレベル、今の経験値、目標レベル）は、お使いの端末のブラウザ（localStorage）にだけ保存されます。当サイトのサーバーには送られず、運営者が見ることもできません。
            </p>
            <p>ブラウザの閲覧データを消すと、保存した内容も消えます。</p>
          </Item>

          <Item title="2. アクセス解析ツールについて">
            <p>
              当サイトでは、利用状況を知ってサイトを改善するために、Googleが提供する「Googleアナリティクス」を使っています。Googleアナリティクスは、Cookieを使って利用状況のデータを集めます。このデータは匿名で集められ、個人を特定するものではありません。
            </p>
            <p>
              データの集め方や扱い方は、
              <a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noreferrer" className={linkClass}>Googleのポリシーと規約</a>
              をご覧ください。データを集められたくない場合は、
              <a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noreferrer" className={linkClass}>Googleアナリティクス オプトアウト アドオン</a>
              を使うか、ブラウザの設定でCookieを無効にしてください。
            </p>
          </Item>

          <Item title="3. 共有機能について">
            <p>LINEやXで共有するときは、ボタンを押したときに各サービスの画面が開きます。共有した内容は各サービスのルールに沿って扱われます。</p>
          </Item>

          <Item title="4. 免責事項">
            <p>
              当サイトは「刀剣乱舞ぱずぎり」の非公式ファンサイトで、公式とは関係ありません。計算の結果は目安です。当サイトを使ったことで起きた損害については、責任を負いかねます。
            </p>
          </Item>

          <Item title="5. 著作権について">
            <p>当サイトで使っているゲームの画像や名前の著作権は、権利者（©2026 EXNOA LLC/NITRO PLUS）にあります。</p>
          </Item>

          <Item title="6. お問い合わせ">
            <p>
              メール：<a href={`mailto:${site.email}`} className={linkClass}>{site.email}</a>
            </p>
          </Item>

          <Item title="7. 改定について">
            <p>このポリシーは、必要に応じて内容を変えることがあります。</p>
          </Item>

          <p className="text-right text-notebook-muted">制定日：2026年11月8日<br />改定日：2026年11月13日</p>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
