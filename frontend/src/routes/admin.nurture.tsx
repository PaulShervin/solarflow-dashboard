import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill, toneForText } from "@/components/common/StatusPill";
import { campaigns, type Campaign } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/nurture")({
  component: NurturePage,
});

function NurturePage() {
  const [active, setActive] = useState<Campaign>(campaigns[0]!);

  return (
    <>
      <PageHeader
        title="Nurture campaigns"
        description="Automated follow-up sequences that keep unconverted leads warm"
        actions={
          <Button>
            <Plus />
            New campaign
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c)}
              className={cn(
                "surface-card w-full p-5 text-left transition-shadow hover:shadow-lift",
                c.id === active.id && "border-primary/40 ring-1 ring-primary/20",
              )}
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
          <h2 className="font-display text-lg font-extrabold">{active.name}</h2>
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
          <h3 className="mt-6 text-sm font-bold">Sequence</h3>
          <ol className="mt-3 space-y-3">
            {active.steps.map((s, i) => (
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
            <Button variant="outline">Edit sequence</Button>
            <Button variant={active.status === "Active" ? "outline" : "default"}>
              {active.status === "Active" ? "Pause campaign" : "Activate campaign"}
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
