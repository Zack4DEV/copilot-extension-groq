import Groq from "groq-sdk";
import { RunnerResponse, defaultModel, Tool } from "../functions.js";
import { ModelsAPI } from "./models-api.js";

abstract class Tool {
  abstract run(messages: string[], args: Record<string, any>): Promise<RunnerResponse>;
}

// Defined class to recommend the most appropriate model
export class RecommendModel extends Tool {
  static definition = {
    name: "recommend_model",
    description:
      "Determines and recommends the most appropriate machine learning model based on the provided use-case.",
    parameters: {
      type: "object",
      properties: {},
      description: "No input parameters required; logic determines the best model.",
    },
  };

  async execute(messages: string[]): Promise<RunnerResponse> {
    const models: Model[] = await this.modelsAPI.listModels();

    const systemMessage: string[] = [
      "The user is asking for you to recommend the right model for their use-case.",
      "Explain your reasoning and why you recommend the chosen model.",
      "Provide a summary of the model's capabilities and limitations.",
      "Use the available models to make your recommendation.",
      "The list of available models is as follows:",
    ];

    for (const modelUsed of models) {
      systemMessage.push(`
        \t- Model Name: ${modelUsed.name}
        \t\tModel Version: ${modelUsed.version || "Unknown"}
        \t\tPublisher: ${modelUsed.publisher || "Unknown"}
        \t\tModel Registry: ${modelUsed.registryName || "Unknown"}
        \t\tLicense: ${modelUsed.license || "Unknown"}
        \t\tTask: ${(modelUsed.inferenceTasks || []).join(", ")}
        \t\tSummary: ${modelUsed.summary || "No summary available."}
      `);
    }

    return { modelUsed: defaultModel, messages: systemMessage };
  }
}
