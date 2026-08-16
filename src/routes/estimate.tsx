import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Download,
  FileCheck,
  Home,
  Info,
  Layers,
  Leaf,
  MapPin,
  PiggyBank,
  Printer,
  Sparkles,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusPill } from "@/components/common/StatusPill";
import { estimate } from "@/data/mock";
import { solarApi } from "@/lib/api";

export const Route = createFileRoute("/estimate")({
  head: () => ({
    meta: [
      { title: "Auto Pre-Design Engine & Roof Mapping | SolarPeak Consultant Console" },
      {
        name: "description",
        content:
          "Satellite pre-design, solar production calculations, and same-day proposal generation tool for solar consultants.",
      },
    ],
  }),
  component: EstimatePage,
});

function EstimatePage() {
  const [currentBill, setCurrentBill] = useState(estimate.currentBill);
  const [targetOffset, setTargetOffset] = useState(90);
  const [includeBattery, setIncludeBattery] = useState(true);

  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfProposalId, setPdfProposalId] = useState<string | null>(null);

  const systemSizeKw = Number(((currentBill / 30) * (targetOffset / 100)).toFixed(1));
  const panelCount = Math.ceil((systemSizeKw * 1000) / 400);
  const annualKwh = Math.round(systemSizeKw * 1650);
  const monthlySolarPayment = Math.round(systemSizeKw * 18 + (includeBattery ? 45 : 0));
  const monthlySavings = Math.round(currentBill * (targetOffset / 100) - monthlySolarPayment);
  const annualSavings = monthlySavings * 12;
  const net25YrSavings = Math.round(annualSavings * 25 * 1.15);
  const grossSystemPrice = Math.round(systemSizeKw * 2800 + (includeBattery ? 9500 : 0));
  const federalTaxCredit = Math.round(grossSystemPrice * 0.30);
  const netSystemPrice = grossSystemPrice - federalTaxCredit;

  const cumulativeData = Array.from({ length: 26 }, (_, year) => ({
    year,
    withoutSolar: Math.round(year * currentBill * 12 * 1.05),
    withSolar: Math.round(year * monthlySolarPayment * 12 + netSystemPrice * 0.05),
    savings: Math.round(year * annualSavings * (1 + year * 0.015)),
  }));

  async function handleGenerateProposal() {
    setGeneratingPdf(true);
    const prop = await solarApi.createProposal({
      customer: "Marcus Whitfield",
      systemKw: systemSizeKw,
      battery: includeBattery,
      value: netSystemPrice,
      sent: "Today (Auto Pre-Design Engine)",
      rep: "Dana Ruiz",
      status: "Sent",
    });
    setPdfProposalId(prop.id);
    setGeneratingPdf(false);
    setPdfModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <StatusPill tone="brand" dot>
              Step 4: Auto Pre-Design Engine (Consultant Tool)
            </StatusPill>
            <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
              Satellite Roof Mapping & Same-Day Proposal Generator
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Pulls roof data, computes solar energy production, and generates shareable PDF quote documents same-day (instead of 2 days).
            </p>
          </div>
          <Button onClick={handleGenerateProposal} disabled={generatingPdf} className="gap-2 font-bold">
            <Download className="size-4" />
            {generatingPdf ? "Generating Proposal PDF..." : "Generate Proposal Quote (PDF)"}
          </Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="surface-card overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2 font-bold text-sm">
                <MapPin className="size-4 text-primary" />
                Satellite Imagery Roof Layout Analysis
              </div>
              <StatusPill tone="success">1,450 sq ft Usable Roof</StatusPill>
            </div>

            <div className="relative mt-4 h-72 w-full overflow-hidden rounded-xl bg-slate-900 shadow-inner flex items-center justify-center border border-border">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80')",
                }}
              />
              <div className="relative z-10 rounded-xl bg-navy/80 p-6 backdrop-blur-md text-center max-w-md border border-primary/40 shadow-2xl">
                <div className="flex justify-center mb-3">
                  <div className="grid grid-cols-5 gap-1 bg-slate-900/90 p-2 rounded-lg border border-primary/50">
                    {Array.from({ length: Math.min(panelCount, 15) }).map((_, i) => (
                      <div
                        key={i}
                        className="h-7 w-5 rounded bg-blue-600 border border-cyan-300 shadow-sm flex items-center justify-center text-[8px] text-white font-mono font-bold"
                      >
                        400W
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-slate-200">
                  <span className="font-bold text-primary">{panelCount} High-Efficiency Panels</span> mapped to South-Facing Roof (18° Tilt, 180° Azimuth)
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-lg border border-border p-2.5">
                <span className="text-muted-foreground block">System Capacity</span>
                <span className="font-bold text-sm text-foreground">{systemSizeKw} kW DC</span>
              </div>
              <div className="rounded-lg border border-border p-2.5">
                <span className="text-muted-foreground block">Annual Production</span>
                <span className="font-bold text-sm text-foreground">{annualKwh.toLocaleString()} kWh/yr</span>
              </div>
              <div className="rounded-lg border border-border p-2.5">
                <span className="text-muted-foreground block">CO₂ Offset</span>
                <span className="font-bold text-sm text-foreground">{estimate.co2} Tons/yr</span>
              </div>
            </div>
          </div>

          <div className="surface-card p-6 space-y-5">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Production & Financial Calculator
            </h2>

            <div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Customer Monthly Bill</span>
                <span className="text-primary font-bold">${currentBill}/mo</span>
              </div>
              <input
                type="range"
                min="100"
                max="600"
                step="10"
                value={currentBill}
                onChange={(e) => setCurrentBill(Number(e.target.value))}
                className="mt-2 w-full accent-primary cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Target Offset %</span>
                <span className="text-primary font-bold">{targetOffset}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="120"
                step="5"
                value={targetOffset}
                onChange={(e) => setTargetOffset(Number(e.target.value))}
                className="mt-2 w-full accent-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <span className="block text-sm font-bold">Include 13.5 kWh Battery Storage</span>
                <span className="text-xs text-muted-foreground">Provides 24/7 backup during grid outages</span>
              </div>
              <input
                type="checkbox"
                checked={includeBattery}
                onChange={(e) => setIncludeBattery(e.target.checked)}
                className="size-5 accent-primary cursor-pointer"
              />
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary-soft/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross System Value:</span>
                <span className="font-bold">${grossSystemPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>30% Federal Clean Energy Tax Credit:</span>
                <span className="font-bold">-${federalTaxCredit.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-foreground">
                <span>Net System Price:</span>
                <span className="text-primary">${netSystemPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 surface-card p-6">
          <h2 className="font-display text-lg font-extrabold mb-1">
            25-Year Utility Escalation vs Fixed Solar Investment
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Comparing standard utility rates (+5%/yr) against fixed solar payment.
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="year" tickLine={false} tickFormatter={(v) => `Yr ${v}`} />
                <YAxis tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(val: number) => [`$${val.toLocaleString()}`, "Amount"]} />
                <Area type="monotone" dataKey="withoutSolar" stroke="#ef4444" fill="#f87171" fillOpacity={0.2} name="Without Solar" />
                <Area type="monotone" dataKey="savings" stroke="#10b981" fill="#34d399" fillOpacity={0.3} name="Cumulative Net Savings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>

      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
                <FileCheck className="size-5 text-primary" />
                Auto-Generated Same-Day Proposal Quote
              </DialogTitle>
              <StatusPill tone="success">Proposal #{pdfProposalId}</StatusPill>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-2 text-sm">
            <div className="rounded-xl border border-navy/20 bg-navy text-navy-foreground p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display text-2xl font-black text-white">SolarPeak</h3>
                  <p className="text-xs text-navy-foreground/70">Official Pre-Design Proposal & Contract Quote</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold">Prepared for: Marcus Whitfield</p>
                  <p className="text-navy-foreground/70">Sales Consultant: Dana Ruiz</p>
                  <p className="text-navy-foreground/70">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-3 text-center rounded-lg bg-navy-muted/50 p-3">
                <div>
                  <span className="block text-[10px] text-navy-foreground/70">System Size</span>
                  <span className="font-extrabold text-base text-primary">{systemSizeKw} kW</span>
                </div>
                <div>
                  <span className="block text-[10px] text-navy-foreground/70">Solar Panels</span>
                  <span className="font-extrabold text-base text-white">{panelCount}x 400W</span>
                </div>
                <div>
                  <span className="block text-[10px] text-navy-foreground/70">Est. 25-Yr Savings</span>
                  <span className="font-extrabold text-base text-emerald-400">${net25YrSavings.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-navy-foreground/70">Battery Backup</span>
                  <span className="font-extrabold text-base text-white">{includeBattery ? "13.5 kWh" : "None"}</span>
                </div>
              </div>
            </div>

            <div className="surface-card p-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Line Item Investment Breakdown</h4>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2">Component Description</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2.5">Solar Modules ({panelCount}x Tier-1 Monocrystalline Panels)</td>
                    <td className="py-2.5 text-right font-medium">${(systemSizeKw * 1800).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Inverter & Racking System (SolarEdge / Enphase Microinverters)</td>
                    <td className="py-2.5 text-right font-medium">${(systemSizeKw * 1000).toLocaleString()}</td>
                  </tr>
                  {includeBattery ? (
                    <tr>
                      <td className="py-2.5">Battery Storage System (13.5 kWh Lithium Phosphate)</td>
                      <td className="py-2.5 text-right font-medium">$9,500</td>
                    </tr>
                  ) : null}
                  <tr className="text-emerald-600 font-semibold">
                    <td className="py-2.5">Federal Clean Energy Tax Credit (30% ITC)</td>
                    <td className="py-2.5 text-right">-${federalTaxCredit.toLocaleString()}</td>
                  </tr>
                  <tr className="font-bold text-sm text-foreground">
                    <td className="pt-3">Total Net System Investment</td>
                    <td className="pt-3 text-right text-primary">${netSystemPrice.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer className="size-4" />
                Print / Download PDF Quote
              </Button>
              <Button onClick={() => setPdfModalOpen(false)}>
                Save to Proposal Pipeline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
