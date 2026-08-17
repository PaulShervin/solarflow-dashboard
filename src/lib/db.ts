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

/** Client-side mirror of the server intent-score rubric (keep in sync). */
export function computeIntentScore(factors: {
  homeowner: boolean;
  monthlyBill?: number | undefined;
  roof?: string | undefined;
  timeline?: string | undefined;
}): number {
  let score = 30;
  if (factors.homeowner) score += 30;

  const bill = factors.monthlyBill || 0;
  if (bill >= 300) score += 25;
  else if (bill >= 200) score += 15;

  const roof = (factors.roof || "").toLowerCase();
  if (roof.includes("asphalt") || roof.includes("tile")) score += 15;

  const timeline = (factors.timeline || "").toLowerCase();
  if (timeline.includes("0-1") || timeline.includes("as soon")) score += 15;
  else if (timeline.includes("1-3")) score += 10;
  else if (timeline.includes("3-6")) score += 0;
  else score -= 5;

  return Math.max(0, Math.min(100, score));
}

export class BookingConflictError extends Error {
  public code: string;
  constructor(message: string, code = "SLOT_UNAVAILABLE") {
    super(message);
    this.name = "BookingConflictError";
    this.code = code;
  }
}

import {
  syncLeadToFirestore,
  subscribeFirestoreLeads,
  syncConversationToFirestore,
  subscribeFirestoreConversations,
  syncProposalToFirestore,
  subscribeFirestoreProposals,
  syncAppointmentToFirestore,
  subscribeFirestoreAppointments,
  syncTaskToFirestore,
  subscribeFirestoreTasks,
  syncAuditLogToFirestore,
  subscribeFirestoreAuditLogs,
} from "./firestoreSync";

const STORAGE_KEY = "solarflow_db_v2";

type Listener = () => void;

class DatabaseStore {
  private leads: Lead[] = [];
  private conversations: Conversation[] = [];
  private proposals: Proposal[] = [];
  private campaigns: Campaign[] = [];
  private calls: Call[] = [];
  private appointments: Appointment[] = [];
  private tasks: Task[] = [];
  private availability: AvailabilitySlot[] = [];
  private portalProject = { ...defaultPortalProject };
  private portalMilestones: PortalMilestone[] = [];
  private portalMessages: any[] = [];
  private portalAppointments: any[] = [];
  private portalDocuments = [...defaultPortalDocuments];
  private portalPayments: any[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.load();
    this.initFirestoreListeners();
  }

  private initFirestoreListeners() {
    if (typeof window === "undefined") return;

    subscribeFirestoreLeads((remoteLeads) => {
      if (remoteLeads && remoteLeads.length > 0) {
        this.leads = remoteLeads;
        this.saveLocalOnly();
      }
    });

    subscribeFirestoreConversations((remoteConvs) => {
      if (remoteConvs && remoteConvs.length > 0) {
        this.conversations = remoteConvs;
        this.saveLocalOnly();
      }
    });

    subscribeFirestoreAppointments((remoteAppts) => {
      if (remoteAppts && remoteAppts.length > 0) {
        this.appointments = remoteAppts;
        this.saveLocalOnly();
      }
    });

    subscribeFirestoreProposals((remoteProps) => {
      if (remoteProps && remoteProps.length > 0) {
        this.proposals = remoteProps;
        this.saveLocalOnly();
      }
    });

    subscribeFirestoreTasks((remoteTasks) => {
      if (remoteTasks && remoteTasks.length > 0) {
        this.tasks = remoteTasks;
        this.saveLocalOnly();
      }
    });

    subscribeFirestoreAuditLogs((remoteLogs) => {
      if (remoteLogs && remoteLogs.length > 0) {
        this.auditLogs = remoteLogs;
        this.saveLocalOnly();
      }
    });
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
      this.leads = data.leads || [];
      this.conversations = data.conversations || [];
      this.proposals = data.proposals || [];
      this.campaigns = data.campaigns || [];
      this.calls = data.calls || [];
      this.appointments = data.appointments || [];
      this.tasks = data.tasks || [];
      this.availability = data.availability || defaultAvailability;
      this.portalProject = data.portalProject || defaultPortalProject;
      this.portalMilestones = data.portalMilestones || [];
      this.portalMessages = data.portalMessages || [];
      this.portalAppointments = data.portalAppointments || [];
      this.portalDocuments = data.portalDocuments || defaultPortalDocuments;
      this.portalPayments = data.portalPayments || [];
      this.auditLogs = data.auditLogs || [];
    } catch (err) {
      console.error("Failed to parse DB from localStorage, falling back to clean state", err);
      this.useDefaults();
    }
  }

  private useDefaults() {
    this.leads = [];
    this.conversations = [];
    this.proposals = [];
    this.campaigns = [];
    this.calls = [];
    this.appointments = [];
    this.tasks = [];
    this.availability = [...defaultAvailability];
    this.portalProject = { ...defaultPortalProject };
    this.portalMilestones = [];
    this.portalMessages = [];
    this.portalAppointments = [];
    this.portalDocuments = [...defaultPortalDocuments];
    this.portalPayments = [];
    this.auditLogs = [];
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

  private saveLocalOnly() {
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
        availability: this.availability,
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
      console.error("Failed to save local DB state", err);
    }
    this.notify();
  }

  private save() {
    this.saveLocalOnly();
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
    this.leads = [lead, ...this.leads.filter((l) => l.id !== lead.id)];
    this.save();
    syncLeadToFirestore(lead);
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
    if (updated) {
      syncLeadToFirestore(updated);
    }
    return updated;
  }

  public deleteLead(id: string) {
    this.leads = this.leads.filter((l) => l.id !== id);
    this.save();
  }

  // --- AVAILABILITY MATRIX ---
  public getAvailability(): AvailabilitySlot[] {
    return this.availability;
  }

  public isRepInMatrix(rep: string): boolean {
    return this.availability.some((s) => s.rep === rep);
  }

  public isSlotOpen(rep: string, date: string, time: string): boolean {
    const slot = this.availability.find((s) => s.rep === rep && s.date === date && s.time === time);
    return !!slot && slot.status === "open";
  }

  public hasAppointmentConflict(rep: string, date: string, time: string): boolean {
    return this.appointments.some((a) => a.rep === rep && a.date === date && a.time === time);
  }

  public reserveSlot(rep: string, date: string, time: string): AvailabilitySlot | null {
    const idx = this.availability.findIndex((s) => s.rep === rep && s.date === date && s.time === time);
    if (idx < 0) return null;
    const current = this.availability[idx];
    if (!current || current.status !== "open") return null;
    const slot: AvailabilitySlot = { ...current, status: "closed" };
    this.availability = this.availability.map((s, i) => (i === idx ? slot : s));
    return slot;
  }

  public findFirstOpenSlot(rep: string): AvailabilitySlot | null {
    const slots = this.availability
      .filter((s) => s.rep === rep && s.status === "open")
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.order - b.order));
    return slots[0] || null;
  }

  public getSlotById(slotId: string): AvailabilitySlot | undefined {
    return this.availability.find((s) => s.id === slotId);
  }

  public updateAvailabilitySlot(slotId: string, status: "open" | "closed"): { slot: AvailabilitySlot } {
    const slot = this.getSlotById(slotId);
    if (!slot) throw new BookingConflictError(`Availability slot ${slotId} not found`, "SLOT_NOT_FOUND");
    if (status === "open" && this.hasAppointmentConflict(slot.rep, slot.date, slot.time)) {
      throw new BookingConflictError(
        `Cannot reopen slot ${slotId}: ${slot.rep} already has an appointment on ${slot.date} at ${slot.time}`,
        "SLOT_HAS_APPOINTMENT",
      );
    }
    this.availability = this.availability.map((s) => (s.id === slotId ? { ...s, status } : s));
    this.addAuditLog({
      category: "AI Bot",
      title: status === "closed" ? "Availability Slot Manually Closed" : "Availability Slot Reopened",
      detail: `Slot ${slot.id} (${slot.rep}, ${slot.date} ${slot.time}) set to '${status}' by admin`,
      status: "info",
    });
    return { slot: this.getSlotById(slotId)! };
  }

  public bookSlotFromCalendar(slotId: string, leadId: string): { appointment: Appointment; slot: AvailabilitySlot } {
    const slot = this.getSlotById(slotId);
    if (!slot) throw new BookingConflictError(`Availability slot ${slotId} not found`, "SLOT_NOT_FOUND");
    const appointment = this.bookAppointment(leadId, slot.rep, slot.date, slot.time);
    // Re-read the slot so the response reflects the reservation (status -> closed).
    const booked = this.getSlotById(slotId);
    return { appointment, slot: booked ?? slot };
  }

  // --- INBOUND WEBHOOK & QUALIFYING ---
  public addWebhookLead(payload: WebhookPayload): { lead: Lead; auditLog: AuditLogEntry } {
    const startTime = Date.now();
    const id = `LD-${Math.floor(1000 + Math.random() * 9000)}`;

    const timeline = payload.timeline || "0-1 month";
    const score = computeIntentScore({
      homeowner: payload.homeowner ?? true,
      monthlyBill: payload.monthlyBill,
      roof: payload.roof,
      timeline,
    });
    const needsHandoff = score < 45 || payload.homeowner === false;

    const newLead: Lead = {
      id,
      name: payload.name || "Anonymous Lead",
      email: payload.email || "lead@example.com",
      phone: payload.phone || "(555) 000-0000",
      city: payload.city || "Phoenix",
      state: payload.state || "AZ",
      source: payload.source || "Website",
      status: needsHandoff ? "contacted" : "new",
      score,
      monthlyBill: payload.monthlyBill || 220,
      homeType: payload.homeType || "Single family",
      roof: payload.roof || "Asphalt shingle",
      timeline,
      homeowner: payload.homeowner ?? true,
      createdAt: new Date().toISOString(),
      lastTouch: "Just now",
      owner: needsHandoff ? "Human Rep (Escalated)" : "Sunny (AI Agent)",
      aiSummary: `Inbound webhook captured lead with average monthly bill of $${payload.monthlyBill || 220}. Intent score: ${score}/100. ${needsHandoff ? "FLAGGED FOR HUMAN HANDOFF." : "Qualify via automated SMS/call prompt."}`,
      tags: ["Webhook", "Instant Lead", score > 75 ? "High Intent" : "Standard"],
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
  ): { lead?: Lead; appointment?: Appointment } | undefined {
    const lead = this.getLeadById(leadId);
    if (!lead) return undefined;

    const homeowner = answers.homeowner === "Yes, I own it" || answers.homeowner === "I'm buying soon";
    const bill =
      answers.bill?.includes("10,000") || answers.bill === "Over ₹10,000" || answers.bill === "Over $350"
        ? 12000
        : answers.bill?.includes("5,000") || answers.bill === "₹5,000 – ₹10,000" || answers.bill === "$200 – $350"
          ? 6500
          : answers.bill?.includes("2,500") || answers.bill === "₹2,500 – ₹5,000" || answers.bill === "$100 – $200"
            ? 3500
            : 1800;
    const timeline = answers.timeline || "0-1 month";
    const score = computeIntentScore({ homeowner, monthlyBill: bill, roof: answers.roof, timeline });

    const needsHandoff = score < 45 || answers.homeowner === "No, I rent";
    const newStatus = needsHandoff ? "contacted" : "qualified";

    this.updateLead(leadId, {
      score,
      status: newStatus,
      timeline: timeline as Lead["timeline"],
      owner: needsHandoff ? "Human Rep (Escalated)" : lead.owner,
      aiSummary: `Qualifying conversation completed. Answers: ${JSON.stringify(answers)}. Computed intent score: ${score}. ${needsHandoff ? "FLAGGED FOR HUMAN HANDOFF — transferred to Human Rep." : "Auto-booking consultation."}`,
      tags: [...new Set([...lead.tags, "Qualified", score > 75 ? "High Intent" : "Review Needed"])],
    });

    this.addAuditLog({
      category: "AI Bot",
      title: "Qualifying Chat Completed",
      detail: `Lead ${leadId} scored ${score}/100. Status updated to '${newStatus}'.${needsHandoff ? " Ownership transferred to Human Rep (Escalated)." : ""}`,
      latencyMs: 190,
      status: needsHandoff ? "warning" : "success",
    });

    let appointment: Appointment | undefined;
    if (!needsHandoff) {
      const rep = lead.owner || "Dana Ruiz";
      const slot = this.findFirstOpenSlot(rep);
      if (slot) {
        appointment = this.bookAppointment(leadId, slot.rep, slot.date, slot.time);
      }
    }

    const result: { lead?: Lead; appointment?: Appointment } = {};
    const updatedLead = this.getLeadById(leadId);
    if (updatedLead) result.lead = updatedLead;
    if (appointment) result.appointment = appointment;
    return result;
  }

  // --- CALENDAR BOOKING ---
  public bookAppointment(leadId: string, rep: string, date: string, time: string): Appointment {
    if (!this.isRepInMatrix(rep)) {
      throw new BookingConflictError(`Rep "${rep}" is not on the availability matrix`, "REP_NOT_FOUND");
    }
    if (!this.isSlotOpen(rep, date, time)) {
      throw new BookingConflictError(`Slot ${date} ${time} for ${rep} is not open on the availability matrix`, "SLOT_UNAVAILABLE");
    }
    if (this.hasAppointmentConflict(rep, date, time)) {
      throw new BookingConflictError(`Rep ${rep} already has an appointment on ${date} at ${time}`, "SLOT_UNAVAILABLE");
    }

    const reserved = this.reserveSlot(rep, date, time);
    if (!reserved) {
      throw new BookingConflictError(`Failed to reserve slot ${date} ${time} for ${rep}`, "SLOT_UNAVAILABLE");
    }

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
      notes: "Auto-booked via Instant Response Agent on the sales rep availability matrix.",
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
      detail: `Reserved matrix slot for ${newAppt.customer} with ${rep} on ${date} at ${time} (slot ${reserved.id} marked closed).`,
      latencyMs: 145,
      status: "success",
    });

    this.save();
    syncAppointmentToFirestore(newAppt);
    return newAppt;
  }

  // --- CONVERSATIONS & MESSAGES ---
  public getConversations(): Conversation[] {
    return this.conversations;
  }

  public addMessage(conversationId: string, sender: "bot" | "user" | "rep" | "system", text: string, channel: "SMS" | "Voice Call" | "Webchat" = "SMS"): Conversation | undefined {
    let updatedConv: Conversation | undefined;
    const msgId = `msg-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: msgId,
      sender,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      channel,
    };

    const convExists = this.conversations.some((c) => c.id === conversationId);
    if (!convExists) {
      const createdConv: Conversation = {
        id: conversationId,
        leadId: conversationId,
        name: "Customer Lead",
        customer: "Solar Customer",
        channel: channel === "Webchat" ? "Web chat" : (channel as any),
        status: "Active",
        score: 85,
        preview: text,
        updatedAt: "Just now",
        unread: sender === "user" ? 1 : 0,
        messages: [newMsg],
        lastMessage: text,
        lastTime: "Just now",
      };
      this.conversations = [createdConv, ...this.conversations];
      updatedConv = createdConv;
    } else {
      this.conversations = this.conversations.map((c) => {
        if (c.id === conversationId) {
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
    }

    this.save();
    syncConversationToFirestore(conversationId, newMsg, {
      lastMessage: text,
      lastTime: "Just now",
      updatedAt: new Date().toISOString(),
    });
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
    syncProposalToFirestore(newProp);
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
    syncAuditLogToFirestore(newEntry);
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
