import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Leaf,
  MessageSquareText,
  ShieldCheck,
  Star,
  TrendingDown,
  Wallet,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusPill } from "@/components/common/StatusPill";
import { faqs, testimonials } from "@/data/mock";
import heroImage from "@/assets/hero-solar-home.jpg";
import crewImage from "@/assets/install-crew.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SolarPeak — Instant Response & Solar Operations Engine" },
      {
        name: "description",
        content:
          "Cut your electric bill with professionally installed home solar. Free savings estimate in 60 seconds, 25-year warranty, licensed Arizona installers.",
      },
      { property: "og:title", content: "SolarPeak — Save More. Live Better. Go Solar." },
      {
        property: "og:description",
        content:
          "Free 60-second solar savings estimate. Licensed Arizona installers, 25-year warranty, transparent pricing.",
      },
    ],
  }),
  component: HomePage,
});

const trustStats = [
  { value: "4,100+", label: "Homes powered" },
  { value: "$38M", label: "Customer savings to date" },
  { value: "4.9 / 5", label: "Average review score" },
  { value: "25 yr", label: "Production warranty" },
];

const whySolar = [
  {
    icon: TrendingDown,
    title: "Stop renting your power",
    body: "Utility rates in Arizona have climbed 34% in five years. A fixed solar payment replaces a bill that only goes one direction.",
  },
  {
    icon: Wallet,
    title: "Keep the 30% federal credit",
    body: "Eligible homeowners claim 30% of the system cost as a federal tax credit, on top of local incentives and net metering.",
  },
  {
    icon: BatteryCharging,
    title: "Stay on during outages",
    body: "Add battery storage and keep your essentials — or your whole home — running when the grid goes down.",
  },
  {
    icon: Leaf,
    title: "Raise your home's value",
    body: "Owned solar systems consistently appraise higher and sell faster than comparable homes without them.",
  },
];

const steps = [
  {
    icon: MessageSquareText,
    step: "01",
    title: "Get your instant estimate",
    body: "Answer five quick questions with our 24/7 AI assistant. Get qualified and auto-book a consultation in under 60 seconds.",
  },
  {
    icon: ClipboardList,
    step: "02",
    title: "Same-day pre-design quote",
    body: "Our Auto Pre-Design engine pulls satellite roof imagery and builds your custom proposal for your assigned consultant.",
  },
  {
    icon: Wrench,
    step: "03",
    title: "Track your install live",
    body: "Permitting, equipment ordering and utility approval updated step-by-step in your live customer status portal.",
  },
];

const financing = [
  {
    name: "Cash purchase",
    highlight: "Best lifetime value",
    body: "Own the system outright, claim the full federal credit and eliminate the payment entirely.",
    points: ["Highest 25-year savings", "No lien on the home", "Fastest payback"],
  },
  {
    name: "$0-down loan",
    highlight: "Most popular",
    body: "Replace your utility bill with a fixed monthly payment, typically lower than what you pay today.",
    points: ["No upfront cost", "Fixed rate, 10–25 yr terms", "You still own the system"],
  },
  {
    name: "Lease / PPA",
    highlight: "Lowest commitment",
    body: "Pay only for the power produced. Maintenance and monitoring are included for the full term.",
    points: ["No maintenance costs", "Predictable rate", "Transferable on sale"],
  },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-navy">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8 lg:py-24">
          <div className="min-w-0">
            <StatusPill tone="brand" dot className="bg-primary/15 text-primary">
              24/7 Instant Response & AI Solar Assistant
            </StatusPill>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-extrabold text-navy-foreground sm:text-5xl lg:text-6xl">
              Save More. Live Better.{" "}
              <span className="text-primary">Go Solar.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-foreground/70 sm:text-lg">
              Get an instant qualification and auto-book a consultation in under 60 seconds.
              Transparent pricing, licensed in-house crews and a 25-year production warranty.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7 text-[15px] shadow-lift font-bold">
                <Link to="/qualify">
                  Get My Free Estimate
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-navy-foreground/25 bg-transparent px-7 text-[15px] text-navy-foreground hover:bg-navy-muted hover:text-navy-foreground font-semibold"
              >
                <Link to="/qualify">Chat with AI Qualifier</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-foreground/65">
              {["Instant 24/7 response", "60-second qualification", "Auto-book rep slot"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative min-w-0">
            <div className="overflow-hidden rounded-2xl border border-navy-foreground/10 shadow-lift">
              <img
                src={heroImage}
                alt="Modern suburban home with rooftop solar panels at golden hour"
                width={1600}
                height={1104}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:absolute sm:-bottom-6 sm:-left-6 sm:mt-0 sm:w-72 sm:grid-cols-1">
              <div className="rounded-xl border border-border bg-card p-4 shadow-lift">
                <p className="text-xs font-semibold text-muted-foreground">
                  Instant Bot Response Time
                </p>
                <p className="font-display text-2xl font-extrabold text-foreground">&lt; 5 seconds</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-lift">
                <p className="text-xs font-semibold text-muted-foreground">Typical bill offset</p>
                <p className="font-display text-2xl font-extrabold text-primary">96%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustStats.map((s) => (
            <div key={s.label} className="min-w-0">
              <p className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why solar */}
      <section className="section-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <StatusPill tone="brand">Why solar</StatusPill>
            <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
              The math has changed. Most Arizona homes now pay less with solar than without it.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our instant AI agent asks key qualifying questions up front to ensure solar is a great fit for your home.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whySolar.map((item) => (
              <div
                key={item.title}
                className="surface-card group p-6 transition-shadow hover:shadow-lift"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <item.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3-step journey */}
      <section className="border-y border-border bg-secondary/40 section-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="min-w-0">
              <StatusPill tone="info">How it works</StatusPill>
              <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
                Three steps from inquiry to switched on
              </h2>
              <p className="mt-4 max-w-lg text-muted-foreground">
                Automated instant qualification, same-day satellite pre-design quotes for your rep, and live post-sale installation tracking.
              </p>
              <div className="mt-8 space-y-4">
                {steps.map((s) => (
                  <div key={s.step} className="surface-card flex gap-4 p-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy text-navy-foreground">
                      <s.icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold tracking-widest text-primary">
                        STEP {s.step}
                      </p>
                      <h3 className="mt-0.5 text-base font-bold">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {s.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="mt-8 h-12 px-7 font-bold">
                <Link to="/qualify">
                  Start Step One Now
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="min-w-0 overflow-hidden rounded-2xl border border-border shadow-lift">
              <img
                src={crewImage}
                alt="SolarPeak technician installing rooftop solar panels"
                loading="lazy"
                width={1200}
                height={800}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <StatusPill tone="brand">Customer stories</StatusPill>
              <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
                1,240 reviews. 4.9 average.
              </h2>
            </div>
            <div className="flex items-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-current" />
              ))}
            </div>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="surface-card flex flex-col p-6">
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-navy-foreground">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{t.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t.location} · {t.system}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-navy px-6 py-12 text-center shadow-lift sm:px-12">
          <ShieldCheck className="mx-auto size-10 text-primary" />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-extrabold text-navy-foreground sm:text-4xl">
            Find out what your roof is worth
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-navy-foreground/70">
            Our free 60-second qualification assistant takes about a minute and doesn't commit you to anything.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7 font-bold">
              <Link to="/qualify">
                Get My Free Estimate
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-navy-foreground/25 bg-transparent px-7 text-navy-foreground hover:bg-navy-muted hover:text-navy-foreground"
            >
              <Link to="/portal">
                <CalendarCheck />
                Existing customer? Open my project
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
