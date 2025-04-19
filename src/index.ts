import { createServer } from "http";
import { verifyAndParseRequest } from "@copilot-extensions/preview-sdk";
import { listModels } from "./functions/list-models.js";
import { DescribeModel } from "./functions/describe-model.js";
import { ModelsAPI } from "./models-api.js";
import Groq from "groq-sdk";
import { ExecuteModel } from "./functions/execute-model.js";
import { RecommendModel } from "./functions/recommend-model.js";
import handler from "./handler.js";


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const modelsAPI = new ModelsAPI(groq);

interface FunctionRunner {
  run(args: any): Promise<any>;
}

const extensionManifest = {
  name: "Groq Extension",
  description: "Interact with Groq's Models.",
  icon: "src/assets/image/Copilot.png",
  functions: {
    listModels: new listModels(modelsAPI),
    describeModel: new DescribeModel(modelsAPI),
    executeModel: new ExecuteModel(modelsAPI),
    recommendModel: new RecommendModel(modelsAPI),
  } as Record<string, FunctionRunner>,
};

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString();

  const response = await handler.customHandler(body, process.env.COPILOT_SECRET, process.env.COPILOT_KEY_ID);

  res.writeHead(response.statusCode, { "Content-Type": "application/json" });
  res.end(response.body);
}).listen(3000);


export default handler.customHandler(extensionManifest, async (requestString: string, secret: string, keyID: string) => {
  console.log("requestString", requestString);
  console.log("secret", secret);
  console.log("keyID", keyID);

  const request = await verifyAndParseRequest(requestString, secret, keyID);

  if (!request || !request.isValidRequest) {
    return {
      statusCode: 401,
      body: "Invalid request signature",
    };
  }
  
  const payload = request.payload;

  const toolInvocation = (payload as any)?.toolInvocation;

  if (!toolInvocation) {
    return {
      statusCode: 400,
      body: "Missing toolInvocation in payload.",
    };
  }
  
  const { functionId, arguments: args } = toolInvocation;
    
  const functionToCall = extensionManifest.functions[functionId as keyof typeof extensionManifest.functions];

  if (!functionToCall) {
    return {
      statusCode: 404,
      body: `Function ${functionId} not found.`, 
    };
  }

  const result = await functionToCall.run(args);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
});