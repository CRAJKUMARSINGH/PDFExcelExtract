#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { storage } from './storage';
import { pdfProcessor } from './pdf-processor';
import { excelGenerator } from './excel-generator';

interface FileInfo {
  path: string;
  name: string;
  size: number;
}

async function getLargestFiles(dir: string, count: number): Promise<FileInfo[]> {
  const files = await fs.readdir(dir);
  const pdfFiles: FileInfo[] = [];

  for (const file of files) {
    if (file.toLowerCase().endsWith('.pdf')) {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      pdfFiles.push({
        path: filePath,
        name: file,
        size: stats.size,
      });
    }
  }

  // Sort by size descending and take top N
  return pdfFiles.sort((a, b) => b.size - a.size).slice(0, count);
}

async function processPdfFile(fileInfo: FileInfo, outputDir: string) {
  const buffer = await fs.readFile(fileInfo.path);
  const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);

  console.log(`\n📄 Processing: ${fileInfo.name} (${fileSizeMB} MB)`);

  // Create processing job
  const job = await storage.createProcessingJob({
    filename: fileInfo.name,
    status: 'pending',
    options: {
      ocr: true, // Enable OCR for scanned documents
      extractTables: true,
    },
  });

  // Save original file
  await storage.saveOriginalFile(job.id, {
    buffer,
    filename: fileInfo.name,
    mimeType: 'application/pdf',
    size: fileInfo.size,
  });

  // Process the job with OCR enabled
  try {
    await pdfProcessor.processJob(job.id, {
      ocrLanguage: 'eng',
      confidenceThreshold: 70,
      tableDetectionSensitivity: 'medium',
    });

    // Get job with tables
    const jobWithTables = await storage.getJobWithTables(job.id);
    if (!jobWithTables) {
      throw new Error('Job not found after processing');
    }

    // Save JSON snapshot
    const baseName = path.basename(fileInfo.name, '.pdf');
    const jsonOut = path.join(outputDir, `${baseName}.json`);
    await fs.writeFile(jsonOut, JSON.stringify(jobWithTables, null, 2), 'utf-8');
    console.log(`   ✓ Saved JSON: ${jsonOut}`);

    // Generate Excel file
    if (jobWithTables.tables.length > 0) {
      const xlsxBuffer = await excelGenerator.generateJobExcel(job.id);
      const xlsxOut = path.join(outputDir, `${baseName}.xlsx`);
      await fs.writeFile(xlsxOut, xlsxBuffer);
      console.log(`   ✓ Saved Excel: ${xlsxOut} (${jobWithTables.tables.length} tables)`);
    } else {
      console.log(`   ⚠ No tables detected in ${fileInfo.name}`);
    }

    return job.id;
  } catch (error) {
    console.error(`   ❌ Error processing ${fileInfo.name}:`, error);
    await storage.updateProcessingJob(job.id, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function main() {
  const inputDir = path.resolve('Sample_input_files');
  const outputDir = path.resolve('outputs', 'top_11_files');
  const fileCount = 11;

  console.log('🚀 Processing Top 11 Largest PDF Files');
  console.log('========================================\n');

  // Check if input directory exists
  try {
    await fs.access(inputDir);
  } catch {
    console.error(`❌ Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  // Get the largest files
  console.log(`📊 Scanning for largest files in: ${inputDir}`);
  const largestFiles = await getLargestFiles(inputDir, fileCount);

  if (largestFiles.length === 0) {
    console.error('❌ No PDF files found in the input directory');
    process.exit(1);
  }

  console.log(`\n✅ Found ${largestFiles.length} files to process:\n`);
  largestFiles.forEach((file, index) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log(`   ${index + 1}. ${file.name} - ${sizeMB} MB`);
  });

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });
  console.log(`\n📂 Output directory: ${outputDir}\n`);

  // Process each file
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < largestFiles.length; i++) {
    const file = largestFiles[i];
    try {
      console.log(`\n[${i + 1}/${largestFiles.length}] Processing: ${file.name}`);
      await processPdfFile(file, outputDir);
      successCount++;
      console.log(`   ✅ Completed: ${file.name}`);
    } catch (error) {
      failCount++;
      console.error(`   ❌ Failed: ${file.name}`);
      console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Processing Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successfully processed: ${successCount}/${largestFiles.length}`);
  console.log(`❌ Failed: ${failCount}/${largestFiles.length}`);
  console.log(`📂 Output location: ${outputDir}`);
  console.log('\n✨ Batch processing complete!');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});

