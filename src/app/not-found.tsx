import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/Button";
import { defaultOgImage, site } from "@/lib/site";

// 404ページ専用の title。検索には載せない
export const metadata: Metadata = {
  title: `ページが見つかりません｜${site.name}`,
  robots: { index: false, follow: false },
  openGraph: { images: [defaultOgImage] },
  twitter: { card: "summary_large_image", images: [defaultOgImage.url] },
};

// 存在しないURLを開いたときのページ
export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-12 text-center">
        <Image
          src="/images/404.png"
          alt="404"
          width={967}
          height={372}
          className="h-auto w-full max-w-[480px]"
          priority
        />

        <h1 className="mt-8 text-2xl font-extrabold" style={{ color: "#6b4a2b" }}>
          ページが見つかりません
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-notebook-muted">
          URLが間違っているか、ページが移動・削除された可能性があります。
        </p>

        <Button href="/" className="mt-8">
          TOPに戻る
        </Button>
      </main>

      <SiteFooter />
    </>
  );
}
