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

//残り日数を計算。最終日は0.5日として扱う
export type EventDay = {
    date: string;
    playable: boolean;
  };

export function calcRemainingDays(
    days: EventDay[],
    includeToday: boolean,
  ): number {
    let total = 0;
    for(const day of days){
      if(day.playable){
        total += day.date === days[days.length - 1].date ? 0.5 : 1;
      }
    }
    if(!includeToday) total = Math.max(total - 1, 0);
    return total;
}