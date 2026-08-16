export interface PanelSpec {
  panel_id: string;
  name: string;
  wattage_w: number;
  length_m: number;
  width_m: number;
  efficiency_pct: number;
  price_inr: number;
}

export interface SiteConfig {
  avg_peak_sun_hours: number;
  usable_roof_fraction: number;
  packing_efficiency: number;
  performance_ratio: number;
  assumed_evening_load_kw: number;
}

export interface CostReference {
  cost_per_kw_low: number;
  cost_per_kw_high: number;
  cost_per_kw_default: number;
  subsidy_cap_inr: number;
}

export interface SubsidyRule {
  tier_id: string;
  min_kw: number;
  max_kw: number;
  rate_per_kw_inr: number;
  notes: string;
}

export interface BatteryOption {
  battery_id: string;
  name: string;
  chemistry: 'lead_acid' | 'lithium_lfp';
  cost_per_kwh_inr: number;
  typical_cycle_life: number;
  notes: string;
}

export interface ElectricityTariff {
  region_id: string;
  region_name: string;
  rate_per_kwh: number;
  feed_in_rate_per_kwh: number;
  notes?: string;
}

export type CostTier = 'low' | 'default' | 'high';
export type RoofInputMode = 'dimensions' | 'area';
export type BillInputMode = 'bill' | 'units';

export interface CalculationInput {
  roofInputMode: RoofInputMode;
  lengthM?: number;
  widthM?: number;
  roofAreaM2?: number;
  billInputMode: BillInputMode;
  monthlyBillInr?: number;
  monthlyUnitsKwh?: number;
  regionId: string;
  panelId?: string;
  costTier?: CostTier;
  addBattery?: boolean;
  batteryId?: string;
  batteryCapacityKwh?: number;
}

export interface CalculationResult {
  usableAreaM2: number;
  panelFootprintM2: number;
  maxPanelCount: number;
  systemSizeKw: number;
  monthlyProductionKwh: number;
  monthlyConsumptionKwh: number;
  monthlySavingsInr: number;
  reductionPct: number;
  systemCostInr: number;
  subsidyInr: number;
  netCostInr: number;
  paybackYears: number;
  batteryDetails?: {
    batteryCostInr: number;
    estimatedBackupHours: number;
    batteryName: string;
  };
  panelUsed: PanelSpec;
  tariffUsed: ElectricityTariff;
  costTierUsed: CostTier;
  costPerKwRate: number;
  calculatedAt: string;
}

export interface RooftopPolygonRecord {
  id: string;
  address?: string;
  lat?: number;
  lng?: number;
  polygonVertices: Array<{ lat: number; lng: number }>;
  computedAreaM2: number;
  createdAt: string;
}
