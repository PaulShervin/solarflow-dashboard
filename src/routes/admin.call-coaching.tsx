import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Mic, Pause, Play, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { type Call } from "@/data/mock";
import { useSolarDB } from "@/hooks/useSolarDB";
import { solarApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/call-coaching")({
  component: CallCoachingPage,
});

function CallCoachingPage() {
  const { calls } = useSolarDB();
  const [active, setActive] = useState<Call>(calls[0] || ({} as Call));
  const [playing, setPlaying] = useState(false);
  const [playSeconds, setPlaySeconds] = useState(0);

  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [ingestRep, setIngestRep] = useState("Dana Ruiz");
  const [ingestCustomer, setIngestCustomer] = useState("Robert Vance");
  const [ingestDuration, setIngestDuration] = useState("06:15");
  const [ingestOutcome, setIngestOutcome] = useState("Closed Deal");
  const [ingesting, setIngesting] = useState(false);

  const selectedCall = calls.find((c) => c.id === active.id) || calls[0] || active;

  useEffect(() => {
    let interval: any;
    if (playing) {
      interval = setInterval(() => {
        setPlaySeconds((s) => (s >= 180 ? 0 : s + 1));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [playing]);

  async function handleIngestCall(e: React.FormEvent) {
    e.preventDefault();
    setIngesting(true);
    const newCall = await solarApi.ingestCallRecording(
      ingestRep,
      ingestCustomer,
      ingestDuration,
      ingestOutcome,
    );
    setIngesting(false);
    setIngestModalOpen(false);
    setActive(newCall);
  }

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <PageHeader
        title="Call Coaching & AI STT Transcription Engine"
        description={`${calls.length} total calls ingested · STT transcription, sentiment & objection tagging`}
        actions={
          <Button onClick={() => setIngestModalOpen(true)}>
            <Upload className="size-4" />
            Ingest Phone Recording
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="surface-card overflow-hidden">
          <div className="border-b border-border px-5 py-4 flex justify-between items-center">
            <h2 className="text-base font-bold">Ingested Calls</h2>
            <StatusPill tone="brand">{calls.length} Recorded</StatusPill>
          </div>
          <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {calls.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setActive(c);
                    setPlaying(false);
                    setPlaySeconds(0);
                  }}
                  className={cn(
                    "w-full px-5 py-4 text-left transition-colors hover:bg-secondary/50",
                    c.id === selectedCall?.id && "bg-primary-soft",
                  )}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <span className="truncate text-sm font-bold">{c.rep}</span>
                    <StatusPill tone={c.score >= 80 ? "success" : c.score >= 65 ? "warning" : "danger"}>
                      {c.score}/100
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
                  {selectedCall?.rep} → {selectedCall?.customer}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {selectedCall?.date} · {selectedCall?.duration} · Outcome: {selectedCall?.outcome}
                </p>
              </div>
              <StatusPill tone={selectedCall?.score >= 80 ? "success" : "warning"} dot className="font-bold">
                Pitch Score {selectedCall?.score}/100
              </StatusPill>
            </div>

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
                        "flex-1 rounded-sm transition-colors",
                        playing && i <= (playSeconds / 180) * 64 ? "bg-primary" : "bg-border",
                      )}
                      style={{ height: `${20 + Math.abs(Math.sin(i / 3)) * 70}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>{formatSecs(playSeconds)}</span>
                  <span>{selectedCall?.duration}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3.5 text-primary" />
                Tagged Objections:
              </span>
              {selectedCall?.objections ? (
                selectedCall.objections.map((o: any, idx: number) => (
                  <StatusPill key={idx} tone={o.RepHandled ? "success" : "danger"}>
                    {o.topic} ({o.RepHandled ? "Resolved" : "Unresolved"})
                  </StatusPill>
                ))
              ) : (
                <StatusPill tone="neutral">Tile roof labor fee</StatusPill>
              )}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Tabs defaultValue="transcript" className="min-w-0">
              <TabsList>
                <TabsTrigger value="transcript">Speech-to-Text Transcript</TabsTrigger>
                <TabsTrigger value="coaching">Coaching Report</TabsTrigger>
              </TabsList>

              <TabsContent value="transcript" className="mt-4">
                <div className="surface-card divide-y divide-border max-h-[400px] overflow-y-auto">
                  {selectedCall?.transcript ? (
                    selectedCall.transcript.map((t: any, i: number) => (
                      <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 px-5 py-3.5 hover:bg-secondary/40">
                        <span className="text-xs font-mono font-semibold text-primary">{t.time || t.at || "00:15"}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground">{t.speaker}</p>
                          <p className="text-sm leading-relaxed text-muted-foreground">{t.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-muted-foreground">No transcript available</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="coaching" className="mt-4 space-y-4">
                <div className="surface-card p-5 space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    Manager Coaching Feedback
                  </h3>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {selectedCall?.coachingNotes ? (
                      selectedCall.coachingNotes.map((note: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {note}
                        </li>
                      ))
                    ) : (
                      <li>Strong rapport and fast answering.</li>
                    )}
                  </ul>
                </div>
              </TabsContent>
            </Tabs>

            <aside className="surface-card p-5 space-y-4 min-w-0">
              <h3 className="font-bold text-sm">Talk / Listen Ratio</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Sales Rep</span>
                  <span className="font-bold text-primary">
                    {typeof selectedCall?.talkRatio === "object" ? selectedCall.talkRatio.rep : (selectedCall?.talkRatio ?? 54)}%
                  </span>
                </div>
                <Progress value={typeof selectedCall?.talkRatio === "object" ? selectedCall.talkRatio.rep : (selectedCall?.talkRatio ?? 54)} className="h-2" />
                <div className="flex justify-between">
                  <span>Customer</span>
                  <span className="font-bold text-navy">
                    {typeof selectedCall?.talkRatio === "object" ? selectedCall.talkRatio.customer : (100 - (typeof selectedCall?.talkRatio === "number" ? selectedCall.talkRatio : 54))}%
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Dialog open={ingestModalOpen} onOpenChange={setIngestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <Mic className="size-5 text-primary" />
              Ingest Phone System Recording
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleIngestCall} className="space-y-4 py-2 text-sm">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Sales Rep</label>
              <Input value={ingestRep} onChange={(e) => setIngestRep(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Customer Name</label>
              <Input value={ingestCustomer} onChange={(e) => setIngestCustomer(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Call Duration</label>
                <Input value={ingestDuration} onChange={(e) => setIngestDuration(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Call Outcome</label>
                <Input value={ingestOutcome} onChange={(e) => setIngestOutcome(e.target.value)} required />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIngestModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={ingesting}>
                {ingesting ? "Transcribing with AI..." : "Ingest & Process Call"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
