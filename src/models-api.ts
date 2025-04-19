import Groq from "groq-sdk";

export type ModelSchema = {
  parameters: ModelSchemaParameter[];
  capabilities: Record<string, boolean>;
};

export type ModelSchemaParameter = {
  key: string;
  type: "number" | "integer" | "array" | "string" | "boolean";
  payloadPath: string;
  default?: number | string | boolean | any[];
  min?: number;
  max?: number;
  required: boolean;
  description?: string;
  friendlyName?: string;
};

export type Model = {
  id: string;
  name: string;
  schema?: ModelSchema;
};

export class ModelsAPI {
  inference: Groq;
  private _models: Model[] | null = null;

  constructor(groqClient: Groq) {
    this.inference = groqClient;
  }

  async getModel(modelId: string): Promise<{ model: Model; schema: ModelSchema | undefined }> {
    const modelFromIndex = await this.getModelFromIndex(modelId);
    const schema: ModelSchema | undefined = modelFromIndex.schema;
    return {
      model: modelFromIndex,
      schema: schema,
    };
  }

  async loadModels(): Promise<void> {
    const response = await this.inference.models.list();
    this._models = response.data.map(apiModel => ({
      id: apiModel.id,
      name: apiModel.id,
    })) as Model[];
  }

  public getLoadedModels(): Model[] | null {
    return this._models;
  }

  private async getModelFromIndex(modelId: string): Promise<Model> {
    if (!this._models) {
      await this.loadModels();
    }
    const models = this._models as Model[];
    const found = models.find((m) => m.id === modelId);
    if (!found) {
      throw new Error(`Model ${modelId} not found in index`);
    }
    return found;
  }
}
