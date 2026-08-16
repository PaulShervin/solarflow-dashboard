import { db } from "./db";
import {
  SolarProject,
  ProjectMilestone,
  ProjectUpdate,
  CancellationRisk,
  ProjectNotification,
  ReferralEvent,
  ProjectStatus,
  MilestoneType,
  MilestoneStatus,
  RiskLevel,
  NotificationChannel,
  NotificationStatus,
  ReferralStatus,
} from "../models";

export class PostSaleRepository {
  // ==========================================
  // Row Mappers
  // ==========================================

  private mapRowToProject(row: any): SolarProject {
    return {
      id: row.id,
      leadId: row.lead_id,
      status: row.status as ProjectStatus,
      currentMilestone: row.current_milestone as MilestoneType,
      startDate: row.start_date,
      estimatedCompletionDate: row.estimated_completion_date ?? null,
      completedAt: row.completed_at ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToMilestone(row: any): ProjectMilestone {
    return {
      id: row.id,
      projectId: row.project_id,
      milestoneType: row.milestone_type as MilestoneType,
      status: row.status as MilestoneStatus,
      startedAt: row.started_at ?? null,
      completedAt: row.completed_at ?? null,
      notes: row.notes ?? null,
      updatedBy: row.updated_by ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToUpdate(row: any): ProjectUpdate {
    return {
      id: row.id,
      projectId: row.project_id,
      milestoneId: row.milestone_id ?? null,
      message: row.message,
      visibleToCustomer: Boolean(row.visible_to_customer),
      createdBy: row.created_by,
      createdAt: row.created_at,
    };
  }

  private mapRowToRisk(row: any): CancellationRisk {
    return {
      id: row.id,
      projectId: row.project_id,
      score: row.score,
      riskLevel: row.risk_level as RiskLevel,
      stalledDays: row.stalled_days,
      unresolvedInquiries: row.unresolved_inquiries,
      reason: row.reason,
      evaluatedAt: row.evaluated_at,
    };
  }

  private mapRowToNotification(row: any): ProjectNotification {
    return {
      id: row.id,
      projectId: row.project_id,
      milestoneId: row.milestone_id ?? null,
      channel: row.channel as NotificationChannel,
      message: row.message,
      status: row.status as NotificationStatus,
      createdAt: row.created_at,
      sentAt: row.sent_at ?? null,
    };
  }

  private mapRowToReferral(row: any): ReferralEvent {
    return {
      id: row.id,
      projectId: row.project_id,
      leadId: row.lead_id,
      status: row.status as ReferralStatus,
      createdAt: row.created_at,
      completedAt: row.completed_at ?? null,
    };
  }

  // ==========================================
  // Project CRUD Operations
  // ==========================================

  createProject(project: SolarProject): SolarProject {
    const stmt = db.prepare(`
      INSERT INTO solar_projects (
        id, lead_id, status, current_milestone, start_date, estimated_completion_date, completed_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      project.id,
      project.leadId,
      project.status,
      project.currentMilestone,
      project.startDate,
      project.estimatedCompletionDate ?? null,
      project.completedAt ?? null,
      project.createdAt,
      project.updatedAt
    );

    return project;
  }

  getProject(id: string): SolarProject | null {
    const row = db.prepare(`SELECT * FROM solar_projects WHERE id = ?`).get(id);
    return row ? this.mapRowToProject(row) : null;
  }

  getProjectByLeadId(leadId: string): SolarProject | null {
    const row = db.prepare(`SELECT * FROM solar_projects WHERE lead_id = ?`).get(leadId);
    return row ? this.mapRowToProject(row) : null;
  }

  getProjects(filter?: { status?: string | undefined }): SolarProject[] {
    if (filter?.status) {
      const rows = db.prepare(`SELECT * FROM solar_projects WHERE status = ? ORDER BY created_at DESC`).all(filter.status);
      return rows.map((r: any) => this.mapRowToProject(r));
    }
    const rows = db.prepare(`SELECT * FROM solar_projects ORDER BY created_at DESC`).all();
    return rows.map((r: any) => this.mapRowToProject(r));
  }

  updateProjectStatus(id: string, status: ProjectStatus, completedAt?: string): void {
    const now = new Date().toISOString();
    if (completedAt !== undefined) {
      db.prepare(`
        UPDATE solar_projects SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?
      `).run(status, completedAt, now, id);
    } else {
      db.prepare(`
        UPDATE solar_projects SET status = ?, updated_at = ? WHERE id = ?
      `).run(status, now, id);
    }
  }

  updateProjectCurrentMilestone(id: string, milestone: MilestoneType): void {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE solar_projects SET current_milestone = ?, updated_at = ? WHERE id = ?
    `).run(milestone, now, id);
  }

  // ==========================================
  // Milestone CRUD Operations
  // ==========================================

  createMilestone(milestone: ProjectMilestone): ProjectMilestone {
    const stmt = db.prepare(`
      INSERT INTO project_milestones (
        id, project_id, milestone_type, status, started_at, completed_at, notes, updated_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      milestone.id,
      milestone.projectId,
      milestone.milestoneType,
      milestone.status,
      milestone.startedAt ?? null,
      milestone.completedAt ?? null,
      milestone.notes ?? null,
      milestone.updatedBy ?? null,
      milestone.createdAt,
      milestone.updatedAt
    );

    return milestone;
  }

  getMilestones(projectId: string): ProjectMilestone[] {
    const rows = db.prepare(`SELECT * FROM project_milestones WHERE project_id = ? ORDER BY created_at ASC`).all(projectId);
    return rows.map((r: any) => this.mapRowToMilestone(r));
  }

  getMilestone(projectId: string, milestoneType: MilestoneType): ProjectMilestone | null {
    const row = db.prepare(`SELECT * FROM project_milestones WHERE project_id = ? AND milestone_type = ?`).get(projectId, milestoneType);
    return row ? this.mapRowToMilestone(row) : null;
  }

  updateMilestone(
    id: string,
    updates: {
      status: MilestoneStatus;
      startedAt?: string | null | undefined;
      completedAt?: string | null | undefined;
      notes?: string | null | undefined;
      updatedBy?: string | null | undefined;
    }
  ): void {
    const now = new Date().toISOString();
    const current = db.prepare(`SELECT * FROM project_milestones WHERE id = ?`).get(id) as any;
    if (!current) return;

    db.prepare(`
      UPDATE project_milestones SET
        status = ?,
        started_at = ?,
        completed_at = ?,
        notes = ?,
        updated_by = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      updates.status,
      updates.startedAt !== undefined ? updates.startedAt : current.started_at,
      updates.completedAt !== undefined ? updates.completedAt : current.completed_at,
      updates.notes !== undefined ? updates.notes : current.notes,
      updates.updatedBy !== undefined ? updates.updatedBy : current.updated_by,
      now,
      id
    );
  }

  // ==========================================
  // Project Updates CRUD Operations
  // ==========================================

  createProjectUpdate(update: ProjectUpdate): ProjectUpdate {
    const stmt = db.prepare(`
      INSERT INTO project_updates (
        id, project_id, milestone_id, message, visible_to_customer, created_by, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      update.id,
      update.projectId,
      update.milestoneId ?? null,
      update.message,
      update.visibleToCustomer ? 1 : 0,
      update.createdBy,
      update.createdAt
    );

    return update;
  }

  getProjectUpdates(projectId: string, customerOnly: boolean = false): ProjectUpdate[] {
    if (customerOnly) {
      const rows = db.prepare(`SELECT * FROM project_updates WHERE project_id = ? AND visible_to_customer = 1 ORDER BY created_at DESC`).all(projectId);
      return rows.map((r: any) => this.mapRowToUpdate(r));
    }
    const rows = db.prepare(`SELECT * FROM project_updates WHERE project_id = ? ORDER BY created_at DESC`).all(projectId);
    return rows.map((r: any) => this.mapRowToUpdate(r));
  }

  // ==========================================
  // Risk CRUD Operations
  // ==========================================

  createRiskEvaluation(risk: CancellationRisk): CancellationRisk {
    const stmt = db.prepare(`
      INSERT INTO cancellation_risks (
        id, project_id, score, risk_level, stalled_days, unresolved_inquiries, reason, evaluated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      risk.id,
      risk.projectId,
      risk.score,
      risk.riskLevel,
      risk.stalledDays,
      risk.unresolvedInquiries,
      risk.reason,
      risk.evaluatedAt
    );

    return risk;
  }

  getLatestRisk(projectId: string): CancellationRisk | null {
    const row = db.prepare(`SELECT * FROM cancellation_risks WHERE project_id = ? ORDER BY evaluated_at DESC LIMIT 1`).get(projectId);
    return row ? this.mapRowToRisk(row) : null;
  }

  getRiskHistory(projectId: string): CancellationRisk[] {
    const rows = db.prepare(`SELECT * FROM cancellation_risks WHERE project_id = ? ORDER BY evaluated_at DESC`).all(projectId);
    return rows.map((r: any) => this.mapRowToRisk(r));
  }

  // ==========================================
  // Notification CRUD Operations
  // ==========================================

  createNotification(notification: ProjectNotification): ProjectNotification {
    const stmt = db.prepare(`
      INSERT INTO project_notifications (
        id, project_id, milestone_id, channel, message, status, created_at, sent_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      notification.id,
      notification.projectId,
      notification.milestoneId ?? null,
      notification.channel,
      notification.message,
      notification.status,
      notification.createdAt,
      notification.sentAt ?? null
    );

    return notification;
  }

  getNotifications(projectId: string): ProjectNotification[] {
    const rows = db.prepare(`SELECT * FROM project_notifications WHERE project_id = ? ORDER BY created_at DESC`).all(projectId);
    return rows.map((r: any) => this.mapRowToNotification(r));
  }

  updateNotificationStatus(id: string, status: NotificationStatus, sentAt?: string): void {
    if (sentAt) {
      db.prepare(`UPDATE project_notifications SET status = ?, sent_at = ? WHERE id = ?`).run(status, sentAt, id);
    } else {
      db.prepare(`UPDATE project_notifications SET status = ? WHERE id = ?`).run(status, id);
    }
  }

  // ==========================================
  // Referral CRUD Operations
  // ==========================================

  createReferral(referral: ReferralEvent): ReferralEvent {
    const stmt = db.prepare(`
      INSERT INTO referral_events (
        id, project_id, lead_id, status, created_at, completed_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      referral.id,
      referral.projectId,
      referral.leadId,
      referral.status,
      referral.createdAt,
      referral.completedAt ?? null
    );

    return referral;
  }

  getReferral(projectId: string): ReferralEvent | null {
    const row = db.prepare(`SELECT * FROM referral_events WHERE project_id = ?`).get(projectId);
    return row ? this.mapRowToReferral(row) : null;
  }

  updateReferralStatus(id: string, status: ReferralStatus, completedAt?: string): void {
    if (completedAt) {
      db.prepare(`UPDATE referral_events SET status = ?, completed_at = ? WHERE id = ?`).run(status, completedAt, id);
    } else {
      db.prepare(`UPDATE referral_events SET status = ? WHERE id = ?`).run(status, id);
    }
  }
}

export const postSaleRepository = new PostSaleRepository();
