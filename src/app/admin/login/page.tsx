// 管理画面のログイン画面（GitHub でログイン）
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { Notice } from "../ui";

async function LoginBody({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  if (await getAdmin()) redirect("/admin"); // もうログインしていれば管理画面へ
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm rounded-xl border border-notebook-line bg-white p-6 text-center">
      <h1 className="mb-4 text-lg font-extrabold">管理画面にログイン</h1>
      <Notice error={typeof error === "string" ? error : undefined} />
      <a href="/api/admin/auth/start" className="inline-block rounded-xl bg-[#24292f] px-5 py-3 font-bold text-white hover:opacity-90">
        GitHub でログイン
      </a>
      <p className="mt-4 text-xs text-notebook-muted">オーナーの GitHub アカウントだけ入れます。</p>
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <Suspense fallback={<p>読み込み中…</p>}>
      <LoginBody searchParams={searchParams} />
    </Suspense>
  );
}
