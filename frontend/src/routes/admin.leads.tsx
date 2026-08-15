import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Filter, Plus, Search, Sparkles } from "lucide-react";
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
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { leads, statusMeta, type Lead, type LeadStatus } from "@/data/mock";
import { cn } from "@/lib/utils";

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
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);

  const rows = leads.filter(
    (l) =>
      (status === "all" || l.status === status) &&
      (l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.city.toLowerCase().includes(query.toLowerCase()) ||
        l.id.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${leads.length} leads · sorted by qualification score`}
        actions={
          <>
            <Button variant="outline">
              <Filter />
              Filters
            </Button>
            <Button>
              <Plus />
              New lead
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
              Try clearing the search or selecting a different status.
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
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Bill</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Last touch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(l)}
                    className="cursor-pointer transition-colors hover:bg-secondary/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">
                          {l.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{l.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {l.id} · {l.city}, {l.state}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={statusMeta[l.status].tone} dot>
                        {statusMeta[l.status].label}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-semibold">{l.score}</span>
                        <Progress value={l.score} className="h-1.5 w-16" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium">${l.monthlyBill}/mo</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{l.source}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{l.owner}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{l.lastTouch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl font-extrabold">
                  {selected.name}
                </SheetTitle>
                <SheetDescription>
                  {selected.id} · {selected.city}, {selected.state} · {selected.source}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={statusMeta[selected.status].tone} dot>
                    {statusMeta[selected.status].label}
                  </StatusPill>
                  {selected.tags.map((t) => (
                    <StatusPill key={t}>{t}</StatusPill>
                  ))}
                </div>

                <div className="rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold">Qualification score</span>
                    <StatusPill tone={scoreTone(selected.score)}>{selected.score}/100</StatusPill>
                  </div>
                  <Progress value={selected.score} className="mt-3 h-2" />
                  <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    {[
                      ["Monthly bill", `$${selected.monthlyBill}`],
                      ["Homeowner", selected.homeowner ? "Yes" : "No"],
                      ["Home type", selected.homeType],
                      ["Roof", selected.roof],
                      ["Timeline", selected.timeline],
                      ["Owner", selected.owner],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary-soft p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <h3 className="text-sm font-bold">AI summary</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                    {selected.aiSummary}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button>Call now</Button>
                  <Button variant="outline">Book appointment</Button>
                  <Button variant="outline">Send proposal</Button>
                  <Button variant="outline">Enroll in nurture</Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
