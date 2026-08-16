# Module 5 Replacement: Product & Pricing Chatbot (Retrieval-Grounded Assistant)


```
5. Product & Pricing Chatbot (Retrieval-Grounded Assistant)
What to build:
Embedded chatbot widget — an Amazon-style shopping/support assistant on the website
Retrieval-grounded knowledge base — structured product catalog (panel models, specs,
  prices, generation capacity, battery options) the chatbot answers from directly,
  not from memory or invented numbers
Qualifying follow-up flow — asks home ownership, roof info, timeline, etc. mid-conversation
Location capture via a map sub-window — opens a dedicated map page/modal where the
  user pins their exact house and/or traces their roof outline
Calculation pipeline handoff — once basic info + dimensions are captured, triggers the
  Auto Pre-Design Engine (Module 2) to compute system size, production, savings, and cost
In-chat results delivery — the chatbot presents the final cost/savings comparison
  conversationally, right in the chat, not just on a separate results page
Human handoff — same escalation path as Module 1 when the bot can't resolve a query
```

---

## 1. Objective

An on-site chatbot that can (a) answer product questions grounded in real catalog data, and (b) walk a visitor through qualification and rooftop capture to produce a live cost/savings estimate — all inside the chat, without leaving the conversation for anything except the map sub-window.

---

## 2. Terminology Note — "RAG-lite," Not Full RAG



- **True RAG** = embed a large, mostly unstructured document set (PDFs, manuals, long-form text) into a vector database, semantically search it per query, feed the top matches to an LLM.
- **What this actually needs:** the knowledge base is small and *structured* — panel models, wattages, prices, battery options. That's a handful of CSV/JSON rows, not a document corpus. Semantic vector search is overkill and adds a dependency (vector DB) for no real benefit here.

**Recommended v1 approach — structured retrieval + LLM generation ("RAG-lite"):** when the user asks something ("what's your biggest panel?" / "how much does a 5kW system cost?"), the backend does a direct structured lookup against the CSV/JSON catalog (filter/match by field, not embeddings), then passes the matched rows as grounding context to an LLM to phrase a natural answer. This gets you the "feels like Amazon's assistant" conversational quality without hallucinated numbers, and without standing up a vector database for a demo-sized catalog.

If the knowledge base later grows to include long-form content (installation guides, warranty documents, T&Cs), *that's* the point to add real vector-based RAG — flag it as a Phase 5.5+ enhancement, not a v1 requirement.

---

## 3. Relationship to Other Modules (build once, reuse — don't duplicate)

| This module needs | Already being built in | Reuse, don't rebuild |
|---|---|---|
| Qualifying question flow (own home? timeline? bill?) | Module 1 / master spec's `chatbot_questions.csv`-driven engine | Same `ChatbotEngine`, same CSV |
| Product/pricing data to retrieve from | Module 2's `panel_specs.csv`, `cost_reference.csv`, `battery_options.csv` | Same files, read-only from this module |
| Rooftop dimension capture (map + manual) | Module 2's Pipeline A/B | Reuse Module 2's map-tracing page directly, opened in a sub-window from here |
| Cost/production/savings calculation | Module 2's `calculationEngine.ts` | Call it, don't reimplement it |
| PDF proposal | Module 2's `proposalGenerator.ts` | Call it, offer the download link in-chat |
| Human escalation | Module 1's handoff/notification flow | Same trigger, same adapter |

**Net new work for Module 5 is really just:** the chat widget UI, the structured-retrieval-plus-LLM answer layer for open-ended product questions, and the map-sub-window handoff/return mechanism. Everything downstream of "we have the roof area and basic info" is Module 2's engine, called as-is.

---

## 4. Knowledge Base for Retrieval

Reuses Module 2's config CSVs directly — no new dataset needed for pricing/specs:
- `panel_specs.csv` (wattage, dimensions, efficiency, price)
- `cost_reference.csv` (installed cost tiers)
- `battery_options.csv` (chemistry, cost/kWh, cycle life)
- `subsidy_rules.csv` (so the bot can answer "how much subsidy would I get?")

**One new file for this module:** `product_faq.json` — short narrative answers for things that aren't a clean row/column lookup (warranty length, maintenance, what happens on a cloudy day, etc.), e.g.:
```json
[
  {
    "topic": "warranty",
    "answer": "Most panels carry a 25-year linear performance warranty; inverters typically 5-10 years."
  },
  {
    "topic": "cloudy_days",
    "answer": "Production drops on overcast days but doesn't stop — panels still generate diffuse-light output, just at reduced efficiency."
  }
]
```
Keep entries short (a few sentences) — this file is for FAQ-style grounding, not a document corpus.

---

## 5. Retrieval Function

`retrieveProductContext(userMessage)`:
1. Extract intent/keywords from the message (simple keyword/entity matching is fine for v1 — no need for an NLU model given the small, well-defined catalog).
2. Look up matching rows across the CSVs and `product_faq.json`.
3. Return the matched rows/entries as structured context (JSON), e.g. `{ matched_panels: [...], matched_faq: [...] }`.
4. Pass that structured context + the user's message to the LLM with an instruction like: *"Answer using only the data provided below. If the answer isn't in the data, say you'll connect them with a human rather than guessing."* This is the guardrail that keeps the bot from inventing prices or specs.

---

## 6. Conversation Flow

1. **Greeting / open-ended entry.** Visitor can ask anything ("what panels do you sell?", "how much for a 3kW system?") and get a retrieval-grounded answer, or say "I want an estimate" to start qualification directly.
2. **Qualifying questions** (reuses Module 1's question engine): own home? roof type? monthly bill? timeline?
3. **Rooftop capture — offer both paths in-chat:**
   - *"Know your roof area? Just type it in."* → manual entry inline in the chat
   - *"Not sure? Pin your house on the map."* → opens the **map sub-window** (Section 7)
4. **Pipeline handoff:** once qualification + roof area are captured, the bot calls Module 2's `/api/pre-design/calculate` (and `/api/pre-design/proposal` if the user wants a PDF).
5. **In-chat result:** the bot renders a compact results card *inside the conversation* — system size, monthly production, monthly savings, net cost after subsidy, payback period — plus a "📄 Download full proposal" link and a "Talk to a rep" escalation option.
6. **Escalation:** anything the bot can't answer confidently (retrieval finds nothing relevant, or the user explicitly asks for a human) triggers Module 1's handoff flow.

---

## 7. Location Capture — Map Sub-Window

This is the "open a URL to a different page where they point out their house" mechanism you described:

1. In the chat, a **"📍 Pin your house"** button opens Module 2's existing map-tracing tool (`/tools/rooftop-picker`) in either:
   - a **modal/iframe within the same page** (recommended — avoids popup blockers, keeps the chat visible), or
   - a **new browser tab**, if you'd rather keep it fully isolated (`window.open`).
2. The sub-window carries a `session_id` so it knows which conversation it belongs to.
3. User searches their address (or uses geolocation), sees the satellite view, traces their roof outline — exactly the Module 2 Pipeline B flow, no new code here.
4. On completion, the sub-window either:
   - `postMessage`s the computed area back to the parent chat window (if modal/iframe), or
   - writes the result to the backend keyed by `session_id`, and the chat polls/fetches it once the tab closes (if separate tab — more robust for mobile).
5. Chat resumes automatically: *"Got it — looks like about 42 m² of usable roof. Let me calculate your options..."*
6. **Fallback is always available:** the same "just type your dimensions" manual path from Section 6, step 3, works if the user skips or closes the map window.

---

## 8. Staged Build Plan

### Phase 5.0 — Retrieval Layer
- [ ] Build `retrieveProductContext()` against existing Module 2 CSVs
- [ ] Add and wire up `product_faq.json`
- [ ] Unit tests: a handful of sample questions → confirm correct rows/entries are retrieved
- **DoD:** given "what's your cheapest panel?", the function returns the correct row from `panel_specs.csv`.

### Phase 5.1 — Grounded Answer Generation
- [ ] Wire retrieval output + user message into an LLM call with the "answer only from provided data, otherwise escalate" guardrail instruction
- [ ] Test with a few known-answer and known-unanswerable questions to confirm it doesn't invent numbers
- **DoD:** an out-of-scope question ("do you install EV chargers?") results in an honest "I'll connect you with someone" rather than a fabricated answer.

### Phase 5.2 — Chat Widget UI
- [ ] Floating chat widget, open-ended text entry + the qualifying-question flow (reused from Module 1)
- [ ] In-chat results card component (Section 6, step 5)
- **DoD:** a full conversation from greeting → qualifying questions → manual roof entry → results card works end-to-end.

### Phase 5.3 — Map Sub-Window Integration
- [ ] "Pin your house" button opens Module 2's rooftop-picker tool (modal or new tab)
- [ ] `session_id` handoff + return mechanism (postMessage or polling, per Section 7)
- **DoD:** tracing a roof in the sub-window returns the area to the chat and the conversation continues automatically.

### Phase 5.4 — Pipeline Handoff & PDF
- [ ] Call Module 2's `/api/pre-design/calculate` and `/api/pre-design/proposal` from the chat backend
- [ ] Render results + PDF link in-chat
- **DoD:** end-to-end demo — ask a product question, get qualified, pin a roof, see a real estimate, download a PDF, all without leaving the chat.

### Phase 5.5 — Escalation & Logging
- [ ] Wire "talk to a human" and low-confidence retrieval results into Module 1's handoff flow
- [ ] Log every question/answer/handoff to the shared activity log (same table used elsewhere in the master spec)
- **DoD:** an unresolved query shows up on the rep dashboard with full conversation context.

---

## 9. API Endpoints (new for this module)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/chat/message` | Send a user message, get a retrieval-grounded reply |
| GET | `/api/chat/:session_id/rooftop-status` | Poll for map sub-window result (if using the separate-tab approach) |
| POST | `/api/chat/:session_id/escalate` | Trigger human handoff from mid-conversation |

(Calculation and proposal endpoints are Module 2's existing `/api/pre-design/*` routes — called, not duplicated.)

---


