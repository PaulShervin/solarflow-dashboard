# Module 03 — Contextual Nurture Engine

## Overview
The **Contextual Nurture Engine** is responsible for preventing qualified solar leads from going cold during the 60–90 day buying journey. It executes stage-aware, automated follow-up sequences using factual customer data, enforces strict stop conditions upon customer activity or opt-outs, respects local communication windows, and generates actionable sales tasks.

---

## Key Principles & Guardrails
1. **Rules Decide WHEN to Contact**: Workflow triggers, step delays, and conditions dictate execution times.
2. **Customer Data Decides WHAT to Say**: Verified customer context (quote, timeline, bill) populates templates.
3. **Customer Activity Decides AUTOMATION CONTINUATION**: Inbound replies, appointment bookings, stage changes (`WON`/`LOST`), or opt-outs instantly stop scheduled follow-ups.
4. **Customer Opt-Out Enforcement**: Immediate suppression on keywords (`STOP`, `UNSUBSCRIBE`, `CANCEL`, `END`, `QUIT`).
5. **AI Wording Fallback**: AI personalization is constrained to phrasing refinement; business rules remain authoritative, with automatic fallback to deterministic templates.

---

## Folder Architecture
```
module-03-contextual-nurture/
├── README.md                  # Module documentation
├── api/                       # API routes & endpoint controllers
├── models/                    # Data interfaces & domain entities
├── schemas/                   # Zod request & validation schemas
├── services/                  # Business logic (NurtureEngine, StopConditionEvaluator, TaskGenerator)
├── workflows/                 # Workflow definitions (Workflows 1–4) & execution engine
├── personalization/           # Factual variable interpolation & AI phrasing boundary
├── messaging/                 # SMS/Email provider abstraction & delivery lifecycle
├── events/                    # Module event emitter & domain event handlers
├── repositories/              # SQLite database storage & query data mappers
├── workers/                   # Scheduled job execution & background tick worker
├── integrations/              # CRM abstraction boundary
├── tests/                     # 20 scenario unit & integration tests
└── config/                    # Module-level configuration
```

---

## Events Consumed & Emitted

### Consumed Events
- `LEAD_CREATED`
- `LEAD_STAGE_CHANGED`
- `QUALIFICATION_COMPLETED`
- `APPOINTMENT_BOOKED`
- `APPOINTMENT_MISSED`
- `PROPOSAL_SENT`
- `CUSTOMER_REPLIED`
- `CUSTOMER_ACTIVITY`
- `PROPOSAL_OPENED`
- `SALE_COMPLETED`
- `LEAD_MARKED_LOST`
- `DO_NOT_CONTACT`
- `HUMAN_ESCALATION`

### Emitted Events
- `NURTURE_STARTED`
- `NURTURE_STEP_SCHEDULED`
- `NURTURE_MESSAGE_CREATED`
- `NURTURE_MESSAGE_SENT`
- `NURTURE_MESSAGE_DELIVERED`
- `NURTURE_MESSAGE_FAILED`
- `CUSTOMER_REENGAGED`
- `NURTURE_PAUSED`
- `NURTURE_RESUMED`
- `NURTURE_COMPLETED`
- `NURTURE_CANCELLED`
- `FOLLOW_UP_TASK_CREATED`
- `CUSTOMER_OPTED_OUT`

---

## Workflows Included

1. **PROPOSAL FOLLOW-UP**: Triggered on `PROPOSAL_SENT`. Wait 3d -> check activity -> SMS -> wait 4d -> check activity -> Email -> wait 5d -> Sales task.
2. **APPOINTMENT REMINDER**: Triggered on `APPOINTMENT_BOOKED`. 24h & 2h reminders before appointment time.
3. **MISSED APPOINTMENT**: Triggered on `APPOINTMENT_MISSED`. 30m rescheduling SMS -> 24h email if inactive.
4. **QUALIFIED LEAD FOLLOW-UP**: Triggered on `QUALIFIED`. Wait 2d -> check activity -> SMS -> wait 5d -> Sales task.

---

## API Endpoints Exposed
- `GET /nurture/leads/:id` - Fetch lead nurture status
- `POST /nurture/leads/:id/enroll` - Enroll lead into workflow
- `POST /nurture/leads/:id/pause` - Pause lead nurture
- `POST /nurture/leads/:id/resume` - Resume lead nurture
- `POST /nurture/leads/:id/cancel` - Cancel lead nurture
- `GET /nurture/workflows` - List workflows
- `POST /nurture/workflows` - Create workflow
- `GET /nurture/workflows/:id` - Get workflow details
- `PATCH /nurture/workflows/:id` - Update workflow
- `GET /nurture/messages` - List message logs
- `GET /nurture/templates` - List templates
- `POST /nurture/templates` - Create template
- `GET /nurture/analytics` - Get real nurture performance analytics
- `POST /nurture/webhooks/sms` - SMS Webhook (Inbound/Status)
- `POST /nurture/webhooks/email` - Email Webhook (Status/Open)
