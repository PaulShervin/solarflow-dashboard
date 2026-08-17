import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Lock,
  MessageSquare,
  RotateCcw,
  Sparkles,
  User,
  Zap,
  MapPin,
  Shield,
  Layers,
  Sun,
  BatteryCharging,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusPill } from "@/components/common/StatusPill";
import { ProductChatbotWidget } from "@/components/chat/ProductChatbotWidget";

export const Route = createFileRoute("/qualify")({
  head: () => ({
    meta: [
      { title: "Free Solar Estimate in 60 Seconds | SolarFlow" },
      {
        name: "description",
        content:
          "Get your instant solar savings estimate with SolarFlow AI. Step-by-step qualification, satellite rooftop scanner, and verified catalog product Q&A.",
      },
    ],
  }),
  component: QualifyPage,
});

const quickPrompts = [
  "⚡ Lithium LFP Battery Pricing & Specs",
  "☀️ Tier-1 Mono Perc vs TopCon Panels",
  "💰 Net Metering with Tata / BESCOM / MSEDCL",
  "📄 PM Surya Ghar: Muft Bijli Yojana (₹78,000 Subsidy)",
  "🏠 What if my RCC roof has partial shade?",
];

function QualifyPage() {
  const [assignedRep] = useState("Dana Ruiz");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12 flex-1">
        <div className="mx-auto max-w-3xl text-center">
          <StatusPill tone="brand" dot className="px-3 py-1 font-bold">
            ⚡ Instant Rooftop Solar & Subsidy Calculator
          </StatusPill>
          <h1 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            Get Your Free Solar Estimate in 60 Seconds
          </h1>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Answer a few quick questions or ask anything about panels, battery backup, warranties, and incentives. Our AI sizes your roof in real-time.
          </p>

          {/* Quick Inquiry Chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setSelectedPrompt(prompt)}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:bg-primary-soft hover:text-primary active:scale-95 shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
          {/* Main Embedded Chatbot Widget */}
          <div className="surface-card flex min-w-0 flex-col overflow-hidden border-border/80 shadow-2xl p-2 rounded-3xl">
            <ProductChatbotWidget embedded={true} initialOpen={true} initialPrompt={selectedPrompt} />
          </div>

          {/* Right Panel: How It Works & Guarantees */}
          <div className="min-w-0 space-y-5">
            {/* Real-Time Roof Satellite Sizing Card */}
            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  Live Pre-Design Engine
                </h2>
                <StatusPill tone="success" dot>Real-Time</StatusPill>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                    1
                  </span>
                  <div>
                    <p className="font-bold text-foreground">Step-by-Step Qualification</p>
                    <p className="text-muted-foreground text-[11px]">
                      Determines homeowner status, average monthly electric bill, and roof type.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                    2
                  </span>
                  <div>
                    <p className="font-bold text-foreground">Satellite Rooftop Scanner</p>
                    <p className="text-muted-foreground text-[11px]">
                      Opens an interactive sub-window map tool to capture usable square footage.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                    3
                  </span>
                  <div>
                    <p className="font-bold text-foreground">Grounded Product Catalog Q&A</p>
                    <p className="text-muted-foreground text-[11px]">
                      Ask about Maxeon 430W panels, Tesla Powerwall 3, cloudy days, or warranties.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                    4
                  </span>
                  <div>
                    <p className="font-bold text-foreground">Instant Estimate & PDF Proposal</p>
                    <p className="text-muted-foreground text-[11px]">
                      Generates solar capacity (kW), 30% Federal ITC credit, net cost, and monthly savings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Arizona Clean Energy Guarantees */}
            <div className="surface-card p-6 space-y-3 border-primary/30 bg-primary-soft/50">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Shield className="size-4" />
                <span>Verified Clean Energy Guarantees</span>
              </div>
              <ul className="space-y-1.5 text-xs text-foreground/80">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                  <span><strong>25-Year</strong> Linear Panel Output Warranty (92% Guaranteed)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                  <span><strong>PM Surya Ghar: Muft Bijli Yojana</strong> Subsidy up to ₹78,000</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                  <span><strong>₹0 Down</strong> Low-Interest Solar Loan & EMI Options</span>
                </li>
              </ul>
            </div>

            {/* Senior Consultant Assignment Card */}
            <div className="surface-card p-5">
              <div className="flex items-start gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-navy text-navy-foreground text-xs font-bold">
                  DR
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">Senior Consultant Assigned</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    {assignedRep} will receive your pre-design calculations directly to review customized financing options.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}


