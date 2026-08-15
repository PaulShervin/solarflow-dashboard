import { NurtureRepository } from "../repositories/nurture.repository";
import { WorkflowDefinitionModel, WorkflowEnrollmentModel, LeadModel } from "../models";
import { StopConditionEvaluator } from "./stop-condition-evaluator.service";
import { PersonalizationService } from "../personalization/personalization.service";
import { MessagingService } from "../messaging/messaging.service";
import { NextBestActionService } from "./next-best-action.service";
import { eventBus } from "../events/event-bus";
import { logger } from "../../shared/logger";
import { DomainEvent } from "../../shared/contracts/events";
import { v4 as uuidv4 } from "uuid";
import { initialWorkflows } from "../workflows/initial-workflows";
import { initDatabase } from "../repositories/db";

export class NurtureEngineService {
  private messagingService: MessagingService;

  constructor(messagingService?: MessagingService) {
    this.messagingService = messagingService || new MessagingService();
    this.initSystemWorkflows();
    this.registerEventSubscriptions();
  }

  private initSystemWorkflows() {
    initDatabase();
    for (const wf of initialWorkflows) {
      if (!NurtureRepository.getWorkflowById(wf.id)) {
        NurtureRepository.saveWorkflow(wf);
      }
    }
  }

  private registerEventSubscriptions() {
    eventBus.subscribe("PROPOSAL_SENT", (e) => this.handleTriggerEvent(e));
    eventBus.subscribe("APPOINTMENT_BOOKED", (e) => this.handleTriggerEvent(e));
    eventBus.subscribe("APPOINTMENT_MISSED", (e) => this.handleTriggerEvent(e));
    eventBus.subscribe("QUALIFIED", (e) => this.handleTriggerEvent(e));
    eventBus.subscribe("CUSTOMER_REPLIED", (e) => this.handleCustomerActivity(e));
    eventBus.subscribe("CUSTOMER_ACTIVITY", (e) => this.handleCustomerActivity(e));
    eventBus.subscribe("LEAD_STAGE_CHANGED", (e) => this.handleStageChange(e));
  }

  /**
   * Enroll lead into workflow. Prevents duplicate active enrollments.
   */
  async enrollLead(workflowId: string, leadId: string): Promise<WorkflowEnrollmentModel> {
    const workflow = NurtureRepository.getWorkflowById(workflowId);
    if (!workflow || !workflow.isActive) {
      throw new Error(`Workflow [${workflowId}] not found or inactive`);
    }

    const lead = NurtureRepository.getLeadById(leadId);
    if (!lead) {
      throw new Error(`Lead [${leadId}] not found`);
    }

    // Check duplicate active enrollment
    const existing = NurtureRepository.getActiveEnrollment(workflowId, leadId);
    if (existing) {
      logger.info(`Lead [${leadId}] is already actively enrolled in workflow [${workflowId}]`, { enrollmentId: existing.id });
      return existing;
    }

    // Evaluate stop conditions on initial enrollment
    const stopResult = StopConditionEvaluator.evaluate(
      { id: "", workflowId, leadId, currentStepIndex: 0, state: "ACTIVE", enrolledAt: new Date().toISOString(), executionCount: 0 },
      lead,
      workflow
    );

    if (stopResult.shouldStop) {
      logger.info(`Lead [${leadId}] cannot be enrolled due to stop condition: ${stopResult.reason}`);
      throw new Error(`Cannot enroll lead: ${stopResult.reason}`);
    }

    const firstStep = workflow.steps[0];
    const delayMs = (firstStep?.delayHours || 0) * 3600000;
    const nextExecution = new Date(Date.now() + delayMs).toISOString();

    const enrollment: WorkflowEnrollmentModel = {
      id: `ENR-${uuidv4().substring(0, 8)}`,
      workflowId,
      leadId,
      currentStepIndex: 0,
      state: "ACTIVE",
      enrolledAt: new Date().toISOString(),
      nextExecutionTimestamp: nextExecution,
      executionCount: 0,
    };

    NurtureRepository.saveEnrollment(enrollment);

    await eventBus.publish({
      id: uuidv4(),
      type: "NURTURE_STARTED",
      timestamp: enrollment.enrolledAt,
      leadId,
      source: "NurtureEngineService",
      data: { workflowId, enrollmentId: enrollment.id },
    });

    return enrollment;
  }

  async handleTriggerEvent(event: DomainEvent): Promise<void> {
    const workflows = NurtureRepository.getWorkflowsByTrigger(event.type);
    for (const wf of workflows) {
      try {
        await this.enrollLead(wf.id, event.leadId);
      } catch (err: any) {
        logger.debug(`Trigger enrollment skipped: ${err.message}`, { leadId: event.leadId, workflowId: wf.id });
      }
    }
  }

  async handleCustomerActivity(event: DomainEvent): Promise<void> {
    const activeEnrollments = NurtureRepository.getActiveEnrollmentsForLead(event.leadId);
    const lead = NurtureRepository.getLeadById(event.leadId);
    if (!lead) return;

    for (const enr of activeEnrollments) {
      const wf = NurtureRepository.getWorkflowById(enr.workflowId);
      if (!wf) continue;

      const evalResult = StopConditionEvaluator.evaluate(enr, lead, wf);
      if (evalResult.shouldStop) {
        enr.state = "CANCELLED";
        enr.reasonForStopping = evalResult.reason;
        enr.lastActionAt = new Date().toISOString();
        NurtureRepository.saveEnrollment(enr);

        await eventBus.publish({
          id: uuidv4(),
          type: "NURTURE_CANCELLED",
          timestamp: new Date().toISOString(),
          leadId: lead.id,
          source: "NurtureEngineService",
          data: { enrollmentId: enr.id, reason: evalResult.reason },
        });
      }
    }
  }

  async handleStageChange(event: DomainEvent<{ newStage: string }>): Promise<void> {
    if (event.data?.newStage) {
      NurtureRepository.updateLeadStage(event.leadId, event.data.newStage);
    }
    await this.handleCustomerActivity(event);
  }

  /**
   * Process all due workflow enrollments (worker tick).
   */
  async processDueEnrollments(currentIso = new Date().toISOString()): Promise<number> {
    const dueEnrollments = NurtureRepository.getDueEnrollments(currentIso);
    let processedCount = 0;

    for (const enr of dueEnrollments) {
      try {
        await this.executeStep(enr);
        processedCount++;
      } catch (err: any) {
        logger.error(`Error processing enrollment [${enr.id}]`, err);
      }
    }

    return processedCount;
  }

  private async executeStep(enrollment: WorkflowEnrollmentModel): Promise<void> {
    const lead = NurtureRepository.getLeadById(enrollment.leadId);
    const workflow = NurtureRepository.getWorkflowById(enrollment.workflowId);

    if (!lead || !workflow) {
      enrollment.state = "CANCELLED";
      enrollment.reasonForStopping = "Lead or Workflow deleted";
      NurtureRepository.saveEnrollment(enrollment);
      return;
    }

    // 1. Evaluate Stop Conditions
    const stopResult = StopConditionEvaluator.evaluate(enrollment, lead, workflow);
    if (stopResult.shouldStop) {
      enrollment.state = "CANCELLED";
      enrollment.reasonForStopping = stopResult.reason;
      enrollment.lastActionAt = new Date().toISOString();
      NurtureRepository.saveEnrollment(enrollment);
      logger.info(`Enrollment [${enrollment.id}] cancelled during step execution: ${stopResult.reason}`);
      return;
    }

    const currentStep = workflow.steps[enrollment.currentStepIndex];
    if (!currentStep) {
      enrollment.state = "COMPLETED";
      enrollment.lastActionAt = new Date().toISOString();
      NurtureRepository.saveEnrollment(enrollment);
      return;
    }

    // 2. Perform Action
    const nowIso = new Date().toISOString();
    try {
      if (currentStep.actionType === "SEND_SMS" || currentStep.actionType === "SEND_EMAIL") {
        const template = NurtureRepository.getTemplateByName(currentStep.templateName || "");
        const channel = currentStep.actionType === "SEND_SMS" ? "SMS" : "EMAIL";
        const rawBody = template?.body || `Hi {{first_name}}, following up regarding your solar inquiry.`;
        const subject = template?.subject || "SolarPeak Update";

        const personalizedBody = await PersonalizationService.renderWithAiFallback(rawBody, lead);

        await this.messagingService.sendMessage(
          lead,
          channel,
          personalizedBody,
          subject,
          `IDEM-${enrollment.id}-STEP-${enrollment.currentStepIndex}`
        );
      } else if (currentStep.actionType === "CREATE_SALES_TASK") {
        NextBestActionService.generateForLead(lead, currentStep.taskTitle || "Nurture follow-up task");
      }

      enrollment.executionCount += 1;
      enrollment.currentStepIndex += 1;
      enrollment.lastActionAt = nowIso;

      // 3. Schedule next step or complete
      if (enrollment.currentStepIndex < workflow.steps.length) {
        const nextStep = workflow.steps[enrollment.currentStepIndex];
        const nextDelayMs = (nextStep.delayHours || 24) * 3600000;
        enrollment.nextExecutionTimestamp = new Date(Date.now() + nextDelayMs).toISOString();
      } else {
        enrollment.state = "COMPLETED";
        enrollment.nextExecutionTimestamp = undefined;
      }

      NurtureRepository.saveEnrollment(enrollment);
    } catch (err: any) {
      logger.error(`Failed to execute step for enrollment [${enrollment.id}]`, err);
    }
  }

  /* ---------------------- MANUAL REP OVERRIDES --------------------- */

  pauseEnrollment(enrollmentId: string): WorkflowEnrollmentModel {
    const enr = NurtureRepository.getEnrollmentById(enrollmentId);
    if (!enr) {
      throw new Error(`Enrollment [${enrollmentId}] not found`);
    }
    enr.state = "PAUSED";
    enr.reasonForStopping = "Manually paused by sales representative";
    enr.lastActionAt = new Date().toISOString();
    NurtureRepository.saveEnrollment(enr);
    return enr;
  }

  resumeEnrollment(enrollmentId: string): WorkflowEnrollmentModel {
    const enr = NurtureRepository.getEnrollmentById(enrollmentId);
    if (!enr) {
      throw new Error(`Enrollment [${enrollmentId}] not found`);
    }
    enr.state = "ACTIVE";
    enr.reasonForStopping = undefined;
    enr.lastActionAt = new Date().toISOString();
    NurtureRepository.saveEnrollment(enr);
    return enr;
  }

  cancelEnrollment(enrollmentId: string): WorkflowEnrollmentModel {
    const enr = NurtureRepository.getEnrollmentById(enrollmentId);
    if (!enr) {
      throw new Error(`Enrollment [${enrollmentId}] not found`);
    }
    enr.state = "CANCELLED";
    enr.reasonForStopping = "Manually cancelled by sales representative";
    enr.lastActionAt = new Date().toISOString();
    NurtureRepository.saveEnrollment(enr);
    return enr;
  }
}
