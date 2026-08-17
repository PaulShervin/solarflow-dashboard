import { useState } from "react";
import { createFileRoute } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill, toneForText } from "@/components/common/StatusPill";
import { useSolarDB } from "@/hooks/useSolarDB";
import { solarApi } from "@/lib/api";
import type { Proposal } from "@/data/mock";
import { formatINR } from "@/lib/formatCurrency";
import { FilePlus2, Eye, Printer, FileCheck } from "lucide-react";

export const Route = createFileRoute("/admin/proposals")({
  component: ProposalsPage,
});

function ProposalsPage() {
  const { proposals } = useSolarDB();
  const [selectedProp, setSelectedProp] = useState<Proposal | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form state (in INR)
  const [customerName, setCustomerName] = useState("");
  const [systemKw, setSystemKw] = useState(5.2);
  const [includeBattery, setIncludeBattery] = useState(true);
  const [propValue, setPropValue] = useState(285000);
  const [repName, setRepName] = useState("Dana Ruiz");
  const [submitting, setSubmitting] = useState(false);

  const total = proposals.reduce((s, p) => s + p.value, 0);
  const signed = proposals.filter((p) => p.status === "Signed").length;

  async function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) return;
    setSubmitting(true);
    try {
      const created = await solarApi.createProposal({
        customer: customerName.trim(),
        systemKw: Number(systemKw),
        battery: includeBattery,
        value: Number(propValue),
        sent: "Just now",
        rep: repName || "Dana Ruiz",
        status: "Sent",
      });
      setCreateModalOpen(false);
      setSelectedProp(created);
      setCustomerName("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Same-Day Proposals & Pre-Design PDF Engine"
        description={`${proposals.length} total proposals · ${formatINR(total)} total pipeline value`}
        actions={
          <Button onClick={() => setCreateModalOpen(true)}>
            <FilePlus2 />
            Generate New Proposal
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Open pipeline", formatINR(total)],
          ["Signed", `${signed} of ${proposals.length}`],
          ["Avg. system size", "5.2 kW"],
          ["Turnaround Time", "< 10 minutes"],
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
              <th className="px-5 py-3 text-right">Action</th>
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
                <td className="px-5 py-3.5 font-semibold">{formatINR(p.value)}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{p.sent}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{p.views}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{p.rep}</td>
                <td className="px-5 py-3.5">
                  <StatusPill tone={toneForText(p.status)}>{p.status}</StatusPill>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedProp(p)} className="gap-1 text-xs">
                    <Eye className="size-3.5 text-primary" />
                    View PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedProp} onOpenChange={(o) => !o && setSelectedProp(null)}>
        {selectedProp ? (
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
                  <FileCheck className="size-5 text-primary" />
                  Proposal Document #{selectedProp.id}
                </DialogTitle>
                <StatusPill tone={toneForText(selectedProp.status)}>{selectedProp.status}</StatusPill>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-2 text-sm">
              <div className="rounded-xl border border-navy/20 bg-navy text-navy-foreground p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display text-2xl font-black text-white">SolarFlow</h3>
                    <p className="text-xs text-navy-foreground/70">Pre-Design Proposal & Contract Quote</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">Customer: {selectedProp.customer}</p>
                    <p className="text-navy-foreground/70">Sales Rep: {selectedProp.rep}</p>
                    <p className="text-navy-foreground/70">Sent: {selectedProp.sent}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center rounded-lg bg-navy-muted/50 p-3">
                  <div>
                    <span className="block text-[10px] text-navy-foreground/70">System Size</span>
                    <span className="font-extrabold text-base text-primary">{selectedProp.systemKw} kW</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-navy-foreground/70">Battery Backup</span>
                    <span className="font-extrabold text-base text-white">{selectedProp.battery ? "10 kWh Included" : "Standard Grid"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-navy-foreground/70">Quote Investment</span>
                    <span className="font-extrabold text-base text-emerald-400">{formatINR(selectedProp.value)}</span>
                  </div>
                </div>
              </div>

              <div className="surface-card p-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-border pb-2 font-semibold text-muted-foreground">
                  <span>Component / Service</span>
                  <span>Price</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{selectedProp.systemKw} kW Tier-1 Monocrystalline Solar Array</span>
                  <span className="font-medium">{formatINR(selectedProp.systemKw * 35000)}</span>
                </div>
                {selectedProp.battery ? (
                  <div className="flex justify-between py-1">
                    <span>10 kWh Lithium Ion Battery Storage Unit</span>
                    <span className="font-medium">{formatINR(180000)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between py-1 text-emerald-600 font-semibold">
                  <span>Estimated PM Surya Ghar Subsidy Offset</span>
                  <span>-{formatINR(Math.min(78000, selectedProp.value * 0.3))}</span>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => window.print()} className="gap-2">
                  <Printer className="size-4" />
                  Print / Download PDF
                </Button>
                <Button onClick={() => setSelectedProp(null)}>Close Viewer</Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      {/* Create Proposal Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePlus2 className="size-5 text-primary" />
              Generate Same-Day Pre-Design Proposal
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProposal} className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1">Customer Name</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rachel Adams"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-foreground block mb-1">System Capacity (kW)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={systemKw}
                  onChange={(e) => setSystemKw(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="font-bold text-foreground block mb-1">Total System Value ($)</label>
                <Input
                  type="number"
                  value={propValue}
                  onChange={(e) => setPropValue(Number(e.target.value))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-foreground block mb-1">Assigned Sales Consultant</label>
              <Input
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                placeholder="e.g. Dana Ruiz"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3">
              <div>
                <p className="font-bold text-foreground">Tesla Powerwall Battery</p>
                <p className="text-[11px] text-muted-foreground">Include 13.5 kWh battery backup storage</p>
              </div>
              <Switch checked={includeBattery} onCheckedChange={setIncludeBattery} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 font-bold">
                {submitting ? "Generating..." : "Generate Proposal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
