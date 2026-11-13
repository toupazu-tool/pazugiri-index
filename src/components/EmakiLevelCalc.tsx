"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { sendGAEvent } from "@next/third-parties/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/lib/site";
import {
  CONFIRMED_MAX_LEVEL,
  cumulativeToNext,
  levelTable,
  needAtLevel,
  progressPercent,
  remainingToNext,
  remainingToTarget,
  validateCurrentXp,
} from "@/lib/emakiLevel";
import {
  renderEmakiTablePngBlob,
  savePngBlob,
  splitTableColumns,
  tableImageFilename,
} from "@/lib/emakiTableImage";

const STORAGE_KEY = "toupazu-emaki-level";
const TABLE_ROWS = levelTable(CONFIRMED_MAX_LEVEL);
const TABLE_COLUMNS = splitTableColumns(TABLE_ROWS, 2);

function clampLevel(value: number): number {
  return Math.min(CONFIRMED_MAX_LEVEL, Math.max(1, Math.floor(value)));
}

function parseOptionalNumber(value: string): number | "" {
  if (value.trim() === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return Math.max(0, Math.floor(n));
}

function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function EmakiLevelCalc() {
  const [level, setLevel] = useState<number | "">("");
  const [xp, setXp] = useState<number | "">("");
  const [target, setTarget] = useState<number | "">("");
  const [loaded, setLoaded] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageHint, setImageHint] = useState("");
  const currentRowRef = useRef<HTMLTableRowElement>(null);

  // 共有URLがあればURLを優先。なければ前回ブラウザに保存した内容を使う
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- URL and localStorage can be read only after mount */
    const params = new URLSearchParams(window.location.search);
    const hasUrl = params.has("lv") || params.has("xp") || params.has("target");
    let saved: Record<string, string> = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    } catch {
      saved = {};
    }
    const pick = (name: string) => (hasUrl ? params.get(name) : saved[name] ?? null);

    const lv = Number(pick("lv"));
    if (Number.isInteger(lv) && lv >= 1) setLevel(clampLevel(lv));

    const currentXp = Number(pick("xp"));
    if (Number.isFinite(currentXp) && currentXp >= 0) setXp(Math.floor(currentXp));

    const targetLv = Number(pick("target"));
    if (Number.isInteger(targetLv) && targetLv >= 1) setTarget(clampLevel(targetLv));

    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lv: level === "" ? "" : String(level),
          xp: xp === "" ? "" : String(xp),
          target: target === "" ? "" : String(target),
        }),
      );
    } catch {
      // プライベートモードなどで保存できないときは、入力の復元を諦める
    }
  }, [loaded, level, xp, target]);

  const currentLevel = typeof level === "number" ? level : null;
  const currentXp = typeof xp === "number" ? xp : null;
  const targetLevel = typeof target === "number" ? target : null;
  const ready = currentLevel !== null && currentXp !== null;
  const validation = ready ? validateCurrentXp(currentLevel, currentXp) : null;
  const valid = validation?.ok === true;

  const remainNext = valid && currentLevel !== null && currentXp !== null
    ? remainingToNext(currentLevel, currentXp)
    : null;
  const percent = valid && currentLevel !== null && currentXp !== null
    ? progressPercent(currentLevel, currentXp)
    : null;
  const remainTarget = valid && currentXp !== null && targetLevel !== null
    ? remainingToTarget(currentXp, targetLevel)
    : null;

  useEffect(() => {
    if (currentLevel === null) return;
    currentRowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentLevel]);

  const params = new URLSearchParams();
  if (currentLevel !== null) params.set("lv", String(currentLevel));
  if (currentXp !== null) params.set("xp", String(currentXp));
  if (targetLevel !== null) params.set("target", String(targetLevel));
  const shareUrl = `${site.url}/emaki-level${params.size ? `?${params}` : ""}`;
  const shareLines = valid && currentLevel !== null && currentXp !== null && remainNext !== null
    ? [
        "ぱずぎり 絵巻守Lv早見表 | 経験値計算ツール",
        `今のLv：${currentLevel}`,
        `今の経験値：${currentXp.toLocaleString()}`,
        `次のLvまで：${remainNext.toLocaleString()}`,
        targetLevel !== null && remainTarget !== null
          ? `目標Lv${targetLevel}まで：${remainTarget.toLocaleString()}`
          : "",
      ].filter((line) => line !== "")
    : [];
  const fullShareText = shareLines.length > 0 ? `${shareLines.join("\n")}\n▼計算する\n${shareUrl}` : "";
  const hasLevel = currentLevel !== null;

  const makeTableImage = (highlight: boolean) =>
    renderEmakiTablePngBlob({
      rows: TABLE_ROWS,
      highlightLevel: highlight && currentLevel !== null ? currentLevel : null,
    });

  const handleSaveTableImage = async (highlight: boolean) => {
    if (imageBusy) return;
    if (highlight && currentLevel === null) return;
    setImageBusy(true);
    setImageHint("");
    try {
      const blob = await makeTableImage(highlight);
      const filename = tableImageFilename(highlight ? currentLevel : null);
      await savePngBlob(blob, filename);
      sendGAEvent("event", "share", { method: "image_save" });
    } catch {
      setImageHint("画像を作れませんでした。もう一度試してみてください。");
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl space-y-5 px-5 pb-8 text-sm leading-relaxed">
        <div className="px-1 pt-6 pb-1">
          <h1 className="mt-2 flex flex-col items-center justify-center gap-2 text-center text-2xl leading-relaxed font-extrabold sm:flex-row sm:gap-3">
            <Image src="/to-top.svg" alt="" width={178} height={158} className="h-12 w-auto shrink-0" unoptimized />
            <span className="flex flex-col items-center leading-snug">
              <span>ぱずぎり 絵巻守Lv早見表</span>
              <span>経験値計算ツール</span>
            </span>
          </h1>
        </div>

        <section aria-labelledby="emaki-table" className="rounded-2xl border border-notebook-line bg-notebook-paper px-3 py-5 shadow-[0_4px_8px_rgba(90,70,48,0.3)] sm:p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-notebook-line pb-3">
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-yellow text-xs font-bold text-white">01</span>
            <h2 id="emaki-table" className="scroll-mt-5 text-base font-extrabold">Lv1〜{CONFIRMED_MAX_LEVEL}の経験値表</h2>
          </div>
          <p className="mb-2 text-center text-xs font-bold text-notebook-muted sm:hidden">
            ← 表は横にスクロールできます →
          </p>
          <div
            tabIndex={0}
            role="region"
            aria-label="絵巻守レベルの経験値表（横にスクロールできます）"
            className="min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] focus-visible:outline-2 focus-visible:outline-brand-blue"
          >
          <div className="grid min-w-[26rem] grid-cols-2 gap-1.5 sm:min-w-0 sm:gap-3">
            {TABLE_COLUMNS.map((columnRows, columnIndex) => {
              const first = columnRows[0]?.level;
              const last = columnRows[columnRows.length - 1]?.level;
              return (
                <div
                  key={columnIndex}
                  className="min-w-0"
                >
                  <table className="w-full table-fixed border-collapse border-2 border-brand-yellow text-center tabular-nums">
                    <caption className="sr-only">Lv{first}〜{last}</caption>
                    <colgroup>
                      <col className="w-[16%]" />
                      <col className="w-[42%]" />
                      <col className="w-[42%]" />
                    </colgroup>
                    <thead>
                      <tr className="bg-brand-yellow text-white">
                        <th scope="col" className="border border-brand-yellow px-0.5 py-1 text-[10px] font-extrabold leading-tight sm:px-1 sm:py-1.5 sm:text-xs">Lv</th>
                        <th scope="col" className="border border-brand-yellow px-0.5 py-1 text-[10px] font-extrabold leading-tight whitespace-nowrap sm:px-1 sm:py-1.5 sm:text-xs">
                          <abbr title="そのレベルになったときの累計経験値（Lv1は0）" className="cursor-help no-underline">レベル累計</abbr>
                        </th>
                        <th scope="col" className="border border-brand-yellow px-0.5 py-1 text-[10px] font-extrabold leading-tight whitespace-nowrap sm:px-1 sm:py-1.5 sm:text-xs">
                          <abbr title="そのレベルから次のレベルに上がるのに必要な経験値" className="cursor-help no-underline">必要経験値</abbr>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {columnRows.map((row) => {
                        const isCurrent = hasLevel && currentLevel === row.level;
                        return (
                          <tr
                            key={row.level}
                            ref={isCurrent ? currentRowRef : undefined}
                            className={isCurrent ? "bg-[#fff2c4] font-bold ring-1 ring-inset ring-notebook-red" : "bg-white even:bg-[#fffbea]"}
                          >
                            <th scope="row" className="border border-brand-yellow/50 px-0.5 py-0.5 text-[10px] leading-tight font-extrabold sm:py-1 sm:text-sm">
                              {row.level}
                              {isCurrent && <span className="mt-0.5 block text-[0.55rem] font-bold text-notebook-red sm:text-[0.65rem]">いま</span>}
                            </th>
                            <td className="border border-brand-yellow/50 px-0.5 py-0.5 text-[10px] leading-tight whitespace-nowrap sm:py-1 sm:text-sm">{row.levelCumulative.toLocaleString()}</td>
                            <td className="border border-brand-yellow/50 px-0.5 py-0.5 text-[10px] leading-tight whitespace-nowrap sm:py-1 sm:text-sm">{row.need.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="text-center text-sm font-extrabold">表を画像保存</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { void handleSaveTableImage(false); }}
                disabled={imageBusy}
                className="flex min-h-12 items-center justify-center rounded-xl border border-notebook-line bg-white px-3 text-sm font-bold text-notebook-muted hover:bg-notebook-beige focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50"
              >
                通常の表を保存
              </button>
              <button
                type="button"
                onClick={() => { void handleSaveTableImage(true); }}
                disabled={imageBusy || !hasLevel}
                className="flex min-h-12 items-center justify-center rounded-xl border border-notebook-line bg-white px-3 text-sm font-bold text-notebook-muted hover:bg-notebook-beige focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50"
              >
                いまのLvを強調して保存
              </button>
            </div>
            {!hasLevel && (
              <p className="text-center text-xs text-notebook-muted">今のLvを入れると、強調した表も保存できます。</p>
            )}
            {imageHint && (
              <p role="status" className="rounded-sm border border-brand-yellow bg-[#fff6d9] px-3 py-2 text-center text-xs font-bold text-[#7a5a00]">
                {imageHint}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-notebook-line bg-notebook-paper px-3 py-5 shadow-[0_4px_8px_rgba(90,70,48,0.3)] sm:p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-notebook-line pb-3">
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-blue text-xs font-bold text-white">02</span>
            <h2 className="text-base font-extrabold">いまの状態</h2>
          </div>

          <p className="mb-4 rounded-sm border border-brand-yellow bg-[#fff6d9] px-3 py-2 text-sm font-bold text-[#7a5a00]">
            現時点で計算可能なレベルは最大５０までとなります。５１以上はデータが集まり次第追加予定です。
          </p>
          <p className="mb-4 text-xs text-notebook-muted">入力内容は、お使いの端末のブラウザにだけ保存されます。</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="current-level" className="font-bold">今のLv</label>
              <div className="mt-2 flex items-center gap-3 rounded-sm border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-brand-blue">
                <input
                  id="current-level"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={CONFIRMED_MAX_LEVEL}
                  value={level}
                  placeholder="1"
                  onChange={(e) => {
                    const next = parseOptionalNumber(e.target.value);
                    setLevel(next === "" ? "" : clampLevel(next));
                  }}
                  className="min-h-14 w-full min-w-0 bg-transparent text-2xl font-bold outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-notebook-muted">絵巻守証に出ているレベルを入れてください。（1〜{CONFIRMED_MAX_LEVEL}）</p>
            </div>

            <div>
              <label htmlFor="current-xp" className="font-bold">今の経験値</label>
              <div className="mt-2 flex items-center gap-3 rounded-sm border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-brand-blue">
                <input
                  id="current-xp"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={xp}
                  placeholder="0"
                  onChange={(e) => setXp(parseOptionalNumber(e.target.value))}
                  className="min-h-14 w-full min-w-0 bg-transparent text-2xl font-bold outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-notebook-muted">絵巻守証経験値バー右下の「現在値/累計経験値」の左側の数字を入力してください。</p>
            </div>

            <div>
              <label htmlFor="target-level" className="font-bold">目標Lv（任意）</label>
              <div className="mt-2 flex items-center gap-3 rounded-sm border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-brand-blue">
                <input
                  id="target-level"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={CONFIRMED_MAX_LEVEL}
                  value={target}
                  placeholder="未入力"
                  onChange={(e) => {
                    const next = parseOptionalNumber(e.target.value);
                    setTarget(next === "" ? "" : clampLevel(next));
                  }}
                  className="min-h-14 w-full min-w-0 bg-transparent text-2xl font-bold outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-notebook-muted">空欄でも計算できます。なりたいレベルを入れると、そこまでの残りも出ます。</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border-4 border-double border-notebook-red bg-white px-3 py-5 shadow-[0_4px_8px_rgba(90,70,48,0.3)] sm:p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-notebook-line pb-3">
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-notebook-red text-xs font-bold text-white">✓</span>
            <h2 className="text-base font-extrabold">計算結果</h2>
            <span aria-hidden="true" className="ml-auto -rotate-6 border-2 border-notebook-red px-1 text-xs font-bold text-notebook-red">目安</span>
          </div>

          {!ready && (
            <p className="py-6 text-center text-notebook-muted">今のLvと今の経験値を入れると、ここに結果が出ます。</p>
          )}

          {validation && !validation.ok && (
            <p role="alert" className="rounded-sm border-2 border-notebook-red bg-[#fff4f1] px-4 py-3 font-bold text-notebook-red">
              {validation.message}
            </p>
          )}

          {valid && currentLevel !== null && currentXp !== null && remainNext !== null && percent !== null && (
            <div className="space-y-5">
              <div className="py-2 text-center">
                <p className="font-bold">次のLvまでの残り</p>
                <p className="my-2 text-4xl leading-tight font-extrabold break-all text-notebook-red sm:text-5xl">
                  {remainNext === 0 ? "次のレベルに上がれます！" : <>{remainNext.toLocaleString()}</>}
                </p>
                <p className="text-xs text-notebook-muted">
                  今の経験値 {currentXp.toLocaleString()} ／ 次のレベルへの累計 {cumulativeToNext(currentLevel).toLocaleString()}
                </p>
              </div>

              <div>
                <div className="flex items-end justify-between gap-3">
                  <p className="font-bold">このレベルの進み具合</p>
                  <p className="text-2xl font-extrabold text-notebook-green">{formatPercent(percent)}%</p>
                </div>
                <div
                  className="mt-2 h-6 overflow-hidden rounded-full bg-notebook-beige"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percent)}
                  aria-label="このレベルの進み具合"
                >
                  <div className="h-full rounded-full bg-notebook-green transition-[width]" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
                </div>
                <p className="mt-2 text-xs text-notebook-muted">
                  このレベルでは {needAtLevel(currentLevel).toLocaleString()} 必要で、あと {remainNext.toLocaleString()} です。
                </p>
              </div>

              {targetLevel !== null && remainTarget !== null && (
                <div className="border-t border-dashed border-notebook-line pt-5 text-center">
                  {targetLevel <= currentLevel ? (
                    <p className="font-bold">すでに目標のLv{targetLevel}に到達しています。</p>
                  ) : (
                    <>
                      <p className="font-bold">目標Lv{targetLevel}までの残り</p>
                      <p className="my-2 text-3xl leading-tight font-extrabold break-all text-notebook-red sm:text-4xl">
                        {remainTarget.toLocaleString()}
                      </p>
                      <p className="text-xs text-notebook-muted">
                        Lv{targetLevel}になるには、累計 {cumulativeToNext(targetLevel - 1).toLocaleString()} 必要です。
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
        <div className="text-center">
          <a
            href="#emaki-table"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("emaki-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-brand-blue bg-white px-5 text-sm font-bold text-brand-blue hover:bg-brand-blue hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            ↑ 経験値表を見る
          </a>
        </div>

        {valid && fullShareText && (
          <section className="px-1 py-2">
            <h2 className="mb-3 text-center text-base font-extrabold">結果を共有</h2>
            <div className="grid grid-cols-2 gap-3">
              <a href={`https://line.me/R/share?text=${encodeURIComponent(fullShareText)}`} target="_blank" rel="noreferrer" onClick={() => sendGAEvent("event", "share", { method: "LINE" })} className="flex min-h-12 items-center justify-center rounded-xl bg-notebook-green px-3 text-sm font-bold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">LINEで共有</a>
              <a href={`https://x.com/intent/post?text=${encodeURIComponent(fullShareText)}`} target="_blank" rel="noreferrer" onClick={() => sendGAEvent("event", "share", { method: "X" })} className="flex min-h-12 items-center justify-center rounded-xl bg-[#3d3b37] px-3 text-sm font-bold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">Xで共有</a>
            </div>
            <button type="button" onClick={() => { sendGAEvent("event", "share", { method: "その他" }); navigator.share({ text: fullShareText }); }} className="mt-2 min-h-11 w-full cursor-pointer text-xs text-notebook-muted underline underline-offset-4 hover:text-notebook-red focus-visible:outline-2 focus-visible:outline-brand-blue">その他で共有</button>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
