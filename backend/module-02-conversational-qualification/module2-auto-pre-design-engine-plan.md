# Module 2: Auto Pre-Design Engine — Build Plan

**Audience:** Coding agent
**Parent doc:** `solar-lead-automation-demo-spec.md` (this module = Phases 3–5 of that plan, expanded here in full detail since it's being built first, standalone, with its own test page)

---

## 1. Objective

Given a rooftop's dimensions (however captured) and a customer's electricity bill, instantly produce:
- how many solar panels fit
- estimated monthly energy production
- estimated monthly savings vs. their current bill
- installed cost (with subsidy applied) and payback period
- a downloadable PDF proposal

Same session, not the real-world 24–48 hour wait. Nothing in the engine should be a hardcoded number — every coefficient (panel specs, cost per kW, subsidy tiers, battery pricing, sunlight hours) lives in a config file so the whole output changes if the file changes.

---

## 2. Near-Term Priority (read this first)

You explicitly asked for a **standalone front-end test page you can use right now**, separate from the chatbot integration. That's the build order below:

1. **First:** calculation engine (pure functions, no UI) + a bare test page with input fields that calls it directly. This is the fastest path to something you can click through today.
2. **Then:** the map-based rooftop-tracing pipeline as an alternative input method feeding the same engine.
3. **Then:** PDF proposal generation.
4. **Later:** wiring this module into the chatbot flow from the master spec — that's a thin integration layer once the engine and page work standalone.

---

## 3. V1 Simplifying Assumptions

Stating these explicitly so they're a decision, not an accident:

- **Flat/rectangular roof only.** Tilt, slant, orientation (azimuth), and irregular roof shape are **out of scope for v1** — usable area is treated as a flat polygon and a flat packing-efficiency discount is applied. This matches what you described ("flat roof... we cannot even be slanting yet").
- **Shape complexity deferred.** Whether the roof is L-shaped, has multiple segments, has obstructions (water tanks, AC units) — v1 just asks for a total usable area (or a single polygon), and applies a config-driven "usable fraction" discount to approximate real-world losses. Multi-segment roof modeling is a good Phase 2.5+ enhancement, not v1.
- **Single region/tariff selection per calculation**, not per-address auto-lookup (unless the map pipeline is used, in which case region can be inferred from the pin).

---

## 4. Reference Data — Grounding the Numbers (researched Aug 2026, India)

You asked for real-world cost references instead of made-up numbers. Here's what current published sources say — use these as the **seed values** in the config CSVs below, clearly marked as editable defaults, not fixed truths (these change often and should be revisited before any real client-facing use):

| Item | Typical 2026 figure | Notes |
|---|---|---|
| Residential installed cost per kW (pre-subsidy) | ₹55,000–₹85,000/kW | Varies by equipment tier, installer, roof type; several installers report a narrower ₹55k–65k band |
| PM Surya Ghar Muft Bijli Yojana subsidy | ₹30,000/kW for the first 2kW, ₹18,000/kW for the next 1kW, capped at ₹78,000 total | Applies to on-grid residential rooftop systems up to ~3kW+ for the max cap; state-level schemes may add more |
| Typical home system size | 3kW (2–3 BHK, moderate use) up to 5kW | 3kW system commonly quoted ₹1.65L–₹2.25L before subsidy |
| Real-world 5kW system output | ~18–22 units (kWh)/day | Useful sanity check for your calculation engine's output |
| Lithium (LFP) battery, installed | ~₹18,000–22,000 per kWh | Preferred for cycle life; ~2–2.5× lead-acid upfront cost |
| Lead-acid (tubular) battery, installed | ~₹9,000–15,000 per kWh | Cheaper upfront, much shorter cycle life (often needs replacement every 1–3 years under daily cycling) |
| Battery's real value in India | Mainly backup during outages, not bill savings | Batteries aren't covered by the PM Surya Ghar subsidy — budget them separately in the proposal |

**Sources consulted (paraphrased above, not quoted):** vikramsolar.com, dsgroupsolar.in, aecord.com, earthwavetech.in, 4erenew.com, myrsolar.com, pronouncesolar.in (cost/subsidy figures); balconysolar.uk, heavengreenenergy.com, truzonsolar.com, earthenergylog.com, lithiuminverter.in (battery figures) — all accessed August 2026. Flag these in your README as "reference defaults, re-verify periodically," since installer pricing and subsidy rules change.

---

## 5. Config / Reference Datasets for This Module

Extends the dataset layer from the master spec. All CSV, all swappable, all loaded by the same `DatasetLoader`.

### 5.1 `panel_specs.csv`
```
panel_id,name,wattage_w,length_m,width_m,efficiency_pct,price_inr
PN01,Standard 400W Mono,400,1.90,1.10,21.2,14000
PN02,High-Efficiency 540W Mono,540,2.28,1.13,22.8,19500
```

### 5.2 `site_config.csv` (single-row or key/value config)
```
config_key,value,unit,notes
avg_peak_sun_hours,5,hours/day,default per your instruction — override per region if needed later
usable_roof_fraction,0.75,ratio,accounts for edges/setbacks/obstructions on a flat roof
packing_efficiency,0.85,ratio,panel packing density within usable area
performance_ratio,0.78,ratio,inverter/wiring/dust/temperature losses
```

### 5.3 `cost_reference.csv`
```
config_key,value,unit,notes
cost_per_kw_low,55000,INR/kW,pre-subsidy, budget tier
cost_per_kw_high,85000,INR/kW,pre-subsidy, premium tier
cost_per_kw_default,65000,INR/kW,used unless user selects a tier
```

### 5.4 `subsidy_rules.csv` (tiered, so it can be edited if the scheme changes)
```
tier_id,min_kw,max_kw,rate_per_kw_inr,notes
T1,0,2,30000,first 2kW
T2,2,3,18000,next 1kW up to the 3kW cap
```
Plus one config value `subsidy_cap_inr = 78000` in `cost_reference.csv`.

### 5.5 `battery_options.csv`
```
battery_id,name,chemistry,cost_per_kwh_inr,typical_cycle_life,notes
BT01,Tubular Lead-Acid 150Ah,lead_acid,12000,1400,cheaper upfront, shorter life
BT02,LFP Lithium 5kWh Pack,lithium_lfp,20000,4000,higher upfront, much longer life
```

### 5.6 `electricity_tariffs.csv` (reuse from master spec)
Region → ₹/kWh rate, used to convert a monthly bill into estimated units consumed.

---

## 6. Calculation Engine — Formulas

Build this as a pure, unit-tested module (`calculationEngine.ts`) with no UI dependency, so both Pipeline A and Pipeline B call the exact same function.

**Inputs:** `roof_area_m2`, `panel_id`, `monthly_bill_inr` (or `monthly_units_kwh` directly), `region`, optional `battery_id` + `battery_capacity_kwh`, optional `cost_tier` (low/default/high).

1. `usable_area_m2 = roof_area_m2 × usable_roof_fraction`
2. `panel_footprint_m2 = panel.length_m × panel.width_m`
3. `max_panel_count = floor( usable_area_m2 / panel_footprint_m2 × packing_efficiency )`
4. `system_size_kw = max_panel_count × panel.wattage_w / 1000`
5. `monthly_production_kwh = system_size_kw × avg_peak_sun_hours × 30 × performance_ratio`
6. `monthly_consumption_kwh = monthly_bill_inr / tariff.rate_per_kwh` (or use `monthly_units_kwh` directly if the user entered units instead of a bill amount)
7. `monthly_savings_inr = min(monthly_production_kwh, monthly_consumption_kwh) × tariff.rate_per_kwh + max(0, monthly_production_kwh − monthly_consumption_kwh) × tariff.feed_in_rate_per_kwh`
8. `reduction_pct = monthly_production_kwh / monthly_consumption_kwh × 100` (cap display at 100% if oversized)
9. `system_cost_inr = system_size_kw × cost_per_kw[tier]`
10. **Subsidy** (loop `subsidy_rules.csv` tiers):
    ```
    subsidy = 0
    for each tier in subsidy_rules where tier overlaps [0, system_size_kw]:
        kw_in_tier = min(system_size_kw, tier.max_kw) - tier.min_kw
        subsidy += max(0, kw_in_tier) * tier.rate_per_kw_inr
    subsidy = min(subsidy, subsidy_cap_inr)
    ```
11. `net_cost_inr = system_cost_inr − subsidy`
12. `payback_years = net_cost_inr / (monthly_savings_inr × 12)`
13. **If battery selected (optional, secondary calculation — do this after 1–12 work):**
    - `battery_cost_inr = battery_capacity_kwh × battery.cost_per_kwh_inr` (not eligible for subsidy — add on top of `net_cost_inr` as a separate line item, don't fold it into the subsidized total)
    - `backup_hours ≈ (battery_capacity_kwh × 0.8) / assumed_evening_load_kw` (add `assumed_evening_load_kw` as a config value, e.g. 1.0–1.5 kW default) — present this as "hours of backup during an outage," not as extra bill savings, since that's the honest value proposition in the Indian context.

**Sanity check while testing:** for a config that yields ~5kW system size, `monthly_production_kwh` should land in the ballpark of 540–660 kWh/month (≈18–22 units/day × 30), matching the real-world reference figure in Section 4. If your numbers are wildly off, check `performance_ratio` and `avg_peak_sun_hours` first.

---

## 7. Pipeline A — Manual Input (build this first)

A dedicated route, e.g. `/test/pre-design`, with a plain form:

- Roof input mode toggle: **"Enter dimensions"** vs **"Enter total area"**
  - Dimensions: length (m) × width (m)
  - Or: total area (m²) directly
- Region/tariff dropdown (from `electricity_tariffs.csv`)
- Bill input mode toggle: **"Monthly bill (₹)"** vs **"Monthly units (kWh)"**
- Panel choice dropdown (from `panel_specs.csv`), defaulting to one option
- Cost tier selector: Budget / Standard / Premium (maps to `cost_per_kw_low/default/high`)
- Optional: "Add battery backup?" checkbox → battery type dropdown + desired capacity (kWh)
- Submit → calls `POST /api/pre-design/calculate` → renders a results card:
  - Panel count, system size (kW)
  - Estimated monthly production (kWh)
  - Estimated monthly savings (₹) and reduction %
  - System cost, subsidy applied, net cost
  - Payback period
  - If battery selected: battery cost + estimated backup hours, shown as a separate line, not blended into "savings"
- "Download PDF Proposal" button (Section 9)

This page has no dependency on the chatbot or the map — it's a direct, fast way to exercise the whole engine today.

---

## 8. Pipeline B — Map-Assisted Rooftop Capture

### 8.1 Honest technical note before building this

What you described — pointing at a house and having an OpenCV/ML model automatically trace the roof outline from a satellite photo — is a real capability, but it's a nontrivial computer-vision problem in its own right (roof/building segmentation from aerial imagery). It's not something to build from scratch inside a demo timeline; it typically requires either a trained segmentation model and a licensed aerial-imagery feed, or a third-party API that has already solved it.

**Recommended v1 approach:** user-assisted polygon tracing, not automatic detection. The user pins their location, sees the satellite view, and draws the outline themselves. This is reliable, ships fast, and produces the same `roof_area_m2` output the manual-entry path produces — so it plugs into the identical calculation engine with zero extra work there.

**A real product that does full automatic detection exists:** Google's Solar API (`buildingInsights` endpoint) returns roof segments, usable area, and sunshine-hour data computed via ML from aerial imagery — effectively what you originally described. Worth evaluating as a **future enhancement**, with two caveats to check before committing engineering time:
- Its high-quality coverage is concentrated in North America, Europe, and Oceania; an "expanded coverage" program extends BASE-quality data to more countries but currently requires trusted-tester sign-up, and India's coverage/quality tier should be checked directly at `https://developers.google.com/maps/documentation/solar/coverage` before relying on it.
- It's a paid, metered Google Cloud API — factor that into the cost-benefit versus the manual-trace approach, which is free once you have a standard Maps JS API key.

Treat automatic detection as a Phase-2.5+ stretch goal, not a v1 dependency.

### 8.2 What to actually build for Pipeline B

1. "Use map" button on the rooftop step → request browser geolocation (with manual address search fallback).
2. Open Google Maps (JS API) in satellite view, centered on the location, with the Drawing library enabled in polygon mode.
3. User traces their roof outline; on completion, compute area with `google.maps.geometry.spherical.computeArea(polygon.getPath())` → square meters.
4. Store the polygon vertices + computed area on the session/lead record (useful later for the proposal's roof-map thumbnail).
5. Feed the computed `roof_area_m2` into the exact same `calculationEngine` call used by Pipeline A.
6. **Fallback is mandatory, always visible:** if the user can't get a good satellite view, doesn't have a precise address, or the map fails to load, a "switch to manual entry" link must always be present and functional — Pipeline A is the guaranteed path, Pipeline B is the enhancement.

---

## 9. Proposal PDF Spec

One-page (or two) generated PDF, same session:

1. Header: customer name/date, "Your Solar Pre-Design Estimate"
2. Roof summary: area used, panel count, system size (kW) — include the traced-polygon map thumbnail if Pipeline B was used
3. Production & savings table: monthly production (kWh), monthly savings (₹), reduction % vs. current bill
4. Cost table: system cost, subsidy applied, net cost, payback period
5. If battery was selected: separate "Backup Power Option" box — battery cost, estimated backup hours, explicit note that this isn't subsidized and is about outage resilience, not bill savings
6. Footer disclaimer: "Estimate only, based on user-provided inputs and current published reference pricing — final quote requires a site visit."

Implementation: HTML template → Puppeteer (or `pdf-lib`) render, matching the approach in the master spec.

---

## 10. Staged Build Plan

### Phase 2.0 — Reference Data & Config
- [ ] Create `panel_specs.csv`, `site_config.csv`, `cost_reference.csv`, `subsidy_rules.csv`, `battery_options.csv` with the seed values from Section 5
- [ ] Extend `DatasetLoader` to load these (reuse from master spec if already built)
- **DoD:** `/api/health` reports these datasets loaded with correct row counts.

### Phase 2.1 — Calculation Engine
- [ ] Implement formulas from Section 6 as pure functions
- [ ] Unit tests: at least 3 scenarios (small roof/small bill, large roof/large bill, oversized system) + the Section 6 sanity check against the ~18–22 units/day real-world reference
- **DoD:** changing `cost_per_kw_default` or a `subsidy_rules.csv` tier changes engine output on re-run, no code edits needed.

### Phase 2.2 — Manual Input Test Page (Pipeline A) — **priority**
- [ ] Build `/test/pre-design` route with the form from Section 7
- [ ] `POST /api/pre-design/calculate` endpoint
- [ ] Results card UI
- **DoD:** you can personally run a full manual scenario end-to-end today and get a plausible, config-traceable result.

### Phase 2.3 — Map-Assisted Pipeline (Pipeline B)
- [ ] Google Maps JS API + Drawing + Geometry libraries wired in
- [ ] Polygon trace → area computation → feeds Phase 2.1 engine
- [ ] Manual-entry fallback always available
- **DoD:** both input paths independently produce a valid `roof_area_m2` and identical downstream results for the same area.

### Phase 2.4 — PDF Proposal Generation
- [ ] HTML template per Section 9
- [ ] Puppeteer/pdf-lib render + download endpoint
- [ ] "Download PDF" wired into the Phase 2.2 results card
- **DoD:** one click from either pipeline produces a correct, lead-specific PDF, same session.

### Phase 2.5 — Battery Scenario (optional, after core engine is solid)
- [ ] Add battery selection to the form and engine (Section 6, step 13)
- [ ] Show as a clearly separate line in both the UI and PDF
- **DoD:** battery cost and backup-hours estimate appear without affecting the core subsidy/savings math.

### Phase 2.6 — Chatbot Integration (later, thin layer)
- [ ] Swap the standalone test page's form inputs for chatbot-collected answers (from the master spec's `chatbot_questions.csv` flow)
- [ ] Same `calculationEngine` call, same PDF generator — no duplicate logic
- **DoD:** a full chat conversation produces the same quality output as the manual test page did.

---

## 11. API Endpoints for This Module

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/pre-design/calculate` | Run the calculation engine (Pipeline A or B) |
| POST | `/api/pre-design/rooftop-polygon` | Store polygon vertices + computed area (Pipeline B) |
| POST | `/api/pre-design/proposal` | Generate & return the PDF |
| GET | `/api/pre-design/config` | Return current panel/cost/subsidy/battery config (for populating dropdowns) |

---

## 12. File/Folder Additions

```
data/
  panel_specs.csv
  site_config.csv
  cost_reference.csv
  subsidy_rules.csv
  battery_options.csv
backend/src/services/
  calculationEngine.ts
  proposalGenerator.ts
frontend/app/test/pre-design/   <- the standalone test page
```

---

## 13. Open Questions

1. Should the test page (Phase 2.2) support multiple regions/tariffs now, or is a single default region fine until Pipeline B/chatbot integration?
2. Confirm whether battery scenario (Phase 2.5) is needed for the first demo milestone, or can slip after core engine + PDF are working.
3. Do you have a Google Maps Platform billing account set up yet? Needed for Phase 2.3 (Drawing/Geometry libraries and Maps JS itself require a billed API key even within free-tier usage).
4. Any interest in evaluating Google's Solar API for India coverage as a later stretch goal, or should we treat manual tracing as the permanent Pipeline B?
