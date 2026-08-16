import fs from "fs";
import path from "path";
import {
  leads as defaultLeads,
  conversations as defaultConversations,
  proposals as defaultProposals,
  campaigns as defaultCampaigns,
  calls as defaultCalls,
  appointments as defaultAppointments,
  tasks as defaultTasks,
  availabilityMatrix as defaultAvailability,
  portalProject as defaultPortalProject,
  portalMilestones as defaultPortalMilestones,
  portalMessages as defaultPortalMessages,
  portalAppointments as defaultPortalAppointments,
  portalDocuments as defaultPortalDocuments,
  portalPayments as defaultPortalPayments,
  type Lead,
  type Conversation,
  type Proposal,
  type Campaign,
  type Call,
  type Appointment,
  type Task,
  type AvailabilitySlot,
  type PortalMilestone,
  type Message as ChatMessage,
} from "@/data/mock";

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  category: "Webhook" | "AI Bot" | "CRM Sync" | "Proposal" | "Nurture" | "Milestone" | "Call Coaching";
  title: string;
  detail: string;
  latencyMs?: number;
  status: "success" | "warning" | "error" | "info";
};

export type CrmSettings = {
  provider: "HubSpot" | "Salesforce" | "GoHighLevel" | "Custom Webhook";
  webhookUrl: string;
  apiKey: string;
  syncEnabled: boolean;
  autoResponseEnabled: boolean;
};

const DB_FILE_PATH = path.resolve(process.cwd(), "server_db.json");

class ServerDatabaseStore {
  private data = {
    leads: [...defaultLeads],
    conversations: [...defaultConversations],
    proposals: [...defaultProposals],
    campaigns: [...defaultCampaigns],
    calls: [...defaultCalls],
    appointments: [...defaultAppointments],
    tasks: [...defaultTasks],
    availability: [...defaultAvailability],
    portalProject: { ...defaultPortalProject },
    portalMilestones: [...defaultPortalMilestones],
    portalMessages: [...defaultPortalMessages],
    portalAppointments: [...defaultPortalAppointments],
    portalDocuments: [...defaultPortalDocuments],
    portalPayments: [...defaultPortalPayments],
    auditLogs: this.createInitialAuditLogs(),
    crmSettings: {
      provider: "HubSpot" as const,
      webhookUrl: "https://api.hubapi.com/crm/v3/objects/contacts",
      apiKey: "pat-na1-demo-api-key-solarflow",
      syncEnabled: true,
      autoResponseEnabled: true,
    } as CrmSettings,
  };

  constructor() {
    this.readFromDisk();
  }

  private readFromDisk() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      } else {
        this.writeToDisk();
      }
    } catch (err) {
      console.error("Server DB read error, using in-memory store", err);
    }
  }

  private writeToDisk() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Server DB write error", err);
    }
  }

  private createInitialAuditLogs(): AuditLogEntry[] {
    return [
      {
        id: "log-101",
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        category: "Webhook",
        title: "Inbound Lead Ingested",
        detail: "Lead LD-4821 (Marcus Whitfield) processed by server HTTP handler",
        latencyMs: 142,
        status: "success",
      },
      {
        id: "log-102",
        timestamp: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
        category: "AI Bot",
        title: "Instant Response Agent Fired",
        detail: "Autonomous SMS qualifying prompt dispatched to (480) 555-0142",
        latencyMs: 380,
        status: "success",
      },
      {
        id: "log-103",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        category: "CRM Sync",
        title: "HubSpot CRM 2-Way Sync",
        detail: "Lead score (92) synced outbound to external CRM endpoint",
        latencyMs: 89,
        status: "success",
      },
    ];
  }

  public getAllData() {
    return this.data;
  }

  public resetToDefaults() {
    this.data = {
      leads: [...defaultLeads],
      conversations: [...defaultConversations],
      proposals: [...defaultProposals],
      campaigns: [...defaultCampaigns],
      calls: [...defaultCalls],
      appointments: [...defaultAppointments],
      tasks: [...defaultTasks],
      availability: [...defaultAvailability],
      portalProject: { ...defaultPortalProject },
      portalMilestones: [...defaultPortalMilestones],
      portalMessages: [...defaultPortalMessages],
      portalAppointments: [...defaultPortalAppointments],
      portalDocuments: [...defaultPortalDocuments],
      portalPayments: [...defaultPortalPayments],
      auditLogs: this.createInitialAuditLogs(),
      crmSettings: {
        provider: "HubSpot",
        webhookUrl: "https://api.hubapi.com/crm/v3/objects/contacts",
        apiKey: "pat-na1-demo-api-key-solarflow",
        syncEnabled: true,
        autoResponseEnabled: true,
      },
    };
    this.writeToDisk();
    return this.data;
  }

  // --- LEADS ---
  public getLeads(): Lead[] {
    return this.data.leads;
  }

  public getLeadById(id: string): Lead | undefined {
    return this.data.leads.find((l) => l.id === id);
  }

  public saveLead(lead: Lead): Lead {
    const idx = this.data.leads.findIndex((l) => l.id === lead.id);
    if (idx >= 0) {
      this.data.leads[idx] = lead;
    } else {
      this.data.leads.unshift(lead);
    }
    this.writeToDisk();
    return lead;
  }

  public deleteLead(id: string) {
    this.data.leads = this.data.leads.filter((l) => l.id !== id);
    this.writeToDisk();
  }

  // --- CONVERSATIONS & MESSAGES ---
  public getConversations(): Conversation[] {
    return this.data.conversations;
  }

  public saveConversation(conv: Conversation): Conversation {
    const idx = this.data.conversations.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      this.data.conversations[idx] = conv;
    } else {
      this.data.conversations.unshift(conv);
    }
    this.writeToDisk();
    return conv;
  }

  // --- PROPOSALS ---
  public getProposals(): Proposal[] {
    return this.data.proposals;
  }

  public saveProposal(proposal: Proposal): Proposal {
    this.data.proposals.unshift(proposal);
    this.writeToDisk();
    return proposal;
  }

  // --- APPOINTMENTS ---
  public saveAppointment(appt: Appointment): Appointment {
    this.data.appointments.unshift(appt);
    this.writeToDisk();
    return appt;
  }

  // --- CAMPAIGNS & NURTURE ---
  public getCampaigns(): Campaign[] {
    return this.data.campaigns;
  }

  // --- MILESTONES & PORTAL ---
  public getPortalProject() {
    return this.data.portalProject;
  }

  public updatePortalProject(project: typeof defaultPortalProject, milestones: PortalMilestone[], newMessage?: ChatMessage) {
    this.data.portalProject = project;
    this.data.portalMilestones = milestones;
    if (newMessage) {
      (this.data.portalMessages as any[]).unshift(newMessage);
    }
    this.writeToDisk();
  }

  // --- AVAILABILITY MATRIX ---
  public getAvailability(): AvailabilitySlot[] {
    return this.data.availability;
  }

  public isRepInMatrix(rep: string): boolean {
    return this.data.availability.some((s) => s.rep === rep);
  }

  public isSlotOpen(rep: string, date: string, time: string): boolean {
    const slot = this.data.availability.find((s) => s.rep === rep && s.date === date && s.time === time);
    return !!slot && slot.status === "open";
  }

  public hasAppointmentConflict(rep: string, date: string, time: string): boolean {
    return this.data.appointments.some((a) => a.rep === rep && a.date === date && a.time === time);
  }

  public reserveSlot(rep: string, date: string, time: string): AvailabilitySlot | null {
    const idx = this.data.availability.findIndex((s) => s.rep === rep && s.date === date && s.time === time);
    if (idx < 0) return null;
    const current = this.data.availability[idx];
    if (!current || current.status !== "open") return null;
    const slot: AvailabilitySlot = { ...current, status: "closed" };
    this.data.availability[idx] = slot;
    this.writeToDisk();
    return slot;
  }

  public findFirstOpenSlot(rep: string): AvailabilitySlot | null {
    const slots = this.data.availability
      .filter((s) => s.rep === rep && s.status === "open")
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.order - b.order));
    return slots[0] || null;
  }

  public getSlotById(slotId: string): AvailabilitySlot | undefined {
    return this.data.availability.find((s) => s.id === slotId);
  }

  public setSlotStatus(slotId: string, status: "open" | "closed"): AvailabilitySlot | null {
    const idx = this.data.availability.findIndex((s) => s.id === slotId);
    if (idx < 0) return null;
    const current = this.data.availability[idx];
    if (!current) return null;
    if (current.status === status) return current;
    const updated: AvailabilitySlot = { ...current, status };
    this.data.availability[idx] = updated;
    this.writeToDisk();
    return updated;
  }

  // --- CALLS ---
  public getCalls(): Call[] {
    return this.data.calls;
  }

  public saveCall(call: Call): Call {
    this.data.calls.unshift(call);
    this.writeToDisk();
    return call;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLogEntry[] {
    return this.data.auditLogs;
  }

  public addAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
    const log: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    this.writeToDisk();
    return log;
  }

  // --- CRM SETTINGS ---
  public getCrmSettings(): CrmSettings {
    return this.data.crmSettings;
  }

  public updateCrmSettings(settings: Partial<CrmSettings>): CrmSettings {
    this.data.crmSettings = { ...this.data.crmSettings, ...settings };
    this.writeToDisk();
    return this.data.crmSettings;
  }
}

export const serverDb = new ServerDatabaseStore();
