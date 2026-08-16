import { Router, Request, Response } from "express";
import { ProductChatbotEngine } from "../services/chatbot-engine.service";
import { ChatRepository } from "../repositories/chat.repository";
import { RetrievalService } from "../services/retrieval.service";

export function createChatExpressRouter(): Router {
  const router = Router();

  // 1. Send / Process a Chat Message
  router.post("/message", async (req: Request, res: Response) => {
    try {
      const { sessionId, message, leadId } = req.body || {};
      const result = await ProductChatbotEngine.processMessage(sessionId, message, leadId);
      res.json({
        success: true,
        sessionId: result.session.id,
        session: result.session,
        botMessage: result.botMessage,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to process message" });
    }
  });

  // 2. Get Chat Session Details
  router.get("/:session_id", (req: Request, res: Response) => {
    const session = ChatRepository.getSession(req.params.session_id);
    if (!session) {
      // Auto-create if not found
      const newSession = ChatRepository.createSession();
      return res.json({ session: newSession });
    }
    return res.json({ session });
  });

  // 3. Submit Map Sub-Window Roof Data
  router.post("/:session_id/roof-data", (req: Request, res: Response) => {
    try {
      const { address, roofAreaSqFt, polygon } = req.body || {};
      const area = typeof roofAreaSqFt === "number" ? roofAreaSqFt : 550;
      const updatedSession = ProductChatbotEngine.handleRooftopCapture(req.params.session_id, {
        address,
        roofAreaSqFt: area,
        polygon,
      });
      res.json({
        success: true,
        sessionId: updatedSession.id,
        session: updatedSession,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to record roof data" });
    }
  });

  // 4. Poll Map Sub-Window Status
  router.get("/:session_id/rooftop-status", (req: Request, res: Response) => {
    const roofData = ChatRepository.getRoofData(req.params.session_id);
    res.json({
      hasRoofData: !!roofData,
      roofData: roofData || null,
    });
  });

  // 5. Trigger Pre-Design Calculation
  router.post("/:session_id/calculate", (req: Request, res: Response) => {
    const session = ChatRepository.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    const estimate = ProductChatbotEngine.calculateEstimate(session.qualification);
    session.estimate = estimate;
    session.status = "QUALIFIED";
    ChatRepository.saveSession(session);

    res.json({ success: true, estimate, session });
  });

  // 6. Human Sales Rep Escalation
  router.post("/:session_id/escalate", (req: Request, res: Response) => {
    const { reason } = req.body || {};
    const escalation = ChatRepository.recordEscalation(
      req.params.session_id,
      reason || "User requested human consultant"
    );
    res.json({ success: true, escalation });
  });

  // 7. Get Verified Product Catalog
  router.get("/catalog/items", (req: Request, res: Response) => {
    res.json(RetrievalService.getCatalog());
  });

  // 8. List All Sessions (Admin view)
  router.get("/admin/sessions", (req: Request, res: Response) => {
    res.json({ sessions: ChatRepository.getAllSessions() });
  });

  // 9. List All Escalations
  router.get("/admin/escalations", (req: Request, res: Response) => {
    res.json({ escalations: ChatRepository.getEscalations() });
  });

  return router;
}
