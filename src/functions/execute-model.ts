import { ModelsAPI } from "../models-api.js";
import { RunnerResponse, Tool, defaultModel } from "../functions.js";
import Groq from "groq-sdk";


export class ExecuteModel extends Tool {
  groq: Groq;

  constructor(modelsAPI: ModelsAPI) {
    super(modelsAPI);
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY, 
    });
  }

  async run(args: any[]): Promise<RunnerResponse> {
    const model = args[0] as string;
    const prompt = args[1] as string;

    if (!model || !prompt) {
        return {
            modelUsed: defaultModel,
            messages: ["Error: model or prompt argument is missing."]
        }
    }

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
      });

      const content = chatCompletion.choices[0]?.message?.content;

      return {
        modelUsed: model, 
        messages: [content || "No response content"],
      };
    } catch (error: any) {
      console.log(error);
      return {
        modelUsed: model,
        messages: [`There was an error executing the model ${model}: ${error.message}`],
      };
    }
  }
}
