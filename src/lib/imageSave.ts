// 作った画像（PNG）を端末に保存する共通の仕組み
// 絵巻守Lv早見表とイベントノルマ計算の両方で使う

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
export async function savePngImage(blob: Blob, filename: string, title: string): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: "image/png" });
  if (isAppleTouchDevice() && canShareFiles([file])) {
    try {
      await navigator.share({ files: [file], title });
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

/** キャンバスをPNGにする。フォントの読み込みを待ってから描く */
export async function renderCanvasPng(
  width: number,
  height: number,
  scale: number,
  draw: (ctx: CanvasRenderingContext2D, fontFamily: string) => void,
  fontFamily?: string,
): Promise<Blob> {
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
  const family = fontFamily
    ?? (typeof document !== "undefined" ? getComputedStyle(document.body).fontFamily : '"M PLUS Rounded 1c", sans-serif');
  draw(ctx, family);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) {
    throw new Error("画像を作れませんでした");
  }
  return blob;
}

/** 角の丸い四角の線を作る（塗る・線を引くは呼び出し側） */
export function roundedRectPath(
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
