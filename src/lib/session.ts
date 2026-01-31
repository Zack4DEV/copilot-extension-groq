/**
 * In-memory session manager for agent interactions.
 * Keep very small and replaceable (e.g., Redis) in production.
 */
import { ChatMessage } from './groqClient.js';

export type SessionId = string;

export type Session = {
  id: SessionId;
  createdAt: string;
  updatedAt: string;
  model?: string;
  messages: ChatMessage[];
  metadata?: Record<string, any>;
};

export class SessionManager {
  private sessions = new Map<SessionId, Session>();

  create(sessionId: SessionId, opts?: Partial<Session>) {
    const now = new Date().toISOString();
    const session: Session = {
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      model: opts?.model ?? undefined,
      messages: opts?.messages ?? [],
      metadata: opts?.metadata ?? {},
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  get(sessionId: SessionId) {
    return this.sessions.get(sessionId);
  }

  appendMessage(sessionId: SessionId, message: ChatMessage) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Session ${sessionId} not found`);
    s.messages.push(message);
    s.updatedAt = new Date().toISOString();
    return s;
  }

  reset(sessionId: SessionId) {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    s.messages = [];
    s.updatedAt = new Date().toISOString();
    return s;
  }

  delete(sessionId: SessionId) {
    return this.sessions.delete(sessionId);
  }
}

/**
 * Export a default manager for the extension runtime (in-memory).
 * This is intentional to keep running extension stateless across restarts,
 * but easy to adapt to persistent store later.
 */
export const defaultSessionManager = new SessionManager();