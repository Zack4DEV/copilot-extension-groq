/**
 * Small Groq wrapper that centralizes creation and calls to groq-sdk so the rest of the
 * extension uses a small, testable API surface.
 *
 * Note: keep this file pure and easy to mock in unit tests.
 */
import Groq from "groq-sdk";

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export class GroqClient {
  private client: Groq;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is required to create GroqClient");
    this.client = new Groq({ apiKey: key });
  }

  async listModels() {
    const res = await this.client.models.list();
    return res.data;
  }

  async chatComplete(model: string, messages: ChatMessage[], stream = false) {
    const payload = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream,
    };
    const response = await this.client.chat.completions.create(payload);
    return response;
  }
}

/**
 * Factory to create the default client used by functions.
 */
export function createDefaultGroqClient() {
  return new GroqClient(process.env.GROQ_API_KEY);
}