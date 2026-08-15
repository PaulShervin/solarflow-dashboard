# SolarFlow Backend Architecture

Welcome to the SolarFlow backend system repository.

## Architecture Overview

SolarFlow uses a **team-oriented, modular backend architecture**. Each major product domain is owned by an independent module in its own folder. Modules communicate strictly through documented event boundaries, clean API contracts, and shared domain interfaces.

```
backend/
├── module-01-instant-response/          # Instant Lead Response Agent
├── module-02-conversational-qualification/ # Qualification Engine & Scoring
├── module-03-contextual-nurture/          # Contextual Nurture Engine (Drip, SMS/Email workflows)
├── module-04-post-sale-retention/         # Post-Sale & Milestone Tracking
├── module-05-call-coaching/               # Sales Call Recording & AI Coaching
└── shared/                                # Genuinely shared types, logger, & base config
```

---

## Module Ownership & Responsibilities

### Module 01: Instant Response Agent
- **Focus**: Inbound lead speed-to-lead response.
- **Responsibilities**: Immediate SMS/Voice response, instant web chat greeting, initial lead handling.

### Module 02: Conversational Qualification Engine
- **Focus**: Lead qualification conversation & scoring.
- **Responsibilities**: Question flow, intent/need extraction, qualification scoring, eligibility criteria.

### Module 03: Contextual Nurture Engine (Implemented Phase 1)
- **Focus**: Preventing qualified solar leads from going cold during the 60–90 day buying journey.
- **Responsibilities**: Stage-aware nurture workflows, automated SMS/email drips, customer activity detection, stop conditions, opt-out suppression, factual personalization, sales next-best-action tasks, nurture analytics.

### Module 04: Post-Sale Retention Engine
- **Focus**: Post-contract customer experience.
- **Responsibilities**: Site survey, permitting, installation milestone notifications, cancellation risk prediction, referral triggers.

### Module 05: Call Coaching
- **Focus**: Sales call analysis.
- **Responsibilities**: Audio ingestion, speech-to-text transcription, objection detection, scorecards, sales coaching reports.

---

## Shared Folder (`shared/`) Rules

The `shared/` directory contains ONLY code that is genuinely required across two or more modules:
1. **Common Contracts**: Shared event interfaces (e.g. `DomainEvent`, `LeadStage`), base ID types.
2. **Error Formats**: Standardized `AppError` and HTTP error schemas.
3. **Logger**: Universal structured logging interface.
4. **Base Configuration**: Shared environment variables and utility helpers.

> **Rule for Engineers**: Do NOT put module-specific business logic into `shared/`. Keep logic encapsulated in its owning module folder.

---

## Module Communication Guidelines

1. **No Internal File Imports Across Modules**: Module A must never import from `backend/module-0B/internal/...`.
2. **Event-Driven Coupling**: Communicate via asynchronous domain events (e.g. `QUALIFICATION_COMPLETED`, `NURTURE_MESSAGE_SENT`).
3. **API & Repository Interfaces**: Use defined contract interfaces in `shared/contracts`.
