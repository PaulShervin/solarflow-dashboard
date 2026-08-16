# Module 1 — Instant Response Agent: Full Implementation Plan

## Goal

Bring the Instant Response Agent to spec: (1) ingest inbound webhooks from HubSpot / Salesforce / GoHighLevel / Custom at `/api/webhooks/lead` with payload auto-detection, (2) compute a 0–100 intent score using **all four factors** (homeownership, monthly bill, roof type, **timeline**), (3) auto-book consultant slots against a **real rep availability matrix** with double-booking protection, (4) flag low-intent (<45) / renter leads and **transfer ownership** to `Human Rep (Escalated)` — then prove it end-to-end with a scripted test suite.

## Current State (verified by live audit, Aug 2026)

Working tree clean; server runs on :3000. The feature is ~78% complete with these confirmed gaps:

| # | Gap | Evidence (live test) |
|---|-----|----------------------|
| G1 | **Timeline never scored** — spec lists it as a scoring factor | Sent `timeline: "6+ months"` → stored as hardcoded `"0-1 month"`, score 100 (identical to fast-timeline lead) |
| G2 | Webhook score starts at base 50, only adds → `score < 45` unreachable in webhook path (handoff only fires for renters) | Renter scored 50, still escalated correctly via renter rule |
| G3 | **No availability matrix** — `bookAppointment` never checks rep/slot/conflicts | Booked Dana Ruiz same date+time twice → both `Confirmed` |
| G4 | **Booking not automatic** — `qualifyLead` only sets status `qualified`, never reserves a slot | Qualify response had no appointment; booking required a separate explicit call |
| G5 | **Qualify flow never transfers owner** on handoff | Escalated renter kept `owner: "Dana Ruiz"`; admin "Human Handoff Escalated" banner (keys off `owner.includes("Human")`) won't show |
| G6 | **No provider auto-detection** — payload parsed using only settings provider; a Salesforce payload with default HubSpot settings normalized as "HubSpot Lead" | POST'd SFDC-shaped payload → name "HubSpot Lead", bill 240 (HubSpot defaults) |

Out-of-scope by decision: outbound CRM sync stays **simulated** (payload built + audit log, no real HTTP POST).

## Locked Design Decisions

1. **Availability matrix = seeded slot grid + conflict detection.** New persisted structure: per-rep, per-day, per-time-slot entries with `open` / `closed` state. Booking validates (a) slot exists and is `open`, (b) no existing appointment for rep@date@time. On success the slot is marked `closed`.
2. **CRM outbound sync: keep simulated** (current behavior). No real HTTP call.
3. **Webhook provider resolution = auto-detect shape, settings as override/fallback.** Detection rules: payload has `properties.*` → HubSpot; has `FirstName`/`LastName` → Salesforce; has `contact.*` → GoHighLevel; otherwise use settings provider (custom). All four providers work at the same endpoint without touching settings.

## Scoring Rubric (single source of truth, shared by webhook + qualify + client fallback)

Start base = **30** (both flows, so <45 is reachable). Add:

| Factor | Condition | Points |
|--------|-----------|--------|
| Homeownership | owns home | +30 |
| Monthly bill | ≥ $300 / $200–299 / < $200 | +25 / +15 / 0 |
| Roof type | Asphalt shingle under 10 yrs, or Tile | +15 |
| Timeline | 0–1 month / 1–3 months / 3–6 months / 6+ months | +15 / +10 / 0 / −5 |

Cap at 0–100. Handoff rule: `score < 45 || homeowner === false` (webhook) / `answers.homeowner === "No, I rent"` (qualify).

---

## Tasks

### Phase 0 — Data model & seed availability matrix

- [ ] **0.1** `src/data/mock.ts`: add `AvailabilitySlot` type (`{ id, rep, date, time, status: "open" | "closed" }`) and export a seeded `availabilityMatrix`: 3 reps (Dana Ruiz, Ben Okafor, +1) × next 5 business days × slots (9 AM–4 PM, hourly). Seed a couple of pre-closed slots to prove conflict logic.
  → Verify: typecheck passes; seed renders in a quick node/tsx print.
- [ ] **0.2** `src/server/dbStore.ts`: persist `availability` in `this.data`; add `getAvailability()`, `reserveSlot(rep, date, time)` (marks closed, returns slot or null), `isSlotOpen(rep, date, time)`; include in `getAllData()` and `resetToDefaults()`.
  → Verify: `POST /api/db/reset` returns seeded matrix; `server_db.json` persists it.

### Phase 1 — Intent scoring: timeline + reachable <45

- [ ] **1.1** `src/server/agents/instantResponseAgent.ts`: extract shared scoring into a module-level `computeIntentScore(factors)` using the rubric above. In `processInboundWebhook`, read `normalized.timeline` and store the real value (stop hardcoding `"0-1 month"`); base 30. In `qualifyLead`, read `answers.timeline` and apply the same rubric.
  → Verify: slow-timeline lead scores ~5–10 pts below fast-timeline lead with identical other factors; renter with low bill scores < 45 via webhook.
- [ ] **1.2** `src/lib/db.ts` (client fallback): mirror the same rubric in its webhook + qualify paths so offline behavior matches the server.
  → Verify: `qualifyLead` local path returns same scores as server path for identical answers.

### Phase 2 — Webhook provider auto-detection

- [ ] **2.1** `src/server/crmAdapter.ts`: add `resolveProvider(payload, settingsProvider)` — shape detection per decision #3; keep `normalizeInboundPayload` field maps untouched, but call it with the resolved provider.
  → Verify: POST the 4 payload shapes at `/api/webhooks/lead` **without changing settings** → each normalizes to correct name/fields (HubSpot "Emily Carter", SFDC "Raj Patel", GHL "Sofia Delgado", custom "Lisa Nguyen").
- [ ] **2.2** `src/lib/db.ts`: mirror auto-detection in the client fallback `addWebhookLead`.
  → Verify: identical outputs server vs client for the 4 shapes.

### Phase 3 — Availability matrix booking

- [ ] **3.1** `src/server/agents/instantResponseAgent.ts` → `bookAppointment`: validate rep/slot exists, slot `open`, no appointment conflict (rep+date+time); call `reserveSlot` before creating the appointment; throw/return a structured error (`success:false`, code `SLOT_UNAVAILABLE`) on failure. Update audit log to include slot reservation result.
  → Verify: booking an open slot succeeds; re-booking rep+date+time (any customer) returns `SLOT_UNAVAILABLE`; booking a seeded-closed slot fails; booking a rep not in matrix fails.
- [ ] **3.2** `src/server/apiRouter.ts`: return HTTP **409** for booking conflicts (`jsonResponse({ success:false, error, code }, 409)`); add `GET /api/agent/availability` returning the matrix (open slots only, or full with status).
  → Verify: `curl` conflict → 409 + code; `GET /api/agent/availability` → seeded matrix JSON.
- [ ] **3.3** `src/lib/db.ts` + `src/lib/api.ts`: mirror conflict logic in client `bookAppointment`; expose `getAvailability()`.
  → Verify: client fallback blocks the same double-booking.

### Phase 4 — Auto-booking & ownership transfer

- [ ] **4.1** `instantResponseAgent.qualifyLead`: after scoring — if handoff → set `lead.owner = "Human Rep (Escalated)"` (fixes G5) + status `contacted` + warning audit log; if qualified (score ≥ 45, homeowner) → **auto-book** the earliest open slot for the assigned rep (default "Dana Ruiz") via the same `bookAppointment` path (fixes G4), set status `appointment`, add "Consultation Auto-Booked" audit log, and include the appointment in the response.
  → Verify: qualify a high-intent lead → response contains an `appointment` with earliest open slot; lead status `appointment`; qualify a renter → `owner` becomes "Human Rep (Escalated)".
- [ ] **4.2** `src/lib/db.ts`: mirror both behaviors in client fallback.
  → Verify: same responses server vs client.

### Phase 5 — UI surface (minimal)

- [ ] **5.1** `src/routes/admin.appointments.tsx`: add a read-only "Rep Availability" strip (3 reps × next 5 days, open/closed chips) fed from `solarApi.getAvailability()`; leave the existing table intact.
  → Verify: browser shows seeded slots; booking a slot via API flips its chip to closed after refresh.

### Phase 6 — End-to-end test suite

- [ ] **6.1** Create `scripts/e2e-module1.sh` (bash, curl + jq or python for assertions) that: starts dev server → `POST /api/db/reset` → runs the full matrix below → prints PASS/FAIL per assertion and exits non-zero on any failure. Tests are self-contained (fresh state per run).
  → Verify: full suite green on a clean run.
- [ ] **6.2** Run `npx tsc --noEmit` (via `node_modules/.bin/tsc`) and `npm run lint`; fix anything surfaced.
  → Verify: zero type errors, lint clean.

### Phase 7 — Docs accuracy

- [ ] **7.1** Update `README.md` + `walkthrough.md`: document timeline scoring, availability matrix, auto-booking-on-qualify, owner transfer, provider auto-detection; remove the now-accurate-but-previously-false "checks rep availability matrix" ambiguity.
  → Verify: docs match implemented behavior (re-read after 6.1 passes).

---

## End-to-End Test Matrix (`scripts/e2e-module1.sh`)

| # | Scenario | Assertion |
|---|----------|-----------|
| 1 | POST HubSpot-shaped payload | lead.name = "Emily Carter", score reflects rubric incl. timeline |
| 2 | POST Salesforce-shaped payload (settings still HubSpot) | lead.name = "Raj Patel" (auto-detect works) |
| 3 | POST GHL-shaped payload | lead.name = "Sofia Delgado" |
| 4 | POST custom payload | lead.name as sent, provider "Custom Webhook" |
| 5 | Timeline sensitivity: identical leads, timeline "0-1 month" vs "6+ months" | fast scores ≥ 5 pts higher |
| 6 | Webhook renter, low bill | score < 45 AND owner = "Human Rep (Escalated)" |
| 7 | Qualify high-intent answers | response has `appointment`; lead status `appointment`; slot = earliest open on rep grid |
| 8 | Qualify renter answers | owner = "Human Rep (Escalated)", status `contacted`, audit log `warning` |
| 9 | Book open slot explicitly | 200, appointment created, slot now closed |
| 10 | Double-book same rep/date/time (different customer) | 409 `SLOT_UNAVAILABLE` |
| 11 | Book seeded-closed slot | 409 `SLOT_UNAVAILABLE` |
| 12 | GET /api/agent/availability | returns matrix; booked slot shows closed |
| 13 | GET /api/db/all | leads/conversations/appointments/auditLogs/availability all updated |

## Done When

- [ ] All 13 E2E assertions pass on a clean `db/reset` run.
- [ ] `tsc --noEmit` and `lint` clean.
- [ ] The 5 confirmed gaps (G1–G5) are closed; G6 resolved via auto-detection.
- [ ] README/walkthrough match implemented behavior.
- [ ] Manual browser pass: qualify high-intent → lead + auto-appointment appear in `/admin/leads` + `/admin/appointments`; renter → "Human Handoff Escalated" banner in `/admin/leads`.

## Notes

- **Provider auto-detect precedence**: shape detection wins for the 3 known shapes; settings provider used for ambiguous payloads (custom). Document in crmAdapter.
- **Shared rubric**: keep `computeIntentScore` in one place per layer (server + client mirror) to avoid drift; E2E #5 guards it.
- **Latency/audit logging**: keep existing `latencyMs` conventions; add slot-reservation detail to booking audit entries.
- **No new deps**: jq/python available for the test script; no test framework added (project has none for `src/`).
