import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Battery,
  BatteryCharging,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileCheck,
  FileText,
  Leaf,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusPill } from "@/components/common/StatusPill";
import { portalDocuments } from "@/data/mock";
import { useSolarDB } from "@/hooks/useSolarDB";
import { syncConversationToFirestore } from "@/lib/firestoreSync";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "My Solar Project — Customer Portal | SolarPeak" },
      {
        name: "description",
        content:
          "Track your solar installation: project status, milestones, documents, appointments, payments and messages with your consultant.",
      },
    ],
  }),
  component: PortalPage,
});

const energyChartData = [
  { time: "6 AM", solar: 0.2, home: 1.1 },
  { time: "8 AM", solar: 2.4, home: 1.8 },
  { time: "10 AM", solar: 5.8, home: 2.1 },
  { time: "12 PM", solar: 7.9, home: 2.6 },
  { time: "2 PM", solar: 8.4, home: 2.9 },
  { time: "4 PM", solar: 6.1, home: 3.2 },
  { time: "6 PM", solar: 2.8, home: 3.5 },
  { time: "8 PM", solar: 0.1, home: 2.8 },
  { time: "10 PM", solar: 0.0, home: 1.4 },
];

function PortalPage() {
  const { portalProject: project, portalMilestones, portalMessages } = useSolarDB();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [userMsgInput, setUserMsgInput] = useState("");
  const [localMessages, setLocalMessages] = useState(portalMessages);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMsgInput.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      time: "Just now",
      text: userMsgInput,
      channel: "Portal Chat",
      sender: "customer" as const,
    };
    setLocalMessages((prev) => [newMsg, ...prev]);
    syncConversationToFirestore("portal-customer-thread", newMsg, {
      customer: project?.customer || "Portal Customer",
      channel: "Web chat",
      status: "Active",
      lastMessage: userMsgInput,
      lastTime: "Just now",
    });
    setUserMsgInput("");
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-16">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy text-navy-foreground shadow-sm">
              <Sun className="size-6 text-primary" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-xl font-extrabold sm:text-2xl">
                  My Solar Project
                </h1>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                  Project #SP-9042
                </span>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {project.customer} · {project.address}
              </p>
            </div>
          </div>
          <StatusPill tone="warning" dot className="shrink-0 font-bold">
            {project.status}
          </StatusPill>
        </header>

        {/* Live Project Overview Card */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-border/80 bg-navy p-6 shadow-lift sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-widest text-primary uppercase flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                Live Status Tracker · Synced with Arizona Operations
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-navy-foreground sm:text-3xl">
                {project.status}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-foreground/75">
                {project.statusDetail}
              </p>
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-semibold text-navy-foreground/75">
                  <span className="flex items-center gap-1.5">
                    <Activity className="size-3.5 text-primary" /> Overall Completion
                  </span>
                  <span className="font-bold text-primary">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="mt-2 h-2.5 bg-navy-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "System size", value: `${project.systemKw} kW`, sub: `${project.panels} Tier-1 Panels` },
                { label: "Battery Storage", value: "Active", sub: project.battery },
                { label: "Est. Inspection", value: project.projectedInstall, sub: "City Permit Passed" },
                { label: "Est. Monthly Savings", value: `$${project.estMonthlySavings}`, sub: "Guaranteed offset" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-navy-muted/60 p-4 border border-navy-foreground/10">
                  <p className="text-[11px] font-semibold text-navy-foreground/60">{s.label}</p>
                  <p className="mt-1 font-display text-lg font-extrabold text-navy-foreground">
                    {s.value}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-navy-foreground/50">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portal Tabs */}
        <Tabs defaultValue="energy" className="mt-8">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-card p-1.5 rounded-2xl border border-border">
            {[
              ["energy", "Live Production & Energy", Zap],
              ["timeline", "Installation Milestones", CalendarDays],
              ["documents", "Document Hub", FileText],
              ["messages", "Direct Consultant Chat", MessageSquare],
              ["appointments", "Upcoming Appointments", Calendar],
              ["payments", "Financing & Payments", CreditCard],
            ].map(([v, label, Icon]) => {
              const I = Icon as typeof Zap;
              return (
                <TabsTrigger
                  key={v as string}
                  value={v as string}
                  className="gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <I className="size-4" />
                  {label as string}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* TAB 1: Live Production & Energy */}
          <TabsContent value="energy" className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="surface-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Today's Generation</span>
                  <Sun className="size-4 text-primary" />
                </div>
                <p className="mt-2 font-display text-2xl font-black text-foreground">34.8 kWh</p>
                <p className="mt-1 text-xs text-primary font-medium">↑ 12% above seasonal forecast</p>
              </div>

              <div className="surface-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Battery Backup Level</span>
                  <BatteryCharging className="size-4 text-primary" />
                </div>
                <p className="mt-2 font-display text-2xl font-black text-foreground">94%</p>
                <p className="mt-1 text-xs text-muted-foreground">Tesla Powerwall 3 (13.5 kWh ready)</p>
              </div>

              <div className="surface-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Net Grid Export</span>
                  <TrendingUp className="size-4 text-info" />
                </div>
                <p className="mt-2 font-display text-2xl font-black text-foreground">18.4 kWh</p>
                <p className="mt-1 text-xs text-muted-foreground">APS / SRP Net Metering Credited</p>
              </div>

              <div className="surface-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Carbon Offset</span>
                  <Leaf className="size-4 text-success" />
                </div>
                <p className="mt-2 font-display text-2xl font-black text-foreground">1,480 lbs</p>
                <p className="mt-1 text-xs text-muted-foreground">Equivalent to 34 trees planted</p>
              </div>
            </div>

            <div className="surface-card p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold">Today's Solar Production vs Home Usage</h3>
                  <p className="text-xs text-muted-foreground">Real-time kW output from 22 rooftop solar panels</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-primary" /> Solar Generation (kW)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-info" /> Home Consumption (kW)
                  </span>
                </div>
              </div>

              <div className="mt-6 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={energyChartData}>
                    <defs>
                      <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.62 0.15 152)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="oklch(0.62 0.15 152)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.56 0.13 245)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.56 0.13 245)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis unit=" kW" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="solar"
                      name="Solar Generation"
                      stroke="oklch(0.62 0.15 152)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#solarGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="home"
                      name="Home Consumption"
                      stroke="oklch(0.56 0.13 245)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#homeGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Timeline */}
          <TabsContent value="timeline" className="mt-6">
            <div className="surface-card min-w-0 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold">Post-Sale Installation Milestones</h3>
                  <p className="text-xs text-muted-foreground">Detailed status tracking with municipal city inspectors and SRP/APS</p>
                </div>
                <StatusPill tone="brand" dot>Live Operations</StatusPill>
              </div>

              <ol className="space-y-0">
                {portalMilestones.map((m, i) => (
                  <li key={m.title} className="relative flex gap-4 pb-8 last:pb-0">
                    {i < portalMilestones.length - 1 ? (
                      <span
                        className={cn(
                          "absolute top-7 left-3.5 -ml-px h-full w-0.5",
                          m.status === "complete" ? "bg-primary" : "bg-border",
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-all",
                        m.status === "complete" && "bg-primary text-primary-foreground shadow-sm",
                        m.status === "current" && "bg-navy text-navy-foreground ring-4 ring-primary-soft shadow-lift",
                        m.status === "upcoming" && "bg-secondary text-muted-foreground border border-border",
                      )}
                    >
                      {m.status === "complete" ? <Check className="size-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-foreground">{m.title}</span>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          {m.date}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </TabsContent>

          {/* TAB 3: Documents */}
          <TabsContent value="documents" className="mt-6">
            <div className="surface-card p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold">Project Documents & Warranties</h3>
                  <p className="text-xs text-muted-foreground">Access signed contracts, engineering plans, and 25-year warranty certificates</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{portalDocuments.length} Verified Files</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {portalDocuments.map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                        <FileCheck className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.date} · {doc.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDoc(doc.name)}
                        title="Preview document"
                      >
                        <Eye className="size-4 text-muted-foreground" />
                      </Button>
                      <Button variant="outline" size="icon" title="Download document">
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: Messages */}
          <TabsContent value="messages" className="mt-6">
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-navy text-navy-foreground text-sm font-bold">
                    DR
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold">Dana Ruiz (Assigned Project Lead)</h3>
                    <p className="text-xs text-muted-foreground">Senior Solar Energy Consultant · (480) 555-0170</p>
                  </div>
                </div>
                <StatusPill tone="success" dot>Online</StatusPill>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto bg-secondary/30 p-4 rounded-2xl border border-border">
                {localMessages.map((msg) => (
                  <div key={msg.id} className="rounded-xl border border-border bg-card p-3.5 text-xs shadow-xs">
                    <p className="font-semibold text-foreground">{msg.text}</p>
                    <span className="mt-1 block text-[10px] text-muted-foreground font-medium">
                      {msg.time} via {msg.channel}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={userMsgInput}
                  onChange={(e) => setUserMsgInput(e.target.value)}
                  placeholder="Type a message or question for Dana Ruiz..."
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="submit" className="font-bold gap-1.5 px-5">
                  <Send className="size-4" /> Send
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* TAB 5: Appointments */}
          <TabsContent value="appointments" className="mt-6">
            <div className="surface-card p-6 sm:p-8 space-y-4">
              <h3 className="font-display text-lg font-bold">Scheduled Field Visits</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <CalendarDays className="size-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">City Building & Electrical Final Inspection</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <Clock className="size-3.5 text-primary" /> Tomorrow at 10:00 AM – 12:00 PM
                      </p>
                    </div>
                  </div>
                  <StatusPill tone="brand" dot>Confirmed</StatusPill>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 6: Payments */}
          <TabsContent value="payments" className="mt-6">
            <div className="surface-card p-6 sm:p-8 space-y-4">
              <h3 className="font-display text-lg font-bold">Solar Financing & Statement Overview</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Monthly Solar EMI</p>
                  <p className="mt-1 font-display text-xl font-extrabold text-foreground">₹2,450.00 / mo</p>
                  <p className="text-[11px] text-primary mt-1">Fixed 6.5% Net Metering EMI · Auto-Debit Active</p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">PM Surya Ghar Subsidy Claim</p>
                  <p className="mt-1 font-display text-xl font-extrabold text-primary">₹78,000.00</p>
                  <p className="text-[11px] text-muted-foreground mt-1">National Portal Disbursal Direct to Bank</p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Next Scheduled AutoPay</p>
                  <p className="mt-1 font-display text-xl font-extrabold text-foreground">Sep 1st, 2026</p>
                  <p className="text-[11px] text-success font-medium mt-1">Status: Good Standing</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Document Preview Dialog */}
      <Dialog open={Boolean(selectedDoc)} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="size-5 text-primary" />
              {selectedDoc}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-sm">
            <p className="text-muted-foreground">
              This document is officially signed and stamped by certified solar engineers and DISCOM municipal authorities.
            </p>
            <div className="rounded-xl border border-border bg-secondary/40 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-bold text-success">Verified & Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Digital Signature:</span>
                <span className="font-mono text-[11px]">0x98A4...C41F</span>
              </div>
            </div>
            <Button className="w-full font-bold gap-2" onClick={() => setSelectedDoc(null)}>
              <Download className="size-4" /> Download Official PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}

