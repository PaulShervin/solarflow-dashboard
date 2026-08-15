import { WorkflowDefinitionModel } from "../models";

export const initialWorkflows: WorkflowDefinitionModel[] = [
  // WORKFLOW 1: Proposal Follow-up
  {
    id: "WF-PROPOSAL-FOLLOWUP",
    name: "Proposal Follow-up",
    description: "Automated sequence to follow up on delivered proposals and re-engage inactive leads",
    triggerEvent: "PROPOSAL_SENT",
    steps: [
      {
        stepNumber: 1,
        delayHours: 72, // 3 days
        actionType: "SEND_SMS",
        templateName: "proposal_followup_sms_1",
        condition: "INACTIVE_ONLY",
      },
      {
        stepNumber: 2,
        delayHours: 96, // 4 additional days
        actionType: "SEND_EMAIL",
        templateName: "proposal_followup_email_1",
        condition: "INACTIVE_ONLY",
      },
      {
        stepNumber: 3,
        delayHours: 120, // 5 additional days
        actionType: "CREATE_SALES_TASK",
        taskTitle: "Proposal unanswered for 12 days — Call customer",
        condition: "INACTIVE_ONLY",
      },
    ],
    stopConditions: ["CUSTOMER_REPLIED", "APPOINTMENT_BOOKED", "STAGE_CHANGE", "OPT_OUT"],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // WORKFLOW 2: Appointment Reminder
  {
    id: "WF-APPOINTMENT-REMINDER",
    name: "Appointment Reminder",
    description: "Pre-consultation reminders to ensure high show rates",
    triggerEvent: "APPOINTMENT_BOOKED",
    steps: [
      {
        stepNumber: 1,
        delayHours: 24, // 24h before
        actionType: "SEND_SMS",
        templateName: "appointment_reminder_24h",
        condition: "NONE",
      },
      {
        stepNumber: 2,
        delayHours: 2, // 2h before
        actionType: "SEND_SMS",
        templateName: "appointment_reminder_2h",
        condition: "NONE",
      },
    ],
    stopConditions: ["APPOINTMENT_CANCELLED", "STAGE_CHANGE", "OPT_OUT"],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // WORKFLOW 3: Missed Appointment
  {
    id: "WF-MISSED-APPOINTMENT",
    name: "Missed Appointment Re-engagement",
    description: "Rapid re-engagement sequence for leads who missed their scheduled consultation",
    triggerEvent: "APPOINTMENT_MISSED",
    steps: [
      {
        stepNumber: 1,
        delayHours: 0.5, // 30 minutes
        actionType: "SEND_SMS",
        templateName: "missed_appointment_sms",
        condition: "NONE",
      },
      {
        stepNumber: 2,
        delayHours: 24, // 24 hours later
        actionType: "SEND_EMAIL",
        templateName: "missed_appointment_email",
        condition: "INACTIVE_ONLY",
      },
    ],
    stopConditions: ["CUSTOMER_REPLIED", "APPOINTMENT_BOOKED", "OPT_OUT"],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // WORKFLOW 4: Qualified Lead Follow-up
  {
    id: "WF-QUALIFIED-FOLLOWUP",
    name: "Qualified Lead Follow-up",
    description: "Nurture newly qualified leads to book an in-home or virtual consultation",
    triggerEvent: "QUALIFIED",
    steps: [
      {
        stepNumber: 1,
        delayHours: 48, // 2 days
        actionType: "SEND_SMS",
        templateName: "qualified_followup_sms",
        condition: "INACTIVE_ONLY",
      },
      {
        stepNumber: 2,
        delayHours: 120, // 5 days
        actionType: "CREATE_SALES_TASK",
        taskTitle: "Qualified lead inactive for 7 days — Call to book consultation",
        condition: "INACTIVE_ONLY",
      },
    ],
    stopConditions: ["CUSTOMER_REPLIED", "APPOINTMENT_BOOKED", "STAGE_CHANGE", "OPT_OUT"],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
