import { z } from "zod";
import { ProjectStatus, MilestoneType, MilestoneStatus, RiskLevel } from "../models";

export const CreateProjectSchema = z.object({
  leadId: z.string().min(1, "leadId is required"),
  estimatedCompletionDate: z.string().optional(),
});

export const UpdateProjectStatusSchema = z.object({
  status: z.nativeEnum(ProjectStatus),
});

export const StartMilestoneSchema = z.object({
  notes: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const CompleteMilestoneSchema = z.object({
  notes: z.string().optional(),
  updatedBy: z.string().optional(),
  createCustomerUpdate: z.boolean().optional(),
  customMessage: z.string().optional(),
});

export const CreateProjectUpdateSchema = z.object({
  message: z.string().min(1, "Update message is required"),
  visibleToCustomer: z.boolean().default(true),
  milestoneId: z.string().optional(),
  createdBy: z.string().optional(),
});

export const RecalculateRiskSchema = z.object({
  stalledDays: z.number().int().nonnegative().optional(),
  unresolvedInquiries: z.number().int().nonnegative().optional(),
  reason: z.string().optional(),
});

export const CreateReferralSchema = z.object({
  status: z.enum(["TRIGGERED", "CONTACTED", "COMPLETED"]).optional(),
});

export const ProjectParamsSchema = z.object({
  projectId: z.string().min(1, "projectId parameter is required"),
});

export const MilestoneParamsSchema = z.object({
  projectId: z.string().min(1, "projectId parameter is required"),
  milestone: z.nativeEnum(MilestoneType),
});
