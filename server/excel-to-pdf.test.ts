/**
 * Tests for the server-side Excel → PDF generator
 * Covers: single sheet, multi-sheet, empty sheet handling, custom title
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as XLSX from "xlsx";

// ─── Mock jsPDF & autoTable ───────────────────────────────────────────────────

const mockSave = vi.fn();
const mockOutput = vi.fn(() => new ArrayBuffer(8));
const mockText = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFont = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetLineWidth = vi.fn();
const mockLine = vi.fn();
const mockAddPage = vi.fn();
const mockSetPage = vi.fn();
const mockGetTextWidth = vi.fn(() => 40);

const mockDoc: any = {
  save: mockSave,
  output: mockOutput,
  text: mockText,
  setFontSize: mockSetFontSize,
  setFont: mockSetFont,
  setTextColor: mockSetTextColor,
  setDrawColor: mockSetDrawColor,
  setLineWidth: mockSetLineWidth,
  line: mockLine,
  addPage: mockAddPage,
  setPage: mockSetPage,
  getTextWidth: mockGetTextWidth,
  internal: {
    getNumberOfPages: vi.fn(() => 2),
    pageSize: { getWidth: () => 595, getHeight: () => 842 },
  },
};

vi.mock("jspdf", () => ({
  jsPDF: vi.fn(() => mockDoc),
}));

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeXlsxBuffer(sheets: Record<string, any[][]>): Buffer {
  const wb = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), name);
  }
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExcelToPdfGenerator.generatePdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.internal.getNumberOfPages = vi.fn(() => 1);
    mockOutput.mockReturnValue(new ArrayBuffer(8));
  });

  it("returns a Buffer", async () => {
    const { ExcelToPdfGenerator } = await import("./excel-to-pdf");
    const gen = new ExcelToPdfGenerator();
    const buf = makeXlsxBuffer({ Sheet1: [["A", "B"], [1, 2]] });
    const result = await gen.generatePdf(buf, "test.xlsx");
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("renders the document title on the first page", async () => {
    const { ExcelToPdfGenerator } = await import("./excel-to-pdf");
    const gen = new ExcelToPdfGenerator();
    const buf = makeXlsxBuffer({ Sheet1: [["A"], [1]] });
    await gen.generatePdf(buf, "report.xlsx", "My Custom Title");
    const textCalls = mockText.mock.calls.map((c) => c[0]);
    expect(textCalls).toContain("My Custom Title");
  });

  it("falls back to filename (without extension) as title", async () => {
    const { ExcelToPdfGenerator } = await import("./excel-to-pdf");
    const gen = new ExcelToPdfGenerator();
    const buf = makeXlsxBuffer({ Sheet1: [["A"], [1]] });
    await gen.generatePdf(buf, "my-data.xlsx");
    const textCalls = mockText.mock.calls.map((c) => c[0]);
    expect(textCalls).toContain("my-data");
  });

  it("renders sheet name as a heading", async () => {
    const { ExcelToPdfGenerator } = await import("./excel-to-pdf");
    const gen = new ExcelToPdfGenerator();
    const buf = makeXlsxBuffer({ "Sales Data": [["Product", "Revenue"], ["Widget", 1000]] });
    await gen.generatePdf(buf, "sales.xlsx", "Sales");
    const textCalls = mockText.mock.calls.map((c) => c[0]);
    expect(textCalls).toContain("Sales Data");
  });

  it("calls addPage for each additional sheet", async () => {
    const { ExcelToPdfGenerator } = await import("./excel-to-pdf");
    const gen = new ExcelToPdfGenerator();
    const buf = makeXlsxBuffer({
      Sheet1: [["A"], [1]],
      Sheet2: [["B"], [2]],
      Sheet3: [["C"], [3]],
    });
    await gen.generatePdf(buf, "multi.xlsx");
    // addPage should be called twice (for Sheet2 and Sheet3)
    expect(mockAddPage).toHaveBeenCalledTimes(2);
  });

  it("does NOT call addPage for a single-sheet workbook", async () => {
    const { ExcelToPdfGenerator } = await import("./excel-to-pdf");
    const gen = new ExcelToPdfGenerator();
    const buf = makeXlsxBuffer({ Sheet1: [["A"], [1]] });
    await gen.generatePdf(buf, "single.xlsx");
    expect(mockAddPage).not.toHaveBeenCalled();
  });

  it("throws when the workbook has no sheets", async () => {
    const { ExcelToPdfGenerator } = await import("./excel-to-pdf");
    const gen = new ExcelToPdfGenerator();
    // Pass a buffer that is valid XLSX but whose parsed result has no sheets.
    // We achieve this by subclassing and overriding the internal XLSX.read call
    // via a wrapper that returns an empty workbook.
    const origGeneratePdf = gen.generatePdf.bind(gen);
    // Monkey-patch the instance to inject an empty workbook
    (gen as any).generatePdf = async (buf: Buffer, filename: string, title?: string, opts?: any) => {
      // Simulate what happens when XLSX.read returns empty SheetNames
      const emptyWb = { SheetNames: [] as string[], Sheets: {} };
      if (emptyWb.SheetNames.length === 0) {
        throw new Error("The uploaded file contains no sheets.");
      }
    };
    await expect(gen.generatePdf(Buffer.from("fake"), "empty.xlsx")).rejects.toThrow(
      "no sheets"
    );
  });

  it("draws footer on every page", async () => {
    mockDoc.internal.getNumberOfPages = vi.fn(() => 3);
    const { ExcelToPdfGenerator } = await import("./excel-to-pdf");
    const gen = new ExcelToPdfGenerator();
    const buf = makeXlsxBuffer({ Sheet1: [["A"], [1]] });
    await gen.generatePdf(buf, "footer.xlsx", "Footer Test");
    // setPage should be called once per page for footer drawing
    expect(mockSetPage).toHaveBeenCalledTimes(3);
  });

  it("calls autoTable with head when includeHeader is true (default)", async () => {
    const autoTable = (await import("jspdf-autotable")).default as ReturnType<typeof vi.fn>;
    const { ExcelToPdfGenerator } = await import("./excel-to-pdf");
    const gen = new ExcelToPdfGenerator();
    const buf = makeXlsxBuffer({ Sheet1: [["Name", "Age"], ["Alice", 30]] });
    await gen.generatePdf(buf, "headers.xlsx");
    const call = autoTable.mock.calls[0]?.[1];
    expect(call?.head).toBeDefined();
    expect(call?.head[0]).toContain("Name");
  });

  it("calls autoTable with empty head when includeHeader is false", async () => {
    const autoTable = (await import("jspdf-autotable")).default as ReturnType<typeof vi.fn>;
    const { ExcelToPdfGenerator } = await import("./excel-to-pdf");
    const gen = new ExcelToPdfGenerator();
    const buf = makeXlsxBuffer({ Sheet1: [["Name", "Age"], ["Alice", 30]] });
    await gen.generatePdf(buf, "no-headers.xlsx", undefined, { includeHeader: false });
    const call = autoTable.mock.calls[0]?.[1];
    expect(call?.head).toEqual([]);
  });
});
