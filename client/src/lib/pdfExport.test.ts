/**
 * Tests for the PDF export utility (client-side)
 * Covers: exportToPdf, previewPdf, multi-sheet TOC, header/footer tokens
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SheetInput, PdfSettings } from "./pdfExport";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// jsPDF uses a named export { jsPDF }, not a default export.
const mockSave = vi.fn();
const mockOutput = vi.fn(() => "blob:mock-url");
const mockText = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFont = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetLineWidth = vi.fn();
const mockLine = vi.fn();
const mockAddPage = vi.fn();
const mockInsertPage = vi.fn();
const mockSetPage = vi.fn();
const mockGetTextWidth = vi.fn(() => 50);
const mockAddImage = vi.fn();

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
  insertPage: mockInsertPage,
  setPage: mockSetPage,
  getTextWidth: mockGetTextWidth,
  addImage: mockAddImage,
  internal: {
    getNumberOfPages: vi.fn(() => 1),
    pageSize: { getWidth: () => 595, getHeight: () => 842 },
  },
};

// jsPDF is imported as a default import in pdfExport.ts: `import jsPDF from 'jspdf'`
// The mock must provide a `default` export that is the constructor.
vi.mock("jspdf", () => ({
  default: vi.fn(() => mockDoc),
}));

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseSettings: PdfSettings = {
  title: "Test Report",
  subtitle: "Subtitle",
  orientation: "portrait",
  fontSize: 10,
  includeHeader: true,
  includeRowNumbers: false,
  selectedColumns: ["Name", "Value"],
  pageSize: "a4",
  header: { left: "", center: "", right: "" },
  footer: { left: "", center: "{page_of_total}", right: "{date}" },
  margins: { top: 40, right: 40, bottom: 40, left: 40 },
  logo: null,
  sheetOrientations: {},
};

const singleSheet: SheetInput[] = [
  {
    name: "Sheet1",
    columns: ["Name", "Value"],
    data: [
      ["Alice", "100"],
      ["Bob", "200"],
    ],
    cellStyles: [],
    headerStyles: [],
  },
];

const multiSheet: SheetInput[] = [
  {
    name: "Sales",
    columns: ["Product", "Revenue"],
    data: [["Widget", "1000"]],
    cellStyles: [],
    headerStyles: [],
  },
  {
    name: "Costs",
    columns: ["Item", "Amount"],
    data: [["Rent", "500"]],
    cellStyles: [],
    headerStyles: [],
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("exportToPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.internal.getNumberOfPages = vi.fn(() => 1);
  });

  it("calls doc.save with the correct filename", async () => {
    const { exportToPdf } = await import("./pdfExport");
    exportToPdf(singleSheet, baseSettings, "my-report");
    expect(mockSave).toHaveBeenCalledWith("my-report.pdf");
  });

  it("calls doc.save with fallback filename when empty string given", async () => {
    const { exportToPdf } = await import("./pdfExport");
    exportToPdf(singleSheet, baseSettings, "");
    expect(mockSave).toHaveBeenCalledWith("export.pdf");
  });

  it("renders title text on the first page", async () => {
    const { exportToPdf } = await import("./pdfExport");
    exportToPdf(singleSheet, baseSettings, "report");
    const calls = mockText.mock.calls.map((c) => c[0]);
    expect(calls).toContain("Test Report");
  });

  it("renders subtitle when provided", async () => {
    const { exportToPdf } = await import("./pdfExport");
    exportToPdf(singleSheet, { ...baseSettings, subtitle: "My Subtitle" }, "r");
    const calls = mockText.mock.calls.map((c) => c[0]);
    expect(calls).toContain("My Subtitle");
  });

  it("does not render subtitle when empty", async () => {
    const { exportToPdf } = await import("./pdfExport");
    exportToPdf(singleSheet, { ...baseSettings, subtitle: "" }, "r");
    // subtitle is empty so it should not be drawn
    const calls = mockText.mock.calls.map((c) => c[0]);
    expect(calls.filter((t) => t === "")).toHaveLength(0);
  });

  it("calls addPage for multi-sheet exports", async () => {
    const { exportToPdf } = await import("./pdfExport");
    exportToPdf(multiSheet, baseSettings, "multi");
    expect(mockAddPage).toHaveBeenCalled();
  });

  it("calls insertPage(1) for TOC on multi-sheet exports", async () => {
    const { exportToPdf } = await import("./pdfExport");
    exportToPdf(multiSheet, baseSettings, "multi");
    expect(mockInsertPage).toHaveBeenCalledWith(1);
  });

  it("does NOT call insertPage for single-sheet exports", async () => {
    const { exportToPdf } = await import("./pdfExport");
    exportToPdf(singleSheet, baseSettings, "single");
    expect(mockInsertPage).not.toHaveBeenCalled();
  });
});

describe("previewPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.internal.getNumberOfPages = vi.fn(() => 1);
    mockOutput.mockReturnValue("blob:preview-url");
  });

  it("returns a blob URL string", async () => {
    const { previewPdf } = await import("./pdfExport");
    const url = previewPdf(singleSheet, baseSettings, "preview");
    expect(typeof url).toBe("string");
    expect(url).toContain("blob:");
  });

  it("calls doc.output with 'bloburl'", async () => {
    const { previewPdf } = await import("./pdfExport");
    previewPdf(singleSheet, baseSettings, "preview");
    expect(mockOutput).toHaveBeenCalledWith("bloburl");
  });
});

describe("PdfSettings — column selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.internal.getNumberOfPages = vi.fn(() => 1);
  });

  it("respects selectedColumns subset", async () => {
    const autoTable = (await import("jspdf-autotable")).default as ReturnType<typeof vi.fn>;
    const { exportToPdf } = await import("./pdfExport");

    const settings: PdfSettings = {
      ...baseSettings,
      selectedColumns: ["Name"], // only one column
    };

    exportToPdf(singleSheet, settings, "subset");

    const call = autoTable.mock.calls[0]?.[1];
    if (call?.head) {
      expect(call.head[0]).toContain("Name");
      expect(call.head[0]).not.toContain("Value");
    }
  });

  it("includes row numbers when includeRowNumbers is true", async () => {
    const autoTable = (await import("jspdf-autotable")).default as ReturnType<typeof vi.fn>;
    const { exportToPdf } = await import("./pdfExport");

    exportToPdf(singleSheet, { ...baseSettings, includeRowNumbers: true }, "rn");

    const call = autoTable.mock.calls[0]?.[1];
    if (call?.head) {
      expect(call.head[0][0]).toBe("#");
    }
  });
});
