// src/index.ts

import 'dotenv/config';
import readline from 'readline';
import { Mastra } from "@mastra/core";
import { createVectorQueryTool } from "@mastra/rag";
import { openai } from "@ai-sdk/openai";

// Import the agent 
import { berkshireAgent } from './mastra/agents/BerkshireAgent'; // adjust path if needed
import { PgVector } from "@mastra/pg";

// Set up vector store
const pgVector = new PgVector({
  connectionString: process.env.DATABASE_URL!,
});


// Register the agent and vector store
const mastra = new Mastra({
  agents: { berkshireAgent },
  vectors: { pgVector },
});

// CLI interface for chatting with the agent
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Main chat loop
async function chat() {
  const agent = mastra.getAgent("berkshireAgent");

  console.log("\nBerkshire RAG + Memory Agent (type 'exit' to quit)\n");

  while (true) {
    const question = await new Promise<string>((resolve) =>
      rl.question("You: ", resolve)
    );

    if (question.trim().toLowerCase() === "exit") {
      rl.close();
      break;
    }

    const response = await agent.generate(question);
    console.log(`\nAgent: ${response.text}\n`);
  }
}

chat();
