# SolarFlow Dashboard

Build the FRONTEND ONLY for a production-grade solar company website + customer portal + internal admin/sales dashboard. Do NOT build backend logic, database, authentication, CRM integrations, Twilio, AI APIs, or real business functionality yet; use realistic mock data and local state only so I can wire the backend later.

CRITICAL DESIGN GOAL: this must look like a real industrial/commercial SaaS product, NOT a hackathon project. Use the provided visual reference from our conversation as the design source of truth. Match its overall composition, visual hierarchy, spacing, card style, typography, navigation, and green/blue solar-brand aesthetic as closely as practical.

There are TWO separate experiences:

A) CUSTOMER VIEW
1. Public marketing homepage: premium solar-company website. Hero with “Save More. Live Better. Go Solar.”, primary “Get My Free Estimate” CTA, secondary “Talk to an Expert”, high-quality solar house imagery, trust indicators, why-solar section, simple 3-step journey, testimonials/social proof, FAQ, financing section, footer.
2. Conversational qualification page/modal: customer-facing solar assistant chat. Message bubbles, progress indicator, questions for homeowner status, monthly electric bill, home type, timeline, roof information. Mock qualification state/score only.
3. Personalized estimate screen: estimated monthly/annual savings cards, system-size placeholder, annual production placeholder, payback range placeholder, benefits, clear “Book a Free Consultation” CTA. Clearly label estimates as preliminary/illustrative.
4. Customer portal: “My Solar Project” dashboard with project status banner, installation timeline milestones, documents, messages, appointments, payments, support, profile. Focus on trust and transparency.

B) ADMIN VIEW
Create a separate internal admin/sales application shell with left sidebar navigation and desktop dashboard layout. Pages: Dashboard, Leads, Conversations, Appointments, Proposals, Customers, Nurture Campaigns, Tasks, Call Coaching, Reports/Analytics, Settings. Dashboard: KPI cards (new leads, qualified leads, appointments, proposals, won deals, revenue), lead-status distribution, lead-source performance, conversion funnel, lead trend, deal status, call coaching summary, top priority actions, recent activity. Make “Top Priority Actions” prominent because the platform should tell reps what to do next.

Also create frontend screens for Lead list, Lead details with qualification score and AI summary, Conversation view, Appointments calendar/list, Customer profile, Nurture campaign list/detail, Tasks/priority actions, Call coaching detail with audio placeholder, transcript/analysis tabs, strengths/improvement areas, Reports page, Settings page.

ROUTING / UX:
- Customer routes: /, /qualify, /estimate, /portal
- Admin routes: /admin, /admin/leads, /admin/conversations, /admin/appointments, /admin/proposals, /admin/customers, /admin/nurture, /admin/tasks, /admin/call-coaching, /admin/reports, /admin/settings
- Add a simple frontend-only demo view switcher so I can preview customer vs admin areas. No real auth.
- Reusable components, coherent design tokens, consistent spacing and typography.
- Customer experience is conversion-first: never show internal analytics/revenue/sales metrics.
- Admin interface is operations-first: never mix customer portal content into admin analytics.
- Use polished mock data, realistic charts, timelines, status badges, avatars, hover states, loading/skeleton states and empty states.
- Responsive desktop/tablet/mobile.

VISUAL DIRECTION:
- Clean white surfaces, deep navy/charcoal framing, restrained solar green as primary action color, subtle blue accents, soft shadows, rounded professional cards, crisp modern sans-serif typography, generous whitespace.
- The reference composition should feel like a single premium product system: customer area includes website + AI assistant + customer portal; admin area includes the operations dashboard.
- Avoid neon gradients, excessive glassmorphism, giant 3D graphics, excessive animations, or hackathon-style visual gimmicks.
- Use high-quality solar/home imagery only where it strengthens conversion.
- Make the UI feel credible enough to show directly to a real solar company owner.

PRODUCT PRINCIPLE: Capture → Qualify → Convert → Retain. Reflect this in content hierarchy and admin workflows. Admin should surface response time, qualified leads, appointments, proposals, conversion, follow-ups, cancellation risk and next-best actions.

IMPLEMENTATION: frontend-only mock interactions, no backend. Use TypeScript/React/Tailwind/shadcn where useful. Build all screens in the first pass, ensure navigation works and there are no broken routes or unstyled default pages. Keep architecture clean so backend APIs can later replace mock data without rewriting the UI.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
