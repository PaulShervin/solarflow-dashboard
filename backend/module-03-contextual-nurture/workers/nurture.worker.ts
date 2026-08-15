import { NurtureEngineService } from "../services/nurture-engine.service";
import { logger } from "../../shared/logger";

export class NurtureWorker {
  private engine: NurtureEngineService;
  private intervalId?: NodeJS.Timeout;

  constructor(engine?: NurtureEngineService) {
    this.engine = engine || new NurtureEngineService();
  }

  start(intervalMs = 15000): void {
    logger.info(`Starting NurtureWorker polling every ${intervalMs}ms...`);
    this.intervalId = setInterval(async () => {
      try {
        const processed = await this.engine.processDueEnrollments();
        if (processed > 0) {
          logger.info(`NurtureWorker tick processed ${processed} due enrollments`);
        }
      } catch (err) {
        logger.error("NurtureWorker tick error", err);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      logger.info("NurtureWorker stopped.");
    }
  }

  async tickOnce(): Promise<number> {
    return this.engine.processDueEnrollments();
  }
}
