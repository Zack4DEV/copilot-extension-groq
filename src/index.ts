import { createServer } from "http";
import  handler from "./Handler.js"
import { ModelsAPI } from "./models-api.js";
import Groq from "groq-sdk";
import * as dotenv from "dotenv";
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

if (!process.env.GROQ_API_KEY || !process.env.COPILOT_SECRET || !process.env.COPILOT_KEY_ID) {
  throw new Error("Environment variables GROQ_API_KEY, COPILOT_SECRET, and COPILOT_KEY_ID are required.");
}

const modelsAPI = new ModelsAPI(groq);

interface FunctionRunner {
  run(args: any): Promise<any>;
}

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString();

  const response = await handler(body, process.env.COPILOT_SECRET, process.env.COPILOT_KEY_ID);

  res.writeHead(response.statusCode, { "Content-Type": "application/json" });
  res.end(response.body);
}).listen(3000);
