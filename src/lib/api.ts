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

  async qualifyLead(leadId: string, answers: Record<string, string>, score: number) {
    const remote = await postJson("/api/agent/qualify", { leadId, answers });
    if (remote && remote.lead) {
      db.updateLead(leadId, remote.lead);
      return remote.lead;
    }
    return db.qualifyLead(leadId, answers, score);
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

  // --- MODULE 04: POST-SALE RETENTION ---
  async getAdminProjects(status?: string) {
    const url = status ? `/api/admin/projects?status=${encodeURIComponent(status)}` : "/api/admin/projects";
    const res = await getJson(url);
    return res?.projects || [];
  },

  async getAdminProject(projectId: string) {
    const res = await getJson(`/api/admin/projects/${projectId}`);
    return res || null;
  },

  async getAdminProjectMilestones(projectId: string) {
    const res = await getJson(`/api/admin/projects/${projectId}/milestones`);
    return res?.milestones || [];
  },

  async startAdminMilestone(projectId: string, milestone: string) {
    return await postJson(`/api/admin/projects/${projectId}/milestones/${milestone}/start`);
  },

  async completeAdminMilestone(projectId: string, milestone: string, notes?: string) {
    return await postJson(`/api/admin/projects/${projectId}/milestones/${milestone}/complete`, { notes });
  },

  async getAdminProjectUpdates(projectId: string) {
    const res = await getJson(`/api/admin/projects/${projectId}/updates`);
    return res?.updates || [];
  },

  async createAdminProjectUpdate(projectId: string, message: string, visibleToCustomer: boolean = true) {
    return await postJson(`/api/admin/projects/${projectId}/updates`, { message, visibleToCustomer });
  },

  async getAdminProjectRisk(projectId: string) {
    const res = await getJson(`/api/admin/projects/${projectId}/risk`);
    return res?.risk || null;
  },

  async recalculateAdminProjectRisk(projectId: string) {
    return await postJson(`/api/admin/projects/${projectId}/risk/recalculate`);
  },

  async getCustomerPortalProject(projectId: string) {
    const res = await getJson(`/api/projects/${projectId}`);
    return res?.project || null;
  },

  async getCustomerPortalMilestones(projectId: string) {
    const res = await getJson(`/api/projects/${projectId}/milestones`);
    return res?.milestones || [];
  },

  async getCustomerPortalUpdates(projectId: string) {
    const res = await getJson(`/api/projects/${projectId}/updates`);
    return res?.updates || [];
  },
};
