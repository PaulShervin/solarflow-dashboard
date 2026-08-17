import { serverDb } from "../dbStore";
import { crmAdapter, type RawCrmPayload } from "../crmAdapter";
import type { Lead, LeadStatus, Conversation, Appointment, AvailabilitySlot } from "@/data/mock";

/**
 * Normalizes any free-form timeline value into the canonical Lead timeline set.
 * Unknown / long-horizon values collapse to the coldest tier.
 */
export function normalizeTimeline(value?: string): Lead["timeline"] {
  const v = (value || "").toLowerCase();
  if (v.includes("0-1") || v.includes("as soon") || v.includes("immediate") || v === "now") return "0-1 month";
  if (v.includes("1-3") || v.includes("1 – 3")) return "1-3 months";
  if (v.includes("3-6") || v.includes("3 – 6")) return "3-6 months";
  return "Just researching";
}

/**
 * Single source of truth for quantitative intent scoring (0-100).
 * Factors: homeownership, monthly bill, roof type, timeline. Base 30 so
 * low-intent scores (< 45) are reachable.
 */
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

  const timeline = normalizeTimeline(factors.timeline);
  if (timeline === "0-1 month") score += 15;
  else if (timeline === "1-3 months") score += 10;
  else if (timeline === "3-6 months") score += 0;
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

export class InstantResponseAgent {
  public async processInboundWebhook(rawPayload: RawCrmPayload): Promise<{ lead: Lead; conversation: Conversation; latencyMs: number }> {
    const startTime = Date.now();
    const settings = serverDb.getCrmSettings();
    const normalized = crmAdapter.normalizeInboundPayload(rawPayload, settings.provider);

    const leadId = `LD-${Math.floor(1000 + Math.random() * 9000)}`;

    const timeline = normalizeTimeline(normalized.timeline);
    const score = computeIntentScore({
      homeowner: normalized.homeowner ?? true,
      monthlyBill: normalized.monthlyBill,
      roof: normalized.roof,
      timeline,
    });

    const needsHandoff = score < 45 || normalized.homeowner === false;
    const initialStatus: LeadStatus = needsHandoff ? "contacted" : "new";
    const assignedOwner = needsHandoff ? "Human Rep (Escalated)" : "Dana Ruiz";

    const newLead: Lead = {
      id: leadId,
      name: normalized.name || "Inbound Solar Lead",
      email: normalized.email || "lead@example.com",
      phone: normalized.phone || "(555) 000-0000",
      city: normalized.city || "Phoenix",
      state: normalized.state || "AZ",
      source: (normalized.source as Lead["source"]) || "Google Ads",
      status: initialStatus,
      score,
      monthlyBill: normalized.monthlyBill || 240,
      homeType: "Single family",
      roof: (normalized.roof as Lead["roof"]) || "Asphalt shingle",
      timeline,
      homeowner: normalized.homeowner ?? true,
      createdAt: new Date().toISOString(),
      lastTouch: "Just now",
      owner: assignedOwner,
      aiSummary: `Autonomous Instant Response Agent processed webhook (${settings.provider}). Intent score: ${score}/100. ${needsHandoff ? "FLAGGED FOR HUMAN HANDOFF." : "Qualified for auto-booking."}`,
      tags: ["Instant Response", settings.provider, score > 75 ? "High Intent" : "Standard"],
    };

    serverDb.saveLead(newLead);

    const convId = `CV-${Math.floor(100 + Math.random() * 900)}`;
    const newConv: Conversation = {
      id: convId,
      leadId: newLead.id,
      name: newLead.name,
      customer: newLead.name,
      phone: newLead.phone,
      channel: "SMS",
      status: "Active",
      score: newLead.score,
      preview: `Hi ${newLead.name.split(" ")[0]}! Thanks for reaching out...`,
      updatedAt: "Just now",
      lastMessage: `Hi ${newLead.name.split(" ")[0]}! This is Sunny from SolarPeak. Got your request for your home in ${newLead.city}. Do you have 60 seconds to lock in your 25-yr solar estimate?`,
      lastTime: "Just now",
      unread: 1,
      stage: initialStatus,
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: "system",
          text: `Inbound Lead Ingested via ${settings.provider} Webhook`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          channel: "System",
        },
        {
          id: `msg-${Date.now()}-2`,
          sender: "bot",
          text: `Hi ${newLead.name.split(" ")[0]}! Thanks for reaching out to SolarPeak. I'm Sunny, your solar assistant. Got your request for your home in ${newLead.city}. Do you have 60 seconds to review your estimate?`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          channel: "SMS",
        },
      ],
    };

    serverDb.saveConversation(newConv);

    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 60 + 30);

    serverDb.addAuditLog({
      category: "Webhook",
      title: "Inbound Webhook Processed",
      detail: `Agent ingested ${newLead.name} (${newLead.email}) from ${settings.provider} -> Lead ${newLead.id} created (score ${score}/100, timeline ${timeline})`,
      latencyMs,
      status: needsHandoff ? "warning" : "success",
    });

    await crmAdapter.dispatchOutboundSync("LEAD_QUALIFIED", newLead);

    return { lead: newLead, conversation: newConv, latencyMs };
  }

  public async qualifyLead(
    leadId: string,
    answers: Record<string, string>,
  ): Promise<{ lead: Lead; appointment?: Appointment }> {
    const lead = serverDb.getLeadById(leadId);
    if (!lead) throw new Error(`Lead ${leadId} not found`);

    const homeowner = answers.homeowner === "Yes, I own it" || answers.homeowner === "I'm buying soon";
    const bill =
      answers.bill?.includes("10,000") || answers.bill === "Over ₹10,000" || answers.bill === "Over $350"
        ? 12000
        : answers.bill?.includes("5,000") || answers.bill === "₹5,000 – ₹10,000" || answers.bill === "$200 – $350"
          ? 7500
          : answers.bill?.includes("2,500") || answers.bill === "₹2,500 – ₹5,000" || answers.bill === "$100 – $200"
            ? 3500
            : 2000;
    const timeline = normalizeTimeline(answers.timeline);

    const score = computeIntentScore({ homeowner, monthlyBill: bill, roof: answers.roof, timeline });
    const needsHandoff = score < 45 || answers.homeowner === "No, I rent";
    const status = needsHandoff ? "contacted" : "qualified";

    lead.score = score;
    lead.status = status;
    lead.timeline = timeline;
    lead.lastTouch = "Just now";
    lead.aiSummary = `Qualifying completed. Computed Intent Score: ${score}/100. ${needsHandoff ? "Escalated to human manager." : "Auto-booking consultation."}`;
    if (needsHandoff) {
      lead.owner = "Human Rep (Escalated)";
    }

    serverDb.saveLead(lead);

    serverDb.addAuditLog({
      category: "AI Bot",
      title: "Lead Qualification Completed",
      detail: `Lead ${leadId} (${lead.name}) qualified with score ${score}/100 -> Status: '${status}'${needsHandoff ? ", ownership transferred to Human Rep (Escalated)" : ""}`,
      latencyMs: 140,
      status: needsHandoff ? "warning" : "success",
    });

    // Auto-book the earliest open slot on the assigned rep's availability matrix.
    let appointment: Appointment | undefined;
    if (!needsHandoff) {
      const rep = lead.owner || "Dana Ruiz";
      const slot = serverDb.findFirstOpenSlot(rep);
      if (slot) {
        appointment = await this.bookAppointment(leadId, slot.rep, slot.date, slot.time);
        const updated = serverDb.getLeadById(leadId);
        if (updated) {
          lead.id = updated.id;
          lead.status = updated.status;
          lead.owner = updated.owner;
          lead.lastTouch = updated.lastTouch;
        }
      }
    }

    await crmAdapter.dispatchOutboundSync("LEAD_QUALIFIED", lead, { answers, ...(appointment ? { appointment } : {}) });
    const result: { lead: Lead; appointment?: Appointment } = { lead };
    if (appointment) result.appointment = appointment;
    return result;
  }

  public async bookAppointment(leadId: string, rep: string, date: string, time: string): Promise<Appointment> {
    if (!serverDb.isRepInMatrix(rep)) {
      throw new BookingConflictError(`Rep "${rep}" is not on the availability matrix`, "REP_NOT_FOUND");
    }
    if (!serverDb.isSlotOpen(rep, date, time)) {
      throw new BookingConflictError(`Slot ${date} ${time} for ${rep} is not open on the availability matrix`, "SLOT_UNAVAILABLE");
    }
    if (serverDb.hasAppointmentConflict(rep, date, time)) {
      throw new BookingConflictError(`Rep ${rep} already has an appointment on ${date} at ${time}`, "SLOT_UNAVAILABLE");
    }

    const reserved = serverDb.reserveSlot(rep, date, time);
    if (!reserved) {
      throw new BookingConflictError(`Failed to reserve slot ${date} ${time} for ${rep}`, "SLOT_UNAVAILABLE");
    }

    const lead = serverDb.getLeadById(leadId);
    const apptId = `APT-${Math.floor(1000 + Math.random() * 9000)}`;

    const appt: Appointment = {
      id: apptId,
      customer: lead?.name || "Solar Customer",
      email: lead?.email || "customer@example.com",
      phone: lead?.phone || "(555) 000-0000",
      rep,
      date,
      time,
      type: "In-home consult",
      status: "Confirmed",
      notes: "Auto-booked by Instant Response Agent on the sales rep availability matrix.",
    };

    serverDb.saveAppointment(appt);

    if (lead) {
      lead.status = "appointment";
      lead.owner = rep;
      lead.lastTouch = "Just now";
      serverDb.saveLead(lead);
    }

    serverDb.addAuditLog({
      category: "AI Bot",
      title: "Calendar Consultation Auto-Booked",
      detail: `Reserved matrix slot for ${appt.customer} with rep ${rep} on ${date} at ${time} (slot ${reserved.id} marked closed)`,
      latencyMs: 110,
      status: "success",
    });

    if (lead) {
      await crmAdapter.dispatchOutboundSync("APPOINTMENT_BOOKED", lead, { appointment: appt });
    }

    return appt;
  }

  public async bookSlotFromCalendar(slotId: string, leadId: string): Promise<{ appointment: Appointment; slot: AvailabilitySlot }> {
    const slot = serverDb.getSlotById(slotId);
    if (!slot) {
      throw new BookingConflictError(`Availability slot ${slotId} not found`, "SLOT_NOT_FOUND");
    }
    const appointment = await this.bookAppointment(leadId, slot.rep, slot.date, slot.time);
    // Re-read the slot so the response reflects the reservation (status -> closed).
    const booked = serverDb.getSlotById(slotId);
    return { appointment, slot: booked ?? slot };
  }

  public async setSlotStatus(slotId: string, status: "open" | "closed"): Promise<{ slot: AvailabilitySlot }> {
    if (status === "open") {
      const slot = serverDb.getSlotById(slotId);
      if (slot && serverDb.hasAppointmentConflict(slot.rep, slot.date, slot.time)) {
        throw new BookingConflictError(
          `Cannot reopen slot ${slotId}: ${slot.rep} already has an appointment on ${slot.date} at ${slot.time}`,
          "SLOT_HAS_APPOINTMENT",
        );
      }
    }
    const updated = serverDb.setSlotStatus(slotId, status);
    if (!updated) {
      throw new BookingConflictError(`Availability slot ${slotId} not found`, "SLOT_NOT_FOUND");
    }
    serverDb.addAuditLog({
      category: "AI Bot",
      title: status === "closed" ? "Availability Slot Manually Closed" : "Availability Slot Reopened",
      detail: `Slot ${updated.id} (${updated.rep}, ${updated.date} ${updated.time}) set to '${status}' by admin`,
      status: "info",
    });
    return { slot: updated };
  }
}

export const instantResponseAgent = new InstantResponseAgent();
