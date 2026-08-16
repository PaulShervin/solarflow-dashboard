import { CalculationResult } from "../models";

export class ProposalGeneratorService {
  public static generateProposalHtml(
    customerName: string,
    address: string,
    result: CalculationResult
  ): string {
    const formatInr = (amount: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Solar Pre-Design Proposal - ${customerName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 40px; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #0f172a; margin: 0; font-size: 24px; }
    .header .subtitle { color: #64748b; font-size: 14px; margin-top: 4px; }
    .badge { background-color: #e0f2fe; color: #0369a1; font-weight: 600; padding: 6px 12px; border-radius: 20px; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .card { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .card h3 { margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px; }
    .metric-value { font-size: 28px; font-weight: 700; color: #0284c7; }
    .metric-label { font-size: 13px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    th { background: #f1f5f9; color: #475569; font-weight: 600; }
    .battery-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-top: 25px; }
    .battery-box h3 { color: #166534; margin-top: 0; margin-bottom: 8px; }
    .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Solar Pre-Design Proposal</h1>
        <div class="subtitle">Prepared for <strong>${customerName}</strong> | ${address}</div>
      </div>
      <div class="badge">PM Surya Ghar Eligible</div>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Recommended System Size</h3>
        <div class="metric-value">${result.systemSizeKw} kW</div>
        <div class="metric-label">${result.maxPanelCount} × ${result.panelUsed.wattage_w}W ${result.panelUsed.name}</div>
      </div>
      <div class="card">
        <h3>Estimated Monthly Production</h3>
        <div class="metric-value">${result.monthlyProductionKwh} kWh</div>
        <div class="metric-label">~${Math.round(result.monthlyProductionKwh / 30)} units/day (${result.tariffUsed.region_name})</div>
      </div>
    </div>

    <h3>Financial & Investment Breakdown</h3>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Estimated Turnkey System Cost (${result.systemSizeKw} kW @ ${formatInr(result.costPerKwRate)}/kW)</td>
          <td><strong>${formatInr(result.systemCostInr)}</strong></td>
        </tr>
        <tr style="color: #16a34a;">
          <td>Estimated PM Surya Ghar Subsidy (Government Direct Benefit)</td>
          <td><strong>- ${formatInr(result.subsidyInr)}</strong></td>
        </tr>
        <tr style="background: #f8fafc; font-weight: bold;">
          <td>Net Investment Cost (After Subsidy)</td>
          <td><span style="color: #0284c7; font-size: 18px;">${formatInr(result.netCostInr)}</span></td>
        </tr>
      </tbody>
    </table>

    <div class="grid" style="margin-top: 25px;">
      <div class="card">
        <h3>Estimated Monthly Savings</h3>
        <div class="metric-value" style="color: #16a34a;">${formatInr(result.monthlySavingsInr)}/mo</div>
        <div class="metric-label">${result.reductionPct}% reduction on current bill</div>
      </div>
      <div class="card">
        <h3>Payback Period</h3>
        <div class="metric-value" style="color: #0f172a;">${result.paybackYears} Years</div>
        <div class="metric-label">Return on Investment (ROI)</div>
      </div>
    </div>

    ${
      result.batteryDetails
        ? `
    <div class="battery-box">
      <h3>Optional Outage Resilience Backup</h3>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Battery Option:</strong> ${result.batteryDetails.batteryName}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Estimated Cost:</strong> ${formatInr(result.batteryDetails.batteryCostInr)} <em>(Note: Batteries are non-subsidized)</em></p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Outage Protection:</strong> Provides ~${result.batteryDetails.estimatedBackupHours} hours of continuous backup for essential evening loads.</p>
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>This pre-design proposal is generated dynamically based on user-provided inputs and current 2026 published solar tariff & subsidy guidelines. Final system design requires a physical rooftop structural & shadow site assessment.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
