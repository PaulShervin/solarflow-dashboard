# Module 04 — Post-Sale Retention Engine

## 🚀 Overview

Module 04 (Post-Sale Retention Engine) manages everything that happens **after a solar sale is completed**. It converts completed sales into trackable installation projects, manages their 6-stage milestone lifecycle, keeps customers updated via portal notifications, calculates real-time cancellation risk scores, escalates stalled projects, and triggers post-installation referral incentives.

This module is fully implemented, strictly typed, fully tested, and integrated into the broader backend.

---

## 🛠️ Folder Structure

```text
backend/module-04-post-sale-retention/
├── models/
│   └── index.ts                         # Enums & TypeScript interfaces (SolarProject, Milestone, Risk, Notification, Referral)
├── schemas/
│   └── post-sale.schema.ts              # Zod validation schemas for request parameters & payloads
├── repositories/
│   ├── db.ts                            # SQLite connection setup & table DDL initialization
│   └── post-sale.repository.ts          # Complete CRUD mapping layer (SQLite <-> TS Models)
├── services/
│   ├── project.service.ts               # Core project lifecycle & deduplication
│   ├── milestone.service.ts             # 6-Stage state machine sequence & transition validator
│   ├── cancellation-risk.service.ts     # Risk formula calculator & escalation engine
│   ├── notification.service.ts          # Customer update logs & portal notification manager
│   └── referral.service.ts              # Post-PTO completion referral bonus enrollment
├── api/
│   └── post-sale.router.ts              # Admin & Customer Portal HTTP Request handlers
├── events/
│   └── post-sale.event-handler.ts       # Domain pub/sub event bus & SALE_COMPLETED listener
├── workers/
│   └── post-sale-monitor.worker.ts      # Background cycle scanner for stalled projects & risk recalculation
├── tests/
│   └── post-sale.test.ts                # E2E unit & integration test suite
└── README.md                            # You are here
```

---

## 📋 Database Tables (SQLite)

Implemented in `backend/data/post_sale_retention.db` with WAL journal mode & foreign keys:

1. **`solar_projects`**: Tracks primary project state, `lead_id` (unique), current milestone, and timestamps.
2. **`project_milestones`**: Stores 6 milestone phases (`SITE_SURVEY`, `ENGINEERING`, `PERMITTING`, `INSTALLATION`, `INSPECTION`, `PTO`) with unique `(project_id, milestone_type)` constraints.
3. **`project_updates`**: Stores customer-facing updates and internal operational logs.
4. **`cancellation_risks`**: Chronological risk evaluation logs with stalled days & unresolved inquiry metrics.
5. **`project_notifications`**: Tracks portal/SMS/email customer delivery statuses (`CREATED`, `SENT`, `FAILED`).
6. **`referral_events`**: Tracks post-completion customer referral enrollments.

---

## 🔄 Automated Workflows Added

### 1. Project Initialization Workflow
- Listens to the global `SALE_COMPLETED` domain event.
- Automatically creates a new `SolarProject`.
- Initializes the 6-stage milestone sequence.
- Posts a welcoming customer portal update.

### 2. Milestone State Machine
- Enforces strict transition sequences (e.g., `SITE_SURVEY` → `ENGINEERING` → `PERMITTING` → `INSTALLATION` → `INSPECTION` → `PTO`).
- Blocks invalid jumps (e.g., cannot go from `SITE_SURVEY` directly to `PTO`).
- Auto-starts the next milestone when the previous one is completed.

### 3. Customer Notification Automation
- Upon completing any milestone, the system automatically writes a `ProjectUpdate`.
- Generates a `ProjectNotification` for the portal.
- Triggers custom human-friendly messages depending on the milestone achieved.

### 4. Cancellation Risk Engine & Escalation
- `post-sale-monitor.worker.ts` scans active projects daily.
- Calculates a risk score based on: `(stalledDays * 12) + (unresolvedInquiries * 15)`.
- If a project exceeds the `HIGH` risk threshold (score >= 70), it automatically injects a high-priority escalation task for the operations team.

### 5. Post-PTO Referral Trigger
- Once the final `PTO` milestone is completed, the project is marked as `COMPLETED`.
- A `ReferralEvent` is automatically generated for the sales team to contact the newly activated customer.

---

## 🌐 API Endpoints

The module is mounted directly into the core `apiRouter.ts`.

### Admin Endpoints (`/api/admin/projects/*`)

- `POST /api/admin/projects` — Create post-sale solar project manually.
- `GET /api/admin/projects` — List projects (supports `?status=` filter).
- `GET /api/admin/projects/:id` — Detailed project inspection with milestones & current risk.
- `GET /api/admin/projects/:id/milestones` — List milestone history.
- `POST /api/admin/projects/:id/milestones/:type/start` — Start a milestone phase.
- `POST /api/admin/projects/:id/milestones/:type/complete` — Complete milestone phase.
- `GET /api/admin/projects/:id/updates` — Admin project update history.
- `POST /api/admin/projects/:id/updates` — Log project update.
- `GET /api/admin/projects/:id/risk` — View cancellation risk log & history.
- `POST /api/admin/projects/:id/risk/recalculate` — Recalculate cancellation risk score.

### Customer Portal Endpoints (`/api/projects/*`)

- `GET /api/projects/:id` — Public customer portal project view.
- `GET /api/projects/:id/milestones` — Customer milestone progression view.
- `GET /api/projects/:id/updates` — Filtered customer portal updates (`visibleToCustomer === true`).

---

## 💻 Usage & Verification

### Running the Module
The background worker and event listeners automatically load when the backend server boots up.
```bash
npm run dev
```

### Running the Test Suite
The module comes with a complete, 22-case end-to-end integration suite that verifies the state machine, project deduplication, risk calculation, and event triggers.
```bash
npx tsx backend/module-04-post-sale-retention/tests/post-sale.test.ts
```
