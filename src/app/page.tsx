"use client";

import { useState, useEffect } from "react";
import { calcDailyQuota, calcRemainingDays, calcRequiredTotal, calcSchedule } from "@/lib/quota";

//イベントデータ
const event = {
  name: "地獄めぐり",
  category: "シナリオイベント",
  start: "2026-11-04T18:00:00+09:00", // 開始：11/4 18:00
  end: "2026-11-18T13:00:00+09:00", // 終了：11/18 12:59まで（13:00ちょうどに終了）
};

function listEventDates(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startIso.slice(0, 10)}T12:00:00+09:00`);
  const end = new Date(`${endIso.slice(0, 10)}T12:00:00+09:00`);
  for (let time = start.getTime(); time <= end.getTime(); time += 24 * 60 * 60 * 1000) {
    dates.push(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date(time)));
  }
  return dates;
}

const eventDays = listEventDates(event.start, event.end).map((date) => ({
  date,
  playable: true,
}));


//報酬データ（maxCount は交換所の「あと◯回」）
const rewards = [
  { name: "11月召喚チケット", costPoints: 500, maxCount: 5 },
  { name: "11月10回召喚チケット", costPoints: 8000, maxCount: 1 },
  { name: "小判×10000", costPoints: 4000, maxCount: 3 },
  { name: "小判×10", costPoints: 10, maxCount: 999 },
  { name: "おみやげ人形焼き", costPoints: 1000, maxCount: 5 },
  { name: "経験値の書・小×5", costPoints: 100, maxCount: 5 },
  { name: "経験値の書・中", costPoints: 500, maxCount: 3 },
  { name: "経験値の書・大", costPoints: 2000, maxCount: 1 },
  { name: "ハート回復薬・小×3", costPoints: 100, maxCount: 3 },
  { name: "絵馬経験値の勾玉・小×5", costPoints: 200, maxCount: 5 },
  { name: "絵馬Pt×50", costPoints: 300, maxCount: 5 },
  { name: "絵馬Pt×300", costPoints: 1500, maxCount: 1 },
  { name: "赤の絵具", costPoints: 2000, maxCount: 1 },
  { name: "黄の絵具", costPoints: 2000, maxCount: 1 },
  { name: "麦", costPoints: 100, maxCount: 3 },
  { name: "水", costPoints: 50, maxCount: 3 },
  { name: "骨付き肉", costPoints: 200, maxCount: 3 },
  { name: "臼と杵", costPoints: 250, maxCount: 3 },
  { name: "昆布", costPoints: 50, maxCount: 3 },
  { name: "お米", costPoints: 50, maxCount: 3 },
  { name: "塩", costPoints: 150, maxCount: 3 },
  { name: "大豆", costPoints: 50, maxCount: 3 },
  { name: "火打ち石", costPoints: 150, maxCount: 3 },
  { name: "紙", costPoints: 100, maxCount: 3 },
  { name: "筆", costPoints: 100, maxCount: 3 },
  { name: "サンゴ", costPoints: 350, maxCount: 2 },
  { name: "ウロコ", costPoints: 565, maxCount: 3 },
];

export default function Home() {
const [days, setDays] = useState(eventDays);
const [today, setToday] = useState("");
const [now, setNow] = useState<Date | null>(null);

useEffect(() => {
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
  setToday(todayStr);

  const now = new Date();

  const params = new URLSearchParams(window.location.search);

  const current = params.get("current");
  if (current) setCurrentPoints(Math.max(0, Number(current)));

  const countsParam = params.get("counts");
  if (countsParam) {
    const values = countsParam.split(",");
    setCounts(
      rewards.map((reward, i) => {
        const n = Number(values[i]);
        if (!Number.isFinite(n)) return 0;   // 数字じゃなければ0
        return Math.min(Math.max(Math.floor(n), 0), reward.maxCount); // 0〜上限に収める
      })
    );
  }

  const daysParam = params.get("days");
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
}, []);

//現在時刻を取得
useEffect(() => {
  // ① まず今の時刻を入れる
  setNow(new Date());

  // ② 1分ごとに同じことをするタイマーを作る
  const id = setInterval(() => {
    setNow(new Date());
  }, 60000);

  // ③ 画面を閉じたらタイマーを止める
  return () => clearInterval(id);
}, []);

const [currentPoints, setCurrentPoints] = useState(0);
const [counts, setCounts] = useState(rewards.map(() => 0));

const requiredTotal = calcRequiredTotal(rewards.map((r, i) => ({ ...r, count: counts[i] })));
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
const lastDayText = dailyQuota > 0 && lastSchedule?.target !== dailyQuota
  ? `／最終日：${lastSchedule?.target.toLocaleString()}pt`
  : "";

// 選んだ日の最初と最後を「11/7〜11/18」の形にする
const playableDays = days.filter((day) => day.playable);
const formatDate = (date: string) => {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
};
const first = playableDays[0];
const last = playableDays[playableDays.length - 1];
const rangeText = !first
  ? ""
  : first === last
    ? formatDate(first.date)
    : `${formatDate(first.date)}〜${formatDate(last.date)}`;

const shareText = dailyQuota === 0
  ? "報酬交換の目標を達成済みです！"
  : `1日の目安：${dailyQuota.toLocaleString()}pt${lastDayText}／残り${rest.toLocaleString()}pt（${rangeText}・${remainingDays}日）`;

//共有リンク
const params = new URLSearchParams({
  current: String(currentPoints),
  counts: counts.join(","),
  days: days.map((day) => day.playable ? "1" : "0").join(""),
});
const shareUrl = `https://toupazu-point-calc.vercel.app/?${params}#schedule`;
const fullShareText = `${shareText}\n▼表で確認する\n${shareUrl}`;

return (
  
<main className="mx-auto max-w-2xl p-6 space-y-6">
  <h1 className="text-2xl font-bold">ぱずぎり イベント交換所計算</h1>
  <section>
  <h2 className="text-xl font-bold">{event.category}『{event.name}』</h2>
  <p>{status}</p>
  </section>
 
  <label className="block">
    現在のポイント
    <input
      type="number"
      min="0"
      value={currentPoints === 0 ? "" : currentPoints}
      placeholder="0"
      onChange={(e) => setCurrentPoints(Math.max(0, Number(e.target.value)))}
      className="mt-1 w-full rounded border p-2"
    />
  </label>

  <section>
    <h2 id="rewards" className="font-bold">報酬の希望数</h2>
    <button type="button" onClick={() => setCounts(rewards.map((reward) => reward.maxCount))}>
      全部交換
    </button>
    <button type="button" onClick={() => setCounts(rewards.map(() => 0))}>
      クリア
    </button>
    {rewards.map((reward, i) => (
      <label key={reward.name} className="block">
        {reward.name}（{reward.costPoints.toLocaleString()}pt・上限{reward.maxCount}個）{reward.maxCount === 0 ? "交換済み" : ""}
        <input
          type="number"
          min="0"
          max={reward.maxCount}
          disabled={reward.maxCount === 0}
          value={counts[i] === 0 ? "" : counts[i]}
          placeholder="0"
          onChange={(e) => {
            const next = [...counts];
            next[i] = Math.min(reward.maxCount, Math.max(0, Number(e.target.value)));
            setCounts(next);
          }}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
    ))}
  </section>

  <section>
  <h2 id="playable-days" className="font-bold">プレイする日</h2>
  <p className="text-sm text-gray-500">※初日（{Number(event.start.slice(11, 13))}時開始）と最終日（{Number(event.end.slice(11, 13))}時終了）は、遊べる時間が短いため半日（0.5日）として計算します。</p>
  <button type="button" onClick={() => setDays(days.map((day) => ({ ...day, playable: true })))}>
    全選択
  </button>
  <button type="button" onClick={() => setDays(days.map((day) => ({ ...day, playable: false })))}>
    全解除
  </button>
  <button type="button"
  onClick={() => 
    setDays(days.map((day, i) => ({ ...day, playable: i !== days.length - 1 })))
  }
>
  最終日以外
</button>
  {days.map((day, i) => (
    <label key={day.date} className="block">
      <input
        type="checkbox"
        checked={day.playable}
        onChange={(e) => {
          const next = [...days];
          next[i] = { ...day, playable: e.target.checked };
          setDays(next);
        }}
      />
      {day.date}{day.date === days[0].date ? `（${Number(event.start.slice(11, 13))}時開始）` : ""}{day.date === days[days.length - 1].date ? `（${Number(event.end.slice(11, 13))}時終了）` : ""}{day.date === today ? "（今日）" : ""}
    </label>
  ))}
</section>

  <section className="rounded bg-gray-100 p-4">
  <p>現在ポイント：{currentPoints.toLocaleString()}pt</p>
    <p>必要ポイント：{requiredTotal.toLocaleString()}pt</p>
    <p>残り日数：{remainingDays}日</p>
    <p>1日の目安ポイント</p>
    <p className="text-xl font-bold">
      {dailyQuota === 0 ? "達成済み" : `${dailyQuota.toLocaleString()}pt`}
    </p>
    {dailyQuota > 0 && schedule.findLast((day) => day.target > 0)?.target !== dailyQuota && (
      <p>(最終日：{schedule.findLast((day) => day.target > 0)?.target.toLocaleString()}pt)</p>
    )}
  </section>



  <section>
<h2 id="schedule" className="font-bold">日ごとの予定</h2>
<table className="w-full border-collapse">
<thead>
  <tr>
    <th className="border p-2">日付</th>
    <th className="border p-2">目標</th>
    <th className="border p-2">累計</th>
  </tr>
</thead>
<tbody>
{schedule.map((day) => (
    <tr key={day.date}>
      <td className="border p-2">{day.date}{day.date === days[0].date ? `（${Number(event.start.slice(11, 13))}時開始）` : ""}{day.date === days[days.length - 1].date ? `（${Number(event.end.slice(11, 13))}時終了）` : ""}</td>
      <td className="border p-2">{day.target.toLocaleString()}pt</td>
      <td className="border p-2">{day.cumulative.toLocaleString()}pt</td>
    </tr>
  ))}
</tbody>
</table>
</section>

<section className="space-y-3">
  <h2 className="font-bold">結果を共有</h2>

  <a
    href={`https://line.me/R/share?text=${encodeURIComponent(fullShareText)}`}
    target="_blank"
    rel="noreferrer"
    className="block rounded border p-3"
  >
    LINEで共有
  </a>

  <a
    href={`https://x.com/intent/post?text=${encodeURIComponent(fullShareText)}`}
    target="_blank"
    rel="noreferrer"
    className="block rounded border p-3"
  >
    Xで共有
  </a>

  <button
    type="button"
    onClick={() => navigator.share({ text: fullShareText })}
    className="w-full rounded border p-3"
  >
    その他で共有
  </button>
</section>

</main>
);
}
