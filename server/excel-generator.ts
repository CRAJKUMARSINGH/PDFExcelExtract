import * as XLSX from 'xlsx';
import { storage } from './storage';
import type { ExtractedTable } from '@shared/schema';

export class ExcelGenerator {
  
  async generateTableExcel(tableId: string): Promise<Buffer> {
    const table = await storage.getExtractedTable(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data with headers
    const worksheetData = [
      table.headers || [],
      ...table.data as string[][]
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Auto-size columns
    const colWidths = this.calculateColumnWidths(worksheetData);
    worksheet['!cols'] = colWidths;
    
    // Style headers
    this.styleHeaders(worksheet, table.headers?.length || 0);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, `Table ${table.tableIndex + 1}`);
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
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
        table.headers || [],
        ...table.data as string[][]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Auto-size columns
      const colWidths = this.calculateColumnWidths(worksheetData);
      worksheet['!cols'] = colWidths;
      
      // Style headers
      this.styleHeaders(worksheet, table.headers?.length || 0);
      
      // Create sheet name
      const sheetName = `Table ${table.tableIndex + 1}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }
    
    // Add summary sheet if multiple tables
    if (tables.length > 1) {
      this.addSummarySheet(workbook, job.filename, tables);
    }
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Cache the generated file
    await storage.saveExcelFile(jobId, null, buffer);
    
    return buffer;
  }

  private calculateColumnWidths(data: string[][]): Array<{ width: number }> {
    if (data.length === 0) return [];
    
    const maxCols = Math.max(...data.map(row => row.length));
    const widths: number[] = new Array(maxCols).fill(10); // Minimum width
    
    // Calculate width based on content
    data.forEach(row => {
      row.forEach((cell, colIndex) => {
        if (colIndex < widths.length) {
          const cellLength = String(cell || '').length;
          widths[colIndex] = Math.max(widths[colIndex], Math.min(cellLength + 2, 50));
        }
      });
    });
    
    return widths.map(width => ({ width }));
  }

  private styleHeaders(worksheet: XLSX.WorkSheet, headerCount: number): void {
    if (headerCount === 0) return;
    
    // Apply basic styling to header row
    for (let col = 0; col < headerCount; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F0F0F0" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    }
  }

  private addSummarySheet(workbook: XLSX.WorkBook, filename: string, tables: ExtractedTable[]): void {
    const summaryData = [
      ['PDF to Excel Extraction Summary'],
      [''],
      ['Source File:', filename],
      ['Extraction Date:', new Date().toLocaleDateString()],
      ['Tables Extracted:', tables.length.toString()],
      [''],
      ['Table Details:'],
      ['Table #', 'Rows', 'Columns', 'Confidence', 'Sheet Name']
    ];

    // Add table details
    tables.forEach(table => {
      summaryData.push([
        `Table ${table.tableIndex + 1}`,
        table.data.length.toString(),
        (table.headers?.length || 0).toString(),
        `${table.confidence || 0}%`,
        `Table ${table.tableIndex + 1}`
      ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style the summary sheet
    const range = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1');
    summarySheet['!cols'] = [
      { width: 15 },
      { width: 10 },
      { width: 12 },
      { width: 12 },
      { width: 15 }
    ];

    // Style title
    if (summarySheet['A1']) {
      summarySheet['A1'].s = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: 'center' }
      };
    }

    // Style headers
    for (let col = 0; col <= 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 7, c: col });
      if (summarySheet[cellAddress]) {
        summarySheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E0E0E0" } }
        };
      }
    }

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary', 0);
  }
}

// Singleton instance
export const excelGenerator = new ExcelGenerator();