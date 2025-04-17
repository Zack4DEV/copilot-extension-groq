import Groq from "groq-sdk";
import { RunnerResponse, defaultModel, Tool } from "../functions.js";
import { ModelsAPI } from "./models-api.js";

abstract class Tool {
  abstract run(messages: string[], args: Record<string, any>): Promise<RunnerResponse>;
}

export class DescribeModel extends Tool {
  static definition = {
    name: "describe_model",
    description: "Describes a specific model.",
    parameters: {
      type: "object",
      properties: {
        modelUsed: {
          type: "string",
          description: [
            'The model to describe. Example: llama-4-maverick-17b-128e-instruct or gemma-9b-it.',
            'The list of models is available in the chat <-- LIST OF MODELS --> section.',
            'If the model name is not found, pick the closest matching model from the list.',
          ].join("\n"),
        },
      },
      required: ["modelUsed"],
    },
  };

  async execute(
    messages: string[],
    args: { modelUsed: string }
  ): Promise<RunnerResponse> {
    try {
      // Fetched model details from API
      const [model, modelSchema] = await Promise.all([
        this.modelsAPI.getModel(args.modelUsed),
        this.modelsAPI.getModelSchema(args.modelUsed),
      ]);

      // Validated the response before constructing the system message
      if (!model) {
        throw new Error("Model '" + args.modelUsed + "' not found.");
      }
      
      const systemMessage = [
        "The user is asking about the AI model with the following details:",
        `\tModel Name: ${model.name || "Unknown"}`,
        `\tModel Version: ${model.version || "Unknown"}`,
        `\tPublisher: ${model.publisher || "Unknown"}`,
        `\tModel Registry: ${model.registryName || "Unknown"}`,
        `\tLicense: ${model.license || "Unknown"}`,
        `\tTask: ${(model.inferenceTasks || []).join(", ")}`,
        `\tDescription: ${model.description || "No description available."}`,
        `\tSummary: ${model.summary || "No summary available."}`,
        "",
        "API requests for this model use the following schema:",
        "",
        "json",
        JSON.stringify(modelSchema, null, 2),
        "",
      ].join("\n");
      

      return {
        modelUsed: args.modelUsed,
        messages: [systemMessage],
      };
    } catch (error) {
      console.error("Error describing model:", error);
      throw new Error(`Failed to describe model. Reason: ${error.message}`);
    }
  }

}