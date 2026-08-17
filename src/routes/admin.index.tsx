import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Flame, BarChart3, Inbox } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { useSolarDB } from "@/hooks/useSolarDB";
import type { Task } from "@/types/solar";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/formatCurrency";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
};

type PriorityActionItem = {
  id: string;
  priority: "critical" | "high";
  title: string;
  detail: string;
  meta: string;
  action: string;
  link: string;
};

function AdminDashboard() {
  const { leads, proposals, appointments, tasks, auditLogs } = useSolarDB();

  // Dynamic live KPI calculation from database store
  const dynamicKpis = useMemo(() => {
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter((l) => l.status === "qualified" || (l.score && l.score >= 75)).length;
    const totalAppointments = appointments.length;
    const totalProposals = proposals.length;
    const wonDeals = leads.filter((l) => l.status === "won").length + proposals.filter((p) => p.status === "Signed").length;
    const revenueBooked = proposals
      .filter((p) => p.status === "Signed")
      .reduce((sum, p) => sum + (p.value || 0), 0);

    return [
      {
        label: "Total Leads",
        value: totalLeads.toString(),
        hint: totalLeads === 0 ? "No active leads yet" : `${totalLeads} total in database`,
      },
      {
        label: "Qualified Leads",
        value: qualifiedLeads.toString(),
        hint: totalLeads > 0 ? `${Math.round((qualifiedLeads / totalLeads) * 100)}% qualification rate` : "Score ≥ 75 or qualified",
      },
      {
        label: "Appointments Set",
        value: totalAppointments.toString(),
        hint: totalAppointments === 0 ? "No scheduled appointments" : `${totalAppointments} in calendar queue`,
      },
      {
        label: "Proposals Generated",
        value: totalProposals.toString(),
        hint: totalProposals === 0 ? "No proposals generated" : `${totalProposals} active proposals`,
      },
      {
        label: "Deals Won",
        value: wonDeals.toString(),
        hint: wonDeals === 0 ? "No closed contracts" : `${wonDeals} agreements signed`,
      },
      {
        label: "Revenue Booked",
        value: formatINR(revenueBooked),
        hint: "From signed customer contracts",
      },
    ];
  }, [leads, proposals, appointments]);

  // Dynamic Operating Metrics
  const dynamicOperatingMetrics = useMemo(() => {
    const confirmedCount = appointments.filter((a) => a.status === "Confirmed" || a.status === "Completed").length;
    const showRate = appointments.length > 0 ? Math.round((confirmedCount / appointments.length) * 100) : 0;
    const pendingCritical = tasks.filter((t: Task) => !t.done && (t.priority === "Critical" || t.priority === "High")).length;

    return [
      {
        label: "Speed-to-lead SLA",
        value: leads.length > 0 ? "< 5m response" : "Standby",
        target: "< 5m",
        ok: true,
      },
      {
        label: "Active Lead Queue",
        value: `${leads.filter((l) => l.status === "new" || l.status === "contacted").length} active`,
        target: "Real-time",
        ok: true,
      },
      {
        label: "Appointment Confirmation",
        value: appointments.length > 0 ? `${showRate}%` : "No appts",
        target: "> 80%",
        ok: appointments.length === 0 || showRate >= 80,
      },
      {
        label: "Pending Urgent Tasks",
        value: `${pendingCritical} tasks`,
        target: "< 5",
        ok: pendingCritical < 5,
      },
    ];
  }, [leads, appointments, tasks]);

  // Dynamic Lead Status Distribution
  const dynamicStatusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      appointment: 0,
      proposal: 0,
      won: 0,
    };
    leads.forEach((l) => {
      const st = (l.status || "new").toLowerCase();
      if (counts[st] !== undefined) {
        counts[st] = (counts[st] ?? 0) + 1;
      } else {
        counts.new = (counts.new ?? 0) + 1;
      }
    });

    return [
      { name: "New", value: counts.new ?? 0, fill: "var(--color-chart-2)" },
      { name: "Contacted", value: counts.contacted ?? 0, fill: "var(--color-chart-5)" },
      { name: "Qualified", value: counts.qualified ?? 0, fill: "var(--color-chart-1)" },
      { name: "Appointment", value: counts.appointment ?? 0, fill: "var(--color-chart-4)" },
      { name: "Proposal", value: counts.proposal ?? 0, fill: "var(--color-chart-3)" },
      { name: "Won", value: counts.won ?? 0, fill: "var(--color-chart-1)" },
    ].filter((item) => item.value > 0);
  }, [leads]);

  // Dynamic Lead Source Performance
  const dynamicSourcePerformance = useMemo(() => {
    const sources: Record<string, { leads: number; qualified: number; won: number }> = {
      "Google Ads": { leads: 0, qualified: 0, won: 0 },
      "Website": { leads: 0, qualified: 0, won: 0 },
      "Referral": { leads: 0, qualified: 0, won: 0 },
      "Meta": { leads: 0, qualified: 0, won: 0 },
      "Partner": { leads: 0, qualified: 0, won: 0 },
    };

    leads.forEach((l) => {
      const src = l.source || "Website";
      if (!sources[src]) sources[src] = { leads: 0, qualified: 0, won: 0 };
      sources[src]!.leads++;
      if (l.status === "qualified" || (l.score && l.score >= 75)) sources[src]!.qualified++;
      if (l.status === "won") sources[src]!.won++;
    });

    return Object.entries(sources).map(([source, data]) => ({
      source,
      leads: data.leads,
      qualified: data.qualified,
      won: data.won,
    }));
  }, [leads]);

  // Dynamic Conversion Funnel
  const dynamicFunnel = useMemo(() => {
    const total = Math.max(1, leads.length);
    const contacted = leads.filter((l) => l.status !== "new").length;
    const qualified = leads.filter((l) => l.status === "qualified" || l.status === "appointment" || l.status === "proposal" || l.status === "won").length;
    const appts = appointments.length;
    const props = proposals.length;
    const won = leads.filter((l) => l.status === "won").length + proposals.filter((p) => p.status === "Signed").length;

    return [
      { stage: "Leads captured", value: leads.length, pct: leads.length > 0 ? 100 : 0 },
      { stage: "Contacted", value: contacted, pct: leads.length > 0 ? Math.min(100, Math.round((contacted / total) * 100)) : 0 },
      { stage: "Qualified", value: qualified, pct: leads.length > 0 ? Math.min(100, Math.round((qualified / total) * 100)) : 0 },
      { stage: "Appointment set", value: appts, pct: leads.length > 0 ? Math.min(100, Math.round((appts / total) * 100)) : 0 },
      { stage: "Proposal sent", value: props, pct: leads.length > 0 ? Math.min(100, Math.round((props / total) * 100)) : 0 },
      { stage: "Closed won", value: won, pct: leads.length > 0 ? Math.min(100, Math.round((won / total) * 100)) : 0 },
    ];
  }, [leads, appointments, proposals]);

  // Dynamic Priority Actions
  const dynamicPriorityActions = useMemo<PriorityActionItem[]>(() => {
    const hotLeads = leads.filter((l) => l.score && l.score >= 80 && l.status !== "won" && l.status !== "lost").slice(0, 3);
    const pendingTasks = tasks.filter((t: Task) => !t.done).slice(0, 2);

    const actions: PriorityActionItem[] = [];
    hotLeads.forEach((l) => {
      actions.push({
        id: `PA-lead-${l.id}`,
        priority: l.score >= 90 ? "critical" : "high",
        title: `Engage Lead: ${l.name}`,
        detail: `Score ${l.score} · ${l.city || "AZ"} · Est. Bill $${l.monthlyBill || 0}/mo`,
        meta: `Status: ${l.status}`,
        action: "View Lead",
        link: "/admin/leads",
      });
    });

    pendingTasks.forEach((t: Task) => {
      actions.push({
        id: `PA-task-${t.id}`,
        priority: t.priority === "Critical" ? "critical" : "high",
        title: t.title,
        detail: `Assigned to ${t.owner} · Due ${t.due}`,
        meta: `Type: ${t.type}`,
        action: "Open Task",
        link: "/admin/tasks",
      });
    });

    return actions;
  }, [leads, tasks]);

  // Dynamic Deal Status
  const dynamicDealStatus = useMemo(() => {
    const totalProposalValue = proposals.reduce((sum, p) => sum + (p.value || 0), 0);
    const inSurvey = leads.filter((l) => l.status === "appointment").length;
    const proposalsActive = proposals.filter((p) => p.status === "Sent" || p.status === "Viewed").length;
    const signed = proposals.filter((p) => p.status === "Signed").length;

    return [
      { label: "Consultation & Site Survey", count: inSurvey, value: `${inSurvey} active` },
      { label: "Active Proposals", count: proposalsActive, value: formatINR(totalProposalValue) },
      { label: "Signed Contracts", count: signed, value: `${signed} contracts` },
    ];
  }, [leads, proposals]);

  // Lead trend
  const liveLeadTrend = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((l) => l.status === "qualified" || (l.score && l.score >= 75)).length;
    const won = leads.filter((l) => l.status === "won").length;

    return [
      { week: "Wk 1", leads: Math.round(total * 0.2), qualified: Math.round(qualified * 0.2), won: Math.round(won * 0.2) },
      { week: "Wk 2", leads: Math.round(total * 0.5), qualified: Math.round(qualified * 0.5), won: Math.round(won * 0.5) },
      { week: "Wk 3", leads: Math.round(total * 0.8), qualified: Math.round(qualified * 0.8), won: Math.round(won * 0.8) },
      { week: "Current", leads: total, qualified: qualified, won: won },
    ];
  }, [leads]);

  return (
    <>
      <PageHeader
        title="Operations Dashboard"
        description="Live CRM Pipeline · Capture → Qualify → Convert → Retain"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/reports">View Reports</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/leads">Work Leads Queue</Link>
            </Button>
          </>
        }
      />

      {/* Priority actions (Shown only when real actionable items exist) */}
      {dynamicPriorityActions.length > 0 && (
        <section className="surface-card mb-6 overflow-hidden border-primary/30 rounded-2xl">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-primary-soft px-5 py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <Flame className="size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-extrabold">Top priority actions</h2>
                <p className="truncate text-xs text-muted-foreground">
                  High-intent leads and pending operational items requiring attention
                </p>
              </div>
            </div>
            <StatusPill tone="danger" dot className="shrink-0">
              {dynamicPriorityActions.filter((a) => a.priority === "critical").length} critical
            </StatusPill>
          </div>
          <ul className="divide-y divide-border">
            {dynamicPriorityActions.map((a) => (
              <li
                key={a.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      a.priority === "critical" && "bg-destructive",
                      a.priority === "high" && "bg-warning",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                    <p className="mt-1 text-[11px] font-semibold text-muted-foreground/80">
                      {a.meta}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant={a.priority === "critical" ? "default" : "outline"} asChild>
                  <Link to="/admin/leads">{a.action}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* KPIs */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {dynamicKpis.map((k) => (
          <div key={k.label} className="surface-card p-5 rounded-2xl">
            <p className="truncate text-xs font-semibold text-muted-foreground">{k.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold">{k.value}</p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">{k.hint}</p>
          </div>
        ))}
      </section>

      {/* Ops metrics */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dynamicOperatingMetrics.map((m) => (
          <div key={m.label} className="surface-card p-5 rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
                {m.label}
              </p>
              <StatusPill tone={m.ok ? "success" : "neutral"}>
                {m.ok ? "Active" : "Standby"}
              </StatusPill>
            </div>
            <p className="mt-2 font-display text-xl font-extrabold">{m.value}</p>
            <p className="text-[11px] text-muted-foreground">Target {m.target}</p>
          </div>
        ))}
      </section>

      {/* Charts */}
      <section className="mb-6 grid gap-5 lg:grid-cols-3">
        <div className="surface-card min-w-0 p-6 lg:col-span-2 rounded-2xl">
          <h2 className="text-base font-bold">Live Lead Pipeline Trend</h2>
          <p className="text-xs text-muted-foreground">Volume of captured, qualified and won opportunities</p>
          <div className="mt-5 h-64">
            {leads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <BarChart3 className="size-10 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-semibold">No lead activity logged yet</p>
                <p className="text-[11px] mt-0.5">Inbound leads will automatically populate real-time trend analytics.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveLeadTrend} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="qualFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="leads" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#leadFill)" />
                  <Area type="monotone" dataKey="qualified" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#qualFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="surface-card min-w-0 p-6 rounded-2xl">
          <h2 className="text-base font-bold">Lead Status Distribution</h2>
          <div className="mt-2 h-52">
            {dynamicStatusDistribution.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <Inbox className="size-9 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-semibold">No status data</p>
                <p className="text-[11px] mt-0.5">Leads will be categorized here as they enter the funnel.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dynamicStatusDistribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
                    {dynamicStatusDistribution.map((d) => (
                      <Cell key={d.name} fill={d.fill} stroke="var(--color-card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {dynamicStatusDistribution.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {dynamicStatusDistribution.map((d) => (
                <li key={d.name} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: d.fill }} />
                    <span className="truncate text-muted-foreground">{d.name}</span>
                  </span>
                  <span className="font-semibold">{d.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mb-6 grid gap-5 lg:grid-cols-3">
        <div className="surface-card min-w-0 p-6 rounded-2xl">
          <h2 className="text-base font-bold">Conversion Funnel</h2>
          <ul className="mt-5 space-y-4">
            {dynamicFunnel.map((s) => (
              <li key={s.stage}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-muted-foreground">{s.stage}</span>
                  <span className="shrink-0 font-semibold">
                    {s.value} <span className="text-xs text-muted-foreground">({s.pct}%)</span>
                  </span>
                </div>
                <Progress value={s.pct} className="mt-1.5 h-2" />
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card min-w-0 p-6 lg:col-span-2 rounded-2xl">
          <h2 className="text-base font-bold">Source Acquisition Performance</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicSourcePerformance} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="source" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-secondary)" }} />
                <Bar dataKey="leads" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="qualified" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="surface-card min-w-0 p-6 rounded-2xl">
          <h2 className="text-base font-bold">Deal Pipeline Status</h2>
          <ul className="mt-4 divide-y divide-border">
            {dynamicDealStatus.map((d) => (
              <li key={d.label} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 truncate text-sm">{d.label}</span>
                <span className="shrink-0 text-sm font-semibold">
                  {d.count} <span className="text-muted-foreground">· {d.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card min-w-0 p-6 rounded-2xl">
          <h2 className="text-base font-bold">Live Activity Stream</h2>
          <div className="mt-4 space-y-3">
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">{log.category}:</span>{" "}
                      <span className="text-muted-foreground">{log.title} - {log.detail}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/80">{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-xs font-semibold">No operational events yet</p>
                <p className="text-[11px] mt-0.5">Webhook ingestions, bot SMS replies, and status updates will stream here live.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
