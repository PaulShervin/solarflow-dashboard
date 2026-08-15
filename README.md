# SolarFlow / SolarPeak — Enterprise Agentic Solar Platform

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com/PaulShervin/solarflow-dashboard)
[![Stack](https://img.shields.io/badge/Stack-Vite%20%7C%20TanStack%20Start%20%7C%20TypeScript-blue)](https://tanstack.com/start)
[![Auth](https://img.shields.io/badge/Auth-PBKDF2%20%2B%20Session%20Tokens-purple)](https://github.com/PaulShervin/solarflow-dashboard)
[![CRM](https://img.shields.io/badge/CRM-HubSpot%20%7C%20Salesforce%20%7C%20GoHighLevel-orange)](https://github.com/PaulShervin/solarflow-dashboard)

A production-grade, fullstack **Agentic AI Solar Operations Platform & CRM** built for enterprise scale. Featuring a **100% functional backend server engine**, persistent disk database storage, multi-provider 2-way CRM synchronization, industrial PBKDF2 authentication, and 5 autonomous agent modules.

---

## Key Architecture & Core Capabilities

### 1. ⚡ Instant Response Agent
- **Inbound Webhooks**: Ingests lead payloads from HubSpot, Salesforce, GoHighLevel, or Custom Webhooks at `/api/webhooks/lead`.
- **Quantitative Intent Scoring**: Computes lead quality score (0–100) based on homeownership, monthly bill, roof type, and timeline.
- **Calendar Auto-Booking**: Automatically reserves consultant time slots on the sales rep availability matrix.
- **Human Handoff Alert**: Automatically flags low-intent (< 45) or renter leads and transfers ownership to `Human Rep (Escalated)`.

### 2. ☀️ Auto Pre-Design Engine
- **Satellite Roof Pre-Design**: Visual roof array mapping 400W monocrystalline panel layouts with tilt (18°) and azimuth (180°) parameters.
- **Solar Engineering Math**:
  $$\text{Daily kWh} = \frac{\text{Monthly Bill}}{0.16} \times \frac{1}{30}$$
  $$\text{Required kW System Capacity} = \frac{\text{Daily kWh} \times (\text{Target Offset \%} / 100)}{5.5 \text{ Peak Sun Hours}}$$
- **Automated PDF Quotes**: Server renders downloadable, printable HTML/PDF proposal documents at `/api/proposals/:id/pdf`.

### 3. 🎯 Contextual Nurture Engine
- **Stage-Tied Sequences**: Executes drip sequences tied to lead lifecycle stages.
- **Trigger Rule Evaluator**: Scans leads for idle conditions and dispatches follow-ups via `POST /api/agent/nurture/run-rules`.
- **Dynamic Template Compiler**: Personalizes templates replacing `{{first_name}}`, `{{monthly_bill}}`, `{{roof_type}}`, `{{city}}`, `{{est_savings}}`, and `{{rep_name}}`.

### 4. 🛠️ Post-Sale Status Agent & Customer Portal
- **7-Stage Project Lifecycle**: Tracks progress across Consultation, Site Audit, Design, Permitting, Installation, Inspection, and PTO.
- **Cancellation Risk Index**:
  $$\text{Risk Score} = \min(100, \text{Stalled Days} \times 12 + \text{Inquiries} \times 15)$$
- **Auto Notifications**: Dispatches automated customer SMS alerts on stage advancement and updates the live `/portal`.

### 5. 🎙️ Call Coaching & Speech-to-Text Module
- **STT Diarization**: Aligns speaker turns (Rep vs Customer) with precise line timestamps.
- **Objection Extraction**: Tagging for *Tile Roof Labor Fee*, *Installation Timeline*, and *Net Metering Rate Tier*.
- **Scorecard & Talk Ratio**: Calculates talk/listen split (e.g. 52% Rep / 48% Customer) and pitch scorecards (0-100).

### 6. 🔒 Industrial PBKDF2 Authentication
- **Salted Password Hashing**: Cryptographic PBKDF2 hashing with SHA-512 salting.
- **Session Token Engine**: Cryptographically secure 256-bit token issuing and header validation (`Authorization: Bearer <token>` or `X-Session-Token`).
- **Protected Admin Console**: Enforces authentication on `/admin/*` routes.

---

## 🔐 Pre-seeded Enterprise Credentials

| User Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin@solarpeak.com` | `SolarPeak2026!` | `admin` | Enterprise Platform Administrator |
| `dana@solarpeak.com` | `SolarPeak2026!` | `consultant` | Senior Solar Consultant / Sales Rep |
| `marcus@solarpeak.com` | `SolarPeak2026!` | `customer` | Verified Customer Account |

---

## 🗺️ Application Routes

### Customer Experience
| Route | Description |
|---|---|
| `/` | Public marketing homepage — hero, trust indicators, financing, interactive calculator |
| `/qualify` | 60-second conversational solar qualifying wizard with instant CRM auto-booking |
| `/estimate` | Pre-design analysis — system kW capacity, panel layout, 25-yr NPV curve |
| `/portal` | Customer portal — live installation milestones, documents, messages, payments |
| `/login` | Industrial secure sign-in portal |

### Admin & Sales Operations Console (`/admin/*`)
| Route | Description |
|---|---|
| `/admin` | Executive KPI dashboard — conversion funnel, intent scores, pipeline value |
| `/admin/leads` | Inbound webhook lead list, AI intent scores & human handoff alerts |
| `/admin/conversations` | 2-way CRM message threads & SMS/Call logs |
| `/admin/appointments` | Rep calendar scheduling and consultation bookings |
| `/admin/proposals` | Same-day proposal pipeline & PDF proposal quote viewer |
| `/admin/customers` | Post-sale milestone stage control & Cancellation Risk Index |
| `/admin/nurture` | Contextual drip sequence builder & trigger rule evaluator |
| `/admin/call-coaching` | Speech-to-text call recordings, objection tags & talk ratio scorecards |
| `/admin/settings` | CRM Integration Adapter settings (HubSpot, Salesforce, GoHighLevel, Custom) |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) (SSR + Nitro Server Gateway) |
| **Routing** | [TanStack Router](https://tanstack.com/router) (File-based routing) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **Charts** | [Recharts](https://recharts.org) |
| **Database & Persistence** | Persistent Disk Store (`server_db.json`) |
| **Authentication** | Cryptographic PBKDF2 + Session Token Engine |
| **CRM Integration** | Multi-Provider CRM Adapter (`crmAdapter.ts`) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/PaulShervin/solarflow-dashboard.git
cd solarflow-dashboard

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Commands

```bash
npm run build      # Production SSR build (client & server)
npm run preview    # Preview production build locally
npm run lint       # Run ESLint validation
```

---

## 📂 Project Structure

```
solarflow-dashboard/
├── README.md                       # Comprehensive Platform Overview
├── walkthrough.md                  # Detailed Handoff & API Endpoint Specifications
├── package.json                    # Enterprise Dependencies & Build Scripts
├── vite.config.ts                  # Vite + TanStack Start SSR Configuration
├── tsconfig.json                   # TypeScript Path Aliases (@/*)
├── public/                         # Static Assets & Web Manifest
└── src/
    ├── routes/                     # TanStack Start Route Handlers
    │   ├── index.tsx               # Public Marketing Homepage
    │   ├── qualify.tsx             # Qualification Wizard
    │   ├── estimate.tsx            # Solar Pre-Design & NPV Calculations
    │   ├── portal.tsx              # Customer Live Milestone Portal
    │   ├── login.tsx               # Industrial Secure Login Page
    │   └── admin.*.tsx             # Executive Control Panels
    ├── server/                     # Backend Agentic Engine & API Router
    │   ├── agents/                 # 5 Autonomous Agent Engines
    │   ├── apiRouter.ts            # HTTP API Router (/api/*)
    │   ├── crmAdapter.ts           # HubSpot/Salesforce/GHL 2-Way Sync Adapter
    │   ├── dbStore.ts              # Persistent Disk Store (server_db.json)
    │   └── authStore.ts           # PBKDF2 Password Hashing & Sessions
    ├── components/                 # UI Design System Components
    ├── hooks/                      # Custom Hooks (useSolarDB, useMobile)
    ├── lib/                        # Fetch API Client & Auth Context
    ├── data/                       # Mock Seed Data Fixtures
    └── server.ts                   # Nitro/Vite SSR Entry Point
```

---

## 📄 License

MIT
