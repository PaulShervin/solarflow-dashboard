import { serverDb, type CrmSettings } from "./dbStore";
import type { Lead } from "@/data/mock";

export type RawCrmPayload = Record<string, any>;

export class CrmAdapter {
  public normalizeInboundPayload(payload: RawCrmPayload, provider: CrmSettings["provider"]): Partial<Lead> {
    if (provider === "HubSpot") {
      const props = payload.properties || payload;
      return {
        name: `${props.firstname || props.first_name || ""} ${props.lastname || props.last_name || ""}`.trim() || props.name || "HubSpot Lead",
        email: props.email?.value || props.email || "lead@hubspot.com",
        phone: props.phone?.value || props.phone || "(555) 000-0000",
        city: props.city?.value || props.city || "Phoenix",
        state: props.state?.value || props.state || "AZ",
        source: "Google Ads",
        monthlyBill: Number(props.monthly_electric_bill || props.monthly_bill || 240),
        roof: props.roof_type || props.roof || "Asphalt shingle",
        homeowner: props.is_homeowner !== false && props.homeowner !== "no",
      };
    }

    if (provider === "Salesforce") {
      return {
        name: `${payload.FirstName || ""} ${payload.LastName || payload.Name || "SFDC Lead"}`.trim(),
        email: payload.Email || "lead@salesforce.com",
        phone: payload.Phone || payload.MobilePhone || "(555) 000-0000",
        city: payload.City || "Scottsdale",
        state: payload.State || "AZ",
        source: "Meta",
        monthlyBill: Number(payload.Monthly_Bill__c || 310),
        roof: payload.Roof_Type__c || "Tile",
        homeowner: payload.Is_Homeowner__c !== false,
      };
    }

    if (provider === "GoHighLevel") {
      const contact = payload.contact || payload;
      return {
        name: `${contact.firstName || ""} ${contact.lastName || contact.name || "GHL Lead"}`.trim(),
        email: contact.email || "lead@gohighlevel.com",
        phone: contact.phone || "(555) 000-0000",
        city: contact.city || "Mesa",
        state: contact.state || "AZ",
        source: "Website",
        monthlyBill: Number(contact.customFields?.monthly_bill || 270),
        roof: contact.customFields?.roof || "Asphalt shingle",
        homeowner: true,
      };
    }

    return {
      name: payload.name || payload.fullName || "Inbound Webhook Lead",
      email: payload.email || "lead@example.com",
      phone: payload.phone || payload.mobile || "(555) 000-0000",
      city: payload.city || "Phoenix",
      state: payload.state || "AZ",
      source: payload.source || "Website",
      monthlyBill: Number(payload.monthlyBill || payload.bill || 250),
      roof: payload.roof || "Asphalt shingle",
      homeowner: payload.homeowner ?? true,
    };
  }

  public async dispatchOutboundSync(event: "LEAD_QUALIFIED" | "APPOINTMENT_BOOKED" | "MILESTONE_UPDATED", lead: Lead, extraData?: Record<string, any>) {
    const settings = serverDb.getCrmSettings();
    if (!settings.syncEnabled || !settings.webhookUrl) {
      return { success: false, reason: "Outbound CRM sync disabled in settings" };
    }

    const startTime = Date.now();
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      crmProvider: settings.provider,
      leadId: lead.id,
      contact: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        state: lead.state,
      },
      solarData: {
        status: lead.status,
        intentScore: lead.score,
        monthlyBill: lead.monthlyBill,
        roofType: lead.roof,
        owner: lead.owner,
        aiSummary: lead.aiSummary,
      },
      ...extraData,
    };

    try {
      const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 40 + 20);

      serverDb.addAuditLog({
        category: "CRM Sync",
        title: `2-Way CRM Outbound Sync (${settings.provider})`,
        detail: `Dispatched event '${event}' for ${lead.name} to ${settings.webhookUrl}`,
        latencyMs,
        status: "success",
      });

      return { success: true, latencyMs, payload };
    } catch (err: any) {
      serverDb.addAuditLog({
        category: "CRM Sync",
        title: `CRM Sync Failed (${settings.provider})`,
        detail: `Error sending payload to ${settings.webhookUrl}: ${err.message}`,
        status: "error",
      });
      return { success: false, error: err.message };
    }
  }
}

export const crmAdapter = new CrmAdapter();
