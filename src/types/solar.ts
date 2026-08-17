export type BadgeTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "appointment"
  | "proposal"
  | "won"
  | "lost";

export type LeadSource =
  | "Google Ads"
  | "Meta"
  | "Referral"
  | "Website"
  | "Door Knock"
  | "Partner";

export type HomeType = "Single family" | "Townhouse" | "Multi-family" | "Mobile";
export type RoofType = "Asphalt shingle" | "Tile" | "Metal" | "Flat";
export type PurchaseTimeline = "0-1 month" | "1-3 months" | "3-6 months" | "Just researching";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  monthlyBill: number;
  homeType: HomeType;
  roof: RoofType;
  timeline: PurchaseTimeline;
  homeowner: boolean;
  createdAt: string;
  lastTouch: string;
  owner: string;
  aiSummary: string;
  tags: string[];
  conversationId?: string;
};

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

export type AvailabilitySlot = {
  id: string;
  rep: string;
  date: string;
  day: string;
  time: string;
  order: number;
  status: "open" | "closed";
};

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

export type PortalMilestone = {
  title: string;
  date: string;
  state?: string;
  status?: string;
  detail?: string;
  description?: string;
};

export type PortalProject = {
  customer: string;
  address: string;
  systemKw: number;
  panels: number;
  battery: string;
  contractValue: number;
  status: string;
  statusDetail: string;
  progress: number;
  projectedInstall: string;
  estMonthlySavings: number;
  estAnnualProduction: string;
  consultant: { name: string; role: string; phone: string };
};

export type KPIItem = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  hint: string;
};

export type OperatingMetric = {
  label: string;
  value: string;
  target: string;
  ok: boolean;
};

export type PriorityAction = {
  id: string;
  priority: "critical" | "high" | "medium";
  title: string;
  detail: string;
  meta: string;
  action: string;
};

export type RecentActivityItem = {
  who: string;
  what: string;
  when: string;
  tone: BadgeTone;
};
