import express from "express";
import cors from "cors";
import { createNurtureExpressRouter } from "./module-03-contextual-nurture/api/nurture.router";
import { NurtureEngineService } from "./module-03-contextual-nurture/services/nurture-engine.service";
import { initDatabase } from "./module-03-contextual-nurture/repositories/db";
import { logger } from "./shared/logger";

// Initialize SQLite database store
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

// Express Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Nurture Engine Services & Express Router Mount
const engine = new NurtureEngineService();
app.use("/api/nurture", createNurtureExpressRouter(engine));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", path: req.path });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error("Express API Server Error", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 SolarFlow Backend Express Server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`=================================================`);
  console.log(`Ready for Postman and Frontend requests!`);
});

