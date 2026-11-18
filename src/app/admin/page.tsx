// 管理画面のトップ：イベントの一覧
import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { listEvents } from "@/lib/adminData";
import { Notice, buttonClass } from "./ui";

async function EventList({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const admin = await requireAdmin();
  const { msg, error } = await searchParams;
  const events = await listEvents();
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-extrabold">イベント</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-notebook-muted">ログイン中：{admin}</span>
          <Link href="/admin/events/new" className={buttonClass}>＋ 新しいイベント</Link>
        </div>
      </div>
      <Notice msg={typeof msg === "string" ? msg : undefined} error={typeof error === "string" ? error : undefined} />
      <div className="overflow-x-auto rounded-xl border border-notebook-line bg-white">
        <table className="w-full text-left">
          <thead className="bg-notebook-beige text-xs">
            <tr>
              <th className="px-3 py-2">状態</th>
              <th className="px-3 py-2">イベント名</th>
              <th className="px-3 py-2">形</th>
              <th className="px-3 py-2">期間（日本時間）</th>
              <th className="px-3 py-2 text-right">報酬</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-notebook-line">
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${e.status === "published" ? "bg-notebook-green text-white" : "bg-notebook-beige text-notebook-muted"}`}>
                    {e.status === "published" ? "公開" : "下書き"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/events/${e.id}`} className="font-bold text-notebook-green underline-offset-4 hover:underline">{e.name}</Link>
                  <span className="block text-xs text-notebook-muted">{e.slug}</span>
                </td>
                <td className="px-3 py-2 text-xs">{e.event_type === "exchange" ? "交換所型" : "到達型"}（{e.point_unit}）</td>
                <td className="px-3 py-2 text-xs">{e.start_at.replace("T", " ")} 〜 {e.end_at.replace("T", " ")}</td>
                <td className="px-3 py-2 text-right">{e.reward_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminHome({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p>読み込み中…</p>}>
      <EventList searchParams={searchParams} />
    </Suspense>
  );
}
