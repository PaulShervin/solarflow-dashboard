import { createFileRoute } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill, toneForText } from "@/components/common/StatusPill";
import { proposals } from "@/data/mock";

export const Route = createFileRoute("/admin/proposals")({
  component: ProposalsPage,
});

function ProposalsPage() {
  const total = proposals.reduce((s, p) => s + p.value, 0);
  const signed = proposals.filter((p) => p.status === "Signed").length;

  return (
    <>
      <PageHeader
        title="Proposals"
        description={`${proposals.length} proposals · $${total.toLocaleString()} pipeline value`}
        actions={
          <Button>
            <FilePlus2 />
            New proposal
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Open pipeline", `$${total.toLocaleString()}`],
          ["Signed", `${signed} of ${proposals.length}`],
          ["Avg. system size", "8.6 kW"],
          ["Avg. days to sign", "6.2"],
        ].map(([k, v]) => (
          <div key={k} className="surface-card p-5">
            <p className="text-xs font-semibold text-muted-foreground">{k}</p>
            <p className="mt-2 font-display text-2xl font-extrabold">{v}</p>
          </div>
        ))}
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-xs font-semibold text-muted-foreground">
              <th className="px-5 py-3">Proposal</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">System</th>
              <th className="px-5 py-3">Value</th>
              <th className="px-5 py-3">Sent</th>
              <th className="px-5 py-3">Views</th>
              <th className="px-5 py-3">Rep</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {proposals.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-secondary/50">
                <td className="px-5 py-3.5 font-semibold">{p.id}</td>
                <td className="px-5 py-3.5">{p.customer}</td>
                <td className="px-5 py-3.5 text-muted-foreground">
                  {p.systemKw} kW{p.battery ? " + battery" : ""}
                </td>
                <td className="px-5 py-3.5 font-semibold">${p.value.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{p.sent}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{p.views}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{p.rep}</td>
                <td className="px-5 py-3.5">
                  <StatusPill tone={toneForText(p.status)}>{p.status}</StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
