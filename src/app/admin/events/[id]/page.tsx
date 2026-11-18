// イベントの編集：基本の情報、公開・下書きの切り替え、報酬の足す・直す・消す
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getEvent, listItems, listRewards, type AdminItem } from "@/lib/adminData";
import { addReward, deleteReward, setEventStatus, updateEvent, updateReward } from "../../actions";
import { EventForm } from "../../EventForm";
import { KIND_LABELS, Notice, buttonClass, dangerButtonClass, inputClass, subButtonClass } from "../../ui";

function ItemSelect({ items, value }: { items: AdminItem[]; value?: string }) {
  return (
    <select name="item_id" required defaultValue={value ?? ""} className={inputClass}>
      <option value="" disabled>素材を選ぶ</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}（{KIND_LABELS[item.kind] ?? item.kind}）{item.is_active ? "" : "［使わない］"}
        </option>
      ))}
    </select>
  );
}

async function EditEvent({ params, searchParams }: PageProps<"/admin/events/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { msg, error } = await searchParams;
  const event = await getEvent(id);
  if (!event) notFound();
  const [rewards, items] = await Promise.all([listRewards(id), listItems()]);
  const isExchange = event.event_type === "exchange";
  const pointsLabel = isExchange ? `必要${event.point_unit}（1回）` : `到達${event.point_unit}`;

  return (
    <>
      <p className="mb-2 text-xs"><Link href="/admin" className="underline">← イベント一覧</Link></p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-extrabold">{event.name}</h1>
        <div className="flex items-center gap-2">
          {event.status === "published" && (
            <a href={`/point-calc/${event.slug}`} target="_blank" rel="noreferrer" className={subButtonClass}>サイトで見る</a>
          )}
          <form action={setEventStatus}>
            <input type="hidden" name="id" value={event.id} />
            <input type="hidden" name="status" value={event.status === "published" ? "draft" : "published"} />
            <button className={event.status === "published" ? subButtonClass : buttonClass}>
              {event.status === "published" ? "下書きに戻す" : "公開する"}
            </button>
          </form>
        </div>
      </div>
      <Notice msg={typeof msg === "string" ? msg : undefined} error={typeof error === "string" ? error : undefined} />
      <p className="mb-4 text-xs text-notebook-muted">
        今の状態：<b>{event.status === "published" ? "公開（サイトに出ています）" : "下書き（サイトには出ません）"}</b>
      </p>

      <section className="mb-6 rounded-xl border border-notebook-line bg-white p-4">
        <h2 className="mb-3 font-extrabold">基本の情報</h2>
        <form action={updateEvent}>
          <input type="hidden" name="id" value={event.id} />
          <EventForm event={event} />
          <button className={`${buttonClass} mt-4`}>保存する</button>
        </form>
      </section>

      <section className="rounded-xl border border-notebook-line bg-white p-4">
        <h2 className="mb-1 font-extrabold">報酬（{rewards.length}件）</h2>
        <p className="mb-3 text-xs text-notebook-muted">
          画面の名前は「素材名＋×数」で自動で作ります。上限を空にすると上限なし。画像を空にすると素材の画像を使います。並び順の小さい順に並びます。
          素材が一覧にないときは <Link href="/admin/items" className="underline">素材</Link> で足してください。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-notebook-beige">
              <tr>
                <th className="px-2 py-2 w-16">並び順</th>
                <th className="px-2 py-2">素材</th>
                <th className="px-2 py-2 w-24">数</th>
                <th className="px-2 py-2 w-28">{pointsLabel}</th>
                {isExchange && <th className="px-2 py-2 w-20">上限</th>}
                <th className="px-2 py-2">画像（この報酬だけ）</th>
                <th className="px-2 py-2 w-36"></th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r) => (
                <tr key={r.id} className="border-t border-notebook-line align-top">
                  <td colSpan={isExchange ? 7 : 6} className="p-0">
                    <form action={updateReward} className="flex items-start">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="event_id" value={event.id} />
                      <div className="w-16 shrink-0 px-2 py-1"><input name="sort_order" type="number" defaultValue={r.sort_order} className={inputClass} /></div>
                      <div className="flex-1 px-2 py-1">
                        <ItemSelect items={items} value={r.item_id} />
                        {(r.icon_url ?? r.item_icon_url) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.icon_url ?? r.item_icon_url ?? ""} alt="" className="mt-1 size-8" />
                        )}
                      </div>
                      <div className="w-24 shrink-0 px-2 py-1"><input name="quantity" type="number" min={1} defaultValue={r.quantity} className={inputClass} /></div>
                      <div className="w-28 shrink-0 px-2 py-1"><input name="points" type="number" min={0} required defaultValue={(isExchange ? r.cost_points : r.required_points) ?? ""} className={inputClass} /></div>
                      {isExchange && <div className="w-20 shrink-0 px-2 py-1"><input name="max_count" type="number" min={0} defaultValue={r.max_count ?? ""} className={inputClass} /></div>}
                      <div className="flex-1 px-2 py-1"><input name="icon_url" defaultValue={r.icon_url ?? ""} placeholder="/rewards/icons/◯◯.svg" className={inputClass} /></div>
                      <div className="flex w-36 shrink-0 gap-1 px-2 py-1">
                        <button className={subButtonClass}>直す</button>
                        <button formAction={deleteReward} className={dangerButtonClass}>消す</button>
                      </div>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mb-2 mt-5 text-sm font-extrabold">報酬を足す</h3>
        <form action={addReward} className="flex flex-wrap items-end gap-2 rounded-lg bg-notebook-beige p-3">
          <input type="hidden" name="event_id" value={event.id} />
          <label className="w-56 text-xs font-bold">素材<ItemSelect items={items} /></label>
          <label className="w-24 text-xs font-bold">数<input name="quantity" type="number" min={1} defaultValue={1} className={inputClass} /></label>
          <label className="w-28 text-xs font-bold">{pointsLabel}<input name="points" type="number" min={0} required className={inputClass} /></label>
          {isExchange && <label className="w-20 text-xs font-bold">上限<input name="max_count" type="number" min={0} className={inputClass} /></label>}
          <label className="w-48 text-xs font-bold">画像（任意）<input name="icon_url" placeholder="/rewards/icons/◯◯.svg" className={inputClass} /></label>
          <label className="w-20 text-xs font-bold">並び順<input name="sort_order" type="number" placeholder="最後" className={inputClass} /></label>
          <button className={buttonClass}>足す</button>
        </form>
      </section>
    </>
  );
}

export default function EditEventPage(props: PageProps<"/admin/events/[id]">) {
  return (
    <Suspense fallback={<p>読み込み中…</p>}>
      <EditEvent {...props} />
    </Suspense>
  );
}
