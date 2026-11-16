// 1分ごとに「今」を更新する（残り時間や開催状態の表示用）
// サーバーで作るページには「今」がないので null。ブラウザで表示したあとに時刻が入る
import { useSyncExternalStore } from "react";

const subscribeMinute = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
};
const getMinute = () => Math.floor(Date.now() / 60000);
const getServerMinute = () => null;

export function useNow(): Date | null {
  const m = useSyncExternalStore<number | null>(subscribeMinute, getMinute, getServerMinute);
  return m === null ? null : new Date(m * 60000);
}
