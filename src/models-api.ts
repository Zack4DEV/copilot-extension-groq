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

export declare class ModelsAPI {
  inference: Groq;
  private _models: Model[] | null = null;

  constructor(groqClient: Groq) {
    this.inference = groqClient;
  }

  async getModel(model: string): Promise<{ model: Model; schema: ModelSchema }> {
    const modelFromIndex = await this.getModelFromIndex(model);
    const modelRes = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (modelRes.ok) {
      const modelData = await modelRes.json();
      return {
        model: modelFromIndex,
        schema: modelData as ModelSchema,
      };
    } else {
      throw new Error("Failed to fetch model: " + modelRes.statusText);
    }
  }

  private async getModelFromIndex(model: string): Promise<Model> {
    if (!this._models) {
      await this.loadModels();
    }
    const found = this._models?.find((m) => m.id === model);
    if (!found) {
      throw new Error(`Model ${model} not found in index`);
    }
    return found;
  }

  private async loadModels(): Promise<void> {
    const response = await this.inference.models.list();
    this._models = response.data as Model[];
  }
}
