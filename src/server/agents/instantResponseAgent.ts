import { serverDb } from "../dbStore";
import { crmAdapter, type RawCrmPayload } from "../crmAdapter";
import type { Lead, Conversation, Appointment } from "@/data/mock";

export class InstantResponseAgent {
  public async processInboundWebhook(rawPayload: RawCrmPayload): Promise<{ lead: Lead; conversation: Conversation; latencyMs: number }> {
    const startTime = Date.now();
    const settings = serverDb.getCrmSettings();
    const normalized = crmAdapter.normalizeInboundPayload(rawPayload, settings.provider);

    const leadId = `LD-${Math.floor(1000 + Math.random() * 9000)}`;

    let score = 50;
    if (normalized.homeowner) score += 25;
    if ((normalized.monthlyBill || 0) >= 300) score += 15;
    else if ((normalized.monthlyBill || 0) >= 200) score += 10;
    if (normalized.roof === "Asphalt shingle" || normalized.roof === "Tile") score += 10;

    const needsHandoff = score < 45 || normalized.homeowner === false;
    const initialStatus = needsHandoff ? "contacted" : "new";
    const assignedOwner = needsHandoff ? "Human Rep (Escalated)" : "Dana Ruiz";

    const newLead: Lead = {
      id: leadId,
      name: normalized.name || "Inbound Solar Lead",
      email: normalized.email || "lead@example.com",
      phone: normalized.phone || "(555) 000-0000",
      city: normalized.city || "Phoenix",
      state: normalized.state || "AZ",
      source: (normalized.source as any) || "Google Ads",
      status: initialStatus as any,
      score,
      monthlyBill: normalized.monthlyBill || 240,
      homeType: "Single family",
      roof: (normalized.roof as any) || "Asphalt shingle",
      timeline: "0-1 month",
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
      customer: newLead.name,
      phone: newLead.phone,
      channel: "SMS",
      lastMessage: `Hi ${newLead.name.split(" ")[0]}! This is Sunny from SolarPeak. Got your request for your home in ${newLead.city}. Do you have 60 seconds to lock in your 25-yr solar estimate?`,
      lastTime: "Just now",
      unread: true,
      stage: initialStatus as any,
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
      detail: `Agent ingested ${newLead.name} (${newLead.email}) from ${settings.provider} -> Lead ${newLead.id} created`,
      latencyMs,
      status: "success",
    });

    await crmAdapter.dispatchOutboundSync("LEAD_QUALIFIED", newLead);

    return { lead: newLead, conversation: newConv, latencyMs };
  }

  public async qualifyLead(leadId: string, answers: Record<string, string>): Promise<Lead> {
    const lead = serverDb.getLeadById(leadId);
    if (!lead) throw new Error(`Lead ${leadId} not found`);

    let score = 30;
    if (answers.homeowner === "Yes, I own it") score += 30;
    if (answers.bill === "Over $350" || answers.bill === "$200 – $350") score += 25;
    if (answers.roof === "Asphalt shingle, under 10 yrs" || answers.roof === "Tile") score += 15;

    const needsHandoff = score < 45 || answers.homeowner === "No, I rent";
    const status = needsHandoff ? "contacted" : "qualified";

    lead.score = score;
    lead.status = status;
    lead.aiSummary = `Qualifying completed. Computed Intent Score: ${score}/100. ${needsHandoff ? "Escalated to human manager." : "Auto-booking consultation."}`;
    lead.lastTouch = "Just now";

    serverDb.saveLead(lead);

    serverDb.addAuditLog({
      category: "AI Bot",
      title: "Lead Qualification Completed",
      detail: `Lead ${leadId} (${lead.name}) qualified with score ${score}/100 -> Status: '${status}'`,
      latencyMs: 140,
      status: needsHandoff ? "warning" : "success",
    });

    await crmAdapter.dispatchOutboundSync("LEAD_QUALIFIED", lead, { answers });
    return lead;
  }

  public async bookAppointment(leadId: string, rep: string, date: string, time: string): Promise<Appointment> {
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
      type: "In-home consultation",
      status: "Confirmed",
      notes: "Auto-booked by Instant Response Agent following qualification flow.",
    };

    if (lead) {
      lead.status = "appointment";
      lead.owner = rep;
      lead.lastTouch = "Just now";
      serverDb.saveLead(lead);
    }

    serverDb.addAuditLog({
      category: "AI Bot",
      title: "Calendar Consultation Auto-Booked",
      detail: `Booked slot for ${appt.customer} with rep ${rep} on ${date} at ${time}`,
      latencyMs: 110,
      status: "success",
    });

    if (lead) {
      await crmAdapter.dispatchOutboundSync("APPOINTMENT_BOOKED", lead, { appointment: appt });
    }

    return appt;
  }
}

export const instantResponseAgent = new InstantResponseAgent();
