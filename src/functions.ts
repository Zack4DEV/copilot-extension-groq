import Groq from "groq-sdk";
import { ModelsAPI } from "./models-api.js";

// Model used for internal calls like chat completions or tool calling.
export const defaultModel = "gemma2-9b-it";

// RunnerResponse structure
export interface RunnerResponse {
  modelUsed: string;
  messages: string[]; 
}

// Abstract class for a tool using the ModelsAPI
export abstract class Tool {
  modelsAPI: ModelsAPI;
  static definition: unknown; 

  constructor(modelsAPI: ModelsAPI) {
    this.modelsAPI = modelsAPI;
  }

  // Defined abstract methods here
  abstract run(): Promise<RunnerResponse>;
}
