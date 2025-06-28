// src/pdf-parser.ts
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';

interface PDFMetadata {
  source: string;
  year: number;
  pages: number;
  fileSizeMB: number;
  extractedAt: string;
}

interface ParsedPDF {
  text: string;
  metadata: PDFMetadata;
}

const PDF_DIR = path.resolve('data/letters');
const OUTPUT_DIR = path.resolve('output');
const ALLOWED_YEAR_RANGE = { min: 1865, max: new Date().getFullYear() };

export async function parseAllPDFs(): Promise<ParsedPDF[]> {
  try {
    if (!fs.existsSync(PDF_DIR)) {
      throw new Error(`PDF directory not found: ${PDF_DIR}`);
    }
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const files = getPDFFiles(PDF_DIR);
    if (files.length === 0) {
      throw new Error(`No PDF files found in ${PDF_DIR}`);
    }

    const results: ParsedPDF[] = [];
    for (const file of files) {
      try {
        const parsed = await parsePDFFile(path.join(PDF_DIR, file));
        results.push(parsed);
        console.log(`Processed ${file} (${parsed.metadata.pages} pages)`);
      } catch (error) {
        console.error(`Failed to process ${file}:`, error instanceof Error ? error.message : error);
      }
    }

    const outputPath = path.join(OUTPUT_DIR, 'parsed-pdfs.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n Successfully parsed ${results.length}/${files.length} PDFs. Output saved to ${outputPath}`);

    return results;
  } catch (error) {
    console.error(' Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function getPDFFiles(directory: string): string[] {
  return fs.readdirSync(directory)
    .filter(file => path.extname(file).toLowerCase() === '.pdf')
    .sort();
}

async function parsePDFFile(filePath: string): Promise<ParsedPDF> {
  const buffer = fs.readFileSync(filePath);
  const { text, numpages } = await pdf(buffer);
  const filename = path.basename(filePath);

  return {
    text: cleanText(text),
    metadata: {
      source: filename,
      year: extractYearFromFilename(filename),
      pages: numpages,
      fileSizeMB: Math.round((buffer.length / (1024 * 1024)) * 100) / 100,
      extractedAt: new Date().toISOString(),
    },
  };
}

function cleanText(text: string): string {
  const preservedLineBreaks = text.replace(/([a-z])\.\n([A-Z])/g, '$1. $2');
  return preservedLineBreaks
    .replace(/\f/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/-\n/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractYearFromFilename(filename: string): number {
  const basename = path.basename(filename, '.pdf');
  const year = parseInt(basename);

  if (isNaN(year)) {
    throw new Error(`Invalid filename format: ${filename}. Expected YYYY.pdf`);
  }
  if (year < ALLOWED_YEAR_RANGE.min || year > ALLOWED_YEAR_RANGE.max) {
    throw new Error(`Year ${year} out of allowed range (${ALLOWED_YEAR_RANGE.min}-${ALLOWED_YEAR_RANGE.max})`);
  }

  return year;
}
