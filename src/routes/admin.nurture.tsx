import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Flame, Play, Plus, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill, toneForText } from "@/components/common/StatusPill";
import { useSolarDB } from "@/hooks/useSolarDB";
import { solarApi } from "@/lib/api";
import type { Campaign } from "@/data/mock";

export const Route = createFileRoute("/admin/nurture")({
  component: NurturePage,
});

function NurturePage() {
  const { campaigns, leads } = useSolarDB();
  const [active, setActive] = useState<Campaign>(campaigns[0] || ({} as Campaign));

  const [runningRules, setRunningRules] = useState(false);
  const [triggerResults, setTriggerResults] = useState<{ executedCount: number; logs: string[] } | null>(null);

  const [personalizeModalOpen, setPersonalizeModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || "LD-4821");

  const targetLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  async function handleExecuteTriggerCheck() {
    setRunningRules(true);
    const res = await solarApi.triggerNurtureRulesCheck();
    setTriggerResults(res);
    setRunningRules(false);
  }

  return (
    <>
      <PageHeader
        title="Contextual Nurture Engine"
        description="Automated stage-tied drip sequences, trigger rules & dynamic personalization"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPersonalizeModalOpen(true)}>
              <Sparkles className="text-primary size-4" />
              Preview Copy Logic
            </Button>
            <Button onClick={handleExecuteTriggerCheck} disabled={runningRules}>
              <Zap className="size-4" />
              {runningRules ? "Evaluating Rules..." : "Execute Trigger Check"}
            </Button>
          </div>
        }
      />

      {triggerResults ? (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center justify-between font-bold text-sm mb-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Trigger Rules Evaluated Successfully ({triggerResults.executedCount} Touchpoints Queued)
            </span>
            <button onClick={() => setTriggerResults(null)} className="text-muted-foreground hover:underline">
              Dismiss
            </button>
          </div>
          <ul className="space-y-1 font-mono text-[11px]">
            {triggerResults.logs.slice(0, 4).map((log, i) => (
              <li key={i}>• {log}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c)}
              className={c.id === active.id ? "surface-card w-full p-5 text-left border-primary/40 ring-1 ring-primary/20" : "surface-card w-full p-5 text-left transition-shadow hover:shadow-lift"}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold">{c.name}</h2>
                  <p className="truncate text-xs text-muted-foreground">{c.audience}</p>
                </div>
                <StatusPill tone={toneForText(c.status)} dot>
                  {c.status}
                </StatusPill>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["Enrolled", c.enrolled],
                  ["Open rate", `${c.openRate}%`],
                  ["Reply rate", `${c.replyRate}%`],
                  ["Reactivated", c.reactivated],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <p className="text-[11px] text-muted-foreground">{k}</p>
                    <p className="font-display text-lg font-extrabold">{v}</p>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <aside className="surface-card min-w-0 self-start p-6">
          <h2 className="font-display text-lg font-extrabold">{active.name || "Campaign"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {active.channel} · {active.audience}
          </p>
          <div className="mt-5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Reply rate</span>
              <span>{active.replyRate}%</span>
            </div>
            <Progress value={active.replyRate} className="mt-1.5 h-2" />
          </div>

          <h3 className="mt-6 text-sm font-bold">Stage-Tied Sequence Steps</h3>
          <ol className="mt-3 space-y-3">
            {active.steps?.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-border p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {s.day} · {s.channel}
                  </p>
                  <p className="truncate text-sm font-medium">{s.subject}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 grid gap-2">
            <Button variant="outline" onClick={() => setPersonalizeModalOpen(true)}>
              Preview Personalization Engine
            </Button>
            <Button variant={active.status === "Active" ? "outline" : "default"}>
              {active.status === "Active" ? "Pause Campaign" : "Activate Campaign"}
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={personalizeModalOpen} onOpenChange={setPersonalizeModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Dynamic Personalization Evaluator
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Select Customer CRM Record</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} (${l.monthlyBill}/mo, {l.roof}, Score: {l.score})
                  </option>
                ))}
              </select>
            </div>

            <div className="surface-card p-4 space-y-2 text-xs">
              <h4 className="font-bold text-muted-foreground uppercase">Template Copy with Placeholders</h4>
              <p className="font-mono bg-secondary/60 p-2.5 rounded text-[11px] leading-relaxed">
                "Hi &#123;&#123;first_name&#125;&#125;! Notice your monthly bill is &#123;&#123;monthly_bill&#125;&#125;. Based on your &#123;&#123;roof_type&#125;&#125; roof in &#123;&#123;city&#125;&#125;, solar can save you approximately &#123;&#123;est_annual_savings&#125;&#125;/yr. Want your consultant &#123;&#123;rep_name&#125;&#125; to lock in your federal credit?"
              </p>
            </div>

            <div className="rounded-xl border border-primary/40 bg-primary-soft/40 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-primary flex items-center gap-1.5 text-sm">
                <Flame className="size-4" />
                Compiled Personalized Output
              </h4>
              <p className="text-foreground text-sm leading-relaxed italic">
                "Hi {targetLead?.name.split(" ")[0]}! Notice your monthly bill is ${targetLead?.monthlyBill}/mo. Based on your {targetLead?.roof} roof in {targetLead?.city}, solar can save you approximately ${Math.round((targetLead?.monthlyBill || 250) * 8.5).toLocaleString()}/yr. Want your consultant {targetLead?.owner} to lock in your federal credit?"
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
