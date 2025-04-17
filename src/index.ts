import { createServer, type IncomingMessage } from "node:http";

import {
  verifyAndParseRequest,
  transformPayloadForOpenAICompatibility,
  getFunctionCalls,
  createDoneEvent,
  createReferencesEvent,
} from "@copilot-extensions/preview-sdk";

import Groq from "groq-sdk";

import { describeModel } from "./functions/describe-model.js";
import { executeModel } from "./functions/execute-model.js";
import { listModels } from "./functions/list-models.js";
import { RunnerResponse } from "./functions.js";
import { recommendModel } from "./functions/recommend-model.js";
import { ModelsAPI } from "./models-api.js";

async function getBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = createServer(async (request, response) => {
  if (request.method === "GET") {
    response.statusCode = 200;
    response.end("OK");
    return;
  }

  const body = await getBody(request);

  let verifyAndParseRequestResult: Awaited<ReturnType<typeof verifyAndParseRequest>>;
  const apiKey = request.headers["authorization"]; 

  if (!apiKey) {
    response.statusCode = 401;
    response.end("Unauthorized: Missing API key");
    return;
  }

  try {
    verifyAndParseRequestResult = await verifyAndParseRequest(body, {
      secret: process.env.GROQ_API_KEY ?? "",
    });

    response.statusCode = 200;
    response.end("Request processed successfully.");
  } catch (err: any) {
    response.statusCode = 400;
    response.end(`Error: ${err.message}`);
  }
  
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
