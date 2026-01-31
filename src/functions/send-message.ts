/**
 * Copilot extension function: sendMessage
 * - sends a message in the context of a session
 * - appends user message to session history and invokes Groq chat API
 */
import { Tool, RunnerResponse } from "../functions.js";
import { ModelsAPI } from "../models-api.js";
import { defaultSessionManager } from "../lib/session.js";
import { createDefaultGroqClient } from "../lib/groqClient.js";

export class SendMessage extends Tool {
  modelsAPI: ModelsAPI;

  static definition = {
    name: "send_message",
    description: "Send a user message inside an agent session and get the model response.",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        message: { type: "string" },
        model: { type: "string" }
      },
      required: ["sessionId", "message"]
    }
  };

  constructor(modelsAPI: ModelsAPI) {
    super(modelsAPI);
    this.modelsAPI = modelsAPI;
  }

  async run(args: any[]): Promise<RunnerResponse> {
    const payload = args[0] ?? {};
    const sessionId = payload.sessionId;
    const message = payload.message;
    const model = payload.model ?? undefined;

    if (!sessionId || !message) {
      return { modelUsed: model ?? "default", messages: ["sessionId and message are required"] };
    }

    const session = defaultSessionManager.get(sessionId);
    if (!session) {
      return { modelUsed: model ?? "default", messages: [`Session ${sessionId} not found`] };
    }

    // append user message
    defaultSessionManager.appendMessage(sessionId, { role: "user", content: message });

    const groq = createDefaultGroqClient();
    const usedModel = model ?? session.model ?? "gemma2-9b-it";

    try {
      const resp = await groq.chatComplete(usedModel, session.messages, false);
      const content = resp.choices?.[0]?.message?.content ?? "No response from model";

      // append assistant message
      defaultSessionManager.appendMessage(sessionId, { role: "assistant", content });

      return { modelUsed: usedModel, messages: [content] };
    } catch (err: any) {
      console.error("Groq call failed", err);
      return { modelUsed: usedModel, messages: [`Groq error: ${String(err?.message ?? err)}`] };
    }
  }
}