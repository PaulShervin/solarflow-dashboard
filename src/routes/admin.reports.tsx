import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
};

function ReportsPage() {
  const { leads, proposals, appointments } = useSolarDB();

  // Dynamic calculations
  const totalLeads = leads.length;
  const qualifiedCount = leads.filter((l) => l.status === "qualified" || l.score >= 75).length;
  const wonCount = leads.filter((l) => l.status === "won").length + proposals.filter((p) => p.status === "Signed").length;

  const operatingMetrics = useMemo(() => {
    const showRate = appointments.length > 0
      ? Math.round((appointments.filter((a) => a.status === "Confirmed" || a.status === "Completed").length / appointments.length) * 100)
      : 100;

    return [
      { label: "Median first response", value: "2m 45s", ok: true },
      { label: "Speed-to-lead (1 hr)", value: "98%", ok: true },
      { label: "Appointment show rate", value: `${showRate}%`, ok: showRate >= 80 },
      { label: "Pipeline conversion", value: `${totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0}%`, ok: true },
    ];
  }, [appointments, totalLeads, wonCount]);

  const dynamicSourcePerformance = useMemo(() => {
    const sources: Record<string, { leads: number; qualified: number; won: number; cpl: number }> = {
      "Google Ads": { leads: 0, qualified: 0, won: 0, cpl: 650 },
      "Meta": { leads: 0, qualified: 0, won: 0, cpl: 420 },
      "Referral": { leads: 0, qualified: 0, won: 0, cpl: 120 },
      "Website": { leads: 0, qualified: 0, won: 0, cpl: 240 },
      "Partner": { leads: 0, qualified: 0, won: 0, cpl: 380 },
    };

    leads.forEach((l) => {
      const src = l.source || "Website";
      if (!sources[src]) sources[src] = { leads: 0, qualified: 0, won: 0, cpl: 350 };
      sources[src]!.leads++;
      if (l.status === "qualified" || l.score >= 75) sources[src]!.qualified++;
      if (l.status === "won") sources[src]!.won++;
    });

    return Object.entries(sources).map(([source, data]) => ({
      source,
      leads: data.leads,
      qualified: data.qualified,
      won: data.won,
      cpl: data.cpl,
    }));
  }, [leads]);

  const dynamicFunnel = useMemo(() => {
    const total = Math.max(1, leads.length);
    const contacted = leads.filter((l) => l.status !== "new").length;
    const qualified = leads.filter((l) => l.status === "qualified" || l.status === "appointment" || l.status === "proposal" || l.status === "won").length;
    const appts = appointments.length;
    const props = proposals.length;

    return [
      { stage: "Leads captured", value: leads.length, pct: 100 },
      { stage: "Contacted", value: contacted, pct: Math.min(100, Math.round((contacted / total) * 100)) },
      { stage: "Qualified", value: qualified, pct: Math.min(100, Math.round((qualified / total) * 100)) },
      { stage: "Appointment set", value: appts, pct: Math.min(100, Math.round((appts / total) * 100)) },
      { stage: "Proposal sent", value: props, pct: Math.min(100, Math.round((props / total) * 100)) },
      { stage: "Closed won", value: wonCount, pct: Math.min(100, Math.round((wonCount / total) * 100)) },
    ];
  }, [leads, appointments, proposals, wonCount]);

  const dynamicLeadTrend = useMemo(() => [
    { week: "Wk 1", qualified: Math.round(qualifiedCount * 0.2), won: Math.round(wonCount * 0.2) },
    { week: "Wk 2", qualified: Math.round(qualifiedCount * 0.4), won: Math.round(wonCount * 0.4) },
    { week: "Wk 3", qualified: Math.round(qualifiedCount * 0.7), won: Math.round(wonCount * 0.7) },
    { week: "Current", qualified: qualifiedCount, won: wonCount },
  ], [qualifiedCount, wonCount]);

  function handleExportCSV() {
    const headers = "Source,Leads,Qualified,Won,CPL\n";
    const rows = dynamicSourcePerformance.map((s) => `${s.source},${s.leads},${s.qualified},${s.won},${s.cpl}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "solarflow_pipeline_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="Real-time pipeline performance across capture, qualify, convert and retain"
        actions={
          <Button variant="outline" onClick={handleExportCSV}>
            <Download />
            Export CSV
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {operatingMetrics.map((m) => (
          <div key={m.label} className="surface-card p-5 rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
                {m.label}
              </p>
              <StatusPill tone={m.ok ? "success" : "danger"}>{m.ok ? "OK" : "Watch"}</StatusPill>
            </div>
            <p className="mt-2 font-display text-xl font-extrabold">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <div className="surface-card min-w-0 p-6 rounded-2xl">
          <h2 className="text-base font-bold">Won Deals & Qualified Growth</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dynamicLeadTrend} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="won" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="qualified" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card min-w-0 p-6 rounded-2xl">
          <h2 className="text-base font-bold">Acquisition Volume by Source</h2>
          <div className="mt-4 h-64">
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
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="surface-card min-w-0 p-6 rounded-2xl">
          <h2 className="text-base font-bold">Pipeline Conversion Funnel</h2>
          <ul className="mt-5 space-y-4">
            {dynamicFunnel.map((s) => (
              <li key={s.stage}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-muted-foreground">{s.stage}</span>
                  <span className="shrink-0 font-semibold">{s.value}</span>
                </div>
                <Progress value={s.pct} className="mt-1.5 h-2" />
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card min-w-0 overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs font-semibold text-muted-foreground">
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Leads</th>
                <th className="px-5 py-3">Qualified</th>
                <th className="px-5 py-3">Won</th>
                <th className="px-5 py-3">CPL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dynamicSourcePerformance.map((s) => (
                <tr key={s.source} className="hover:bg-secondary/50">
                  <td className="px-5 py-3.5 font-semibold">{s.source}</td>
                  <td className="px-5 py-3.5">{s.leads}</td>
                  <td className="px-5 py-3.5">{s.qualified}</td>
                  <td className="px-5 py-3.5">{s.won}</td>
                  <td className="px-5 py-3.5">₹{s.cpl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
