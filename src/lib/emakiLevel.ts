// 絵巻守Lvの経験値計算（PHPの関数ファイルのようなもの）
// 上限レベルが分かったら、下の2つの数字を変えれば全体に反映される

/** ゲーム画面のスクショで確認できている最大レベル。これより上は予測 */
export const CONFIRMED_MAX_LEVEL = 50;

/** このツールで計算できる最大レベル。上限が分かったらここを変える */
export const COMPUTE_MAX_LEVEL = 99;

/** ゲーム画面で実測できたレベル（表の「✓」に使う） */
export const MEASURED_LEVELS: ReadonlySet<number> = new Set([
  1, 2, 3, 5, 9, 14, 16, 24, 26, 30, 31, 38, 42, 46, 50,
]);

const BASE = 105;
const EXPONENT = 2.45;
// Lv29→30 と Lv28→29 の必要経験値。Lv31以降の倍率の元になる
const NEED_AT_30 = 34803;
const NEED_AT_29 = 33105;
const GROWTH = NEED_AT_30 / NEED_AT_29;

// 同じレベルを何度も計算しないよう、結果を覚えておく
const cumulativeCache: number[] = [0];

function needFrom31(level: number): number {
  return Math.round(NEED_AT_30 * GROWTH ** (level - 30));
}

/**
 * 次のレベルへの累計 T(L)。
 * ゲーム画面の「現在値/次の値」の右側の数字。
 * Lv L から Lv L+1 に上がるのに必要な累計経験値。
 */
export function cumulativeToNext(level: number): number {
  if (level <= 0) return 0;

  if (cumulativeCache[level] !== undefined) {
    return cumulativeCache[level];
  }

  // 途中のレベルもまとめて埋める（表を作るときに何度も足し直さない）
  for (let current = cumulativeCache.length; current <= level; current++) {
    if (current <= 30) {
      cumulativeCache[current] = Math.round(BASE * current ** EXPONENT);
    } else {
      cumulativeCache[current] = cumulativeCache[current - 1] + needFrom31(current);
    }
  }

  return cumulativeCache[level];
}

/**
 * そのレベルで必要な経験値（前のレベルの累計との差）。
 * need(L) = T(L) - T(L-1)。T(0) は 0。
 */
export function needAtLevel(level: number): number {
  if (level <= 0) return 0;
  if (level >= 31) return needFrom31(level);
  return cumulativeToNext(level) - cumulativeToNext(level - 1);
}

/** このレベルの開始経験値。Lv1 は 0 */
export function levelStartXp(level: number): number {
  return level <= 1 ? 0 : cumulativeToNext(level - 1);
}

/** 確認できている範囲を超えているか（Lv51以上は予測） */
export function isPredictedLevel(level: number): boolean {
  return level > CONFIRMED_MAX_LEVEL;
}

export type XpValidation =
  | { ok: true }
  | { ok: false; message: string };

/** 今の経験値が、そのレベルの範囲に入っているかを調べる */
export function validateCurrentXp(level: number, currentXp: number): XpValidation {
  const min = levelStartXp(level);
  const max = cumulativeToNext(level);

  if (currentXp < min) {
    return {
      ok: false,
      message: `今の経験値が少なすぎます。Lv${level}なら ${min.toLocaleString()} 以上になっていないと合わないです。レベルか経験値を確認してみてください。`,
    };
  }

  if (currentXp > max) {
    return {
      ok: false,
      message: `今の経験値が多すぎます。Lv${level}の次のレベルへの累計は ${max.toLocaleString()} です。もう次のレベルに上がっているかもしれません。`,
    };
  }

  return { ok: true };
}

/** 次のレベルまでに必要な残り経験値 */
export function remainingToNext(level: number, currentXp: number): number {
  return Math.max(cumulativeToNext(level) - currentXp, 0);
}

/** 今のレベルの中での進み具合（0〜100）。範囲外のときは null */
export function progressPercent(level: number, currentXp: number): number | null {
  const need = needAtLevel(level);
  if (need <= 0) return null;
  const gained = currentXp - levelStartXp(level);
  if (gained < 0 || gained > need) return null;
  return Math.min(100, Math.max(0, (gained / need) * 100));
}

/**
 * 目標レベルに到達するまでの残り経験値。
 * 「Lv46になりたい」なら、Lv45の次のレベルへの累計に届くまでの残り。
 */
export function remainingToTarget(currentXp: number, targetLevel: number): number {
  if (targetLevel <= 1) return 0;
  return Math.max(cumulativeToNext(targetLevel - 1) - currentXp, 0);
}

export type LevelTableRow = {
  level: number;
  /** そのレベルになったときの累計経験値。Lv1 は 0、Lv L は T(L-1) */
  levelCumulative: number;
  need: number;
  measured: boolean;
};

/** Lv1〜max までの一覧表用データ（レベル累計はそのレベルになったときの累計） */
export function levelTable(maxLevel: number = CONFIRMED_MAX_LEVEL): LevelTableRow[] {
  const rows: LevelTableRow[] = [];
  for (let level = 1; level <= maxLevel; level++) {
    rows.push({
      level,
      levelCumulative: levelStartXp(level),
      need: needAtLevel(level),
      measured: MEASURED_LEVELS.has(level),
    });
  }
  return rows;
}
