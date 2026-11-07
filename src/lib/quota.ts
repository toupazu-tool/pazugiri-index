//１日ノルマを計算する関数
export function calcDailyQuota(
    reqiredTotal: number,  //必要な合計pt
    currentPoints: number,  //現在ポイント
    remainingDays: number   //残りプレイ日数(最終日は0.5)
) : number {
    const rest = reqiredTotal - currentPoints;  //残りpt

    if (rest <= 0) return 0;                    //ノルマ達成
    if (remainingDays <= 0) return rest;        //日数がないので全部出す

    return Math.ceil(rest / remainingDays);     //日数÷残りpt
}

// 報酬の必要ポイント合計を計算する
export function calcRequiredTotal(
    rewards: { costPoints: number; count: number }[],
  ): number {
    return rewards.reduce((total, reward) => {
      return total + reward.costPoints * reward.count;
    }, 0);
  }

//残り日数を計算。初日（夕方開始）と最終日（13時終了）は0.5日として扱う
export type EventDay = {
    date: string;
    playable: boolean;
  };

//その日が何日分か（初日と最終日は0.5日、それ以外は1日）
export function dayWeight(day: EventDay, days: EventDay[]): number {
    const isFirst = day.date === days[0].date;
    const isLast = day.date === days[days.length - 1].date;
    return isFirst || isLast ? 0.5 : 1;
}

export function calcRemainingDays(days: EventDay[]): number {
    let total = 0;
    for (const day of days) {
      if (day.playable) total += dayWeight(day, days);
    }
    return total;
}

//日ごとの予定を作る。最後のプレイ日で調整して、必要ポイントにぴったり届くようにする
export type ScheduleDay = EventDay & { target: number; cumulative: number };

export function calcSchedule(
    days: EventDay[],
    currentPoints: number,
    requiredTotal: number,
  ): ScheduleDay[] {
    const rest = Math.max(requiredTotal - currentPoints, 0);       //残りpt
    const quota = calcDailyQuota(requiredTotal, currentPoints, calcRemainingDays(days));
    const activeDays = days.filter((day) => day.playable);
    const lastDate = activeDays[activeDays.length - 1]?.date;      //最後のプレイ日
    let earned = 0;

    return days.map((day) => {
      let target = 0;
      if (day.playable) {
        const left = rest - earned;                                 //まだ足りない分
        target = day.date === lastDate
          ? left                                                    //最後の日は残り全部
          : Math.min(Math.ceil(quota * dayWeight(day, days)), left); //半日なら半分。残りより多くはしない
      }
      earned += target;
      return { ...day, target, cumulative: currentPoints + earned };
    });
}