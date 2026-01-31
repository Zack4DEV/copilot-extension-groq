/**
 * Copilot extension function: startSession
 * - creates a session id
 * - optionally seeds system prompt / model
 *
 * This file follows your existing Tool/ModelsAPI pattern.
 */
import { Tool, RunnerResponse } from "../functions.js";
import { ModelsAPI } from "../models-api.js";
import { defaultSessionManager } from "../lib/session.js";
import { uid } from "../utils.js";

export class StartSession extends Tool {
  modelsAPI: ModelsAPI;

  static definition = {
    name: "start_session",
    description: "Create a new agent session for interactive conversations with Groq.",
    parameters: {
      type: "object",
      properties: {
        model: { type: "string", description: "Optional model id to use for the session" },
        systemPrompt: { type: "string", description: "Optional system prompt to seed the session" }
      },
      required: []
    }
  };

  constructor(modelsAPI: ModelsAPI) {
    super(modelsAPI);
    this.modelsAPI = modelsAPI;
  }

  async run(args: any[]): Promise<RunnerResponse> {
    const opts = args[0] ?? {};
    const model = opts.model ?? undefined;
    const systemPrompt = opts.systemPrompt ?? undefined;

    const sessionId = uid("sess_");
    const session = defaultSessionManager.create(sessionId, {
      model,
      messages: systemPrompt ? [{ role: "system", content: systemPrompt }] : []
    });

    return {
      modelUsed: model ?? "default",
      messages: [`sessionId:${sessionId}`, JSON.stringify({ createdAt: session.createdAt })]
    };
  }
}