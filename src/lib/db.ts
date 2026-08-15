import {
  leads as defaultLeads,
  conversations as defaultConversations,
  proposals as defaultProposals,
  campaigns as defaultCampaigns,
  calls as defaultCalls,
  appointments as defaultAppointments,
  tasks as defaultTasks,
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

export type WebhookPayload = {
  name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  source?: "Google Ads" | "Meta" | "Referral" | "Website" | "Door Knock" | "Partner";
  monthlyBill?: number;
  homeType?: "Single family" | "Townhouse" | "Multi-family" | "Mobile";
  roof?: "Asphalt shingle" | "Tile" | "Metal" | "Flat";
  timeline?: "0-1 month" | "1-3 months" | "3-6 months" | "Just researching";
  homeowner?: boolean;
};

const STORAGE_KEY = "solarflow_db_v1";

type Listener = () => void;

class DatabaseStore {
  private leads: Lead[] = [];
  private conversations: Conversation[] = [];
  private proposals: Proposal[] = [];
  private campaigns: Campaign[] = [];
  private calls: Call[] = [];
  private appointments: Appointment[] = [];
  private tasks: Task[] = [];
  private portalProject = { ...defaultPortalProject };
  private portalMilestones: PortalMilestone[] = [];
  private portalMessages: any[] = [];
  private portalAppointments = [...defaultPortalAppointments];
  private portalDocuments = [...defaultPortalDocuments];
  private portalPayments = [...defaultPortalPayments];
  private auditLogs: AuditLogEntry[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === "undefined") {
      this.useDefaults();
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.useDefaults();
        return;
      }
      const data = JSON.parse(raw);
      this.leads = data.leads || defaultLeads;
      this.conversations = data.conversations || defaultConversations;
      this.proposals = data.proposals || defaultProposals;
      this.campaigns = data.campaigns || defaultCampaigns;
      this.calls = data.calls || defaultCalls;
      this.appointments = data.appointments || defaultAppointments;
      this.tasks = data.tasks || defaultTasks;
      this.portalProject = data.portalProject || defaultPortalProject;
      this.portalMilestones = data.portalMilestones || defaultPortalMilestones;
      this.portalMessages = data.portalMessages || defaultPortalMessages;
      this.portalAppointments = data.portalAppointments || defaultPortalAppointments;
      this.portalDocuments = data.portalDocuments || defaultPortalDocuments;
      this.portalPayments = data.portalPayments || defaultPortalPayments;
      this.auditLogs = data.auditLogs || this.createInitialAuditLogs();
    } catch (err) {
      console.error("Failed to parse DB from localStorage, falling back to defaults", err);
      this.useDefaults();
    }
  }

  private useDefaults() {
    this.leads = [...defaultLeads];
    this.conversations = [...defaultConversations];
    this.proposals = [...defaultProposals];
    this.campaigns = [...defaultCampaigns];
    this.calls = [...defaultCalls];
    this.appointments = [...defaultAppointments];
    this.tasks = [...defaultTasks];
    this.portalProject = { ...defaultPortalProject };
    this.portalMilestones = [...defaultPortalMilestones];
    this.portalMessages = [...defaultPortalMessages];
    this.portalAppointments = [...defaultPortalAppointments];
    this.portalDocuments = [...defaultPortalDocuments];
    this.portalPayments = [...defaultPortalPayments];
    this.auditLogs = this.createInitialAuditLogs();
  }

  private createInitialAuditLogs(): AuditLogEntry[] {
    return [
      {
        id: "log-101",
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        category: "Webhook",
        title: "Inbound Lead Ingested",
        detail: "Lead LD-4821 (Marcus Whitfield) received from Google Ads webhook",
        latencyMs: 142,
        status: "success",
      },
      {
        id: "log-102",
        timestamp: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
        category: "AI Bot",
        title: "Instant Response Sent",
        detail: "Sunny AI sent SMS qualifying prompt to (480) 555-0142",
        latencyMs: 380,
        status: "success",
      },
      {
        id: "log-103",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        category: "CRM Sync",
        title: "2-Way CRM Field Update",
        detail: "Lead score (92) and 5/5 qualifying responses synced to CRM",
        latencyMs: 89,
        status: "success",
      },
      {
        id: "log-104",
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        category: "Milestone",
        title: "Post-Sale Stage Updated",
        detail: "Alicia Brennan project advanced to 'Permitting Submitted'",
        latencyMs: 110,
        status: "info",
      },
    ];
  }

  private save() {
    if (typeof window === "undefined") return;
    try {
      const data = {
        leads: this.leads,
        conversations: this.conversations,
        proposals: this.proposals,
        campaigns: this.campaigns,
        calls: this.calls,
        appointments: this.appointments,
        tasks: this.tasks,
        portalProject: this.portalProject,
        portalMilestones: this.portalMilestones,
        portalMessages: this.portalMessages,
        portalAppointments: this.portalAppointments,
        portalDocuments: this.portalDocuments,
        portalPayments: this.portalPayments,
        auditLogs: this.auditLogs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save DB state", err);
    }
    this.notify();
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetToDefaults() {
    this.useDefaults();
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notify();
  }

  // --- LEADS ---
  public getLeads(): Lead[] {
    return this.leads;
  }

  public getLeadById(id: string): Lead | undefined {
    return this.leads.find((l) => l.id === id);
  }

  public addLead(lead: Lead): Lead {
    this.leads = [lead, ...this.leads];
    this.save();
    return lead;
  }

  public updateLead(id: string, updates: Partial<Lead>): Lead | undefined {
    let updated: Lead | undefined;
    this.leads = this.leads.map((l) => {
      if (l.id === id) {
        updated = { ...l, ...updates, lastTouch: "Just now" };
        return updated;
      }
      return l;
    });
    this.save();
    return updated;
  }

  public deleteLead(id: string) {
    this.leads = this.leads.filter((l) => l.id !== id);
    this.save();
  }

  // --- INBOUND WEBHOOK & QUALIFYING ---
  public addWebhookLead(payload: WebhookPayload): { lead: Lead; auditLog: AuditLogEntry } {
    const startTime = Date.now();
    const id = `LD-${Math.floor(1000 + Math.random() * 9000)}`;

    let score = 50;
    if (payload.homeowner) score += 25;
    if (payload.monthlyBill && payload.monthlyBill > 250) score += 15;
    if (payload.roof === "Asphalt shingle") score += 10;

    const newLead: Lead = {
      id,
      name: payload.name || "Anonymous Lead",
      email: payload.email || "lead@example.com",
      phone: payload.phone || "(555) 000-0000",
      city: payload.city || "Phoenix",
      state: payload.state || "AZ",
      source: payload.source || "Website",
      status: "new",
      score,
      monthlyBill: payload.monthlyBill || 220,
      homeType: payload.homeType || "Single family",
      roof: payload.roof || "Asphalt shingle",
      timeline: payload.timeline || "0-1 month",
      homeowner: payload.homeowner ?? true,
      createdAt: new Date().toISOString(),
      lastTouch: "Just now",
      owner: "Sunny (AI Agent)",
      aiSummary: `Inbound webhook captured lead with average monthly bill of $${payload.monthlyBill || 220}. Qualify via automated SMS/call prompt.`,
      tags: ["Webhook", "Instant Lead"],
    };

    this.leads = [newLead, ...this.leads];

    // Create Conversation
    const conversationId = `CV-${Math.floor(100 + Math.random() * 900)}`;
    const newConv: Conversation = {
      id: conversationId,
      leadId: newLead.id,
      name: newLead.name,
      customer: newLead.name,
      phone: newLead.phone,
      channel: "SMS",
      status: "Active",
      score: newLead.score,
      preview: `Hi ${newLead.name.split(" ")[0]}! Thanks for reaching out...`,
      updatedAt: "Just now",
      lastMessage: `Hi ${newLead.name.split(" ")[0]}! This is Sunny from SolarPeak. Got your request — do you own your home?`,
      lastTime: "Just now",
      unread: 1,
      stage: "new",
      messages: [
        {
          id: "m-1",
          sender: "system",
          text: `Inbound Lead Ingested via Webhook (${newLead.source})`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          channel: "System",
        },
        {
          id: "m-2",
          sender: "bot",
          text: `Hi ${newLead.name.split(" ")[0]}! Thanks for reaching out to SolarPeak. I'm Sunny, your solar assistant. Can I ask a quick question to tailor your savings proposal?`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          channel: "SMS",
        },
      ],
    };
    this.conversations = [newConv, ...this.conversations];

    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 80 + 40);
    const auditLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: "Webhook",
      title: "Inbound Lead Ingested",
      detail: `Webhook received for ${newLead.name} (${newLead.email}) -> Created Lead ${newLead.id}`,
      latencyMs,
      status: "success",
    };
    this.auditLogs = [auditLog, ...this.auditLogs];

    this.save();
    return { lead: newLead, auditLog };
  }

  public qualifyLead(
    leadId: string,
    answers: Record<string, string>,
    computedScore: number,
  ): Lead | undefined {
    const lead = this.getLeadById(leadId);
    if (!lead) return undefined;

    const needsHandoff = computedScore < 45 || answers.homeowner === "No, I rent";
    const newStatus = needsHandoff ? "contacted" : "qualified";

    const updated = this.updateLead(leadId, {
      score: computedScore,
      status: newStatus,
      aiSummary: `Qualifying conversation completed. Answers: ${JSON.stringify(answers)}. Computed intent score: ${computedScore}. ${needsHandoff ? "FLAGGED FOR HUMAN HANDOFF." : "Ready for calendar booking."}`,
      tags: [...new Set([...lead.tags, "Qualified", computedScore > 75 ? "High Intent" : "Review Needed"])],
    });

    this.addAuditLog({
      category: "AI Bot",
      title: "Qualifying Chat Completed",
      detail: `Lead ${leadId} scored ${computedScore}/100. Status updated to '${newStatus}'.`,
      latencyMs: 190,
      status: needsHandoff ? "warning" : "success",
    });

    return updated;
  }

  // --- CALENDAR BOOKING ---
  public bookAppointment(leadId: string, rep: string, date: string, time: string): Appointment {
    const lead = this.getLeadById(leadId);
    const apptId = `APT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAppt: Appointment = {
      id: apptId,
      customer: lead?.name || "Solar Customer",
      email: lead?.email || "customer@example.com",
      phone: lead?.phone || "(555) 000-0000",
      rep,
      date,
      time,
      type: "In-home consult",
      status: "Confirmed",
      notes: "Auto-booked via Instant Response Agent after qualification flow.",
    };

    this.appointments = [newAppt, ...this.appointments];

    if (leadId) {
      this.updateLead(leadId, {
        status: "appointment",
        owner: rep,
        lastTouch: "Just now",
        tags: [...new Set([...(lead?.tags || []), "Consultation Booked"])],
      });
    }

    this.addAuditLog({
      category: "AI Bot",
      title: "Calendar Slot Auto-Booked",
      detail: `Consultation booked for ${newAppt.customer} with ${rep} on ${date} at ${time}.`,
      latencyMs: 145,
      status: "success",
    });

    this.save();
    return newAppt;
  }

  // --- CONVERSATIONS & MESSAGES ---
  public getConversations(): Conversation[] {
    return this.conversations;
  }

  public addMessage(conversationId: string, sender: "bot" | "user" | "rep" | "system", text: string, channel: "SMS" | "Voice Call" | "Webchat" = "SMS"): Conversation | undefined {
    let updatedConv: Conversation | undefined;
    this.conversations = this.conversations.map((c) => {
      if (c.id === conversationId) {
        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender,
          text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          channel,
        };
        updatedConv = {
          ...c,
          lastMessage: text,
          lastTime: "Just now",
          messages: [...c.messages, newMsg],
        };
        return updatedConv;
      }
      return c;
    });
    this.save();
    return updatedConv;
  }

  // --- PROPOSALS ---
  public getProposals(): Proposal[] {
    return this.proposals;
  }

  public createProposal(data: Omit<Proposal, "id" | "views">): Proposal {
    const id = `PROP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newProp: Proposal = {
      ...data,
      id,
      views: 0,
    };
    this.proposals = [newProp, ...this.proposals];

    this.addAuditLog({
      category: "Proposal",
      title: "Same-Day Proposal Generated",
      detail: `Auto Pre-Design Engine generated proposal ${id} ($${data.value.toLocaleString()}, ${data.systemKw} kW) for ${data.customer}.`,
      latencyMs: 420,
      status: "success",
    });

    this.save();
    return newProp;
  }

  // --- NURTURE CAMPAIGNS & TRIGGER RULES ---
  public getCampaigns(): Campaign[] {
    return this.campaigns;
  }

  public triggerNurtureRulesCheck(): { executedCount: number; logs: string[] } {
    const logs: string[] = [];
    let executedCount = 0;

    this.leads.forEach((l) => {
      if (l.status === "new" || l.status === "contacted") {
        executedCount++;
        logs.push(`Lead ${l.name} (${l.id}): Queued Step 1 Drip SMS ("Quick solar estimate check-in").`);
      } else if (l.status === "proposal") {
        executedCount++;
        logs.push(`Lead ${l.name} (${l.id}): Triggered Follow-up ("Personalized roof savings review for your $${l.monthlyBill}/mo bill").`);
      }
    });

    this.addAuditLog({
      category: "Nurture",
      title: "Nurture Trigger Rules Evaluated",
      detail: `Evaluated ${this.leads.length} leads across 3 active campaigns. Triggered ${executedCount} automated touchpoints.`,
      latencyMs: 210,
      status: "info",
    });

    this.save();
    return { executedCount, logs };
  }

  // --- POST-SALE MILESTONE TRACKER & PORTAL ---
  public getPortalProject() {
    return this.portalProject;
  }

  public getPortalMilestones(): PortalMilestone[] {
    return this.portalMilestones;
  }

  public updateCustomerMilestone(stepIndex: number, status: "complete" | "current" | "upcoming", detail?: string): { project: typeof defaultPortalProject; milestones: PortalMilestone[] } {
    const currentList = [...this.portalMilestones];
    if (currentList[stepIndex]) {
      currentList[stepIndex] = {
        ...currentList[stepIndex],
        status,
        date: status === "complete" ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : currentList[stepIndex].date,
      };
    }

    const completedCount = currentList.filter((m) => m.status === "complete").length;
    const progress = Math.round((completedCount / currentList.length) * 100);
    const activeStep = currentList.find((m) => m.status === "current") || currentList[stepIndex];

    this.portalMilestones = currentList;
    this.portalProject = {
      ...this.portalProject,
      status: activeStep ? activeStep.title : this.portalProject.status,
      statusDetail: detail || activeStep?.description || this.portalProject.statusDetail,
      progress,
    };

    // Add auto-notification message
    this.portalMessages = [
      ...this.portalMessages,
      {
        id: `pm-${Date.now()}`,
        sender: "bot",
        text: `STATUS UPDATE: Your project stage has advanced to "${activeStep?.title}". ${detail || activeStep?.description}`,
        time: "Just now",
        channel: "SMS",
      },
    ];

    this.addAuditLog({
      category: "Milestone",
      title: "Milestone Advanced & Customer Notified",
      detail: `Project advanced to stage ${stepIndex + 1} (${activeStep?.title}). Sent SMS alert to customer.`,
      latencyMs: 95,
      status: "success",
    });

    this.save();
    return { project: this.portalProject, milestones: this.portalMilestones };
  }

  // --- CALL COACHING MODULE ---
  public getCalls(): Call[] {
    return this.calls;
  }

  public addCallRecording(rep: string, customer: string, duration: string, outcome: string): Call {
    const id = `CALL-${Math.floor(100 + Math.random() * 900)}`;
    const score = Math.floor(70 + Math.random() * 26);

    const newCall: Call = {
      id,
      rep,
      customer,
      date: "Today",
      duration,
      score,
      outcome,
      audioUrl: "https://actions.google.com/sounds/v1/ambiences/office_space.ogg",
      talkRatio: { rep: 54, customer: 46 },
      sentiment: score >= 85 ? "Positive" : score >= 70 ? "Neutral" : "Needs work",
      keyMoments: [
        { time: "01:15", speaker: "Customer", tag: "Objection", text: "Is the tile roof replacement extra cost?" },
        { time: "02:40", speaker: "Rep", tag: "Value Pitch", text: "We include custom tile flashing and zero-leak guarantee." },
      ],
      transcript: [
        { time: "00:05", speaker: "Rep", text: `Hi ${customer}, this is ${rep} following up on your SolarPeak quote.` },
        { time: "00:18", speaker: "Customer", text: "Thanks for calling. I reviewed the numbers but wanted to check on installation timelines." },
        { time: "00:45", speaker: "Rep", text: "Great question! We typically complete roof mounts within 14 days of permit approval." },
      ],
      objections: [
        { topic: "Tile Roof Labor", RepHandled: true, note: "Cleared up flashing warranty." },
        { topic: "Timeline", RepHandled: true, note: "Confirmed 14-day turnaround." },
      ],
      coachingNotes: [
        "Great rapport building at the start.",
        "Ensure clear explanation of net metering utility rates.",
      ],
    };

    this.calls = [newCall, ...this.calls];

    this.addAuditLog({
      category: "Call Coaching",
      title: "Call Recording Ingested & Analyzed",
      detail: `Ingested call ${id} (${rep} -> ${customer}). AI STT transcript & objection tagging completed with score ${score}/100.`,
      latencyMs: 840,
      status: "success",
    });

    this.save();
    return newCall;
  }

  // --- AUDIT LOGS & APPOINTMENTS / TASKS ---
  public getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }

  public addAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs = [newEntry, ...this.auditLogs];
    this.save();
  }

  public getAppointments(): Appointment[] {
    return this.appointments;
  }

  public getTasks(): Task[] {
    return this.tasks;
  }

  public getPortalMessages(): ChatMessage[] {
    return this.portalMessages;
  }
}

export const db = new DatabaseStore();
