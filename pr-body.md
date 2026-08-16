## Overview
This PR introduces **Module 04: Post-Sale Retention Engine**, responsible for handling the customer experience and operational tracking after a solar sale is completed.

## Features Implemented
- **Project Lifecycle State Machine**: Built a strict 6-stage milestone tracker (`SITE_SURVEY` -> `ENGINEERING` -> `PERMITTING` -> `INSTALLATION` -> `INSPECTION` -> `PTO`).
- **Cancellation Risk Engine**: Continuously evaluates stalled days and open inquiries to calculate a 0-100 risk score. Automatically escalates `HIGH` risk projects to the operations team.
- **Automated Customer Updates**: Completing milestones automatically generates human-friendly timeline updates and portal notifications for the customer.
- **Event-Driven Architecture**: Fully integrated with the global event bus. Automatically provisions new projects when `SALE_COMPLETED` fires.
- **Referral Automation**: Triggers a `ReferralEvent` for the sales team the moment a project reaches Permission to Operate (PTO) and completes.

## Technical Details
- Encapsulated completely within `backend/module-04-post-sale-retention` to prevent domain leakage.
- Strict Typescript models aligned with `exactOptionalPropertyTypes`.
- Introduced 6 new SQLite tables with a dedicated CRUD repository.
- Robust background worker (`post-sale-monitor.worker.ts`) for daily scanning.
- E2E Test Suite with 22/22 passing tests.

## Testing Instructions
Run the integration suite locally to verify the domain rules and event pub/sub:
```bash
npx tsx backend/module-04-post-sale-retention/tests/post-sale.test.ts
```
