import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Flame, Sparkles } from "lucide-react";
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
import {
  callCoachingSummary,
  conversionFunnel,
  dealStatus,
  kpis,
  leadSourcePerformance,
  leadStatusDistribution,
  leadTrend,
  operatingMetrics,
  priorityActions,
  recentActivity,
} from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
};

function AdminDashboard() {
  return (
    <>
      <PageHeader
        title="Operations dashboard"
        description="Capture → Qualify → Convert → Retain · last 30 days"
        actions={
          <>
            <Button variant="outline">Export</Button>
            <Button asChild>
              <Link to="/admin/leads">Work the queue</Link>
            </Button>
          </>
        }
      />

      {/* Priority actions */}
      <section className="surface-card mb-6 overflow-hidden border-primary/30">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-primary-soft px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Flame className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold">Top priority actions</h2>
              <p className="truncate text-xs text-muted-foreground">
                What your team should do next, ranked by revenue impact
              </p>
            </div>
          </div>
          <StatusPill tone="danger" dot className="shrink-0">
            2 critical
          </StatusPill>
        </div>
        <ul className="divide-y divide-border">
          {priorityActions.map((a) => (
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
                    a.priority === "medium" && "bg-info",
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
              <Button size="sm" variant={a.priority === "critical" ? "default" : "outline"}>
                {a.action}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {/* KPIs */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="surface-card p-5">
            <p className="truncate text-xs font-semibold text-muted-foreground">{k.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold">{k.value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-bold",
                  k.trend === "up" ? "text-success" : "text-destructive",
                )}
              >
                {k.trend === "up" ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {k.delta}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">{k.hint}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Ops metrics */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {operatingMetrics.map((m) => (
          <div key={m.label} className="surface-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
                {m.label}
              </p>
              <StatusPill tone={m.ok ? "success" : "danger"}>
                {m.ok ? "On target" : "Off target"}
              </StatusPill>
            </div>
            <p className="mt-2 font-display text-xl font-extrabold">{m.value}</p>
            <p className="text-[11px] text-muted-foreground">Target {m.target}</p>
          </div>
        ))}
      </section>

      {/* Charts */}
      <section className="mb-6 grid gap-5 lg:grid-cols-3">
        <div className="surface-card min-w-0 p-6 lg:col-span-2">
          <h2 className="text-base font-bold">Lead trend</h2>
          <p className="text-xs text-muted-foreground">Weekly captured, qualified and won</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadTrend} margin={{ left: -18, right: 8, top: 8 }}>
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
          </div>
        </div>

        <div className="surface-card min-w-0 p-6">
          <h2 className="text-base font-bold">Lead status distribution</h2>
          <div className="mt-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leadStatusDistribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
                  {leadStatusDistribution.map((d) => (
                    <Cell key={d.name} fill={d.fill} stroke="var(--color-card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5">
            {leadStatusDistribution.map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: d.fill }} />
                  <span className="truncate text-muted-foreground">{d.name}</span>
                </span>
                <span className="font-semibold">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-6 grid gap-5 lg:grid-cols-3">
        <div className="surface-card min-w-0 p-6">
          <h2 className="text-base font-bold">Conversion funnel</h2>
          <ul className="mt-5 space-y-4">
            {conversionFunnel.map((s) => (
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

        <div className="surface-card min-w-0 p-6 lg:col-span-2">
          <h2 className="text-base font-bold">Lead source performance</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadSourcePerformance} margin={{ left: -18, right: 8, top: 8 }}>
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

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="surface-card min-w-0 p-6">
          <h2 className="text-base font-bold">Deal status</h2>
          <ul className="mt-4 divide-y divide-border">
            {dealStatus.map((d) => (
              <li key={d.label} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 truncate text-sm">{d.label}</span>
                <span className="shrink-0 text-sm font-semibold">
                  {d.count} <span className="text-muted-foreground">· {d.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card min-w-0 p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-base font-bold">Call coaching</h2>
          </div>
          <p className="mt-3 font-display text-3xl font-extrabold">
            {callCoachingSummary.teamScore}
            <span className="text-base font-semibold text-muted-foreground">/100</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {callCoachingSummary.callsAnalyzed} calls analyzed this month
          </p>
          <ul className="mt-4 space-y-3">
            {[
              ["Discovery", callCoachingSummary.discovery],
              ["Objection handling", callCoachingSummary.objectionHandling],
              ["Next step set", callCoachingSummary.nextStepSet],
              ["Talk ratio (rep)", callCoachingSummary.talkRatio],
            ].map(([label, value]) => (
              <li key={label as string}>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}%</span>
                </div>
                <Progress value={value as number} className="mt-1 h-1.5" />
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-5 w-full">
            <Link to="/admin/call-coaching">Open coaching</Link>
          </Button>
        </div>

        <div className="surface-card min-w-0 p-6">
          <h2 className="text-base font-bold">Recent activity</h2>
          <ul className="mt-4 space-y-4">
            {recentActivity.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">{a.when}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
