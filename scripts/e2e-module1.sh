#!/usr/bin/env bash
# =============================================================================
# Module 1 — Instant Response Agent: End-to-End Test Suite
#
# Verifies, against a live dev server:
#   1. Inbound webhooks ingest HubSpot / Salesforce / GoHighLevel / Custom
#      payloads at /api/webhooks/lead (with provider auto-detection)
#   2. Quantitative intent scoring (0-100) incl. timeline factor
#   3. Availability-matrix auto-booking with double-booking protection
#   4. Human handoff (<45 or renter) with ownership transfer
#
# Usage: bash scripts/e2e-module1.sh [base_url]   (default http://localhost:3000)
# Exits non-zero if any assertion fails.
# =============================================================================
set -u

BASE_URL="${1:-http://localhost:3000}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

PY=python3
command -v python3 >/dev/null 2>&1 || PY=python

PASS=0
FAIL=0
FAILED_NAMES=()

log()  { printf '%s\n' "$*"; }
pass() { PASS=$((PASS + 1)); log "  PASS: $*"; }
fail() { FAIL=$((FAIL + 1)); FAILED_NAMES+=("$*"); log "  FAIL: $*"; }

# --- HTTP helpers ------------------------------------------------------------
http_body() { # <method> <path> [json_body] -> response body
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -X "$method" "$BASE_URL$path" -H "Content-Type: application/json" -d "$body"
  else
    curl -s -X "$method" "$BASE_URL$path"
  fi
}

http_status() { # <method> <path> [json_body] -> HTTP status code
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path" -H "Content-Type: application/json" -d "$body"
  else
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path"
  fi
}

http_req() { # <method> <path> [json_body] -> "BODY\nSTATUS" (single request)
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$path" -H "Content-Type: application/json" -d "$body"
  else
    curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$path"
  fi
}

jget() { # <dotted.path> <json> -> value at path ('' if missing/null, booleans lowercased)
  local path="$1"
  $PY -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for p in '$path'.split('.'):
        d = d[p]
    if d is None:
        print('')
    elif isinstance(d, bool):
        print(str(d).lower())
    else:
        print(d)
except Exception:
    print('')
" <<< "$2"
}

assert_eq() { # <name> <expected> <actual>
  if [ "$3" = "$2" ]; then pass "$1"; else fail "$1 (expected '$2', got '$3')"; fi
}

jcount() { # <dotted.path> <json> -> array length (0 if missing)
  local path="$1"
  $PY -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for p in '$path'.split('.'):
        d = d[p]
    print(len(d))
except Exception:
    print(0)
" <<< "$2"
}

assert_status() { # <name> <expected_code> <actual_code>
  if [ "$3" = "$2" ]; then pass "$1"; else fail "$1 (expected HTTP $2, got $3)"; fi
}

assert_true() { # <name> <condition-value> <detail>
  if [ "$2" = "1" ]; then pass "$1"; else fail "$1 ($3)"; fi
}

# --- Server lifecycle --------------------------------------------------------
SERVER_STARTED=0
if ! curl -s -o /dev/null --max-time 2 "$BASE_URL/api/db/all"; then
  log "Server not reachable at $BASE_URL — starting dev server..."
  (cd "$ROOT_DIR" && nohup bun run dev > /tmp/solarflow-e2e.log 2>&1 &)
  SERVER_STARTED=1
  READY=0
  for _ in $(seq 1 40); do
    sleep 1
    if curl -s -o /dev/null --max-time 2 "$BASE_URL/api/db/all"; then READY=1; break; fi
  done
  if [ "$READY" != "1" ]; then
    log "ERROR: dev server did not become ready. See /tmp/solarflow-e2e.log"
    exit 1
  fi
  log "Dev server ready."
fi

cleanup() {
  if [ "$SERVER_STARTED" = "1" ]; then
    pkill -f "vite dev" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# --- 0. Fresh state ----------------------------------------------------------
log "== Resetting server database =="
RESET=$(http_body POST /api/db/reset)
assert_eq "db reset returns success" "true" "$(jget success "$RESET")"

log ""
log "== 1. Inbound webhooks (all four providers, no settings changes) =="

# T1 — HubSpot-shaped payload
R=$(http_body POST /api/webhooks/lead '{
  "properties": {
    "firstname": "Emily", "lastname": "Carter", "email": "emily@example.com",
    "phone": "480-555-0199", "city": "Chandler", "state": "AZ",
    "monthly_electric_bill": 380, "roof_type": "Tile", "is_homeowner": true,
    "buying_timeline": "0-1 month"
  }
}')
assert_eq "T1 HubSpot: name parsed" "Emily Carter" "$(jget lead.name "$R")"
assert_eq "T1 HubSpot: assigned rep (not handoff)" "Dana Ruiz" "$(jget lead.owner "$R")"

# T2 — Salesforce-shaped payload while settings provider is still default (HubSpot)
R=$(http_body POST /api/webhooks/lead '{
  "FirstName": "Raj", "LastName": "Patel", "Email": "raj@example.com",
  "Phone": "602-555-0177", "City": "Scottsdale", "State": "AZ",
  "Monthly_Bill__c": 310, "Roof_Type__c": "Tile", "Is_Homeowner__c": true
}')
assert_eq "T2 Salesforce auto-detect: name parsed" "Raj Patel" "$(jget lead.name "$R")"

# T3 — GoHighLevel-shaped payload
R=$(http_body POST /api/webhooks/lead '{
  "contact": {
    "firstName": "Sofia", "lastName": "Delgado", "email": "sofia@example.com",
    "phone": "623-555-0144",
    "customFields": { "monthly_bill": 270, "roof": "Asphalt shingle", "timeline": "1-3 months" }
  }
}')
assert_eq "T3 GoHighLevel auto-detect: name parsed" "Sofia Delgado" "$(jget lead.name "$R")"

# T4 — Custom-shaped payload
R=$(http_body POST /api/webhooks/lead '{
  "name": "Lisa Nguyen", "email": "lisa@example.com", "monthlyBill": 350,
  "roof": "Asphalt shingle", "homeowner": true, "timeline": "0-1 month"
}')
assert_eq "T4 Custom: name parsed" "Lisa Nguyen" "$(jget lead.name "$R")"
assert_eq "T4 Custom: timeline stored" "0-1 month" "$(jget lead.timeline "$R")"

log ""
log "== 2. Quantitative intent scoring (incl. timeline) =="

# T5 — identical leads except timeline: fast must outscore slow by >= 5
FAST=$(http_body POST /api/webhooks/lead '{
  "name": "Mark Fast", "email": "mfast@example.com", "monthlyBill": 350,
  "roof": "Asphalt shingle", "homeowner": true, "timeline": "0-1 month"
}')
SLOW=$(http_body POST /api/webhooks/lead '{
  "name": "Mark Slow", "email": "mslow@example.com", "monthlyBill": 350,
  "roof": "Asphalt shingle", "homeowner": true, "timeline": "Just researching"
}')
FAST_SCORE=$(jget lead.score "$FAST")
SLOW_SCORE=$(jget lead.score "$SLOW")
FAST_DIFF=$((FAST_SCORE - SLOW_SCORE))
assert_true "T5 timeline factors into score (fast $FAST_SCORE vs slow $SLOW_SCORE)" "$([ "$FAST_DIFF" -ge 5 ] && echo 1 || echo 0)" "diff=$FAST_DIFF"

# T6 — webhook renter with low bill -> score < 45 AND owner escalated
R=$(http_body POST /api/webhooks/lead '{
  "name": "Tom Baker", "email": "tom@example.com", "monthlyBill": 120,
  "roof": "Metal", "homeowner": false, "timeline": "Just researching"
}')
SCORE=$(jget lead.score "$R")
assert_true "T6 webhook renter scores < 45 (got $SCORE)" "$([ "$SCORE" -lt 45 ] && echo 1 || echo 0)" "score=$SCORE"
assert_eq "T6 renter ownership transferred" "Human Rep (Escalated)" "$(jget lead.owner "$R")"

log ""
log "== 3. Auto-booking on the availability matrix =="

# T7 — qualify high-intent lead -> auto-books earliest open slot
LID=$(jget lead.id "$(http_body POST /api/webhooks/lead '{
  "name": "Kevin Quick", "email": "kevin@example.com", "monthlyBill": 400,
  "roof": "Asphalt shingle", "homeowner": true, "timeline": "0-1 month"
}')")
R=$(http_body POST /api/agent/qualify "{\"leadId\":\"$LID\",\"answers\":{\"homeowner\":\"Yes, I own it\",\"bill\":\"Over \$350\",\"roof\":\"Asphalt shingle, under 10 yrs\",\"timeline\":\"As soon as possible\"}}")
assert_eq "T7 qualify auto-books an appointment" "true" "$(jget success "$R")"
assert_true "T7 appointment object present" "$([ -n "$(jget appointment.id "$R")" ] && echo 1 || echo 0)" "appointment.id=$(jget appointment.id "$R")"
assert_eq "T7 lead status advanced to appointment" "appointment" "$(jget lead.status "$R")"

# T8 — qualify renter -> ownership transfer + no booking
LID=$(jget lead.id "$(http_body POST /api/webhooks/lead '{
  "name": "June Renter", "email": "june@example.com", "monthlyBill": 300,
  "roof": "Tile", "homeowner": true, "timeline": "0-1 month"
}')")
R=$(http_body POST /api/agent/qualify "{\"leadId\":\"$LID\",\"answers\":{\"homeowner\":\"No, I rent\",\"bill\":\"Over \$350\",\"roof\":\"Tile\",\"timeline\":\"0-1 month\"}}")
assert_eq "T8 renter ownership transferred" "Human Rep (Escalated)" "$(jget lead.owner "$R")"
assert_eq "T8 renter status contacted" "contacted" "$(jget lead.status "$R")"
assert_eq "T8 renter NOT auto-booked" "" "$(jget appointment.id "$R")"

# T9 — explicit booking of an open slot succeeds
AVAIL=$(http_body GET /api/agent/availability)
DATE3=$($PY -c "
import sys, json
d = json.load(sys.stdin)
dates = sorted({s['date'] for s in d['availability'] if s['rep'] == 'Dana Ruiz'})
print(dates[2] if len(dates) > 2 else dates[-1])
" <<< "$AVAIL")
LID=$(jget lead.id "$(http_body POST /api/webhooks/lead '{
  "name": "Priya Booker", "email": "priya@example.com", "monthlyBill": 260,
  "roof": "Asphalt shingle", "homeowner": true, "timeline": "1-3 months"
}')")
ST=$(http_status POST /api/agent/book-appointment "{\"leadId\":\"$LID\",\"rep\":\"Dana Ruiz\",\"date\":\"$DATE3\",\"time\":\"11:00 AM\"}")
assert_status "T9 open slot books with 200" "200" "$ST"

# T10 — double-booking the same rep/date/time is rejected
R=$(http_body POST /api/agent/book-appointment "{\"leadId\":\"$LID\",\"rep\":\"Dana Ruiz\",\"date\":\"$DATE3\",\"time\":\"11:00 AM\"}")
ST=$(http_status POST /api/agent/book-appointment "{\"leadId\":\"$LID\",\"rep\":\"Dana Ruiz\",\"date\":\"$DATE3\",\"time\":\"11:00 AM\"}")
assert_status "T10 double-booking rejected with 409" "409" "$ST"
assert_eq "T10 conflict code" "SLOT_UNAVAILABLE" "$(jget code "$R")"

# T11 — booking a seeded-closed slot is rejected
FIRST_DATE=$($PY -c "
import sys, json
d = json.load(sys.stdin)
dates = sorted({s['date'] for s in d['availability'] if s['rep'] == 'Dana Ruiz'})
print(dates[0])
" <<< "$AVAIL")
R=$(http_body POST /api/agent/book-appointment "{\"leadId\":\"$LID\",\"rep\":\"Dana Ruiz\",\"date\":\"$FIRST_DATE\",\"time\":\"9:00 AM\"}")
ST=$(http_status POST /api/agent/book-appointment "{\"leadId\":\"$LID\",\"rep\":\"Dana Ruiz\",\"date\":\"$FIRST_DATE\",\"time\":\"9:00 AM\"}")
assert_status "T11 seeded-closed slot rejected with 409" "409" "$ST"
assert_eq "T11 conflict code" "SLOT_UNAVAILABLE" "$(jget code "$R")"

# T12 — availability endpoint reflects the reservation
AVAIL2=$(http_body GET /api/agent/availability)
SLOT_STATUS=$($PY -c "
import sys, json
d = json.load(sys.stdin)
s = [x for x in d['availability'] if x['rep'] == 'Dana Ruiz' and x['date'] == '$DATE3' and x['time'] == '11:00 AM']
print(s[0]['status'] if s else 'missing')
" <<< "$AVAIL2")
assert_eq "T12 booked slot marked closed in matrix" "closed" "$SLOT_STATUS"

log ""
log "== 3b. Matrix admin: manual open/close + book from calendar =="

# T14 — admin closes an open slot
SLOT_ID=$($PY -c "
import sys, json
d = json.load(sys.stdin)
s = [x for x in d['availability'] if x['rep'] == 'Dana Ruiz' and x['date'] == '$DATE3' and x['time'] == '12:00 PM']
print(s[0]['id'] if s else '')
" <<< "$AVAIL")
ST=$(http_status PATCH "/api/agent/availability/$SLOT_ID" '{"status":"closed"}')
assert_status "T14 close slot returns 200" "200" "$ST"
R=$(http_body PATCH "/api/agent/availability/$SLOT_ID" '{"status":"closed"}')
assert_eq "T14 slot status now closed" "closed" "$(jget slot.status "$R")"

# T15 — admin reopens the same slot
ST=$(http_status PATCH "/api/agent/availability/$SLOT_ID" '{"status":"open"}')
assert_status "T15 reopen slot returns 200" "200" "$ST"
R=$(http_body PATCH "/api/agent/availability/$SLOT_ID" '{"status":"open"}')
assert_eq "T15 slot status back to open" "open" "$(jget slot.status "$R")"

# T16 — book a lead from the calendar (slot-based booking)
LID_BOOK=$(jget lead.id "$(http_body POST /api/webhooks/lead '{
  "name": "Carlos Diaz", "email": "carlos@example.com", "monthlyBill": 280,
  "roof": "Tile", "homeowner": true, "timeline": "1-3 months"
}')")
OUT=$(http_req POST "/api/agent/availability/$SLOT_ID/book" "{\"leadId\":\"$LID_BOOK\"}")
ST=$(printf '%s' "$OUT" | tail -n 1)
R=$(printf '%s' "$OUT" | sed '$d')
assert_status "T16 book from calendar returns 200" "200" "$ST"
assert_true "T16 appointment created" "$([ -n "$(jget appointment.id "$R")" ] && echo 1 || echo 0)" "appointment.id=$(jget appointment.id "$R")"
assert_eq "T16 slot closed after booking" "closed" "$(jget slot.status "$R")"

# T17 — reopening a slot that holds an appointment is rejected
R=$(http_body PATCH "/api/agent/availability/$SLOT_ID" '{"status":"open"}')
ST=$(http_status PATCH "/api/agent/availability/$SLOT_ID" '{"status":"open"}')
assert_status "T17 reopen booked slot rejected with 409" "409" "$ST"
assert_eq "T17 conflict code" "SLOT_HAS_APPOINTMENT" "$(jget code "$R")"

# T18 — unknown slot is rejected
R=$(http_body PATCH /api/agent/availability/AV-999999 '{"status":"open"}')
ST=$(http_status PATCH /api/agent/availability/AV-999999 '{"status":"open"}')
assert_status "T18 unknown slot rejected with 409" "409" "$ST"
assert_eq "T18 not-found code" "SLOT_NOT_FOUND" "$(jget code "$R")"

log ""
log "== 4. End-to-end state =="

# T13 — server DB contains the whole flow
ALL=$(http_body GET /api/db/all)
assert_true "T13 leads persisted" "$([ "$(jcount data.leads "$ALL")" -ge 12 ] && echo 1 || echo 0)" "lead count < 12"
assert_true "T13 conversations persisted" "$([ "$(jcount data.conversations "$ALL")" -ge 8 ] && echo 1 || echo 0)" "conversation count < 8"
assert_true "T13 appointments persisted" "$([ "$(jcount data.appointments "$ALL")" -ge 7 ] && echo 1 || echo 0)" "appointment count < 7"
assert_true "T13 availability matrix persisted" "$([ "$(jcount data.availability "$ALL")" -ge 70 ] && echo 1 || echo 0)" "matrix too small"

log ""
log "==============================================="
log "Module 1 E2E results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  log "Failed assertions:"
  for n in "${FAILED_NAMES[@]}"; do log "  - $n"; done
  log "==============================================="
  exit 1
fi
log "==============================================="
exit 0
