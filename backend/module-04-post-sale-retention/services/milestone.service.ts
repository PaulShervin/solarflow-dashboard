import crypto from "crypto";
import { postSaleRepository, PostSaleRepository } from "../repositories/post-sale.repository";
import { projectService, ProjectService } from "./project.service";
import {
  MilestoneType,
  MilestoneStatus,
  ProjectMilestone,
  ProjectUpdate,
  ProjectNotification,
  ProjectStatus,
} from "../models";

// Ordered sequence of post-sale solar milestones
export const MILESTONE_SEQUENCE: MilestoneType[] = [
  MilestoneType.SITE_SURVEY,
  MilestoneType.ENGINEERING,
  MilestoneType.PERMITTING,
  MilestoneType.INSTALLATION,
  MilestoneType.INSPECTION,
  MilestoneType.PTO,
];

// Human-friendly customer portal messages for milestone completions
const DEFAULT_MILESTONE_COMPLETION_MESSAGES: Record<MilestoneType, string> = {
  [MilestoneType.SITE_SURVEY]:
    "Site survey completed successfully. Our engineering team is now working on your custom solar system design.",
  [MilestoneType.ENGINEERING]:
    "Engineering design finalized and approved. We are now preparing permit applications with your local authority.",
  [MilestoneType.PERMITTING]:
    "Permits approved by your local jurisdiction. Your solar panel installation is ready to be scheduled.",
  [MilestoneType.INSTALLATION]:
    "Solar panel installation has been completed! Next step is scheduling the final municipal inspection.",
  [MilestoneType.INSPECTION]:
    "Municipal inspection passed! Final interconnection paperwork submitted to your utility company.",
  [MilestoneType.PTO]:
    "Permission to Operate (PTO) granted by your utility company! Your solar energy system is officially powered on.",
};

export class MilestoneService {
  constructor(
    private repository: PostSaleRepository = postSaleRepository,
    private pService: ProjectService = projectService
  ) {}

  /**
   * Retrieves all milestones for a project in order.
   */
  getMilestones(projectId: string): ProjectMilestone[] {
    return this.repository.getMilestones(projectId);
  }

  /**
   * Retrieves a specific milestone for a project.
   */
  getMilestone(projectId: string, milestoneType: MilestoneType): ProjectMilestone | null {
    return this.repository.getMilestone(projectId, milestoneType);
  }

  /**
   * Validates if a transition to/from a milestone is permitted by the state machine sequence.
   */
  private validateTransition(milestones: ProjectMilestone[], targetType: MilestoneType): { target: ProjectMilestone; index: number } {
    const index = MILESTONE_SEQUENCE.indexOf(targetType);
    if (index === -1) {
      throw new Error(`Invalid milestone type: ${targetType}`);
    }

    const milestoneMap = new Map(milestones.map((m) => [m.milestoneType, m]));
    const target = milestoneMap.get(targetType);

    if (!target) {
      throw new Error(`Milestone ${targetType} not found for project.`);
    }

    // Check preceding milestones in sequence
    for (let i = 0; i < index; i++) {
      const precType = MILESTONE_SEQUENCE[i];
      if (!precType) continue;
      const precMilestone = milestoneMap.get(precType);
      if (!precMilestone || precMilestone.status !== MilestoneStatus.COMPLETED) {
        throw new Error(
          `Cannot transition to ${targetType}. Preceding milestone ${precType} is not completed (current status: ${precMilestone?.status || "UNKNOWN"}).`
        );
      }
    }

    return { target, index };
  }

  /**
   * Starts a milestone phase. Validates sequence order before marking IN_PROGRESS.
   */
  startMilestone(
    projectId: string,
    milestoneType: MilestoneType,
    options?: { notes?: string | undefined; updatedBy?: string | undefined }
  ): ProjectMilestone {
    const project = this.pService.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    if (project.status === ProjectStatus.CANCELLED) {
      throw new Error(`Cannot start milestone on a cancelled project.`);
    }

    const milestones = this.getMilestones(projectId);
    const { target } = this.validateTransition(milestones, milestoneType);

    if (target.status === MilestoneStatus.COMPLETED) {
      throw new Error(`Milestone ${milestoneType} is already completed.`);
    }

    const now = new Date().toISOString();
    this.repository.updateMilestone(target.id, {
      status: MilestoneStatus.IN_PROGRESS,
      startedAt: target.startedAt || now,
      notes: options?.notes,
      updatedBy: options?.updatedBy || "ADMIN",
    });

    this.repository.updateProjectCurrentMilestone(projectId, milestoneType);

    return {
      ...target,
      status: MilestoneStatus.IN_PROGRESS,
      startedAt: target.startedAt || now,
      notes: options?.notes || target.notes,
      updatedBy: options?.updatedBy || "ADMIN",
      updatedAt: now,
    };
  }

  /**
   * Completes a milestone phase.
   * Auto-generates a customer ProjectUpdate and ProjectNotification.
   * Advances current_milestone to the next stage (or completes project if PTO).
   */
  completeMilestone(
    projectId: string,
    milestoneType: MilestoneType,
    options?: {
      notes?: string | undefined;
      updatedBy?: string | undefined;
      createCustomerUpdate?: boolean | undefined;
      customMessage?: string | undefined;
    }
  ): ProjectMilestone {
    const project = this.pService.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    if (project.status === ProjectStatus.CANCELLED) {
      throw new Error(`Cannot complete milestone on a cancelled project.`);
    }

    const milestones = this.getMilestones(projectId);
    const { target, index } = this.validateTransition(milestones, milestoneType);

    if (target.status === MilestoneStatus.COMPLETED) {
      throw new Error(`Milestone ${milestoneType} is already completed.`);
    }

    const now = new Date().toISOString();

    // Mark current milestone completed
    this.repository.updateMilestone(target.id, {
      status: MilestoneStatus.COMPLETED,
      startedAt: target.startedAt || now,
      completedAt: now,
      notes: options?.notes,
      updatedBy: options?.updatedBy || "ADMIN",
    });

    // Auto-create Customer Project Update (default: true)
    const shouldUpdate = options?.createCustomerUpdate !== false;
    const messageText = options?.customMessage || DEFAULT_MILESTONE_COMPLETION_MESSAGES[milestoneType];

    if (shouldUpdate) {
      const updateRecord: ProjectUpdate = {
        id: `UPD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        projectId,
        milestoneId: target.id,
        message: messageText,
        visibleToCustomer: true,
        createdBy: options?.updatedBy || "ADMIN",
        createdAt: now,
      };
      this.repository.createProjectUpdate(updateRecord);

      // Auto-create Portal Customer Notification Record
      const notificationRecord: ProjectNotification = {
        id: `NOTIF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        projectId,
        milestoneId: target.id,
        channel: "PORTAL",
        message: messageText,
        status: "CREATED",
        createdAt: now,
        sentAt: null,
      };
      this.repository.createNotification(notificationRecord);
    }

    // Determine next milestone or complete project if PTO
    const nextIndex = index + 1;
    if (nextIndex < MILESTONE_SEQUENCE.length) {
      const nextType = MILESTONE_SEQUENCE[nextIndex];
      if (nextType) {
        const nextMilestone = milestones.find((m) => m.milestoneType === nextType);

      if (nextMilestone && nextMilestone.status === MilestoneStatus.PENDING) {
        this.repository.updateMilestone(nextMilestone.id, {
          status: MilestoneStatus.IN_PROGRESS,
          startedAt: now,
          updatedBy: "SYSTEM",
        });
      }

      this.repository.updateProjectCurrentMilestone(projectId, nextType);
      }
    } else if (milestoneType === MilestoneType.PTO) {
      // PTO completed -> Entire Project Completed
      this.pService.completeProject(projectId);
    }

    return {
      ...target,
      status: MilestoneStatus.COMPLETED,
      startedAt: target.startedAt || now,
      completedAt: now,
      notes: options?.notes || target.notes,
      updatedBy: options?.updatedBy || "ADMIN",
      updatedAt: now,
    };
  }
}

export const milestoneService = new MilestoneService();
