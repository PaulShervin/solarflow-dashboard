import { LeadModel } from "../models";
import { config } from "../../shared/config";
import { logger } from "../../shared/logger";

export interface PersonalizationContext {
  first_name: string;
  last_name: string;
  sales_rep_name: string;
  quote_amount: string;
  quote_url: string;
  timeline: string;
  monthly_electric_bill: string;
  appointment_date: string;
  company_name: string;
  lead_stage: string;
}

export class PersonalizationService {
  static extractContext(lead: LeadModel): PersonalizationContext {
    return {
      first_name: lead.firstName || "there",
      last_name: lead.lastName || "",
      sales_rep_name: lead.assignedSalesRep || "our team",
      quote_amount: lead.quoteAmount ? `$${lead.quoteAmount.toLocaleString()}` : "your custom solar estimate",
      quote_url: lead.quoteUrl || "your proposal",
      timeline: lead.timeline || "the upcoming months",
      monthly_electric_bill: lead.monthlyElectricBill ? `$${lead.monthlyElectricBill}/mo` : "your electric bill",
      appointment_date: lead.appointmentDate ? lead.appointmentDate : "your scheduled time",
      company_name: config.companyName || "SolarPeak",
      lead_stage: lead.leadStage || "NURTURE",
    };
  }

  static renderTemplate(templateBody: string, lead: LeadModel): string {
    const ctx = this.extractContext(lead);
    let result = templateBody;

    for (const [key, value] of Object.entries(ctx)) {
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      result = result.replace(placeholder, value);
    }

    return result;
  }

  /**
   * AI Personalization Boundary Interface.
   * Transforms structured verified context into natural wording.
   * If AI is unavailable or throws an error, falls back deterministically.
   */
  static async renderWithAiFallback(
    templateBody: string,
    lead: LeadModel,
    useAi = false
  ): Promise<string> {
    const deterministicResult = this.renderTemplate(templateBody, lead);

    if (!useAi) {
      return deterministicResult;
    }

    try {
      // AI wording refinement stub - preserves exact facts, enhances tone
      logger.info("Executing AI wording personalization layer for lead", { leadId: lead.id });
      // In production, invoke Gemini/OpenAI prompt passing ONLY verified ctx
      return deterministicResult;
    } catch (err) {
      logger.warn("AI Personalization failed, falling back to deterministic template", { err, leadId: lead.id });
      return deterministicResult;
    }
  }
}
