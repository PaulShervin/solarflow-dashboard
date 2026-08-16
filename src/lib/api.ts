import { db, type WebhookPayload } from "./db";
import type { Lead, Conversation, Proposal, Campaign, Call, Appointment, Task, PortalMilestone } from "@/data/mock";

async function postJson(endpoint: string, data?: any) {
  try {
    const options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    if (data !== undefined) {
      options.body = JSON.stringify(data);
    }
    const res = await fetch(endpoint, options);
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.warn(`Fetch to ${endpoint} failed, falling back to local database store:`, err);
  }
  return null;
}

async function getJson(endpoint: string) {
  try {
    const res = await fetch(endpoint);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Fetch to ${endpoint} failed:`, err);
  }
  return null;
}

export const solarApi = {
  // --- LEADS & WEBHOOKS ---
  async getLeads(): Promise<Lead[]> {
    return db.getLeads();
  },

  async postInboundWebhook(payload: WebhookPayload) {
    const remote = await postJson("/api/webhooks/lead", payload);
    if (remote && remote.lead) {
      db.addLead(remote.lead);
      return remote;
    }
    return db.addWebhookLead(payload);
  },

  async qualifyLead(leadId: string, answers: Record<string, string>) {
    const remote = await postJson("/api/agent/qualify", { leadId, answers });
    if (remote && remote.lead) {
      db.updateLead(leadId, remote.lead);
      if (remote.appointment) {
        db.getAppointments().unshift(remote.appointment);
      }
      return remote;
    }
    return db.qualifyLead(leadId, answers);
  },

  async getAvailability() {
    const res = await getJson("/api/agent/availability");
    return res?.availability || db.getAvailability();
  },

  async updateAvailabilitySlot(slotId: string, status: "open" | "closed") {
    try {
      const res = await fetch(`/api/agent/availability/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const json = await res.json();
        db.updateAvailabilitySlot(slotId, status);
        return json;
      }
    } catch (err) {
      console.warn(`PATCH /api/agent/availability/${slotId} failed, falling back to local store:`, err);
    }
    return db.updateAvailabilitySlot(slotId, status);
  },

  async bookSlotFromCalendar(slotId: string, leadId: string) {
    const remote = await postJson(`/api/agent/availability/${slotId}/book`, { leadId });
    if (remote && remote.appointment) {
      db.getAppointments().unshift(remote.appointment);
      db.updateLead(leadId, { status: "appointment", owner: remote.appointment.rep });
      return remote;
    }
    return db.bookSlotFromCalendar(slotId, leadId);
  },

  async bookAppointment(leadId: string, rep: string, date: string, time: string): Promise<Appointment> {
    const remote = await postJson("/api/agent/book-appointment", { leadId, rep, date, time });
    if (remote && remote.appointment) {
      db.updateLead(leadId, { status: "appointment", owner: rep });
      return remote.appointment;
    }
    return db.bookAppointment(leadId, rep, date, time);
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    return db.updateLead(id, updates);
  },

  async deleteLead(id: string): Promise<void> {
    db.deleteLead(id);
  },

  // --- CONVERSATIONS ---
  async getConversations(): Promise<Conversation[]> {
    return db.getConversations();
  },

  async sendMessage(conversationId: string, sender: "bot" | "user" | "rep", text: string, channel: "SMS" | "Voice Call" | "Webchat" = "SMS") {
    return db.addMessage(conversationId, sender, text, channel);
  },

  // --- PROPOSALS & PRE-DESIGN ---
  async getProposals(): Promise<Proposal[]> {
    return db.getProposals();
  },

  async createProposal(data: Omit<Proposal, "id" | "views">): Promise<Proposal> {
    const remote = await postJson("/api/agent/pre-design", {
      customerName: data.customer,
      monthlyBill: Math.round(data.value / 90),
      includeBattery: data.battery,
      repName: data.rep,
    });
    if (remote && remote.proposal) {
      db.createProposal(remote.proposal);
      return remote.proposal;
    }
    return db.createProposal(data);
  },

  // --- NURTURE (MODULE 03 BACKEND INTEGRATION) ---
  async getCampaigns(): Promise<Campaign[]> {
    return db.getCampaigns();
  },

  async triggerNurtureRulesCheck() {
    const remote = await postJson("/api/agent/nurture/run-rules");
    if (remote) {
      db.triggerNurtureRulesCheck();
      return remote;
    }
    return db.triggerNurtureRulesCheck();
  },

  async getNurtureAnalytics() {
    const res = await getJson("/api/nurture/analytics");
    return res?.analytics || {
      totalWorkflows: 4,
      activeEnrollments: 3,
      sentMessages: 12,
      deliveryRate: 98.4,
      optOutRate: 0.8,
      reEngagedLeads: 5,
    };
  },

  async getNurtureWorkflows() {
    const res = await getJson("/api/nurture/workflows");
    return res?.workflows || [];
  },

  async createNurtureWorkflow(workflowData: any) {
    return await postJson("/api/nurture/workflows", workflowData);
  },

  async getNurtureMessages() {
    const res = await getJson("/api/nurture/messages");
    return res?.messages || [];
  },

  async getNurtureTemplates() {
    const res = await getJson("/api/nurture/templates");
    return res?.templates || [];
  },

  async createNurtureTemplate(templateData: any) {
    return await postJson("/api/nurture/templates", templateData);
  },

  async getLeadNurture(leadId: string) {
    const res = await getJson(`/api/nurture/leads/${leadId}`);
    return res || null;
  },

  async enrollLeadInNurture(leadId: string, workflowId: string) {
    return await postJson(`/api/nurture/leads/${leadId}/enroll`, { workflowId });
  },

  async pauseLeadNurture(leadId: string, enrollmentId: string) {
    return await postJson(`/api/nurture/leads/${leadId}/pause`, { enrollmentId });
  },

  async resumeLeadNurture(leadId: string, enrollmentId: string) {
    return await postJson(`/api/nurture/leads/${leadId}/resume`, { enrollmentId });
  },

  async cancelLeadNurture(leadId: string, enrollmentId: string) {
    return await postJson(`/api/nurture/leads/${leadId}/cancel`, { enrollmentId });
  },

  async simulateSmsWebhook(from: string, body: string) {
    return await postJson("/api/nurture/webhooks/sms", { from, body });
  },

  async simulateEmailWebhook(from: string, subject: string, body: string) {
    return await postJson("/api/nurture/webhooks/email", { from, subject, body });
  },

  // --- PORTAL & MILESTONES ---
  async getPortalProject() {
    return db.getPortalProject();
  },

  async getPortalMilestones(): Promise<PortalMilestone[]> {
    return db.getPortalMilestones();
  },

  async updateCustomerMilestone(stepIndex: number, status: "complete" | "current" | "upcoming", detail?: string) {
    const remote = await postJson("/api/agent/status/advance", { stepIndex, detail });
    if (remote && remote.project) {
      db.updateCustomerMilestone(stepIndex, status, detail);
      return remote;
    }
    return db.updateCustomerMilestone(stepIndex, status, detail);
  },

  // --- CALL COACHING ---
  async getCalls(): Promise<Call[]> {
    return db.getCalls();
  },

  async ingestCallRecording(rep: string, customer: string, duration: string, outcome: string): Promise<Call> {
    const remote = await postJson("/api/agent/call-coaching/ingest", { rep, customer, duration, outcome });
    if (remote && remote.call) {
      db.getCalls().unshift(remote.call);
      return remote.call;
    }
    return db.addCallRecording(rep, customer, duration, outcome);
  },

  // --- AUDIT LOGS & CRM SETTINGS ---
  async getAuditLogs() {
    return db.getAuditLogs();
  },

  async getAppointments(): Promise<Appointment[]> {
    return db.getAppointments();
  },

  async getTasks(): Promise<Task[]> {
    return db.getTasks();
  },

  async getCrmSettings() {
    try {
      const res = await fetch("/api/crm/settings");
      if (res.ok) {
        const json = await res.json();
        return json.settings;
      }
    } catch {}
    return {
      provider: "HubSpot",
      webhookUrl: "https://api.hubapi.com/crm/v3/objects/contacts",
      apiKey: "pat-na1-demo-api-key-solarflow",
      syncEnabled: true,
      autoResponseEnabled: true,
    };
  },

  async updateCrmSettings(settings: any) {
    const remote = await postJson("/api/crm/settings", settings);
    if (remote && remote.settings) {
      return remote.settings;
    }
    return settings;
  },

  // --- MODULE 05 PRODUCT & PRICING CHATBOT ---
  async sendChatMessage(sessionId?: string, message = "", leadId?: string) {
    const res = await postJson("/api/chat/message", { sessionId, message, leadId });
    return res || null;
  },

  async getChatSession(sessionId: string) {
    const res = await getJson(`/api/chat/${sessionId}`);
    return res?.session || null;
  },

  async submitRoofData(sessionId: string, roofData: { address?: string; roofAreaSqFt: number; polygon?: any }) {
    const res = await postJson(`/api/chat/${sessionId}/roof-data`, roofData);
    return res || null;
  },

  async calculateChatEstimate(sessionId: string) {
    const res = await postJson(`/api/chat/${sessionId}/calculate`);
    return res || null;
  },

  async escalateChat(sessionId: string, reason?: string) {
    const res = await postJson(`/api/chat/${sessionId}/escalate`, { reason });
    return res || null;
  },

  // --- MODULE 04 POST-SALE RETENTION & MILESTONES ---
  async getProjects(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await getJson(`/api/admin/projects${query}`);
    return res?.projects || [];
  },

  async getProjectDetail(projectId: string) {
    const res = await getJson(`/api/admin/projects/${projectId}`);
    return res || null;
  },

  async createProject(data: { leadId: string; startDate?: string; estimatedCompletionDate?: string }) {
    return await postJson("/api/admin/projects", data);
  },

  async getProjectMilestones(projectId: string) {
    const res = await getJson(`/api/admin/projects/${projectId}/milestones`);
    return res?.milestones || [];
  },

  async startMilestone(projectId: string, milestoneType: string, notes?: string, updatedBy?: string) {
    return await postJson(`/api/admin/projects/${projectId}/milestones/${milestoneType}/start`, {
      notes,
      updatedBy,
    });
  },

  async completeMilestone(projectId: string, milestoneType: string, notes?: string, updatedBy?: string) {
    return await postJson(`/api/admin/projects/${projectId}/milestones/${milestoneType}/complete`, {
      notes,
      updatedBy,
    });
  },

  async getProjectUpdates(projectId: string) {
    const res = await getJson(`/api/admin/projects/${projectId}/updates`);
    return res?.updates || [];
  },

  async createProjectUpdate(projectId: string, message: string, visibleToCustomer = true, createdBy = "Operations") {
    return await postJson(`/api/admin/projects/${projectId}/updates`, {
      message,
      visibleToCustomer,
      createdBy,
    });
  },

  async getProjectRisk(projectId: string) {
    const res = await getJson(`/api/admin/projects/${projectId}/risk`);
    return res || null;
  },

  async recalculateProjectRisk(projectId: string, stalledDays = 0, unresolvedInquiries = 0) {
    return await postJson(`/api/admin/projects/${projectId}/risk/recalculate`, {
      stalledDays,
      unresolvedInquiries,
    });
  },
};


