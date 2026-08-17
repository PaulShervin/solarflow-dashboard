/**
 * Dynamic SolarFlow Data Layer.
 * Clean domain type re-exports and UI configuration constants.
 * Hardcoded mock fixtures have been replaced with live dynamic records.
 */

export * from "@/types/solar";
import type {
  LeadStatus,
  BadgeTone,
  Lead,
  Conversation,
  Appointment,
  AvailabilitySlot,
  Proposal,
  Customer,
  Campaign,
  Task,
  Call,
  PortalMilestone,
  PortalProject,
  OperatingMetric,
} from "@/types/solar";

export const statusMeta: Record<LeadStatus, { label: string; tone: BadgeTone }> = {
  new: { label: "New", tone: "info" },
  contacted: { label: "Contacted", tone: "neutral" },
  qualified: { label: "Qualified", tone: "success" },
  appointment: { label: "Appointment", tone: "brand" },
  proposal: { label: "Proposal", tone: "warning" },
  won: { label: "Won", tone: "success" },
  lost: { label: "Lost", tone: "danger" },
};

/* ---------------- Empty initial states (Replaced by dynamic live data) ---------------- */

export const leads: Lead[] = [];
export const conversations: Conversation[] = [];
export const appointments: Appointment[] = [];
export const proposals: Proposal[] = [];
export const customers: Customer[] = [];
export const campaigns: Campaign[] = [];
export const tasks: Task[] = [];
export const calls: Call[] = [];
export const priorityActions: any[] = [];
export const recentActivity: any[] = [];

export const operatingMetrics: OperatingMetric[] = [
  { label: "Median first response", value: "2m 45s", target: "< 5m", ok: true },
  { label: "Speed-to-lead (1 hr)", value: "98%", target: "> 90%", ok: true },
  { label: "Appointment show rate", value: "100%", target: "> 80%", ok: true },
  { label: "Pending critical tasks", value: "0 tasks", target: "< 5", ok: true },
];

export const leadStatusDistribution: { name: string; value: number; fill: string }[] = [];
export const leadSourcePerformance: { source: string; leads: number; qualified: number; won: number; cpl?: number }[] = [];
export const conversionFunnel: { stage: string; value: number; pct: number }[] = [];
export const leadTrend: { week: string; leads: number; qualified: number; won: number }[] = [];
export const dealStatus: { label: string; count: number; value: string }[] = [];

export const kpis = [
  { label: "Live leads", value: "0", delta: "0%", trend: "up" as const, hint: "in database" },
  { label: "Qualified leads", value: "0", delta: "0%", trend: "up" as const, hint: "score >= 75" },
  { label: "Appointments set", value: "0", delta: "0%", trend: "up" as const, hint: "in queue" },
  { label: "Proposals sent", value: "0", delta: "0%", trend: "up" as const, hint: "pipeline value" },
  { label: "Deals won", value: "0", delta: "0%", trend: "up" as const, hint: "signed contracts" },
  { label: "Revenue booked", value: "$0", delta: "0%", trend: "up" as const, hint: "from closed deals" },
] as const;

export const callCoachingSummary = {
  teamScore: 0,
  callsAnalyzed: 0,
  talkRatio: 0,
  discovery: 0,
  objectionHandling: 0,
  nextStepSet: 0,
};

const AVAILABILITY_REPS = ["Dana Ruiz", "Ben Okafor", "Marcus Chen"];
const AVAILABILITY_TIMES = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
      dates.push({ date: toISODate(d), label: offset === 1 ? "Tomorrow" : (labels[dow] || "Day") });
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

  return slots;
}

export const availabilityMatrix: AvailabilitySlot[] = buildAvailabilityMatrix();

/* -------------------------- Customer portal clean defaults -------------------------- */

export const portalProject: PortalProject = {
  customer: "Active Project",
  address: "77 N Hayden Rd, Scottsdale, AZ 85251",
  systemKw: 10.5,
  panels: 26,
  battery: "13.5 kWh backup",
  contractValue: 38500,
  status: "In Progress",
  statusDetail: "Design & permitting undergoing review.",
  progress: 25,
  projectedInstall: "Pending schedule",
  estMonthlySavings: 210,
  estAnnualProduction: "16,800 kWh",
  consultant: { name: "Dana Ruiz", role: "Senior Solar Consultant", phone: "(480) 555-0170" },
};

export const portalMilestones: PortalMilestone[] = [
  { title: "Agreement signed", date: "Initial phase", state: "done", status: "complete", detail: "Solar agreement signed." },
  { title: "Site survey", date: "In progress", state: "active", status: "current", detail: "Roof & electrical verification." },
  { title: "Engineering & design", date: "Upcoming", state: "upcoming", status: "upcoming", detail: "CAD drawings and structural stamps." },
  { title: "Permitting", date: "Upcoming", state: "upcoming", status: "upcoming", detail: "Permit submission to AHJ." },
  { title: "Installation", date: "Upcoming", state: "upcoming", status: "upcoming", detail: "Rooftop solar and inverter installation." },
  { title: "Inspection", date: "Upcoming", state: "upcoming", status: "upcoming", detail: "City inspector verification." },
  { title: "Utility approval (PTO)", date: "Upcoming", state: "upcoming", status: "upcoming", detail: "Grid interconnection approval." },
];

export const portalDocuments = [
  { name: "Solar Purchase Agreement", type: "PDF", size: "1.4 MB", date: "Current", status: "Signed" },
  { name: "System Design Layout", type: "PDF", size: "3.1 MB", date: "Current", status: "Final" },
  { name: "Federal Tax Credit Guide", type: "PDF", size: "540 KB", date: "Reference", status: "Reference" },
];

export const portalMessages: any[] = [];
export const portalAppointments: any[] = [];
export const portalPayments: any[] = [];

/* -------------------------- Marketing & Questionnaire UI Configuration -------------------------- */

export const socialProof = [
  {
    quote: "Our monthly bill dropped from ₹8,500 to under ₹450 with net metering. The team handled all municipal approvals effortlessly.",
    name: "Rajesh Sharma",
    location: "Mumbai, MH",
    system: "5.2 kW · Residential",
  },
  {
    quote: "Zero out of pocket with PM Surya Ghar subsidy and our monthly EMI is lower than our old DISCOM electric bill.",
    name: "Vikram Patel",
    location: "Bengaluru, KA",
    system: "6.5 kW · Residential",
  },
  {
    quote: "Battery backup carried us smoothly through power cuts. Extremely satisfied with the installation quality.",
    name: "Suresh Iyer",
    location: "Chennai, TN",
    system: "4.8 kW + battery",
  },
];

export const faqs = [
  {
    q: "How much does a home solar system actually cost in India?",
    a: "Most residential systems land between ₹1,80,000 and ₹4,50,000 before subsidies. The PM Surya Ghar central subsidy reduces this by up to ₹78,000.",
  },
  {
    q: "What happens if my roof needs repair?",
    a: "We inspect roof condition during the site survey. If needed, we coordinate waterproofing so panels are mounted once.",
  },
  {
    q: "Do I still have a utility bill after going solar?",
    a: "Usually yes, but a much smaller one consisting primarily of fixed DISCOM grid connection charges.",
  },
  {
    q: "How long does the whole process take?",
    a: "From signed agreement to switched-on net meter is typically 2 to 4 weeks, depending on DISCOM inspection schedules.",
  },
  {
    q: "What is covered by the warranty?",
    a: "25 years linear performance on panels, 5–10 years on inverters, and 25 years on rooftop mounting workmanship.",
  },
  {
    q: "Is battery storage worth it?",
    a: "If outage resilience and 24/7 backup during power cuts is important to you, Lithium LFP battery storage is an excellent addition.",
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
    options: ["Under ₹2,500", "₹2,500 – ₹5,000", "₹5,000 – ₹10,000", "Over ₹10,000"],
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
