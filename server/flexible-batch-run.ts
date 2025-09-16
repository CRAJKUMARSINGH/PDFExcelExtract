import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { pdfProcessor } from './pdf-processor';
import { excelGenerator } from './excel-generator';
import { FolderScanner } from './folder-scanner';
import { logger } from './lib/logger';

async function processPdfFile(filePath: string, outputDir: string) {
  const filename = path.basename(filePath);
  const buffer = await fs.promises.readFile(filePath);

  logger.info(`Creating processing job for: ${filename}`);
  const job = await storage.createProcessingJob({ filename, status: 'pending' });
  
  await storage.saveOriginalFile(job.id, {
    buffer,
    filename,
    mimeType: 'application/pdf',
    size: buffer.length,
  });

  logger.info(`Processing job ${job.id} for: ${filename}`);
  await pdfProcessor.processJob(job.id);
  
  const jobWithTables = await storage.getJobWithTables(job.id);
  
  // Save JSON snapshot (for debugging/auditing)
  const baseName = path.basename(filePath, '.pdf');
  const jsonOut = path.join(outputDir, `${baseName}.json`);
  await fs.promises.writeFile(jsonOut, JSON.stringify(jobWithTables, null, 2), 'utf-8');
  logger.info(`Saved JSON: ${jsonOut}`);

  // Generate combined Excel for all tables in this job
  try {
    const xlsxBuffer = await excelGenerator.generateJobExcel(job.id);
    const xlsxOut = path.join(outputDir, `${baseName}.xlsx`);
    await fs.promises.writeFile(xlsxOut, xlsxBuffer);
    logger.info(`Saved Excel: ${xlsxOut}`);
  } catch (err) {
    logger.error(`Failed to generate Excel for ${filePath}`, { error: err });
  }

  return job.id;
}

async function main() {
  const folderPattern = process.argv[2] || 'sampl*';
  const outputBaseDir = path.resolve('outputs');
  
  logger.info(`Starting batch processing with folder pattern: "${folderPattern}"`);
  
  // Initialize folder scanner
  const scanner = new FolderScanner();
  const scanResult = await scanner.scanForPdfFiles(folderPattern);
  
  if (scanResult.totalFiles === 0) {
    logger.warn(`No PDF files found in folders matching "${folderPattern}"`);
    process.exit(0);
  }

  logger.info(`Found ${scanResult.totalFiles} PDF files across ${scanResult.folders.length} folders`);
  
  // Create output directory
  await fs.promises.mkdir(outputBaseDir, { recursive: true });
  
  // Process each folder separately
  for (const folderPath of scanResult.folders) {
    const folderName = path.basename(folderPath);
    const folderOutputDir = path.join(outputBaseDir, folderName);
    await fs.promises.mkdir(folderOutputDir, { recursive: true });
    
    logger.info(`Processing folder: ${folderName}`);
    
    // Get files for this specific folder
    const folderFiles = scanResult.files.filter(file => 
      path.dirname(file) === folderPath
    );
    
    logger.info(`Processing ${folderFiles.length} files from ${folderName}`);
    
    let processedCount = 0;
    for (const file of folderFiles) {
      try {
        logger.info(`[${processedCount + 1}/${folderFiles.length}] Processing: ${path.basename(file)}`);
        await processPdfFile(file, folderOutputDir);
        processedCount++;
      } catch (err) {
        logger.error(`Failed to process ${file}`, { error: err });
      }
    }
    
    logger.info(`Completed processing ${processedCount}/${folderFiles.length} files from ${folderName}`);
  }

  logger.info('Batch processing complete.');
}

// Handle command line usage
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    logger.error('Batch processing failed', { error: err });
    process.exit(1);
  });
}

export { main as runFlexibleBatch };