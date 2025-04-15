import Groq from "groq-sdk";
import { RunnerResponse, Tool } from "../functions.js";

const groq = new Groq();

type MessageWithReferences = groq.chat.completions.create({
    "messages": [
      {
        "role": "user",
        "content": ""
      }
    ],
    "model": "gemma2-9b-it",
    "temperature": 1,
    "max_completion_tokens": 1024,
    "top_p": 1,
    "stream": true,
    "stop": null
});

interface Reference {
  type: string;
  data: any;
  id: string;
  metadata: any;
}

export class executeModel extends Tool {
  static definition = {
    name: "execute_model",
    description: `This function sends the prompt from the user's message to the specified model.".
Example Queries (IMPORTANT: Phrasing doesn't have to match):
- using gemma2-9b-it: what is 1+1?
- using llama-4-maverick-17b-128e-instruct: explain this code.
  `,
    parameters: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description: [
            "The name of the model to execute. It is ONLY the name of the model, not the publisher or registry.",
            "For example: `gemma2-9b-it`, or `llama-4-maverick-17b-128e-instruct`.",
            "The list of models is available in the context window of the chat, in the `<-- LIST OF MODELS -->` section.",
            "If the model name is not found in the list of models, pick the closest matching model from the list.",
          ].join("\n"),
        },
        instruction: {
          type: "string",
          description: "The instruction to execute.",
        },
      },
      required: ["model", "instruction"],
    },
  };

  async execute(
    messages: MessageWithReferences[],
    args: {
      model: string;
      instruction: string;
    }
  ): Promise<RunnerResponse> {
    // Check if the user included any code references in their last message
    const lastMessage = messages[messages.length - 1];
    let importantRefs: Reference[] = [];
    if (lastMessage.copilot_references) {
        importantRefs = lastMessage.copilot_references.filter((ref) => ref.type === "client.selection" || ref.type === "client.file");
    }

    const content = [
      `The user has chosen to use the model named ${args.model}.`,
    ];

    if (importantRefs.length > 0) {
      content.push(
        "The user included the following context - you may find information in this context useful for your response:",
        JSON.stringify(importantRefs)
      );
    }

    return {
      model: args.model,
      messages: [
        {
          role: ["gemma2-9b-it", "llama-4-maverick-17b-128e-instruct"].includes(args.model) ? "assistant" : "system",
          content: content.join("\n"),
        },
        { role: "user", content: args.instruction },
      ],
    };
  }
}
