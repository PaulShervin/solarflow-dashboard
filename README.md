# SolarFlow Dashboard

A production-grade solar company platform — public marketing site, AI-assisted customer qualification flow, customer portal, and internal admin/sales CRM. Frontend-only with mock data, architected for clean backend integration later.

---

## What's Inside

### Customer Experience
| Route | Description |
|---|---|
| `/` | Public marketing homepage — hero, trust indicators, testimonials, FAQ, financing |
| `/qualify` | Conversational solar qualification assistant with progress tracking |
| `/estimate` | Personalized savings estimate — system size, payback period, annual production |
| `/portal` | Customer portal — project status, milestones, documents, appointments, payments |

### Admin / Sales CRM
| Route | Description |
|---|---|
| `/admin` | KPI dashboard — leads, appointments, proposals, revenue, conversion funnel |
| `/admin/leads` | Lead list with qualification scores and AI summaries |
| `/admin/conversations` | Message threads per lead |
| `/admin/appointments` | Calendar and list view |
| `/admin/proposals` | Proposal pipeline |
| `/admin/customers` | Customer profiles |
| `/admin/nurture` | Campaign list and detail |
| `/admin/tasks` | Priority action queue |
| `/admin/call-coaching` | Call recordings, transcripts, strengths/improvements |
| `/admin/reports` | Analytics and performance reporting |
| `/admin/settings` | System settings |

A **demo switcher** in the corner lets you toggle between the customer and admin views without any auth.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (SSR) |
| Routing | [TanStack Router](https://tanstack.com/router) (file-based) |
| UI | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Charts | [Recharts](https://recharts.org) |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Data Fetching | [TanStack Query](https://tanstack.com/query) |
| Language | TypeScript 5 |
| Runtime | Node.js / Bun |

---

## Getting Started

### Prerequisites

- Node.js 20+ or [Bun](https://bun.sh)

### Install & Run

```bash
# clone the repo
git clone <repository-url>
cd solarflow-dashboard

# install dependencies
bun install
# or: npm install

# start dev server
bun run dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other Commands

```bash
bun run build        # production build
bun run build:dev    # development build
bun run preview      # preview production build locally
bun run lint         # ESLint
bun run format       # Prettier
```

---

## Project Structure

```
src/
├── components/
│   ├── admin/       # Admin shell and layout
│   ├── common/      # Shared components (Logo, DemoSwitcher, StatusPill)
│   ├── site/        # Public site header/footer
│   └── ui/          # shadcn/ui primitives
├── data/
│   └── mock.ts      # All mock data (replace with API calls later)
├── hooks/           # Custom React hooks
├── lib/             # Utilities and error handling
├── routes/          # File-based routes (TanStack Router)
│   ├── index.tsx    # /  (homepage)
│   ├── qualify.tsx  # /qualify
│   ├── estimate.tsx # /estimate
│   ├── portal.tsx   # /portal
│   └── admin.*      # /admin/* routes
├── server.ts        # SSR server entry
└── start.ts         # TanStack Start middleware
```

---

## Design System

- **Colors**: clean white surfaces, deep navy/charcoal frames, solar green primary action, subtle blue accents
- **Typography**: crisp modern sans-serif, generous whitespace, consistent scale
- **Components**: rounded professional cards, soft shadows, hover states, skeleton/loading states, empty states
- **Responsive**: desktop, tablet, and mobile layouts throughout

---

## Replacing Mock Data

All mock data lives in `src/data/mock.ts`. Each route imports directly from there. To wire up a real backend:

1. Create API utility functions in `src/lib/api.ts`
2. Replace `mock.ts` imports in each route with TanStack Query `useQuery` hooks
3. The UI components require no changes — they only consume typed props

---

## License

MIT
