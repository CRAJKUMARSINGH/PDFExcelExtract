/**
 * Server-side Excel → PDF generator
 *
 * Uses the `xlsx` library to parse the workbook and `jspdf` + `jspdf-autotable`
 * to render each sheet as a table in a PDF document.
 *
 * jsPDF works in Node.js as well as the browser, so no extra dependencies are
 * needed beyond what is already in package.json.
 */

import * as XLSX from "xlsx";
// jsPDF ships CJS + ESM; the default export is the constructor.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExcelToPdfOptions {
  /** Document title printed at the top of the first page */
  title?: string;
  /** Page orientation */
  orientation?: "portrait" | "landscape";
  /** Page size */
  pageSize?: "a4" | "a3" | "letter" | "legal";
  /** Body font size in pt */
  fontSize?: number;
  /** Whether to include a header row in each table */
  includeHeader?: boolean;
}

export class ExcelToPdfGenerator {
  /**
   * Parse an Excel/CSV buffer and render every sheet as a table in a PDF.
   * Returns the PDF as a Node.js Buffer.
   */
  async generatePdf(
    fileBuffer: Buffer,
    filename: string,
    title?: string,
    options: ExcelToPdfOptions = {}
  ): Promise<Buffer> {
    const {
      orientation = "portrait",
      pageSize = "a4",
      fontSize = 9,
      includeHeader = true,
    } = options;

    const docTitle = title || filename.replace(/\.[^/.]+$/, "");

    // ── Parse workbook ──────────────────────────────────────────────────────
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    if (workbook.SheetNames.length === 0) {
      throw new Error("The uploaded file contains no sheets.");
    }

    // ── Build PDF ───────────────────────────────────────────────────────────
    const doc = new jsPDF({ orientation, unit: "pt", format: pageSize });
    const margins = { top: 50, right: 40, bottom: 50, left: 40 };
    const date = new Date().toLocaleDateString();

    let isFirstSheet = true;

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const json: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      if (json.length === 0) continue;

      if (!isFirstSheet) {
        doc.addPage(pageSize, orientation);
      }

      const pw = doc.internal.pageSize.getWidth();
      const leftX = margins.left;
      let curY = margins.top;

      // Title (first sheet only)
      if (isFirstSheet) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(20, 20, 30);
        doc.text(docTitle, leftX, curY);
        curY += 22;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(`Generated: ${date}`, leftX, curY);
        curY += 18;
      }

      // Sheet name heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(sheetName, leftX, curY);
      const headW = doc.getTextWidth(sheetName);
      doc.setDrawColor(80);
      doc.setLineWidth(0.5);
      doc.line(leftX, curY + 2, leftX + headW, curY + 2);
      curY += 16;

      // Build table data
      const headers = includeHeader ? (json[0] as string[]).map(String) : [];
      const body = (includeHeader ? json.slice(1) : json).map((row) =>
        row.map((cell: any) => (cell !== null && cell !== undefined ? String(cell) : ""))
      );

      autoTable(doc, {
        startY: curY,
        head: includeHeader ? [headers] : [],
        body,
        styles: { fontSize, cellPadding: 4, font: "helvetica", overflow: "linebreak" },
        headStyles: {
          fillColor: [20, 20, 30],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 245, 248] },
        margin: { top: margins.top, right: margins.right, bottom: margins.bottom, left: margins.left },
      });

      isFirstSheet = false;
    }

    // ── Footer on every page ────────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const footerY = ph - margins.bottom + 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.setDrawColor(200);
      doc.setLineWidth(0.4);
      doc.line(margins.left, footerY - 6, pw - margins.right, footerY - 6);
      doc.text(docTitle, margins.left, footerY);
      doc.text(`Page ${i} of ${totalPages}`, pw - margins.right, footerY, { align: "right" });
      doc.text(date, pw / 2, footerY, { align: "center" });
    }

    // ── Return as Buffer ────────────────────────────────────────────────────
    const arrayBuffer: ArrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  }
}

export const excelToPdfGenerator = new ExcelToPdfGenerator();
