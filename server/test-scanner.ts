import { FolderScanner } from './folder-scanner';

async function testScanner() {
  const scanner = new FolderScanner();
  
  console.log('Testing folder scanner...');
  console.log('='.repeat(50));
  
  // Test with 'sampl*' pattern
  const pattern = 'sampl*';
  console.log(`\nScanning for folders matching pattern: "${pattern}"`);
  
  const scanResult = await scanner.scanForPdfFiles(pattern);
  
  console.log('\nScan Results:');
  console.log(`- Found ${scanResult.folders.length} matching folders`);
  console.log(`- Total PDF files: ${scanResult.totalFiles}`);
  
  if (scanResult.folders.length > 0) {
    console.log('\nFolder Details:');
    for (const folder of scanResult.folders) {
      const folderName = scanner.getRelativePath(folder);
      const filesInFolder = scanResult.files.filter(file => 
        file.startsWith(folder)
      ).length;
      console.log(`  - ${folderName}: ${filesInFolder} PDF files`);
    }
    
    console.log('\nAll PDF Files:');
    for (const file of scanResult.files) {
      const relativePath = scanner.getRelativePath(file);
      console.log(`  - ${relativePath}`);
    }
  } else {
    console.log('\nNo folders found. Creating sample folders for testing...');
    console.log('You can create folders like: samples/, sample_data/, etc.');
  }
}

// Always run the test
testScanner().catch(console.error);