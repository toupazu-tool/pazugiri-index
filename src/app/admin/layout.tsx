// 管理画面の共通の枠。検索エンジンには出さない（noindex）
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/lib/adminAuth";

export const metadata: Metadata = {
  title: "管理画面｜ぱずぎり目録",
  robots: { index: false, follow: false },
};

// 右上のメニュー。ログインしている人にだけ出す（ログイン画面では出さない）
async function AdminNav() {
  const admin = await getAdmin();
  if (!admin) return null;
  return (
    <nav className="flex items-center gap-4 text-xs font-bold">
      <Link href="/admin" className="underline-offset-4 hover:underline">イベント</Link>
      <Link href="/admin/items" className="underline-offset-4 hover:underline">素材</Link>
      <Link href="/" className="underline-offset-4 hover:underline">サイトを見る</Link>
      <form action="/api/admin/auth/logout" method="post">
        <button className="underline-offset-4 hover:underline">ログアウト</button>
      </form>
    </nav>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-full bg-[#f6f3ea] text-sm text-[#3b3b3b]">
      <header className="flex min-h-12 items-center justify-between bg-notebook-green px-4 py-3 text-white">
        <span className="font-extrabold">ぱずぎり目録 管理画面</span>
        <Suspense fallback={null}>
          <AdminNav />
        </Suspense>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
