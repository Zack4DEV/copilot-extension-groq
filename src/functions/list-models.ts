import Groq from "groq-sdk";
import { RunnerResponse, defaultModel, Tool } from "../functions.js";

const groq = new Groq();

export class listModels extends Tool {
  static definition = {
    name: "list_models",
    description:
      "This function lists the AI models available in Groq Cloud Models.",
    parameters: {
      type: "object",
      properties: {},
      description:
        "This function does not require any input parameters. It simply returns a list of models.",
    },
  };

  async execute(
    messages: groq.chat.completions.create({
    "messages": [
      {
        "role": "user",
        "content": ""
      }
    ],
}) ) : Promise<RunnerResponse> {
    const models = await this.modelsAPI.listModels();

    const systemMessage = [
      "The user is asking for a list of available models.",
      "Respond with a concise and readable list of the models, with a short description for each one.",
      "Use markdown formatting to make each description more readable.",
      "Begin each model's description with a header consisting of the model's name",
      "That list of models is as follows:",
      JSON.stringify(
        models.map((model) => ({
          name: model.displayName,
          publisher: model.publisher,
          description: model.summary,
        }))
      ),
    ];

    return {
      model: defaultModel,
      messages: [
        { role: "system", content: systemMessage.join("\n") },
        ...messages,
      ],
    };
  }
}
