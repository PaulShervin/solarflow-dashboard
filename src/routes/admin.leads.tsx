import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, Filter, Globe, Plus, Search, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { statusMeta, type Lead, type LeadStatus } from "@/data/mock";
import { useSolarDB } from "@/hooks/useSolarDB";
import { solarApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/formatCurrency";

export const Route = createFileRoute("/admin/leads")({
  component: LeadsPage,
});

const filters: (LeadStatus | "all")[] = [
  "all",
  "new",
  "contacted",
  "qualified",
  "appointment",
  "proposal",
  "won",
  "lost",
];

function scoreTone(score: number) {
  return score >= 80 ? "success" : score >= 60 ? "warning" : "neutral";
}

function LeadsPage() {
  const { leads, auditLogs } = useSolarDB();
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);

  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [simName, setSimName] = useState("");
  const [simEmail, setSimEmail] = useState("");
  const [simPhone, setSimPhone] = useState("");
  const [simSource, setSimSource] = useState<"Google Ads" | "Meta" | "Website" | "Referral">("Website");
  const [simBill, setSimBill] = useState(250);
  const [simRoof, setSimRoof] = useState<"Asphalt shingle" | "Tile" | "Metal" | "Flat">("Asphalt shingle");

  const rows = [...leads]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .filter(
      (l) =>
        (status === "all" || l.status === status) &&
        (l.name.toLowerCase().includes(query.toLowerCase()) ||
          l.city.toLowerCase().includes(query.toLowerCase()) ||
          l.id.toLowerCase().includes(query.toLowerCase()))
    );

  async function handleSimulateWebhook(e: React.FormEvent) {
    e.preventDefault();
    setWebhookLoading(true);
    const result = await solarApi.postInboundWebhook({
      name: simName,
      email: simEmail,
      phone: simPhone,
      source: simSource,
      monthlyBill: Number(simBill),
      roof: simRoof,
      homeowner: true,
      city: "Scottsdale",
      state: "AZ",
      timeline: "0-1 month",
    });
    setWebhookLoading(false);
    setWebhookModalOpen(false);
    setSelected(result.lead);
  }

  async function handleHandoff(lead: Lead) {
    await solarApi.updateLead(lead.id, {
      owner: "Human Manager (Escalated)",
      aiSummary: `URGENT HUMAN HANDOFF: Lead requested human representative or requires custom roof engineering consultation.`,
      tags: [...new Set([...lead.tags, "Human Escalation", "Urgent"])],
    });
    const updated = leads.find((l) => l.id === lead.id);
    if (updated) setSelected(updated);
  }

  return (
    <>
      <PageHeader
        title="Leads & Inbound Webhooks"
        description={`${leads.length} total leads · Live 2-way CRM sync & instant response agent`}
        actions={
          <>
            <Button variant="outline" onClick={() => setWebhookModalOpen(true)}>
              <Globe className="text-primary" />
              Simulate Webhook
            </Button>
            <Button onClick={() => setWebhookModalOpen(true)}>
              <Plus />
              New Lead
            </Button>
          </>
        }
      />

      <div className="surface-card overflow-hidden">
        <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="relative min-w-0 lg:max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, city or ID"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setStatus(f)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  status === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-14 text-center">
            <p className="font-display text-lg font-bold">No leads match those filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing the search or simulating an inbound webhook payload.
            </p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left text-xs font-semibold text-muted-foreground">
                  <th className="px-5 py-3">Lead</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">AI Score</th>
                  <th className="px-5 py-3">Bill</th>
                  <th className="px-5 py-3">Roof</th>
                  <th className="px-5 py-3">Assigned Owner</th>
                  <th className="px-5 py-3">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(l)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-secondary/50",
                      selected?.id === l.id && "bg-primary-soft/50",
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-bold">{l.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.id} · {l.city}, {l.state}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md border border-border bg-secondary/60 px-2 py-1 text-xs font-medium">
                        {l.source}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={statusMeta[l.status]?.tone || "neutral"}>
                        {statusMeta[l.status]?.label || l.status || "New"}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <StatusPill tone={scoreTone(l.score)} dot className="font-bold">
                          {l.score}
                        </StatusPill>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{formatINR(l.monthlyBill)}/mo</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{l.roof}</td>
                    <td className="px-5 py-3.5 text-muted-foreground font-medium">{l.owner}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{l.lastTouch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={webhookModalOpen} onOpenChange={setWebhookModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              Simulate Inbound Webhook
            </DialogTitle>
            <DialogDescription>
              Test how the Instant Response Agent ingests leads from CRM, Facebook Ads, or website forms in real-time.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSimulateWebhook} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Full Name</label>
              <Input value={simName} onChange={(e) => setSimName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Email</label>
                <Input value={simEmail} onChange={(e) => setSimEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Phone</label>
                <Input value={simPhone} onChange={(e) => setSimPhone(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Lead Source</label>
                <select
                  value={simSource}
                  onChange={(e) => setSimSource(e.target.value as any)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="Google Ads">Google Ads</option>
                  <option value="Meta">Meta (Facebook Ads)</option>
                  <option value="Website">Website Form</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Monthly Bill (₹)</label>
                <Input type="number" value={simBill} onChange={(e) => setSimBill(Number(e.target.value))} required />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground">Roof Type</label>
              <select
                value={simRoof}
                onChange={(e) => setSimRoof(e.target.value as any)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="Asphalt shingle">Asphalt shingle</option>
                <option value="Tile">Tile</option>
                <option value="Metal">Metal</option>
                <option value="Flat">Flat</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setWebhookModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={webhookLoading}>
                {webhookLoading ? "Ingesting..." : "Fire Webhook POST"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected ? (
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <div className="flex items-center justify-between gap-3">
                <SheetTitle className="font-display text-xl font-extrabold">{selected.name}</SheetTitle>
                <StatusPill tone={statusMeta[selected.status].tone}>
                  {statusMeta[selected.status].label}
                </StatusPill>
              </div>
              <SheetDescription>
                {selected.id} · {selected.city}, {selected.state} · Source: {selected.source}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {selected.owner.includes("Human") ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="size-5 text-amber-500" />
                    Human Handoff Escalated
                  </div>
                  <p className="mt-1 text-xs leading-relaxed">
                    This lead was escalated to a live representative. AI bot monitoring remains active for background CRM updates.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
                  <div className="text-xs">
                    <span className="font-bold text-foreground">Assigned Rep:</span> {selected.owner}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleHandoff(selected)}>
                    <UserCheck className="size-4 text-primary" />
                    Escalate to Human
                  </Button>
                </div>
              )}

              <div className="surface-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-sm">
                    <Sparkles className="size-4 text-primary" />
                    AI Intent Summary
                  </span>
                  <StatusPill tone={scoreTone(selected.score)} dot className="font-bold">
                    Score {selected.score}/100
                  </StatusPill>
                </div>
                <Progress value={selected.score} className="h-1.5" />
                <p className="text-xs leading-relaxed text-muted-foreground">{selected.aiSummary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-border p-3">
                  <span className="text-muted-foreground block">Monthly Electric Bill</span>
                  <span className="font-bold text-base text-foreground">{formatINR(selected.monthlyBill)}/mo</span>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <span className="text-muted-foreground block">Roof & Structure</span>
                  <span className="font-bold text-base text-foreground">{selected.roof}</span>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <span className="text-muted-foreground block">Homeowner Status</span>
                  <span className="font-bold text-sm text-foreground">{selected.homeowner ? "Homeowner (Verified)" : "Renter"}</span>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <span className="text-muted-foreground block">Timeline</span>
                  <span className="font-bold text-sm text-foreground">{selected.timeline}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                  <Activity className="size-4 text-primary" />
                  Two-Way CRM Audit & Timestamps
                </h3>
                <ul className="space-y-2.5">
                  {auditLogs.slice(0, 5).map((log) => (
                    <li key={log.id} className="rounded-lg border border-border bg-card p-3 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-foreground">{log.title}</span>
                        {log.latencyMs ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                            ⚡ {log.latencyMs}ms response
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-muted-foreground">{log.detail}</p>
                      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground/70">
                        <span>Category: {log.category}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SheetContent>
        ) : null}
      </Sheet>
    </>
  );
}
