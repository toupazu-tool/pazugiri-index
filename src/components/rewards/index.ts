// イベントの形ごとに、どのテンプレートを使うかの一覧
// 新しい形が来たら、テンプレートを作ってここに1行足す（PHPの switch で include を切り替えるイメージ）
import type { EventType } from "@/lib/events";
import { exchangeTemplate } from "./ExchangeRewards";
import type { RewardTemplate } from "./types";

export const rewardTemplates: Record<EventType, RewardTemplate> = {
  exchange: exchangeTemplate,
};
