import type { ReactNode } from "react";
import type { EventData } from "@/lib/events";
import type { RewardTarget } from "@/lib/rewardTarget";

// 報酬テンプレートの画面に渡すもの
export type RewardTemplateProps = {
  event: EventData;
  value: string; // 選んだ内容（共有URLと同じ文字の形）
  onChange: (value: string) => void;
  exchangeText: string; // 「交換は◯/◯ ◯:◯まで」
};

// イベントの形ごとのテンプレート（PHPでいう、種類ごとに include するファイル1つ分）
export type RewardTemplate = {
  // 共有URLとブラウザ保存で、選んだ内容に使う名前（交換所型は今までどおり counts）
  paramName: string;
  // URLや保存データの文字を、正しい形にそろえる（値がないときは null）
  normalize: (raw: string | null, event: EventData) => string;
  // 選んだ内容から、共通部分に渡す目標を作る
  calcTarget: (value: string, event: EventData) => RewardTarget;
  // 報酬を選ぶ画面
  Component: (props: RewardTemplateProps) => ReactNode;
};
