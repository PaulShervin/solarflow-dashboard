import { NurtureRepository } from "../repositories/nurture.repository";
import { LeadModel, WorkflowDefinitionModel, WorkflowEnrollmentModel } from "../models";
import { logger } from "../../shared/logger";

export interface StopEvaluationResult {
  shouldStop: boolean;
  reason?: string;
}

export class StopConditionEvaluator {
  static evaluate(enrollment: WorkflowEnrollmentModel, lead: LeadModel, workflow: WorkflowDefinitionModel): StopEvaluationResult {
    // 1. Opt-out / Suppression check
    if (NurtureRepository.isSuppressed(lead.phone) || NurtureRepository.isSuppressed(lead.email)) {
      return { shouldStop: true, reason: "Customer is suppressed / opted out" };
    }

    // 2. DO_NOT_CONTACT stage check
    if (lead.leadStage === "DO_NOT_CONTACT") {
      return { shouldStop: true, reason: "Lead entered DO_NOT_CONTACT stage" };
    }

    // 3. WON / LOST stage check
    if (lead.leadStage === "WON" || lead.leadStage === "LOST") {
      return { shouldStop: true, reason: `Lead marked as ${lead.leadStage}` };
    }

    // 4. Manual Pause check
    if (enrollment.state === "PAUSED") {
      return { shouldStop: true, reason: "Workflow enrollment is manually paused" };
    }

    // 5. Customer Activity / Response Check since enrollment
    const recentActivities = NurtureRepository.getRecentActivities(lead.id, 5);
    const enrollmentTime = new Date(enrollment.enrolledAt).getTime();

    for (const act of recentActivities) {
      const actTime = new Date(act.timestamp).getTime();
      if (actTime > enrollmentTime) {
        if (
          act.activityType === "INCOMING_SMS" ||
          act.activityType === "INCOMING_EMAIL" ||
          act.activityType === "WEBSITE_CHAT"
        ) {
          return { shouldStop: true, reason: `Customer responded via ${act.activityType}` };
        }
        if (act.activityType === "APPOINTMENT_BOOKED" && workflow.triggerEvent !== "APPOINTMENT_BOOKED") {
          return { shouldStop: true, reason: "Customer booked an appointment" };
        }
      }
    }

    // 6. Workflow-specific stop conditions
    for (const condition of workflow.stopConditions || []) {
      if (condition === "CUSTOMER_REPLIED") {
        const hasReply = recentActivities.some((a) => a.activityType === "INCOMING_SMS" || a.activityType === "INCOMING_EMAIL");
        if (hasReply) return { shouldStop: true, reason: "Condition matched: CUSTOMER_REPLIED" };
      }
      if (condition === "APPOINTMENT_BOOKED" && lead.leadStage === "APPOINTMENT_BOOKED" && workflow.triggerEvent !== "APPOINTMENT_BOOKED") {
        return { shouldStop: true, reason: "Condition matched: APPOINTMENT_BOOKED" };
      }
      if (condition === "STAGE_CHANGE" && workflow.triggerEvent === "PROPOSAL_SENT" && lead.leadStage !== "PROPOSAL_SENT") {
        return { shouldStop: true, reason: `Stage changed from PROPOSAL_SENT to ${lead.leadStage}` };
      }
    }

    return { shouldStop: false };
  }
}
