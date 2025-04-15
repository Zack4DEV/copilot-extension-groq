import Groq from "groq-sdk";

// Model is the structure of a model in the model catalog.
export interface Model {
  name: string;
  displayName: string;
  version: string;
  publisher: string;
  registryName: string;
  license: string;
  inferenceTasks: string[];
  description?: string;
  summary: string;
}

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

export class ModelsAPI {
  inference: Groq;
  private _models: Model[] | null = null;

  constructor(apiKey: string) {
    this.inference = new groq({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
    });
  }

  async getModel(modelName: string): Promise<Model> {
    const modelFromIndex = await this.getModelFromIndex(modelName);

    const modelRes = await fetch(
      `https://api.groq.com/openai/v1/${modelFromIndex.registryName}/model/${modelFromIndex.name}/version/${modelFromIndex.version}`,
    );
    if (!modelRes.ok) {
      throw new Error(`Failed to fetch ${modelName} details from the model catalog.`);
    }
    const model = (await modelRes.json()) as Model;
    return model;
  }

  async getModelSchema(modelName: string): Promise<ModelSchema> {
    const modelFromIndex = await this.getModelFromIndex(modelName);

    const modelSchemaRes = await fetch(
      `https://api.groq.com/openai/v1/${modelFromIndex.registryName}/model/${modelFromIndex.name.toLowerCase()}/version/${modelFromIndex.version.toLowerCase()}}.json`
    );
    if (!modelSchemaRes.ok) {
      throw new Error(
        `Failed to fetch ${modelName} schema from the model catalog.`
      );
    }
    const modelSchema = (await modelSchemaRes.json()) as ModelSchema;
    return modelSchema;
  }

  async listModels(): Promise<Model[]> {
    if (this._models) {
      return this._models;
    }

    const modelsRes = await fetch(
      "https://api.groq.com/openai/v1/models",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: [
            { field: "freePlayground", values: ["true"], operator: "eq" },
            { field: "labels", values: ["latest"], operator: "eq" },
          ],
          order: [{ field: "displayName", direction: "Asc" }],
        }),
      }
    );
    if (!modelsRes.ok) {
      throw new Error("Failed to fetch models from the model catalog");
    }

    const models = (await modelsRes.json()).summaries as Model[];
    this._models = models;
    return models;
  }

  async getModelFromIndex(modelName: string): Promise<Model> {
    this._models = this._models || (await this.listModels());
    const modelFromIndex = this._models.find((model) => model.name === modelName);
    if (!modelFromIndex) {
      throw new Error(`Failed to fetch ${modelName} from the model catalog.`);
    }
    return modelFromIndex;
  }
}
