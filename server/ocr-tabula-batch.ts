import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as XLSX from 'xlsx';
import Tabula from 'tabula-js';

const execFileAsync = promisify(execFile);

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function runGhostscriptToTiff(pdfPath: string, outDir: string) {
  const gs = process.arch.includes('64') ? 'gswin64c' : 'gswin32c';
  const args = [
    '-dBATCH',
    '-dNOPAUSE',
    '-sDEVICE=tiffgray',
    '-r300',
    `-sOutputFile=${path.join(outDir, 'page-%04d.tif')}`,
    pdfPath,
  ];
  await execFileAsync(gs, args);
}

async function runTesseractOnTiffs(tiffDir: string, outPdf: string, language = 'eng') {
  const files = (await fs.promises.readdir(tiffDir))
    .filter(f => f.toLowerCase().endsWith('.tif'))
    .map(f => path.join(tiffDir, f))
    .sort();
  if (files.length === 0) throw new Error('No TIFF pages found for OCR');

  const tempPdfs: string[] = [];
  for (const file of files) {
    const outBase = file.replace(/\.tif$/i, '');
    await execFileAsync('tesseract', [file, outBase, '-l', language, 'pdf']);
    tempPdfs.push(outBase + '.pdf');
  }

  // Merge per-page PDFs into one searchable PDF using Ghostscript
  const gs = process.arch.includes('64') ? 'gswin64c' : 'gswin32c';
  await execFileAsync(gs, [
    '-dBATCH',
    '-dNOPAUSE',
    '-sDEVICE=pdfwrite',
    `-sOutputFile=${outPdf}`,
    ...tempPdfs,
  ]);
}

async function extractWithTabulaToXlsx(pdfPath: string, xlsxOut: string) {
  const tabula = Tabula(pdfPath, { pages: 'all', lattice: true, guess: false });
  const tables: string[][] = await new Promise((resolve) => {
    tabula.extractCsv((err: any, data: string) => {
      if (err || !data) return resolve([]);
      const parsed = data
        .split('\n')
        .map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim()))
        .filter((r) => r.some((c) => c && c.length > 0));
      resolve(parsed);
    });
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(tables);
  XLSX.utils.book_append_sheet(wb, ws, 'Table_1');
  XLSX.writeFile(wb, xlsxOut);
}

async function main() {
  const inputDir = path.resolve('Sample_input_files');
  const workDir = path.resolve('ocr_work');
  const outDir = path.resolve('outputs_tabula');
  await ensureDir(workDir);
  await ensureDir(outDir);

  const pdfs = (await fs.promises.readdir(inputDir))
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .map((f) => path.join(inputDir, f));

  console.log(`Found ${pdfs.length} PDF(s)`);

  for (const pdf of pdfs) {
    const base = path.basename(pdf, '.pdf');
    const jobDir = path.join(workDir, base);
    await ensureDir(jobDir);
    console.log(`OCR: ${base}.pdf`);

    try {
      await runGhostscriptToTiff(pdf, jobDir);
      const searchablePdf = path.join(jobDir, `${base}.searchable.pdf`);
      await runTesseractOnTiffs(jobDir, searchablePdf, 'eng');
      const xlsxOut = path.join(outDir, `${base}.xlsx`);
      console.log(`Tabula: ${base}.pdf -> ${xlsxOut}`);
      await extractWithTabulaToXlsx(searchablePdf, xlsxOut);
      console.log(`Saved: ${xlsxOut}`);
    } catch (err) {
      console.error(`Failed ${base}:`, err);
    }
  }

  console.log('OCR+Tabula batch complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });


