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
import { conversionFunnel, leadSourcePerformance, leadTrend, operatingMetrics } from "@/data/mock";

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
  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description="Pipeline performance across capture, qualify, convert and retain"
        actions={
          <Button variant="outline">
            <Download />
            Export CSV
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {operatingMetrics.map((m) => (
          <div key={m.label} className="surface-card p-5">
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
        <div className="surface-card min-w-0 p-6">
          <h2 className="text-base font-bold">Won deals over time</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadTrend} margin={{ left: -18, right: 8, top: 8 }}>
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

        <div className="surface-card min-w-0 p-6">
          <h2 className="text-base font-bold">Cost per lead by source</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadSourcePerformance} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="source" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-secondary)" }} />
                <Bar dataKey="cpl" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="surface-card min-w-0 p-6">
          <h2 className="text-base font-bold">Funnel conversion</h2>
          <ul className="mt-5 space-y-4">
            {conversionFunnel.map((s) => (
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

        <div className="surface-card min-w-0 overflow-x-auto">
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
              {leadSourcePerformance.map((s) => (
                <tr key={s.source} className="hover:bg-secondary/50">
                  <td className="px-5 py-3.5 font-semibold">{s.source}</td>
                  <td className="px-5 py-3.5">{s.leads}</td>
                  <td className="px-5 py-3.5">{s.qualified}</td>
                  <td className="px-5 py-3.5">{s.won}</td>
                  <td className="px-5 py-3.5">${s.cpl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
