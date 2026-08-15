import { LeadStage } from "./lead-stage";

/**
 * Standard System Domain Events for cross-module pub/sub.
 */
export type EventType =
  | "LEAD_CREATED"
  | "LEAD_STAGE_CHANGED"
  | "QUALIFICATION_COMPLETED"
  | "APPOINTMENT_BOOKED"
  | "APPOINTMENT_MISSED"
  | "PROPOSAL_SENT"
  | "CUSTOMER_REPLIED"
  | "CUSTOMER_ACTIVITY"
  | "PROPOSAL_OPENED"
  | "SALE_COMPLETED"
  | "LEAD_MARKED_LOST"
  | "DO_NOT_CONTACT"
  | "HUMAN_ESCALATION"
  | "NURTURE_STARTED"
  | "NURTURE_STEP_SCHEDULED"
  | "NURTURE_MESSAGE_CREATED"
  | "NURTURE_MESSAGE_SENT"
  | "NURTURE_MESSAGE_DELIVERED"
  | "NURTURE_MESSAGE_FAILED"
  | "CUSTOMER_REENGAGED"
  | "NURTURE_PAUSED"
  | "NURTURE_RESUMED"
  | "NURTURE_COMPLETED"
  | "NURTURE_CANCELLED"
  | "FOLLOW_UP_TASK_CREATED"
  | "CUSTOMER_OPTED_OUT";

export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  type: EventType;
  timestamp: string;
  leadId: string;
  source: string;
  data: T;
}
