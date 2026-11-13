import type { LevelTableRow } from "@/lib/emakiLevel";

/** 画像のタイトル（ページ名） */
export const TABLE_IMAGE_TITLE = "絵巻守Lv 経験値表";

/** 画像フッターに小さく入れるサイトURL */
export const TABLE_IMAGE_FOOTER = "www.pazugiri-index.com";

export const TABLE_IMAGE_SITE_NAME = "ぱずぎり目録";

export const TABLE_IMAGE_COLUMNS = 2;

/** 1倍サイズ。実際のPNGはこれの2倍で描いて、きれいに見せる */
export const TABLE_IMAGE_WIDTH = 1200;
export const TABLE_IMAGE_SCALE = 2;

export const TABLE_IMAGE_COLORS = {
  cream: "#fffaf0",
  paper: "#fffdf8",
  line: "#dfd4bf",
  yellow: "#f2b632",
  red: "#b65344",
  text: "#3b3b3b",
  muted: "#7a6f5d",
  headerText: "#ffffff",
  rowOdd: "#ffffff",
  rowEven: "#fffbea",
  highlight: "#fff2c4",
  shadow: "rgba(90, 70, 48, 0.18)",
} as const;

export type EmakiTableImageRow = Pick<LevelTableRow, "level" | "cumulativeToNext" | "need">;

export type EmakiTableImageOptions = {
  rows: readonly EmakiTableImageRow[];
  highlightLevel?: number | null;
  fontFamily?: string;
  siteName?: string;
};

export type TableImageLayout = {
  width: number;
  height: number;
  padX: number;
  padTop: number;
  padBottom: number;
  titleSize: number;
  siteNameSize: number;
  footerSize: number;
  headerH: number;
  rowH: number;
  colGap: number;
  titleToSite: number;
  siteToTable: number;
  tableToFooter: number;
  rowsPerColumn: number;
  columnCount: number;
  tableTop: number;
  tableHeight: number;
};

/** 表の行を左から列に分ける。50行・2列なら Lv1〜25 と Lv26〜50 */
export function splitTableColumns<T>(rows: readonly T[], columnCount: number): T[][] {
  const count = Math.max(1, Math.floor(columnCount));
  const size = Math.ceil(rows.length / count);
  const columns: T[][] = [];
  for (let i = 0; i < count; i++) {
    columns.push(rows.slice(i * size, (i + 1) * size) as T[]);
  }
  return columns;
}

export function tableImageFilename(highlightLevel?: number | null): string {
  if (typeof highlightLevel === "number" && Number.isInteger(highlightLevel) && highlightLevel >= 1) {
    return `emaki-level-table-lv${highlightLevel}.png`;
  }
  return "emaki-level-table.png";
}


export function canShareFiles(files: File[]): boolean {
  return typeof navigator !== "undefined"
    && typeof navigator.canShare === "function"
    && navigator.canShare({ files });
}

/** iPhone / iPad。保存時に download が効かないことがあるので共有シートを使う判定 */
export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iP(hone|ad|od)/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function getTableImageLayout(
  rowCount: number,
  columnCount: number = TABLE_IMAGE_COLUMNS,
): TableImageLayout {
  const columns = Math.max(1, columnCount);
  const rowsPerColumn = Math.max(1, Math.ceil(rowCount / columns));
  const padX = 48;
  const padTop = 40;
  const padBottom = 32;
  const titleSize = 44;
  const siteNameSize = 20;
  const footerSize = 18;
  const headerH = 40;
  const rowH = 32;
  const colGap = 24;
  const titleToSite = 10;
  const siteToTable = 28;
  const tableToFooter = 22;
  const tableHeight = headerH + rowsPerColumn * rowH;
  const tableTop = padTop + titleSize + titleToSite + siteNameSize + siteToTable;
  const height = tableTop + tableHeight + tableToFooter + footerSize + padBottom;
  return {
    width: TABLE_IMAGE_WIDTH,
    height,
    padX,
    padTop,
    padBottom,
    titleSize,
    siteNameSize,
    footerSize,
    headerH,
    rowH,
    colGap,
    titleToSite,
    siteToTable,
    tableToFooter,
    rowsPerColumn,
    columnCount: columns,
    tableTop,
    tableHeight,
  };
}

export function getTableImageSize(rowCount: number): { width: number; height: number } {
  const { width, height } = getTableImageLayout(rowCount);
  return { width, height };
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function formatInt(value: number): string {
  return value.toLocaleString("ja-JP");
}

/**
 * 経験値表をキャンバスに描く（1倍の座標）。
 * 呼び出し側で scale をかけてから渡す。
 */
export function drawEmakiTableImage(
  ctx: CanvasRenderingContext2D,
  options: EmakiTableImageOptions,
): void {
  const rows = options.rows;
  const layout = getTableImageLayout(rows.length);
  const colors = TABLE_IMAGE_COLORS;
  const fontFamily = options.fontFamily ?? '"M PLUS Rounded 1c", sans-serif';
  const siteName = options.siteName ?? TABLE_IMAGE_SITE_NAME;
  const highlightLevel = options.highlightLevel ?? null;
  const columns = splitTableColumns(rows, layout.columnCount);

  ctx.save();
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, 0, layout.width, layout.height);

  // 紙のカード
  const cardX = 20;
  const cardY = 16;
  const cardW = layout.width - 40;
  const cardH = layout.height - 32;
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = colors.paper;
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = colors.line;
  ctx.stroke();

  ctx.fillStyle = colors.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `800 ${layout.titleSize}px ${fontFamily}`;
  ctx.fillText(TABLE_IMAGE_TITLE, layout.width / 2, layout.padTop);

  ctx.fillStyle = colors.muted;
  ctx.font = `700 ${layout.siteNameSize}px ${fontFamily}`;
  ctx.fillText(siteName, layout.width / 2, layout.padTop + layout.titleSize + layout.titleToSite);

  const tablesWidth = layout.width - layout.padX * 2;
  const tableWidth = (tablesWidth - layout.colGap * (layout.columnCount - 1)) / layout.columnCount;

  columns.forEach((columnRows, columnIndex) => {
    const tableX = layout.padX + columnIndex * (tableWidth + layout.colGap);
    drawOneTable(ctx, {
      x: tableX,
      y: layout.tableTop,
      width: tableWidth,
      rows: columnRows,
      layout,
      fontFamily,
      highlightLevel,
    });
  });

  ctx.fillStyle = colors.muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `400 ${layout.footerSize}px ${fontFamily}`;
  ctx.fillText(
    TABLE_IMAGE_FOOTER,
    layout.width / 2,
    layout.tableTop + layout.tableHeight + layout.tableToFooter,
  );
  ctx.restore();
}

function drawOneTable(
  ctx: CanvasRenderingContext2D,
  args: {
    x: number;
    y: number;
    width: number;
    rows: EmakiTableImageRow[];
    layout: TableImageLayout;
    fontFamily: string;
    highlightLevel: number | null;
  },
) {
  const { x, y, width, rows, layout, fontFamily, highlightLevel } = args;
  const colors = TABLE_IMAGE_COLORS;
  const colLv = Math.round(width * 0.2);
  const colNeed = Math.round(width * 0.32);
  const colCum = width - colLv - colNeed;
  const headers = ["Lv", "次の累計", "必要"];
  const colWidths = [colLv, colCum, colNeed];

  // ヘッダー
  ctx.fillStyle = colors.yellow;
  ctx.fillRect(x, y, width, layout.headerH);
  ctx.strokeStyle = colors.yellow;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, width - 2, layout.headerH + rows.length * layout.rowH - 2);

  ctx.fillStyle = colors.headerText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 16px ${fontFamily}`;
  let headerX = x;
  headers.forEach((label, i) => {
    ctx.fillText(label, headerX + colWidths[i] / 2, y + layout.headerH / 2);
    headerX += colWidths[i];
  });

  rows.forEach((row, rowIndex) => {
    const rowY = y + layout.headerH + rowIndex * layout.rowH;
    const isHighlight = highlightLevel === row.level;
    ctx.fillStyle = isHighlight ? colors.highlight : rowIndex % 2 === 0 ? colors.rowOdd : colors.rowEven;
    ctx.fillRect(x, rowY, width, layout.rowH);

    if (isHighlight) {
      ctx.strokeStyle = colors.red;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, rowY + 1.5, width - 3, layout.rowH - 3);
    }

    const values = [String(row.level), formatInt(row.cumulativeToNext), formatInt(row.need)];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let cellX = x;
    values.forEach((value, i) => {
      if (i === 0) {
        ctx.fillStyle = isHighlight ? colors.red : colors.text;
        ctx.font = `800 16px ${fontFamily}`;
        if (isHighlight) {
          // 数字を少し左に寄せて、右に「いまここ」の印を置く
          ctx.fillText(value, cellX + colWidths[i] / 2 - 18, rowY + layout.rowH / 2);
          const badgeW = 44;
          const badgeH = 16;
          const badgeX = cellX + colWidths[i] - badgeW - 6;
          const badgeY = rowY + (layout.rowH - badgeH) / 2;
          ctx.fillStyle = colors.red;
          roundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 8);
          ctx.fill();
          ctx.fillStyle = colors.headerText;
          ctx.font = `800 10px ${fontFamily}`;
          ctx.fillText("いまここ", badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);
        } else {
          ctx.fillText(value, cellX + colWidths[i] / 2, rowY + layout.rowH / 2);
        }
      } else {
        ctx.fillStyle = colors.text;
        ctx.font = `${isHighlight ? "800" : "700"} 16px ${fontFamily}`;
        ctx.fillText(value, cellX + colWidths[i] / 2, rowY + layout.rowH / 2);
      }
      cellX += colWidths[i];
    });
  });

  // 列の薄い区切り
  ctx.strokeStyle = "rgba(242, 182, 50, 0.45)";
  ctx.lineWidth = 1;
  let gridX = x + colLv;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(gridX, y);
    ctx.lineTo(gridX, y + layout.headerH + rows.length * layout.rowH);
    ctx.stroke();
    gridX += i === 0 ? colCum : colNeed;
  }
}

export async function renderEmakiTablePngBlob(options: EmakiTableImageOptions): Promise<Blob> {
  const { width, height } = getTableImageSize(options.rows.length);
  const scale = TABLE_IMAGE_SCALE;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("画像を描く準備ができませんでした");
  }
  ctx.scale(scale, scale);
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // フォント待ちに失敗しても、端末の文字で描く
    }
  }
  const fontFamily = options.fontFamily
    ?? (typeof document !== "undefined" ? getComputedStyle(document.body).fontFamily : '"M PLUS Rounded 1c", sans-serif');
  drawEmakiTableImage(ctx, { ...options, fontFamily });
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) {
    throw new Error("画像を作れませんでした");
  }
  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** iPhoneでは共有シートから保存。それ以外はファイルとして保存する */
export async function savePngBlob(blob: Blob, filename: string): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: "image/png" });
  if (isAppleTouchDevice() && canShareFiles([file])) {
    try {
      await navigator.share({ files: [file], title: TABLE_IMAGE_TITLE });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return "shared";
      }
    }
  }
  downloadBlob(blob, filename);
  return "downloaded";
}

