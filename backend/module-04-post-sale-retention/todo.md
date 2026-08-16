# Module 04: Post-Sale Retention Engine - Implementation Plan

## Phase-by-Phase Implementation Tasks

> **Architecture Decisions:**
> - **Database:** SQLite (using `better-sqlite3` or the team's standard driver) will be used for persistence, replacing the JSON-based disk store for this module.
> - **Structure:** All module code will reside inside `backend/module-04-post-sale-retention/`. API routes will be exported and registered with the global Nitro/TanStack router in `src/server/apiRouter.ts`.

### Phase 1: Domain Models & Schemas
- [x] Create `models/index.ts`.
- [x] Define core TypeScript interfaces (`SolarProject`, `ProjectMilestone`, `ProjectUpdate`, `CancellationRisk`, `ProjectNotification`, `ReferralEvent`).
- [x] Define Enums (`ProjectStatus`, `MilestoneType`, `MilestoneStatus`, `RiskLevel`).
- [x] Create `schemas/post-sale.schema.ts` containing Zod validation schemas for API requests.

### Phase 2: Database / Persistence Initialization
- [x] Install SQLite dependencies (`better-sqlite3` and `@types/better-sqlite3`).
- [x] Create `repositories/db.ts` to initialize and export the SQLite connection.
- [x] Setup SQLite tables (`solar_projects`, `project_milestones`, `project_updates`, `cancellation_risks`, `project_notifications`, `referral_events`).
- [x] Add necessary indexes/constraints (e.g., unique constraints on `project_id` and `milestone_type`).

### Phase 3: Repository Layer
- [x] Create `repositories/post-sale.repository.ts`.
- [x] Implement CRUD operations for Projects: `createProject()`, `getProject()`, `getProjects()`.
- [x] Implement CRUD operations for Milestones: `createMilestone()`, `getMilestones()`, `updateMilestone()`.
- [x] Implement CRUD operations for Updates: `createProjectUpdate()`, `getProjectUpdates()`.
- [x] Implement CRUD operations for Risks: `createRiskEvaluation()`, `getLatestRisk()`.
- [x] Implement CRUD operations for Notifications: `createNotification()`, `getNotifications()`.
- [x] Implement CRUD operations for Referrals: `createReferral()`, `getReferral()`.

### Phase 4: Project Service
- [x] Create `services/project.service.ts`.
- [x] Implement `createProject()` logic (called when `SALE_COMPLETED` is triggered).
- [x] Implement `getProject()` logic.
- [x] Implement `completeProject()` and `cancelProject()` state changes.

### Phase 5: Milestone Service
- [x] Create `services/milestone.service.ts`.
- [x] Implement `startMilestone()` logic.
- [x] Implement `completeMilestone()` logic.
- [x] Add strict transition validation (e.g., prevent `SITE_SURVEY` -> `PTO`).
- [x] Implement logic to automatically create `ProjectUpdate` and `ProjectNotification` upon milestone completion.

### Phase 6: Customer Updates & Notifications
- [x] Create `services/notification.service.ts`.
- [x] Implement automatic generation of customer-facing messages when milestones change.
- [x] Implement `getCustomerUpdates()` to expose filtered data for the customer portal.

### Phase 7: Cancellation Risk Engine
- [x] Create `services/cancellation-risk.service.ts`.
- [x] Implement `calculateRisk()` formula: `score = min(100, stalledDays * 12 + unresolvedInquiries * 15)`.
- [x] Classify score into `LOW` (0-39), `MEDIUM` (40-69), or `HIGH` (70-100).
- [x] Implement risk escalation triggers when a project hits `HIGH` risk.

### Phase 8: API Routing Layer
- [x] Create `api/post-sale.router.ts`.
- [x] Implement Admin Endpoints (`/api/admin/projects/*`) for managing projects, milestones, updates, and risks.
- [x] Implement Customer Endpoints (`/api/projects/*`) for exposing read-only data to the portal.
- [x] Register `post-sale.router.ts` with the global API router (`src/server/apiRouter.ts`).

### Phase 9: Event Integration
- [x] Consume `SALE_COMPLETED`.
- [x] Publish Module 04 events (`PROJECT_CREATED`, `PROJECT_MILESTONE_STARTED`, `PROJECT_MILESTONE_COMPLETED`, `PROJECT_RISK_UPDATED`, `PROJECT_RISK_ESCALATED`, `PROJECT_COMPLETED`, `REFERRAL_TRIGGERED`).
- [x] Integrate with shared contracts in `backend/shared/contracts/events.ts`.

### Phase 10: Background Monitoring (Worker)
- [x] Create `workers/post-sale-monitor.worker.ts`.
- [x] Implement scheduler to find stalled projects.
- [x] Implement automatic daily risk recalculation and history recording.

### Phase 11: Referral Triggers
- [x] Create `services/referral.service.ts`.
- [x] Listen for `PROJECT_COMPLETED` (which occurs after `PTO`) to automatically generate a `referral_events` record.

### Phase 12: Testing
- [x] Write unit tests for `services/project.service.ts` (creation, state management).
- [x] Write unit tests for `services/milestone.service.ts` (valid and invalid transitions).
- [x] Write unit tests for `services/cancellation-risk.service.ts` (score calculation logic).
- [x] Write API integration tests for both Admin and Customer routes.
- [x] Referral tests.

### Phase 13: Frontend Integration (UI & API Wiring)
- [x] **API Client Extension (`src/lib/api.ts`)**: Add fetcher functions for the new `/api/admin/projects` and `/api/projects` endpoints.
- [x] **Admin Sidebar Navigation**: Update `src/components/admin/AdminShell.tsx` to add a "Post-Sale Projects" (or similar) link in the navigation menu.
- [x] **Admin Projects Page (`src/routes/admin.projects.tsx`)**: 
  - Create the main listing page using TanStack Router.
  - Implement a data table displaying project status, current milestone, and cancellation risk score (similar to `admin.leads.tsx`).
- [x] **Admin Project Detail View (`Sheet` Modal)**:
  - Implement a slide-out `<Sheet>` to view complete project details.
  - Display the milestone state machine (SITE_SURVEY to PTO) and highlight the active step.
  - Add interactive buttons for admins to execute `Complete Milestone` actions.
  - Display the cancellation risk history and provide a manual "Recalculate Risk" button.
- [x] **Customer Portal Wiring (`src/routes/portal.tsx`)**:
  - Replace mock data `portalMilestones` and `portalMessages` in `useSolarDB` with real data fetched from `/api/projects/:projectId`.
  - Ensure the milestone timeline renders the real status from the database (`COMPLETED`, `IN_PROGRESS`, `PENDING`).
