import fs from 'fs';
import path from 'path';
import Tabula from 'tabula-js';
import * as XLSX from 'xlsx';

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

async function main() {
  const inputDir = path.resolve('Sample_input_files');
  const outputDir = path.resolve('outputs_tabula');
  await fs.promises.mkdir(outputDir, { recursive: true });

  const files = (await fs.promises.readdir(inputDir))
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .map((f) => path.join(inputDir, f));

  console.log(`Found ${files.length} PDF(s)`);

  for (const file of files) {
    const base = path.basename(file, '.pdf');
    console.log(`Extracting with Tabula: ${base}.pdf`);

    // Collect tables
    const tables = await extractTablesFromPdf(file);

    if (tables.length === 0) {
      console.warn(`No tables detected by Tabula for ${base}.pdf`);
      continue;
    }

    // Build workbook with each table as a sheet
    const wb = XLSX.utils.book_new();
    let sheetIndex = 1;
    for (const table of tables) {
      const ws = XLSX.utils.aoa_to_sheet(table);
      XLSX.utils.book_append_sheet(wb, ws, `Table_${sheetIndex++}`);
    }

    const xlsxOut = path.join(outputDir, `${base}.xlsx`);
    XLSX.writeFile(wb, xlsxOut);
    console.log(`Saved: ${xlsxOut}`);
  }

  console.log('Tabula batch complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


