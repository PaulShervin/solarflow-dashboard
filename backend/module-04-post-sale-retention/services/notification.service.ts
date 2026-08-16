import crypto from "crypto";
import { postSaleRepository, PostSaleRepository } from "../repositories/post-sale.repository";
import {
  ProjectUpdate,
  ProjectNotification,
  NotificationChannel,
  NotificationStatus,
} from "../models";

export class NotificationService {
  constructor(private repository: PostSaleRepository = postSaleRepository) {}

  /**
   * Creates a project update entry.
   * Automatically generates a portal notification if visible to customer.
   */
  createProjectUpdate(params: {
    projectId: string;
    milestoneId?: string | undefined;
    message: string;
    visibleToCustomer?: boolean | undefined;
    createdBy?: string | undefined;
  }): ProjectUpdate {
    const now = new Date().toISOString();
    const isVisible = params.visibleToCustomer !== false;

    const update: ProjectUpdate = {
      id: `UPD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      projectId: params.projectId,
      milestoneId: params.milestoneId ?? null,
      message: params.message,
      visibleToCustomer: isVisible,
      createdBy: params.createdBy || "ADMIN",
      createdAt: now,
    };

    this.repository.createProjectUpdate(update);

    if (isVisible) {
      this.createNotification({
        projectId: params.projectId,
        milestoneId: params.milestoneId,
        channel: "PORTAL",
        message: params.message,
      });
    }

    return update;
  }

  /**
   * Retrieves all updates for a project.
   */
  getProjectUpdates(projectId: string, customerOnly: boolean = false): ProjectUpdate[] {
    return this.repository.getProjectUpdates(projectId, customerOnly);
  }

  /**
   * Retrieves customer-visible updates filtered for the customer portal.
   */
  getCustomerUpdates(projectId: string): ProjectUpdate[] {
    return this.getProjectUpdates(projectId, true);
  }

  /**
   * Creates a customer notification record.
   */
  createNotification(params: {
    projectId: string;
    milestoneId?: string | undefined;
    channel?: NotificationChannel | undefined;
    message: string;
  }): ProjectNotification {
    const now = new Date().toISOString();
    const notification: ProjectNotification = {
      id: `NOTIF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      projectId: params.projectId,
      milestoneId: params.milestoneId ?? null,
      channel: params.channel || "PORTAL",
      message: params.message,
      status: "CREATED",
      createdAt: now,
      sentAt: null,
    };

    return this.repository.createNotification(notification);
  }

  /**
   * Retrieves notification history for a project.
   */
  getNotifications(projectId: string): ProjectNotification[] {
    return this.repository.getNotifications(projectId);
  }

  /**
   * Marks a notification as SENT.
   */
  markNotificationSent(notificationId: string): void {
    const now = new Date().toISOString();
    this.repository.updateNotificationStatus(notificationId, "SENT", now);
  }
}

export const notificationService = new NotificationService();
