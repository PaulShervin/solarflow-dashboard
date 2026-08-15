import http from "node:http";
import { NurtureRouter } from "./module-03-contextual-nurture/api/nurture.router";
import { NurtureEngineService } from "./module-03-contextual-nurture/services/nurture-engine.service";
import { initDatabase } from "./module-03-contextual-nurture/repositories/db";
import { logger } from "./shared/logger";

initDatabase();

const engine = new NurtureEngineService();
const router = new NurtureRouter(engine);

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // CORS Headers for Postman / Browser API calls
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const pathname = url.pathname;

  let body: any = {};
  if (req.method === "POST" || req.method === "PATCH") {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const rawBody = Buffer.concat(buffers).toString();
      if (rawBody) {
        body = JSON.parse(rawBody);
      }
    } catch {
      // empty or invalid JSON
    }
  }

  try {
    let result: any = null;

    // 1. GET /api/nurture/analytics
    if (req.method === "GET" && pathname === "/api/nurture/analytics") {
      result = router.getAnalytics();
    }
    // 2. GET /api/nurture/workflows
    else if (req.method === "GET" && pathname === "/api/nurture/workflows") {
      result = router.getWorkflows();
    }
    // 3. POST /api/nurture/workflows
    else if (req.method === "POST" && pathname === "/api/nurture/workflows") {
      result = router.createWorkflow(body);
    }
    // 4. GET /api/nurture/workflows/:id
    else if (req.method === "GET" && pathname.startsWith("/api/nurture/workflows/")) {
      const id = pathname.replace("/api/nurture/workflows/", "");
      result = router.getWorkflowById(id);
    }
    // 5. GET /api/nurture/messages
    else if (req.method === "GET" && pathname === "/api/nurture/messages") {
      result = router.getMessages();
    }
    // 6. GET /api/nurture/templates
    else if (req.method === "GET" && pathname === "/api/nurture/templates") {
      result = router.getTemplates();
    }
    // 7. POST /api/nurture/templates
    else if (req.method === "POST" && pathname === "/api/nurture/templates") {
      result = router.createTemplate(body);
    }
    // 8. GET /api/nurture/leads/:id
    else if (req.method === "GET" && pathname.startsWith("/api/nurture/leads/") && !pathname.endsWith("/enroll") && !pathname.endsWith("/pause") && !pathname.endsWith("/resume") && !pathname.endsWith("/cancel")) {
      const leadId = pathname.replace("/api/nurture/leads/", "");
      result = await router.getLeadNurture(leadId);
    }
    // 9. POST /api/nurture/leads/:id/enroll
    else if (req.method === "POST" && pathname.match(/\/api\/nurture\/leads\/[^/]+\/enroll$/)) {
      const leadId = pathname.split("/")[4];
      result = await router.enrollLead(leadId, body);
    }
    // 10. POST /api/nurture/leads/:id/pause
    else if (req.method === "POST" && pathname.match(/\/api\/nurture\/leads\/[^/]+\/pause$/)) {
      const enrollmentId = body.enrollmentId || pathname.split("/")[4];
      result = await router.pauseLeadNurture(enrollmentId);
    }
    // 11. POST /api/nurture/leads/:id/resume
    else if (req.method === "POST" && pathname.match(/\/api\/nurture\/leads\/[^/]+\/resume$/)) {
      const enrollmentId = body.enrollmentId || pathname.split("/")[4];
      result = await router.resumeLeadNurture(enrollmentId);
    }
    // 12. POST /api/nurture/leads/:id/cancel
    else if (req.method === "POST" && pathname.match(/\/api\/nurture\/leads\/[^/]+\/cancel$/)) {
      const enrollmentId = body.enrollmentId || pathname.split("/")[4];
      result = await router.cancelLeadNurture(enrollmentId);
    }
    // 13. POST /api/nurture/webhooks/sms
    else if (req.method === "POST" && pathname === "/api/nurture/webhooks/sms") {
      result = await router.handleSmsWebhook(body);
    }
    // 14. POST /api/nurture/webhooks/email
    else if (req.method === "POST" && pathname === "/api/nurture/webhooks/email") {
      result = await router.handleEmailWebhook(body);
    }
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Endpoint not found" }));
      return;
    }

    const statusCode = result?.status || (result?.error ? 400 : 200);
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (err: any) {
    logger.error("API Server Error", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message || "Internal server error" }));
  }
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 SolarFlow Backend API Server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`=================================================`);
  console.log(`Ready for Postman requests!`);
});
