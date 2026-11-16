import Image from "next/image";
import { calcExchangeTarget, formatExchangeCounts, parseExchangeCounts } from "@/lib/exchangeRewards";
import type { EventData } from "@/lib/events";
import type { RewardTemplate, RewardTemplateProps } from "./types";

// 交換所型のイベントなら報酬一覧、ほかの形なら空
const rewardsOf = (event: EventData) => (event.type === "exchange" ? event.rewards : []);

// 交換所型の「報酬の希望数」の枠
function ExchangeRewards({ event, value, onChange, exchangeText }: RewardTemplateProps) {
  const rewards = rewardsOf(event);
  const counts = parseExchangeCounts(value, rewards);
  const setCounts = (next: number[]) => onChange(formatExchangeCounts(next));

  return (
    <section aria-labelledby="rewards" className="rounded-2xl shadow-[0_4px_8px_rgba(90,70,48,0.3)] border border-notebook-line bg-notebook-paper px-3 py-5 sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-notebook-line pb-3">
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-notebook-red text-xs font-bold text-white">02</span>
        <h2 id="rewards" className="text-base font-extrabold">報酬の希望数</h2>
      </div>
      <p className="mb-3 rounded-sm border border-brand-yellow bg-[#fff6d9] px-3 py-2 text-sm font-bold text-[#7a5a00]">⚠ {exchangeText}。忘れずに交換しよう！</p>
      <div className="mb-1 flex flex-wrap gap-2">
        <button type="button" onClick={() => setCounts(rewards.map((reward) => reward.maxCount))} className="min-h-11 rounded-sm border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue">
          全部交換
        </button>
        <button type="button" onClick={() => setCounts(rewards.map(() => 0))} className="min-h-11 rounded-sm border border-notebook-line px-3 text-xs font-bold text-notebook-muted hover:bg-notebook-beige focus-visible:outline-2 focus-visible:outline-brand-blue">
          クリア
        </button>
      </div>
      {/* ゲームの交換所みたいに、3列のカードで並べる */}
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {rewards.map((reward, i) => {
          const done = reward.maxCount === 0; // 交換済み
          const selected = counts[i] > 0; // 1個以上選んでいる
          // 0〜上限の中に収めて保存する
          const change = (value: number) => {
            const next = [...counts];
            next[i] = Math.min(reward.maxCount, Math.max(0, value));
            setCounts(next);
          };
          return (
            <li
              key={reward.name}
              className={`grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 rounded-xl border-2 px-3 py-2 sm:flex sm:flex-col sm:gap-0 sm:px-1 sm:pb-2 sm:pt-3 ${
                done
                  ? "border-notebook-line bg-notebook-beige opacity-60"
                  : selected
                    ? "border-notebook-red bg-white"
                    : "border-notebook-line bg-white"
              }`}
            >
              {/* アイコン */}
              <div className="relative shrink-0">
                <Image src={reward.image} alt="" width={64} height={64} className="size-14 sm:size-20" />
                {reward.amount > 1 && (
                  <span className="absolute -bottom-1 -right-2 text-lg font-extrabold text-[#5a4630] [text-shadow:0_0_2px_#fff,0_0_2px_#fff,0_0_2px_#fff]">
                    {reward.amount}
                  </span>
                )}
              </div>
              {/* 名前・値段・回数（スマホは左寄せで縦、PCは中央） */}
              <div className="min-w-0 flex-1 sm:flex sm:flex-col sm:items-center">
              <p className="text-base font-bold leading-snug sm:mt-2 sm:text-center">{reward.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1 sm:mt-0 sm:flex-col sm:gap-0">
              <p className="flex items-center gap-1 sm:mt-2 rounded-full border border-notebook-line bg-notebook-paper px-3 text-base font-extrabold">
                <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-brand-yellow text-xs text-white">P</span>
                {reward.costPoints.toLocaleString()}
              </p>
              {/* 「最大◯回」バッジ */}
              <p className="sm:mt-2">
                <span className="whitespace-nowrap rounded-full bg-[#6f5838] px-2 py-1 text-xs font-bold leading-6 text-white">
                    {done ? "交換済み" : `最大${reward.maxCount}回`}
                </span>
              </p>
              </div>
              </div>

              {/* 個数を選ぶ（－ 数字 ＋） */}
              <div className="col-span-2 flex shrink-0 items-center justify-self-end sm:mt-3">
                <button
                  type="button"
                  aria-label={`${reward.name}を1つ減らす`}
                  disabled={done || counts[i] === 0}
                  onClick={() => change(counts[i] - 1)}
                  className="size-8 shrink-0 rounded-full border border-notebook-line sm:size-10 bg-notebook-paper font-bold text-notebook-muted disabled:opacity-40"
                >
                  －
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={reward.maxCount}
                  aria-label={`${reward.name}の数`}
                  disabled={done}
                  value={counts[i] === 0 ? "" : counts[i]}
                  placeholder="0"
                  onChange={(e) => change(Number(e.target.value))}
                  className="mx-2 h-8 w-10 rounded-sm sm:mx-2 sm:h-10 sm:w-12 border border-notebook-line bg-white text-center text-lg font-bold [appearance:textfield] disabled:bg-notebook-beige [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label={`${reward.name}を1つ増やす`}
                  disabled={done || counts[i] >= reward.maxCount}
                  onClick={() => change(counts[i] + 1)}
                  className="size-8 shrink-0 rounded-full border border-notebook-red sm:size-10 bg-notebook-red font-bold text-white disabled:opacity-40"
                >
                  ＋
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// 交換所型のテンプレート
export const exchangeTemplate: RewardTemplate = {
  paramName: "counts",
  normalize: (raw, event) => formatExchangeCounts(parseExchangeCounts(raw, rewardsOf(event))),
  calcTarget: (value, event) => calcExchangeTarget(parseExchangeCounts(value, rewardsOf(event)), rewardsOf(event)),
  doneMessage: "報酬交換の目標を達成済みです！",
  Component: ExchangeRewards,
};
