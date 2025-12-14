#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
// @ts-ignore - tabula-js doesn't have type definitions
import Tabula from 'tabula-js';
import * as XLSX from 'xlsx';

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

async function extractTablesWithTabula(pdfPath: string): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const tables: any[][] = [];
    
    // Try lattice mode first (for tables with clear borders)
    const tabulaLattice = Tabula(pdfPath, { 
      pages: 'all', 
      guess: false, 
      lattice: true 
    });
    
    tabulaLattice.extractCsv((err: any, data: string) => {
      if (!err && data && data.trim().length > 0) {
        const parsed = data
          .split('\n')
          .map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim()))
          .filter((r) => r.some((c) => c && c.length > 0));
        
        if (parsed.length > 0) {
          console.log(`   ✓ Extracted ${parsed.length} rows using lattice mode`);
          resolve(parsed);
          return;
        }
      }
      
      // Fallback to stream mode (for tables without clear borders)
      const tabulaStream = Tabula(pdfPath, { 
        pages: 'all', 
        guess: true, 
        stream: true 
      });
      
      tabulaStream.extractCsv((err2: any, data2: string) => {
        if (!err2 && data2 && data2.trim().length > 0) {
          const parsed2 = data2
            .split('\n')
            .map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim()))
            .filter((r) => r.some((c) => c && c.length > 0));
          
          if (parsed2.length > 0) {
            console.log(`   ✓ Extracted ${parsed2.length} rows using stream mode`);
            resolve(parsed2);
            return;
          }
        }
        
        // If both failed, return empty
        console.log(`   ⚠ No tables detected by Tabula`);
        resolve([]);
      });
    });
  });
}

async function processPdfFile(fileInfo: FileInfo, outputDir: string) {
  const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
  console.log(`\n📄 Processing: ${fileInfo.name} (${fileSizeMB} MB)`);

  try {
    // Extract tables using Tabula
    const tableData = await extractTablesWithTabula(fileInfo.path);
    
    if (tableData.length === 0) {
      console.log(`   ⚠ No tables found in ${fileInfo.name}`);
      return;
    }

    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // If we have multiple potential tables, try to split them
    // For now, put all data in one sheet
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    
    // Auto-size columns
    const colWidths = tableData[0]?.map((_, colIndex) => {
      const maxLength = Math.max(
        ...tableData.map(row => (row[colIndex] || '').toString().length),
        10
      );
      return { wch: Math.min(maxLength + 2, 50) };
    }) || [];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted_Table');
    
    // Save Excel file
    const baseName = path.basename(fileInfo.name, '.pdf');
    const xlsxOut = path.join(outputDir, `${baseName}.xlsx`);
    XLSX.writeFile(wb, xlsxOut);
    
    console.log(`   ✅ Saved: ${xlsxOut}`);
    console.log(`   📊 Rows extracted: ${tableData.length}`);
    console.log(`   📊 Columns: ${tableData[0]?.length || 0}`);
    
  } catch (error) {
    console.error(`   ❌ Error processing ${fileInfo.name}:`, error);
    throw error;
  }
}

async function main() {
  const inputDir = path.resolve('Sample_input_files');
  const outputDir = path.resolve('outputs', 'top_11_files_tabula');
  const fileCount = 11;

  console.log('🚀 Processing Top 11 Largest PDF Files with Tabula');
  console.log('===================================================\n');

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
  let noTablesCount = 0;

  for (let i = 0; i < largestFiles.length; i++) {
    const file = largestFiles[i];
    try {
      console.log(`\n[${i + 1}/${largestFiles.length}] Processing: ${file.name}`);
      const tableData = await extractTablesWithTabula(file.path);
      
      if (tableData.length === 0) {
        noTablesCount++;
        console.log(`   ⚠ No tables detected - skipping Excel generation`);
        continue;
      }
      
      await processPdfFile(file, outputDir);
      successCount++;
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
  console.log(`⚠️  No tables found: ${noTablesCount}/${largestFiles.length}`);
  console.log(`❌ Failed: ${failCount}/${largestFiles.length}`);
  console.log(`📂 Output location: ${outputDir}`);
  console.log('\n✨ Batch processing complete!');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});

