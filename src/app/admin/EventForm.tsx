// イベントの入力欄（新規作成と編集で共通）
import type { AdminEvent } from "@/lib/adminData";
import { Field, inputClass } from "./ui";

export function EventForm({ event }: { event?: AdminEvent }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="イベント名">
        <input name="name" required defaultValue={event?.name} className={inputClass} placeholder="BIGト餓鬼討伐大作戦！（2026年11月）" />
      </Field>
      <Field label="URL 用の名前" hint="英小文字・数字・ハイフン（例：big-togaki-2026-11）">
        <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={event?.slug} className={inputClass} />
      </Field>
      <Field label="形" hint={event && event.reward_count > 0 ? "報酬が入っているので変えられません" : undefined}>
        <select name="event_type" defaultValue={event?.event_type ?? "milestone"} className={inputClass}>
          <option value="exchange">交換所型（ポイントで交換）</option>
          <option value="milestone">到達型（ためた数でもらえる）</option>
        </select>
      </Field>
      <Field label="種類（ラベル）">
        <input name="category" required defaultValue={event?.category} className={inputClass} placeholder="大討伐／シナリオイベント" />
      </Field>
      <Field label="開始（日本時間）">
        <input type="datetime-local" name="start_at" required defaultValue={event?.start_at} className={inputClass} />
      </Field>
      <Field label="終了（日本時間）" hint="12:59 まで遊べるなら 13:00 を入れる">
        <input type="datetime-local" name="end_at" required defaultValue={event?.end_at} className={inputClass} />
      </Field>
      <Field label="交換・受け取り期限（日本時間）" hint="交換所型は必須。到達型はわかれば">
        <input type="datetime-local" name="reward_end_at" defaultValue={event?.reward_end_at ?? ""} className={inputClass} />
      </Field>
      <Field label="単位">
        <input name="point_unit" defaultValue={event?.point_unit ?? "pt"} className={inputClass} placeholder="pt／体" />
      </Field>
      <Field label="お知らせの URL（公式Xなど）">
        <input name="source_url" type="url" defaultValue={event?.source_url ?? ""} className={inputClass} />
      </Field>
      <Field label="トップの表示">
        <select name="top_display" defaultValue={event?.top_display ?? "auto"} className={inputClass}>
          <option value="auto">自動（開催中・交換期間中に出す）</option>
          <option value="show">いつも出す</option>
          <option value="hide">出さない</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" name="listed" defaultChecked={event?.listed ?? true} className="size-4" />
        イベント一覧に出す
      </label>
    </div>
  );
}
