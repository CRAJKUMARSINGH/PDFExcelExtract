#!/usr/bin/env node

import { FolderScanner } from './folder-scanner';
import { runFlexibleBatch } from './flexible-batch-run';
import { runFlexibleTabulaBatch } from './flexible-tabula-batch';

async function oneClickBatch() {
  console.log('🚀 One-Click Batch Processing');
  console.log('=============================');
  
  const pattern = 'sampl*'; // Using the configured pattern from memory
  const scanner = new FolderScanner();
  
  try {
    // Quick scan
    console.log('📁 Scanning for input folders...');
    const scanResult = await scanner.scanForPdfFiles(pattern);
    
    if (scanResult.totalFiles === 0) {
      console.log('❌ No PDF files found in folders matching "sampl*"');
      console.log('💡 Make sure you have folders like Sample_input_files/ or samples/');
      return;
    }
    
    console.log(`✅ Found ${scanResult.totalFiles} PDF files in ${scanResult.folders.length} folders`);
    for (const folder of scanResult.folders) {
      const folderName = scanner.getRelativePath(folder);
      const filesInFolder = scanResult.files.filter(file => 
        file.startsWith(folder)
      ).length;
      console.log(`   📄 ${folderName}: ${filesInFolder} files`);
    }
    
    console.log('\n🔄 Starting batch processing...');
    console.log('   • OCR text extraction');
    console.log('   • Table detection');
    console.log('   • Excel generation');
    console.log('');
    
    // Run the batch processing
    await runFlexibleBatch();
    
    console.log('\n✅ Batch processing completed successfully!');
    console.log('📂 Check the outputs/ folder for results');
    console.log('   • JSON files for debugging');
    console.log('   • Excel files with extracted tables');
    
  } catch (error) {
    console.error('\n❌ Batch processing failed:');
    console.error(error);
    process.exit(1);
  }
}

// Always run when executed
oneClickBatch();