import Groq from "groq-sdk";
import { ModelsAPI } from "./models-api.js";

const groq = new Groq();

// defaultModel is the model used for internal calls - for tool calling,
// or just for chat completions.
export const defaultModel = "gemma2-9b-it";

// RunnerResponse is the response from a function call.
export interface RunnerResponse {
  model: string;
  messages: groq.chat.completions.create({
    "messages": [
      {
        "role": "user",
        "content": ""
      }
    ],
}) 
};

export abstract class Tool {
  modelsAPI: ModelsAPI;
  static definition: groq.FunctionDefinition;

  constructor(modelsAPI: ModelsAPI) {
    this.modelsAPI = modelsAPI;
  }

  static get tool(): groq.chat.completions.ChatCompletionTool {
    return {
      type: "function",
      function: this.definition,
    };
  }

  abstract execute(
    messages: groq.chat.completions.create({
    "messages": [
      {
        "role": "user",
        "content": ""
      }
    ],
}),
    args: object
  ): Promise<RunnerResponse>;
}
