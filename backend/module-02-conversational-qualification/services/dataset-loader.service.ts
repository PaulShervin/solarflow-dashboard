import fs from "node:fs";
import path from "node:path";
import {
  PanelSpec,
  SiteConfig,
  CostReference,
  SubsidyRule,
  BatteryOption,
  ElectricityTariff,
} from "../models";

export class DatasetLoader {
  private static dataDir = path.resolve(
    process.cwd(),
    "backend",
    "module-02-conversational-qualification",
    "data"
  );

  private static panelsCache: PanelSpec[] | null = null;
  private static siteConfigCache: SiteConfig | null = null;
  private static costReferenceCache: CostReference | null = null;
  private static subsidyRulesCache: SubsidyRule[] | null = null;
  private static batteryOptionsCache: BatteryOption[] | null = null;
  private static tariffsCache: ElectricityTariff[] | null = null;

  private static parseCSV(filePath: string): Record<string, string>[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const records: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length < headers.length) continue;
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      records.push(row);
    }
    return records;
  }

  public static getPanels(): PanelSpec[] {
    if (this.panelsCache) return this.panelsCache;
    const file = path.join(this.dataDir, "panel_specs.csv");
    const rows = this.parseCSV(file);
    this.panelsCache = rows.map((r) => ({
      panel_id: r.panel_id,
      name: r.name,
      wattage_w: Number(r.wattage_w) || 400,
      length_m: Number(r.length_m) || 1.9,
      width_m: Number(r.width_m) || 1.1,
      efficiency_pct: Number(r.efficiency_pct) || 21.2,
      price_inr: Number(r.price_inr) || 14000,
    }));
    return this.panelsCache;
  }

  public static getSiteConfig(): SiteConfig {
    if (this.siteConfigCache) return this.siteConfigCache;
    const file = path.join(this.dataDir, "site_config.csv");
    const rows = this.parseCSV(file);
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.config_key, Number(r.value)));

    this.siteConfigCache = {
      avg_peak_sun_hours: map.get("avg_peak_sun_hours") ?? 5,
      usable_roof_fraction: map.get("usable_roof_fraction") ?? 0.75,
      packing_efficiency: map.get("packing_efficiency") ?? 0.85,
      performance_ratio: map.get("performance_ratio") ?? 0.78,
      assumed_evening_load_kw: map.get("assumed_evening_load_kw") ?? 1.2,
    };
    return this.siteConfigCache;
  }

  public static getCostReference(): CostReference {
    if (this.costReferenceCache) return this.costReferenceCache;
    const file = path.join(this.dataDir, "cost_reference.csv");
    const rows = this.parseCSV(file);
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.config_key, Number(r.value)));

    this.costReferenceCache = {
      cost_per_kw_low: map.get("cost_per_kw_low") ?? 55000,
      cost_per_kw_high: map.get("cost_per_kw_high") ?? 85000,
      cost_per_kw_default: map.get("cost_per_kw_default") ?? 65000,
      subsidy_cap_inr: map.get("subsidy_cap_inr") ?? 78000,
    };
    return this.costReferenceCache;
  }

  public static getSubsidyRules(): SubsidyRule[] {
    if (this.subsidyRulesCache) return this.subsidyRulesCache;
    const file = path.join(this.dataDir, "subsidy_rules.csv");
    const rows = this.parseCSV(file);
    this.subsidyRulesCache = rows.map((r) => ({
      tier_id: r.tier_id,
      min_kw: Number(r.min_kw) || 0,
      max_kw: Number(r.max_kw) || 0,
      rate_per_kw_inr: Number(r.rate_per_kw_inr) || 0,
      notes: r.notes || "",
    }));
    return this.subsidyRulesCache;
  }

  public static getBatteryOptions(): BatteryOption[] {
    if (this.batteryOptionsCache) return this.batteryOptionsCache;
    const file = path.join(this.dataDir, "battery_options.csv");
    const rows = this.parseCSV(file);
    this.batteryOptionsCache = rows.map((r) => ({
      battery_id: r.battery_id,
      name: r.name,
      chemistry: (r.chemistry as any) || "lithium_lfp",
      cost_per_kwh_inr: Number(r.cost_per_kwh_inr) || 20000,
      typical_cycle_life: Number(r.typical_cycle_life) || 3000,
      notes: r.notes || "",
    }));
    return this.batteryOptionsCache;
  }

  public static getTariffs(): ElectricityTariff[] {
    if (this.tariffsCache) return this.tariffsCache;
    const file = path.join(this.dataDir, "electricity_tariffs.csv");
    const rows = this.parseCSV(file);
    this.tariffsCache = rows.map((r) => ({
      region_id: r.region_id,
      region_name: r.region_name,
      rate_per_kwh: Number(r.rate_per_kwh) || 8.5,
      feed_in_rate_per_kwh: Number(r.feed_in_rate_per_kwh) || 3.0,
      notes: r.notes || "",
    }));
    return this.tariffsCache;
  }
}
