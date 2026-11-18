// 管理画面の共通の枠。検索エンジンには出さない（noindex）
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "管理画面｜ぱずぎり目録",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-full bg-[#f6f3ea] text-sm text-[#3b3b3b]">
      <header className="flex items-center justify-between bg-notebook-green px-4 py-3 text-white">
        <Link href="/admin" className="font-extrabold">ぱずぎり目録 管理画面</Link>
        <nav className="flex items-center gap-4 text-xs font-bold">
          <Link href="/admin" className="underline-offset-4 hover:underline">イベント</Link>
          <Link href="/admin/items" className="underline-offset-4 hover:underline">素材</Link>
          <Link href="/" className="underline-offset-4 hover:underline">サイトを見る</Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
