import { Tool, RunnerResponse, defaultModel } from "../functions.js";
import { ModelsAPI } from "../models-api.js";

export class DescribeModel extends Tool {
  modelsAPI: ModelsAPI;

  constructor(modelsAPI: ModelsAPI) {
    super(modelsAPI);
    this.modelsAPI = modelsAPI;
  }

  async run(args: any[]): Promise<RunnerResponse> {
    const modelId = args[0] as string;
  
    if (!modelId) {
      return {
        modelUsed: defaultModel,
        messages: ["Error: modelId argument is missing."],
      };
    }
    try {
      const model = await this.modelsAPI.getModel(modelId);
      const schemaString = model.schema ? JSON.stringify(model.schema, null, 2) : "No schema available";
      return {
        modelUsed: model.model.id,
        messages: [
          `Model ID: ${model.model.id}
Schema: ${schemaString}`,
        ],
      };
    } catch (error: any) {
      console.error(error);
      return {
        modelUsed: defaultModel,
        messages: [
          `Failed to describe model ${modelId}: ${error.message}`,
        ],
      };
    }
  }
}
