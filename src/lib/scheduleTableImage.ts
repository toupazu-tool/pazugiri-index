// イベントノルマ計算の「日ごとの予定」を画像（PNG）にする
// 大きさ・色・罫線は、絵巻守Lv早見表の保存画像（emakiTableImage.ts）にそろえている
import { TABLE_IMAGE_COLORS, TABLE_IMAGE_FOOTER, TABLE_IMAGE_SCALE, TABLE_IMAGE_SITE_NAME, TABLE_IMAGE_WIDTH } from "./emakiTableImage";
import { renderCanvasPng, roundedRectPath, savePngImage } from "./imageSave";

export const SCHEDULE_IMAGE_TITLE = "イベントノルマ計算";
export const SCHEDULE_IMAGE_HEADERS = ["日付", "目標", "累計"] as const;

// 画面で作った文字をそのまま描く（数字のカンマなどは呼び出し側で整えておく）
export type ScheduleImageRow = {
  date: string; // 「11/4（火）」
  note?: string; // 「18時開始」など
  target: string; // 「1,000pt」
  cumulative: string; // 「2,000pt」
  highlight?: boolean; // 今日の行
};

export type ScheduleImageOptions = {
  eventName: string;
  quota: string; // 1日の目安（「1,000pt」または「達成済み」）
  goal?: string; // 到達型の目標（「経験値の書・中（10,000pt）」）
  summary: { label: string; value: string }[]; // 現在・必要・残りポイント、残り日数
  rows: readonly ScheduleImageRow[];
  fontFamily?: string;
};

export type ScheduleImageLayout = {
  width: number;
  height: number;
  padX: number;
  padTop: number;
  titleSize: number;
  siteNameSize: number;
  summaryTop: number;
  summaryHeight: number;
  quotaLabelSize: number;
  quotaSize: number;
  goalSize: number;
  summaryLabelSize: number;
  summaryValueSize: number;
  summaryRows: number;
  summaryRowGap: number;
  tableTop: number;
  tableHeight: number;
  headerH: number;
  rowH: number;
  headerSize: number;
  cellSize: number;
  noteSize: number;
  footerSize: number;
  footerTop: number;
};

/** 行の数と、目標の行があるかで大きさを決める（1倍の座標） */
export function getScheduleImageLayout(rowCount: number, summaryCount: number, hasGoal: boolean): ScheduleImageLayout {
  const padX = 36;
  const padTop = 36;
  const padBottom = 28;
  const titleSize = 48;
  const siteNameSize = 24;
  const titleToSite = 10;
  const siteToSummary = 24;
  // まとめの枠：目標（到達型だけ）→ 1日の目安 → 2列の小さな数字
  const boxPad = 20;
  const goalSize = 24;
  const goalGap = 14;
  const quotaLabelSize = 22;
  const quotaSize = 52;
  const quotaGap = 8;
  const quotaToGrid = 18;
  const summaryLabelSize = 20;
  const summaryValueSize = 28;
  const summaryItemH = summaryLabelSize + 6 + summaryValueSize;
  const summaryRowGap = 20;
  const summaryRows = Math.ceil(Math.max(0, summaryCount) / 2);
  const gridH = summaryRows > 0 ? summaryRows * summaryItemH + (summaryRows - 1) * summaryRowGap : 0;
  const summaryHeight = boxPad
    + (hasGoal ? goalSize + goalGap : 0)
    + quotaLabelSize + quotaGap + quotaSize
    + (summaryRows > 0 ? quotaToGrid + gridH : 0)
    + boxPad;
  const summaryTop = padTop + titleSize + titleToSite + siteNameSize + siteToSummary;
  const summaryToTable = 24;
  const headerH = 48;
  const rowH = 46;
  const tableTop = summaryTop + summaryHeight + summaryToTable;
  const tableHeight = headerH + Math.max(0, rowCount) * rowH;
  const tableToFooter = 20;
  const footerSize = 22;
  const footerTop = tableTop + tableHeight + tableToFooter;
  const height = footerTop + footerSize + padBottom;
  return {
    width: TABLE_IMAGE_WIDTH,
    height,
    padX,
    padTop,
    titleSize,
    siteNameSize,
    summaryTop,
    summaryHeight,
    quotaLabelSize,
    quotaSize,
    goalSize,
    summaryLabelSize,
    summaryValueSize,
    summaryRows,
    summaryRowGap,
    tableTop,
    tableHeight,
    headerH,
    rowH,
    headerSize: 22,
    cellSize: 26,
    noteSize: 18,
    footerSize,
    footerTop,
  };
}

/** 保存するファイル名（イベントごと） */
export function scheduleImageFilename(slug: string): string {
  return `${slug}-schedule.png`;
}

// 文字が幅に入らないときは、入るまで小さくする（長いイベント名用）
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number, fontFamily: string): number {
  let current = size;
  ctx.font = `${weight} ${current}px ${fontFamily}`;
  while (current > 12 && ctx.measureText(text).width > maxWidth) {
    current -= 2;
    ctx.font = `${weight} ${current}px ${fontFamily}`;
  }
  return current;
}

/** 予定表をキャンバスに描く（1倍の座標）。呼び出し側で scale をかけてから渡す */
export function drawScheduleTableImage(ctx: CanvasRenderingContext2D, options: ScheduleImageOptions): void {
  const colors = TABLE_IMAGE_COLORS;
  const fontFamily = options.fontFamily ?? '"M PLUS Rounded 1c", sans-serif';
  const layout = getScheduleImageLayout(options.rows.length, options.summary.length, Boolean(options.goal));
  const innerW = layout.width - layout.padX * 2;
  const centerX = layout.width / 2;

  ctx.save();
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, 0, layout.width, layout.height);

  // 紙のカード
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = colors.paper;
  roundedRectPath(ctx, 20, 16, layout.width - 40, layout.height - 32, 28);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = colors.line;
  ctx.stroke();

  // タイトル（イベント名）とサイト名
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = colors.text;
  fitFont(ctx, options.eventName, 800, layout.titleSize, innerW, fontFamily);
  ctx.fillText(options.eventName, centerX, layout.padTop);
  ctx.fillStyle = colors.muted;
  ctx.font = `700 ${layout.siteNameSize}px ${fontFamily}`;
  ctx.fillText(`${TABLE_IMAGE_SITE_NAME}　${SCHEDULE_IMAGE_TITLE}`, centerX, layout.padTop + layout.titleSize + 10);

  // まとめの枠（白地に朱色の二重線。画面の「あなたの目標」と同じ雰囲気）
  const boxX = layout.padX;
  const boxY = layout.summaryTop;
  ctx.fillStyle = "#ffffff";
  roundedRectPath(ctx, boxX, boxY, innerW, layout.summaryHeight, 16);
  ctx.fill();
  ctx.strokeStyle = colors.red;
  ctx.lineWidth = 2;
  ctx.stroke();
  roundedRectPath(ctx, boxX + 5, boxY + 5, innerW - 10, layout.summaryHeight - 10, 12);
  ctx.lineWidth = 1;
  ctx.stroke();

  let y = boxY + 20;
  if (options.goal) {
    ctx.fillStyle = colors.text;
    fitFont(ctx, `目標：${options.goal}`, 800, layout.goalSize, innerW - 40, fontFamily);
    ctx.fillText(`目標：${options.goal}`, centerX, y);
    y += layout.goalSize + 14;
  }
  ctx.fillStyle = colors.text;
  ctx.font = `700 ${layout.quotaLabelSize}px ${fontFamily}`;
  ctx.fillText("1日の目安ポイント", centerX, y);
  y += layout.quotaLabelSize + 8;
  ctx.fillStyle = colors.red;
  fitFont(ctx, options.quota, 800, layout.quotaSize, innerW - 40, fontFamily);
  ctx.fillText(options.quota, centerX, y);
  y += layout.quotaSize + 18;

  // 小さな数字は2列で並べる
  const colW = (innerW - 40) / 2;
  options.summary.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const itemX = boxX + 20 + col * colW + colW / 2;
    const itemY = y + row * (layout.summaryLabelSize + 6 + layout.summaryValueSize + layout.summaryRowGap);
    ctx.fillStyle = colors.muted;
    ctx.font = `400 ${layout.summaryLabelSize}px ${fontFamily}`;
    ctx.fillText(item.label, itemX, itemY);
    ctx.fillStyle = colors.text;
    fitFont(ctx, item.value, 800, layout.summaryValueSize, colW - 12, fontFamily);
    ctx.fillText(item.value, itemX, itemY + layout.summaryLabelSize + 6);
  });

  drawTable(ctx, options.rows, layout, fontFamily);

  ctx.fillStyle = colors.muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `400 ${layout.footerSize}px ${fontFamily}`;
  ctx.fillText(TABLE_IMAGE_FOOTER, centerX, layout.footerTop);
  ctx.restore();
}

function drawTable(ctx: CanvasRenderingContext2D, rows: readonly ScheduleImageRow[], layout: ScheduleImageLayout, fontFamily: string) {
  const colors = TABLE_IMAGE_COLORS;
  const x = layout.padX;
  const y = layout.tableTop;
  const width = layout.width - layout.padX * 2;
  // 日付の列は「開始」「終了」の注意書きが入るので広めにする
  const colDate = Math.round(width * 0.4);
  const colTarget = Math.round(width * 0.3);
  const colCum = width - colDate - colTarget;
  const colWidths = [colDate, colTarget, colCum];
  const gridSoft = "rgba(242, 182, 50, 0.5)";

  // 見出し
  ctx.fillStyle = colors.yellow;
  ctx.fillRect(x, y, width, layout.headerH);
  ctx.fillStyle = colors.headerText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${layout.headerSize}px ${fontFamily}`;
  let headerX = x;
  SCHEDULE_IMAGE_HEADERS.forEach((label, i) => {
    ctx.fillText(label, headerX + colWidths[i] / 2, y + layout.headerH / 2);
    headerX += colWidths[i];
  });

  rows.forEach((row, rowIndex) => {
    const rowY = y + layout.headerH + rowIndex * layout.rowH;
    const midY = rowY + layout.rowH / 2;
    const isLast = rowIndex === rows.length - 1;
    ctx.fillStyle = row.highlight ? colors.highlight : isLast ? colors.highlight : rowIndex % 2 === 0 ? colors.rowOdd : colors.rowEven;
    ctx.fillRect(x, rowY, width, layout.rowH);

    // 日付（＋注意書き）は2つの文字を並べて、まとめて真ん中にする
    const dateWeight = row.highlight || isLast ? 800 : 700;
    ctx.font = `${dateWeight} ${layout.cellSize}px ${fontFamily}`;
    const dateW = ctx.measureText(row.date).width;
    ctx.font = `700 ${layout.noteSize}px ${fontFamily}`;
    const noteText = row.highlight ? [row.note, "今日"].filter(Boolean).join("・") : row.note ?? "";
    const noteW = noteText ? ctx.measureText(noteText).width + 8 : 0;
    const startX = x + (colDate - dateW - noteW) / 2;
    ctx.textAlign = "left";
    ctx.fillStyle = row.highlight ? colors.red : colors.text;
    ctx.font = `${dateWeight} ${layout.cellSize}px ${fontFamily}`;
    ctx.fillText(row.date, startX, midY);
    if (noteText) {
      ctx.fillStyle = row.highlight ? colors.red : colors.muted;
      ctx.font = `700 ${layout.noteSize}px ${fontFamily}`;
      ctx.fillText(noteText, startX + dateW + 8, midY + 1);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = colors.text;
    ctx.font = `${row.highlight || isLast ? 800 : 700} ${layout.cellSize}px ${fontFamily}`;
    ctx.fillText(row.target, x + colDate + colTarget / 2, midY);
    ctx.fillText(row.cumulative, x + colDate + colTarget + colCum / 2, midY);
  });

  const tableH = layout.tableHeight;
  // 本文の罫線（50%の黄色）
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridSoft;
  for (let r = 1; r < rows.length; r++) {
    const lineY = y + layout.headerH + r * layout.rowH + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x + width, lineY);
    ctx.stroke();
  }
  const colLines = [x + colDate, x + colDate + colTarget];
  colLines.forEach((lineX) => {
    ctx.beginPath();
    ctx.moveTo(lineX + 0.5, y + layout.headerH);
    ctx.lineTo(lineX + 0.5, y + tableH);
    ctx.stroke();
  });

  // 見出しの線と外枠（黄色）
  ctx.strokeStyle = colors.yellow;
  ctx.beginPath();
  ctx.moveTo(x, y + layout.headerH + 0.5);
  ctx.lineTo(x + width, y + layout.headerH + 0.5);
  ctx.stroke();
  colLines.forEach((lineX) => {
    ctx.beginPath();
    ctx.moveTo(lineX + 0.5, y);
    ctx.lineTo(lineX + 0.5, y + layout.headerH);
    ctx.stroke();
  });
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, width - 2, tableH - 2);

  // 今日の行の赤枠は、罫線の上に描く
  const todayIndex = rows.findIndex((row) => row.highlight);
  if (todayIndex >= 0) {
    const rowY = y + layout.headerH + todayIndex * layout.rowH;
    ctx.strokeStyle = colors.red;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, rowY + 1.5, width - 3, layout.rowH - 3);
  }
}

export async function renderScheduleTablePngBlob(options: ScheduleImageOptions): Promise<Blob> {
  const { width, height } = getScheduleImageLayout(options.rows.length, options.summary.length, Boolean(options.goal));
  return renderCanvasPng(
    width,
    height,
    TABLE_IMAGE_SCALE,
    (ctx, fontFamily) => drawScheduleTableImage(ctx, { ...options, fontFamily }),
    options.fontFamily,
  );
}

/** iPhoneでは共有シートから保存。それ以外はファイルとして保存する */
export async function saveScheduleImage(blob: Blob, filename: string) {
  return savePngImage(blob, filename, SCHEDULE_IMAGE_TITLE);
}
