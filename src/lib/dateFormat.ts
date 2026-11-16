// イベントの日時の書き方をそろえる（どの画面もここを使う。PHP でいう date() の書式を1か所にまとめたもの）
// 例：2026/11/4（水）18:00〜11/18（水）12:59
// ・年は最初の日付だけ（年をまたぐときは終わりにも付ける）
// ・日付には必ず曜日を付ける
// ・終了や期限の「13:00ちょうど」は、遊べる最後の分の「12:59」と書く
// 時刻はすべて日本時間

function tokyo(iso: string) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hm: `${get("hour")}:${get("minute")}`,
    weekday: get("weekday"),
  };
}

// 終わりの時刻：ちょうど0分なら1分前にする（13:00 → 12:59）
function endIso(iso: string) {
  const date = new Date(iso);
  return date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0
    ? new Date(date.getTime() - 60 * 1000).toISOString()
    : iso;
}

/** 「11/4（水）」。withYear なら「2026/11/4（水）」 */
export function formatDay(iso: string, withYear = false): string {
  const t = tokyo(iso);
  return `${withYear ? `${t.year}/` : ""}${t.month}/${t.day}（${t.weekday}）`;
}

/** 開始の日時「11/18（水）15:00」 */
export function formatStart(iso: string, withYear = false): string {
  return `${formatDay(iso, withYear)}${tokyo(iso).hm}`;
}

/** 終了・期限の日時「11/25（水）12:59」（13:00ちょうどは12:59と書く） */
export function formatEnd(iso: string, withYear = false): string {
  const e = endIso(iso);
  return `${formatDay(e, withYear)}${tokyo(e).hm}`;
}

/** 期間「2026/11/4（水）18:00〜11/18（水）12:59」 */
export function formatPeriod(start: string, end: string): string {
  return formatPeriodParts(start, end).join("");
}

/** 期間を「始まり」と「〜終わり」に分けたもの（画面で、途中から折り返さないように別々に置く） */
export function formatPeriodParts(start: string, end: string): [string, string] {
  const sameYear = tokyo(start).year === tokyo(endIso(end)).year;
  return [formatStart(start, true), `〜${formatEnd(end, !sameYear)}`];
}

/** 短い期間「11/4（水）〜11/18（水）」（時刻なし。ボタンの中など） */
export function formatShortPeriod(start: string, end: string): string {
  return `${formatDay(start)}〜${formatDay(endIso(end))}`;
}
