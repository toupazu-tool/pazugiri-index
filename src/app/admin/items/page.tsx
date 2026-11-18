// 素材の一覧：足す・直す（素材は消さずに「使わない」にする）
import { Suspense } from "react";
import { requireAdmin } from "@/lib/adminAuth";
import { listItems } from "@/lib/adminData";
import { createItem, updateItem } from "../actions";
import { KIND_LABELS, Notice, buttonClass, inputClass, subButtonClass } from "../ui";

function KindSelect({ value }: { value?: string }) {
  return (
    <select name="kind" defaultValue={value ?? "material"} className={inputClass}>
      {Object.entries(KIND_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  );
}

async function Items({ searchParams }: Pick<PageProps<"/admin/items">, "searchParams">) {
  await requireAdmin();
  const { msg, error } = await searchParams;
  const items = await listItems();
  return (
    <>
      <h1 className="mb-4 text-lg font-extrabold">素材（{items.length}種類）</h1>
      <Notice msg={typeof msg === "string" ? msg : undefined} error={typeof error === "string" ? error : undefined} />

      <form action={createItem} className="mb-6 flex flex-wrap items-end gap-2 rounded-xl border border-notebook-line bg-white p-4">
        <input type="hidden" name="back_to" value="/admin/items" />
        <label className="w-56 text-xs font-bold">名前<input name="name" required className={inputClass} /></label>
        <label className="w-32 text-xs font-bold">種類<KindSelect /></label>
        <label className="w-64 text-xs font-bold">画像<input name="icon_url" placeholder="/rewards/icons/◯◯.svg" className={inputClass} /></label>
        <button className={buttonClass}>素材を足す</button>
      </form>

      <div className="space-y-1">
        {items.map((item) => (
          <form key={item.id} action={updateItem} className="flex flex-wrap items-center gap-2 rounded-lg border border-notebook-line bg-white px-3 py-2">
            <input type="hidden" name="id" value={item.id} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {item.icon_url ? <img src={item.icon_url} alt="" className="size-8" /> : <span className="grid size-8 place-items-center rounded-full bg-notebook-beige text-[10px]">なし</span>}
            <input name="name" defaultValue={item.name} required className={`${inputClass} w-56`} />
            <div className="w-28"><KindSelect value={item.kind} /></div>
            <input name="icon_url" defaultValue={item.icon_url ?? ""} placeholder="/rewards/icons/◯◯.svg" className={`${inputClass} w-64`} />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="is_active" defaultChecked={item.is_active} />使う</label>
            <button className={subButtonClass}>直す</button>
          </form>
        ))}
      </div>
    </>
  );
}

export default function ItemsPage({ searchParams }: PageProps<"/admin/items">) {
  return (
    <Suspense fallback={<p>読み込み中…</p>}>
      <Items searchParams={searchParams} />
    </Suspense>
  );
}
