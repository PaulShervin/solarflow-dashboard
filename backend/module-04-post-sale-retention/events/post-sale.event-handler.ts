import crypto from "crypto";
import { DomainEvent, EventType } from "../../shared/contracts/events";
import { projectService } from "../services/project.service";
import {
  SolarProject,
  MilestoneType,
  RiskLevel,
} from "../models";

type EventHandler<T = Record<string, unknown>> = (event: DomainEvent<T>) => Promise<void> | void;

export class PostSaleEventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();

  subscribe<T = Record<string, unknown>>(eventType: EventType, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);
  }

  async publish<T = Record<string, unknown>>(event: DomainEvent<T>): Promise<void> {
    const subscribers = this.handlers.get(event.type) || [];
    for (const handler of subscribers) {
      try {
        await handler(event as DomainEvent);
      } catch (err) {
        console.error(`[PostSaleEventBus] Error handling event ${event.type}:`, err);
      }
    }
  }
}

export const postSaleEventBus = new PostSaleEventBus();

/**
 * Handles incoming SALE_COMPLETED domain events by initializing a new solar project.
 */
export async function handleSaleCompletedEvent(event: DomainEvent): Promise<SolarProject> {
  const leadId = event.leadId;
  const project = projectService.createProject({ leadId });

  // Publish PROJECT_CREATED event
  await postSaleEventBus.publish({
    id: `EVT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    type: "PROJECT_CREATED",
    timestamp: new Date().toISOString(),
    leadId,
    source: "MODULE_04_POST_SALE",
    data: { projectId: project.id, currentMilestone: project.currentMilestone },
  });

  return project;
}

/**
 * Helper event publishers for Module 04 Lifecycle Events
 */
export const postSaleEventPublisher = {
  async publishProjectCreated(project: SolarProject): Promise<void> {
    await postSaleEventBus.publish({
      id: `EVT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      type: "PROJECT_CREATED",
      timestamp: new Date().toISOString(),
      leadId: project.leadId,
      source: "MODULE_04_POST_SALE",
      data: { projectId: project.id, currentMilestone: project.currentMilestone },
    });
  },

  async publishMilestoneStarted(projectId: string, leadId: string, milestoneType: MilestoneType): Promise<void> {
    await postSaleEventBus.publish({
      id: `EVT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      type: "PROJECT_MILESTONE_STARTED",
      timestamp: new Date().toISOString(),
      leadId,
      source: "MODULE_04_POST_SALE",
      data: { projectId, milestoneType },
    });
  },

  async publishMilestoneCompleted(projectId: string, leadId: string, milestoneType: MilestoneType): Promise<void> {
    await postSaleEventBus.publish({
      id: `EVT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      type: "PROJECT_MILESTONE_COMPLETED",
      timestamp: new Date().toISOString(),
      leadId,
      source: "MODULE_04_POST_SALE",
      data: { projectId, milestoneType },
    });
  },

  async publishRiskUpdated(projectId: string, leadId: string, score: number, riskLevel: RiskLevel): Promise<void> {
    await postSaleEventBus.publish({
      id: `EVT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      type: "PROJECT_RISK_UPDATED",
      timestamp: new Date().toISOString(),
      leadId,
      source: "MODULE_04_POST_SALE",
      data: { projectId, score, riskLevel },
    });

    if (riskLevel === RiskLevel.HIGH) {
      await postSaleEventBus.publish({
        id: `EVT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        type: "PROJECT_RISK_ESCALATED",
        timestamp: new Date().toISOString(),
        leadId,
        source: "MODULE_04_POST_SALE",
        data: { projectId, score, riskLevel },
      });
    }
  },

  async publishProjectCompleted(projectId: string, leadId: string): Promise<void> {
    await postSaleEventBus.publish({
      id: `EVT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      type: "PROJECT_COMPLETED",
      timestamp: new Date().toISOString(),
      leadId,
      source: "MODULE_04_POST_SALE",
      data: { projectId },
    });
  },

  async publishReferralTriggered(projectId: string, leadId: string): Promise<void> {
    await postSaleEventBus.publish({
      id: `EVT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      type: "REFERRAL_TRIGGERED",
      timestamp: new Date().toISOString(),
      leadId,
      source: "MODULE_04_POST_SALE",
      data: { projectId },
    });
  },
};

// Auto-subscribe handleSaleCompletedEvent to SALE_COMPLETED domain events
postSaleEventBus.subscribe("SALE_COMPLETED", handleSaleCompletedEvent);
