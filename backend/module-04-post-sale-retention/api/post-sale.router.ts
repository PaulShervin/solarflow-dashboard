import { projectService } from "../services/project.service";
import { milestoneService } from "../services/milestone.service";
import { notificationService } from "../services/notification.service";
import { cancellationRiskService } from "../services/cancellation-risk.service";
import {
  CreateProjectSchema,
  StartMilestoneSchema,
  CompleteMilestoneSchema,
  CreateProjectUpdateSchema,
  RecalculateRiskSchema,
} from "../schemas/post-sale.schema";
import { MilestoneType } from "../models";

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Handles Module 04 Post-Sale Retention API requests.
 * Returns Response if path matches a Module 04 route, or null if unhandled.
 */
export async function handlePostSaleApi(request: Request, url: URL): Promise<Response | null> {
  const method = request.method.toUpperCase();
  const path = url.pathname;

  try {
    // ==========================================
    // ADMIN ENDPOINTS (/api/admin/projects/*)
    // ==========================================

    // 1. Create Project (POST /api/admin/projects)
    if (path === "/api/admin/projects" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const parse = CreateProjectSchema.safeParse(body);
      if (!parse.success) {
        return jsonResponse({ error: "Validation failed", details: parse.error.format() }, 400);
      }
      const project = projectService.createProject(parse.data);
      return jsonResponse({ success: true, project }, 201);
    }

    // 2. List Projects (GET /api/admin/projects)
    if (path === "/api/admin/projects" && method === "GET") {
      const statusFilter = url.searchParams.get("status") || undefined;
      const projects = projectService.getProjects({ status: statusFilter });
      return jsonResponse({ success: true, projects });
    }

    // Match route: /api/admin/projects/:projectId/...
    const adminProjectMatch = path.match(/^\/api\/admin\/projects\/([^/]+)(.*)$/);
    if (adminProjectMatch && adminProjectMatch[1] !== undefined && adminProjectMatch[2] !== undefined) {
      const projectId = adminProjectMatch[1];
      const subPath = adminProjectMatch[2];

      // 3. Get Project Detail (GET /api/admin/projects/:projectId)
      if (subPath === "" && method === "GET") {
        const project = projectService.getProject(projectId);
        if (!project) {
          return jsonResponse({ error: `Project not found: ${projectId}` }, 404);
        }
        const milestones = milestoneService.getMilestones(projectId);
        const currentRisk = cancellationRiskService.getLatestRisk(projectId);
        return jsonResponse({ success: true, project, currentRisk, milestones });
      }

      // 4. Get Project Milestones (GET /api/admin/projects/:projectId/milestones)
      if (subPath === "/milestones" && method === "GET") {
        const milestones = milestoneService.getMilestones(projectId);
        return jsonResponse({ success: true, milestones });
      }

      // 5. Start Milestone (POST /api/admin/projects/:projectId/milestones/:milestone/start)
      const startMilestoneMatch = subPath.match(/^\/milestones\/([^/]+)\/start$/);
      if (startMilestoneMatch && startMilestoneMatch[1] !== undefined && method === "POST") {
        const milestoneType = startMilestoneMatch[1].toUpperCase() as MilestoneType;
        const body = await request.json().catch(() => ({}));
        const parse = StartMilestoneSchema.safeParse(body);
        if (!parse.success) {
          return jsonResponse({ error: "Validation failed", details: parse.error.format() }, 400);
        }
        const milestone = milestoneService.startMilestone(projectId, milestoneType, parse.data);
        return jsonResponse({ success: true, milestone });
      }

      // 6. Complete Milestone (POST /api/admin/projects/:projectId/milestones/:milestone/complete)
      const completeMilestoneMatch = subPath.match(/^\/milestones\/([^/]+)\/complete$/);
      if (completeMilestoneMatch && completeMilestoneMatch[1] !== undefined && method === "POST") {
        const milestoneType = completeMilestoneMatch[1].toUpperCase() as MilestoneType;
        const body = await request.json().catch(() => ({}));
        const parse = CompleteMilestoneSchema.safeParse(body);
        if (!parse.success) {
          return jsonResponse({ error: "Validation failed", details: parse.error.format() }, 400);
        }
        const milestone = milestoneService.completeMilestone(projectId, milestoneType, parse.data);
        return jsonResponse({ success: true, milestone });
      }

      // 7. Get Project Updates (GET /api/admin/projects/:projectId/updates)
      if (subPath === "/updates" && method === "GET") {
        const updates = notificationService.getProjectUpdates(projectId, false);
        return jsonResponse({ success: true, updates });
      }

      // 8. Create Project Update (POST /api/admin/projects/:projectId/updates)
      if (subPath === "/updates" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const parse = CreateProjectUpdateSchema.safeParse(body);
        if (!parse.success) {
          return jsonResponse({ error: "Validation failed", details: parse.error.format() }, 400);
        }
        const update = notificationService.createProjectUpdate({ projectId, ...parse.data });
        return jsonResponse({ success: true, update }, 201);
      }

      // 9. Get Cancellation Risk (GET /api/admin/projects/:projectId/risk)
      if (subPath === "/risk" && method === "GET") {
        const currentRisk = cancellationRiskService.getLatestRisk(projectId);
        const history = cancellationRiskService.getRiskHistory(projectId);
        return jsonResponse({ success: true, currentRisk, history });
      }

      // 10. Recalculate Risk (POST /api/admin/projects/:projectId/risk/recalculate)
      if (subPath === "/risk/recalculate" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const parse = RecalculateRiskSchema.safeParse(body);
        if (!parse.success) {
          return jsonResponse({ error: "Validation failed", details: parse.error.format() }, 400);
        }
        const risk = cancellationRiskService.evaluateRisk({ projectId, ...parse.data });
        return jsonResponse({ success: true, risk });
      }
    }

    // ==========================================
    // CUSTOMER PORTAL ENDPOINTS (/api/projects/*)
    // ==========================================

    const customerProjectMatch = path.match(/^\/api\/projects\/([^/]+)(.*)$/);
    if (customerProjectMatch && customerProjectMatch[1] !== undefined && customerProjectMatch[2] !== undefined) {
      const projectId = customerProjectMatch[1];
      const subPath = customerProjectMatch[2];

      // 11. Get Portal Project Details (GET /api/projects/:projectId)
      if (subPath === "" && method === "GET") {
        const project = projectService.getProject(projectId);
        if (!project) {
          return jsonResponse({ error: `Project not found: ${projectId}` }, 404);
        }
        return jsonResponse({ success: true, project });
      }

      // 12. Get Portal Milestones (GET /api/projects/:projectId/milestones)
      if (subPath === "/milestones" && method === "GET") {
        const milestones = milestoneService.getMilestones(projectId);
        return jsonResponse({ success: true, milestones });
      }

      // 13. Get Portal Customer Updates (GET /api/projects/:projectId/updates)
      if (subPath === "/updates" && method === "GET") {
        const updates = notificationService.getCustomerUpdates(projectId);
        return jsonResponse({ success: true, updates });
      }
    }

    // Path did not match any Module 04 route
    return null;
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Internal Server Error" }, 500);
  }
}

import { Router } from "express";

/**
 * Creates an Express router instance for Module 04 Post-Sale Retention.
 */
export function createPostSaleExpressRouter(): Router {
  const router = Router();

  // 1. Create Project (POST /)
  router.post("/", (req, res) => {
    const parse = CreateProjectSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation failed", details: parse.error.format() });
      return;
    }
    const project = projectService.createProject(parse.data);
    res.status(201).json({ success: true, project });
  });

  // 2. List Projects (GET /)
  router.get("/", (req, res) => {
    const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;
    const projects = projectService.getProjects({ status: statusFilter });
    res.json({ success: true, projects });
  });

  // 3. Get Project Detail (GET /:projectId)
  router.get("/:projectId", (req, res) => {
    const project = projectService.getProject(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: `Project not found: ${req.params.projectId}` });
      return;
    }
    const milestones = milestoneService.getMilestones(req.params.projectId);
    const currentRisk = cancellationRiskService.getLatestRisk(req.params.projectId);
    res.json({ success: true, project, currentRisk, milestones });
  });

  // 4. Get Project Milestones (GET /:projectId/milestones)
  router.get("/:projectId/milestones", (req, res) => {
    const milestones = milestoneService.getMilestones(req.params.projectId);
    res.json({ success: true, milestones });
  });

  // 5. Start Milestone (POST /:projectId/milestones/:milestone/start)
  router.post("/:projectId/milestones/:milestone/start", (req, res) => {
    const milestoneType = req.params.milestone.toUpperCase() as MilestoneType;
    const parse = StartMilestoneSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation failed", details: parse.error.format() });
      return;
    }
    const milestone = milestoneService.startMilestone(req.params.projectId, milestoneType, parse.data);
    res.json({ success: true, milestone });
  });

  // 6. Complete Milestone (POST /:projectId/milestones/:milestone/complete)
  router.post("/:projectId/milestones/:milestone/complete", (req, res) => {
    const milestoneType = req.params.milestone.toUpperCase() as MilestoneType;
    const parse = CompleteMilestoneSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation failed", details: parse.error.format() });
      return;
    }
    const milestone = milestoneService.completeMilestone(req.params.projectId, milestoneType, parse.data);
    res.json({ success: true, milestone });
  });

  // 7. Get Project Updates (GET /:projectId/updates)
  router.get("/:projectId/updates", (req, res) => {
    const updates = notificationService.getProjectUpdates(req.params.projectId, false);
    res.json({ success: true, updates });
  });

  // 8. Create Project Update (POST /:projectId/updates)
  router.post("/:projectId/updates", (req, res) => {
    const parse = CreateProjectUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation failed", details: parse.error.format() });
      return;
    }
    const update = notificationService.createProjectUpdate({ projectId: req.params.projectId, ...parse.data });
    res.status(201).json({ success: true, update });
  });

  // 9. Get Cancellation Risk (GET /:projectId/risk)
  router.get("/:projectId/risk", (req, res) => {
    const currentRisk = cancellationRiskService.getLatestRisk(req.params.projectId);
    const history = cancellationRiskService.getRiskHistory(req.params.projectId);
    res.json({ success: true, currentRisk, history });
  });

  // 10. Recalculate Risk (POST /:projectId/risk/recalculate)
  router.post("/:projectId/risk/recalculate", (req, res) => {
    const parse = RecalculateRiskSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation failed", details: parse.error.format() });
      return;
    }
    const risk = cancellationRiskService.evaluateRisk({ projectId: req.params.projectId, ...parse.data });
    res.json({ success: true, risk });
  });

  return router;
}

