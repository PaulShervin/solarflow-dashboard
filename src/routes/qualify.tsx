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

function QualifyPage() {
  const [assignedRep] = useState("Dana Ruiz");

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12 flex-1">
        <div className="mx-auto max-w-3xl text-center">
          <StatusPill tone="brand" dot className="px-3 py-1 font-bold">
            ⚡ Module 5: Retrieval-Grounded Product & Pricing Chatbot
          </StatusPill>
          <h1 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            Get Your Free Solar Estimate in 60 Seconds
          </h1>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Answer a few quick questions or ask anything about panels, battery backup, warranties, and incentives. Our AI sizes your roof in real-time.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
          {/* Main Embedded Chatbot Widget */}
          <div className="surface-card flex min-w-0 flex-col overflow-hidden border-border/80 shadow-2xl p-2 rounded-2xl">
            <ProductChatbotWidget embedded={true} initialOpen={true} />
          </div>

          {/* Right Panel: How It Works & Guarantees */}
          <div className="min-w-0 space-y-5">
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

            <div className="surface-card p-6 space-y-3 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <Shield className="size-4" />
                <span>Verified Clean Energy Guarantees</span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>• <strong>25-Year</strong> Linear Panel Output Warranty (92% Guaranteed)</li>
                <li>• <strong>30% Federal Clean Energy Tax Credit</strong> Applied Directly</li>
                <li>• <strong>$0 Down</strong> Low-Interest Solar Loan Programs Available</li>
              </ul>
            </div>

            <div className="surface-card p-5">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 size-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Senior Consultant Assigned</strong>: {assignedRep} will receive your pre-design calculations directly to review customized financing options.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

