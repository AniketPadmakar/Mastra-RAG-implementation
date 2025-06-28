import { Mastra } from "@mastra/core";
import { berkshireAgent } from "../mastra/agents/BerkshireAgent"; // adjust if needed
import { PgVector } from "@mastra/pg";

// Setup vector store
const pgVector = new PgVector({
  connectionString: process.env.DATABASE_URL!,
});

// Create the mastra instance
export const mastra = new Mastra({
  agents: { berkshireAgent },
  vectors: { pgVector },
});
