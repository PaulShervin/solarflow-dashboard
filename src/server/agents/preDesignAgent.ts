import { serverDb } from "../dbStore";
import type { Proposal } from "@/data/mock";

export type PreDesignInput = {
  customerName: string;
  monthlyBill: number;
  offsetPercent?: number;
  includeBattery?: boolean;
  repName?: string;
};

export class PreDesignAgent {
  public async generatePreDesignProposal(input: PreDesignInput): Promise<{ proposal: Proposal; engineeringData: any }> {
    const startTime = Date.now();
    const monthlyBill = input.monthlyBill || 280;
    const offsetPercent = input.offsetPercent || 90;
    const includeBattery = input.includeBattery ?? true;

    const dailyKwh = (monthlyBill / 0.16) / 30;
    const requiredDailyGeneration = dailyKwh * (offsetPercent / 100);
    const systemKw = Number((requiredDailyGeneration / 5.5).toFixed(1));
    const panelCount = Math.ceil((systemKw * 1000) / 400);
    const annualKwh = Math.round(systemKw * 1650);

    const grossSystemPrice = Math.round(systemKw * 2850 + (includeBattery ? 9500 : 0));
    const federalTaxCredit = Math.round(grossSystemPrice * 0.30);
    const netInvestment = grossSystemPrice - federalTaxCredit;

    const propId = `PROP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProposal: Proposal = {
      id: propId,
      customer: input.customerName || "Solar Customer",
      systemKw,
      battery: includeBattery,
      value: netInvestment,
      sent: "Today",
      views: 1,
      rep: input.repName || "Dana Ruiz",
      status: "Sent",
    };

    serverDb.saveProposal(newProposal);

    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 80 + 100);

    serverDb.addAuditLog({
      category: "Proposal",
      title: "Auto Pre-Design Engine Executed",
      detail: `Generated Proposal ${propId} (${systemKw} kW, ${panelCount} panels, $${netInvestment.toLocaleString()} net) for ${newProposal.customer}`,
      latencyMs,
      status: "success",
    });

    const engineeringData = {
      systemKw,
      panelCount,
      panelWattage: 400,
      annualKwh,
      roofTilt: 18,
      roofAzimuth: 180,
      usableRoofSqFt: 1450,
      grossSystemPrice,
      federalTaxCredit,
      netInvestment,
      est25YrSavings: Math.round(annualKwh * 0.22 * 25),
    };

    return { proposal: newProposal, engineeringData };
  }

  public generateProposalPdfHtml(proposalId: string): string {
    const prop = serverDb.getProposals().find((p) => p.id === proposalId) || serverDb.getProposals()[0];
    const federalCredit = Math.round((prop?.value || 25000) * 0.3);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Solar Proposal #${prop?.id}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-b: 2px solid #0284c7; padding-bottom: 20px; }
    .brand { font-size: 28px; font-weight: 900; color: #0f172a; }
    .subtitle { color: #64748b; font-size: 14px; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; }
    .metric-val { font-size: 20px; font-weight: 800; color: #0284c7; margin-top: 4px; }
    .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    th { color: #64748b; font-size: 12px; text-transform: uppercase; }
    .total-row { font-weight: 800; font-size: 16px; color: #0f172a; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">SolarPeak</div>
      <div class="subtitle">Official Pre-Design Proposal & Financial Quote</div>
    </div>
    <div style="text-align: right; font-size: 13px;">
      <strong>Prepared for: ${prop?.customer}</strong><br />
      Proposal #: ${prop?.id}<br />
      Sales Consultant: ${prop?.rep}<br />
      Date: ${new Date().toLocaleDateString()}
    </div>
  </div>

  <div class="summary-box">
    <div>
      <div class="metric-label">System Size</div>
      <div class="metric-val">${prop?.systemKw} kW</div>
    </div>
    <div>
      <div class="metric-label">Battery Storage</div>
      <div class="metric-val">${prop?.battery ? "13.5 kWh" : "Grid Only"}</div>
    </div>
    <div>
      <div class="metric-label">Net Investment</div>
      <div class="metric-val">$${prop?.value.toLocaleString()}</div>
    </div>
    <div>
      <div class="metric-label">30% Tax Credit</div>
      <div class="metric-val">$${federalCredit.toLocaleString()}</div>
    </div>
  </div>

  <h3>Equipment & Financial Investment Breakdown</h3>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${prop?.systemKw} kW Tier-1 Monocrystalline Solar Array (400W Modules)</td>
        <td style="text-align: right;">$${Math.round((prop?.systemKw || 9) * 2200).toLocaleString()}</td>
      </tr>
      ${prop?.battery ? `<tr><td>13.5 kWh Lithium-Ion Battery Backup Storage</td><td style="text-align: right;">$9,500</td></tr>` : ""}
      <tr style="color: #059669; font-weight: 600;">
        <td>Federal Clean Energy Tax Credit (30% ITC)</td>
        <td style="text-align: right;">-$${federalCredit.toLocaleString()}</td>
      </tr>
      <tr class="total-row">
        <td>Total Net System Investment</td>
        <td style="text-align: right; color: #0284c7;">$${prop?.value.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
  }
}

export const preDesignAgent = new PreDesignAgent();
