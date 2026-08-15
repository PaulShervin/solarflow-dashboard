import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill, toneForText } from "@/components/common/StatusPill";
import { customers, type Customer } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const [active, setActive] = useState<Customer>(customers[0]!);

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${customers.length} active projects · retention and referral focus`}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="surface-card overflow-hidden">
          <ul className="divide-y divide-border">
            {customers.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActive(c)}
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/50",
                    c.id === active.id && "bg-primary-soft",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.address}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold">
                      ${c.contractValue.toLocaleString()}
                    </span>
                    <StatusPill tone={toneForText(c.stage)}>{c.stage}</StatusPill>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="surface-card min-w-0 self-start p-6">
          <h2 className="font-display text-lg font-extrabold">{active.name}</h2>
          <p className="text-sm text-muted-foreground">{active.id}</p>
          <div className="mt-4 flex gap-0.5 text-primary">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn("size-4", i < active.csat && "fill-current")} />
            ))}
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            {[
              ["Email", active.email],
              ["Phone", active.phone],
              ["System", `${active.systemKw} kW${active.battery ? " + battery" : ""}`],
              ["Contract value", `$${active.contractValue.toLocaleString()}`],
              ["Stage", active.stage],
              ["Install date", active.installDate],
              ["Referrals", `${active.referrals}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-border pb-2.5 last:border-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="min-w-0 truncate font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 grid gap-2">
            <Button>Message customer</Button>
            <Button variant="outline">Request referral</Button>
          </div>
        </aside>
      </div>
    </>
  );
}
