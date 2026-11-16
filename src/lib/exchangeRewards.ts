// 交換所型イベントの計算（画面は src/components/rewards/ExchangeRewards.tsx）
import type { Reward } from "./events";
import { calcRequiredTotal } from "./quota";
import type { RewardTarget } from "./rewardTarget";

// 共有URLや保存データの "1,0,3" を、報酬ごとの個数の配列にする
// 数字以外や足りない分は0、小数は切り捨て、0〜上限の中に収める
export function parseExchangeCounts(raw: string | null, rewards: Reward[]): number[] {
  const values = raw ? raw.split(",") : [];
  return rewards.map((reward, i) => {
    const n = Number(values[i]);
    if (!Number.isFinite(n)) return 0;
    return Math.min(Math.max(Math.floor(n), 0), reward.maxCount);
  });
}

// 個数の配列を、共有URLや保存に使う "1,0,3" の形にする
export function formatExchangeCounts(counts: number[]): string {
  return counts.join(",");
}

// 選んだ個数から、共通部分に渡す目標を作る
export function calcExchangeTarget(counts: number[], rewards: Reward[]): RewardTarget {
  return {
    requiredTotal: calcRequiredTotal(rewards.map((reward, i) => ({ ...reward, count: counts[i] ?? 0 }))),
    milestones: [],
  };
}
