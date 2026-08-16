import { ChatSession, ChatMessage, QualificationStep } from "../models/chat.types";
import { v4 as uuidv4 } from "uuid";

export class ChatRepository {
  private static sessions: Map<string, ChatSession> = new Map();
  private static escalations: any[] = [];
  private static roofCaptures: Map<string, any> = new Map();

  public static getSession(id: string): ChatSession | undefined {
    return this.sessions.get(id);
  }

  public static createSession(leadId?: string): ChatSession {
    const id = `CS-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const session: ChatSession = {
      id,
      leadId,
      status: "ACTIVE",
      currentStep: "HOMEOWNER",
      qualification: {},
      messages: [
        {
          id: `MSG-${uuidv4().substring(0, 6)}`,
          sessionId: id,
          sender: "bot",
          text: "👋 Hi! I'm your SolarFlow Assistant. I can answer any product or pricing questions, or walk you through an instant 1-minute solar estimate for your home.\n\nTo start your customized estimate: **Do you own your home?**",
          timestamp: now,
          quickReplies: ["Yes, I own it", "No, I rent", "Commercial Property"],
        },
      ],
      assignedRep: "Dana Ruiz",
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(id, session);
    return session;
  }

  public static saveSession(session: ChatSession): ChatSession {
    session.updatedAt = new Date().toISOString();
    this.sessions.set(session.id, session);
    return session;
  }

  public static getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public static addMessage(sessionId: string, message: ChatMessage): ChatMessage {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push(message);
      session.updatedAt = new Date().toISOString();
      this.sessions.set(sessionId, session);
    }
    return message;
  }

  public static recordRoofData(sessionId: string, roofData: any) {
    this.roofCaptures.set(sessionId, {
      ...roofData,
      recordedAt: new Date().toISOString(),
    });
  }

  public static getRoofData(sessionId: string) {
    return this.roofCaptures.get(sessionId);
  }

  public static recordEscalation(sessionId: string, reason: string, assignedRep = "Dana Ruiz") {
    const escalation = {
      id: `ESC-${uuidv4().substring(0, 8)}`,
      sessionId,
      reason,
      assignedRep,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    this.escalations.unshift(escalation);

    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = "ESCALATED";
      session.assignedRep = assignedRep;
      this.saveSession(session);
    }

    return escalation;
  }

  public static getEscalations() {
    return this.escalations;
  }
}
