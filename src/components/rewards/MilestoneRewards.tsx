import Image from "next/image";
import { unitOf, type EventData } from "@/lib/events";
import { calcMilestoneTarget, countReached, parseMilestoneTarget, sortMilestones } from "@/lib/milestoneRewards";
import type { RewardTemplate, RewardTemplateProps } from "./types";

// 到達型のイベントなら報酬一覧（到達ポイントの少ない順）、ほかの形なら空
const milestonesOf = (event: EventData) => (event.type === "milestone" ? sortMilestones(event.milestones) : []);

// ポイント到達型の「目標の報酬」の枠
function MilestoneRewards({ event, value, onChange, currentPoints }: RewardTemplateProps) {
  const milestones = milestonesOf(event);
  const target = parseMilestoneTarget(value, milestones);
  const reached = countReached(currentPoints, milestones);
  const unit = unitOf(event);

  return (
    <section aria-labelledby="rewards" className="rounded-2xl shadow-[0_4px_8px_rgba(90,70,48,0.3)] border border-notebook-line bg-notebook-paper px-3 py-5 sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-notebook-line pb-3">
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-notebook-red text-xs font-bold text-white">02</span>
        <h2 id="rewards" className="text-base font-extrabold">目標の報酬</h2>
        <span className="ml-auto text-xs font-bold text-notebook-green">もらえた {reached} / {milestones.length}</span>
      </div>
      <p className="mb-3 rounded-sm border border-brand-yellow bg-[#fff6d9] px-3 py-2 text-sm font-bold text-[#7a5a00]">ほしい報酬をタップすると、そこまでのノルマを計算します。</p>
      <div className="mb-1 flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange(String(milestones.length - 1))} className="min-h-11 rounded-sm border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue">
          最後の報酬まで
        </button>
      </div>
      {/* 到達ポイントの少ない順に、上から1列で並べる */}
      <ol className="mt-3 space-y-2">
        {milestones.map((m, i) => {
          const isTarget = i === target;
          const isReached = currentPoints >= m.requiredPoints;
          const left = m.requiredPoints - currentPoints;
          return (
            <li key={`${m.requiredPoints}-${m.name}`}>
              <button
                type="button"
                aria-pressed={isTarget}
                aria-label={`${m.name}（${m.requiredPoints.toLocaleString()}${unit}）を目標にする`}
                onClick={() => onChange(String(i))}
                className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                  isTarget
                    ? "border-notebook-red bg-white shadow-md"
                    : isReached
                      ? "border-notebook-green/60 bg-[#f1f8ef]"
                      : i > target
                        ? "border-notebook-line bg-notebook-beige opacity-70"
                        : "border-notebook-line bg-white"
                }`}
              >
                {/* アイコン */}
                <span className="relative shrink-0">
                  <Image src={m.image} alt="" width={64} height={64} className="size-12 sm:size-14" />
                  {m.amount > 1 && (
                    <span className="absolute -bottom-1 -right-2 text-base font-extrabold text-[#5a4630] [text-shadow:0_0_2px_#fff,0_0_2px_#fff,0_0_2px_#fff]">
                      {m.amount}
                    </span>
                  )}
                </span>
                {/* 名前と到達ポイント */}
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold leading-snug">{m.name}</span>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-notebook-line bg-notebook-paper px-3 text-base font-extrabold">
                    <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-brand-yellow text-xs text-white">P</span>
                    {m.requiredPoints.toLocaleString()}
                  </span>
                </span>
                {/* 状態（目標／もらえた／あと◯pt） */}
                <span className="flex shrink-0 flex-col items-end gap-1 text-xs font-bold">
                  {isTarget && <span className="-rotate-6 border-2 border-notebook-red px-1 text-notebook-red">目標</span>}
                  {isReached
                    ? <span className="rounded-full bg-notebook-green px-2 py-1 text-white">✓ もらえた</span>
                    : <span className="whitespace-nowrap text-notebook-muted">あと{left.toLocaleString()}{unit}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ポイント到達型のテンプレート
export const milestoneTemplate: RewardTemplate = {
  paramName: "target",
  normalize: (raw, event) => String(parseMilestoneTarget(raw, milestonesOf(event))),
  calcTarget: (value, event) => {
    const milestones = milestonesOf(event);
    return calcMilestoneTarget(parseMilestoneTarget(value, milestones), milestones, unitOf(event));
  },
  doneMessage: "目標の報酬に到達済みです！",
  Component: MilestoneRewards,
};
