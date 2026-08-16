import crypto from "crypto";
import { postSaleRepository, PostSaleRepository } from "../repositories/post-sale.repository";
import {
  SolarProject,
  ProjectStatus,
  MilestoneType,
  MilestoneStatus,
} from "../models";

export class ProjectService {
  constructor(private repository: PostSaleRepository = postSaleRepository) {}

  /**
   * Creates a new post-sale solar project when a sale is completed.
   * Auto-initializes the 6 lifecycle milestones and posts an initial customer update.
   */
  createProject(params: { leadId: string; estimatedCompletionDate?: string | undefined }): SolarProject {
    // Prevent duplicate projects for the same lead
    const existing = this.repository.getProjectByLeadId(params.leadId);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const projectId = `PROJ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const project: SolarProject = {
      id: projectId,
      leadId: params.leadId,
      status: ProjectStatus.ACTIVE,
      currentMilestone: MilestoneType.SITE_SURVEY,
      startDate: now,
      estimatedCompletionDate: params.estimatedCompletionDate ?? null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    // Save project record
    this.repository.createProject(project);

    // Auto-initialize 6 project milestones
    const milestoneTypes: MilestoneType[] = [
      MilestoneType.SITE_SURVEY,
      MilestoneType.ENGINEERING,
      MilestoneType.PERMITTING,
      MilestoneType.INSTALLATION,
      MilestoneType.INSPECTION,
      MilestoneType.PTO,
    ];

    milestoneTypes.forEach((type, index) => {
      const isFirst = index === 0;
      this.repository.createMilestone({
        id: `MS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        projectId,
        milestoneType: type,
        status: isFirst ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.PENDING,
        startedAt: isFirst ? now : null,
        completedAt: null,
        notes: isFirst ? "Project initiated, site survey in progress." : null,
        updatedBy: "SYSTEM",
        createdAt: now,
        updatedAt: now,
      });
    });

    // Create initial customer update
    this.repository.createProjectUpdate({
      id: `UPD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      projectId,
      message: "Your solar project has been initialized. The site survey phase is now in progress.",
      visibleToCustomer: true,
      createdBy: "SYSTEM",
      createdAt: now,
    });

    return project;
  }

  /**
   * Retrieves a project by unique Project ID.
   */
  getProject(projectId: string): SolarProject | null {
    return this.repository.getProject(projectId);
  }

  /**
   * Retrieves a project associated with a given Lead ID.
   */
  getProjectByLeadId(leadId: string): SolarProject | null {
    return this.repository.getProjectByLeadId(leadId);
  }

  /**
   * Retrieves all projects, optionally filtered by status.
   */
  getProjects(filter?: { status?: string | undefined }): SolarProject[] {
    return this.repository.getProjects(filter);
  }

  /**
   * Marks a solar project as COMPLETED.
   */
  completeProject(projectId: string): SolarProject {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    if (project.status === ProjectStatus.COMPLETED) {
      return project;
    }

    const now = new Date().toISOString();
    this.repository.updateProjectStatus(projectId, ProjectStatus.COMPLETED, now);

    this.repository.createProjectUpdate({
      id: `UPD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      projectId,
      message: "Congratulations! Your solar installation project has been fully completed and activated.",
      visibleToCustomer: true,
      createdBy: "SYSTEM",
      createdAt: now,
    });

    return {
      ...project,
      status: ProjectStatus.COMPLETED,
      completedAt: now,
      updatedAt: now,
    };
  }

  /**
   * Cancels an active project.
   */
  cancelProject(projectId: string, reason?: string): SolarProject {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    if (project.status === ProjectStatus.CANCELLED) {
      return project;
    }

    const now = new Date().toISOString();
    this.repository.updateProjectStatus(projectId, ProjectStatus.CANCELLED);

    this.repository.createProjectUpdate({
      id: `UPD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      projectId,
      message: `Project cancelled.${reason ? ` Reason: ${reason}` : ""}`,
      visibleToCustomer: false,
      createdBy: "SYSTEM",
      createdAt: now,
    });

    return {
      ...project,
      status: ProjectStatus.CANCELLED,
      updatedAt: now,
    };
  }
}

export const projectService = new ProjectService();
