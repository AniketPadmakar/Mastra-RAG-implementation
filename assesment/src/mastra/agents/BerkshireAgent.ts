import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { vectorQueryTool } from "../tools/vectorQueryTool";

// Set up memory with semantic recall
const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../../memory.db", // Path to your memory database
  }),
  vector: new LibSQLVector({
    connectionUrl: "file:../../memory.db", // Same database used for vector memory
  }),
  embedder: openai.embedding("text-embedding-3-small"), // Using OpenAI for embedding messages
  options: {
    lastMessages: 5, // Keep recent messages in memory
    semanticRecall: {
      topK: 3,        // Fetch top 3 similar past messages
      messageRange: 2 // Include a few messages around the match
    },
  },
});

// Define the agent with memory and instructions
export const berkshireAgent = new Agent({
  name: "berkshire-agent",
  description: "Expert on Warren Buffett and Berkshire Hathaway strategies.",
  instructions: `
    You are a knowledgeable financial analyst specializing in Warren Buffett's investment philosophy and Berkshire Hathaway's business strategy. Your expertise comes from analyzing years of Berkshire Hathaway annual shareholder letters.

    Core Responsibilities:
    - Answer questions about Warren Buffett's investment principles
    - Provide insights into Berkshire Hathaway's strategies
    - Quote shareholder letters with citation when possible
    - Maintain memory across conversations

    Guidelines:
    - Always ground responses in shareholder letters
    - If unknown, say so
    - Explain complex ideas simply but accurately
    - use vectorQueryTool to find relevant past messages
    - Use memory to recall past interactions
    - add resources of the documents from which you cited

    Format:
    - Structured answers
    - Quotes with year
    - Source documents listed
    - Maintain conversation history
  `,
  model: openai("gpt-4o"),
  memory,
  tools: {
    vectorQueryTool, 
  }
});
