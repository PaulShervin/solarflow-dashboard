export type QualificationStep =
  | "HOMEOWNER"
  | "BILL"
  | "ROOF_TYPE"
  | "ROOF_AREA"
  | "TIMELINE"
  | "COMPLETED";

export interface QualificationData {
  isHomeowner?: boolean;
  monthlyBill?: number;
  roofType?: string;
  roofAreaSqFt?: number;
  timeline?: string;
  address?: string;
}

export interface CalculationEstimate {
  systemSizeKw: number;
  panelModel: string;
  panelCount: number;
  annualProductionKwh: number;
  grossCost: number;
  federalTaxCredit: number;
  netCost: number;
  monthlySavings: number;
  paybackYears: number;
  proposalPdfUrl: string;
  batteryOption?: string;
  batteryCost?: number;
}

export interface GroundingContext {
  matchedPanels?: any[];
  matchedBatteries?: any[];
  matchedFaqs?: any[];
  matchedPricing?: any;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: "user" | "bot" | "rep" | "system";
  text: string;
  timestamp: string;
  quickReplies?: string[];
  cardType?: "estimate" | "map_prompt" | "escalation" | "product_spec" | "options";
  cardData?: any;
  intent?: string;
  grounding?: GroundingContext;
}

export interface ChatSession {
  id: string;
  leadId?: string;
  status: "ACTIVE" | "QUALIFIED" | "ESCALATED" | "COMPLETED";
  currentStep: QualificationStep;
  qualification: QualificationData;
  estimate?: CalculationEstimate;
  messages: ChatMessage[];
  assignedRep?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCatalogItem {
  id: string;
  brand: string;
  model: string;
  wattage: number;
  efficiency: number;
  pricePerPanel: number;
  warrantyYears: number;
  bestFor: string;
}

export interface BatteryCatalogItem {
  id: string;
  brand: string;
  model: string;
  capacityKwh: number;
  installedCost: number;
  warrantyYears: number;
  backupCapability: string;
}

export interface FaqItem {
  topic: string;
  keywords: string[];
  answer: string;
}
