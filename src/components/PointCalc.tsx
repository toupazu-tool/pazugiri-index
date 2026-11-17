"use client";

import { useState, useEffect } from "react";
import { useNow } from "@/lib/useNow";
import Image from "next/image";
import { calcDailyQuota, calcRemainingDays, calcSchedule } from "@/lib/quota";
import { listEventDates } from "@/lib/sharedResult";
import { rewardTemplates } from "@/components/rewards";
import { renderScheduleTablePngBlob, saveScheduleImage, scheduleImageFilename } from "@/lib/scheduleTableImage";
import { unitOf, type EventData } from "@/lib/events";
import { formatEnd, formatPeriodParts } from "@/lib/dateFormat";
import { site } from "@/lib/site";
import { sendGAEvent } from "@next/third-parties/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";


//カテゴリごとのラベルの色（PHPの連想配列と同じ。増やすときはここに1行足す）
const categoryColors: Record<string, { label: string; frame: string }> = {
  シナリオイベント: { label: "bg-notebook-green text-white", frame: "border-notebook-green" },
  大討伐: { label: "bg-notebook-red text-white", frame: "border-notebook-red" },
};

// 日本時間の日付を「2026-11-13」の形で出す（PHPの date('Y-m-d') に近い）
const toTokyoDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(date);


// 計算ツール本体。どのイベントかは event で受け取る（PHPで関数に引数を渡すのと同じ）
export function PointCalc({ event }: { event: EventData }) {
//報酬の画面テンプレート（イベントの形で切り替える。src/components/rewards/index.ts）
const template = rewardTemplates[event.type];
//ポイントの単位（大討伐は「体」など）
const unit = unitOf(event);
//入力内容をブラウザに保存するときの名前（イベントごとに分ける）
const STORAGE_KEY = `toupazu-point-calc:${event.slug}`;
const eventDays = listEventDates(event.start, event.end).map((date) => ({
  date,
  playable: true,
}));
const [days, setDays] = useState(eventDays);
const [loaded, setLoaded] = useState(false); // 保存データを読み終わったか
const [currentPoints, setCurrentPoints] = useState(0);
//報酬の選んだ内容（共有URLと同じ文字の形。中身はテンプレートが決める）
const [selection, setSelection] = useState(() => template.normalize(null, event));
const now = useNow();
const today = now ? toTokyoDate(now) : "";
const [imageBusy, setImageBusy] = useState(false); // 画像を作っている途中
const [imageHint, setImageHint] = useState(""); // 画像が作れなかったときのお知らせ
const [shareBusy, setShareBusy] = useState(false); // 画像つき共有の準備中
const [shareHint, setShareHint] = useState(""); // 画像つき共有のお知らせ

useEffect(() => {
  /* eslint-disable react-hooks/set-state-in-effect */
  // URLやlocalStorageの値を画面に反映する処理。サーバーでは window も保存データもないので、表示後に一度読み込む必要がある
  const todayStr = toTokyoDate(new Date());

  const params = new URLSearchParams(window.location.search);
  //共有URLに値があればURLを優先。なければ前回ブラウザに保存した内容を使う（PHPの $_GET → $_COOKIE の順に見るイメージ）
  const hasUrl = params.has("current") || params.has(template.paramName) || params.has("days");
  let saved: Record<string, string> = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    saved = {};
  }
  const pick = (name: string) => (hasUrl ? params.get(name) : saved[name] ?? null);

  const current = pick("current");
  if (current) {
    const n = Number(current);
    if (Number.isFinite(n)) setCurrentPoints(Math.max(0, n));
  }

  //報酬の選んだ内容は、テンプレートが正しい形にそろえる
  const selectionParam = pick(template.paramName);
  if (selectionParam) setSelection(template.normalize(selectionParam, event));

  const daysParam = pick("days");
  //URLに指定がなければ、今日から後の日だけを選んだ状態にする
  setDays((prev) =>
    prev.map((day, i) => ({
      ...day,
      playable: daysParam ? daysParam[i] === "1" : day.date >= todayStr,
    }))
  );
  if (window.location.hash === "#schedule") {
    setTimeout(() => {
      document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }
  setLoaded(true);
  /* eslint-enable react-hooks/set-state-in-effect */
}, [STORAGE_KEY, event, template]);

//入力が変わるたびにブラウザへ保存（読み込みが終わる前は保存しない）
useEffect(() => {
  if (!loaded) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        current: String(currentPoints),
        [template.paramName]: selection,
        days: days.map((day) => (day.playable ? "1" : "0")).join(""),
      })
    );
  } catch {
    // プライベートモードなどで保存できないときは、入力の復元を諦める
  }
}, [loaded, currentPoints, selection, days, STORAGE_KEY, template]);

//テンプレートから受け取る目標（あとで足すグラフもこれを使う）
const rewardTarget = template.calcTarget(selection, event);
const requiredTotal = rewardTarget.requiredTotal;
const remainingDays = calcRemainingDays(days);
const dailyQuota = calcDailyQuota(requiredTotal, currentPoints, remainingDays);

//イベントの状態を取得
const start = new Date(event.start);
const end = new Date(event.end);
let status = "";
if (!now) {
  status = "";             // まだ時刻がないときは空
} else if (now < start) {
  status = "開催前";
} else if (now > end) {
  status = "終了";
} else {
  const diff = end.getTime() - now.getTime(); // 残りミリ秒
  const dayMs = 1000 * 60 * 60 * 24;
  const hourMs = 1000 * 60 * 60;
  const leftDays = Math.floor(diff / dayMs);
  const leftHours = Math.floor((diff % dayMs) / hourMs);
  status = `開催中（残り${leftDays}日${leftHours}時間）`;
}

//日ごとの予定（計算は quota.ts の calcSchedule）
const rest = Math.max(requiredTotal - currentPoints, 0);
const schedule = calcSchedule(days, currentPoints, requiredTotal);

//共有テキスト
const lastSchedule = schedule.findLast((day) => day.target > 0);
const firstSchedule = schedule.find((day) => day.target > 0);
const firstDayText = dailyQuota > 0 && days[0].playable && firstSchedule?.target !== dailyQuota
  ? `初日：${firstSchedule?.target.toLocaleString()}${unit}`
  : "";
const lastDayText = dailyQuota > 0 && lastSchedule?.target !== dailyQuota
  ? `最終日：${lastSchedule?.target.toLocaleString()}${unit}`
  : "";

const formatDate = (date: string) => {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
};
const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
// "2026-11-08" → "日"（日本時間の正午で曜日を出すので、ずれない）
const weekdayOf = (date: string) => weekdays[new Date(`${date}T12:00:00+09:00`).getDay()];
//期限（交換所型は交換期限、到達型は受け取り期限。表示用の文字と、イベント後の残り日数）
const exchangeEndIso = event.type === "exchange" ? event.exchangeEnd : event.rewardEnd ?? null;
const deadlineLabel = event.type === "exchange" ? "交換" : "受け取り";
const exchangeEnd = exchangeEndIso ? new Date(exchangeEndIso) : null;
// 期限の日時は共通の書き方（src/lib/dateFormat.ts。13:00終了は12:59と書く）
const exchangeWhen = exchangeEndIso ? formatEnd(exchangeEndIso) : "";
const exchangeText = exchangeEndIso ? `${deadlineLabel}は${exchangeWhen}まで` : "";
let exchangeStatus = ""; // イベント後だけ使う：交換期間中 / 交換終了
let exchangeLeftDays = 0;
if (exchangeEnd && now && now > end) {
  if (now < exchangeEnd) {
    exchangeStatus = "交換期間中";
    exchangeLeftDays = Math.ceil((exchangeEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    exchangeStatus = "交換終了";
  }
}

const shareText = dailyQuota === 0
  ? template.doneMessage
  : [
    `選んだ日数：${remainingDays}日`,
    `現在ポイント：${currentPoints.toLocaleString()}${unit}`,
    `残り${rest.toLocaleString()}${unit}`,
    `1日の目安：${dailyQuota.toLocaleString()}${unit}`,
    firstDayText,
    lastDayText,
  ].filter((line) => line !== "").join("\n");

//共有リンク
const params = new URLSearchParams({
  current: String(currentPoints),
  [template.paramName]: selection,
  days: days.map((day) => day.playable ? "1" : "0").join(""),
});
const shareUrl = `${site.url}/point-calc/${event.slug}?${params}#schedule`;
const fullShareText = `ぱずぎりイベント【${event.name}】\n${shareText}\n▼表で確認する\n${shareUrl}`;

//日ごとの予定を画像にして保存する（画面の予定表と同じ中身。サーバーには送らない）
const startHour = Number(event.start.slice(11, 13));
const endHour = Number(event.end.slice(11, 13));
// 予定表の画像を作る（保存と「画像つきで共有」の両方で使う）
const makeScheduleImage = () =>
  renderScheduleTablePngBlob({
      eventName: event.name,
      quota: dailyQuota === 0 ? "達成済み" : `${dailyQuota.toLocaleString()}${unit}`,
      goal: rewardTarget.goalLabel,
      summary: [
        { label: "現在ポイント", value: `${currentPoints.toLocaleString()}${unit}` },
        { label: "必要ポイント", value: `${requiredTotal.toLocaleString()}${unit}` },
        { label: "残りポイント", value: `${rest.toLocaleString()}${unit}` },
        { label: "残り日数", value: `${remainingDays}日` },
      ],
      rows: schedule.map((day, i) => ({
        date: `${formatDate(day.date)}（${weekdayOf(day.date)}）`,
        note: i === 0 ? `${startHour}時開始` : i === schedule.length - 1 ? `${endHour}時終了` : undefined,
        target: `${day.target.toLocaleString()}${unit}`,
        cumulative: `${day.cumulative.toLocaleString()}${unit}`,
        highlight: day.date === today,
      })),
    });

const handleSaveScheduleImage = async () => {
  if (imageBusy) return;
  setImageBusy(true);
  setImageHint("");
  try {
    const blob = await makeScheduleImage();
    await saveScheduleImage(blob, scheduleImageFilename(event.slug));
    sendGAEvent("event", "share", { method: "image_save" });
  } catch {
    setImageHint("画像を作れませんでした。もう一度試してみてください。");
  } finally {
    setImageBusy(false);
  }
};

//「画像つきで共有」：スマホの共有メニューで、予定表の画像と共有テキスト（結果入りのリンク）を一緒に渡す
// 共有メニューで画像を渡せない端末（パソコンなど）では、画像を保存して、共有テキストをコピーする
const handleShareImage = async () => {
  if (shareBusy) return;
  setShareBusy(true);
  setShareHint("");
  try {
    const blob = await makeScheduleImage();
    const file = new File([blob], scheduleImageFilename(event.slug), { type: "image/png" });
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file], text: fullShareText })) {
      try {
        await navigator.share({ files: [file], text: fullShareText });
        sendGAEvent("event", "share", { method: "image_share" });
      } catch (error) {
        // 共有メニューを閉じただけ（AbortError）なら何もしない
        if (!(error instanceof Error && error.name === "AbortError")) throw error;
      }
      return;
    }
    await saveScheduleImage(blob, scheduleImageFilename(event.slug));
    await navigator.clipboard?.writeText(fullShareText);
    setShareHint("画像を保存し、共有する文章をコピーしました。X や LINE に画像を付けて、文章を貼り付けてください。");
    sendGAEvent("event", "share", { method: "image_share_fallback" });
  } catch {
    setShareHint("共有できませんでした。もう一度試すか、下のボタンで文章だけ共有してください。");
  } finally {
    setShareBusy(false);
  }
};

return (
  <>
    <SiteHeader />

    <main className="mx-auto w-full max-w-2xl space-y-5 px-5 pb-8 text-sm leading-relaxed">
      {/* イベント終了後だけ出す、交換期限のお知らせ */}
      {exchangeStatus === "交換期間中" && (
        <p role="alert" className="mt-5 rounded-sm border-2 border-notebook-red bg-notebook-red px-4 py-3 text-center text-base font-extrabold text-white">
          イベントは終了しました。<br />
          {deadlineLabel}はあと{exchangeLeftDays}日（{exchangeWhen}まで）
        </p>
      )}
      {exchangeStatus === "交換終了" && (
        <p className="mt-5 rounded-sm border border-notebook-line bg-notebook-beige px-4 py-3 text-center text-base font-bold text-notebook-muted">
          このイベントの{deadlineLabel}期間は終了しました。
        </p>
      )}
      <div className="px-1 pt-6 pb-1">
        {/* キャラアイコン（public/to-top.svg）。スマホは上、PCは横 */}
        <h1 className="mt-2 flex flex-col items-center justify-center gap-2 text-center text-2xl sm:flex-row sm:gap-3 leading-relaxed font-extrabold">
          <Image src="/to-top.svg" alt="" width={178} height={158} className="h-12 w-auto shrink-0" unoptimized />
          <span>ぱずぎり<br className="sm:hidden" /> イベントノルマ計算ツール</span>
        </h1>
        {/* 入力内容の保存についてのお知らせ */}
        <p className="mt-3 text-center text-xs text-notebook-muted">入力内容は、お使いの端末のブラウザにだけ保存されます。</p>
      </div>

      {/* 帳面の各枠：背景・罫線・余白はここで調整できます */}
      <section className={`rounded-2xl shadow-[0_4px_8px_rgba(90,70,48,0.3)] border-4 bg-notebook-paper px-3 py-5 sm:p-5 ${categoryColors[event.category]?.frame ?? "border-notebook-line"}`}>
        <p className={`inline-block rounded-sm px-2 py-1 text-xs font-bold ${categoryColors[event.category]?.label ?? "bg-notebook-beige text-notebook-muted"}`}>{event.category}</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-widest">{event.name}</h2>
        <p className="mt-1 text-xs text-notebook-muted">
          {formatPeriodParts(event.start, event.end).map((part) => <span key={part} className="inline-block">{part}</span>)}
        </p>
        {status && <p className="mt-3 inline-block -rotate-2 rounded-sm border border-notebook-red px-2 py-1 text-xs font-bold text-notebook-red">{status}</p>}
        {exchangeText && <p className="mt-3 text-sm font-extrabold text-notebook-red">⚠ {exchangeText}</p>}
      </section>

      <section className="rounded-2xl shadow-[0_4px_8px_rgba(90,70,48,0.3)] border border-notebook-line bg-notebook-paper px-3 py-5 sm:p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-notebook-line pb-3">
          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-blue text-xs font-bold text-white">01</span>
          <h2 className="text-base font-extrabold"><label htmlFor="current-points">現在のポイント</label></h2>
        </div>
        <div className="flex items-center gap-3 rounded-sm border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-brand-blue">
          <input
            id="current-points"
            type="number"
            inputMode="numeric"
            min="0"
            value={currentPoints === 0 ? "" : currentPoints}
            placeholder="0"
            onChange={(e) => setCurrentPoints(Math.max(0, Number(e.target.value)))}
            className="min-h-14 w-full min-w-0 bg-transparent text-2xl font-bold outline-none"
          />
          <span className="text-notebook-muted">{unit}</span>
        </div>
        <p className="mt-2 text-xs text-notebook-muted">ゲーム内の所持ポイントを入力してください。</p>
      </section>

      {/* 報酬の選び方は、イベントの形ごとのテンプレート（src/components/rewards/） */}
      <template.Component event={event} value={selection} onChange={setSelection} currentPoints={currentPoints} exchangeText={exchangeText} />

      <section aria-labelledby="playable-days" className="rounded-2xl shadow-[0_4px_8px_rgba(90,70,48,0.3)] border border-notebook-line bg-notebook-paper px-3 py-5 sm:p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-notebook-line pb-3">
          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-notebook-green text-xs font-bold text-white">03</span>
          <h2 id="playable-days" className="text-base font-extrabold">プレイする日</h2>
        </div>
        <p className="mb-3 rounded-sm bg-notebook-beige p-3 text-xs leading-relaxed text-notebook-muted">※初日（{Number(event.start.slice(11, 13))}時開始）と最終日（{Number(event.end.slice(11, 13))}時終了）は、遊べる時間が短いため半日（0.5日）として計算します。</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDays(days.map((day) => ({ ...day, playable: true })))} className="min-h-11 rounded-sm border border-notebook-line px-2 text-xs font-bold text-notebook-muted hover:bg-notebook-beige focus-visible:outline-2 focus-visible:outline-brand-blue">全選択</button>
          <button type="button" onClick={() => setDays(days.map((day) => ({ ...day, playable: false })))} className="min-h-11 rounded-sm border border-notebook-line px-2 text-xs font-bold text-notebook-muted hover:bg-notebook-beige focus-visible:outline-2 focus-visible:outline-brand-blue">全解除</button>
          <button type="button" onClick={() => setDays(days.map((day, i) => ({ ...day, playable: i !== days.length - 1 })))} className="min-h-11 rounded-sm border border-notebook-line px-2 text-xs font-bold text-notebook-muted hover:bg-notebook-beige focus-visible:outline-2 focus-visible:outline-brand-blue">最終日以外</button>
        </div>
        {/* チェックボックスは残し、peerで選択時の見た目だけ切り替える */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {days.map((day, i) => (
            <label key={day.date} className="min-w-0 cursor-pointer">
              <input
                type="checkbox"
                checked={day.playable}
                onChange={(e) => {
                  const next = [...days];
                  next[i] = { ...day, playable: e.target.checked };
                  setDays(next);
                }}
                className="peer sr-only"
              />
              {/* 選択中：緑線＋白背景、チェックは緑丸に白抜き／未選択：フィルターで暗く */}
              <span className={`relative flex min-h-14 flex-row items-center gap-x-3 rounded-md sm:min-h-20 sm:flex-col sm:justify-center sm:gap-x-0 border-2 px-3 py-2 transition sm:px-1 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-blue ${
                day.playable
                  ? "border-notebook-green bg-white text-notebook-green shadow-md"
                  : "border-notebook-line bg-notebook-beige text-notebook-muted brightness-[0.85] grayscale"
              } ${day.date === today ? "ring-2 ring-notebook-red ring-offset-2 ring-offset-notebook-paper" : ""}`}>
                <span aria-hidden="true" className={`grid size-6 shrink-0 sm:mb-1 place-items-center rounded-full text-sm font-extrabold ${day.playable ? "bg-notebook-green text-white" : "border-2 border-notebook-line bg-white"}`}>
                  {day.playable ? "✓" : ""}
                </span>
                {/* 日付とかっこをひとまとめに（スマホは左寄せ、PCは中央） */}
                <span className="flex flex-col leading-tight sm:items-center">
                <span className="text-lg font-extrabold">{formatDate(day.date)}</span>
                {day.date === days[0].date && <span className="text-xs whitespace-nowrap">({Number(event.start.slice(11, 13))}時開始)</span>}
                {day.date === days[days.length - 1].date && <span className="text-xs whitespace-nowrap">({Number(event.end.slice(11, 13))}時終了)</span>}
                {day.date === today && <span className="text-xs font-bold whitespace-nowrap">(今日)</span>}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-right text-xs text-notebook-green">✓ 選んだ日だけでノルマを計算</p>
      </section>

      {/* 朱色の二重枠と判子風のラベルで、結果を一番目立たせる */}
      <section className="rounded-2xl shadow-[0_4px_8px_rgba(90,70,48,0.3)] border-4 border-double border-notebook-red bg-white px-3 py-5 sm:p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-notebook-line pb-3">
          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-notebook-red text-xs font-bold text-white">✓</span>
          <h2 className="text-base font-extrabold">あなたの目標</h2>
          <span aria-hidden="true" className="ml-auto -rotate-6 border-2 border-notebook-red px-1 text-xs font-bold text-notebook-red">目安</span>
        </div>
        <dl className="grid grid-cols-2 gap-4 border-b border-dashed border-notebook-line pb-5">
          <div><dt className="text-xs text-notebook-muted">現在ポイント</dt><dd className="mt-1 text-lg font-bold break-all">{currentPoints.toLocaleString()}<span className="ml-1 text-xs font-normal">{unit}</span></dd></div>
          <div><dt className="text-xs text-notebook-muted">必要ポイント</dt><dd className="mt-1 text-lg font-bold break-all">{requiredTotal.toLocaleString()}<span className="ml-1 text-xs font-normal">{unit}</span></dd></div>
          <div><dt className="text-xs text-notebook-muted">残りポイント</dt><dd className="mt-1 text-lg font-bold break-all">{rest.toLocaleString()}<span className="ml-1 text-xs font-normal">{unit}</span></dd></div>
          <div><dt className="text-xs text-notebook-muted">残り日数</dt><dd className="mt-1 text-lg font-bold">{remainingDays}<span className="ml-1 text-xs font-normal">日</span></dd></div>
        </dl>
        <div className="py-6 text-center">
          <p className="font-bold">1日の目安ポイント</p>
          <p className="my-2 text-4xl leading-tight font-extrabold break-all text-notebook-red sm:text-5xl">
            {dailyQuota === 0 ? "達成済み" : <>{dailyQuota.toLocaleString()}<span className="ml-1 text-lg">{unit}</span></>}
          </p>
          {firstDayText && <p className="text-xs text-notebook-muted">({firstDayText})</p>}
          {lastDayText && <p className="text-xs text-notebook-muted">({lastDayText})</p>}
        </div>
        <p className="bg-notebook-beige p-2 text-center text-xs text-notebook-muted">無理せず、あなたのペースで。</p>
      </section>

      <section className="px-1 py-2">
        <h2 className="mb-3 text-center text-base font-extrabold">結果を共有</h2>
        {/* 画像つきで共有（予定表の画像＋結果入りのリンク）。いちばん目立つボタン */}
        <button
          type="button"
          onClick={() => { void handleShareImage(); }}
          disabled={shareBusy}
          className="mb-3 flex min-h-14 w-full flex-col items-center justify-center rounded-xl bg-notebook-red px-3 text-base font-extrabold text-white shadow-md hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60"
        >
          {shareBusy ? "画像を作っています…" : "画像つきで共有"}
          <span className="text-xs font-bold text-white/90">予定表の画像と、結果のリンクを一緒に送れます</span>
        </button>
        {shareHint && (
          <p role="status" className="mb-3 rounded-sm border border-brand-yellow bg-[#fff6d9] px-3 py-2 text-center text-xs font-bold text-[#7a5a00]">
            {shareHint}
          </p>
        )}
        <p className="mb-2 text-center text-xs text-notebook-muted">文章とリンクだけで共有</p>
        <div className="grid grid-cols-2 gap-3">
          <a href={`https://line.me/R/share?text=${encodeURIComponent(fullShareText)}`} target="_blank" rel="noreferrer" onClick={() => sendGAEvent("event", "share", { method: "LINE" })} className="flex min-h-12 items-center justify-center rounded-xl bg-notebook-green px-3 text-sm font-bold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">LINEで共有</a>
          <a href={`https://x.com/intent/post?text=${encodeURIComponent(fullShareText)}`} target="_blank" rel="noreferrer" onClick={() => sendGAEvent("event", "share", { method: "X" })} className="flex min-h-12 items-center justify-center rounded-xl bg-[#3d3b37] px-3 text-sm font-bold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">Xで共有</a>
        </div>
        <button type="button" onClick={() => { sendGAEvent("event", "share", { method: "その他" }); navigator.share({ text: fullShareText }); }} className="mt-2 min-h-11 w-full cursor-pointer text-xs text-notebook-muted underline underline-offset-4 hover:text-notebook-red focus-visible:outline-2 focus-visible:outline-brand-blue">その他で共有</button>
      </section>

      <section aria-labelledby="schedule" className="rounded-2xl shadow-[0_4px_8px_rgba(90,70,48,0.3)] border border-notebook-line bg-notebook-paper px-3 py-5 sm:p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-notebook-line pb-3">
          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-yellow text-xs font-bold text-white">04</span>
          <h2 id="schedule" className="scroll-mt-5 text-base font-extrabold">日ごとの予定</h2>
        </div>
        {/* 数値が大きい場合もページ全体ではなく表だけ横スクロール */}
        <div role="region" aria-label="日ごとの予定表（横スクロールできます）" tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand-blue">
          {/* table-fixed＋w-1/3で3列を同じ幅に。線と見出しは黄色ベース */}
          <table className="w-full table-fixed border-collapse border-2 border-brand-yellow text-center text-sm tabular-nums sm:text-base">
            <thead>
              <tr className="bg-brand-yellow text-white">
                <th scope="col" className="w-1/3 border border-brand-yellow px-2 py-3 font-extrabold">日付</th>
                <th scope="col" className="w-1/3 border border-brand-yellow px-2 py-3 font-extrabold">目標</th>
                <th scope="col" className="w-1/3 border border-brand-yellow px-2 py-3 font-extrabold">累計</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((day) => (
                <tr key={day.date} className="bg-white even:bg-[#fffbea] last:bg-[#fff2c4] last:font-bold">
                  <td className="border border-brand-yellow/50 px-1 py-3 sm:px-2">
                    {formatDate(day.date)}<span className="inline-block text-xs sm:text-sm">（{weekdayOf(day.date)}）</span>
                    {day.date === days[0].date && <span className="block text-xs text-notebook-muted">（{Number(event.start.slice(11, 13))}時開始）</span>}
                    {day.date === days[days.length - 1].date && <span className="block text-xs text-notebook-muted">（{Number(event.end.slice(11, 13))}時終了）</span>}
                  </td>
                  <td className="border border-brand-yellow/50 px-2 py-3 whitespace-nowrap">{day.target.toLocaleString()}{unit}</td>
                  <td className="border border-brand-yellow/50 px-2 py-3 whitespace-nowrap">{day.cumulative.toLocaleString()}{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 表を画像保存（絵巻守Lv早見表と同じ配置） */}
        <div className="mt-4 space-y-2">
          <h3 className="text-center text-sm font-extrabold">表を画像保存</h3>
          <button
            type="button"
            onClick={() => { void handleSaveScheduleImage(); }}
            disabled={imageBusy}
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-notebook-line bg-white px-3 text-sm font-bold text-notebook-muted hover:bg-notebook-beige focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50"
          >
            {imageBusy ? "画像を作っています…" : "日ごとの予定を保存"}
          </button>
          {imageHint && (
            <p role="status" className="rounded-sm border border-brand-yellow bg-[#fff6d9] px-3 py-2 text-center text-xs font-bold text-[#7a5a00]">
              {imageHint}
            </p>
          )}
        </div>
      </section>
    </main>

    <SiteFooter />

  </>
);
}
