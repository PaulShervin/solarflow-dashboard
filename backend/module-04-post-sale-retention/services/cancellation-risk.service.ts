import crypto from "crypto";
import { postSaleRepository, PostSaleRepository } from "../repositories/post-sale.repository";
import { projectService, ProjectService } from "./project.service";
import { CancellationRisk, RiskLevel } from "../models";

export class CancellationRiskService {
  constructor(
    private repository: PostSaleRepository = postSaleRepository,
    private pService: ProjectService = projectService
  ) {}

  /**
   * Calculates the numerical risk score based on stalled days and open customer inquiries.
   * Formula: score = min(100, stalledDays * 12 + unresolvedInquiries * 15)
   */
  calculateRiskScore(stalledDays: number, unresolvedInquiries: number): number {
    const raw = stalledDays * 12 + unresolvedInquiries * 15;
    return Math.min(100, Math.max(0, raw));
  }

  /**
   * Classifies a numerical risk score into LOW, MEDIUM, or HIGH risk tiers.
   */
  determineRiskLevel(score: number): RiskLevel {
    if (score < 40) return RiskLevel.LOW;
    if (score < 70) return RiskLevel.MEDIUM;
    return RiskLevel.HIGH;
  }

  /**
   * Evaluates project cancellation risk, logs historical evaluation, and escalates HIGH risks.
   */
  evaluateRisk(params: {
    projectId: string;
    stalledDays?: number | undefined;
    unresolvedInquiries?: number | undefined;
    reason?: string | undefined;
  }): CancellationRisk {
    const project = this.pService.getProject(params.projectId);
    if (!project) {
      throw new Error(`Project not found: ${params.projectId}`);
    }

    const stalledDays = params.stalledDays ?? 0;
    const unresolvedInquiries = params.unresolvedInquiries ?? 0;
    const score = this.calculateRiskScore(stalledDays, unresolvedInquiries);
    const riskLevel = this.determineRiskLevel(score);

    const now = new Date().toISOString();
    const reasonText =
      params.reason ||
      `Risk evaluated at score ${score} (${stalledDays} stalled days, ${unresolvedInquiries} open inquiries).`;

    const risk: CancellationRisk = {
      id: `RISK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      projectId: params.projectId,
      score,
      riskLevel,
      stalledDays,
      unresolvedInquiries,
      reason: reasonText,
      evaluatedAt: now,
    };

    // Save risk record
    this.repository.createRiskEvaluation(risk);

    // If HIGH risk, log escalation alert update for operations team
    if (riskLevel === RiskLevel.HIGH) {
      this.repository.createProjectUpdate({
        id: `UPD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        projectId: params.projectId,
        message: `⚠️ HIGH CANCELLATION RISK DETECTED: Project stalled for ${stalledDays} days with ${unresolvedInquiries} unresolved inquiries. Immediate rep intervention required.`,
        visibleToCustomer: false,
        createdBy: "SYSTEM_RISK_ENGINE",
        createdAt: now,
      });
    }

    return risk;
  }

  /**
   * Retrieves the most recent risk evaluation for a project.
   */
  getLatestRisk(projectId: string): CancellationRisk | null {
    return this.repository.getLatestRisk(projectId);
  }

  /**
   * Retrieves complete historical risk evaluation log for a project.
   */
  getRiskHistory(projectId: string): CancellationRisk[] {
    return this.repository.getRiskHistory(projectId);
  }
}

export const cancellationRiskService = new CancellationRiskService();
