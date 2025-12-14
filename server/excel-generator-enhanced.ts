import * as XLSX from 'xlsx';
import { storage } from './storage';
import type { ExtractedTable } from '@shared/schema';


/**
 * Enhanced Excel Generator with Merge Cells Support
 * 
 * Features:
 * - Automatic merge detection for identical adjacent cells
 * - Smart merge for headers spanning multiple columns
 * - Professional formatting with borders and alignment
 * - Summary sheet with merged title cells
 * - Better text wrapping for long content
 * - Unicode/Hindi text support
 */
export class ExcelGeneratorEnhanced {
  
  async generateTableExcel(tableId: string): Promise<Buffer> {
    const table = await storage.getExtractedTable(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data with headers
    const worksheetData = [
      (table.headers as string[] | undefined) || [],
      ...(table.data as string[][]) 
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Auto-size columns with better handling for long text and Unicode
    const colWidths = this.calculateColumnWidthsWithUnicode(worksheetData);
    worksheet['!cols'] = colWidths;
    
    // Detect and apply merge cells
    this.detectAndMergeCells(worksheet, worksheetData);
    
    // Style headers with proper formatting
    this.styleHeadersWithUnicodeSupport(worksheet, (table.headers as string[] | undefined)?.length || 0);
    
    // Apply borders to all cells with better text handling
    this.applyBordersWithUnicodeSupport(worksheet, worksheetData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, `Table ${table.tableIndex + 1}`);
    
    // Generate buffer with UTF-8 encoding support
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx', 
      cellStyles: true,
      WTF: true // Enable warnings for text formatting issues
    });
    
    // Cache the generated file
    await storage.saveExcelFile(table.jobId, tableId, buffer);
    
    return buffer;
  }

  async generateJobExcel(jobId: string): Promise<Buffer> {
    const jobWithTables = await storage.getJobWithTables(jobId);
    if (!jobWithTables) {
      throw new Error('Job not found');
    }

    const { job, tables } = jobWithTables;
    
    if (tables.length === 0) {
      throw new Error('No tables found for this job');
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Add each table as a separate worksheet
    for (const table of tables) {
      const worksheetData = [
        (table.headers as string[] | undefined) || [],
        ...(table.data as string[][]) 
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Auto-size columns with better handling for long text and Unicode
      const colWidths = this.calculateColumnWidthsWithUnicode(worksheetData);
      worksheet['!cols'] = colWidths;
      
      // Detect and apply merge cells
      this.detectAndMergeCells(worksheet, worksheetData);
      
      // Style headers with Unicode support
      this.styleHeadersWithUnicodeSupport(worksheet, (table.headers as string[] | undefined)?.length || 0);
      
      // Apply borders with Unicode support
      this.applyBordersWithUnicodeSupport(worksheet, worksheetData);
      
      // Create sheet name
      const sheetName = `Table ${table.tableIndex + 1}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }
    
    // Add summary sheet if multiple tables
    if (tables.length > 1) {
      this.addSummarySheetWithUnicodeSupport(workbook, job.filename, tables);
    }
    
    // Generate buffer with UTF-8 encoding support
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx', 
      cellStyles: true,
      WTF: true // Enable warnings for text formatting issues
    });
    
    // Cache the generated file
    await storage.saveExcelFile(jobId, null, buffer);
    
    return buffer;
  }

  /**
   * Detect and merge identical adjacent cells (horizontal and vertical)
   */
  private detectAndMergeCells(worksheet: XLSX.WorkSheet, data: string[][]): void {
    if (!worksheet['!ref']) return;
    
    const merges: XLSX.Range[] = [];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Detect horizontal merges (same row, adjacent columns with identical values)
    for (let row = range.s.r; row <= range.e.r; row++) {
      let mergeStart = -1;
      let mergeValue = '';
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellValue = data[row]?.[col] || '';
        
        if (mergeStart === -1 && cellValue.trim()) {
          // Start potential merge
          mergeStart = col;
          mergeValue = cellValue;
        } else if (mergeStart !== -1 && cellValue === mergeValue) {
          // Continue merge
          continue;
        } else if (mergeStart !== -1 && col - mergeStart > 1) {
          // End merge (at least 2 cells)
          merges.push({
            s: { r: row, c: mergeStart },
            e: { r: row, c: col - 1 }
          });
          mergeStart = cellValue.trim() ? col : -1;
          mergeValue = cellValue;
        } else {
          // Reset
          mergeStart = cellValue.trim() ? col : -1;
          mergeValue = cellValue;
        }
      }
      
      // Handle merge at end of row
      if (mergeStart !== -1 && range.e.c - mergeStart + 1 > 1) {
        merges.push({
          s: { r: row, c: mergeStart },
          e: { r: row, c: range.e.c }
        });
      }
    }
    
    // Detect vertical merges (same column, adjacent rows with identical values)
    for (let col = range.s.c; col <= range.e.c; col++) {
      let mergeStart = -1;
      let mergeValue = '';
      
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cellValue = data[row]?.[col] || '';
        
        if (mergeStart === -1 && cellValue.trim()) {
          mergeStart = row;
          mergeValue = cellValue;
        } else if (mergeStart !== -1 && cellValue === mergeValue) {
          continue;
        } else if (mergeStart !== -1 && row - mergeStart > 1) {
          merges.push({
            s: { r: mergeStart, c: col },
            e: { r: row - 1, c: col }
          });
          mergeStart = cellValue.trim() ? row : -1;
          mergeValue = cellValue;
        } else {
          mergeStart = cellValue.trim() ? row : -1;
          mergeValue = cellValue;
        }
      }
      
      if (mergeStart !== -1 && range.e.r - mergeStart + 1 > 1) {
        merges.push({
          s: { r: mergeStart, c: col },
          e: { r: range.e.r, c: col }
        });
      }
    }
    
    // Apply merges if any found
    if (merges.length > 0) {
      worksheet['!merges'] = merges;
      
      // Center align merged cells
      merges.forEach(merge => {
        const cellAddress = XLSX.utils.encode_cell(merge.s);
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,
            alignment: { 
              horizontal: 'center', 
              vertical: 'center',
              wrapText: true 
            }
          };
        }
      });
    }
  }

  private calculateColumnWidthsWithUnicode(data: string[][]): Array<{ wch: number }> {
    if (data.length === 0) return [];
    
    const maxCols = Math.max(...data.map(row => row.length));
    const widths: number[] = new Array(maxCols).fill(15); // Increased minimum width
    
    // Calculate width based on content with smarter logic for Unicode text
    data.forEach(row => {
      row.forEach((cell, colIndex) => {
        if (colIndex < widths.length) {
          const cellText = String(cell || '');
          
          // For Unicode text (including Hindi), we need wider columns
          const unicodeChars = cellText.match(/[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F]/g) || [];
          const isUnicode = unicodeChars.length > 0;
          
          // For long text, allow wider columns
          const lines = cellText.split('\n');
          const longestLine = Math.max(...lines.map(line => line.length));
          
          // Also consider word wrapping - estimate average word length
          const words = cellText.split(/\s+/);
          const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / (words.length || 1);
          
          // Calculate estimated width considering wrapping and Unicode
          let estimatedWidth = Math.min(
            Math.max(longestLine, Math.floor(cellText.length / (isUnicode ? 2 : 3))), 
            isUnicode ? 70 : 60 // Wider columns for Unicode text
          );
          
          // Increase width for Unicode text
          if (isUnicode) {
            estimatedWidth = Math.ceil(estimatedWidth * 1.3);
          }
          
          widths[colIndex] = Math.max(widths[colIndex], estimatedWidth + 2);
        }
      });
    });
    
    return widths.map(width => ({ wch: width }));
  }

  private styleHeadersWithUnicodeSupport(worksheet: XLSX.WorkSheet, headerCount: number): void {
    if (headerCount === 0) return;
    
    // Apply professional styling to header row with Unicode support
    for (let col = 0; col < headerCount; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { 
          bold: true, 
          color: { rgb: "FFFFFF" },
          sz: 11 // Standard font size
        },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { 
          horizontal: 'center', 
          vertical: 'center', 
          wrapText: true // Enable text wrapping
        },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
  }

  /**
   * Apply borders to all cells for professional appearance
   * Enhanced to better handle text wrapping and alignment for Unicode text
   */
  private applyBordersWithUnicodeSupport(worksheet: XLSX.WorkSheet, data: string[][]): void {
    if (!worksheet['!ref']) return;
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;
        
        // Skip header row (already styled)
        if (row === 0) continue;
        
        // Get cell content to determine styling
        const cellContent = data[row] ? data[row][col] || '' : '';
        const contentLength = String(cellContent).length;
        
        // Check for Unicode text (Hindi, etc.)
        const unicodeChars = String(cellContent).match(/[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F]/g) || [];
        const isUnicode = unicodeChars.length > 0;
        
        worksheet[cellAddress].s = {
          ...worksheet[cellAddress].s,
          font: {
            sz: 10, // Standard font size
            name: isUnicode ? "Arial Unicode MS" : "Calibri" // Better font for Unicode
          },
          border: {
            top: { style: "thin", color: { rgb: "D0D0D0" } },
            bottom: { style: "thin", color: { rgb: "D0D0D0" } },
            left: { style: "thin", color: { rgb: "D0D0D0" } },
            right: { style: "thin", color: { rgb: "D0D0D0" } }
          },
          alignment: {
            vertical: 'top', // Align to top for better readability
            wrapText: true,  // Always enable text wrapping
            horizontal: contentLength > 50 ? 'left' : 'center' // Left align long text
          }
        };
      }
    }
  }

  /**
   * Add summary sheet with merged cells for title and Unicode support
   */
  private addSummarySheetWithUnicodeSupport(workbook: XLSX.WorkBook, filename: string, tables: ExtractedTable[]): void {
    const summaryData = [
      ['PDF to Excel Extraction Summary'], // Will be merged across columns
      [''],
      ['Source File:', filename],
      ['Extraction Date:', new Date().toLocaleDateString()],
      ['Tables Extracted:', tables.length.toString()],
      [''],
      ['Table Details:'], // Will be merged across columns
      ['Table #', 'Rows', 'Columns', 'Confidence', 'Sheet Name']
    ];

    // Add table details
    tables.forEach(table => {
      summaryData.push([
        `Table ${table.tableIndex + 1}`,
        (table.data as string[][]).length.toString(),
        ((table.headers as string[] | undefined)?.length || 0).toString(),
        `${table.confidence || 0}%`,
        `Table ${table.tableIndex + 1}`
      ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths with Unicode support
    summarySheet['!cols'] = [
      { wch: 20 }, // Wider for filenames
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 }
    ];

    // Define merges for title and section headers
    summarySheet['!merges'] = [
      // Merge title across all columns (A1:E1)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      // Merge "Table Details:" header (A7:E7)
      { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } }
    ];

    // Style title (A1) - merged cell with Unicode support
    if (summarySheet['A1']) {
      summarySheet['A1'].s = {
        font: { 
          bold: true, 
          size: 16, 
          color: { rgb: "FFFFFF" },
          name: "Arial Unicode MS" // Better font for Unicode
        },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { 
          horizontal: 'center', 
          vertical: 'center',
          wrapText: true
        },
        border: {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" }
        }
      };
    }

    // Style "Table Details:" section header (A7) - merged cell
    if (summarySheet['A7']) {
      summarySheet['A7'].s = {
        font: { 
          bold: true, 
          size: 12, 
          color: { rgb: "FFFFFF" },
          name: "Arial Unicode MS"
        },
        fill: { fgColor: { rgb: "70AD47" } },
        alignment: { 
          horizontal: 'center', 
          vertical: 'center',
          wrapText: true
        },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    }

    // Style column headers (row 8)
    for (let col = 0; col <= 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 7, c: col });
      if (summarySheet[cellAddress]) {
        summarySheet[cellAddress].s = {
          font: { 
            bold: true, 
            color: { rgb: "000000" },
            name: "Arial Unicode MS"
          },
          fill: { fgColor: { rgb: "E2EFDA" } },
          alignment: { 
            horizontal: 'center', 
            vertical: 'center',
            wrapText: true
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
      }
    }

    // Style data rows with alternating colors
    const dataStartRow = 8;
    const dataEndRow = 8 + tables.length - 1;
    for (let row = dataStartRow; row <= dataEndRow; row++) {
      const isEvenRow = (row - dataStartRow) % 2 === 0;
      const fillColor = isEvenRow ? "FFFFFF" : "F2F2F2";
      
      for (let col = 0; col <= 4; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (summarySheet[cellAddress]) {
          summarySheet[cellAddress].s = {
            font: {
              name: "Arial Unicode MS"
            },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { 
              horizontal: 'center', 
              vertical: 'center',
              wrapText: true
            },
            border: {
              top: { style: "thin", color: { rgb: "D0D0D0" } },
              bottom: { style: "thin", color: { rgb: "D0D0D0" } },
              left: { style: "thin", color: { rgb: "D0D0D0" } },
              right: { style: "thin", color: { rgb: "D0D0D0" } }
            }
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }
}

// Singleton instance
export const excelGeneratorEnhanced = new ExcelGeneratorEnhanced();