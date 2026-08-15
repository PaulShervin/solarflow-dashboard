import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BatteryCharging,
  CalendarCheck,
  Download,
  Home,
  Info,
  Leaf,
  Phone,
  PiggyBank,
  Sun,
  TrendingUp,
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
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusPill } from "@/components/common/StatusPill";
import { estimate } from "@/data/mock";

export const Route = createFileRoute("/estimate")({
  head: () => ({
    meta: [
      { title: "Your Preliminary Solar Savings Estimate | SolarPeak" },
      {
        name: "description",
        content:
          "See estimated monthly and annual solar savings, system size, production and payback range for your home. Preliminary and illustrative.",
      },
      { property: "og:title", content: "Your preliminary solar savings estimate | SolarPeak" },
      {
        property: "og:description",
        content: "Estimated savings, system size, production and payback range for your home.",
      },
    ],
  }),
  component: EstimatePage,
});

const cumulative = Array.from({ length: 26 }, (_, year) => ({
  year,
  withSolar: Math.round(year * 340 * 12 * 0.03 + year * 1500),
  savings: Math.round(year * estimate.annualSavings * (1 + year * 0.012)),
}));

const benefits = [
  {
    icon: PiggyBank,
    title: "A predictable energy cost",
    body: "Your solar payment is fixed. Utility rates in your area have risen roughly 6% a year.",
  },
  {
    icon: BatteryCharging,
    title: "Optional battery backup",
    body: "Add storage now or later to keep essentials running through outages and peak-rate hours.",
  },
  {
    icon: Leaf,
    title: `${estimate.co2} of CO₂ avoided each year`,
    body: "Roughly equivalent to planting 140 trees annually across the life of the system.",
  },
  {
    icon: Home,
    title: "Added home value",
    body: "Owned systems are typically capitalized into appraised value at resale.",
  },
];

function EstimatePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <StatusPill tone="brand" dot>
              Preliminary estimate
            </StatusPill>
            <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
              Here's what solar could look like on your home
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Based on your answers and typical production for your area. A consultant will
              confirm the real numbers using your utility usage and a roof review.
            </p>
          </div>
          <Button variant="outline" className="shrink-0">
            <Download />
            Save as PDF
          </Button>
        </div>

        {/* Savings cards */}
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid min-w-0 gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-primary/30 bg-primary-soft p-6 shadow-card">
              <p className="text-sm font-semibold text-primary">Estimated monthly savings</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-foreground">
                ${estimate.monthlySavings}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Current bill ${estimate.currentBill} → projected ${estimate.newBill}
              </p>
            </div>
            <div className="surface-card p-6">
              <p className="text-sm font-semibold text-muted-foreground">
                Estimated annual savings
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold">
                ${estimate.annualSavings.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                ~${estimate.twentyFiveYear.toLocaleString()} over 25 years
              </p>
            </div>

            {[
              { icon: Sun, label: "System size", value: estimate.systemSize, sub: `${estimate.panels} panels` },
              { icon: Zap, label: "Annual production", value: estimate.annualProduction, sub: `${estimate.offset}% of your usage` },
              { icon: TrendingUp, label: "Payback range", value: `${estimate.paybackLow}–${estimate.paybackHigh} yrs`, sub: "After federal credit" },
              { icon: Leaf, label: "CO₂ avoided", value: estimate.co2, sub: "Per year" },
            ].map((c) => (
              <div key={c.label} className="surface-card p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <c.icon className="size-4" />
                  <span className="text-xs font-semibold">{c.label}</span>
                </div>
                <p className="mt-2 font-display text-2xl font-extrabold">{c.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Booking CTA */}
          <aside className="surface-card min-w-0 self-start p-6">
            <h2 className="text-lg font-bold">Book a free consultation</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A design consultant reviews your actual usage, roof and shading, then gives you an
              exact price with no obligation.
            </p>
            <div className="mt-5 space-y-2.5">
              {["Thu, Aug 20 · 4:00 PM", "Fri, Aug 21 · 10:00 AM", "Sat, Aug 22 · 9:30 AM"].map(
                (slot) => (
                  <button
                    key={slot}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-primary hover:bg-primary-soft"
                  >
                    {slot}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </button>
                ),
              )}
            </div>
            <Button size="lg" className="mt-5 w-full">
              <CalendarCheck />
              Book a Free Consultation
            </Button>
            <Button variant="outline" size="lg" className="mt-2.5 w-full">
              <Phone />
              Call (480) 555-0170
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Typical response time: under 5 minutes during business hours.
            </p>
          </aside>
        </div>

        {/* Chart + offset */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="surface-card min-w-0 p-6">
            <h2 className="text-base font-bold">Projected cumulative savings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Illustrative model assuming a 6% annual utility rate increase.
            </p>
            <div className="mt-5 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulative} margin={{ left: -12, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={(v) => `Yr ${v}`}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Cumulative savings"]}
                    labelFormatter={(l) => `Year ${l}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fill="url(#savingsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card min-w-0 p-6">
            <h2 className="text-base font-bold">Estimated bill offset</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              How much of your annual usage this system would cover.
            </p>
            <p className="mt-6 font-display text-5xl font-extrabold text-primary">
              {estimate.offset}%
            </p>
            <Progress value={estimate.offset} className="mt-4 h-2" />
            <dl className="mt-6 space-y-3 text-sm">
              {[
                ["Panels", `${estimate.panels} × 400 W`],
                ["Inverter", "String + optimizers"],
                ["Battery", "Optional add-on"],
                ["Roof suitability", "Good"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-border pb-2.5 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="surface-card p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <b.icon className="size-5" />
              </span>
              <h3 className="mt-3.5 text-sm font-bold">{b.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-secondary/50 p-5">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">
              This is a preliminary, illustrative estimate.
            </span>{" "}
            Figures are modeled from the answers you provided and regional averages — not a quote,
            a contract, or a guarantee of savings. Final system size, production, pricing and
            incentive eligibility are confirmed after a site review and utility bill analysis.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-navy px-6 py-10 text-center sm:px-12">
          <h2 className="font-display text-2xl font-extrabold text-navy-foreground sm:text-3xl">
            Ready to turn this estimate into real numbers?
          </h2>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-12 px-7">
              <CalendarCheck />
              Book a Free Consultation
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-navy-foreground/25 bg-transparent px-7 text-navy-foreground hover:bg-navy-muted hover:text-navy-foreground"
            >
              <Link to="/qualify">Refine my answers</Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
