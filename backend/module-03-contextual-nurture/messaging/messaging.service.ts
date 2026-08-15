import { NurtureRepository } from "../repositories/nurture.repository";
import { NurtureMessageModel, LeadModel, MessageChannel } from "../models";
import { config } from "../../shared/config";
import { logger } from "../../shared/logger";
import { eventBus } from "../events/event-bus";
import { v4 as uuidv4 } from "uuid";

export interface SmsProvider {
  name: string;
  sendSms(to: string, body: string): Promise<{ providerMessageId: string; status: "SENT" | "FAILED"; failureReason?: string }>;
}

export interface EmailProvider {
  name: string;
  sendEmail(to: string, subject: string, body: string): Promise<{ providerMessageId: string; status: "SENT" | "FAILED"; failureReason?: string }>;
}

export class MockSmsProvider implements SmsProvider {
  name = "MockTwilio";
  async sendSms(to: string, body: string) {
    logger.info(`[SMS SENT to ${to}]: ${body}`);
    return { providerMessageId: `SMS-${uuidv4().substring(0, 8)}`, status: "SENT" as const };
  }
}

export class MockEmailProvider implements EmailProvider {
  name = "MockResend";
  async sendEmail(to: string, subject: string, body: string) {
    logger.info(`[EMAIL SENT to ${to}] Subject: "${subject}" | Body: ${body.substring(0, 60)}...`);
    return { providerMessageId: `EML-${uuidv4().substring(0, 8)}`, status: "SENT" as const };
  }
}

export class MessagingService {
  private smsProvider: SmsProvider;
  private emailProvider: EmailProvider;

  constructor(smsProvider?: SmsProvider, emailProvider?: EmailProvider) {
    this.smsProvider = smsProvider || new MockSmsProvider();
    this.emailProvider = emailProvider || new MockEmailProvider();
  }

  /**
   * Check if current time is within allowed communication window (08:00 - 20:00 local).
   */
  isWithinAllowedWindow(now = new Date()): boolean {
    const hour = now.getHours();
    return hour >= config.messagingWindow.startHour && hour < config.messagingWindow.endHour;
  }

  /**
   * Calculate next valid communication window timestamp if outside allowed hours.
   */
  getNextValidWindowTimestamp(now = new Date()): string {
    const next = new Date(now);
    if (next.getHours() >= config.messagingWindow.endHour) {
      next.setDate(next.getDate() + 1);
    }
    next.setHours(config.messagingWindow.startHour, 0, 0, 0);
    return next.toISOString();
  }

  /**
   * Send an outgoing nurture message with frequency limits, idempotency & retry tracking.
   */
  async sendMessage(
    lead: LeadModel,
    channel: MessageChannel,
    body: string,
    subject?: string,
    idempotencyKey?: string
  ): Promise<NurtureMessageModel> {
    const key = idempotencyKey || `MSG-${lead.id}-${Date.now()}`;

    // 1. Idempotency Check
    const existingMsg = NurtureRepository.getMessageByIdempotencyKey(key);
    if (existingMsg) {
      logger.info(`Duplicate message submission prevented via idempotencyKey [${key}]`, { leadId: lead.id });
      return existingMsg;
    }

    // 2. Frequency Limit Check (Max SMS/Email per 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
    const sentCount = NurtureRepository.getSentMessagesCountInWindow(lead.id, twentyFourHoursAgo);
    const maxAllowed = channel === "SMS" ? config.limits.maxSmsPerDay : config.limits.maxEmailPerDay;

    if (sentCount >= maxAllowed) {
      logger.warn(`Daily message limit reached for lead [${lead.id}]. Skipping send.`, { channel, sentCount });
      throw new Error(`Daily messaging limit (${maxAllowed}) reached for lead ${lead.id}`);
    }

    // 3. Allowed Window Check
    const now = new Date();
    if (!this.isWithinAllowedWindow(now)) {
      const rescheduledTime = this.getNextValidWindowTimestamp(now);
      logger.info(`Outside messaging window (08:00-20:00). Message rescheduled to ${rescheduledTime}`, { leadId: lead.id });
      throw new Error(`Outside allowed communication window. Rescheduled to ${rescheduledTime}`);
    }

    // 4. Create Message Lifecycle Record: CREATED -> QUEUED
    const msg: NurtureMessageModel = {
      id: `MSG-${uuidv4().substring(0, 8)}`,
      leadId: lead.id,
      channel,
      status: "QUEUED",
      provider: channel === "SMS" ? this.smsProvider.name : this.emailProvider.name,
      recipient: channel === "SMS" ? lead.phone : lead.email,
      subject,
      body,
      createdAt: now.toISOString(),
      retryCount: 0,
      idempotencyKey: key,
    };

    NurtureRepository.saveMessage(msg);

    // 5. Execute Provider Dispatch
    try {
      if (channel === "SMS") {
        const res = await this.smsProvider.sendSms(msg.recipient, msg.body);
        if (res.status === "SENT") {
          msg.status = "DELIVERED";
          msg.providerMessageId = res.providerMessageId;
          msg.sentAt = new Date().toISOString();
          msg.deliveredAt = msg.sentAt;
        } else {
          msg.status = "FAILED";
          msg.failureReason = res.failureReason || "Provider failed";
        }
      } else {
        const res = await this.emailProvider.sendEmail(msg.recipient, msg.subject || "SolarPeak Update", msg.body);
        if (res.status === "SENT") {
          msg.status = "DELIVERED";
          msg.providerMessageId = res.providerMessageId;
          msg.sentAt = new Date().toISOString();
          msg.deliveredAt = msg.sentAt;
        } else {
          msg.status = "FAILED";
          msg.failureReason = res.failureReason || "Provider failed";
        }
      }
    } catch (err: any) {
      msg.status = "FAILED";
      msg.failureReason = err?.message || "Transmission exception";
      msg.retryCount += 1;
    }

    NurtureRepository.saveMessage(msg);

    // 6. Emit Events
    await eventBus.publish({
      id: uuidv4(),
      type: msg.status === "DELIVERED" ? "NURTURE_MESSAGE_SENT" : "NURTURE_MESSAGE_FAILED",
      timestamp: new Date().toISOString(),
      leadId: lead.id,
      source: "MessagingService",
      data: { messageId: msg.id, channel, status: msg.status },
    });

    return msg;
  }
}
