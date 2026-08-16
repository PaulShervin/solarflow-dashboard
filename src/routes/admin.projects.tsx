import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sun,
  User,
  Wrench,
} from "lucide-react";
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
import { solarApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/projects")({
  component: ProjectsPage,
});

interface SolarProject {
  id: string;
  leadId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  currentMilestone: "SITE_SURVEY" | "ENGINEERING" | "PERMITTING" | "INSTALLATION" | "INSPECTION" | "PTO";
  startDate: string;
  estimatedCompletionDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectMilestone {
  id: string;
  projectId: string;
  milestoneType: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
}

interface CancellationRisk {
  id: string;
  projectId: string;
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  stalledDays: number;
  unresolvedInquiries: number;
  reason: string;
  evaluatedAt: string;
}

interface ProjectUpdate {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  message: string;
  visibleToCustomer: boolean;
  createdBy: string;
  createdAt: string;
}

const MILESTONE_ORDER = [
  "SITE_SURVEY",
  "ENGINEERING",
  "PERMITTING",
  "INSTALLATION",
  "INSPECTION",
  "PTO",
];

const MILESTONE_LABELS: Record<string, string> = {
  SITE_SURVEY: "Site Survey",
  ENGINEERING: "Engineering & Design",
  PERMITTING: "City Permitting",
  INSTALLATION: "Solar Panel Installation",
  INSPECTION: "County Inspection",
  PTO: "Permission to Operate (PTO)",
};

function riskTone(level: "LOW" | "MEDIUM" | "HIGH") {
  return level === "HIGH" ? "danger" : level === "MEDIUM" ? "warning" : "success";
}

function ProjectsPage() {
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected project modal/sheet state
  const [selectedProject, setSelectedProject] = useState<SolarProject | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [risk, setRisk] = useState<CancellationRisk | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [newUpdateMessage, setNewUpdateMessage] = useState("");

  // New Project Dialog
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newLeadId, setNewLeadId] = useState("LEAD-101");
  const [createLoading, setCreateLoading] = useState(false);

  async function loadProjects() {
    setLoading(true);
    const data = await solarApi.getAdminProjects(statusFilter === "all" ? undefined : statusFilter);
    setProjects(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  async function handleSelectProject(project: SolarProject) {
    setSelectedProject(project);
    setActionLoading(true);
    const [mList, rData, uList] = await Promise.all([
      solarApi.getAdminProjectMilestones(project.id),
      solarApi.getAdminProjectRisk(project.id),
      solarApi.getAdminProjectUpdates(project.id),
    ]);
    setMilestones(mList || []);
    setRisk(rData || null);
    setUpdates(uList || []);
    setActionLoading(false);
  }

  async function handleCompleteMilestone(milestoneType: string) {
    if (!selectedProject) return;
    setActionLoading(true);
    await solarApi.completeAdminMilestone(selectedProject.id, milestoneType, "Completed via Admin Operations Console");
    
    // Refresh project detail
    const updatedProj = await solarApi.getAdminProject(selectedProject.id);
    if (updatedProj?.project) {
      setSelectedProject(updatedProj.project);
    }
    const [mList, rData, uList] = await Promise.all([
      solarApi.getAdminProjectMilestones(selectedProject.id),
      solarApi.getAdminProjectRisk(selectedProject.id),
      solarApi.getAdminProjectUpdates(selectedProject.id),
    ]);
    setMilestones(mList || []);
    setRisk(rData || null);
    setUpdates(uList || []);
    setActionLoading(false);
    loadProjects();
  }

  async function handleRecalculateRisk() {
    if (!selectedProject) return;
    setActionLoading(true);
    await solarApi.recalculateAdminProjectRisk(selectedProject.id);
    const rData = await solarApi.getAdminProjectRisk(selectedProject.id);
    setRisk(rData || null);
    setActionLoading(false);
  }

  async function handleAddUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject || !newUpdateMessage.trim()) return;
    setActionLoading(true);
    await solarApi.createAdminProjectUpdate(selectedProject.id, newUpdateMessage, true);
    setNewUpdateMessage("");
    const uList = await solarApi.getAdminProjectUpdates(selectedProject.id);
    setUpdates(uList || []);
    setActionLoading(false);
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: newLeadId }),
    });
    if (res.ok) {
      const data = await res.json();
      setCreateModalOpen(false);
      loadProjects();
      if (data.project) {
        handleSelectProject(data.project);
      }
    }
    setCreateLoading(false);
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.leadId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.currentMilestone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Post-Sale Retention Engine (Module 4)"
        description={`${projects.length} post-sale installation projects · 6-Stage state machine & automated cancellation risk tracking`}
        actions={
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="size-4" />
            New Post-Sale Project
          </Button>
        }
      />

      <div className="surface-card overflow-hidden">
        {/* Controls header */}
        <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="relative min-w-0 lg:max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Project ID or Lead ID..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["all", "ACTIVE", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase transition-colors",
                  statusFilter === st
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Table */}
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground font-semibold">
            Loading post-sale solar projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-14 text-center">
            <p className="font-display text-lg font-bold">No post-sale projects found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Projects are automatically created when a lead reaches SALE_COMPLETED stage or manually created above.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setCreateModalOpen(true)}
            >
              Initialize First Project
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left text-xs font-semibold text-muted-foreground">
                  <th className="px-5 py-3">Project ID</th>
                  <th className="px-5 py-3">Lead ID</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Current Milestone</th>
                  <th className="px-5 py-3">Start Date</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleSelectProject(p)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-secondary/50",
                      selectedProject?.id === p.id && "bg-primary-soft/50"
                    )}
                  >
                    <td className="px-5 py-3.5 font-bold font-mono text-xs">{p.id}</td>
                    <td className="px-5 py-3.5 font-medium">{p.leadId}</td>
                    <td className="px-5 py-3.5">
                      <StatusPill
                        tone={p.status === "COMPLETED" ? "success" : p.status === "CANCELLED" ? "danger" : "brand"}
                      >
                        {p.status}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md border border-border bg-secondary/60 px-2 py-1 text-xs font-semibold">
                        {MILESTONE_LABELS[p.currentMilestone] || p.currentMilestone}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(p.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <Button size="sm" variant="ghost" className="text-xs">
                        Inspect →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sun className="size-5 text-primary" />
              Initialize Solar Project
            </DialogTitle>
            <DialogDescription>
              Create a new post-sale retention project for a customer lead.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Lead ID</label>
              <Input
                value={newLeadId}
                onChange={(e) => setNewLeadId(e.target.value)}
                placeholder="e.g. LEAD-101"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? "Creating..." : "Initialize Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Slide-out Sheet */}
      <Sheet open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        {selectedProject ? (
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <div className="flex items-center justify-between gap-3">
                <SheetTitle className="font-display text-xl font-extrabold font-mono">
                  {selectedProject.id}
                </SheetTitle>
                <StatusPill
                  tone={selectedProject.status === "COMPLETED" ? "success" : "brand"}
                >
                  {selectedProject.status}
                </StatusPill>
              </div>
              <SheetDescription>
                Lead: {selectedProject.leadId} · Started: {new Date(selectedProject.startDate).toLocaleDateString()}
              </SheetDescription>
            </SheetHeader>

            {actionLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-semibold">
                Syncing project lifecycle & risk evaluation...
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* Risk Evaluation Card */}
                {risk ? (
                  <div
                    className={cn(
                      "rounded-xl border p-4",
                      risk.riskLevel === "HIGH"
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : risk.riskLevel === "MEDIUM"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-extrabold">
                        {risk.riskLevel === "HIGH" ? (
                          <ShieldAlert className="size-5" />
                        ) : (
                          <ShieldCheck className="size-5" />
                        )}
                        Cancellation Risk: {risk.riskLevel} ({risk.score}/100)
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRecalculateRisk}
                        className="text-xs h-7"
                      >
                        <RefreshCw className="size-3 mr-1" />
                        Recalculate
                      </Button>
                    </div>
                    <Progress value={risk.score} className="mt-3 h-1.5" />
                    <p className="mt-2 text-xs leading-relaxed opacity-90">{risk.reason}</p>
                  </div>
                ) : null}

                {/* Milestone Stepper */}
                <div className="surface-card p-5 space-y-4">
                  <h3 className="text-sm font-extrabold flex items-center justify-between">
                    <span>6-Stage Installation Milestones</span>
                    <span className="text-xs font-semibold text-primary">
                      Current: {MILESTONE_LABELS[selectedProject.currentMilestone]}
                    </span>
                  </h3>

                  <ol className="space-y-4">
                    {MILESTONE_ORDER.map((mType, idx) => {
                      const mData = milestones.find((m) => m.milestoneType === mType);
                      const isCurrent = selectedProject.currentMilestone === mType;
                      const isDone = mData?.status === "COMPLETED";

                      return (
                        <li
                          key={mType}
                          className="flex items-start justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold mt-0.5",
                                isDone
                                  ? "bg-emerald-500 text-white"
                                  : isCurrent
                                  ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                                  : "bg-secondary text-muted-foreground"
                              )}
                            >
                              {isDone ? <CheckCircle2 className="size-3.5" /> : idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold">{MILESTONE_LABELS[mType]}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Status: {mData?.status || "PENDING"}
                                {mData?.completedAt ? ` · Done ${new Date(mData.completedAt).toLocaleDateString()}` : ""}
                              </p>
                            </div>
                          </div>

                          {selectedProject.status === "ACTIVE" && isCurrent ? (
                            <Button
                              size="sm"
                              onClick={() => handleCompleteMilestone(mType)}
                              className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Mark Complete ✓
                            </Button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </div>

                {/* Customer Updates & Log */}
                <div className="surface-card p-5 space-y-4">
                  <h3 className="text-sm font-extrabold">Customer Portal Timeline & Updates</h3>

                  <form onSubmit={handleAddUpdate} className="space-y-2">
                    <Input
                      value={newUpdateMessage}
                      onChange={(e) => setNewUpdateMessage(e.target.value)}
                      placeholder="Add customer-visible update message..."
                      className="text-xs"
                    />
                    <div className="flex justify-end">
                      <Button size="sm" type="submit" disabled={!newUpdateMessage.trim()}>
                        Post Update
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {updates.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No updates logged yet.</p>
                    ) : (
                      updates.map((u) => (
                        <div key={u.id} className="rounded-lg border border-border bg-secondary/30 p-3 text-xs">
                          <p className="font-semibold text-foreground">{u.message}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>By: {u.createdBy}</span>
                            <span>{new Date(u.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        ) : null}
      </Sheet>
    </>
  );
}
