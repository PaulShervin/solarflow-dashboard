import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { logger } from "../../shared/logger";

const require = createRequire(import.meta.url);

export let db: any;
let isInMemoryFallback = false;

// Simple in-memory KV database fallback if native better-sqlite3 bindings are unavailable
class InMemoryDb {
  private tables: Record<string, any[]> = {
    leads: [],
    customer_activities: [],
    workflows: [],
    workflow_enrollments: [],
    workflow_executions: [],
    nurture_messages: [],
    message_templates: [],
    suppressions: [],
    nurture_tasks: [],
    audit_events: [],
  };

  exec(_sql: string) {}

  prepare(sql: string) {
    const self = this;
    const lower = sql.trim().toLowerCase();

    return {
      run(...args: any[]) {
        if (lower.startsWith("insert into leads")) {
          const lead = {
            id: args[0], firstName: args[1], lastName: args[2], phone: args[3], email: args[4],
            leadStage: args[5], leadSource: args[6], campaign: args[7], assignedSalesRep: args[8],
            quoteAmount: args[9], quoteUrl: args[10], timeline: args[11], monthlyElectricBill: args[12],
            appointmentDate: args[13], lastActivityTimestamp: args[14], customerTimezone: args[15],
            communicationPreferences: args[16], createdAt: args[17], updatedAt: args[18]
          };
          self.tables.leads = self.tables.leads.filter((l) => l.id !== lead.id);
          self.tables.leads.push(lead);
        } else if (lower.startsWith("update leads set leadstage")) {
          const lead = self.tables.leads.find((l) => l.id === args[2]);
          if (lead) { lead.leadStage = args[0]; lead.updatedAt = args[1]; }
        } else if (lower.startsWith("update leads set lastactivitytimestamp")) {
          const lead = self.tables.leads.find((l) => l.id === args[2]);
          if (lead) { lead.lastActivityTimestamp = args[0]; lead.updatedAt = args[1]; }
        } else if (lower.startsWith("insert into customer_activities")) {
          self.tables.customer_activities.push({ id: args[0], leadId: args[1], activityType: args[2], timestamp: args[3], source: args[4], metadata: args[5] });
        } else if (lower.startsWith("insert into workflows")) {
          const wf = { id: args[0], name: args[1], description: args[2], triggerEvent: args[3], conditions: args[4], steps: args[5], stopConditions: args[6], isActive: args[7], createdAt: args[8], updatedAt: args[9] };
          self.tables.workflows = self.tables.workflows.filter((w) => w.id !== wf.id);
          self.tables.workflows.push(wf);
        } else if (lower.startsWith("insert into workflow_enrollments")) {
          const enr = { id: args[0], workflowId: args[1], leadId: args[2], currentStepIndex: args[3], state: args[4], enrolledAt: args[5], nextExecutionTimestamp: args[6], executionCount: args[7], lastActionAt: args[8], reasonForStopping: args[9] };
          self.tables.workflow_enrollments = self.tables.workflow_enrollments.filter((e) => e.id !== enr.id);
          self.tables.workflow_enrollments.push(enr);
        } else if (lower.startsWith("insert into nurture_messages")) {
          const msg = { id: args[0], leadId: args[1], channel: args[2], status: args[3], provider: args[4], providerMessageId: args[5], recipient: args[6], subject: args[7], body: args[8], createdAt: args[9], sentAt: args[10], deliveredAt: args[11], failureReason: args[12], retryCount: args[13], idempotencyKey: args[14] };
          self.tables.nurture_messages = self.tables.nurture_messages.filter((m) => m.id !== msg.id);
          self.tables.nurture_messages.push(msg);
        } else if (lower.startsWith("insert into message_templates")) {
          const tpl = { id: args[0], name: args[1], channel: args[2], subject: args[3], body: args[4], stage: args[5], purpose: args[6], variables: args[7], isActive: args[8], version: args[9], createdAt: args[10], updatedAt: args[11] };
          self.tables.message_templates = self.tables.message_templates.filter((t) => t.id !== tpl.id);
          self.tables.message_templates.push(tpl);
        } else if (lower.startsWith("insert into suppressions")) {
          self.tables.suppressions.push({ id: args[0], leadId: args[1], identifier: args[2], reason: args[3], createdAt: args[4] });
        } else if (lower.startsWith("insert into nurture_tasks")) {
          self.tables.nurture_tasks.push({ id: args[0], leadId: args[1], title: args[2], detail: args[3], priority: args[4], owner: args[5], done: args[6], type: args[7], createdAt: args[8] });
        } else if (lower.startsWith("insert into audit_events")) {
          self.tables.audit_events.push({ id: args[0], eventType: args[1], leadId: args[2], timestamp: args[3], actor: args[4], context: args[5] });
        }
        return { changes: 1 };
      },
      get(...args: any[]) {
        if (lower.startsWith("select count(*) as cnt from leads")) return { cnt: self.tables.leads.length };
        if (lower.startsWith("select * from leads where id = ?")) return self.tables.leads.find((l) => l.id === args[0]);
        if (lower.startsWith("select * from leads where phone = ?")) return self.tables.leads.find((l) => l.phone === args[0] || l.email === args[1]);
        if (lower.startsWith("select * from workflows where id = ?")) return self.tables.workflows.find((w) => w.id === args[0]);
        if (lower.startsWith("select * from workflow_enrollments where workflowid = ? and leadid = ? and state = 'active'")) {
          return self.tables.workflow_enrollments.find((e) => e.workflowId === args[0] && e.leadId === args[1] && e.state === "ACTIVE");
        }
        if (lower.includes("from workflow_enrollments where id = ?")) return self.tables.workflow_enrollments.find((e) => e.id === args[0]);
        if (lower.includes("from nurture_messages where idempotencykey = ?")) return self.tables.nurture_messages.find((m) => m.idempotencyKey === args[0]);
        if (lower.includes("from message_templates where name = ?")) return self.tables.message_templates.find((t) => t.name === args[0]);
        if (lower.includes("from suppressions where identifier = ?")) return self.tables.suppressions.find((s) => s.identifier === args[0]);
        if (lower.includes("select count(*) as count from workflows where isactive = 1")) return { count: self.tables.workflows.filter((w) => w.isActive).length };
        if (lower.includes("select count(distinct leadid) as count from workflow_enrollments where state = 'active'")) return { count: new Set(self.tables.workflow_enrollments.filter((e) => e.state === "ACTIVE").map((e) => e.leadId)).size };
        if (lower.includes("select count(*) as count from nurture_messages where status in ('sent', 'delivered')")) return { count: self.tables.nurture_messages.filter((m) => m.status === "SENT" || m.status === "DELIVERED").length };
        if (lower.includes("select count(*) as count from nurture_messages where status = 'delivered'")) return { count: self.tables.nurture_messages.filter((m) => m.status === "DELIVERED").length };
        if (lower.includes("select count(*) as count from nurture_messages where status = 'failed'")) return { count: self.tables.nurture_messages.filter((m) => m.status === "FAILED").length };
        if (lower.includes("select count(*) as count from suppressions")) return { count: self.tables.suppressions.length };
        if (lower.includes("select count(*) as count from workflow_enrollments where state = 'completed'")) return { count: self.tables.workflow_enrollments.filter((e) => e.state === "COMPLETED").length };
        if (lower.includes("select count(*) as count from workflow_enrollments where state = 'cancelled'")) return { count: self.tables.workflow_enrollments.filter((e) => e.state === "CANCELLED").length };
        if (lower.includes("select count(*) as count from nurture_messages")) return { count: self.tables.nurture_messages.filter((m) => m.leadId === args[0] && m.createdAt >= args[1]).length };
        return undefined;
      },
      all(...args: any[]) {
        if (lower.startsWith("select * from workflows where triggerevent = ?")) return self.tables.workflows.filter((w) => w.triggerEvent === args[0] && w.isActive);
        if (lower.startsWith("select * from workflows order by")) return self.tables.workflows;
        if (lower.startsWith("select * from workflow_enrollments where leadid = ? and state = 'active'")) return self.tables.workflow_enrollments.filter((e) => e.leadId === args[0] && e.state === "ACTIVE");
        if (lower.startsWith("select * from workflow_enrollments")) return self.tables.workflow_enrollments.filter((e) => e.state === "ACTIVE" && e.nextExecutionTimestamp && e.nextExecutionTimestamp <= args[0]);
        if (lower.startsWith("select * from customer_activities where leadid = ?")) return self.tables.customer_activities.filter((a) => a.leadId === args[0]).slice(0, args[1] || 10);
        if (lower.startsWith("select * from nurture_messages where leadid = ?")) return self.tables.nurture_messages.filter((m) => m.leadId === args[0]);
        if (lower.startsWith("select * from nurture_messages order by")) return self.tables.nurture_messages;
        if (lower.startsWith("select * from message_templates")) return self.tables.message_templates;
        if (lower.startsWith("select * from nurture_tasks where leadid = ?")) return self.tables.nurture_tasks.filter((t) => t.leadId === args[0]);
        return [];
      },
    };
  }
}

try {
  const Database = require(path.resolve(process.cwd(), "frontend", "node_modules", "better-sqlite3"));
  const dbDir = path.resolve(process.cwd(), "backend", "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, "solarflow_nurture.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  logger.info(`Better-sqlite3 connected at ${dbPath}`);
} catch {
  logger.info("Using lightweight in-memory storage engine for Module 03");
  db = new InMemoryDb();
  isInMemoryFallback = true;
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, phone TEXT, email TEXT, leadStage TEXT, leadSource TEXT, campaign TEXT, assignedSalesRep TEXT, quoteAmount REAL, quoteUrl TEXT, timeline TEXT, monthlyElectricBill REAL, appointmentDate TEXT, lastActivityTimestamp TEXT, customerTimezone TEXT, communicationPreferences TEXT, createdAt TEXT, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS customer_activities (id TEXT PRIMARY KEY, leadId TEXT, activityType TEXT, timestamp TEXT, source TEXT, metadata TEXT);
    CREATE TABLE IF NOT EXISTS workflows (id TEXT PRIMARY KEY, name TEXT, description TEXT, triggerEvent TEXT, conditions TEXT, steps TEXT, stopConditions TEXT, isActive INTEGER, createdAt TEXT, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS workflow_enrollments (id TEXT PRIMARY KEY, workflowId TEXT, leadId TEXT, currentStepIndex INTEGER, state TEXT, enrolledAt TEXT, nextExecutionTimestamp TEXT, executionCount INTEGER, lastActionAt TEXT, reasonForStopping TEXT);
    CREATE TABLE IF NOT EXISTS workflow_executions (id TEXT PRIMARY KEY, enrollmentId TEXT, stepIndex INTEGER, executedAt TEXT, status TEXT, details TEXT);
    CREATE TABLE IF NOT EXISTS nurture_messages (id TEXT PRIMARY KEY, leadId TEXT, channel TEXT, status TEXT, provider TEXT, providerMessageId TEXT, recipient TEXT, subject TEXT, body TEXT, createdAt TEXT, sentAt TEXT, deliveredAt TEXT, failureReason TEXT, retryCount INTEGER, idempotencyKey TEXT UNIQUE);
    CREATE TABLE IF NOT EXISTS message_templates (id TEXT PRIMARY KEY, name TEXT UNIQUE, channel TEXT, subject TEXT, body TEXT, stage TEXT, purpose TEXT, variables TEXT, isActive INTEGER, version INTEGER, createdAt TEXT, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS suppressions (id TEXT PRIMARY KEY, leadId TEXT, identifier TEXT UNIQUE, reason TEXT, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS nurture_tasks (id TEXT PRIMARY KEY, leadId TEXT, title TEXT, detail TEXT, priority TEXT, owner TEXT, done INTEGER, type TEXT, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, eventType TEXT, leadId TEXT, timestamp TEXT, actor TEXT, context TEXT);
  `);

  seedDatabaseIfEmpty();
}

function seedDatabaseIfEmpty() {
  const leadCount = (db.prepare("SELECT COUNT(*) as cnt FROM leads").get() as { cnt: number }).cnt;
  if (leadCount > 0) return;

  logger.info("Seeding database with realistic solar leads & templates...");

  const insertLead = db.prepare(`
    INSERT INTO leads (
      id, firstName, lastName, phone, email, leadStage, leadSource, campaign,
      assignedSalesRep, quoteAmount, quoteUrl, timeline, monthlyElectricBill,
      appointmentDate, lastActivityTimestamp, customerTimezone, communicationPreferences,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString();
  const oneDayAgo = new Date(Date.now() - 1 * 86400000).toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

  // 1. John Smith - PROPOSAL_SENT
  insertLead.run(
    "LD-JOHN-01", "John", "Smith", "(480) 555-0199", "john.smith@example.com", "PROPOSAL_SENT", "Google Ads", "Warm Re-engage",
    "Dana Ruiz", 23400, "https://solarpeak.com/quotes/PRP-23400", "3 months", 340,
    null, sixDaysAgo, "America/Phoenix", JSON.stringify({ smsAllowed: true, emailAllowed: true }),
    threeDaysAgo, now
  );

  // 2. Sarah Johnson - QUALIFIED
  insertLead.run(
    "LD-SARAH-02", "Sarah", "Johnson", "(602) 555-0144", "sjohnson@example.com", "QUALIFIED", "Website", null,
    "Dana Ruiz", null, null, "1 month", 280,
    null, twoDaysAgo(2), "America/Phoenix", JSON.stringify({ smsAllowed: true, emailAllowed: true }),
    twoDaysAgo(3), now
  );

  // 3. Mike Davis - PROPOSAL_SENT
  insertLead.run(
    "LD-MIKE-03", "Mike", "Davis", "(623) 555-0122", "mdavis@example.com", "PROPOSAL_SENT", "Meta", "Proposal Follow-through",
    "Ben Okafor", 28400, "https://solarpeak.com/quotes/PRP-28400", "1-3 months", 410,
    null, oneDayAgo, "America/Phoenix", JSON.stringify({ smsAllowed: true, emailAllowed: true }),
    threeDaysAgo, now
  );

  // 4. Emma Wilson - WON
  insertLead.run(
    "LD-EMMA-04", "Emma", "Wilson", "(480) 555-0181", "ewilson@example.com", "WON", "Referral", null,
    "Dana Ruiz", 32000, "https://solarpeak.com/quotes/PRP-32000", "0-1 month", 520,
    null, oneDayAgo, "America/Phoenix", JSON.stringify({ smsAllowed: true, emailAllowed: true }),
    threeDaysAgo, now
  );

  // Seed default templates
  const insertTemplate = db.prepare(`
    INSERT INTO message_templates (
      id, name, channel, subject, body, stage, purpose, variables, isActive, version, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
  `);

  insertTemplate.run(
    "TPL-01", "proposal_followup_sms_1", "SMS", null,
    "Hi {{first_name}}, just checking in on the solar proposal we sent for {{quote_amount}}. Would you like to review it with {{sales_rep_name}}?",
    "PROPOSAL_SENT", "Proposal follow-up SMS", JSON.stringify(["first_name", "quote_amount", "sales_rep_name"]),
    now, now
  );

  insertTemplate.run(
    "TPL-02", "proposal_followup_email_1", "EMAIL", "Your Solar Savings Breakdown — SolarPeak",
    "Hi {{first_name}},\n\nYou mentioned you are hoping to move forward within {{timeline}}. We wanted to follow up on your rooftop solar proposal ({{quote_url}}).\n\nPlease let {{sales_rep_name}} know if you have any questions!",
    "PROPOSAL_SENT", "Proposal follow-up Email", JSON.stringify(["first_name", "timeline", "quote_url", "sales_rep_name"]),
    now, now
  );

  insertTemplate.run(
    "TPL-03", "appointment_reminder_24h", "SMS", null,
    "Hi {{first_name}}, reminder: your solar consultation with {{sales_rep_name}} is scheduled for {{appointment_date}}. Reply C to confirm or R to reschedule.",
    "APPOINTMENT_BOOKED", "24h Appointment Reminder", JSON.stringify(["first_name", "sales_rep_name", "appointment_date"]),
    now, now
  );

  insertTemplate.run(
    "TPL-04", "appointment_reminder_2h", "SMS", null,
    "Hi {{first_name}}, {{sales_rep_name}} will see you in 2 hours for your solar consultation at {{appointment_date}}!",
    "APPOINTMENT_BOOKED", "2h Appointment Reminder", JSON.stringify(["first_name", "sales_rep_name", "appointment_date"]),
    now, now
  );

  insertTemplate.run(
    "TPL-05", "missed_appointment_sms", "SMS", null,
    "Hi {{first_name}}, we missed you for your solar consultation earlier. Would you like to reschedule for later this week?",
    "APPOINTMENT_BOOKED", "Missed Appointment SMS", JSON.stringify(["first_name"]),
    now, now
  );

  insertTemplate.run(
    "TPL-06", "missed_appointment_email", "EMAIL", "We missed you! Let's reschedule your solar consultation",
    "Hi {{first_name}},\n\nWe missed our scheduled consultation earlier today. Your custom solar quote is ready to review whenever you're ready.\n\nReply to this email to pick a new time with {{sales_rep_name}}.",
    "APPOINTMENT_BOOKED", "Missed Appointment Email", JSON.stringify(["first_name", "sales_rep_name"]),
    now, now
  );

  insertTemplate.run(
    "TPL-07", "qualified_followup_sms", "SMS", null,
    "Hi {{first_name}}, thanks for sharing your monthly electric bill details of {{monthly_electric_bill}}. Would you like {{sales_rep_name}} to prepare your free custom estimate?",
    "QUALIFIED", "Qualified Lead SMS", JSON.stringify(["first_name", "monthly_electric_bill", "sales_rep_name"]),
    now, now
  );
}

function twoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}
