import { z } from "zod";

export const EnrollLeadSchema = z.object({
  workflowId: z.string().min(1, "workflowId is required"),
});

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  triggerEvent: z.string().min(1, "Trigger event is required"),
  steps: z.array(
    z.object({
      stepNumber: z.number().int().positive(),
      delayHours: z.number().nonnegative(),
      actionType: z.enum(["SEND_SMS", "SEND_EMAIL", "CREATE_SALES_TASK", "CHECK_ACTIVITY"]),
      templateName: z.string().optional(),
      taskTitle: z.string().optional(),
      condition: z.enum(["INACTIVE_ONLY", "NONE"]).optional(),
    })
  ),
  stopConditions: z.array(z.string()),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  channel: z.enum(["SMS", "EMAIL"]),
  subject: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  stage: z.string().min(1, "Stage is required"),
  purpose: z.string().min(1, "Purpose is required"),
  variables: z.array(z.string()).optional(),
});

export const SmsWebhookSchema = z.object({
  from: z.string().min(1),
  body: z.string().min(1),
  messageId: z.string().optional(),
});

export const EmailWebhookSchema = z.object({
  from: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().min(1),
});
