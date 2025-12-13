import * as XLSX from 'xlsx';
import { storage } from './storage';
import { logger } from './lib/logger';
import type { ExtractedTable } from '@shared/schema';

export class ExcelGenerator {
  async generateExcelFromTables(jobId: string): Promise<Buffer> {
    try {
      logger.info('Starting Excel generation', { jobId });

      const jobWithTables = await storage.getJobWithTables(jobId);
      if (!jobWithTables) {
        throw new Error('Job not found');
      }

      const { job, tables } = jobWithTables;

      if (tables.length === 0) {
        throw new Error('No tables found for this job');
      }

      // Validate table data structure before processing
      this.validateTableData(tables);

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Add each table as a separate worksheet
      for (const table of tables) {
        try {
          const worksheetData = this.prepareWorksheetData(table);
          const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

          // Apply formatting
          this.formatWorksheet(worksheet, table);

          // Create sheet name
          const sheetName = this.createSheetName(table.tableIndex);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

          logger.debug('Added worksheet', { 
            jobId, 
            tableIndex: table.tableIndex, 
            sheetName,
            rows: worksheetData.length 
          });
        } catch (error) {
          logger.error('Error processing table', { 
            jobId, 
            tableIndex: table.tableIndex, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          throw new Error(`Failed to process table ${table.tableIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Add summary sheet if multiple tables
      if (tables.length > 1) {
        this.addSummarySheet(workbook, job.filename, tables);
      }

      // Generate buffer with proper error handling
      let buffer: Buffer;
      try {
        buffer = XLSX.write(workbook, { 
          type: 'buffer', 
          bookType: 'xlsx',
          compression: true 
        }) as Buffer;

        // Validate buffer
        if (!buffer || buffer.length === 0) {
          throw new Error('Generated buffer is empty');
        }

        logger.info('Excel buffer generated successfully', { 
          jobId, 
          bufferSize: buffer.length,
          tables: tables.length 
        });
      } catch (error) {
        logger.error('XLSX.write failed', { jobId, error });
        throw new Error(`Failed to generate Excel buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Save processed file
      const filename = `${job.filename.replace('.pdf', '')}_extracted_tables.xlsx`;
      await storage.saveProcessedFile(jobId, {
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
      });

      logger.info('Excel file generated and saved', { jobId, filename, size: buffer.length });
      return buffer;

    } catch (error) {
      logger.error('Excel generation failed', { jobId, error });
      throw error;
    }
  }

  private validateTableData(tables: ExtractedTable[]): void {
    for (const table of tables) {
      // Check if data exists and is valid
      if (!table.data || !Array.isArray(table.data)) {
        throw new Error(`Table ${table.tableIndex + 1}: Invalid or missing data array`);
      }

      if (table.data.length === 0) {
        throw new Error(`Table ${table.tableIndex + 1}: Data array is empty`);
      }

      // Check if headers exist and are valid
      if (table.headers && !Array.isArray(table.headers)) {
        throw new Error(`Table ${table.tableIndex + 1}: Headers must be an array`);
      }

      // Validate data rows
      for (let i = 0; i < table.data.length; i++) {
        const row = table.data[i];
        if (!Array.isArray(row)) {
          throw new Error(`Table ${table.tableIndex + 1}, Row ${i + 1}: Row data must be an array`);
        }
        
        // Convert any non-string values to strings
        for (let j = 0; j < row.length; j++) {
          if (row[j] === null || row[j] === undefined) {
            row[j] = '';
          } else if (typeof row[j] !== 'string') {
            row[j] = String(row[j]);
          }
        }
      }
    }
  }

  private prepareWorksheetData(table: ExtractedTable): string[][] {
    const data: string[][] = [];
    
    // Add headers if they exist
    if (table.headers && table.headers.length > 0) {
      data.push([...table.headers]);
    }
    
    // Add data rows
    data.push(...table.data);
    
    return data;
  }

  private formatWorksheet(worksheet: XLSX.WorkSheet, table: ExtractedTable): void {
    try {
      // Auto-size columns
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const colWidths: Array<{ wch: number }> = [];
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        let maxWidth = 10; // Minimum width
        
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            const cellLength = String(cell.v).length;
            maxWidth = Math.max(maxWidth, Math.min(cellLength + 2, 50)); // Max width 50
          }
        }
        
        colWidths.push({ wch: maxWidth });
      }
      
      worksheet['!cols'] = colWidths;

      // Style headers if they exist
      if (table.headers && table.headers.length > 0) {
        for (let col = 0; col < table.headers.length; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (worksheet[cellAddress]) {
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
      }
    } catch (error) {
      logger.warn('Failed to apply worksheet formatting', { 
        tableIndex: table.tableIndex, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      // Continue without formatting rather than failing
    }
  }

  private createSheetName(tableIndex: number): string {
    return `Table_${tableIndex + 1}`;
  }

  private addSummarySheet(workbook: XLSX.WorkBook, filename: string, tables: ExtractedTable[]): void {
    try {
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
          (table.headers?.length || table.data[0]?.length || 0).toString(),
          `${table.confidence || 0}%`,
          `Table_${table.tableIndex + 1}`
        ]);
      });

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Style the summary sheet
      summarySheet['!cols'] = [
        { wch: 15 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 }
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

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    } catch (error) {
      logger.warn('Failed to add summary sheet', { error });
      // Continue without summary sheet rather than failing
    }
  }
}

export const excelGenerator = new ExcelGenerator();
