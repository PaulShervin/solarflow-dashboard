import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Lock,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusPill } from "@/components/common/StatusPill";
import { qualifyQuestions } from "@/data/mock";
import { useSolarDB } from "@/hooks/useSolarDB";
import { solarApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/qualify")({
  head: () => ({
    meta: [
      { title: "Free Solar Estimate in 60 Seconds | SolarPeak" },
      {
        name: "description",
        content:
          "Answer five quick questions or chat with Sunny AI to get your preliminary solar savings estimate. Instant CRM sync & calendar auto-booking.",
      },
    ],
  }),
  component: QualifyPage,
});

type Bubble = { id: string; role: "assistant" | "user"; text: string; time: string };

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
  const { conversations } = useSolarDB();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bubbles, setBubbles] = useState<Bubble[]>([
    {
      id: "b-0",
      role: "assistant",
      text: "Hi! I'm Sunny, SolarPeak's autonomous instant-response assistant. I'll ask five quick qualifying questions and trigger our Auto Pre-Design engine for your consultant. Click an option or type a message!",
      time: "Just now",
    },
    { id: "b-1", role: "assistant", text: qualifyQuestions[0].prompt, time: "Just now" },
  ]);

  const [inputText, setInputText] = useState("");
  const [typing, setTyping] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);
  const [assignedRep] = useState("Dana Ruiz");
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

  useEffect(() => {
    if (done) {
      // 1. Qualify Lead
      solarApi.qualifyLead("LD-4821", answers, score);

      // 2. Auto Pre-Design Engine triggers same-day proposal quote for consultant
      solarApi.createProposal({
        customer: answers.name || "Marcus Whitfield",
        systemKw: 9.6,
        battery: true,
        value: 24800,
        sent: "Today (Auto Pre-Design Engine)",
        rep: assignedRep,
        status: "Sent",
      });
    }
  }, [done, answers, score, assignedRep]);

  function submitUserMessage(userMsg: string) {
    if (typing || !userMsg.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const currentQ = qualifyQuestions[step];
    if (currentQ) {
      setAnswers((prev) => ({ ...prev, [currentQ.key]: userMsg }));
    }

    setBubbles((b) => [...b, { id: `msg-${Date.now()}`, role: "user", text: userMsg, time: timeStr }]);
    setInputText("");
    setTyping(true);

    window.setTimeout(() => {
      const next = step + 1;
      setTyping(false);
      setStep(next);

      let replyText = "";
      if (next < qualifyQuestions.length) {
        replyText = qualifyQuestions[next]!.prompt;
      } else {
        replyText =
          `Great news! You have been qualified (AI Score: ${score}/100) and synced with our CRM. Our Auto Pre-Design engine has generated your same-day proposal quote for your senior consultant ${assignedRep}. Select a time slot below to confirm your consultation!`;
      }

      setBubbles((b) => [
        ...b,
        { id: `reply-${Date.now()}`, role: "assistant", text: replyText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);

      if (conversations[0]?.id) {
        solarApi.sendMessage(conversations[0].id, "user", userMsg);
        solarApi.sendMessage(conversations[0].id, "bot", replyText);
      }
    }, 650);
  }

  function handleOptionClick(option: string) {
    submitUserMessage(option);
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitUserMessage(inputText);
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setTyping(false);
    setBookedSlot(null);
    setBubbles([
      { id: "b-0", role: "assistant", text: "Let's restart your estimate. Do you own your home?", time: "Just now" },
      { id: "b-1", role: "assistant", text: qualifyQuestions[0].prompt, time: "Just now" },
    ]);
  }

  async function handleBook(slot: string) {
    setBookedSlot(slot);
    await solarApi.bookAppointment("LD-4821", assignedRep, "Tomorrow", slot);
  }

  const qualification =
    score >= 70
      ? { label: "Qualified High Intent", tone: "success" as const }
      : score >= 45
        ? { label: "Qualified Standard", tone: "warning" as const }
        : { label: "Human Escalation Flagged", tone: "danger" as const };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12 flex-1">
        <div className="mx-auto max-w-3xl text-center">
          <StatusPill tone="brand" dot className="px-3 py-1 font-bold">
            ⚡ Step 2 & 3: Instant 24/7 Response & Lead Qualification
          </StatusPill>
          <h1 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            Fast Solar Qualification Assistant
          </h1>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
            Eliminates slow callbacks & filters non-buyers automatically.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="surface-card flex min-w-0 flex-col overflow-hidden border-border/80 shadow-2xl">
            {/* Header */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-secondary/30 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                  <Bot className="size-5" />
                  <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-foreground">Sunny · Instant Response Bot</span>
                    <StatusPill tone="success" className="text-[10px]">Active</StatusPill>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    Auto-responder active · 2-Way CRM Sync Enabled
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="shrink-0 text-xs">
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            </div>

            {/* Progress */}
            <div className="border-b border-border bg-card px-5 py-2.5">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Question {Math.min(step + 1, qualifyQuestions.length)} of {qualifyQuestions.length}</span>
                <span>{progress}% Completed</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Chat Body */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950/20 px-5 py-6 max-h-[28rem] min-h-[22rem]">
              {bubbles.map((b) => (
                <div
                  key={b.id}
                  className={cn("flex items-end gap-2.5", b.role === "user" && "flex-row-reverse")}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold shadow-sm",
                      b.role === "user"
                        ? "bg-navy text-navy-foreground"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {b.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                  </span>
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-card",
                        b.role === "user"
                          ? "rounded-br-none bg-navy text-white font-medium"
                          : "rounded-bl-none bg-card text-foreground border border-border/80",
                      )}
                    >
                      {b.text}
                    </div>
                    <span className={cn("text-[10px] text-muted-foreground/70 px-1", b.role === "user" && "text-right")}>
                      {b.time}
                    </span>
                  </div>
                </div>
              ))}

              {typing ? (
                <div className="flex items-end gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Bot className="size-4" />
                  </span>
                  <div className="flex gap-1.5 rounded-2xl rounded-bl-none bg-card border border-border px-4 py-3.5 shadow-card">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="size-2 animate-bounce rounded-full bg-primary"
                        style={{ animationDelay: `${i * 140}ms` }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            {/* Input & Option Pills */}
            <div className="border-t border-border bg-card p-4 space-y-3">
              {done ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-primary/40 bg-primary-soft/60 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-5 text-primary" />
                        <span className="text-sm font-extrabold text-foreground">Auto-Book Consultation Slot</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold">Assigned Rep: {assignedRep}</span>
                    </div>

                    {bookedSlot ? (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-card p-3 text-sm border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="size-5 text-emerald-500" />
                          Consultation Confirmed: Tomorrow at {bookedSlot}
                        </span>
                        <StatusPill tone="success">CRM Synced ✓</StatusPill>
                      </div>
                    ) : (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {["9:00 AM", "1:30 PM", "4:00 PM"].map((slot) => (
                          <button
                            key={slot}
                            onClick={() => handleBook(slot)}
                            className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-bold hover:border-primary hover:bg-primary-soft transition-all shadow-sm"
                          >
                            Tomorrow {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild size="lg" className="flex-1 font-bold gap-2">
                      <Link to="/admin/proposals">
                        View Generated Pre-Design Quote (Consultant Console)
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" onClick={reset}>
                      Start Over
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {qualifyQuestions[step] ? (
                    <div>
                      <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Select Answer Option:
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {qualifyQuestions[step].options.map((o) => (
                          <button
                            key={o}
                            onClick={() => handleOptionClick(o)}
                            disabled={typing}
                            className="rounded-xl border border-border/80 bg-secondary/50 px-3.5 py-2.5 text-left text-xs font-semibold text-foreground transition-all hover:border-primary hover:bg-primary-soft hover:shadow-sm disabled:opacity-50"
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-1">
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Or type custom response..."
                      className="flex-1 text-xs"
                      disabled={typing}
                    />
                    <Button type="submit" disabled={typing || !inputText.trim()} size="sm" className="gap-1.5 font-bold">
                      <Send className="size-3.5" />
                      Send
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Right Panel Metrics */}
          <div className="min-w-0 space-y-5">
            <div className="surface-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  Intent Scoring Engine
                </h2>
                <StatusPill tone={qualification.tone}>{qualification.label}</StatusPill>
              </div>

              <div className="rounded-xl bg-secondary/60 p-4 border border-border">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Computed Intent Score</span>
                  <span className="text-primary text-base">{score}/100</span>
                </div>
                <Progress value={score} className="mt-2 h-2" />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Filters non-buyers automatically. Renters & low scores trigger human manager escalation.
                </p>
              </div>

              <dl className="space-y-2.5 text-xs">
                {qualifyQuestions.map((q) => (
                  <div key={q.key} className="flex items-center justify-between border-b border-border pb-2">
                    <dt className="text-muted-foreground capitalize font-medium">{q.key}</dt>
                    <dd className="font-bold text-foreground">
                      {answers[q.key] ?? <span className="text-muted-foreground/50">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="surface-card p-5">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 size-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>2-Way CRM Sync</strong>: Inbound answers write to CRM, reserve rep calendar slots, and trigger Auto Pre-Design proposal generation.
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
