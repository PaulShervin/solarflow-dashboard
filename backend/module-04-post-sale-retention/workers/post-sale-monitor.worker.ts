import { projectService } from "../services/project.service";
import { milestoneService } from "../services/milestone.service";
import { cancellationRiskService } from "../services/cancellation-risk.service";
import { postSaleRepository } from "../repositories/post-sale.repository";
import { ProjectStatus, RiskLevel } from "../models";

export interface MonitorCycleResult {
  processedCount: number;
  highRiskCount: number;
  escalatedProjects: string[];
  timestamp: string;
}

/**
 * Background worker task that scans all active post-sale solar projects,
 * detects stalled milestones, recalculates cancellation risk, records historical evaluations,
 * and triggers escalations for high-risk projects.
 */
export async function runPostSaleMonitorCycle(): Promise<MonitorCycleResult> {
  const activeProjects = projectService.getProjects({ status: ProjectStatus.ACTIVE });
  let highRiskCount = 0;
  const escalatedProjects: string[] = [];
  const now = new Date();

  for (const project of activeProjects) {
    const milestones = milestoneService.getMilestones(project.id);
    const currentMilestone = milestones.find((m) => m.milestoneType === project.currentMilestone);

    let stalledDays = 0;
    if (currentMilestone && currentMilestone.startedAt) {
      const started = new Date(currentMilestone.startedAt);
      const diffMs = now.getTime() - started.getTime();
      stalledDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Count open customer inquiry signals from update logs
    const updates = postSaleRepository.getProjectUpdates(project.id, false);
    const unresolvedInquiries = updates.filter(
      (u) =>
        u.message.toLowerCase().includes("issue") ||
        u.message.toLowerCase().includes("delay") ||
        u.message.toLowerCase().includes("inquiry")
    ).length;

    const risk = cancellationRiskService.evaluateRisk({
      projectId: project.id,
      stalledDays,
      unresolvedInquiries,
      reason: `Automated worker monitoring evaluation: ${stalledDays} stalled days, ${unresolvedInquiries} issue signals detected.`,
    });

    if (risk.riskLevel === RiskLevel.HIGH) {
      highRiskCount++;
      escalatedProjects.push(project.id);
    }
  }

  return {
    processedCount: activeProjects.length,
    highRiskCount,
    escalatedProjects,
    timestamp: now.toISOString(),
  };
}

/**
 * Worker class with interval management for background execution.
 */
export class PostSaleMonitorWorker {
  private timer: NodeJS.Timeout | null = null;

  start(intervalMs: number = 24 * 60 * 60 * 1000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      runPostSaleMonitorCycle().catch((err) => {
        console.error("[PostSaleMonitorWorker] Error during monitoring cycle:", err);
      });
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const postSaleMonitorWorker = new PostSaleMonitorWorker();
