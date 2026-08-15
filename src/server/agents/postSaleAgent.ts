import { serverDb } from "../dbStore";
import { crmAdapter } from "../crmAdapter";
import type { PortalMilestone } from "@/data/mock";

export class PostSaleAgent {
  public async advanceMilestoneStage(stepIndex: number, detail?: string) {
    const startTime = Date.now();
    const project = serverDb.getPortalProject();
    const milestones = [...(serverDb.getAllData().portalMilestones || [])];

    if (milestones[stepIndex]) {
      milestones[stepIndex] = {
        ...milestones[stepIndex],
        status: "complete",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
    }

    if (milestones[stepIndex + 1]) {
      milestones[stepIndex + 1].status = "current";
    }

    const completedCount = milestones.filter((m) => m.status === "complete").length;
    const progress = Math.round((completedCount / milestones.length) * 100);
    const activeStep = milestones.find((m) => m.status === "current") || milestones[stepIndex];

    const updatedProject = {
      ...project,
      status: activeStep ? activeStep.title : project.status,
      statusDetail: detail || activeStep?.description || project.statusDetail,
      progress,
    };

    const newMsg = {
      id: `pm-${Date.now()}`,
      sender: "bot" as const,
      text: `MILESTONE UPDATE: Your project stage is now "${activeStep?.title}". ${detail || activeStep?.description}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      channel: "SMS" as const,
    };

    serverDb.updatePortalProject(updatedProject, milestones, newMsg);

    const latencyMs = Date.now() - startTime + Math.floor(Math.random() * 50 + 30);

    serverDb.addAuditLog({
      category: "Milestone",
      title: "Post-Sale Stage Advanced",
      detail: `Project stage advanced to #${stepIndex + 1} (${activeStep?.title}). Dispatched auto-notification text.`,
      latencyMs,
      status: "success",
    });

    return { project: updatedProject, milestones, latencyMs };
  }

  public calculateCancellationRisk(stalledDays: number, unresolvedInquiries: number = 0) {
    const riskScore = Math.min(100, stalledDays * 12 + unresolvedInquiries * 15);
    const riskLevel =
      riskScore >= 70
        ? { level: "HIGH CANCELLATION RISK", tone: "danger" as const, advice: "Customer hasn't received stage update in 7+ days. Priority rep call recommended." }
        : riskScore >= 40
          ? { level: "ELEVATED STALL RISK", tone: "warning" as const, advice: "Stage delay 4-6 days. Automated reassurance SMS dispatched." }
          : { level: "LOW RISK", tone: "success" as const, advice: "Project progressing normally within estimated timeline." };

    return { riskScore, ...riskLevel };
  }
}

export const postSaleAgent = new PostSaleAgent();
