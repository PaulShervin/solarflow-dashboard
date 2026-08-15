import { db } from "./db";
import {
  LeadModel,
  CustomerActivityModel,
  WorkflowDefinitionModel,
  WorkflowEnrollmentModel,
  WorkflowExecutionModel,
  NurtureMessageModel,
  MessageTemplateModel,
  SuppressionModel,
  NurtureTaskModel,
  AuditEventModel,
  EnrollmentState,
} from "../models";

export class NurtureRepository {
  /* ---------------------------------- LEADS --------------------------------- */

  static getLeadById(id: string): LeadModel | null {
    const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapLeadRow(row);
  }

  static findLeadByIdentifier(phoneOrEmail: string): LeadModel | null {
    const row = db.prepare("SELECT * FROM leads WHERE phone = ? OR email = ?").get(phoneOrEmail, phoneOrEmail) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapLeadRow(row);
  }

  static updateLeadStage(id: string, stage: string): void {
    const now = new Date().toISOString();
    db.prepare("UPDATE leads SET leadStage = ?, updatedAt = ? WHERE id = ?").run(stage, now, id);
  }

  static updateLastActivity(id: string, timestamp: string): void {
    const now = new Date().toISOString();
    db.prepare("UPDATE leads SET lastActivityTimestamp = ?, updatedAt = ? WHERE id = ?").run(timestamp, now, id);
  }

  static saveLead(lead: LeadModel): void {
    db.prepare(`
      INSERT INTO leads (
        id, firstName, lastName, phone, email, leadStage, leadSource, campaign,
        assignedSalesRep, quoteAmount, quoteUrl, timeline, monthlyElectricBill,
        appointmentDate, lastActivityTimestamp, customerTimezone, communicationPreferences,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        firstName=excluded.firstName,
        lastName=excluded.lastName,
        phone=excluded.phone,
        email=excluded.email,
        leadStage=excluded.leadStage,
        quoteAmount=excluded.quoteAmount,
        quoteUrl=excluded.quoteUrl,
        timeline=excluded.timeline,
        monthlyElectricBill=excluded.monthlyElectricBill,
        appointmentDate=excluded.appointmentDate,
        lastActivityTimestamp=excluded.lastActivityTimestamp,
        updatedAt=excluded.updatedAt
    `).run(
      lead.id, lead.firstName, lead.lastName, lead.phone, lead.email, lead.leadStage, lead.leadSource, lead.campaign || null,
      lead.assignedSalesRep, lead.quoteAmount || null, lead.quoteUrl || null, lead.timeline || null, lead.monthlyElectricBill || null,
      lead.appointmentDate || null, lead.lastActivityTimestamp, lead.customerTimezone, JSON.stringify(lead.communicationPreferences),
      lead.createdAt, lead.updatedAt
    );
  }

  private static mapLeadRow(row: Record<string, unknown>): LeadModel {
    return {
      id: row.id as string,
      firstName: row.firstName as string,
      lastName: row.lastName as string,
      phone: row.phone as string,
      email: row.email as string,
      leadStage: row.leadStage as any,
      leadSource: row.leadSource as string,
      campaign: row.campaign as string | undefined,
      assignedSalesRep: row.assignedSalesRep as string,
      quoteAmount: row.quoteAmount ? Number(row.quoteAmount) : undefined,
      quoteUrl: row.quoteUrl as string | undefined,
      timeline: row.timeline as string | undefined,
      monthlyElectricBill: row.monthlyElectricBill ? Number(row.monthlyElectricBill) : undefined,
      appointmentDate: row.appointmentDate as string | undefined,
      lastActivityTimestamp: row.lastActivityTimestamp as string,
      customerTimezone: row.customerTimezone as string,
      communicationPreferences: JSON.parse(row.communicationPreferences as string || "{}"),
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }

  /* ------------------------------- ACTIVITIES ------------------------------- */

  static logActivity(activity: CustomerActivityModel): void {
    db.prepare(`
      INSERT INTO customer_activities (id, leadId, activityType, timestamp, source, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      activity.id, activity.leadId, activity.activityType, activity.timestamp, activity.source,
      activity.metadata ? JSON.stringify(activity.metadata) : null
    );
    this.updateLastActivity(activity.leadId, activity.timestamp);
  }

  static getRecentActivities(leadId: string, limit = 10): CustomerActivityModel[] {
    const rows = db.prepare("SELECT * FROM customer_activities WHERE leadId = ? ORDER BY timestamp DESC LIMIT ?").all(leadId, limit) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      leadId: r.leadId as string,
      activityType: r.activityType as any,
      timestamp: r.timestamp as string,
      source: r.source as string,
      metadata: r.metadata ? JSON.parse(r.metadata as string) : undefined,
    }));
  }

  /* -------------------------------- WORKFLOWS ------------------------------- */

  static getWorkflowById(id: string): WorkflowDefinitionModel | null {
    const row = db.prepare("SELECT * FROM workflows WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapWorkflowRow(row);
  }

  static getWorkflowsByTrigger(triggerEvent: string): WorkflowDefinitionModel[] {
    const rows = db.prepare("SELECT * FROM workflows WHERE triggerEvent = ? AND isActive = 1").all(triggerEvent) as Record<string, unknown>[];
    return rows.map((r) => this.mapWorkflowRow(r));
  }

  static getAllWorkflows(): WorkflowDefinitionModel[] {
    const rows = db.prepare("SELECT * FROM workflows ORDER BY createdAt DESC").all() as Record<string, unknown>[];
    return rows.map((r) => this.mapWorkflowRow(r));
  }

  static saveWorkflow(wf: WorkflowDefinitionModel): void {
    db.prepare(`
      INSERT INTO workflows (id, name, description, triggerEvent, conditions, steps, stopConditions, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, description=excluded.description, triggerEvent=excluded.triggerEvent,
        steps=excluded.steps, stopConditions=excluded.stopConditions, isActive=excluded.isActive, updatedAt=excluded.updatedAt
    `).run(
      wf.id, wf.name, wf.description, wf.triggerEvent,
      wf.conditions ? JSON.stringify(wf.conditions) : null,
      JSON.stringify(wf.steps), JSON.stringify(wf.stopConditions), wf.isActive ? 1 : 0,
      wf.createdAt, wf.updatedAt
    );
  }

  private static mapWorkflowRow(r: Record<string, unknown>): WorkflowDefinitionModel {
    return {
      id: r.id as string,
      name: r.name as string,
      description: r.description as string,
      triggerEvent: r.triggerEvent as string,
      conditions: r.conditions ? JSON.parse(r.conditions as string) : undefined,
      steps: JSON.parse(r.steps as string),
      stopConditions: JSON.parse(r.stopConditions as string),
      isActive: Boolean(r.isActive),
      createdAt: r.createdAt as string,
      updatedAt: r.updatedAt as string,
    };
  }

  /* ------------------------------- ENROLLMENTS ------------------------------ */

  static getEnrollmentById(id: string): WorkflowEnrollmentModel | null {
    const row = db.prepare("SELECT * FROM workflow_enrollments WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapEnrollmentRow(row);
  }

  static getActiveEnrollment(workflowId: string, leadId: string): WorkflowEnrollmentModel | null {
    const row = db.prepare("SELECT * FROM workflow_enrollments WHERE workflowId = ? AND leadId = ? AND state = 'ACTIVE'").get(workflowId, leadId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapEnrollmentRow(row);
  }

  static getActiveEnrollmentsForLead(leadId: string): WorkflowEnrollmentModel[] {
    const rows = db.prepare("SELECT * FROM workflow_enrollments WHERE leadId = ? AND state = 'ACTIVE'").all(leadId) as Record<string, unknown>[];
    return rows.map((r) => this.mapEnrollmentRow(r));
  }

  static getDueEnrollments(currentTimestamp: string): WorkflowEnrollmentModel[] {
    const rows = db.prepare(`
      SELECT * FROM workflow_enrollments
      WHERE state = 'ACTIVE' AND nextExecutionTimestamp IS NOT NULL AND nextExecutionTimestamp <= ?
    `).all(currentTimestamp) as Record<string, unknown>[];
    return rows.map((r) => this.mapEnrollmentRow(r));
  }

  static saveEnrollment(e: WorkflowEnrollmentModel): void {
    db.prepare(`
      INSERT INTO workflow_enrollments (
        id, workflowId, leadId, currentStepIndex, state, enrolledAt, nextExecutionTimestamp, executionCount, lastActionAt, reasonForStopping
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        currentStepIndex=excluded.currentStepIndex,
        state=excluded.state,
        nextExecutionTimestamp=excluded.nextExecutionTimestamp,
        executionCount=excluded.executionCount,
        lastActionAt=excluded.lastActionAt,
        reasonForStopping=excluded.reasonForStopping
    `).run(
      e.id, e.workflowId, e.leadId, e.currentStepIndex, e.state, e.enrolledAt,
      e.nextExecutionTimestamp || null, e.executionCount, e.lastActionAt || null, e.reasonForStopping || null
    );
  }

  private static mapEnrollmentRow(r: Record<string, unknown>): WorkflowEnrollmentModel {
    return {
      id: r.id as string,
      workflowId: r.workflowId as string,
      leadId: r.leadId as string,
      currentStepIndex: Number(r.currentStepIndex),
      state: r.state as EnrollmentState,
      enrolledAt: r.enrolledAt as string,
      nextExecutionTimestamp: r.nextExecutionTimestamp as string | undefined,
      executionCount: Number(r.executionCount),
      lastActionAt: r.lastActionAt as string | undefined,
      reasonForStopping: r.reasonForStopping as string | undefined,
    };
  }

  /* -------------------------------- MESSAGES -------------------------------- */

  static getMessageByIdempotencyKey(key: string): NurtureMessageModel | null {
    const row = db.prepare("SELECT * FROM nurture_messages WHERE idempotencyKey = ?").get(key) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapMessageRow(row);
  }

  static getMessagesForLead(leadId: string): NurtureMessageModel[] {
    const rows = db.prepare("SELECT * FROM nurture_messages WHERE leadId = ? ORDER BY createdAt DESC").all(leadId) as Record<string, unknown>[];
    return rows.map((r) => this.mapMessageRow(r));
  }

  static getAllMessages(limit = 100): NurtureMessageModel[] {
    const rows = db.prepare("SELECT * FROM nurture_messages ORDER BY createdAt DESC LIMIT ?").all(limit) as Record<string, unknown>[];
    return rows.map((r) => this.mapMessageRow(r));
  }

  static getSentMessagesCountInWindow(leadId: string, sinceIso: string): number {
    const res = db.prepare(`
      SELECT COUNT(*) as count FROM nurture_messages
      WHERE leadId = ? AND createdAt >= ? AND status IN ('SENT', 'DELIVERED')
    `).get(leadId, sinceIso) as { count: number };
    return res.count;
  }

  static saveMessage(m: NurtureMessageModel): void {
    db.prepare(`
      INSERT INTO nurture_messages (
        id, leadId, channel, status, provider, providerMessageId, recipient, subject, body,
        createdAt, sentAt, deliveredAt, failureReason, retryCount, idempotencyKey
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status, providerMessageId=excluded.providerMessageId,
        sentAt=excluded.sentAt, deliveredAt=excluded.deliveredAt,
        failureReason=excluded.failureReason, retryCount=excluded.retryCount
    `).run(
      m.id, m.leadId, m.channel, m.status, m.provider, m.providerMessageId || null,
      m.recipient, m.subject || null, m.body, m.createdAt, m.sentAt || null,
      m.deliveredAt || null, m.failureReason || null, m.retryCount, m.idempotencyKey
    );
  }

  private static mapMessageRow(r: Record<string, unknown>): NurtureMessageModel {
    return {
      id: r.id as string,
      leadId: r.leadId as string,
      channel: r.channel as any,
      status: r.status as any,
      provider: r.provider as string,
      providerMessageId: r.providerMessageId as string | undefined,
      recipient: r.recipient as string,
      subject: r.subject as string | undefined,
      body: r.body as string,
      createdAt: r.createdAt as string,
      sentAt: r.sentAt as string | undefined,
      deliveredAt: r.deliveredAt as string | undefined,
      failureReason: r.failureReason as string | undefined,
      retryCount: Number(r.retryCount),
      idempotencyKey: r.idempotencyKey as string,
    };
  }

  /* -------------------------------- TEMPLATES ------------------------------- */

  static getTemplateByName(name: string): MessageTemplateModel | null {
    const row = db.prepare("SELECT * FROM message_templates WHERE name = ? AND isActive = 1").get(name) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: row.id as string,
      name: row.name as string,
      channel: row.channel as any,
      subject: row.subject as string | undefined,
      body: row.body as string,
      stage: row.stage as any,
      purpose: row.purpose as string,
      variables: JSON.parse(row.variables as string),
      isActive: Boolean(row.isActive),
      version: Number(row.version),
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }

  static getAllTemplates(): MessageTemplateModel[] {
    const rows = db.prepare("SELECT * FROM message_templates ORDER BY name ASC").all() as Record<string, unknown>[];
    return rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      channel: row.channel as any,
      subject: row.subject as string | undefined,
      body: row.body as string,
      stage: row.stage as any,
      purpose: row.purpose as string,
      variables: JSON.parse(row.variables as string),
      isActive: Boolean(row.isActive),
      version: Number(row.version),
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));
  }

  /* ------------------------------ SUPPRESSIONS ------------------------------ */

  static isSuppressed(phoneOrEmail: string): boolean {
    const row = db.prepare("SELECT 1 FROM suppressions WHERE identifier = ?").get(phoneOrEmail);
    return Boolean(row);
  }

  static addSuppression(suppression: SuppressionModel): void {
    db.prepare(`
      INSERT INTO suppressions (id, leadId, identifier, reason, createdAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(identifier) DO NOTHING
    `).run(suppression.id, suppression.leadId || null, suppression.identifier, suppression.reason, suppression.createdAt);
  }

  /* ---------------------------------- TASKS --------------------------------- */

  static saveTask(task: NurtureTaskModel): void {
    db.prepare(`
      INSERT INTO nurture_tasks (id, leadId, title, detail, priority, owner, done, type, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(task.id, task.leadId, task.title, task.detail, task.priority, task.owner, task.done ? 1 : 0, task.type, task.createdAt);
  }

  static getTasksForLead(leadId: string): NurtureTaskModel[] {
    const rows = db.prepare("SELECT * FROM nurture_tasks WHERE leadId = ? ORDER BY createdAt DESC").all(leadId) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      leadId: r.leadId as string,
      title: r.title as string,
      detail: r.detail as string,
      priority: r.priority as any,
      owner: r.owner as string,
      done: Boolean(r.done),
      type: r.type as any,
      createdAt: r.createdAt as string,
    }));
  }

  /* ------------------------------- AUDIT LOGS ------------------------------- */

  static logAuditEvent(event: AuditEventModel): void {
    db.prepare(`
      INSERT INTO audit_events (id, eventType, leadId, timestamp, actor, context)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(event.id, event.eventType, event.leadId, event.timestamp, event.actor, event.context ? JSON.stringify(event.context) : null);
  }

  /* -------------------------------- ANALYTICS ------------------------------- */

  static getAnalytics() {
    const activeWorkflowsCount = (db.prepare("SELECT COUNT(*) as count FROM workflows WHERE isActive = 1").get() as any).count;
    const enrolledLeadsCount = (db.prepare("SELECT COUNT(DISTINCT leadId) as count FROM workflow_enrollments WHERE state = 'ACTIVE'").get() as any).count;
    const sentCount = (db.prepare("SELECT COUNT(*) as count FROM nurture_messages WHERE status IN ('SENT', 'DELIVERED')").get() as any).count;
    const deliveredCount = (db.prepare("SELECT COUNT(*) as count FROM nurture_messages WHERE status = 'DELIVERED'").get() as any).count;
    const failedCount = (db.prepare("SELECT COUNT(*) as count FROM nurture_messages WHERE status = 'FAILED'").get() as any).count;
    const suppressedCount = (db.prepare("SELECT COUNT(*) as count FROM suppressions").get() as any).count;
    const completedCount = (db.prepare("SELECT COUNT(*) as count FROM workflow_enrollments WHERE state = 'COMPLETED'").get() as any).count;
    const cancelledCount = (db.prepare("SELECT COUNT(*) as count FROM workflow_enrollments WHERE state = 'CANCELLED'").get() as any).count;

    return {
      activeWorkflows: activeWorkflowsCount,
      leadsEnrolled: enrolledLeadsCount,
      messagesSent: sentCount,
      messagesDelivered: deliveredCount,
      messagesFailed: failedCount,
      optOutRate: enrolledLeadsCount > 0 ? Number(((suppressedCount / (enrolledLeadsCount + suppressedCount)) * 100).toFixed(1)) : 0,
      workflowCompletion: completedCount,
      workflowCancellation: cancelledCount,
    };
  }
}
