#!/usr/bin/env node

import { FolderScanner } from './folder-scanner';
import { runFlexibleBatch } from './flexible-batch-run';
import { runFlexibleTabulaBatch } from './flexible-tabula-batch';

function printUsage() {
  console.log(`
PDF Batch Processing Utility
============================

Usage: npm run batch:flexible [options] [pattern]

Options:
  --help, -h     Show this help message
  --scan, -s     Only scan for folders, don't process
  --tabula, -t   Use Tabula-only processing (faster, table extraction only)
  --pattern, -p  Folder pattern to match (default: "sampl*")

Examples:
  npm run batch:flexible                    # Process all folders matching "sampl*"
  npm run batch:flexible sample*           # Process folders starting with "sample"
  npm run batch:flexible -- --scan         # Just scan and show what would be processed
  npm run batch:flexible -- --tabula       # Use Tabula processing only
  npm run batch:flexible -- --pattern "test*"  # Process folders starting with "test"

Folders Matching Pattern:
- The pattern supports wildcards (*)
- Examples: "sampl*", "sample*", "test*", "data*"
- Case-insensitive matching

Output:
- Full processing: outputs/ folder with subfolders for each input folder
- Tabula processing: outputs_tabula/ folder with subfolders for each input folder
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let pattern = 'sampl*';
  let scanOnly = false;
  let useTabula = false;
  let showHelp = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      showHelp = true;
    } else if (arg === '--scan' || arg === '-s') {
      scanOnly = true;
    } else if (arg === '--tabula' || arg === '-t') {
      useTabula = true;
    } else if (arg === '--pattern' || arg === '-p') {
      pattern = args[++i] || pattern;
    } else if (!arg.startsWith('-') && !pattern.includes('*')) {
      // If no wildcard yet, treat as pattern
      pattern = arg;
    }
  }
  
  if (showHelp) {
    printUsage();
    return;
  }
  
  console.log('🔍 PDF Batch Processing Utility');
  console.log('================================');
  console.log(`Pattern: "${pattern}"`);
  console.log(`Mode: ${useTabula ? 'Tabula-only' : 'Full processing'}`);
  console.log(`Action: ${scanOnly ? 'Scan only' : 'Process files'}`);
  console.log();
  
  // Initialize scanner
  const scanner = new FolderScanner();
  const scanResult = await scanner.scanForPdfFiles(pattern);
  
  if (scanResult.totalFiles === 0) {
    console.log(`❌ No PDF files found in folders matching "${pattern}"`);
    console.log('\nTip: Make sure you have folders like:');
    console.log('  - Sample_input_files/');
    console.log('  - samples/');
    console.log('  - sample_data/');
    console.log('  - etc.');
    return;
  }
  
  console.log(`✅ Found ${scanResult.totalFiles} PDF files across ${scanResult.folders.length} folders:`);
  for (const folder of scanResult.folders) {
    const folderName = scanner.getRelativePath(folder);
    const filesInFolder = scanResult.files.filter(file => 
      file.startsWith(folder)
    ).length;
    console.log(`   📁 ${folderName}: ${filesInFolder} PDF files`);
  }
  console.log();
  
  if (scanOnly) {
    console.log('📋 Scan complete. Use without --scan to process these files.');
    return;
  }
  
  console.log('🚀 Starting processing...');
  
  try {
    if (useTabula) {
      await runFlexibleTabulaBatch();
    } else {
      await runFlexibleBatch();
    }
    console.log('✅ Processing completed successfully!');
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  }
}

  main().catch(console.error);