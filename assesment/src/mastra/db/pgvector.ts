// src/db/pgvector.ts
import { PgVector } from "@mastra/pg";

export const pgVector = new PgVector({
  connectionString: process.env.POSTGRES_CONNECTION_STRING!,
});
