import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, Lock, RotateCcw, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusPill } from "@/components/common/StatusPill";
import { qualifyQuestions } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/qualify")({
  head: () => ({
    meta: [
      { title: "Free Solar Estimate in 60 Seconds | SolarPeak" },
      {
        name: "description",
        content:
          "Answer five quick questions about your home and get a preliminary solar savings estimate. No cost, no obligation.",
      },
      { property: "og:title", content: "Get your free solar estimate | SolarPeak" },
      {
        property: "og:description",
        content: "Five quick questions, one preliminary savings estimate. No cost, no obligation.",
      },
    ],
  }),
  component: QualifyPage,
});

type Bubble = { id: number; role: "assistant" | "user"; text: string };

const SCORE_WEIGHTS: Record<string, Record<string, number>> = {
  homeowner: { "Yes, I own it": 30, "No, I rent": 0, "I'm buying soon": 12 },
  bill: { "Under $100": 4, "$100 – $200": 12, "$200 – $350": 22, "Over $350": 28 },
  homeType: { "Single family": 18, Townhouse: 10, "Multi-family": 6, "Mobile / manufactured": 2 },
  roof: { "Asphalt shingle, under 10 yrs": 12, Tile: 9, Metal: 10, "Flat / other or not sure": 5 },
  timeline: {
    "As soon as possible": 12,
    "In 1 – 3 months": 9,
    "In 3 – 6 months": 5,
    "Just researching": 2,
  },
};

function QualifyPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bubbles, setBubbles] = useState<Bubble[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hi! I'm Sunny, SolarPeak's solar assistant. I'll ask five quick questions and put together a preliminary savings estimate for your home. It takes about a minute.",
    },
    { id: 1, role: "assistant", text: qualifyQuestions[0].prompt },
  ]);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const done = step >= qualifyQuestions.length;
  const progress = Math.round((Math.min(step, qualifyQuestions.length) / qualifyQuestions.length) * 100);
  const score = Object.entries(answers).reduce(
    (sum, [k, v]) => sum + (SCORE_WEIGHTS[k]?.[v] ?? 0),
    0,
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [bubbles, typing]);

  function choose(option: string) {
    if (done || typing) return;
    const current = qualifyQuestions[step]!;
    setAnswers((a) => ({ ...a, [current.key]: option }));
    setBubbles((b) => [...b, { id: b.length + 10, role: "user", text: option }]);
    setTyping(true);

    window.setTimeout(() => {
      const next = step + 1;
      setTyping(false);
      setStep(next);
      setBubbles((b) => [
        ...b,
        next < qualifyQuestions.length
          ? { id: b.length + 20, role: "assistant", text: qualifyQuestions[next]!.prompt }
          : {
              id: b.length + 20,
              role: "assistant",
              text: "Perfect — that's everything I need. I've built a preliminary savings estimate for your home. It's illustrative until a consultant reviews your actual usage and roof.",
            },
      ]);
    }, 700);
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setTyping(false);
    setBubbles([
      { id: 0, role: "assistant", text: "Let's start over. Do you own your home?" },
    ]);
  }

  const qualification =
    score >= 70
      ? { label: "Strong fit", tone: "success" as const }
      : score >= 45
        ? { label: "Possible fit", tone: "warning" as const }
        : { label: "Needs review", tone: "neutral" as const };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <StatusPill tone="brand" dot>
            Free · 60 seconds · No obligation
          </StatusPill>
          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
            Let's see what solar would save you
          </h1>
          <p className="mt-3 text-muted-foreground">
            Five questions about your home. No phone number required to see your estimate.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Chat */}
          <div className="surface-card flex min-w-0 flex-col overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <Sparkles className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">Sunny · Solar Assistant</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Online now
                  </span>
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="shrink-0">
                <RotateCcw />
                Restart
              </Button>
            </div>

            <div className="border-b border-border px-5 py-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>
                  Question {Math.min(step + 1, qualifyQuestions.length)} of{" "}
                  {qualifyQuestions.length}
                </span>
                <span>{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-secondary/30 px-5 py-6 max-h-[26rem] min-h-[22rem]">
              {bubbles.map((b) => (
                <div
                  key={b.id}
                  className={cn("flex items-end gap-2.5", b.role === "user" && "flex-row-reverse")}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full",
                      b.role === "user"
                        ? "bg-navy text-navy-foreground"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {b.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                  </span>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card",
                      b.role === "user"
                        ? "rounded-br-sm bg-navy text-navy-foreground"
                        : "rounded-bl-sm bg-card text-foreground",
                    )}
                  >
                    {b.text}
                  </div>
                </div>
              ))}

              {typing ? (
                <div className="flex items-end gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="size-4" />
                  </span>
                  <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-card px-4 py-3.5 shadow-card">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                        style={{ animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            <div className="border-t border-border p-4">
              {done ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="flex-1">
                    <Link to="/estimate">
                      See my personalized estimate
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" onClick={reset}>
                    Start over
                  </Button>
                </div>
              ) : (
                <>
                  <p className="mb-2.5 text-xs font-semibold text-muted-foreground">
                    Choose an answer
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {qualifyQuestions[step]!.options.map((o) => (
                      <button
                        key={o}
                        onClick={() => choose(o)}
                        disabled={typing}
                        className="rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-primary-soft disabled:opacity-50"
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-muted-foreground">
                    <Send className="size-4 shrink-0" />
                    <span className="truncate">
                      Prefer to type? Free-text chat arrives with the live assistant.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Side summary */}
          <div className="min-w-0 space-y-5">
            <div className="surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold">Your answers so far</h2>
                <StatusPill tone={qualification.tone}>{qualification.label}</StatusPill>
              </div>
              <dl className="mt-4 space-y-3">
                {qualifyQuestions.map((q) => (
                  <div
                    key={q.key}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <dt className="min-w-0 truncate text-sm capitalize text-muted-foreground">
                      {q.key === "homeType" ? "home type" : q.key}
                    </dt>
                    <dd className="shrink-0 text-sm font-semibold">
                      {answers[q.key] ?? <span className="text-muted-foreground/60">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 rounded-xl bg-secondary/60 p-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Estimate readiness</span>
                  <span className="text-primary">{score}%</span>
                </div>
                <Progress value={score} className="mt-2 h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Illustrative readiness indicator, not a credit or approval decision.
                </p>
              </div>
            </div>

            <div className="surface-card p-5">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Your answers are used only to build your estimate. We never sell your
                  information, and you won't get a call unless you ask for one.
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
