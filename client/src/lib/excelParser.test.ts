/**
 * Tests for the Excel parser (client-side)
 * Covers: parseExcelBuffer, parseExcelFile, cell style extraction
 */
import { describe, it, expect, vi } from "vitest";
import * as XLSX from "xlsx";
import { parseExcelBuffer, parseExcelFile } from "./excelParser";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeWorkbookBuffer(sheets: Record<string, any[][]>): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return raw as ArrayBuffer;
}

// ─── parseExcelBuffer ─────────────────────────────────────────────────────────

describe("parseExcelBuffer", () => {
  it("parses a single-sheet workbook correctly", () => {
    const buf = makeWorkbookBuffer({
      Sheet1: [
        ["Name", "Age", "City"],
        ["Alice", 30, "London"],
        ["Bob", 25, "Paris"],
      ],
    });

    const result = parseExcelBuffer(buf, "test.xlsx");

    expect(result.filename).toBe("test.xlsx");
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].name).toBe("Sheet1");
    expect(result.sheets[0].columns).toEqual(["Name", "Age", "City"]);
    expect(result.sheets[0].data).toHaveLength(2);
    expect(result.sheets[0].data[0]).toEqual(["Alice", 30, "London"]);
    expect(result.sheets[0].data[1]).toEqual(["Bob", 25, "Paris"]);
  });

  it("parses a multi-sheet workbook", () => {
    const buf = makeWorkbookBuffer({
      Sales: [
        ["Product", "Revenue"],
        ["Widget", 1000],
      ],
      Costs: [
        ["Item", "Amount"],
        ["Rent", 500],
      ],
    });

    const result = parseExcelBuffer(buf, "multi.xlsx");

    expect(result.sheets).toHaveLength(2);
    expect(result.sheets[0].name).toBe("Sales");
    expect(result.sheets[1].name).toBe("Costs");
  });

  it("returns empty data array for header-only sheet", () => {
    const buf = makeWorkbookBuffer({
      Empty: [["Col1", "Col2", "Col3"]],
    });

    const result = parseExcelBuffer(buf, "empty.xlsx");

    expect(result.sheets[0].columns).toEqual(["Col1", "Col2", "Col3"]);
    expect(result.sheets[0].data).toHaveLength(0);
  });

  it("pads short rows to match column count", () => {
    const buf = makeWorkbookBuffer({
      Sheet1: [
        ["A", "B", "C"],
        ["only-a"],
      ],
    });

    const result = parseExcelBuffer(buf, "padded.xlsx");
    const row = result.sheets[0].data[0];

    expect(row).toHaveLength(3);
    expect(row[1]).toBe("");
    expect(row[2]).toBe("");
  });

  it("initialises cellStyles and headerStyles arrays", () => {
    const buf = makeWorkbookBuffer({
      Sheet1: [
        ["H1", "H2"],
        ["v1", "v2"],
      ],
    });

    const result = parseExcelBuffer(buf, "styles.xlsx");
    const sheet = result.sheets[0];

    expect(Array.isArray(sheet.cellStyles)).toBe(true);
    expect(Array.isArray(sheet.headerStyles)).toBe(true);
    expect(sheet.headerStyles).toHaveLength(2);
    expect(sheet.cellStyles).toHaveLength(1);
  });

  it("handles numeric and boolean cell values", () => {
    const buf = makeWorkbookBuffer({
      Sheet1: [
        ["Num", "Bool"],
        [42, true],
      ],
    });

    const result = parseExcelBuffer(buf, "types.xlsx");
    expect(result.sheets[0].data[0][0]).toBe(42);
  });
});

// ─── parseExcelFile ───────────────────────────────────────────────────────────

describe("parseExcelFile", () => {
  it("reads a File object and returns ParsedData", async () => {
    const buf = makeWorkbookBuffer({
      Data: [
        ["X", "Y"],
        [1, 2],
      ],
    });

    // jsdom's File doesn't implement arrayBuffer(); polyfill it for this test.
    const file = new File([buf], "data.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    if (!file.arrayBuffer) {
      (file as any).arrayBuffer = () => Promise.resolve(buf);
    }

    const result = await parseExcelFile(file);

    expect(result.filename).toBe("data.xlsx");
    expect(result.sheets[0].columns).toEqual(["X", "Y"]);
    expect(result.sheets[0].data[0]).toEqual([1, 2]);
  });
});
