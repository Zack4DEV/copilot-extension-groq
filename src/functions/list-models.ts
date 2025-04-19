import { RunnerResponse, defaultModel, Tool } from "../functions.js";
import { Model, ModelsAPI } from "../models-api.js";

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

  modelsAPI: ModelsAPI;

  constructor(modelsAPI: ModelsAPI) {
    super(modelsAPI);
    this.modelsAPI = modelsAPI;
  }

  async run(args: any[]): Promise<RunnerResponse> {
    try {
      if (!this.modelsAPI.getLoadedModels()) {
          await this.modelsAPI.loadModels();
      }
      
      
      const models = this.modelsAPI.getLoadedModels();

      if (!models || models.length === 0) {
        return {
          modelUsed: defaultModel,
          messages: ["No models found."],
        };
      }

      const modelInfo = models.map((model: Model) => {
          return `Model ID: ${model.id}`;
        })
        .join("\n"); 


      return {
        modelUsed: defaultModel, 
        messages: [modelInfo],
      };
    } catch (error: any) {
      console.error(error);
      return {
        modelUsed: defaultModel,
        messages: [
          `Failed to list models: ${error.message}`,
        ],
      };
    }
  }
}
