"use client";

import { useState } from "react";
import { calcDailyQuota, calcRemainingDays, calcRequiredTotal } from "@/lib/quota";

const rewards = [
{ name: "報酬A", costPoints: 100 },
{ name: "報酬B", costPoints: 250 },
{ name: "報酬C", costPoints: 500 },
];


export default function Home() {
const [days, setDays] = useState([
  { date: "2026-11-06", playable: true },
  { date: "2026-11-07", playable: true },
  { date: "2026-11-08", playable: true },
  { date: "2026-11-09", playable: true },
]);

const [currentPoints, setCurrentPoints] = useState(0);
const [counts, setCounts] = useState([0, 0, 0]);
const [includeToday, setIncludeToday] = useState(true);

const requiredTotal = calcRequiredTotal(rewards.map((r, i) => ({ ...r, count: counts[i] })));
const remainingDays = calcRemainingDays(days, true);
const dailyQuota = calcDailyQuota(requiredTotal, currentPoints, remainingDays);

//ポイントぴったりにするためのロジック
const rest = Math.max(requiredTotal - currentPoints, 0);
const schedule: { date: string; playable: boolean; target: number; cumulative: number }[] = [];
let earned = 0;
const activeDays = days.filter((day) => day.playable);

days.forEach((day, i) => {
  const isActive = day.playable && (includeToday || i > 0);
  const isLast = activeDays[activeDays.length - 1]?.date === day.date;
  const target = isActive ? (isLast ? rest - earned : dailyQuota) : 0;
  earned += target;
  schedule.push({ ...day, target, cumulative: currentPoints + earned });
});

//共有テキスト
const lastSchedule = schedule.findLast((day) => day.target > 0);
const lastDayText = dailyQuota > 0 && lastSchedule?.target !== dailyQuota
  ? `／最終日：${lastSchedule?.target}pt`
  : "";

const shareText = dailyQuota === 0
  ? "報酬交換の目標を達成済みです！"
  : `1日の目安：${dailyQuota}pt／残り${rest}pt（${remainingDays}日）${lastDayText}`;

//共有リンク
const params = new URLSearchParams({
  current: String(currentPoints),
  counts: counts.join(","),
  days: days.map((day) => day.playable ? "1" : "0").join(""),
});
const shareUrl = `https://toupazu-point-calc.vercel.app/?${params}`;
const fullShareText = `${shareText}\n${shareUrl}`;

return (
<main className="mx-auto max-w-2xl p-6 space-y-6">
  <h1 className="text-2xl font-bold">イベントノルマ計算</h1>

  <label className="block">
    現在のポイント
    <input
      type="number"
      min="0"
      value={currentPoints}
      onChange={(e) => setCurrentPoints(Math.max(0, Number(e.target.value)))}
      className="mt-1 w-full rounded border p-2"
    />
  </label>

  <section>
    <h2 className="font-bold">報酬の希望数</h2>
    {rewards.map((reward, i) => (
      <label key={reward.name} className="block">
        {reward.name}（{reward.costPoints}pt）
        <input
          type="number"
          min="0"
          value={counts[i]}
          onChange={(e) => {
            const next = [...counts];
            next[i] = Number(e.target.value);
            setCounts(next);
          }}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
    ))}
  </section>

  <section>
  <h2 className="font-bold">プレイする日</h2>
  <button type="button" onClick={() => setDays(days.map((day) => ({ ...day, playable: true })))}>
    全選択
  </button>
  <button type="button" onClick={() => setDays(days.map((day) => ({ ...day, playable: false })))}>
    全解除
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
      {day.date}{i === 0 ? "（今日）" : ""}
    </label>
  ))}
</section>

  <section className="rounded bg-gray-100 p-4">
  <p>現在ポイント：{currentPoints}pt</p>
    <p>必要ポイント：{requiredTotal}pt</p>
    <p>残り日数：{remainingDays}日</p>
    <p>1日の目安ポイント</p>
    <p className="text-xl font-bold">
      {dailyQuota === 0 ? "達成済み" : `${dailyQuota}pt`}
    </p>
    {dailyQuota > 0 && schedule.findLast((day) => day.target > 0)?.target !== dailyQuota && (
      <p>(最終日：{schedule.findLast((day) => day.target > 0)?.target}pt)</p>
    )}
  </section>



  <section>
<h2 className="font-bold">日ごとの予定</h2>
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
      <td className="border p-2">{day.date}</td>
      <td className="border p-2">{day.target}pt</td>
      <td className="border p-2">{day.cumulative}pt</td>
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