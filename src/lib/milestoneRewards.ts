// ポイント到達型イベントの計算（画面は src/components/rewards/MilestoneRewards.tsx）
import type { MilestoneReward } from "./events";
import type { RewardTarget } from "./rewardTarget";

// 到達ポイントの少ない順に並べる（データの書き順が違っても画面とURLがずれないように）
export function sortMilestones(milestones: MilestoneReward[]): MilestoneReward[] {
  return [...milestones].sort((a, b) => a.requiredPoints - b.requiredPoints);
}

// 共有URLや保存データの "3" を、目標にする報酬の番号（並べたあとの0始まり）にする
// 値がない・数字以外・範囲外のときは、最後の報酬を目標にする
export function parseMilestoneTarget(raw: string | null, milestones: MilestoneReward[]): number {
  const last = milestones.length - 1;
  if (raw === null || raw.trim() === "") return last;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > last) return last;
  return n;
}

// 目標の番号から、共通部分に渡す目標を作る
export function calcMilestoneTarget(target: number, milestones: MilestoneReward[]): RewardTarget {
  const sorted = sortMilestones(milestones);
  return {
    requiredTotal: sorted[target]?.requiredPoints ?? 0,
    milestones: sorted.map((m) => ({ label: m.name, points: m.requiredPoints })),
  };
}

// 今のポイントで、いくつ目までもらえているか（0なら1つももらえていない）
export function countReached(currentPoints: number, milestones: MilestoneReward[]): number {
  return milestones.filter((m) => currentPoints >= m.requiredPoints).length;
}
