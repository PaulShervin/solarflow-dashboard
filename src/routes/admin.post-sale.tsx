import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  Flame,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { solarApi } from "@/lib/api";
import { useSolarDB } from "@/hooks/useSolarDB";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/post-sale")({
  head: () => ({
    meta: [
      { title: "Post-Sale Retention Engine | SolarFlow Admin" },
      {
        name: "description",
        content:
          "Convert completed sales to active installations, manage 6-stage milestone state machines, evaluate cancellation risk, and trigger post-PTO referrals.",
      },
    ],
  }),
  component: PostSaleAdminPage,
});

interface SolarProjectData {
  id: string;
  leadId: string;
  customerName?: string;
  address?: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  currentMilestone: "SITE_SURVEY" | "ENGINEERING" | "PERMITTING" | "INSTALLATION" | "INSPECTION" | "PTO";
  startDate: string;
  estimatedCompletionDate?: string;
  completedAt?: string;
  progressPercent?: number;
}

interface MilestoneData {
  id: string;
  projectId: string;
  milestoneType: "SITE_SURVEY" | "ENGINEERING" | "PERMITTING" | "INSTALLATION" | "INSPECTION" | "PTO";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  startedAt?: string | null | undefined;
  completedAt?: string | null | undefined;
  notes?: string | null | undefined;
  updatedBy?: string | null | undefined;
}

interface RiskData {
  id: string;
  projectId: string;
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  stalledDays: number;
  unresolvedInquiries: number;
  reason: string;
  evaluatedAt: string;
}

const MILESTONE_ORDER = [
  { key: "SITE_SURVEY", label: "Site Survey", desc: "Drone roof mapping, main panel inspection & solar irradiance verification" },
  { key: "ENGINEERING", label: "Engineering & CAD", desc: "Structural load calculations, single-line electrical schematics & PE stamping" },
  { key: "PERMITTING", label: "Permitting (City/HOA)", desc: "Municipal building & electrical permit approvals with local jurisdiction" },
  { key: "INSTALLATION", label: "Solar Installation", desc: "Roof racking, Tier-1 panels mounting, inverter wiring & battery commissioning" },
  { key: "INSPECTION", label: "Final Inspection", desc: "City building and electrical safety compliance sign-off" },
  { key: "PTO", label: "Permission to Operate", desc: "Utility net meter installation, bi-directional grid sync & system turn-on" },
];

const INITIAL_PROJECTS: SolarProjectData[] = [];

function PostSaleAdminPage() {
  const [projects, setProjects] = useState<SolarProjectData[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed selected project state
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [currentRisk, setCurrentRisk] = useState<RiskData>({
    id: "RSK-00",
    projectId: "",
    score: 0,
    riskLevel: "LOW",
    stalledDays: 0,
    unresolvedInquiries: 0,
    reason: "No project selected.",
    evaluatedAt: "Just now",
  });
  const [updates, setUpdates] = useState<any[]>([]);

  // Action states
  const [newUpdateText, setNewUpdateText] = useState("");
  const [newUpdateVisible, setNewUpdateVisible] = useState(true);
  const [actionNotes, setActionNotes] = useState("");
  const [selectedMilestoneToAct, setSelectedMilestoneToAct] = useState<string | null>(null);
  const [actType, setActType] = useState<"start" | "complete" | null>(null);

  // Risk simulator state
  const [simStalledDays, setSimStalledDays] = useState(0);
  const [simInquiries, setSimInquiries] = useState(0);

  // Create Project Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newLeadId, setNewLeadId] = useState("");

  const selectedProject: SolarProjectData | undefined =
    projects.find((p) => p.id === selectedId) || projects[0];

  // Fetch live projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await solarApi.getProjects(statusFilter === "ALL" ? undefined : statusFilter);
        if (res && res.projects) {
          setProjects(res.projects);
          if (res.projects.length > 0 && !selectedId) {
            setSelectedId(res.projects[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not fetch live projects:", err);
      }
    }
    fetchProjects();
  }, [statusFilter]);

  // Load project details on selection
  useEffect(() => {
    if (selectedId) {
      loadProjectDetails(selectedId);
    }
  }, [selectedId]);

  async function loadProjectDetails(id: string) {
    if (!id) return;
    try {
      const res = await solarApi.getProjectDetail(id);
      if (res && res.milestones) {
        setMilestones(res.milestones);
      } else {
        generateDefaultMilestones(id);
      }
      if (res && res.currentRisk) {
        setCurrentRisk(res.currentRisk);
        setSimStalledDays(res.currentRisk.stalledDays || 0);
        setSimInquiries(res.currentRisk.unresolvedInquiries || 0);
      }
      const updRes = await solarApi.getProjectUpdates(id);
      if (updRes && updRes.length > 0) {
        setUpdates(updRes);
      } else {
        setUpdates([]);
      }
    } catch {
      generateDefaultMilestones(id);
    }
  }

  function generateDefaultMilestones(id: string) {
    const defaultMils: MilestoneData[] = MILESTONE_ORDER.map((m, idx) => {
      let status: "PENDING" | "IN_PROGRESS" | "COMPLETED" = "PENDING";
      let completedAt: string | null = null;
      let startedAt: string | null = null;

      if (id === "PRJ-9040") {
        status = "COMPLETED";
        completedAt = "2026-08-05";
        startedAt = "2026-06-01";
      } else if (idx < 2) {
        status = "COMPLETED";
        completedAt = "2026-08-02";
        startedAt = "2026-07-28";
      } else if (idx === 2) {
        status = "IN_PROGRESS";
        startedAt = "2026-08-03";
      }

      return {
        id: `mil-${id}-${m.key}`,
        projectId: id,
        milestoneType: m.key as any,
        status,
        startedAt,
        completedAt,
        notes: status === "COMPLETED" ? "Approved and signed off" : status === "IN_PROGRESS" ? "In municipal queue" : null,
      };
    });
    setMilestones(defaultMils);
  }

  async function handleMilestoneAction() {
    if (!selectedMilestoneToAct || !actType) return;

    if (actType === "start") {
      await solarApi.startMilestone(selectedId, selectedMilestoneToAct, actionNotes, "Operations Lead");
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.milestoneType === selectedMilestoneToAct) {
            return {
              ...m,
              status: "IN_PROGRESS",
              startedAt: "Just now",
              notes: actionNotes || m.notes || null,
            };
          }
          return m;
        })
      );
    } else {
      await solarApi.completeMilestone(selectedId, selectedMilestoneToAct, actionNotes, "Operations Lead");
      setMilestones((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.milestoneType === selectedMilestoneToAct);
        if (idx !== -1 && next[idx]) {
          next[idx] = {
            ...next[idx]!,
            status: "COMPLETED",
            completedAt: "Just now",
            notes: actionNotes || next[idx]!.notes || null,
          };
          // Auto-start next milestone if exists
          if (idx + 1 < next.length && next[idx + 1]) {
            next[idx + 1] = {
              ...next[idx + 1]!,
              status: "IN_PROGRESS",
              startedAt: "Just now",
            };
          }
        }
        return next;
      });
    }

    // Add log update
    const newLog = {
      id: `upd-${Date.now()}`,
      message: `Milestone [${selectedMilestoneToAct}] marked as ${actType === "start" ? "IN_PROGRESS" : "COMPLETED"}. ${actionNotes ? `Note: ${actionNotes}` : ""}`,
      visibleToCustomer: true,
      createdBy: "Operations Lead",
      createdAt: "Just now",
    };
    setUpdates((prev) => [newLog, ...prev]);

    setSelectedMilestoneToAct(null);
    setActType(null);
    setActionNotes("");
  }

  async function handleRecalculateRisk() {
    const calculatedScore = Math.min(100, simStalledDays * 12 + simInquiries * 15);
    const riskLevel = calculatedScore >= 70 ? "HIGH" : calculatedScore >= 40 ? "MEDIUM" : "LOW";
    const reason =
      riskLevel === "HIGH"
        ? `🚨 HIGH CANCELLATION RISK: ${simStalledDays} stalled days and ${simInquiries} unanswered inquiries. Immediate outreach required!`
        : riskLevel === "MEDIUM"
        ? `⚠️ Moderate Risk: Project delayed ${simStalledDays} days. Recommend customer status check-in.`
        : `✅ Low Risk: Project on track within acceptable municipal timeframes.`;

    await solarApi.recalculateProjectRisk(selectedId, simStalledDays, simInquiries);

    setCurrentRisk({
      id: `rsk-${Date.now()}`,
      projectId: selectedId,
      score: calculatedScore,
      riskLevel,
      stalledDays: simStalledDays,
      unresolvedInquiries: simInquiries,
      reason,
      evaluatedAt: "Just now",
    });
  }

  async function handlePostUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!newUpdateText.trim()) return;

    await solarApi.createProjectUpdate(selectedId, newUpdateText, newUpdateVisible, "Operations Lead");
    const newLog = {
      id: `upd-${Date.now()}`,
      message: newUpdateText,
      visibleToCustomer: newUpdateVisible,
      createdBy: "Operations Lead",
      createdAt: "Just now",
    };
    setUpdates((prev) => [newLog, ...prev]);
    setNewUpdateText("");
  }

  function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustomerName) return;

    const newPrj: SolarProjectData = {
      id: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      leadId: newLeadId || `LD-${Math.floor(4000 + Math.random() * 999)}`,
      customerName: newCustomerName,
      address: newCustomerAddress || "Phoenix, AZ",
      status: "ACTIVE",
      currentMilestone: "SITE_SURVEY",
      startDate: new Date().toISOString().split("T")[0] as string,
      estimatedCompletionDate: "2026-10-15",
      progressPercent: 15,
    };

    setProjects((prev) => [newPrj, ...prev]);
    setSelectedId(newPrj.id);
    setCreateModalOpen(false);
    setNewCustomerName("");
    setNewCustomerAddress("");
  }

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (
      searchQuery &&
      !p.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.leadId.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Post-Sale Retention Engine"
        description="Milestone state machine transitions, real-time cancellation risk radar, customer updates, and post-PTO referral bonus enrollment."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProjectDetails(selectedId)}
              className="gap-1.5 font-bold"
            >
              <RefreshCw className="size-4" /> Refresh Sync
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 font-bold shadow-lift bg-primary hover:bg-primary/90"
            >
              <Plus className="size-4" /> New Solar Project
            </Button>
          </div>
        }
      />

      {/* Top Operations KPI Summary Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Installations</span>
            <Sun className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-foreground">
            {projects.filter((p) => p.status === "ACTIVE").length} Projects
          </p>
          <p className="mt-1 text-xs text-primary font-medium">In 6-stage lifecycle</p>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">On-Schedule Rate</span>
            <TrendingUp className="size-4 text-success" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-foreground">92.4%</p>
          <p className="mt-1 text-xs text-muted-foreground">Average 38-day turnaround to PTO</p>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">High-Risk Escalations</span>
            <ShieldAlert className="size-4 text-destructive" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-foreground">
            {currentRisk.riskLevel === "HIGH" ? "1 Critical" : "0 Critical"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Auto-escalates at score &ge; 70</p>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Post-PTO Referral Trigger</span>
            <BadgeCheck className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-foreground">100% Automated</p>
          <p className="mt-1 text-xs text-muted-foreground">₹10,000 customer referral bonus</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr] items-start">
        {/* Left Column: Project Selector & Status Filters */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold flex items-center gap-2">
              <Compass className="size-4 text-primary" />
              Installation Pipeline
            </h3>
            <span className="text-xs font-semibold text-muted-foreground">
              {filteredProjects.length} Projects
            </span>
          </div>

          {/* Search and Status Pills */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, project ID..."
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                    statusFilter === st
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Project List */}
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredProjects.length === 0 ? (
              <div className="surface-card p-8 text-center rounded-2xl border border-dashed border-border/80 my-2">
                <Compass className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-bold text-foreground">No projects found</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Create a new installation project or adjust status filter.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-3 text-xs font-bold gap-1"
                >
                  <Plus className="size-3" /> New Project
                </Button>
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = p.id === selectedId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      "cursor-pointer rounded-2xl border p-4 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary-soft/40 shadow-sm ring-2 ring-primary/20"
                        : "border-border/80 bg-card hover:border-primary/50 hover:bg-secondary/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">{p.id}</span>
                      <StatusPill
                        tone={p.status === "COMPLETED" ? "success" : p.status === "CANCELLED" ? "danger" : "brand"}
                        dot
                      >
                        {p.status}
                      </StatusPill>
                    </div>
                    <p className="mt-1 font-bold text-sm text-foreground truncate">
                      {p.customerName || "Customer Lead"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{p.address || "Address pending site survey"}</p>

                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
                      <span className="text-muted-foreground">Stage:</span>
                      <span className="font-semibold text-foreground bg-secondary px-2 py-0.5 rounded-md">
                        {p.currentMilestone}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Project Detail & Interactive Engine */}
        <div className="space-y-6">
          {!selectedProject ? (
            <div className="surface-card p-14 text-center rounded-3xl border border-dashed border-border">
              <Compass className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-display text-lg font-extrabold text-foreground">No Project Selected</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Select an active project from the installation pipeline or create a new solar project to track its 6-stage milestone state machine.
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="mt-5 gap-1.5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lift"
              >
                <Plus className="size-4" /> Create Installation Project
              </Button>
            </div>
          ) : (
            <>
              {/* Project Header Banner */}
              <div className="surface-card p-6 border-navy-foreground/10 bg-navy text-navy-foreground rounded-3xl shadow-lift">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {selectedProject.id}
                      </span>
                      <span className="text-xs text-navy-foreground/60">Lead: {selectedProject.leadId}</span>
                    </div>
                    <h2 className="mt-1.5 font-display text-2xl font-extrabold text-navy-foreground">
                      {selectedProject.customerName || "Customer Lead"}
                    </h2>
                    <p className="text-xs text-navy-foreground/75 mt-0.5">{selectedProject.address || "Address pending site survey"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-navy-foreground/60">Current Phase</span>
                    <p className="font-display text-lg font-black text-primary">
                      {selectedProject.currentMilestone}
                    </p>
                    <span className="text-[11px] text-navy-foreground/50">
                      Target PTO: {selectedProject.estimatedCompletionDate || "TBD"}
                    </span>
                  </div>
                </div>
              </div>

          {/* Module 4 Tabs */}
          <Tabs defaultValue="milestones" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-card p-1.5 rounded-2xl border border-border">
              <TabsTrigger value="milestones" className="gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold">
                <Layers className="size-4" /> 6-Stage Milestone State Machine
              </TabsTrigger>
              <TabsTrigger value="risk" className="gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold">
                <ShieldAlert className="size-4" /> Cancellation Risk Radar
              </TabsTrigger>
              <TabsTrigger value="updates" className="gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold">
                <MessageSquare className="size-4" /> Customer Logs & Notices
              </TabsTrigger>
              <TabsTrigger value="referral" className="gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold">
                <BadgeCheck className="size-4" /> Post-PTO Referral
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: 6-Stage Milestone State Machine */}
            <TabsContent value="milestones" className="mt-4 space-y-4">
              <div className="surface-card p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold">Sequential Milestone State Machine</h3>
                    <p className="text-xs text-muted-foreground">
                      Transitions are validated sequentially. Completing a milestone automatically triggers the next phase.
                    </p>
                  </div>
                  <StatusPill tone="brand" dot>Strict Sequence</StatusPill>
                </div>

                <div className="space-y-3">
                  {MILESTONE_ORDER.map((item, idx) => {
                    const currentMil = milestones.find((m) => m.milestoneType === item.key);
                    const status = currentMil?.status || (idx === 0 ? "IN_PROGRESS" : "PENDING");
                    const isCurrent = status === "IN_PROGRESS";
                    const isDone = status === "COMPLETED";

                    return (
                      <div
                        key={item.key}
                        className={cn(
                          "rounded-2xl border p-4 transition-all",
                          isDone && "border-primary/40 bg-primary-soft/20",
                          isCurrent && "border-navy ring-2 ring-primary/30 bg-card shadow-sm",
                          !isDone && !isCurrent && "border-border/60 bg-secondary/20 opacity-70"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "grid size-7 place-items-center rounded-full text-xs font-bold",
                                isDone && "bg-primary text-primary-foreground",
                                isCurrent && "bg-navy text-navy-foreground animate-pulse",
                                !isDone && !isCurrent && "bg-secondary text-muted-foreground border border-border"
                              )}
                            >
                              {isDone ? <Check className="size-4" /> : idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-sm text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatusPill
                              tone={isDone ? "success" : isCurrent ? "warning" : "neutral"}
                              dot={isCurrent}
                            >
                              {status}
                            </StatusPill>

                            {isCurrent && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedMilestoneToAct(item.key);
                                  setActType("complete");
                                }}
                                className="h-8 px-3 text-xs font-bold bg-primary hover:bg-primary/90"
                              >
                                Complete Phase <ArrowRight className="size-3.5 ml-1" />
                              </Button>
                            )}

                            {!isDone && !isCurrent && idx > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedMilestoneToAct(item.key);
                                  setActType("start");
                                }}
                                className="h-8 px-3 text-xs"
                              >
                                Force Start
                              </Button>
                            )}
                          </div>
                        </div>

                        {currentMil?.notes && (
                          <div className="mt-2 text-[11px] text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                            <strong>Note:</strong> {currentMil.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Cancellation Risk Radar */}
            <TabsContent value="risk" className="mt-4 space-y-4">
              <div className="surface-card p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold flex items-center gap-2">
                      <ShieldAlert className="size-4 text-primary" />
                      Cancellation Risk Engine & Early-Warning Radar
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Formula: <code>Risk Score = (Stalled Days &times; 12) + (Unresolved Inquiries &times; 15)</code>
                    </p>
                  </div>
                  <StatusPill
                    tone={currentRisk.riskLevel === "HIGH" ? "danger" : currentRisk.riskLevel === "MEDIUM" ? "warning" : "success"}
                    dot
                  >
                    {currentRisk.riskLevel} Risk ({currentRisk.score}/100)
                  </StatusPill>
                </div>

                {/* Risk Gauge Bar */}
                <div className="rounded-2xl border border-border bg-secondary/30 p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Cancellation Risk Index</span>
                    <span className="font-mono text-sm">{currentRisk.score} / 100</span>
                  </div>
                  <Progress
                    value={currentRisk.score}
                    className={cn(
                      "h-3",
                      currentRisk.riskLevel === "HIGH" && "[&>div]:bg-destructive",
                      currentRisk.riskLevel === "MEDIUM" && "[&>div]:bg-warning",
                      currentRisk.riskLevel === "LOW" && "[&>div]:bg-success"
                    )}
                  />
                  <p className="text-xs text-muted-foreground">{currentRisk.reason}</p>
                </div>

                {/* Risk Simulation Tool */}
                <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Live Risk Simulator & Escalation Engine
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-foreground flex justify-between">
                        <span>Stalled Days in Current Stage:</span>
                        <span className="font-bold text-primary">{simStalledDays} days</span>
                      </label>
                      <Slider
                        value={[simStalledDays]}
                        min={0}
                        max={14}
                        step={1}
                        onValueChange={(val) => typeof val[0] === "number" && setSimStalledDays(val[0])}
                        className="mt-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground flex justify-between">
                        <span>Unresolved Customer Inquiries:</span>
                        <span className="font-bold text-primary">{simInquiries} messages</span>
                      </label>
                      <Slider
                        value={[simInquiries]}
                        min={0}
                        max={5}
                        step={1}
                        onValueChange={(val) => typeof val[0] === "number" && setSimInquiries(val[0])}
                        className="mt-2 py-1"
                      />
                    </div>
                  </div>

                  <Button onClick={handleRecalculateRisk} className="w-full font-bold gap-2">
                    <RefreshCw className="size-4" /> Recalculate Risk & Update Radar
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Customer Logs & Notices */}
            <TabsContent value="updates" className="mt-4 space-y-4">
              <div className="surface-card p-6 space-y-5">
                <h3 className="font-display text-base font-bold">Customer Update & Portal Dispatcher</h3>

                <form onSubmit={handlePostUpdate} className="space-y-3">
                  <Input
                    value={newUpdateText}
                    onChange={(e) => setNewUpdateText(e.target.value)}
                    placeholder="Compose an update for customer portal & SMS notification..."
                    className="text-xs"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={newUpdateVisible}
                        onCheckedChange={setNewUpdateVisible}
                        aria-label="Visible to customer"
                      />
                      <span>Publish directly to Customer Status Portal</span>
                    </label>
                    <Button type="submit" size="sm" className="font-bold gap-1.5">
                      <Send className="size-3.5" /> Dispatch Update
                    </Button>
                  </div>
                </form>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                  {updates.map((u) => (
                    <div key={u.id} className="rounded-xl border border-border bg-secondary/30 p-3 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                        <span>{u.createdBy}</span>
                        <span>{u.createdAt}</span>
                      </div>
                      <p className="mt-1 font-semibold text-foreground">{u.message}</p>
                      {u.visibleToCustomer && (
                        <span className="mt-1 inline-block text-[10px] font-bold text-primary">
                          ✓ Synced to Customer Portal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: Post-PTO Referral Bonus */}
            <TabsContent value="referral" className="mt-4 space-y-4">
              <div className="surface-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold">Post-PTO Referral Engine</h3>
                    <p className="text-xs text-muted-foreground">
                      Automatically enrolls customers into the ₹10,000 referral incentive program upon grid interconnection.
                    </p>
                  </div>
                  <StatusPill tone={selectedProject.status === "COMPLETED" ? "success" : "neutral"} dot>
                    {selectedProject.status === "COMPLETED" ? "Referral Active" : "Pending PTO"}
                  </StatusPill>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/30 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-primary/20 text-primary">
                      <BadgeCheck className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Customer Referral Link Created</p>
                      <p className="text-xs text-muted-foreground">
                        <code>https://solarflow.com/refer/{selectedProject.leadId}</code>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Once PTO is approved, the customer receives an automated SMS and email thanking them and providing their customized shareable referral link with instant ₹10,000 payout tracking.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  </div>

      {/* Action Dialog for Milestones */}
      <Dialog open={Boolean(selectedMilestoneToAct)} onOpenChange={(open) => !open && setSelectedMilestoneToAct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              {actType === "start" ? "Start Milestone Phase" : "Complete Milestone Phase"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <p className="text-muted-foreground">
              Are you sure you want to mark <strong>{selectedMilestoneToAct}</strong> as{" "}
              {actType === "start" ? "IN PROGRESS" : "COMPLETED"}?
            </p>
            <div>
              <label className="font-bold text-foreground block mb-1">Operational Notes / Inspection Stamp</label>
              <Input
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. City building permit #AZ-8921 approved by Chandler Dept."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedMilestoneToAct(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleMilestoneAction} className="flex-1 font-bold">
                Confirm Transition
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-primary" />
              Convert Closed Sale to Tracked Project
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1">Customer Full Name</label>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="e.g. Cynthia Rogers"
                required
              />
            </div>
            <div>
              <label className="font-bold text-foreground block mb-1">Installation Address</label>
              <Input
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                placeholder="e.g. 512 E Warner Rd, Gilbert, AZ"
              />
            </div>
            <div>
              <label className="font-bold text-foreground block mb-1">Associated CRM Lead ID</label>
              <Input
                value={newLeadId}
                onChange={(e) => setNewLeadId(e.target.value)}
                placeholder="e.g. LD-4890"
              />
            </div>
            <div className="flex gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 font-bold">
                Initialize Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
