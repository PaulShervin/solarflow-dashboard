import { z } from "zod";

export const CalculationInputSchema = z.object({
  roofInputMode: z.enum(["dimensions", "area"]).default("dimensions"),
  lengthM: z.number().positive().optional(),
  widthM: z.number().positive().optional(),
  roofAreaM2: z.number().positive().optional(),
  billInputMode: z.enum(["bill", "units"]).default("bill"),
  monthlyBillInr: z.number().nonnegative().optional(),
  monthlyUnitsKwh: z.number().nonnegative().optional(),
  regionId: z.string().default("IN_DEF"),
  panelId: z.string().optional(),
  costTier: z.enum(["low", "default", "high"]).default("default"),
  addBattery: z.boolean().default(false),
  batteryId: z.string().optional(),
  batteryCapacityKwh: z.number().positive().optional(),
});

export const RooftopPolygonSchema = z.object({
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  polygonVertices: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
  })).min(3, "At least 3 vertices required to form a polygon"),
  computedAreaM2: z.number().positive("Computed area must be greater than zero"),
});

export const ProposalPdfSchema = z.object({
  customerName: z.string().default("Valued Solar Customer"),
  leadId: z.string().optional(),
  address: z.string().default("Site Location, India"),
  calculationInput: CalculationInputSchema,
});
