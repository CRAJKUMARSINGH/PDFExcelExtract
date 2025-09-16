import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { pdfProcessor } from './pdf-processor';
import { excelGenerator } from './excel-generator';

async function processPdfFile(filePath: string) {
  const filename = path.basename(filePath);
  const buffer = await fs.promises.readFile(filePath);

  const job = await storage.createProcessingJob({ filename, status: 'pending' });
  await storage.saveOriginalFile(job.id, {
    buffer,
    filename,
    mimeType: 'application/pdf',
    size: buffer.length,
  });

  await pdfProcessor.processJob(job.id);
  return job.id;
}

async function main() {
  const inputDir = path.resolve('Sample_input_files');
  const outputDir = path.resolve('outputs');
  await fs.promises.mkdir(outputDir, { recursive: true });

  const files = (await fs.promises.readdir(inputDir))
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .map((f) => path.join(inputDir, f));

  console.log(`Found ${files.length} PDF(s)`);

  for (const file of files) {
    console.log(`Processing: ${path.basename(file)}`);
    const jobId = await processPdfFile(file);
    const jobWithTables = await storage.getJobWithTables(jobId);
    // Save JSON snapshot (for debugging/auditing)
    const baseName = path.basename(file, '.pdf');
    const jsonOut = path.join(outputDir, `${baseName}.json`);
    await fs.promises.writeFile(jsonOut, JSON.stringify(jobWithTables, null, 2), 'utf-8');
    console.log(`Saved: ${jsonOut}`);

    // Generate combined Excel for all tables in this job
    try {
      const xlsxBuffer = await excelGenerator.generateJobExcel(jobId);
      const xlsxOut = path.join(outputDir, `${baseName}.xlsx`);
      await fs.promises.writeFile(xlsxOut, xlsxBuffer);
      console.log(`Saved: ${xlsxOut}`);
    } catch (err) {
      console.error(`Failed to generate Excel for ${file}:`, err);
    }
  }

  console.log('Batch processing complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


