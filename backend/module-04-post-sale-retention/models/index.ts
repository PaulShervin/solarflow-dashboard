// Enums
export enum ProjectStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum MilestoneType {
  SITE_SURVEY = "SITE_SURVEY",
  ENGINEERING = "ENGINEERING",
  PERMITTING = "PERMITTING",
  INSTALLATION = "INSTALLATION",
  INSPECTION = "INSPECTION",
  PTO = "PTO",
}

export enum MilestoneStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export type NotificationChannel = "PORTAL" | "SMS" | "EMAIL";
export type NotificationStatus = "CREATED" | "SENT" | "FAILED";
export type ReferralStatus = "TRIGGERED" | "CONTACTED" | "COMPLETED";

// Core Interfaces
export interface SolarProject {
  id: string;
  leadId: string;
  status: ProjectStatus;
  currentMilestone: MilestoneType;
  startDate: string;
  estimatedCompletionDate?: string | null | undefined;
  completedAt?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  milestoneType: MilestoneType;
  status: MilestoneStatus;
  startedAt?: string | null | undefined;
  completedAt?: string | null | undefined;
  notes?: string | null | undefined;
  updatedBy?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  milestoneId?: string | null | undefined;
  message: string;
  visibleToCustomer: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CancellationRisk {
  id: string;
  projectId: string;
  score: number; // 0-100
  riskLevel: RiskLevel;
  stalledDays: number;
  unresolvedInquiries: number;
  reason: string;
  evaluatedAt: string;
}

export interface ProjectNotification {
  id: string;
  projectId: string;
  milestoneId?: string | null | undefined;
  channel: NotificationChannel;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string | null | undefined;
}

export interface ReferralEvent {
  id: string;
  projectId: string;
  leadId: string;
  status: ReferralStatus;
  createdAt: string;
  completedAt?: string | null | undefined;
}

// Aliases for compatibility across backend conventions
export type SolarProjectModel = SolarProject;
export type ProjectMilestoneModel = ProjectMilestone;
export type ProjectUpdateModel = ProjectUpdate;
export type CancellationRiskModel = CancellationRisk;
export type ProjectNotificationModel = ProjectNotification;
export type ReferralEventModel = ReferralEvent;
