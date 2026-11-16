// 画面確認用の仮イベント。開発中（npm run dev）だけ /point-calc/sample-point-reach で開ける
// 本番のページ・一覧・サイトマップには出ない（eventSource.ts の getEventBySlug を参照）
// 報酬の名前・ポイントはすべて仮。本物のデータではない
import type { EventData } from "./events";

export const sampleEvents: EventData[] = [
  {
    slug: "sample-point-reach",
    name: "（仮）ポイント到達型の見本",
    type: "milestone",
    category: "大討伐",
    start: "2026-11-18T15:00:00+09:00",
    end: "2026-12-02T13:00:00+09:00",
    milestones: [
      { name: "小判×1000", requiredPoints: 1000, image: "/rewards/koban-10000.png", amount: 1000 },
      { name: "経験値の書・小×5", requiredPoints: 3000, image: "/rewards/experience-book-small.png", amount: 5 },
      { name: "11月召喚チケット", requiredPoints: 6000, image: "/rewards/november-summon-ticket.png", amount: 1 },
      { name: "経験値の書・中", requiredPoints: 10000, image: "/rewards/experience-book-medium.png", amount: 1 },
      { name: "絵馬Pt×300", requiredPoints: 15000, image: "/rewards/ema-points-300.png", amount: 300 },
      { name: "11月10回召喚チケット", requiredPoints: 25000, image: "/rewards/november-ten-summon-ticket.png", amount: 1 },
    ],
  },
];
