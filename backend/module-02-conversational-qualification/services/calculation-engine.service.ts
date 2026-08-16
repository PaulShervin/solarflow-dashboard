import { DatasetLoader } from "./dataset-loader.service";
import { CalculationInput, CalculationResult } from "../models";

export class CalculationEngineService {
  public static calculate(input: CalculationInput): CalculationResult {
    // 1. Load config datasets
    const panels = DatasetLoader.getPanels();
    const siteConfig = DatasetLoader.getSiteConfig();
    const costRef = DatasetLoader.getCostReference();
    const subsidyRules = DatasetLoader.getSubsidyRules();
    const batteryOptions = DatasetLoader.getBatteryOptions();
    const tariffs = DatasetLoader.getTariffs();

    // 2. Resolve panel choice
    const panel =
      panels.find((p) => p.panel_id === input.panelId) || panels[0] || {
        panel_id: "PN01",
        name: "Standard 400W Mono",
        wattage_w: 400,
        length_m: 1.9,
        width_m: 1.1,
        efficiency_pct: 21.2,
        price_inr: 14000,
      };

    // 3. Resolve electricity tariff
    const tariff =
      tariffs.find((t) => t.region_id === input.regionId) ||
      tariffs.find((t) => t.region_id === "IN_DEF") ||
      tariffs[0] || {
        region_id: "IN_DEF",
        region_name: "National Average",
        rate_per_kwh: 8.5,
        feed_in_rate_per_kwh: 3.0,
      };

    // 4. Determine total roof area (m2)
    let totalRoofAreaM2 = 0;
    if (input.roofInputMode === "dimensions") {
      const len = input.lengthM || 10;
      const wid = input.widthM || 6;
      totalRoofAreaM2 = len * wid;
    } else {
      totalRoofAreaM2 = input.roofAreaM2 || 60;
    }

    // 5. Apply usable roof fraction & panel packing calculation
    const usableAreaM2 = totalRoofAreaM2 * siteConfig.usable_roof_fraction;
    const panelFootprintM2 = panel.length_m * panel.width_m;
    const maxPanelCount = Math.floor(
      (usableAreaM2 / panelFootprintM2) * siteConfig.packing_efficiency
    );
    const systemSizeKw = Math.round(((maxPanelCount * panel.wattage_w) / 1000) * 100) / 100;

    // 6. Energy production calculation
    const monthlyProductionKwh = Math.round(
      systemSizeKw * siteConfig.avg_peak_sun_hours * 30 * siteConfig.performance_ratio
    );

    // 7. Consumption calculation
    let monthlyConsumptionKwh = 0;
    let monthlyBillInr = input.monthlyBillInr || 4000;
    if (input.billInputMode === "units" && input.monthlyUnitsKwh) {
      monthlyConsumptionKwh = input.monthlyUnitsKwh;
      monthlyBillInr = Math.round(monthlyConsumptionKwh * tariff.rate_per_kwh);
    } else {
      monthlyConsumptionKwh = Math.round(monthlyBillInr / tariff.rate_per_kwh);
    }

    // 8. Monthly monetary savings calculation
    const selfConsumedKwh = Math.min(monthlyProductionKwh, monthlyConsumptionKwh);
    const exportedKwh = Math.max(0, monthlyProductionKwh - monthlyConsumptionKwh);

    const monthlySavingsInr = Math.round(
      selfConsumedKwh * tariff.rate_per_kwh + exportedKwh * tariff.feed_in_rate_per_kwh
    );

    // 9. Bill reduction percentage (capped at 100%)
    const reductionPct = monthlyConsumptionKwh > 0
      ? Math.min(100, Math.round((monthlyProductionKwh / monthlyConsumptionKwh) * 100))
      : 100;

    // 10. Cost tier rate resolution
    const costTier = input.costTier || "default";
    let costPerKwRate = costRef.cost_per_kw_default;
    if (costTier === "low") costPerKwRate = costRef.cost_per_kw_low;
    if (costTier === "high") costPerKwRate = costRef.cost_per_kw_high;

    const systemCostInr = Math.round(systemSizeKw * costPerKwRate);

    // 11. Tiered PM Surya Ghar subsidy calculation
    let subsidyInr = 0;
    for (const rule of subsidyRules) {
      if (systemSizeKw > rule.min_kw) {
        const kwInTier = Math.min(systemSizeKw, rule.max_kw) - rule.min_kw;
        if (kwInTier > 0) {
          subsidyInr += kwInTier * rule.rate_per_kw_inr;
        }
      }
    }
    subsidyInr = Math.min(subsidyInr, costRef.subsidy_cap_inr);
    subsidyInr = Math.round(subsidyInr);

    const netCostInr = Math.max(0, systemCostInr - subsidyInr);

    // 12. Payback period (years)
    const annualSavingsInr = monthlySavingsInr * 12;
    const paybackYears = annualSavingsInr > 0
      ? Math.round((netCostInr / annualSavingsInr) * 10) / 10
      : 0;

    // 13. Optional battery setup
    let batteryDetails: CalculationResult["batteryDetails"] | undefined = undefined;
    if (input.addBattery) {
      const selectedBattery =
        batteryOptions.find((b) => b.battery_id === input.batteryId) || batteryOptions[0];
      const capacityKwh = input.batteryCapacityKwh || 5;
      const batteryCostInr = Math.round(capacityKwh * selectedBattery.cost_per_kwh_inr);
      const estimatedBackupHours = Math.round(
        ((capacityKwh * 0.8) / siteConfig.assumed_evening_load_kw) * 10
      ) / 10;

      batteryDetails = {
        batteryCostInr,
        estimatedBackupHours,
        batteryName: `${selectedBattery.name} (${capacityKwh} kWh)`,
      };
    }

    return {
      usableAreaM2: Math.round(usableAreaM2 * 10) / 10,
      panelFootprintM2: Math.round(panelFootprintM2 * 100) / 100,
      maxPanelCount,
      systemSizeKw,
      monthlyProductionKwh,
      monthlyConsumptionKwh,
      monthlySavingsInr,
      reductionPct,
      systemCostInr,
      subsidyInr,
      netCostInr,
      paybackYears,
      batteryDetails,
      panelUsed: panel,
      tariffUsed: tariff,
      costTierUsed: costTier,
      costPerKwRate,
      calculatedAt: new Date().toISOString(),
    };
  }
}
