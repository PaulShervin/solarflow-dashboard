import { Router, Request, Response } from "express";
import { NurtureRepository } from "../repositories/nurture.repository";
import { NurtureEngineService } from "../services/nurture-engine.service";
import { SuppressionService } from "../services/suppression.service";
import { NextBestActionService } from "../services/next-best-action.service";
import { EnrollLeadSchema, CreateWorkflowSchema, CreateTemplateSchema, SmsWebhookSchema, EmailWebhookSchema } from "../schemas/nurture.schema";
import { eventBus } from "../events/event-bus";
import { v4 as uuidv4 } from "uuid";

export class NurtureRouter {
  private engine: NurtureEngineService;

  constructor(engine?: NurtureEngineService) {
    this.engine = engine || new NurtureEngineService();
  }

  /* ------------------------------ LEAD NURTURE ------------------------------ */

  async getLeadNurture(leadId: string) {
    const lead = NurtureRepository.getLeadById(leadId);
    if (!lead) return { error: "Lead not found", status: 404 };

    const activeEnrollments = NurtureRepository.getActiveEnrollmentsForLead(leadId);
    const messages = NurtureRepository.getMessagesForLead(leadId);
    const activities = NurtureRepository.getRecentActivities(leadId);
    const tasks = NurtureRepository.getTasksForLead(leadId);
    const isSuppressed = NurtureRepository.isSuppressed(lead.phone) || NurtureRepository.isSuppressed(lead.email);

    return {
      lead,
      isSuppressed,
      activeEnrollments,
      messages,
      activities,
      tasks,
    };
  }

  async enrollLead(leadId: string, body: unknown) {
    const parsed = EnrollLeadSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.format(), status: 400 };

    try {
      const enrollment = await this.engine.enrollLead(parsed.data.workflowId, leadId);
      return { success: true, enrollment };
    } catch (err: any) {
      return { error: err.message, status: 400 };
    }
  }

  async pauseLeadNurture(enrollmentId: string) {
    try {
      const enr = this.engine.pauseEnrollment(enrollmentId);
      return { success: true, enrollment: enr };
    } catch (err: any) {
      return { error: err.message, status: 400 };
    }
  }

  async resumeLeadNurture(enrollmentId: string) {
    try {
      const enr = this.engine.resumeEnrollment(enrollmentId);
      return { success: true, enrollment: enr };
    } catch (err: any) {
      return { error: err.message, status: 400 };
    }
  }

  async cancelLeadNurture(enrollmentId: string) {
    try {
      const enr = this.engine.cancelEnrollment(enrollmentId);
      return { success: true, enrollment: enr };
    } catch (err: any) {
      return { error: err.message, status: 400 };
    }
  }

  /* ------------------------------- WORKFLOWS -------------------------------- */

  getWorkflows() {
    return { workflows: NurtureRepository.getAllWorkflows() };
  }

  getWorkflowById(id: string) {
    const wf = NurtureRepository.getWorkflowById(id);
    if (!wf) return { error: "Workflow not found", status: 404 };
    return { workflow: wf };
  }

  createWorkflow(body: unknown) {
    const parsed = CreateWorkflowSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.format(), status: 400 };

    const now = new Date().toISOString();
    const wf = {
      id: `WF-${uuidv4().substring(0, 8)}`,
      ...parsed.data,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    NurtureRepository.saveWorkflow(wf);
    return { success: true, workflow: wf };
  }

  /* -------------------------- MESSAGES & TEMPLATES -------------------------- */

  getMessages() {
    return { messages: NurtureRepository.getAllMessages() };
  }

  getTemplates() {
    return { templates: NurtureRepository.getAllTemplates() };
  }

  createTemplate(body: unknown) {
    const parsed = CreateTemplateSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.format(), status: 400 };

    const now = new Date().toISOString();
    const tpl = {
      id: `TPL-${uuidv4().substring(0, 8)}`,
      ...parsed.data,
      variables: parsed.data.variables || [],
      isActive: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const stmt = NurtureRepository.getTemplateByName(tpl.name);
    if (stmt) return { error: `Template with name '${tpl.name}' already exists`, status: 400 };

    NurtureRepository.saveWorkflow(tpl as any);
    return { success: true, template: tpl };
  }

  /* ----------------                ANALYTICS               ---------------- */

  getAnalytics() {
    return { analytics: NurtureRepository.getAnalytics() };
  }

  /* ----------------                WEBHOOKS                ---------------- */

  async handleSmsWebhook(body: unknown) {
    const parsed = SmsWebhookSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.format(), status: 400 };

    const { from, body: text } = parsed.data;

    // Find lead by phone number
    const lead = NurtureRepository.findLeadByIdentifier(from);
    const now = new Date().toISOString();

    // Check opt-out keyword
    if (SuppressionService.isOptOutKeyword(text)) {
      await SuppressionService.handleOptOut(from, lead?.id, `Opt-out keyword received: ${text.trim()}`);
      return { success: true, action: "OPT_OUT_SUPPRESSED" };
    }

    if (lead) {
      // 1. Log activity
      NurtureRepository.logActivity({
        id: `ACT-${uuidv4().substring(0, 8)}`,
        leadId: lead.id,
        activityType: "INCOMING_SMS",
        timestamp: now,
        source: "SmsWebhook",
        metadata: { text, from },
      });

      // 2. Publish CUSTOMER_REPLIED event
      await eventBus.publish({
        id: uuidv4(),
        type: "CUSTOMER_REPLIED",
        timestamp: now,
        leadId: lead.id,
        source: "SmsWebhook",
        data: { text, channel: "SMS" },
      });

      // 3. Generate Next Best Action task for rep
      NextBestActionService.generateForLead(lead, `Customer replied via SMS: "${text}"`, "High");
    }

    return { success: true, leadId: lead?.id || null };
  }

  async handleEmailWebhook(body: unknown) {
    const parsed = EmailWebhookSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.format(), status: 400 };

    const { from, body: text, subject } = parsed.data;
    const lead = NurtureRepository.findLeadByIdentifier(from);
    const now = new Date().toISOString();

    if (lead) {
      NurtureRepository.logActivity({
        id: `ACT-${uuidv4().substring(0, 8)}`,
        leadId: lead.id,
        activityType: "INCOMING_EMAIL",
        timestamp: now,
        source: "EmailWebhook",
        metadata: { text, subject, from },
      });

      await eventBus.publish({
        id: uuidv4(),
        type: "CUSTOMER_REPLIED",
        timestamp: now,
        leadId: lead.id,
        source: "EmailWebhook",
        data: { text, subject, channel: "EMAIL" },
      });
    }

    return { success: true, leadId: lead?.id || null };
  }
}

export function createNurtureExpressRouter(engine?: NurtureEngineService): Router {
  const router = Router();
  const controller = new NurtureRouter(engine);

  const handleResponse = (res: Response, result: any) => {
    const status = result?.status || (result?.error ? 400 : 200);
    res.status(status).json(result);
  };

  router.get("/analytics", (req, res) => handleResponse(res, controller.getAnalytics()));
  router.get("/workflows", (req, res) => handleResponse(res, controller.getWorkflows()));
  router.post("/workflows", (req, res) => handleResponse(res, controller.createWorkflow(req.body)));
  router.get("/workflows/:id", (req, res) => handleResponse(res, controller.getWorkflowById(req.params.id)));
  router.get("/messages", (req, res) => handleResponse(res, controller.getMessages()));
  router.get("/templates", (req, res) => handleResponse(res, controller.getTemplates()));
  router.post("/templates", (req, res) => handleResponse(res, controller.createTemplate(req.body)));
  
  router.get("/leads/:id", async (req, res) => handleResponse(res, await controller.getLeadNurture(req.params.id)));
  router.post("/leads/:id/enroll", async (req, res) => handleResponse(res, await controller.enrollLead(req.params.id, req.body)));
  router.post("/leads/:id/pause", async (req, res) => {
    const enrId = req.body?.enrollmentId || req.params.id;
    handleResponse(res, await controller.pauseLeadNurture(enrId));
  });
  router.post("/leads/:id/resume", async (req, res) => {
    const enrId = req.body?.enrollmentId || req.params.id;
    handleResponse(res, await controller.resumeLeadNurture(enrId));
  });
  router.post("/leads/:id/cancel", async (req, res) => {
    const enrId = req.body?.enrollmentId || req.params.id;
    handleResponse(res, await controller.cancelLeadNurture(enrId));
  });

  router.post("/webhooks/sms", async (req, res) => handleResponse(res, await controller.handleSmsWebhook(req.body)));
  router.post("/webhooks/email", async (req, res) => handleResponse(res, await controller.handleEmailWebhook(req.body)));

  return router;
}

