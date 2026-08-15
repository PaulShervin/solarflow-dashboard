import { LeadStage } from "../../shared/contracts/lead-stage";

export type EnrollmentState = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
export type MessageChannel = "SMS" | "EMAIL";
export type MessageStatus = "CREATED" | "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
export type ActivityType =
  | "INCOMING_SMS"
  | "INCOMING_EMAIL"
  | "WEBSITE_CHAT"
  | "PHONE_CALL"
  | "APPOINTMENT_BOOKED"
  | "APPOINTMENT_ATTENDED"
  | "PROPOSAL_INTERACTION"
  | "PORTAL_ACTIVITY"
  | "REP_INTERACTION"
  | "CRM_ACTIVITY"
  | "SUPPORT_INTERACTION";

export interface LeadModel {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  leadStage: LeadStage;
  leadSource: string;
  campaign?: string;
  assignedSalesRep: string;
  quoteAmount?: number;
  quoteUrl?: string;
  timeline?: string;
  monthlyElectricBill?: number;
  appointmentDate?: string;
  lastActivityTimestamp: string;
  customerTimezone: string;
  communicationPreferences: {
    smsAllowed: boolean;
    emailAllowed: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomerActivityModel {
  id: string;
  leadId: string;
  activityType: ActivityType;
  timestamp: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowStep {
  stepNumber: number;
  delayHours: number;
  actionType: "SEND_SMS" | "SEND_EMAIL" | "CREATE_SALES_TASK" | "CHECK_ACTIVITY";
  templateName?: string;
  taskTitle?: string;
  condition?: "INACTIVE_ONLY" | "NONE";
}

export interface WorkflowDefinitionModel {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  conditions?: Record<string, unknown>;
  steps: WorkflowStep[];
  stopConditions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowEnrollmentModel {
  id: string;
  workflowId: string;
  leadId: string;
  currentStepIndex: number;
  state: EnrollmentState;
  enrolledAt: string;
  nextExecutionTimestamp?: string;
  executionCount: number;
  lastActionAt?: string;
  reasonForStopping?: string;
}

export interface WorkflowExecutionModel {
  id: string;
  enrollmentId: string;
  stepIndex: number;
  executedAt: string;
  status: "SUCCESS" | "SKIPPED" | "FAILED";
  details?: Record<string, unknown>;
}

export interface NurtureMessageModel {
  id: string;
  leadId: string;
  channel: MessageChannel;
  status: MessageStatus;
  provider: string;
  providerMessageId?: string;
  recipient: string;
  subject?: string;
  body: string;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  retryCount: number;
  idempotencyKey: string;
}

export interface MessageTemplateModel {
  id: string;
  name: string;
  channel: MessageChannel;
  subject?: string;
  body: string;
  stage: LeadStage;
  purpose: string;
  variables: string[];
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SuppressionModel {
  id: string;
  leadId?: string;
  identifier: string; // phone or email
  reason: string;
  createdAt: string;
}

export interface NurtureTaskModel {
  id: string;
  leadId: string;
  title: string;
  detail: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  owner: string;
  done: boolean;
  type: "Call" | "Email" | "Follow-up" | "Admin" | "Site";
  createdAt: string;
}

export interface AuditEventModel {
  id: string;
  eventType: string;
  leadId: string;
  timestamp: string;
  actor: string;
  context?: Record<string, unknown>;
}
