import { createServer } from "http";
import finalHandler from "./Handler.js";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.GROQ_API_KEY || !process.env.COPILOT_SECRET || !process.env.COPILOT_KEY_ID) {
  throw new Error("Environment variables GROQ_API_KEY, COPILOT_SECRET, and COPILOT_KEY_ID are required.");
}

createServer(async (req, res) => {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body = Buffer.concat(chunks).toString();

    const response = await finalHandler(
      body,
      process.env.COPILOT_SECRET,
      process.env.COPILOT_KEY_ID
    );

    if (!response || typeof response.statusCode !== "number" || typeof response.body !== "string") {
      console.error("Invalid handler response format:", response);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Handler returned invalid response format" }));
      return;
    }

    res.writeHead(response.statusCode, { "Content-Type": "application/json" });
    res.end(response.body);
  } catch (err) {
    console.error("Server error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}).listen(3000, () => {
  console.log("Server listening on port 3000");
});
