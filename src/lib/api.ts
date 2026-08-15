import { db, type WebhookPayload } from "./db";
import type { Lead, Conversation, Proposal, Campaign, Call, Appointment, Task, PortalMilestone } from "@/data/mock";

async function postJson(endpoint: string, data?: any) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.warn(`Fetch to ${endpoint} failed, falling back to local database store:`, err);
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

  // --- NURTURE ---
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
};
