import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PgVector } from '@mastra/pg';

async function loadDocuments() {
  const parsedDataPath = path.join(__dirname, '../output/parsed-pdfs.json');
  const file = await fs.readFile(parsedDataPath, 'utf-8');
  const parsedDocs = JSON.parse(file);
  const combinedText = parsedDocs.map((d: any) => d.text).join('\n\n');
  return MDocument.fromText(combinedText);
}

async function chunkDocument(mDoc: MDocument) {
  const chunks = await mDoc.chunk({
    strategy: 'recursive',
    size: 512,
    overlap: 50,
    separator: '\n',
  });
  console.log(` Chunked into ${chunks.length} chunks`);
  return chunks;
}

async function generateEmbeddings(chunks: any[]) {
  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: chunks.map(chunk => chunk.text),
  });
  console.log(` Generated ${embeddings.length} embeddings`);
  return embeddings;
}

async function storeInPgVector(embeddings: number[][]) {
  const pgVector = new PgVector({ connectionString: process.env.DATABASE_URL! });
  console.log(' Connecting to pgvector...');
  await pgVector.createIndex({
    indexName: 'embeddings',
    dimension: 1536,
    metric: 'cosine',
  });
  console.log(' Created pgvector index');
  await pgVector.upsert({
    indexName: 'embeddings',
    vectors: embeddings,
    //metadata: chunks.map(c => ({ text: c.text }))
  });
  console.log(' Upserted embeddings into pgvector');
  console.log(' Stored embeddings in pgvector (with table & index setup)');
}

async function main() {
  const doc = await loadDocuments();
  const chunks = await chunkDocument(doc);
  const embeddings = await generateEmbeddings(chunks);
  await storeInPgVector(embeddings);
}

main().catch(err => console.error(' Error:', err));
