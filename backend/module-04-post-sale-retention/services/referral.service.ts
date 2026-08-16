import crypto from "crypto";
import { postSaleRepository, PostSaleRepository } from "../repositories/post-sale.repository";
import { postSaleEventPublisher } from "../events/post-sale.event-handler";
import { ReferralEvent, ReferralStatus } from "../models";

export class ReferralService {
  constructor(private repository: PostSaleRepository = postSaleRepository) {}

  /**
   * Triggers a post-installation referral event when PTO / project is completed.
   */
  async triggerReferral(projectId: string, leadId: string): Promise<ReferralEvent> {
    const existing = this.repository.getReferral(projectId);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const referral: ReferralEvent = {
      id: `REF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      projectId,
      leadId,
      status: "TRIGGERED",
      createdAt: now,
      completedAt: null,
    };

    // Save referral record in database
    this.repository.createReferral(referral);

    // Create customer portal update offering referral invitation
    this.repository.createProjectUpdate({
      id: `UPD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      projectId,
      message: "🎉 System Activated! You are now enrolled in the SolarPeak Customer Referral Program. Refer a neighbor to earn a $500 cash bonus!",
      visibleToCustomer: true,
      createdBy: "SYSTEM_REFERRAL_ENGINE",
      createdAt: now,
    });

    // Publish REFERRAL_TRIGGERED domain event
    await postSaleEventPublisher.publishReferralTriggered(projectId, leadId);

    return referral;
  }

  /**
   * Retrieves referral event details for a project.
   */
  getReferral(projectId: string): ReferralEvent | null {
    return this.repository.getReferral(projectId);
  }

  /**
   * Updates referral event status (TRIGGERED -> CONTACTED -> COMPLETED).
   */
  updateReferralStatus(projectId: string, status: ReferralStatus): ReferralEvent {
    const referral = this.getReferral(projectId);
    if (!referral) {
      throw new Error(`Referral record not found for project: ${projectId}`);
    }

    const now = new Date().toISOString();
    const isCompleted = status === "COMPLETED";

    this.repository.updateReferralStatus(referral.id, status, isCompleted ? now : undefined);

    return {
      ...referral,
      status,
      completedAt: isCompleted ? now : referral.completedAt,
    };
  }
}

export const referralService = new ReferralService();
