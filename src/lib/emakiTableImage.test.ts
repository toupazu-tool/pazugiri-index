import { describe, expect, it } from "vitest";
import {
  TABLE_IMAGE_COLUMNS,
  TABLE_IMAGE_FOOTER,
  TABLE_IMAGE_HEADERS,
  TABLE_IMAGE_TITLE,
  TABLE_IMAGE_WIDTH,
  getTableImageLayout,
  getTableImageSize,
  splitTableColumns,
  tableImageFilename,
} from "./emakiTableImage";

describe("splitTableColumns", () => {
  it("50行を2列にすると Lv1〜25 と Lv26〜50 になる", () => {
    const rows = Array.from({ length: 50 }, (_, i) => i + 1);
    const [left, right] = splitTableColumns(rows, 2);
    expect(left).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    expect(right).toEqual(Array.from({ length: 25 }, (_, i) => i + 26));
  });

  it("割り切れないときは前の列が多くなる", () => {
    const [left, right] = splitTableColumns([1, 2, 3, 4, 5], 2);
    expect(left).toEqual([1, 2, 3]);
    expect(right).toEqual([4, 5]);
  });

  it("1列のときは全部が左に入る", () => {
    expect(splitTableColumns([1, 2, 3], 1)).toEqual([[1, 2, 3]]);
  });
});

describe("tableImageFilename", () => {
  it("通常版のファイル名を返す", () => {
    expect(tableImageFilename()).toBe("emaki-level-table.png");
    expect(tableImageFilename(null)).toBe("emaki-level-table.png");
  });

  it("強調するレベルがあるときはファイル名に入れる", () => {
    expect(tableImageFilename(24)).toBe("emaki-level-table-lv24.png");
  });
});


describe("getTableImageSize", () => {
  it("2列の50行表が決まった大きさになる", () => {
    const size = getTableImageSize(50);
    const layout = getTableImageLayout(50, TABLE_IMAGE_COLUMNS);
    expect(size).toEqual({ width: TABLE_IMAGE_WIDTH, height: layout.height });
    expect(layout.rowsPerColumn).toBe(25);
    expect(size.width).toBe(1200);
    expect(size.height).toBeGreaterThan(900);
    expect(TABLE_IMAGE_TITLE).toBe("絵巻守Lv早見表");
    expect(TABLE_IMAGE_FOOTER).toBe("www.pazugiri-index.com");
    expect(TABLE_IMAGE_HEADERS).toEqual(["Lv", "レベル累計", "必要経験値"]);
  });
});
