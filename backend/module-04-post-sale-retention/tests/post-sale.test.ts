import { projectService } from "../services/project.service";
import { milestoneService } from "../services/milestone.service";
import { notificationService } from "../services/notification.service";
import { cancellationRiskService } from "../services/cancellation-risk.service";
import { referralService } from "../services/referral.service";
import { postSaleRepository } from "../repositories/post-sale.repository";
import { handleApiRequest } from "../../../src/server/apiRouter";
import {
  ProjectStatus,
  MilestoneType,
  MilestoneStatus,
  RiskLevel,
} from "../models";

async function runTestSuite() {
  console.log("==================================================");
  console.log("MODULE 04 POST-SALE RETENTION ENGINE TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const testLeadId = `LEAD-SUITE-${Date.now()}`;

  // ----------------------------------------------------
  // 1. Project Service Tests
  // ----------------------------------------------------
  console.log("--- 1. Testing Project Service ---");
  const project = projectService.createProject({ leadId: testLeadId, estimatedCompletionDate: "2026-12-31" });
  assert(project.id.startsWith("PROJ-"), "Project ID generated with PROJ- prefix");
  assert(project.status === ProjectStatus.ACTIVE, "Initial project status is ACTIVE");
  assert(project.currentMilestone === MilestoneType.SITE_SURVEY, "Initial milestone is SITE_SURVEY");

  const duplicate = projectService.createProject({ leadId: testLeadId });
  assert(duplicate.id === project.id, "Deduplication prevents creating second project for same leadId");

  const foundByLead = projectService.getProjectByLeadId(testLeadId);
  assert(foundByLead?.id === project.id, "getProjectByLeadId returns correct project");

  // ----------------------------------------------------
  // 2. Milestone Service & State Machine Tests
  // ----------------------------------------------------
  console.log("\n--- 2. Testing Milestone Service & State Machine ---");
  const milestones = milestoneService.getMilestones(project.id);
  assert(milestones.length === 6, "Initial project has exactly 6 milestones initialized");

  let invalidTransitionBlocked = false;
  try {
    milestoneService.completeMilestone(project.id, MilestoneType.PTO);
  } catch (e: any) {
    invalidTransitionBlocked = true;
  }
  assert(invalidTransitionBlocked, "Invalid milestone transition (SITE_SURVEY -> PTO) blocked by state machine");

  const completedSurvey = milestoneService.completeMilestone(project.id, MilestoneType.SITE_SURVEY, {
    notes: "Site survey completed cleanly.",
  });
  assert(completedSurvey.status === MilestoneStatus.COMPLETED, "SITE_SURVEY milestone marked COMPLETED");

  const nextMilestone = milestoneService.getMilestone(project.id, MilestoneType.ENGINEERING);
  assert(nextMilestone?.status === MilestoneStatus.IN_PROGRESS, "ENGINEERING milestone auto-started IN_PROGRESS");

  // ----------------------------------------------------
  // 3. Cancellation Risk Engine Tests
  // ----------------------------------------------------
  console.log("\n--- 3. Testing Cancellation Risk Engine ---");
  const scoreLow = cancellationRiskService.calculateRiskScore(1, 0);
  assert(scoreLow === 12 && cancellationRiskService.determineRiskLevel(scoreLow) === RiskLevel.LOW, "Risk score 12 resolves to LOW");

  const scoreMed = cancellationRiskService.calculateRiskScore(3, 1);
  assert(scoreMed === 51 && cancellationRiskService.determineRiskLevel(scoreMed) === RiskLevel.MEDIUM, "Risk score 51 resolves to MEDIUM");

  const scoreHigh = cancellationRiskService.calculateRiskScore(5, 2);
  assert(scoreHigh === 90 && cancellationRiskService.determineRiskLevel(scoreHigh) === RiskLevel.HIGH, "Risk score 90 resolves to HIGH");

  const riskRecord = cancellationRiskService.evaluateRisk({
    projectId: project.id,
    stalledDays: 5,
    unresolvedInquiries: 2,
  });
  assert(riskRecord.riskLevel === RiskLevel.HIGH, "Risk evaluation recorded HIGH risk");

  const updates = postSaleRepository.getProjectUpdates(project.id, false);
  const hasEscalationAlert = updates.some((u) => u.message.includes("HIGH CANCELLATION RISK DETECTED"));
  assert(hasEscalationAlert, "High-risk evaluation automatically logged admin escalation alert update");

  // ----------------------------------------------------
  // 4. Notification & Customer Update Tests
  // ----------------------------------------------------
  console.log("\n--- 4. Testing Notification & Customer Update Service ---");
  const customerUpdate = notificationService.createProjectUpdate({
    projectId: project.id,
    message: "Engineering designs have been uploaded to portal.",
    visibleToCustomer: true,
  });
  assert(customerUpdate.visibleToCustomer, "Project update marked visible to customer");

  const internalUpdate = notificationService.createProjectUpdate({
    projectId: project.id,
    message: "Internal memo: Vendor quotes checked.",
    visibleToCustomer: false,
  });

  const portalUpdates = notificationService.getCustomerUpdates(project.id);
  assert(portalUpdates.some((u) => u.id === customerUpdate.id), "Customer updates include visible update");
  assert(!portalUpdates.some((u) => u.id === internalUpdate.id), "Customer updates exclude internal memo");

  // ----------------------------------------------------
  // 5. Complete Remaining Milestones & Test Referral
  // ----------------------------------------------------
  console.log("\n--- 5. Testing Full Project Completion & Referral Trigger ---");
  milestoneService.completeMilestone(project.id, MilestoneType.ENGINEERING);
  milestoneService.completeMilestone(project.id, MilestoneType.PERMITTING);
  milestoneService.completeMilestone(project.id, MilestoneType.INSTALLATION);
  milestoneService.completeMilestone(project.id, MilestoneType.INSPECTION);
  milestoneService.completeMilestone(project.id, MilestoneType.PTO);

  const completedProject = projectService.getProject(project.id);
  assert(completedProject?.status === ProjectStatus.COMPLETED, "Project status auto-completed after PTO");

  const referral = await referralService.triggerReferral(project.id, testLeadId);
  assert(referral.status === "TRIGGERED", "Referral event triggered upon project completion");

  const updatedReferral = referralService.updateReferralStatus(project.id, "COMPLETED");
  assert(updatedReferral.status === "COMPLETED" && updatedReferral.completedAt !== null, "Referral status updated to COMPLETED");

  // ----------------------------------------------------
  // 6. E2E API Router Integration Tests
  // ----------------------------------------------------
  console.log("\n--- 6. Testing API Endpoints ---");
  const apiLeadId = `LEAD-API-TEST-${Date.now()}`;
  const createReq = new Request("http://localhost:3000/api/admin/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId: apiLeadId }),
  });
  const createRes = await handleApiRequest(createReq, new URL(createReq.url));
  assert(createRes.status === 201, "POST /api/admin/projects returns 201 Created");

  const apiProj = (await createRes.json()).project;

  const getReq = new Request(`http://localhost:3000/api/projects/${apiProj.id}`);
  const getRes = await handleApiRequest(getReq, new URL(getReq.url));
  assert(getRes.status === 200, "GET /api/projects/:id returns 200 OK for Customer Portal");

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
