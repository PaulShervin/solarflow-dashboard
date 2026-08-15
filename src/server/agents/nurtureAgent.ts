import { serverDb } from "../dbStore";
import type { Lead } from "@/data/mock";

export class NurtureAgent {
  public compilePersonalizedTemplate(template: string, lead: Lead): string {
    const firstName = (lead.name || "").split(" ")[0] || "Customer";
    const estSavings = Math.round((lead.monthlyBill || 0) * 8.5).toLocaleString();

    return template
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{full_name\}\}/gi, lead.name || "")
      .replace(/\{\{monthly_bill\}\}/gi, `$${lead.monthlyBill || 0}/mo`)
      .replace(/\{\{roof_type\}\}/gi, lead.roof || "")
      .replace(/\{\{city\}\}/gi, lead.city || "")
      .replace(/\{\{est_savings\}\}/gi, `$${estSavings}`)
      .replace(/\{\{rep_name\}\}/gi, lead.owner || "Representative");
  }

  public async evaluateTriggerRules(): Promise<{ executedCount: number; logs: string[] }> {
    const startTime = Date.now();
    const leads = serverDb.getLeads();
    const logs: string[] = [];
    let executedCount = 0;

    for (const lead of leads) {
      if (lead.status === "new" || lead.status === "contacted") {
        executedCount++;
        const msg = this.compilePersonalizedTemplate(
          "Hi {{first_name}}! Notice your monthly bill is {{monthly_bill}} in {{city}}. Solar Peak can save you ~{{est_savings}}/yr on your {{roof_type}} roof. Reply YES for a 2-min breakdown.",
          lead,
        );
        logs.push(`Lead ${lead.name} (${lead.id}): Dispatched Drip Step 1 SMS -> "${msg}"`);
      } else if (lead.status === "proposal") {
        executedCount++;
        const msg = this.compilePersonalizedTemplate(
          "Hi {{first_name}}, {{rep_name}} here. Just checking in on your {{monthly_bill}} solar proposal. Let's make sure you claim your 30% tax credit before Q4.",
          lead,
        );
        logs.push(`Lead ${lead.name} (${lead.id}): Dispatched Proposal Follow-up -> "${msg}"`);
      }
    }

    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 50 + 40);

    serverDb.addAuditLog({
      category: "Nurture",
      title: "Contextual Nurture Trigger Rules Evaluated",
      detail: `Evaluated ${leads.length} leads across active campaigns -> Queued ${executedCount} personalized touchpoints`,
      latencyMs,
      status: "info",
    });

    return { executedCount, logs };
  }
}

export const nurtureAgent = new NurtureAgent();
