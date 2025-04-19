import { Tool, RunnerResponse } from "../functions.js";
import { ModelsAPI, Model } from "../models-api.js";
import { defaultModel } from "../functions.js";

export class RecommendModel extends Tool {
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
          messages: ["No models available to recommend."],
        };
      }

      const recommendedModel = models[0];
      const prompt = args[0] as string; // Extract prompt from arguments

      return {
        modelUsed: recommendedModel.id,
        messages: [
          `Based on your prompt "${prompt}", I recommend using the model: ${recommendedModel.id}`,
        ],
      };
    } catch (error: any) {
      console.error(error);
      return {
        modelUsed: defaultModel,
        messages: [
          `Failed to recommend model: ${error.message}`,
        ],
      };
    }
  }
}
