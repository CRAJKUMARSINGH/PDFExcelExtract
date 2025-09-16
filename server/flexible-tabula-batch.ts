import fs from 'fs';
import path from 'path';
// @ts-ignore - tabula-js doesn't have type definitions
import Tabula from 'tabula-js';
import * as XLSX from 'xlsx';
import { FolderScanner } from './folder-scanner';
import { logger } from './lib/logger';

async function extractTablesFromPdf(pdfPath: string) {
  // Tabula settings: use lattice first, then stream fallback
  const tabula = Tabula(pdfPath, { pages: 'all', guess: false, lattice: true });
  return new Promise<any[]>((resolve) => {
    const rows: any[] = [];
    tabula.extractCsv((err: any, data: string) => {
      if (!err && data) {
        const parsed = data
          .split('\n')
          .map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim()))
          .filter((r) => r.some((c) => c && c.length > 0));
        if (parsed.length) rows.push(parsed);
      }
      // If lattice returned nothing, try stream mode
      if (rows.length === 0) {
        const tabulaStream = Tabula(pdfPath, { pages: 'all', guess: true, stream: true });
        tabulaStream.extractCsv((err2: any, data2: string) => {
          if (!err2 && data2) {
            const parsed2 = data2
              .split('\n')
              .map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim()))
              .filter((r) => r.some((c) => c && c.length > 0));
            if (parsed2.length) rows.push(parsed2);
          }
          resolve(rows);
        });
      } else {
        resolve(rows);
      }
    });
  });
}

async function processFolder(folderPath: string, outputBaseDir: string) {
  const folderName = path.basename(folderPath);
  const folderOutputDir = path.join(outputBaseDir, folderName);
  await fs.promises.mkdir(folderOutputDir, { recursive: true });

  const entries = await fs.promises.readdir(folderPath);
  const pdfFiles = entries
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => path.join(folderPath, file));

  logger.info(`Processing ${pdfFiles.length} PDF files from folder: ${folderName}`);

  let processedCount = 0;
  for (const file of pdfFiles) {
    const base = path.basename(file, '.pdf');
    
    try {
      logger.info(`[${processedCount + 1}/${pdfFiles.length}] Extracting with Tabula: ${base}.pdf`);

      // Collect tables
      const tables = await extractTablesFromPdf(file);

      if (tables.length === 0) {
        logger.warn(`No tables detected by Tabula for ${base}.pdf`);
        continue;
      }

      // Build workbook with each table as a sheet
      const wb = XLSX.utils.book_new();
      let sheetIndex = 1;
      for (const table of tables) {
        const ws = XLSX.utils.aoa_to_sheet(table);
        XLSX.utils.book_append_sheet(wb, ws, `Table_${sheetIndex++}`);
      }

      const xlsxOut = path.join(folderOutputDir, `${base}.xlsx`);
      XLSX.writeFile(wb, xlsxOut);
      logger.info(`Saved: ${xlsxOut}`);
      processedCount++;
    } catch (err) {
      logger.error(`Failed to process ${file}`, { error: err });
    }
  }

  logger.info(`Completed processing ${processedCount}/${pdfFiles.length} files from ${folderName}`);
  return processedCount;
}

async function main() {
  const folderPattern = process.argv[2] || 'sampl*';
  const outputBaseDir = path.resolve('outputs_tabula');
  
  logger.info(`Starting Tabula batch processing with folder pattern: "${folderPattern}"`);
  
  // Initialize folder scanner
  const scanner = new FolderScanner();
  const scanResult = await scanner.scanForPdfFiles(folderPattern);
  
  if (scanResult.totalFiles === 0) {
    logger.warn(`No PDF files found in folders matching "${folderPattern}"`);
    process.exit(0);
  }

  logger.info(`Found ${scanResult.totalFiles} PDF files across ${scanResult.folders.length} folders`);
  
  // Create base output directory
  await fs.promises.mkdir(outputBaseDir, { recursive: true });
  
  let totalProcessed = 0;
  
  // Process each folder
  for (const folderPath of scanResult.folders) {
    const processedInFolder = await processFolder(folderPath, outputBaseDir);
    totalProcessed += processedInFolder;
  }

  logger.info(`Tabula batch complete. Processed ${totalProcessed}/${scanResult.totalFiles} files.`);
}

// Handle command line usage
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    logger.error('Tabula batch processing failed', { error: err });
    process.exit(1);
  });
}

export { main as runFlexibleTabulaBatch };