// イベントのデータ（PHPで言うと、イベント一覧の配列をまとめた config ファイル）
// 新しいイベントが来たら、配列の先頭に1つ足すだけでページが増える
// （DB を使うようになったら、ここは DB が使えないときの予備になる）

export type Reward = {
  name: string;
  costPoints: number; // 1回の交換に必要なポイント
  maxCount: number; // 交換所の「あと◯回」
  image: string;
  amount: number;
};

// ポイント到達型の報酬（◯ptためるともらえる）
export type MilestoneReward = {
  name: string;
  requiredPoints: number; // もらえるポイント（累計）
  image: string;
  amount: number;
};

// どのイベントにもある項目
type EventBase = {
  slug: string; // URLに使う名前（/point-calc/◯◯）
  name: string;
  category: string;
  start: string;
  end: string;
  unit?: string; // ポイントの単位（大討伐は「体」など）。書かなければ pt
};

// 画面に出すポイントの単位
export const unitOf = (event: EventData) => event.unit ?? "pt";

// イベントの形（報酬の画面テンプレートがこれで切り替わる。src/components/rewards/index.ts）
// exchange：交換所型（ポイントで報酬を交換する）
export type ExchangeEvent = EventBase & {
  type: "exchange";
  exchangeEnd: string; // 交換期限
  rewards: Reward[];
};
// milestone：ポイント到達型（ためたポイントで報酬がもらえる）
export type MilestoneEvent = EventBase & {
  type: "milestone";
  rewardEnd?: string; // 報酬の受け取り期限（わかれば）
  milestones: MilestoneReward[];
};

export type EventData = ExchangeEvent | MilestoneEvent;
export type EventType = EventData["type"];

export const events: EventData[] = [
  {
    slug: "jigoku-meguri-2026",
    name: "地獄めぐり",
    type: "exchange",
    category: "シナリオイベント",
    start: "2026-11-04T18:00:00+09:00", // 開始：11/4 18:00
    end: "2026-11-18T13:00:00+09:00", // 終了：11/18 12:59まで（13:00ちょうどに終了）
    exchangeEnd: "2026-11-25T13:00:00+09:00", // 交換期限：11/25 12:59まで（13:00ちょうどに終了）
    rewards: [
      { name: "11月召喚チケット", costPoints: 500, maxCount: 5, image: "/rewards/november-summon-ticket.png", amount: 1 },
      { name: "11月10回召喚チケット", costPoints: 8000, maxCount: 1, image: "/rewards/november-ten-summon-ticket.png", amount: 1 },
      { name: "小判×10000", costPoints: 4000, maxCount: 3, image: "/rewards/koban-10000.png", amount: 10000 },
      { name: "小判×10", costPoints: 10, maxCount: 999, image: "/rewards/koban-10.png", amount: 10 },
      { name: "おみやげ人形焼き", costPoints: 1000, maxCount: 6, image: "/rewards/souvenir-ningyoyaki.png", amount: 1 },
      { name: "経験値の書・小×5", costPoints: 100, maxCount: 5, image: "/rewards/experience-book-small.png", amount: 5 },
      { name: "経験値の書・中", costPoints: 500, maxCount: 3, image: "/rewards/experience-book-medium.png", amount: 1 },
      { name: "経験値の書・大", costPoints: 2000, maxCount: 1, image: "/rewards/experience-book-large.png", amount: 1 },
      { name: "ハート回復薬・小×3", costPoints: 100, maxCount: 3, image: "/rewards/small-heart-potion.png", amount: 3 },
      { name: "絵馬経験値の勾玉・小×5", costPoints: 200, maxCount: 5, image: "/rewards/ema-experience-magatama-small.png", amount: 5 },
      { name: "絵馬Pt×50", costPoints: 300, maxCount: 5, image: "/rewards/ema-points-50.png", amount: 50 },
      { name: "絵馬Pt×300", costPoints: 1500, maxCount: 1, image: "/rewards/ema-points-300.png", amount: 300 },
      { name: "赤の絵具", costPoints: 2000, maxCount: 1, image: "/rewards/red-paint.png", amount: 1 },
      { name: "黄の絵具", costPoints: 2000, maxCount: 1, image: "/rewards/yellow-paint.png", amount: 1 },
      { name: "麦", costPoints: 100, maxCount: 3, image: "/rewards/wheat.png", amount: 1 },
      { name: "水", costPoints: 50, maxCount: 3, image: "/rewards/water.png", amount: 1 },
      { name: "骨付き肉", costPoints: 200, maxCount: 3, image: "/rewards/bone-in-meat.png", amount: 1 },
      { name: "臼と杵", costPoints: 250, maxCount: 3, image: "/rewards/mortar-and-pestle.png", amount: 1 },
      { name: "昆布", costPoints: 50, maxCount: 3, image: "/rewards/kombu.png", amount: 1 },
      { name: "お米", costPoints: 50, maxCount: 3, image: "/rewards/rice.png", amount: 1 },
      { name: "塩", costPoints: 150, maxCount: 3, image: "/rewards/salt.png", amount: 1 },
      { name: "大豆", costPoints: 50, maxCount: 3, image: "/rewards/soybeans.png", amount: 1 },
      { name: "火打ち石", costPoints: 150, maxCount: 3, image: "/rewards/flint.png", amount: 1 },
      { name: "紙", costPoints: 100, maxCount: 3, image: "/rewards/paper.png", amount: 1 },
      { name: "筆", costPoints: 100, maxCount: 3, image: "/rewards/brush.png", amount: 1 },
      { name: "サンゴ", costPoints: 350, maxCount: 2, image: "/rewards/coral.png", amount: 1 },
      { name: "ウロコ", costPoints: 565, maxCount: 3, image: "/rewards/scale.png", amount: 1 },
    ],
  },
];

// イベントを探す・一覧を取るのは src/lib/eventSource.ts（events.ts か DB かを切り替える）

// 日時の書き方は src/lib/dateFormat.ts にまとめてある
