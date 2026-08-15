import { DomainEvent, EventType } from "../../shared/contracts/events";
import { logger } from "../../shared/logger";

type EventHandler<T = Record<string, unknown>> = (event: DomainEvent<T>) => Promise<void> | void;

class Module03EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();

  subscribe<T = Record<string, unknown>>(eventType: EventType, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);
    logger.debug(`Subscribed to event: ${eventType}`);
  }

  async publish<T = Record<string, unknown>>(event: DomainEvent<T>): Promise<void> {
    logger.info(`Publishing Event [${event.type}] for Lead [${event.leadId}]`, { eventId: event.id });
    const subscribers = this.handlers.get(event.type) || [];
    for (const handler of subscribers) {
      try {
        await handler(event as DomainEvent);
      } catch (err) {
        logger.error(`Error executing subscriber handler for event ${event.type}`, err, { eventId: event.id });
      }
    }
  }
}

export const eventBus = new Module03EventBus();
