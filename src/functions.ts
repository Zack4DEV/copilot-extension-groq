import { ModelsAPI } from "./models-api.js";

export const defaultModel = "gemma2-9b-it";

export interface RunnerResponse {
  modelUsed: string;
  messages: string[]; 
}

export abstract class Tool {
  modelsAPI: ModelsAPI;
  static definition: unknown; 

  constructor(modelsAPI: ModelsAPI) {
    this.modelsAPI = modelsAPI;
  }

  abstract run(args: any[]): Promise<RunnerResponse>;
}
