import { listModels } from "./functions/list-models.js";
import { DescribeModel } from "./functions/describe-model.js";
import { ExecuteModel } from "./functions/execute-model.js";
import { RecommendModel } from "./functions/recommend-model.js";
import { StartSession } from "./functions/start-session.js";
import { SendMessage } from "./functions/send-message.js";
import { ModelsAPI } from "./models-api.js";
import Groq from "groq-sdk";
import * as dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const modelsAPI = new ModelsAPI(groq);

interface FunctionRunner {
  run(args: any): Promise<any>;
}

export const extensionManifest = {
  name: "Groq Extension",
  description: "Interact with Groq Cloud Models and start interactive agent sessions.",
  icon: "src/assets/image/Copilot.svg",
  functions: {
    listModels: new listModels(modelsAPI),
    describeModel: new DescribeModel(modelsAPI),
    executeModel: new ExecuteModel(modelsAPI),
    recommendModel: new RecommendModel(modelsAPI),
    startSession: new StartSession(modelsAPI),
    sendMessage: new SendMessage(modelsAPI),
  } as Record<string, FunctionRunner>,
};