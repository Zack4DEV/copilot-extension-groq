import Groq from "groq-sdk";
import { RunnerResponse, defaultModel, Tool } from "../functions.js";
import { ModelsAPI } from "./models-api.js";

abstract class Tool {
  abstract run(messages: string[], args: Record<string, any>): Promise<RunnerResponse>;
}

// Define the class for listing available models
export class listModels extends Tool {
  static definition = {
    name: "list_models",
    description: "This function lists the AI models available in Groq Cloud Models.",
    parameters: {
      type: "object",
      properties: {},
      description: "No input parameters are required. It simply returns a list of models.",
    },
  };

  async execute(messages: string[]): Promise<RunnerResponse> {
    try {
      // Fetch the list of models from ModelsAPI
      const models: Model[] = await this.modelsAPI.listModels();

      // Generate a system message with Markdown-formatted model details
      const systemMessage = [
        "The user is asking for a list of available models.",
        "Respond with a concise and readable list of the models, including a short description for each one.",
        "Use markdown formatting for better readability.",
        "The list of models is as follows:",
        models.map((model) => `
          ## ${model.displayName || "Unknown Model"}
          - **Publisher**: ${model.publisher || "Unknown"}
          - **Description**: ${model.summary || "No summary available"}
        `),
      ];

      // Return the RunnerResponse
      return {
        modelUsed: defaultModel, // Use defaultModel as a placeholder
        messages: systemMessage,
      };
    } catch (error) {
      console.error("Error fetching models:", error);
      throw new Error("Failed to fetch models. Please try again later.");
    }
  }
}
