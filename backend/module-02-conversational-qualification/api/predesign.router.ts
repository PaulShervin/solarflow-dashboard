import { Router, Request, Response } from "express";
import { DatasetLoader } from "../services/dataset-loader.service";
import { CalculationEngineService } from "../services/calculation-engine.service";
import { ProposalGeneratorService } from "../services/proposal-generator.service";
import { PreDesignRepository } from "../repositories/predesign.repository";
import {
  CalculationInputSchema,
  RooftopPolygonSchema,
  ProposalPdfSchema,
} from "../schemas/predesign.schema";

export function createPreDesignExpressRouter(): Router {
  const router = Router();

  // 1. GET /api/pre-design/config - Fetch datasets for UI dropdowns
  router.get("/config", (req: Request, res: Response) => {
    try {
      const panels = DatasetLoader.getPanels();
      const siteConfig = DatasetLoader.getSiteConfig();
      const costRef = DatasetLoader.getCostReference();
      const subsidyRules = DatasetLoader.getSubsidyRules();
      const batteryOptions = DatasetLoader.getBatteryOptions();
      const tariffs = DatasetLoader.getTariffs();

      res.json({
        panels,
        siteConfig,
        costReference: costRef,
        subsidyRules,
        batteryOptions,
        tariffs,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load pre-design configuration" });
    }
  });

  // 2. POST /api/pre-design/calculate - Run Auto Pre-Design Calculation Engine
  router.post("/calculate", (req: Request, res: Response) => {
    const parsed = CalculationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    try {
      const result = CalculationEngineService.calculate(parsed.data);
      const savedRecord = PreDesignRepository.saveCalculation(result);

      res.json({
        success: true,
        calculationId: savedRecord.id,
        result,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Calculation failed" });
    }
  });

  // 3. POST /api/pre-design/rooftop-polygon - Store user-traced polygon & computed area
  router.post("/rooftop-polygon", (req: Request, res: Response) => {
    const parsed = RooftopPolygonSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    try {
      const saved = PreDesignRepository.savePolygon(parsed.data);
      res.json({
        success: true,
        polygonRecord: saved,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to store polygon record" });
    }
  });

  // 4. POST /api/pre-design/proposal - Generate downloadable proposal report
  router.post("/proposal", (req: Request, res: Response) => {
    const parsed = ProposalPdfSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    try {
      const { customerName, address, calculationInput } = parsed.data;
      const result = CalculationEngineService.calculate(calculationInput);
      const htmlContent = ProposalGeneratorService.generateProposalHtml(customerName, address, result);

      if (req.query.download === "true" || req.body.download === true) {
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Content-Disposition", `attachment; filename="Solar_Proposal_${customerName.replace(/\s+/g, "_")}.html"`);
        return res.send(htmlContent);
      }

      res.json({
        success: true,
        htmlContent,
        result,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate proposal" });
    }
  });

  // 5. POST /api/property/confirm - Store normalized property geometry & metadata
  router.post("/confirm", (req: Request, res: Response) => {
    try {
      const { PropertyRepository } = require("../repositories/property.repository");
      const record = PropertyRepository.saveConfirmedProperty(req.body);
      res.json({ success: true, property: record });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to confirm property record" });
    }
  });

  return router;
}
