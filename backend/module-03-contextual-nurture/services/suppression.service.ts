import { NurtureRepository } from "../repositories/nurture.repository";
import { eventBus } from "../events/event-bus";
import { logger } from "../../shared/logger";
import { v4 as uuidv4 } from "uuid";

export const OPT_OUT_KEYWORDS = ["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];

export class SuppressionService {
  static isOptOutKeyword(text: string): boolean {
    const trimmed = text.trim().toUpperCase();
    return OPT_OUT_KEYWORDS.includes(trimmed);
  }

  static async handleOptOut(identifier: string, leadId?: string, reason = "Customer requested opt-out"): Promise<void> {
    logger.info(`Processing opt-out suppression for identifier [${identifier}]`, { leadId, reason });

    const now = new Date().toISOString();

    // 1. Record suppression
    NurtureRepository.addSuppression({
      id: `SUP-${uuidv4().substring(0, 8)}`,
      leadId,
      identifier,
      reason,
      createdAt: now,
    });

    // 2. If leadId provided, stop active workflow enrollments & update lead stage if necessary
    if (leadId) {
      const activeEnrollments = NurtureRepository.getActiveEnrollmentsForLead(leadId);
      for (const enrollment of activeEnrollments) {
        enrollment.state = "CANCELLED";
        enrollment.reasonForStopping = `Opt-Out Suppression: ${reason}`;
        enrollment.lastActionAt = now;
        NurtureRepository.saveEnrollment(enrollment);
      }

      NurtureRepository.updateLeadStage(leadId, "DO_NOT_CONTACT");

      // 3. Emit event
      await eventBus.publish({
        id: uuidv4(),
        type: "CUSTOMER_OPTED_OUT",
        timestamp: now,
        leadId,
        source: "SuppressionService",
        data: { identifier, reason },
      });
    }

    // 4. Audit Log
    NurtureRepository.logAuditEvent({
      id: `AUD-${uuidv4().substring(0, 8)}`,
      eventType: "CUSTOMER_OPTED_OUT",
      leadId: leadId || "UNKNOWN",
      timestamp: now,
      actor: "SYSTEM_SUPPRESSION",
      context: { identifier, reason },
    });
  }

  static checkSuppressed(phoneOrEmail: string): boolean {
    return NurtureRepository.isSuppressed(phoneOrEmail);
  }
}
