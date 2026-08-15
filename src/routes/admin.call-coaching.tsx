import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Pause, Play, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { callCoachingSummary, calls, type Call } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/call-coaching")({
  component: CallCoachingPage,
});

function CallCoachingPage() {
  const [active, setActive] = useState<Call>(calls[0]!);
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <PageHeader
        title="Call coaching"
        description={`${callCoachingSummary.callsAnalyzed} calls analyzed · team score ${callCoachingSummary.teamScore}/100`}
      />

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="surface-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-bold">Recent calls</h2>
          </div>
          <ul className="divide-y divide-border">
            {calls.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActive(c)}
                  className={cn(
                    "w-full px-5 py-4 text-left transition-colors hover:bg-secondary/50",
                    c.id === active.id && "bg-primary-soft",
                  )}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <span className="truncate text-sm font-bold">{c.rep}</span>
                    <StatusPill tone={c.score >= 80 ? "success" : c.score >= 65 ? "warning" : "danger"}>
                      {c.score}
                    </StatusPill>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.customer} · {c.date} · {c.duration}
                  </p>
                  <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                    {c.outcome}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 space-y-5">
          <div className="surface-card p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-extrabold">
                  {active.rep} → {active.customer}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {active.date} · {active.duration} · {active.outcome}
                </p>
              </div>
              <StatusPill tone={active.score >= 80 ? "success" : "warning"} dot>
                Score {active.score}/100
              </StatusPill>
            </div>

            {/* Audio placeholder */}
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-border bg-secondary/50 p-4">
              <Button size="icon" onClick={() => setPlaying((p) => !p)} aria-label="Play recording">
                {playing ? <Pause /> : <Play />}
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex h-10 items-end gap-0.5">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex-1 rounded-sm",
                        playing && i < 20 ? "bg-primary" : "bg-border",
                      )}
                      style={{ height: `${20 + Math.abs(Math.sin(i / 3)) * 70}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                  <span>00:00</span>
                  <span>{active.duration}</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Recording playback is a placeholder in this preview.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Tabs defaultValue="analysis" className="min-w-0">
              <TabsList>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="mt-4 space-y-5">
                <div className="surface-card p-6">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="size-4 text-success" />
                    Strengths
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {active.strengths.map((s) => (
                      <li key={s} className="flex gap-2.5 text-sm leading-relaxed">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-success" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="surface-card p-6">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <TriangleAlert className="size-4 text-warning" />
                    Improvement areas
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {active.improvements.map((s) => (
                      <li key={s} className="flex gap-2.5 text-sm leading-relaxed">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="transcript" className="mt-4">
                <div className="surface-card divide-y divide-border">
                  {active.transcript.map((t, i) => (
                    <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 px-5 py-3.5">
                      <span className="text-xs font-semibold text-muted-foreground">{t.at}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold">{t.speaker}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">{t.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <aside className="surface-card min-w-0 self-start p-6">
              <h3 className="text-sm font-bold">Scorecard</h3>
              <ul className="mt-4 space-y-3">
                {active.metrics.map((m) => (
                  <li key={m.label}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-semibold">{m.value}</span>
                    </div>
                    <Progress value={m.value} className="mt-1 h-1.5" />
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-lg bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">Rep talk ratio</p>
                <p className="font-display text-xl font-extrabold">{active.talkRatio}%</p>
                <p className="text-[11px] text-muted-foreground">Target 40–45%</p>
              </div>
              <Button className="mt-5 w-full">Assign coaching</Button>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
