import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, MessageSquare, Send, ShieldAlert, Sparkles, UserSquare2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { useSolarDB } from "@/hooks/useSolarDB";
import { solarApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const { portalProject, portalMilestones, auditLogs, leads } = useSolarDB();
  const [updating, setUpdating] = useState(false);

  const wonLeads = leads.filter((l) => l.status === "won" || l.status === "proposal");

  async function handleAdvanceMilestone(newIndex: number) {
    setUpdating(true);
    await solarApi.updateCustomerMilestone(
      newIndex,
      "complete",
      `Milestone stage ${newIndex + 1} officially verified and updated by customer operations team.`,
    );
    setUpdating(false);
  }

  const hasActiveProject = portalProject && portalProject.customer && portalMilestones.length > 0;

  return (
    <>
      <PageHeader
        title="Post-Sale Operations & Milestone Control"
        description="Active customer project tracker, auto-notifications & cancellation risk prevention"
      />
      
      {!hasActiveProject ? (
        <div className="surface-card p-14 text-center rounded-2xl max-w-xl mx-auto my-8">
          <UserSquare2 className="size-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-base font-bold text-foreground">No active post-sale installation projects</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            When a proposal is signed or a lead advances to "Won", a dedicated tracking project and customer portal will be generated here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <div className="surface-card p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-extrabold">{portalProject.customer}</h2>
                  <p className="text-xs text-muted-foreground">
                    {portalProject.address} · Contract: ${portalProject.contractValue?.toLocaleString() || "0"}
                  </p>
                </div>
                <StatusPill tone="success" dot className="font-bold">
                  Stage: {portalProject.status || "In Progress"}
                </StatusPill>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <Sparkles className="size-4 text-primary" />
                  Active CRM Milestone Stages
                </h3>

                <div className="space-y-2">
                  {portalMilestones.map((m, idx) => (
                    <div
                      key={m.title}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3 text-xs transition-colors",
                        m.status === "complete"
                          ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                          : m.status === "current"
                            ? "border-primary/40 bg-primary-soft text-foreground font-bold"
                            : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "grid size-6 place-items-center rounded-full text-[10px] font-bold",
                            m.status === "complete"
                              ? "bg-emerald-500 text-white"
                              : m.status === "current"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <span className="block font-semibold">{m.title}</span>
                          <span className="text-[11px] text-muted-foreground">{m.date || "Scheduled"}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={m.status === "complete" ? "ghost" : "outline"}
                        disabled={updating}
                        onClick={() => handleAdvanceMilestone(idx)}
                        className="text-xs h-7"
                      >
                        {m.status === "complete" ? "Completed ✓" : "Advance Stage →"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="surface-card min-w-0 self-start p-6 space-y-5 rounded-2xl">
            <div>
              <h2 className="font-display text-lg font-bold">Auto-Notification Log</h2>
              <p className="text-xs text-muted-foreground">Every status change dispatches text/email alerts instantly.</p>
            </div>

            <div className="space-y-3">
              {auditLogs.filter((l) => l.category === "Milestone").length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border">
                  No milestone notifications triggered yet.
                </div>
              ) : (
                auditLogs.filter((l) => l.category === "Milestone").map((log) => (
                  <div key={log.id} className="rounded-xl border border-border bg-secondary/30 p-3.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-primary">{log.title}</span>
                      <span className="text-[10px] text-emerald-600 font-mono">⚡ {log.latencyMs}ms</span>
                    </div>
                    <p className="mt-1 text-muted-foreground leading-relaxed">{log.detail}</p>
                    <div className="mt-2 text-[10px] text-muted-foreground/70">
                      Customer Portal & SMS Synced
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border pt-4">
              <Button asChild className="w-full">
                <a href="/portal" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                  Open Customer Portal View
                </a>
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
