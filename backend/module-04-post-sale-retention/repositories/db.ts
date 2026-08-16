import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export let db: any;
let isInMemoryFallback = false;

// Simple in-memory KV database fallback if native better-sqlite3 bindings are unavailable
class InMemoryDb {
  public solar_projects: any[] = [];
  public project_milestones: any[] = [];
  public project_updates: any[] = [];
  public cancellation_risks: any[] = [];
  public project_notifications: any[] = [];
  public referral_events: any[] = [];

  exec(_sql: string) {}

  pragma(_stmt: string) {}

  prepare(sql: string) {
    const self = this;
    const lower = sql.trim().toLowerCase();

    return {
      run(...args: any[]) {
        if (lower.startsWith("insert into solar_projects")) {
          const prj = {
            id: args[0],
            lead_id: args[1],
            status: args[2],
            current_milestone: args[3],
            start_date: args[4],
            estimated_completion_date: args[5],
            completed_at: args[6],
            created_at: args[7],
            updated_at: args[8],
          };
          self.solar_projects = self.solar_projects.filter((p) => p.id !== prj.id);
          self.solar_projects.push(prj);
        } else if (lower.startsWith("update solar_projects set status")) {
          const id = args[args.length - 1];
          const prj = self.solar_projects.find((p) => p.id === id);
          if (prj) {
            prj.status = args[0];
            if (args.length === 4) {
              prj.completed_at = args[1];
              prj.updated_at = args[2];
            } else {
              prj.updated_at = args[1];
            }
          }
        } else if (lower.startsWith("update solar_projects set current_milestone")) {
          const prj = self.solar_projects.find((p) => p.id === args[2]);
          if (prj) {
            prj.current_milestone = args[0];
            prj.updated_at = args[1];
          }
        } else if (lower.startsWith("insert into project_milestones")) {
          const mil = {
            id: args[0],
            project_id: args[1],
            milestone_type: args[2],
            status: args[3],
            started_at: args[4],
            completed_at: args[5],
            notes: args[6],
            updated_by: args[7],
            created_at: args[8],
            updated_at: args[9],
          };
          self.project_milestones = self.project_milestones.filter((m) => m.id !== mil.id);
          self.project_milestones.push(mil);
        } else if (lower.startsWith("update project_milestones set")) {
          const id = args[args.length - 1];
          const mil = self.project_milestones.find((m) => m.id === id);
          if (mil) {
            mil.status = args[0];
            mil.started_at = args[1];
            mil.completed_at = args[2];
            mil.notes = args[3];
            mil.updated_by = args[4];
            mil.updated_at = args[5];
          }
        } else if (lower.startsWith("insert into project_updates")) {
          self.project_updates.push({
            id: args[0],
            project_id: args[1],
            milestone_id: args[2],
            message: args[3],
            visible_to_customer: args[4],
            created_by: args[5],
            created_at: args[6],
          });
        } else if (lower.startsWith("insert into cancellation_risks")) {
          self.cancellation_risks.push({
            id: args[0],
            project_id: args[1],
            score: args[2],
            risk_level: args[3],
            stalled_days: args[4],
            unresolved_inquiries: args[5],
            reason: args[6],
            evaluated_at: args[7],
          });
        } else if (lower.startsWith("insert into project_notifications")) {
          self.project_notifications.push({
            id: args[0],
            project_id: args[1],
            milestone_id: args[2],
            channel: args[3],
            message: args[4],
            status: args[5],
            created_at: args[6],
            sent_at: args[7],
          });
        } else if (lower.startsWith("insert into referral_events")) {
          self.referral_events.push({
            id: args[0],
            project_id: args[1],
            lead_id: args[2],
            status: args[3],
            created_at: args[4],
            completed_at: args[5],
          });
        }
        return { changes: 1 };
      },

      get(...args: any[]) {
        if (lower.includes("from solar_projects where id = ?")) {
          return self.solar_projects.find((p) => p.id === args[0]) || null;
        }
        if (lower.includes("from solar_projects where lead_id = ?")) {
          return self.solar_projects.find((p) => p.lead_id === args[0]) || null;
        }
        if (lower.includes("from project_milestones where id = ?")) {
          return self.project_milestones.find((m) => m.id === args[0]) || null;
        }
        if (lower.includes("from project_milestones where project_id = ? and milestone_type = ?")) {
          return (
            self.project_milestones.find(
              (m) => m.project_id === args[0] && m.milestone_type === args[1]
            ) || null
          );
        }
        if (lower.includes("from cancellation_risks where project_id = ? order by evaluated_at desc")) {
          const list = self.cancellation_risks.filter((r) => r.project_id === args[0]);
          return list[list.length - 1] || null;
        }
        if (lower.includes("from referral_events where project_id = ?")) {
          return self.referral_events.find((r) => r.project_id === args[0]) || null;
        }
        return null;
      },

      all(...args: any[]) {
        if (lower.includes("from solar_projects where status = ?")) {
          return self.solar_projects.filter((p) => p.status === args[0]);
        }
        if (lower.includes("from solar_projects")) {
          return self.solar_projects;
        }
        if (lower.includes("from project_milestones where project_id = ?")) {
          return self.project_milestones.filter((m) => m.project_id === args[0]);
        }
        if (lower.includes("from project_updates where project_id = ? and visible_to_customer = 1")) {
          return self.project_updates.filter(
            (u) => u.project_id === args[0] && u.visible_to_customer === 1
          );
        }
        if (lower.includes("from project_updates where project_id = ?")) {
          return self.project_updates.filter((u) => u.project_id === args[0]);
        }
        if (lower.includes("from cancellation_risks where project_id = ?")) {
          return self.cancellation_risks.filter((r) => r.project_id === args[0]);
        }
        if (lower.includes("from project_notifications where project_id = ?")) {
          return self.project_notifications.filter((n) => n.project_id === args[0]);
        }
        return [];
      },
    };
  }
}

try {
  const Database = require("better-sqlite3");
  const dbDir = path.resolve(process.cwd(), "backend/data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, "post_sale_retention.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
} catch {
  isInMemoryFallback = true;
  db = new InMemoryDb();
}

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
  `);
}

// Auto-initialize tables upon module load
initPostSaleDatabase();
