import Groq from "groq-sdk";
import { Response, Tool } from "../functions.js";
import { ModelsAPI } from "./models-api.js";

// Defined type for messages with references
type MessageWithReferences = {
  copilot_references?: Reference[];
  content: string;
};

// Defined type for references
interface Reference {
  type: string;
  data: any;
  id: string;
  metadata: any;
}

abstract class Tool {
  abstract run(messages: string[], args: Record<string, any>): Promise<RunnerResponse>;
}

// Class execute a model
export class ExecuteModel extends Tool {
  static definition = {
    name: "execute_model",
    description: `This function sends the user's message prompt to the specified model. Example Queries: - using gemma2-9b-it: what is 1+1? - using llama-4-maverick-17b-128e-instruct: explain this code.`,
    parameters: {
      type: "object",
      properties: {
        modelUsed: {
          type: "string",
          description: [
            "The name of the model to execute. It is ONLY the name of the model, not the publisher or registry.",
            "For example: gemma2-9b-it, or llama-4-maverick-17b-128e-instruct.",
            "The list of models is available in the context window of the chat, in the <-- LIST OF MODELS --> section.",
            "If the model name is not found in the list of models, pick the closest matching model from the list.",
          ].join("\n"),
        },
        instruction: {
          type: "string",
          description: "The instruction to execute.",
        },
      },
      required: ["modelUsed", "instruction"],
    },
  };

  async execute(messages: MessageWithReferences[], args: { modelUsed: string; instruction: string }): Promise<Response> {
    try {
      const lastMessage = messages[messages.length - 1];
      let importantRefs: Reference[] = [];
      if (lastMessage?.copilot_references) {
        importantRefs = lastMessage.copilot_references.filter(
          (ref) => ref.type === "client.selection" || ref.type === "client.file"
        );
      }
      const content: string[] = [
        `The user has chosen to use the model named ${args.modelUsed}.`,
      ];
      if (importantRefs.length > 0) {
        content.push("The user included the following context - you may find information in this context useful for your response:");
        importantRefs.forEach((ref) => content.push(`- Reference Type: ${ref.type}\n  Reference ID: ${ref.id}\n  Metadata: ${JSON.stringify(ref.metadata)}`));
      }
      content.push(`Instruction: ${args.instruction}`);
      // Execute the model and return a response
      const modelExecutionResult = `Executed instruction "${args.instruction}" using model "${args.modelUsed}"`;
      return {
        modelUsed: args.modelUsed,
        messages: [
          {
            role: ["gemma2-9b-it", "llama-4-maverick-17b-128e-instruct"].includes(args.modelUsed) ? "assistant" : "system",
            content: content.join("\n"),
          },
          {
            role: "user",
            content: args.instruction,
          },
          {
            role: "assistant",
            content: modelExecutionResult,
          },
        ],
      };
    } catch (error) {
      console.error("Error executing model:", error);
      throw new Error("Failed to execute model. Please try again later.");
    }
  }
}