import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Determine path for SQLite database file
const dbDir = path.resolve(process.cwd(), "backend/data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "post_sale_retention.db");

// Initialize SQLite database instance
export const db = new Database(dbPath);

// Enable WAL mode and foreign key constraints
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/**
 * Initializes database schemas and indexes for Module 04 Post-Sale Retention Engine.
 */
export function initPostSaleDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS solar_projects (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      current_milestone TEXT NOT NULL DEFAULT 'SITE_SURVEY',
      start_date TEXT NOT NULL,
      estimated_completion_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      milestone_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      started_at TEXT,
      completed_at TEXT,
      notes TEXT,
      updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES solar_projects(id) ON DELETE CASCADE,
      UNIQUE (project_id, milestone_type)
    );

    CREATE TABLE IF NOT EXISTS project_updates (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      milestone_id TEXT,
      message TEXT NOT NULL,
      visible_to_customer INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL DEFAULT 'SYSTEM',
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES solar_projects(id) ON DELETE CASCADE,
      FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS cancellation_risks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      risk_level TEXT NOT NULL DEFAULT 'LOW',
      stalled_days INTEGER NOT NULL DEFAULT 0,
      unresolved_inquiries INTEGER NOT NULL DEFAULT 0,
      reason TEXT NOT NULL,
      evaluated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES solar_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_notifications (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      milestone_id TEXT,
      channel TEXT NOT NULL DEFAULT 'PORTAL',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CREATED',
      created_at TEXT NOT NULL,
      sent_at TEXT,
      FOREIGN KEY (project_id) REFERENCES solar_projects(id) ON DELETE CASCADE,
      FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS referral_events (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE,
      lead_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'TRIGGERED',
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (project_id) REFERENCES solar_projects(id) ON DELETE CASCADE
    );

    -- Create Indexes for optimized query execution
    CREATE INDEX IF NOT EXISTS idx_solar_projects_lead_id ON solar_projects(lead_id);
    CREATE INDEX IF NOT EXISTS idx_solar_projects_status ON solar_projects(status);
    CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);
    CREATE INDEX IF NOT EXISTS idx_cancellation_risks_project_id ON cancellation_risks(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_notifications_project_id ON project_notifications(project_id);
    CREATE INDEX IF NOT EXISTS idx_referral_events_project_id ON referral_events(project_id);
  `);
}

// Auto-initialize tables upon module load
initPostSaleDatabase();
