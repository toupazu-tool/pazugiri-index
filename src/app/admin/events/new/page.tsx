// 新しいイベントを作る（下書きで作り、報酬を入れてから公開する）
import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { createEvent } from "../../actions";
import { EventForm } from "../../EventForm";
import { Notice, buttonClass } from "../../ui";

async function NewEvent({ searchParams }: Pick<PageProps<"/admin/events/new">, "searchParams">) {
  await requireAdmin();
  const { error } = await searchParams;
  return (
    <>
      <p className="mb-2 text-xs"><Link href="/admin" className="underline">← イベント一覧</Link></p>
      <h1 className="mb-4 text-lg font-extrabold">新しいイベント</h1>
      <Notice error={typeof error === "string" ? error : undefined} />
      <form action={createEvent} className="rounded-xl border border-notebook-line bg-white p-4">
        <EventForm />
        <button className={`${buttonClass} mt-4`}>下書きで作る</button>
      </form>
    </>
  );
}

export default function NewEventPage({ searchParams }: PageProps<"/admin/events/new">) {
  return (
    <Suspense fallback={<p>読み込み中…</p>}>
      <NewEvent searchParams={searchParams} />
    </Suspense>
  );
}
