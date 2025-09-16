#!/usr/bin/env node

import { FolderScanner } from './folder-scanner';
import { runFlexibleTabulaBatch } from './flexible-tabula-batch';

async function oneClickTabulaBatch() {
  console.log('⚡ One-Click Tabula Batch Processing (Fast Mode)');
  console.log('===============================================');
  
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
    
    console.log('\n⚡ Starting fast Tabula processing...');
    console.log('   • Direct table extraction');
    console.log('   • Excel generation');
    console.log('   • No OCR (faster processing)');
    console.log('');
    
    // Run the Tabula batch processing
    await runFlexibleTabulaBatch();
    
    console.log('\n✅ Fast batch processing completed!');
    console.log('📂 Check the outputs_tabula/ folder for results');
    console.log('   • Excel files with extracted tables');
    
  } catch (error) {
    console.error('\n❌ Fast batch processing failed:');
    console.error(error);
    process.exit(1);
  }
}

// Always run when executed
oneClickTabulaBatch();