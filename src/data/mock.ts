/**
 * Mock data layer.
 * Every export here is a pure, typed fixture. Replace these with API/query
 * calls later without touching component code.
 */

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "appointment"
  | "proposal"
  | "won"
  | "lost";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  source: "Google Ads" | "Meta" | "Referral" | "Website" | "Door Knock" | "Partner";
  status: LeadStatus;
  score: number;
  monthlyBill: number;
  homeType: "Single family" | "Townhouse" | "Multi-family" | "Mobile";
  roof: "Asphalt shingle" | "Tile" | "Metal" | "Flat";
  timeline: "0-1 month" | "1-3 months" | "3-6 months" | "Just researching";
  homeowner: boolean;
  createdAt: string;
  lastTouch: string;
  owner: string;
  aiSummary: string;
  tags: string[];
};

export const leads: Lead[] = [
  {
    id: "LD-4821",
    name: "Marcus Whitfield",
    email: "m.whitfield@example.com",
    phone: "(480) 555-0142",
    city: "Chandler",
    state: "AZ",
    source: "Google Ads",
    status: "qualified",
    score: 92,
    monthlyBill: 340,
    homeType: "Single family",
    roof: "Asphalt shingle",
    timeline: "0-1 month",
    homeowner: true,
    createdAt: "2026-08-13T14:22:00Z",
    lastTouch: "18 min ago",
    owner: "Dana Ruiz",
    aiSummary:
      "High-intent homeowner with a $340 average monthly bill and a south-facing asphalt roof replaced in 2021. Explicitly asked about 25-year production guarantees and $0-down financing. Wants an install before the utility rate change in Q4. Recommend booking a same-week in-home consultation and leading with lifetime savings, not monthly payment.",
    tags: ["High bill", "Ready to buy", "Financing interest"],
  },
  {
    id: "LD-4820",
    name: "Priya Raman",
    email: "praman@example.com",
    phone: "(602) 555-0188",
    city: "Gilbert",
    state: "AZ",
    source: "Referral",
    status: "appointment",
    score: 88,
    monthlyBill: 285,
    homeType: "Single family",
    roof: "Tile",
    timeline: "1-3 months",
    homeowner: true,
    createdAt: "2026-08-12T09:05:00Z",
    lastTouch: "2 hours ago",
    owner: "Dana Ruiz",
    aiSummary:
      "Referred by an existing customer in the same neighborhood. Comparing two providers; price-sensitive but responsive. Tile roof adds labor cost — set expectations early.",
    tags: ["Referral", "Comparison shopping"],
  },
  {
    id: "LD-4819",
    name: "Devon Clarke",
    email: "devon.clarke@example.com",
    phone: "(480) 555-0119",
    city: "Mesa",
    state: "AZ",
    source: "Meta",
    status: "new",
    score: 61,
    monthlyBill: 165,
    homeType: "Townhouse",
    roof: "Asphalt shingle",
    timeline: "3-6 months",
    homeowner: true,
    createdAt: "2026-08-15T03:41:00Z",
    lastTouch: "41 min ago",
    owner: "Unassigned",
    aiSummary:
      "Moderate bill, longer timeline. HOA approval likely required for a townhouse. Nurture with education content and re-engage in 30 days.",
    tags: ["HOA", "Nurture"],
  },
  {
    id: "LD-4818",
    name: "Sofia Delgado",
    email: "sofia.d@example.com",
    phone: "(623) 555-0177",
    city: "Peoria",
    state: "AZ",
    source: "Website",
    status: "proposal",
    score: 84,
    monthlyBill: 410,
    homeType: "Single family",
    roof: "Metal",
    timeline: "0-1 month",
    homeowner: true,
    createdAt: "2026-08-08T17:10:00Z",
    lastTouch: "Yesterday",
    owner: "Ben Okafor",
    aiSummary:
      "Proposal delivered for a 9.8 kW system. Opened the document four times but has not signed. Primary hesitation is roof penetration on standing-seam metal. Send the clamp-mount spec sheet.",
    tags: ["Proposal open", "Objection: roof"],
  },
  {
    id: "LD-4817",
    name: "Grant Nakamura",
    email: "gnakamura@example.com",
    phone: "(480) 555-0155",
    city: "Tempe",
    state: "AZ",
    source: "Door Knock",
    status: "contacted",
    score: 47,
    monthlyBill: 120,
    homeType: "Single family",
    roof: "Asphalt shingle",
    timeline: "Just researching",
    homeowner: true,
    createdAt: "2026-08-11T21:33:00Z",
    lastTouch: "3 days ago",
    owner: "Ben Okafor",
    aiSummary:
      "Low bill and no urgency. Poor economics today; revisit if utility rates rise or if a battery incentive lands.",
    tags: ["Low bill"],
  },
  {
    id: "LD-4816",
    name: "Alicia Brennan",
    email: "abrennan@example.com",
    phone: "(602) 555-0133",
    city: "Scottsdale",
    state: "AZ",
    source: "Partner",
    status: "won",
    score: 95,
    monthlyBill: 520,
    homeType: "Single family",
    roof: "Tile",
    timeline: "0-1 month",
    homeowner: true,
    createdAt: "2026-07-28T12:00:00Z",
    lastTouch: "4 days ago",
    owner: "Dana Ruiz",
    aiSummary:
      "Signed a 12.4 kW system with a 13.5 kWh battery. Site survey complete, permitting submitted. Strong referral candidate.",
    tags: ["Closed won", "Battery", "Referral candidate"],
  },
  {
    id: "LD-4815",
    name: "Tom Ferreira",
    email: "tferreira@example.com",
    phone: "(480) 555-0100",
    city: "Queen Creek",
    state: "AZ",
    source: "Google Ads",
    status: "lost",
    score: 38,
    monthlyBill: 95,
    homeType: "Mobile",
    roof: "Metal",
    timeline: "Just researching",
    homeowner: false,
    createdAt: "2026-07-22T08:12:00Z",
    lastTouch: "1 week ago",
    owner: "Ben Okafor",
    aiSummary: "Not a homeowner and outside the serviceable structure type. Disqualified.",
    tags: ["Disqualified"],
  },
  {
    id: "LD-4814",
    name: "Rachel Kim",
    email: "rkim@example.com",
    phone: "(480) 555-0166",
    city: "Ahwatukee",
    state: "AZ",
    source: "Website",
    status: "qualified",
    score: 79,
    monthlyBill: 260,
    homeType: "Single family",
    roof: "Asphalt shingle",
    timeline: "1-3 months",
    homeowner: true,
    createdAt: "2026-08-14T19:47:00Z",
    lastTouch: "5 hours ago",
    owner: "Dana Ruiz",
    aiSummary:
      "Wants to eliminate a summer bill spike. Asked twice about battery backup during outages — lead the consultation with resilience, not payback period.",
    tags: ["Battery interest"],
  },
];

export const statusMeta: Record<LeadStatus, { label: string; tone: BadgeTone }> = {
  new: { label: "New", tone: "info" },
  contacted: { label: "Contacted", tone: "neutral" },
  qualified: { label: "Qualified", tone: "success" },
  appointment: { label: "Appointment", tone: "brand" },
  proposal: { label: "Proposal", tone: "warning" },
  won: { label: "Won", tone: "success" },
  lost: { label: "Lost", tone: "danger" },
};

export type BadgeTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

/* ---------------------------------- KPIs --------------------------------- */

export const kpis = [
  { label: "New leads", value: "148", delta: "+12.4%", trend: "up", hint: "vs. last 30 days" },
  { label: "Qualified leads", value: "86", delta: "+8.1%", trend: "up", hint: "58% of new leads" },
  { label: "Appointments set", value: "42", delta: "+4.6%", trend: "up", hint: "49% of qualified" },
  { label: "Proposals sent", value: "31", delta: "-2.2%", trend: "down", hint: "74% of appointments" },
  { label: "Deals won", value: "14", delta: "+16.7%", trend: "up", hint: "45% close rate" },
  { label: "Revenue booked", value: "$412,800", delta: "+21.3%", trend: "up", hint: "avg $29.5k / deal" },
] as const;

export const operatingMetrics = [
  { label: "Median first response", value: "4m 12s", target: "< 5m", ok: true },
  { label: "Speed-to-lead (1 hr)", value: "94%", target: "> 90%", ok: true },
  { label: "Appointment show rate", value: "78%", target: "> 80%", ok: false },
  { label: "Cancellation risk", value: "5 deals", target: "< 4", ok: false },
];

export const leadStatusDistribution = [
  { name: "New", value: 34, fill: "var(--color-chart-2)" },
  { name: "Contacted", value: 28, fill: "var(--color-chart-5)" },
  { name: "Qualified", value: 41, fill: "var(--color-chart-1)" },
  { name: "Appointment", value: 22, fill: "var(--color-chart-4)" },
  { name: "Proposal", value: 15, fill: "var(--color-chart-3)" },
  { name: "Won", value: 14, fill: "var(--color-chart-1)" },
];

export const leadSourcePerformance = [
  { source: "Google Ads", leads: 52, qualified: 31, won: 6, cpl: 78 },
  { source: "Meta", leads: 38, qualified: 18, won: 3, cpl: 54 },
  { source: "Referral", leads: 24, qualified: 20, won: 4, cpl: 12 },
  { source: "Website", leads: 21, qualified: 12, won: 1, cpl: 31 },
  { source: "Door Knock", leads: 13, qualified: 5, won: 0, cpl: 96 },
];

export const conversionFunnel = [
  { stage: "Leads captured", value: 148, pct: 100 },
  { stage: "Contacted", value: 131, pct: 89 },
  { stage: "Qualified", value: 86, pct: 58 },
  { stage: "Appointment set", value: 42, pct: 28 },
  { stage: "Proposal sent", value: 31, pct: 21 },
  { stage: "Closed won", value: 14, pct: 9 },
];

export const leadTrend = [
  { week: "Jun 15", leads: 24, qualified: 12, won: 2 },
  { week: "Jun 22", leads: 29, qualified: 15, won: 3 },
  { week: "Jun 29", leads: 26, qualified: 14, won: 2 },
  { week: "Jul 06", leads: 33, qualified: 19, won: 4 },
  { week: "Jul 13", leads: 31, qualified: 17, won: 3 },
  { week: "Jul 20", leads: 38, qualified: 23, won: 5 },
  { week: "Jul 27", leads: 35, qualified: 21, won: 4 },
  { week: "Aug 03", leads: 42, qualified: 26, won: 6 },
  { week: "Aug 10", leads: 45, qualified: 28, won: 7 },
];

export const dealStatus = [
  { label: "In survey", count: 9, value: "$264k" },
  { label: "Permitting", count: 6, value: "$178k" },
  { label: "Scheduled install", count: 4, value: "$121k" },
  { label: "Awaiting PTO", count: 3, value: "$88k" },
];

export const priorityActions = [
  {
    id: "PA-1",
    priority: "critical" as const,
    title: "Call Marcus Whitfield back",
    detail: "Score 92 · inbound 18 min ago · asked for a same-week consultation",
    meta: "SLA breach in 12 min",
    action: "Call now",
  },
  {
    id: "PA-2",
    priority: "critical" as const,
    title: "Sofia Delgado's proposal is going cold",
    detail: "Opened 4× with no signature · objection logged on metal-roof mounting",
    meta: "Sent 6 days ago",
    action: "Send spec sheet",
  },
  {
    id: "PA-3",
    priority: "high" as const,
    title: "Confirm 3 appointments for tomorrow",
    detail: "2 of 3 have not confirmed · historical no-show risk 31%",
    meta: "Due today, 5:00 PM",
    action: "Send reminders",
  },
  {
    id: "PA-4",
    priority: "high" as const,
    title: "Re-engage 8 leads stalled in Contacted",
    detail: "No touch in 5+ days · avg score 68",
    meta: "Nurture: Warm Re-engage",
    action: "Enroll",
  },
  {
    id: "PA-5",
    priority: "medium" as const,
    title: "Review Ben Okafor's discovery calls",
    detail: "Discovery score dropped to 64 across 3 calls this week",
    meta: "Coaching",
    action: "Open coaching",
  },
];

export const recentActivity = [
  { who: "Dana Ruiz", what: "booked a consultation with Priya Raman", when: "12 min ago", tone: "brand" as BadgeTone },
  { who: "System", what: "qualified LD-4821 at score 92 from the web assistant", when: "18 min ago", tone: "success" as BadgeTone },
  { who: "Ben Okafor", what: "sent proposal PRP-2214 to Sofia Delgado", when: "1 hr ago", tone: "warning" as BadgeTone },
  { who: "Alicia Brennan", what: "signed a 12.4 kW agreement", when: "4 hrs ago", tone: "success" as BadgeTone },
  { who: "System", what: "flagged 5 deals with cancellation risk", when: "6 hrs ago", tone: "danger" as BadgeTone },
  { who: "Dana Ruiz", what: "logged a site-survey note for Alicia Brennan", when: "Yesterday", tone: "neutral" as BadgeTone },
];

export const callCoachingSummary = {
  teamScore: 81,
  callsAnalyzed: 126,
  talkRatio: 42,
  discovery: 74,
  objectionHandling: 68,
  nextStepSet: 88,
};

/* ------------------------------ Conversations ----------------------------- */

export type ConversationMessage = {
  id: string;
  from?: "customer" | "assistant" | "rep";
  sender?: string;
  text: string;
  at?: string;
  time?: string;
  channel?: string;
};

export type Message = ConversationMessage;

export type Conversation = {
  id: string;
  leadId: string;
  name: string;
  customer?: string;
  channel: "Web chat" | "SMS" | "Email";
  status: "Active" | "Awaiting reply" | "Closed";
  score: number;
  preview: string;
  updatedAt: string;
  unread: number;
  messages: ConversationMessage[];
  lastMessage?: string;
  lastTime?: string;
  stage?: string;
  phone?: string;
};

export type PortalMilestone = {
  title: string;
  date: string;
  state?: string;
  status?: string;
  detail?: string;
  description?: string;
};

export const conversations: Conversation[] = [
  {
    id: "CV-901",
    leadId: "LD-4821",
    name: "Marcus Whitfield",
    channel: "Web chat",
    status: "Active",
    score: 92,
    preview: "Yes, I own the home. Bill is around $340 in summer.",
    updatedAt: "18 min ago",
    unread: 2,
    messages: [
      { id: "m1", from: "assistant", text: "Hi Marcus! I can put together a free solar savings estimate in about 60 seconds. First — do you own your home?", at: "9:02 AM" },
      { id: "m2", from: "customer", text: "Yes, I own it. Bought in 2019.", at: "9:03 AM" },
      { id: "m3", from: "assistant", text: "Great. Roughly what's your average monthly electric bill?", at: "9:03 AM" },
      { id: "m4", from: "customer", text: "Around $340 in summer, maybe $210 in winter.", at: "9:04 AM" },
      { id: "m5", from: "assistant", text: "That's a strong fit. How soon are you looking to move forward?", at: "9:04 AM" },
      { id: "m6", from: "customer", text: "Soon — ideally before the rate change. Do you offer $0 down?", at: "9:06 AM" },
      { id: "m7", from: "rep", text: "Marcus, this is Dana with SolarPeak. We do offer $0-down financing. I have Thursday at 4 PM or Friday at 10 AM open for a free in-home consult.", at: "9:11 AM" },
    ],
  },
  {
    id: "CV-900",
    leadId: "LD-4814",
    name: "Rachel Kim",
    channel: "SMS",
    status: "Awaiting reply",
    score: 79,
    preview: "Does the battery keep the AC running during an outage?",
    updatedAt: "5 hrs ago",
    unread: 1,
    messages: [
      { id: "m1", from: "customer", text: "Does the battery keep the AC running during an outage?", at: "4:40 AM" },
      { id: "m2", from: "assistant", text: "It can back up essential circuits, and a larger configuration can carry central AC. A design consultant can size it for your panel.", at: "4:41 AM" },
    ],
  },
  {
    id: "CV-899",
    leadId: "LD-4818",
    name: "Sofia Delgado",
    channel: "Email",
    status: "Awaiting reply",
    score: 84,
    preview: "I'm still worried about drilling into a standing-seam roof.",
    updatedAt: "Yesterday",
    unread: 0,
    messages: [
      { id: "m1", from: "customer", text: "I'm still worried about drilling into a standing-seam roof.", at: "Aug 14" },
      { id: "m2", from: "rep", text: "Completely fair — standing seam uses clamp mounts with zero penetrations. Sending the spec sheet.", at: "Aug 14" },
    ],
  },
  {
    id: "CV-898",
    leadId: "LD-4819",
    name: "Devon Clarke",
    channel: "Web chat",
    status: "Closed",
    score: 61,
    preview: "Just looking for now, thanks.",
    updatedAt: "2 days ago",
    unread: 0,
    messages: [
      { id: "m1", from: "customer", text: "Just looking for now, thanks.", at: "Aug 13" },
      { id: "m2", from: "assistant", text: "Totally fine. I'll email you a savings breakdown you can revisit any time.", at: "Aug 13" },
    ],
  },
];

/* ------------------------------ Appointments ------------------------------ */

export type Appointment = {
  id: string;
  customer: string;
  email?: string;
  phone?: string;
  notes?: string;
  type: "In-home consult" | "Virtual consult" | "Site survey" | "Install walkthrough";
  date: string;
  day?: string;
  time: string;
  rep: string;
  status: "Confirmed" | "Pending" | "Rescheduled" | "Completed";
  address?: string;
  risk?: string;
};

export const appointments: Appointment[] = [
  { id: "AP-310", customer: "Priya Raman", type: "In-home consult", date: "2026-08-15", day: "Today", time: "2:00 PM", rep: "Dana Ruiz", status: "Confirmed", address: "2214 E Pecan Rd, Gilbert" },
  { id: "AP-311", customer: "Marcus Whitfield", type: "In-home consult", date: "2026-08-15", day: "Today", time: "4:30 PM", rep: "Dana Ruiz", status: "Pending", address: "884 W Ray Rd, Chandler", risk: "Unconfirmed" },
  { id: "AP-312", customer: "Rachel Kim", type: "Virtual consult", date: "2026-08-16", day: "Tomorrow", time: "10:00 AM", rep: "Ben Okafor", status: "Confirmed", address: "Zoom" },
  { id: "AP-313", customer: "Alicia Brennan", type: "Site survey", date: "2026-08-16", day: "Tomorrow", time: "1:00 PM", rep: "Field team", status: "Confirmed", address: "77 N Hayden Rd, Scottsdale" },
  { id: "AP-314", customer: "Devon Clarke", type: "Virtual consult", date: "2026-08-17", day: "Mon", time: "9:30 AM", rep: "Ben Okafor", status: "Pending", address: "Google Meet", risk: "No-show risk 31%" },
  { id: "AP-315", customer: "Sofia Delgado", type: "Install walkthrough", date: "2026-08-18", day: "Tue", time: "11:00 AM", rep: "Field team", status: "Rescheduled", address: "1490 N 91st Ave, Peoria" },
];

/* ------------------------- Rep availability matrix ------------------------ */

export type AvailabilitySlot = {
  id: string;
  rep: string;
  date: string; // YYYY-MM-DD
  day: string; // display label, e.g. "Tomorrow" / "Mon"
  time: string; // e.g. "10:00 AM"
  order: number; // slot index within a day (sort order)
  status: "open" | "closed";
};

const AVAILABILITY_REPS = ["Dana Ruiz", "Ben Okafor", "Marcus Chen"];
const AVAILABILITY_TIMES = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Builds the sales rep availability matrix: next N weekdays (skipping weekends)
 * starting tomorrow, hourly slots per rep. A couple of slots are seeded closed
 * so booking conflict handling is demonstrable.
 */
export function buildAvailabilityMatrix(daysAhead = 5): AvailabilitySlot[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: { date: string; label: string }[] = [];
  let offset = 1;
  while (dates.length < daysAhead) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      dates.push({ date: toISODate(d), label: offset === 1 ? "Tomorrow" : labels[dow]! });
    }
    offset++;
  }

  const slots: AvailabilitySlot[] = [];
  let idCounter = 1;
  for (const rep of AVAILABILITY_REPS) {
    for (const { date, label } of dates) {
      AVAILABILITY_TIMES.forEach((time, idx) => {
        slots.push({
          id: `AV-${String(idCounter++).padStart(3, "0")}`,
          rep,
          date,
          day: label,
          time,
          order: idx,
          status: "open",
        });
      });
    }
  }

  // Seed a few closed slots on the first day to prove conflict handling.
  const firstDate = dates[0]!.date;
  const seedClosed: [string, string][] = [
    [AVAILABILITY_REPS[0]!, "9:00 AM"],
    [AVAILABILITY_REPS[1]!, "2:00 PM"],
    [AVAILABILITY_REPS[2]!, "4:00 PM"],
  ];
  for (const [rep, time] of seedClosed) {
    const slot = slots.find((s) => s.rep === rep && s.date === firstDate && s.time === time);
    if (slot) slot.status = "closed";
  }

  return slots;
}

export const availabilityMatrix: AvailabilitySlot[] = buildAvailabilityMatrix();

/* -------------------------------- Proposals ------------------------------- */

export type Proposal = {
  id: string;
  customer: string;
  systemKw: number;
  battery: boolean;
  value: number;
  status: "Draft" | "Sent" | "Viewed" | "Signed" | "Expired";
  sent: string;
  views: number;
  rep: string;
};

export const proposals: Proposal[] = [
  { id: "PRP-2214", customer: "Sofia Delgado", systemKw: 9.8, battery: false, value: 28400, status: "Viewed", sent: "Aug 9", views: 4, rep: "Ben Okafor" },
  { id: "PRP-2213", customer: "Alicia Brennan", systemKw: 12.4, battery: true, value: 46900, status: "Signed", sent: "Aug 2", views: 6, rep: "Dana Ruiz" },
  { id: "PRP-2212", customer: "Priya Raman", systemKw: 8.2, battery: false, value: 24100, status: "Sent", sent: "Aug 13", views: 1, rep: "Dana Ruiz" },
  { id: "PRP-2211", customer: "Rachel Kim", systemKw: 7.6, battery: true, value: 33200, status: "Draft", sent: "—", views: 0, rep: "Dana Ruiz" },
  { id: "PRP-2210", customer: "Grant Nakamura", systemKw: 5.1, battery: false, value: 15600, status: "Expired", sent: "Jul 18", views: 2, rep: "Ben Okafor" },
];

/* -------------------------------- Customers ------------------------------- */

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  systemKw: number;
  battery: boolean;
  contractValue: number;
  stage: string;
  installDate: string;
  csat: number;
  referrals: number;
};

export const customers: Customer[] = [
  { id: "CU-118", name: "Alicia Brennan", email: "abrennan@example.com", phone: "(602) 555-0133", address: "77 N Hayden Rd, Scottsdale, AZ", systemKw: 12.4, battery: true, contractValue: 46900, stage: "Permitting", installDate: "Sep 12, 2026", csat: 5, referrals: 2 },
  { id: "CU-117", name: "Jordan Ellis", email: "jellis@example.com", phone: "(480) 555-0121", address: "913 S Alma School Rd, Mesa, AZ", systemKw: 9.1, battery: false, contractValue: 26800, stage: "Installed", installDate: "Jul 2, 2026", csat: 5, referrals: 1 },
  { id: "CU-116", name: "Nina Patel", email: "npatel@example.com", phone: "(623) 555-0190", address: "44 W Bell Rd, Glendale, AZ", systemKw: 7.8, battery: false, contractValue: 22400, stage: "Awaiting PTO", installDate: "Jun 20, 2026", csat: 4, referrals: 0 },
  { id: "CU-115", name: "Owen Marsh", email: "omarsh@example.com", phone: "(480) 555-0104", address: "301 E Warner Rd, Tempe, AZ", systemKw: 10.6, battery: true, contractValue: 39500, stage: "Scheduled install", installDate: "Aug 28, 2026", csat: 4, referrals: 3 },
];

/* ---------------------------- Nurture campaigns --------------------------- */

export type Campaign = {
  id: string;
  name: string;
  audience: string;
  channel: string;
  status: "Active" | "Paused" | "Draft";
  enrolled: number;
  openRate: number;
  replyRate: number;
  reactivated: number;
  steps: { day: string; channel: string; subject: string }[];
};

export const campaigns: Campaign[] = [
  {
    id: "NC-14",
    name: "Warm Re-engage (30 day)",
    audience: "Contacted, no touch 5+ days, score > 60",
    channel: "Email + SMS",
    status: "Active",
    enrolled: 214,
    openRate: 48,
    replyRate: 11,
    reactivated: 26,
    steps: [
      { day: "Day 0", channel: "SMS", subject: "Quick question about your roof" },
      { day: "Day 2", channel: "Email", subject: "What 3 neighbors on your street are paying" },
      { day: "Day 6", channel: "Email", subject: "Your preliminary savings estimate (still valid)" },
      { day: "Day 12", channel: "SMS", subject: "Want me to close your file?" },
    ],
  },
  {
    id: "NC-13",
    name: "Proposal Follow-through",
    audience: "Proposal sent, unsigned after 72 hrs",
    channel: "Email",
    status: "Active",
    enrolled: 63,
    openRate: 71,
    replyRate: 24,
    reactivated: 18,
    steps: [
      { day: "Day 3", channel: "Email", subject: "Anything unclear in your proposal?" },
      { day: "Day 5", channel: "Email", subject: "How the 30% federal credit applies to you" },
      { day: "Day 9", channel: "Email", subject: "Your pricing expires Friday" },
    ],
  },
  {
    id: "NC-12",
    name: "Long-horizon Education",
    audience: "Timeline: just researching",
    channel: "Email",
    status: "Paused",
    enrolled: 388,
    openRate: 34,
    replyRate: 4,
    reactivated: 9,
    steps: [
      { day: "Week 1", channel: "Email", subject: "Solar 101: how net metering actually works" },
      { day: "Week 3", channel: "Email", subject: "Buy vs. lease, in plain English" },
      { day: "Week 6", channel: "Email", subject: "Utility rate outlook for your area" },
    ],
  },
  {
    id: "NC-11",
    name: "Post-install Referral",
    audience: "Customers, 30 days after PTO",
    channel: "Email + SMS",
    status: "Draft",
    enrolled: 0,
    openRate: 0,
    replyRate: 0,
    reactivated: 0,
    steps: [{ day: "Day 30", channel: "Email", subject: "Know a neighbor tired of their bill?" }],
  },
];

/* ---------------------------------- Tasks --------------------------------- */

export type Task = {
  id: string;
  title: string;
  related: string;
  due: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  owner: string;
  done: boolean;
  type: "Call" | "Email" | "Follow-up" | "Admin" | "Site";
};

export const tasks: Task[] = [
  { id: "TK-501", title: "Call Marcus Whitfield (SLA)", related: "LD-4821", due: "Today · 9:30 AM", priority: "Critical", owner: "Dana Ruiz", done: false, type: "Call" },
  { id: "TK-502", title: "Send metal-roof clamp spec to Sofia", related: "PRP-2214", due: "Today · 11:00 AM", priority: "Critical", owner: "Ben Okafor", done: false, type: "Email" },
  { id: "TK-503", title: "Confirm tomorrow's 3 appointments", related: "Appointments", due: "Today · 5:00 PM", priority: "High", owner: "Dana Ruiz", done: false, type: "Follow-up" },
  { id: "TK-504", title: "Upload HOA packet for Devon Clarke", related: "LD-4819", due: "Tomorrow", priority: "Medium", owner: "Ben Okafor", done: false, type: "Admin" },
  { id: "TK-505", title: "Site survey photos for Alicia Brennan", related: "CU-118", due: "Aug 16", priority: "High", owner: "Field team", done: false, type: "Site" },
  { id: "TK-506", title: "Log outcome for Grant Nakamura call", related: "LD-4817", due: "Aug 14", priority: "Low", owner: "Ben Okafor", done: true, type: "Admin" },
];

/* ------------------------------ Call coaching ----------------------------- */

export type Call = {
  id: string;
  rep: string;
  customer: string;
  date: string;
  duration: string;
  score: number;
  outcome: string;
  talkRatio: number | { rep: number; customer: number };
  audioUrl?: string;
  sentiment?: string;
  strengths?: string[];
  improvements?: string[];
  metrics?: { label: string; value: number }[];
  transcript: { at?: string; time?: string; speaker: string; text: string }[];
  objections?: { topic: string; RepHandled?: boolean; repHandled?: boolean; note: string }[];
  coachingNotes?: string[];
  keyMoments?: { time: string; speaker: string; tag: string; text: string }[];
};

export const calls: Call[] = [
  {
    id: "CL-77",
    rep: "Dana Ruiz",
    customer: "Priya Raman",
    date: "Aug 14, 2026",
    duration: "14:22",
    score: 88,
    outcome: "Appointment set",
    talkRatio: 41,
    strengths: [
      "Opened with a specific referral reference, which built instant credibility.",
      "Asked three open discovery questions before mentioning price.",
      "Locked a concrete next step with a date and time before ending the call.",
    ],
    improvements: [
      "Quoted a monthly payment before establishing the value of lifetime savings.",
      "Missed the buying signal at 08:41 (\"my neighbor loves theirs\") — no referral ask.",
      "Talk ratio rose to 63% in the final four minutes.",
    ],
    metrics: [
      { label: "Discovery", value: 84 },
      { label: "Objection handling", value: 72 },
      { label: "Value framing", value: 79 },
      { label: "Next step", value: 96 },
      { label: "Listening", value: 81 },
    ],
    transcript: [
      { at: "00:04", speaker: "Dana Ruiz", text: "Hi Priya, it's Dana from SolarPeak — the Hendersons on Pecan mentioned you'd been asking about their panels." },
      { at: "00:18", speaker: "Priya Raman", text: "Yes! Their bill dropped a lot apparently. Mine's been climbing all summer." },
      { at: "00:29", speaker: "Dana Ruiz", text: "Tell me about that — what does a typical July look like for you?" },
      { at: "00:41", speaker: "Priya Raman", text: "Around $285. It was $190 two years ago." },
      { at: "01:02", speaker: "Dana Ruiz", text: "That trend is the real cost. Before we talk numbers, is the roof original to the house?" },
      { at: "08:41", speaker: "Priya Raman", text: "My neighbor loves theirs, honestly that's most of why I called." },
      { at: "12:10", speaker: "Dana Ruiz", text: "Let's get a design consultant out. Thursday at 4, or Friday morning?" },
    ],
  },
  {
    id: "CL-76",
    rep: "Ben Okafor",
    customer: "Grant Nakamura",
    date: "Aug 13, 2026",
    duration: "6:48",
    score: 61,
    outcome: "No next step",
    talkRatio: 68,
    strengths: ["Polite and quick to build rapport.", "Correctly identified low bill economics early."],
    improvements: [
      "Talk ratio of 68% — the customer spoke for under two minutes.",
      "No discovery on future usage (EV, pool, additions).",
      "Ended the call without scheduling any follow-up or nurture enrollment.",
    ],
    metrics: [
      { label: "Discovery", value: 52 },
      { label: "Objection handling", value: 58 },
      { label: "Value framing", value: 61 },
      { label: "Next step", value: 30 },
      { label: "Listening", value: 44 },
    ],
    transcript: [
      { at: "00:03", speaker: "Ben Okafor", text: "Hi Grant, Ben with SolarPeak, following up on your request." },
      { at: "00:12", speaker: "Grant Nakamura", text: "Right, I'm really just researching." },
      { at: "00:16", speaker: "Ben Okafor", text: "Totally understood. So what we do is install rooftop systems that offset..." },
      { at: "05:55", speaker: "Grant Nakamura", text: "I'll reach out if I decide to do something." },
    ],
  },
  {
    id: "CL-75",
    rep: "Dana Ruiz",
    customer: "Marcus Whitfield",
    date: "Aug 13, 2026",
    duration: "11:05",
    score: 91,
    outcome: "Appointment set",
    talkRatio: 38,
    strengths: ["Excellent silence after the pricing question.", "Reframed the objection as a cost of waiting."],
    improvements: ["Did not confirm both decision-makers would attend."],
    metrics: [
      { label: "Discovery", value: 92 },
      { label: "Objection handling", value: 88 },
      { label: "Value framing", value: 90 },
      { label: "Next step", value: 94 },
      { label: "Listening", value: 89 },
    ],
    transcript: [
      { at: "00:05", speaker: "Dana Ruiz", text: "Marcus, thanks for the details in chat. What made you start looking now?" },
      { at: "00:20", speaker: "Marcus Whitfield", text: "The rate increase notice, honestly." },
    ],
  },
];

/* -------------------------- Customer portal data -------------------------- */

export const portalProject = {
  customer: "Alicia Brennan",
  address: "77 N Hayden Rd, Scottsdale, AZ 85251",
  systemKw: 12.4,
  panels: 31,
  battery: "13.5 kWh backup",
  contractValue: 46900,
  status: "Permitting in progress",
  statusDetail: "Your permit was submitted to the City of Scottsdale on Aug 11. Typical approval takes 10–15 business days.",
  progress: 45,
  projectedInstall: "Sep 12, 2026",
  estMonthlySavings: 214,
  estAnnualProduction: "19,400 kWh",
  consultant: { name: "Dana Ruiz", role: "Senior Solar Consultant", phone: "(480) 555-0170" },
};

export const portalMilestones: PortalMilestone[] = [
  { title: "Agreement signed", date: "Aug 2, 2026", state: "done", status: "complete", detail: "12.4 kW system with battery backup.", description: "12.4 kW system with battery backup." },
  { title: "Site survey", date: "Aug 8, 2026", state: "done", status: "complete", detail: "Roof, attic, and electrical panel measured and photographed.", description: "Roof, attic, and electrical panel measured and photographed." },
  { title: "Engineering & design", date: "Aug 10, 2026", state: "done", status: "complete", detail: "Final layout approved by our design team.", description: "Final layout approved by our design team." },
  { title: "Permitting", date: "In progress", state: "active", status: "current", detail: "Submitted to the City of Scottsdale on Aug 11.", description: "Submitted to the City of Scottsdale on Aug 11." },
  { title: "Installation", date: "Sep 12, 2026", state: "upcoming", status: "upcoming", detail: "Estimated 1–2 days on site.", description: "Estimated 1–2 days on site." },
  { title: "Inspection", date: "Late Sep 2026", state: "upcoming", status: "upcoming", detail: "City inspector verifies the installation.", description: "City inspector verifies the installation." },
  { title: "Utility approval (PTO)", date: "Oct 2026", state: "upcoming", status: "upcoming", detail: "Permission to operate — your system switches on.", description: "Permission to operate — your system switches on." },
];

export const portalDocuments = [
  { name: "Solar Purchase Agreement", type: "PDF", size: "1.4 MB", date: "Aug 2, 2026", status: "Signed" },
  { name: "System Design Layout", type: "PDF", size: "3.1 MB", date: "Aug 10, 2026", status: "Final" },
  { name: "Site Survey Report", type: "PDF", size: "2.2 MB", date: "Aug 8, 2026", status: "Final" },
  { name: "City Permit Application", type: "PDF", size: "820 KB", date: "Aug 11, 2026", status: "Submitted" },
  { name: "Federal Tax Credit Guide", type: "PDF", size: "540 KB", date: "Aug 2, 2026", status: "Reference" },
];

export const portalMessages = [
  { from: "Dana Ruiz", role: "Your consultant", text: "Good news — the permit package went in this morning. I'll flag the moment the city responds.", at: "Aug 11, 9:14 AM", mine: false },
  { from: "You", role: "", text: "Thanks Dana. Any chance the install slides earlier if approval comes back fast?", at: "Aug 11, 12:02 PM", mine: true },
  { from: "Dana Ruiz", role: "Your consultant", text: "Possible. If we're approved by Aug 25 I can ask scheduling for a Sep 4 crew slot.", at: "Aug 11, 12:31 PM", mine: false },
];

export const portalAppointments = [
  { title: "Pre-install walkthrough", when: "Sep 8, 2026 · 10:00 AM", who: "Field operations", where: "Your home", status: "Scheduled" },
  { title: "Installation day 1", when: "Sep 12, 2026 · 7:30 AM", who: "Install crew (4)", where: "Your home", status: "Tentative" },
];

export const portalPayments = [
  { label: "Deposit", amount: "$2,500", due: "Paid Aug 2, 2026", status: "Paid" },
  { label: "Permit milestone", amount: "$9,380", due: "Due at permit approval", status: "Upcoming" },
  { label: "Installation milestone", amount: "$23,450", due: "Due at install completion", status: "Upcoming" },
  { label: "Final payment", amount: "$11,570", due: "Due at PTO", status: "Upcoming" },
];

/* -------------------------- Marketing / estimate -------------------------- */

export const testimonials = [
  {
    quote:
      "Our July bill went from $312 to $18. The crew was in and out in a day and the portal told us exactly where we stood the whole time.",
    name: "Jordan Ellis",
    location: "Mesa, AZ",
    system: "9.1 kW · installed Jul 2026",
  },
  {
    quote:
      "I got three quotes. SolarPeak was the only one that showed me the math instead of a monthly payment. No pressure, no gimmicks.",
    name: "Nina Patel",
    location: "Glendale, AZ",
    system: "7.8 kW · installed Jun 2026",
  },
  {
    quote:
      "The battery carried us through two outages this summer. Worth every dollar, and the referral bonus paid for our first year of insurance.",
    name: "Owen Marsh",
    location: "Tempe, AZ",
    system: "10.6 kW + battery",
  },
];

export const faqs = [
  {
    q: "How much does a home solar system actually cost?",
    a: "Most homes we serve land between $18,000 and $45,000 before incentives, depending on system size and whether you add battery storage. The 30% federal tax credit and available state incentives typically reduce that meaningfully. Your consultant will show you the full itemized number — no hidden dealer fees.",
  },
  {
    q: "What happens if my roof needs replacing?",
    a: "We inspect roof condition during the site survey. If your roof has fewer than five years of life left, we'll tell you before you sign and can coordinate replacement with a partner so panels are only mounted once.",
  },
  {
    q: "Do I still have a utility bill after going solar?",
    a: "Usually yes, but a much smaller one. Most utilities keep a fixed service charge, and your system is sized against your actual usage rather than to zero the bill on paper.",
  },
  {
    q: "How long does the whole process take?",
    a: "From signed agreement to switched-on system is typically 8 to 14 weeks. Permitting and utility approval are the two longest steps, and both are tracked in your customer portal.",
  },
  {
    q: "What is covered by the warranty?",
    a: "25 years on panels and inverters, 25 years on production, and 10 years on our workmanship and roof penetrations. Warranty service is handled by our own crews, not a subcontractor.",
  },
  {
    q: "Is a battery worth it?",
    a: "It depends on your goals. If outage resilience or time-of-use arbitrage matters to you, a battery is compelling. If you're purely optimizing payback, panels alone usually win. We'll model both.",
  },
];

export const qualifyQuestions = [
  {
    key: "homeowner",
    prompt: "First — do you own your home? Solar requires ownership or written landlord approval.",
    options: ["Yes, I own it", "No, I rent", "I'm buying soon"],
  },
  {
    key: "bill",
    prompt: "Roughly what's your average monthly electric bill?",
    options: ["Under $100", "$100 – $200", "$200 – $350", "Over $350"],
  },
  {
    key: "homeType",
    prompt: "What type of home is it?",
    options: ["Single family", "Townhouse", "Multi-family", "Mobile / manufactured"],
  },
  {
    key: "roof",
    prompt: "What's your roof made of, and roughly how old is it?",
    options: ["Asphalt shingle, under 10 yrs", "Tile", "Metal", "Flat / other or not sure"],
  },
  {
    key: "timeline",
    prompt: "Last one — how soon would you want this installed?",
    options: ["As soon as possible", "In 1 – 3 months", "In 3 – 6 months", "Just researching"],
  },
] as const;

export const estimate = {
  monthlySavings: 214,
  annualSavings: 2568,
  twentyFiveYear: 71400,
  systemSize: "11.2 kW",
  panels: 28,
  annualProduction: "17,900 kWh",
  offset: 96,
  paybackLow: 6.5,
  paybackHigh: 8.5,
  currentBill: 340,
  newBill: 126,
  co2: "8.4 tons",
};
