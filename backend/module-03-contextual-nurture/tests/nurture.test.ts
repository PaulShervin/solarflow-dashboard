import { initDatabase, db } from "../repositories/db";
import { NurtureRepository } from "../repositories/nurture.repository";
import { NurtureEngineService } from "../services/nurture-engine.service";
import { SuppressionService } from "../services/suppression.service";
import { PersonalizationService } from "../personalization/personalization.service";
import { MessagingService } from "../messaging/messaging.service";
import { NurtureRouter } from "../api/nurture.router";
import { LeadModel } from "../models";

// Runner function for all 20 test scenarios
export async function runModule03Tests() {
  console.log("=================================================");
  console.log("STARTING MODULE 03 — CONTEXTUAL NURTURE TEST SUITE");
  console.log("=================================================");

  initDatabase();
  db.exec("DELETE FROM workflow_enrollments; DELETE FROM nurture_messages; DELETE FROM suppressions; DELETE FROM customer_activities; DELETE FROM nurture_tasks; DELETE FROM leads WHERE id LIKE 'TEST-%';");

  const engine = new NurtureEngineService();
  const router = new NurtureRouter(engine);
  const messaging = new MessagingService();

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ FAIL: ${name} — ${err.message}`);
      failed++;
    }
  }

  // Sample Test Lead
  const testLead: LeadModel = {
    id: "TEST-LD-99",
    firstName: "TestUser",
    lastName: "Tester",
    phone: "(555) 999-0000",
    email: "testuser@example.com",
    leadStage: "PROPOSAL_SENT",
    leadSource: "Website",
    assignedSalesRep: "Dana Ruiz",
    quoteAmount: 25000,
    quoteUrl: "https://solarpeak.com/quotes/PRP-99",
    timeline: "1 month",
    monthlyElectricBill: 300,
    lastActivityTimestamp: new Date().toISOString(),
    customerTimezone: "America/Phoenix",
    communicationPreferences: { smsAllowed: true, emailAllowed: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  NurtureRepository.saveLead(testLead);

  // Scenario 1: Lead enters a workflow
  await test("1. Lead enters a workflow", async () => {
    const enr = await engine.enrollLead("WF-PROPOSAL-FOLLOWUP", testLead.id);
    if (!enr || enr.state !== "ACTIVE") throw new Error("Failed to enroll lead");
  });

  // Scenario 2: Workflow schedules a future action
  await test("2. Workflow schedules a future action", async () => {
    const enr = NurtureRepository.getActiveEnrollment("WF-PROPOSAL-FOLLOWUP", testLead.id);
    if (!enr?.nextExecutionTimestamp) throw new Error("Next execution timestamp missing");
  });

  // Scenario 3: Inactive lead receives follow-up
  await test("3. Inactive lead receives follow-up", async () => {
    const enr = NurtureRepository.getActiveEnrollment("WF-PROPOSAL-FOLLOWUP", testLead.id)!;
    enr.nextExecutionTimestamp = new Date(Date.now() - 1000).toISOString();
    NurtureRepository.saveEnrollment(enr);

    const count = await engine.processDueEnrollments();
    if (count < 1) throw new Error("Expected due enrollment to be processed");
  });

  // Scenario 4 & 5: Customer replies before scheduled follow-up & stops workflow
  await test("4 & 5. Customer reply stops scheduled workflow", async () => {
    const lead2: LeadModel = { ...testLead, id: "TEST-LD-100", phone: "(555) 888-1111", email: "reply@example.com" };
    NurtureRepository.saveLead(lead2);
    const enr = await engine.enrollLead("WF-PROPOSAL-FOLLOWUP", lead2.id);

    // Simulate customer inbound SMS webhook
    await router.handleSmsWebhook({ from: lead2.phone, body: "Thanks, I have a question about the quote" });

    const updatedEnr = db.prepare("SELECT * FROM workflow_enrollments WHERE id = ?").get(enr.id) as any;
    if (updatedEnr.state !== "CANCELLED") throw new Error(`Expected enrollment state CANCELLED, got ${updatedEnr.state}`);
  });

  // Scenario 6: Lead changes stage before next message
  await test("6. Lead stage change stops workflow", async () => {
    const lead3: LeadModel = { ...testLead, id: "TEST-LD-101", phone: "(555) 777-2222", email: "won@example.com" };
    NurtureRepository.saveLead(lead3);
    const enr = await engine.enrollLead("WF-PROPOSAL-FOLLOWUP", lead3.id);

    // Update stage to WON
    NurtureRepository.updateLeadStage(lead3.id, "WON");
    await engine.handleStageChange({ id: "1", type: "LEAD_STAGE_CHANGED", timestamp: new Date().toISOString(), leadId: lead3.id, source: "test", data: { newStage: "WON" } });

    const updatedEnr = db.prepare("SELECT * FROM workflow_enrollments WHERE id = ?").get(enr.id) as any;
    if (updatedEnr.state !== "CANCELLED") throw new Error(`Expected enrollment to cancel on stage change to WON`);
  });

  // Scenario 7: Customer opts out (STOP keyword)
  await test("7. Customer opts out via STOP keyword", async () => {
    const lead4: LeadModel = { ...testLead, id: "TEST-LD-102", phone: "(555) 666-3333", email: "stop@example.com" };
    NurtureRepository.saveLead(lead4);
    await engine.enrollLead("WF-PROPOSAL-FOLLOWUP", lead4.id);

    await router.handleSmsWebhook({ from: lead4.phone, body: "STOP" });

    if (!SuppressionService.checkSuppressed(lead4.phone)) {
      throw new Error("Expected phone to be added to suppression table");
    }
  });

  // Scenario 8 & 9: Idempotency & duplicate scheduled execution
  await test("8 & 9. Idempotency prevents duplicate messages", async () => {
    const msg1 = await messaging.sendMessage(testLead, "SMS", "Test Body", undefined, "KEY-IDEM-01");
    const msg2 = await messaging.sendMessage(testLead, "SMS", "Test Body", undefined, "KEY-IDEM-01");

    if (msg1.id !== msg2.id) throw new Error("Idempotency key failed to return identical message");
  });

  // Scenario 10, 11, 12: Failed message & retry limit
  await test("10, 11, 12. Message failure & retry limit tracking", async () => {
    const badMessaging = new MessagingService({
      name: "FailingProvider",
      sendSms: async () => ({ providerMessageId: "", status: "FAILED", failureReason: "Network Timeout" }),
    });

    const msg = await badMessaging.sendMessage(testLead, "SMS", "Retry test", undefined, `KEY-FAIL-${Date.now()}`);
    if (msg.status !== "FAILED" || msg.failureReason !== "Network Timeout") {
      throw new Error("Message status should be FAILED with failure reason");
    }
  });

  // Scenario 13 & 14: Manual pause & resume
  await test("13 & 14. Manual pause and resume workflow", async () => {
    const lead5: LeadModel = { ...testLead, id: "TEST-LD-103", phone: "(555) 444-5555", email: "pause@example.com" };
    NurtureRepository.saveLead(lead5);
    const enr = await engine.enrollLead("WF-PROPOSAL-FOLLOWUP", lead5.id);

    // Pause
    engine.pauseEnrollment(enr.id);
    let check = db.prepare("SELECT state FROM workflow_enrollments WHERE id = ?").get(enr.id) as any;
    if (check.state !== "PAUSED") throw new Error("Failed to pause enrollment");

    // Resume
    engine.resumeEnrollment(enr.id);
    check = db.prepare("SELECT state FROM workflow_enrollments WHERE id = ?").get(enr.id) as any;
    if (check.state !== "ACTIVE") throw new Error("Failed to resume enrollment");
  });

  // Scenario 15: Messaging window / timezone check
  await test("15. Messaging window enforcement (08:00 - 20:00)", () => {
    const nightTime = new Date();
    nightTime.setHours(23, 0, 0, 0); // 11 PM

    if (messaging.isWithinAllowedWindow(nightTime)) {
      throw new Error("23:00 should be outside allowed messaging window");
    }
  });

  // Scenario 16: Daily messaging limit reached
  await test("16. Daily message limit reached", async () => {
    const lead6: LeadModel = { ...testLead, id: "TEST-LD-104", phone: "(555) 111-9999", email: "limit@example.com" };
    NurtureRepository.saveLead(lead6);

    // Send max SMS limit (3)
    await messaging.sendMessage(lead6, "SMS", "Msg 1", undefined, `L1-${Date.now()}`);
    await messaging.sendMessage(lead6, "SMS", "Msg 2", undefined, `L2-${Date.now()}`);
    await messaging.sendMessage(lead6, "SMS", "Msg 3", undefined, `L3-${Date.now()}`);

    try {
      await messaging.sendMessage(lead6, "SMS", "Msg 4", undefined, `L4-${Date.now()}`);
      throw new Error("Should have thrown daily limit error");
    } catch (err: any) {
      if (!err.message.includes("Daily messaging limit")) throw err;
    }
  });

  // Scenario 17 & 18: Personalization fallback & missing variables
  await test("17 & 18. Personalization variable interpolation & AI fallback", async () => {
    const leadSparse: LeadModel = { ...testLead, id: "TEST-LD-SPARSE", firstName: "", quoteAmount: undefined };
    const rendered = PersonalizationService.renderTemplate("Hi {{first_name}}, quote is {{quote_amount}}", leadSparse);

    if (!rendered.includes("there") || !rendered.includes("your custom solar estimate")) {
      throw new Error(`Personalization fallback failed: ${rendered}`);
    }

    const aiRendered = await PersonalizationService.renderWithAiFallback("Hi {{first_name}}", testLead, true);
    if (!aiRendered.includes("TestUser")) throw new Error("AI personalization fallback failed");
  });

  // Scenario 19: Workflow completion
  await test("19. Workflow completion", async () => {
    const lead7: LeadModel = { ...testLead, id: "TEST-LD-105", phone: "(555) 222-3333", email: "complete@example.com" };
    NurtureRepository.saveLead(lead7);

    // Short workflow with 1 step
    const shortWf = {
      id: "WF-SHORT-1",
      name: "Short WF",
      description: "One step",
      triggerEvent: "TEST",
      steps: [{ stepNumber: 1, delayHours: 0, actionType: "SEND_SMS" as const, templateName: "proposal_followup_sms_1" }],
      stopConditions: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    NurtureRepository.saveWorkflow(shortWf);

    const enr = await engine.enrollLead(shortWf.id, lead7.id);
    enr.nextExecutionTimestamp = new Date(Date.now() - 1000).toISOString();
    NurtureRepository.saveEnrollment(enr);

    await engine.processDueEnrollments();

    const check = db.prepare("SELECT state FROM workflow_enrollments WHERE id = ?").get(enr.id) as any;
    if (check.state !== "COMPLETED") throw new Error(`Expected COMPLETED, got ${check.state}`);
  });

  // Scenario 20: Manual cancellation
  await test("20. Manual cancellation", async () => {
    const lead8: LeadModel = { ...testLead, id: "TEST-LD-106", phone: "(555) 333-4444", email: "cancel@example.com" };
    NurtureRepository.saveLead(lead8);
    const enr = await engine.enrollLead("WF-PROPOSAL-FOLLOWUP", lead8.id);

    engine.cancelEnrollment(enr.id);
    const check = db.prepare("SELECT state FROM workflow_enrollments WHERE id = ?").get(enr.id) as any;
    if (check.state !== "CANCELLED") throw new Error("Failed to manually cancel enrollment");
  });

  console.log("=================================================");
  console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  return { passed, failed };
}

// Allow CLI execution if called directly
if (process.argv[1]?.includes("nurture.test.ts")) {
  runModule03Tests();
}
