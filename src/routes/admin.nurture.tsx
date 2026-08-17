import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Flame,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Zap,
  Send,
  Sliders,
  MessageSquare,
  FileText,
  Activity,
  Layers,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { useSolarDB } from "@/hooks/useSolarDB";
import { solarApi } from "@/lib/api";

export const Route = createFileRoute("/admin/nurture")({
  component: NurturePage,
});

function NurturePage() {
  const { leads } = useSolarDB();
  const [activeTab, setActiveTab] = useState<"workflows" | "inspector" | "templates" | "simulator">("workflows");

  // Backend state
  const [analytics, setAnalytics] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Inspector state
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || "");
  const [leadNurtureData, setLeadNurtureData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Trigger evaluation results
  const [runningRules, setRunningRules] = useState(false);
  const [triggerResults, setTriggerResults] = useState<{ executedCount: number; logs: string[] } | null>(null);

  // Simulator state
  const [simPhone, setSimPhone] = useState("");
  const [simBody, setSimBody] = useState("");
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  // Active workflow selection
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("WF-PROPOSAL-FOLLOWUP");

  // Load initial backend data
  useEffect(() => {
    loadBackendData();
  }, []);

  useEffect(() => {
    if (selectedLeadId) {
      loadLeadNurture(selectedLeadId);
    }
  }, [selectedLeadId]);

  async function loadBackendData() {
    setLoading(true);
    try {
      const [anData, wfData, tplData, msgData] = await Promise.all([
        solarApi.getNurtureAnalytics(),
        solarApi.getNurtureWorkflows(),
        solarApi.getNurtureTemplates(),
        solarApi.getNurtureMessages(),
      ]);
      if (anData) setAnalytics(anData);
      if (wfData) setWorkflows(wfData);
      if (tplData) setTemplates(tplData);
      if (msgData) setMessages(msgData);
    } catch (err) {
      console.error("Error loading nurture data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadLeadNurture(id: string) {
    try {
      const res = await solarApi.getLeadNurture(id);
      setLeadNurtureData(res);
    } catch (err) {
      console.error(`Error loading nurture data for lead ${id}:`, err);
    }
  }

  async function handleExecuteTriggerCheck() {
    setRunningRules(true);
    try {
      const res = await solarApi.triggerNurtureRulesCheck();
      setTriggerResults(res);
      await loadBackendData();
      if (selectedLeadId) loadLeadNurture(selectedLeadId);
    } finally {
      setRunningRules(false);
    }
  }

  async function handleEnrollLead(wfId: string) {
    setActionLoading(true);
    try {
      await solarApi.enrollLeadInNurture(selectedLeadId, wfId);
      await loadLeadNurture(selectedLeadId);
      await loadBackendData();
    } catch (err: any) {
      alert(err.message || "Failed to enroll lead");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePauseEnrollment(enrId: string) {
    setActionLoading(true);
    try {
      await solarApi.pauseLeadNurture(selectedLeadId, enrId);
      await loadLeadNurture(selectedLeadId);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResumeEnrollment(enrId: string) {
    setActionLoading(true);
    try {
      await solarApi.resumeLeadNurture(selectedLeadId, enrId);
      await loadLeadNurture(selectedLeadId);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelEnrollment(enrId: string) {
    setActionLoading(true);
    try {
      await solarApi.cancelLeadNurture(selectedLeadId, enrId);
      await loadLeadNurture(selectedLeadId);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSimulateSms() {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await solarApi.simulateSmsWebhook(simPhone, simBody);
      setSimResult(res);
      await loadBackendData();
      if (selectedLeadId) loadLeadNurture(selectedLeadId);
    } catch (err: any) {
      setSimResult({ error: err.message });
    } finally {
      setSimulating(false);
    }
  }

  const activeWf = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];

  return (
    <>
      <PageHeader
        title="Contextual Nurture Engine (Module 03 Backend)"
        description="Stage-aware drip sequences, factual variable interpolation, opt-out enforcement & sales rep overrides"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadBackendData} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Backend
            </Button>
            <Button size="sm" onClick={handleExecuteTriggerCheck} disabled={runningRules}>
              <Zap className="size-4" />
              {runningRules ? "Evaluating..." : "Run Trigger Check"}
            </Button>
          </div>
        }
      />

      {/* Analytics KPI Bar */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Workflows</span>
            <Layers className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-black">{analytics?.totalWorkflows ?? workflows.length ?? 4}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">Stage-Tied Sequences</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Active Enrollments</span>
            <Activity className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-black">{analytics?.activeEnrollments ?? 3}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">In active drip flow</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Sent Messages</span>
            <MessageSquare className="size-4 text-blue-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-black">{analytics?.sentMessages ?? messages.length ?? 12}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">{analytics?.deliveryRate ?? 98.4}% Delivery</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Opt-Out Rate</span>
            <ShieldAlert className="size-4 text-rose-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-black">{analytics?.optOutRate ?? 0.8}%</p>
          <p className="mt-1 text-[11px] text-rose-600 font-medium">Strict STOP Guardrail</p>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Re-engaged Leads</span>
            <Sparkles className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-black">{analytics?.reEngagedLeads ?? 5}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">Replied / Scheduled</p>
        </div>
      </div>

      {triggerResults && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center justify-between font-bold text-sm mb-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Module 03 Trigger Rules Evaluated ({triggerResults.executedCount} Touchpoints Queued)
            </span>
            <button onClick={() => setTriggerResults(null)} className="text-muted-foreground hover:underline">
              Dismiss
            </button>
          </div>
          <ul className="space-y-1 font-mono text-[11px]">
            {triggerResults.logs?.slice(0, 4).map((log, i) => (
              <li key={i}>• {log}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="mb-6 flex border-b border-border gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("workflows")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "workflows"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="size-4" />
          Module 03 Workflows ({workflows.length})
        </button>

        <button
          onClick={() => setActiveTab("inspector")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "inspector"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="size-4" />
          Lead Nurture Inspector & Overrides
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "templates"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="size-4" />
          Templates & Personalization Engine
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "simulator"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="size-4" />
          Inbound Webhook Simulator (Opt-Out Test)
        </button>
      </div>

      {/* TAB 1: WORKFLOWS */}
      {activeTab === "workflows" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            {workflows.map((wf) => (
              <button
                key={wf.id}
                onClick={() => setSelectedWorkflowId(wf.id)}
                className={
                  wf.id === selectedWorkflowId
                    ? "surface-card w-full p-5 text-left border-primary ring-2 ring-primary/20"
                    : "surface-card w-full p-5 text-left transition-all hover:border-primary/40"
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary-soft px-2 py-0.5 rounded">
                      {wf.triggerEvent}
                    </span>
                    <h2 className="mt-1 text-base font-bold">{wf.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{wf.description}</p>
                  </div>
                  <StatusPill tone={wf.isActive ? "success" : "neutral"} dot>
                    {wf.isActive ? "Active" : "Paused"}
                  </StatusPill>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-muted-foreground">
                  <span className="rounded bg-secondary px-2 py-1">Steps: {wf.steps?.length || 0}</span>
                  <span className="rounded bg-secondary px-2 py-1">
                    Stop Conditions: {wf.stopConditions?.join(", ") || "None"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {activeWf && (
            <aside className="surface-card self-start p-6 space-y-5">
              <div>
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-lg font-extrabold">{activeWf.name}</h2>
                  <StatusPill tone={activeWf.isActive ? "success" : "neutral"} dot>
                    {activeWf.isActive ? "Active" : "Inactive"}
                  </StatusPill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{activeWf.description}</p>
              </div>

              <div className="rounded-lg bg-secondary/50 p-3 text-xs space-y-1">
                <p className="font-bold text-muted-foreground">TRIGGER EVENT</p>
                <p className="font-mono text-primary font-bold">{activeWf.triggerEvent}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Sequence Step Flow
                </h3>
                <ol className="space-y-3">
                  {activeWf.steps?.map((step: any, idx: number) => (
                    <li key={idx} className="flex gap-3 rounded-xl border border-border bg-background p-3.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                        {step.stepNumber || idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-foreground">
                            {step.actionType === "SEND_SMS"
                              ? "📱 SMS"
                              : step.actionType === "SEND_EMAIL"
                              ? "📧 Email"
                              : "📋 Sales Task"}
                          </span>
                          <span className="text-muted-foreground font-mono">+{step.delayHours}h delay</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground font-mono">
                          {step.templateName ? `Template: ${step.templateName}` : step.taskTitle}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Stop Conditions (Guardrails)
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {activeWf.stopConditions?.map((sc: string, i: number) => (
                    <span key={i} className="text-[11px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
                      🛑 {sc}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* TAB 2: LEAD NURTURE INSPECTOR & SALES REP OVERRIDES */}
      {activeTab === "inspector" && (
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Lead Selector */}
          <div className="space-y-4">
            <div className="surface-card p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select CRM Lead Record</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold"
              >
                <option value="LD-JOHN-01">John Smith (PROPOSAL_SENT)</option>
                <option value="LD-SARAH-02">Sarah Johnson (QUALIFIED)</option>
                <option value="LD-MIKE-03">Mike Davis (PROPOSAL_SENT)</option>
                <option value="LD-EMMA-04">Emma Wilson (WON)</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <div className="surface-card p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enroll Lead in Workflow</h3>
              {workflows.map((wf) => (
                <Button
                  key={wf.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handleEnrollLead(wf.id)}
                  disabled={actionLoading || leadNurtureData?.isSuppressed}
                >
                  <PlayCircle className="size-3.5 text-primary mr-1.5" />
                  Enroll: {wf.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Lead Nurture Detail View */}
          <div className="space-y-6">
            {leadNurtureData ? (
              <>
                {/* Lead Summary Header Card */}
                <div className="surface-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="font-display text-xl font-black">
                          {leadNurtureData.lead.firstName} {leadNurtureData.lead.lastName}
                        </h2>
                        <StatusPill tone="warning">{leadNurtureData.lead.leadStage}</StatusPill>
                        {leadNurtureData.isSuppressed && (
                          <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <ShieldAlert className="size-3.5" /> SUPPRESSED (OPT-OUT)
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Phone: <span className="font-mono text-foreground">{leadNurtureData.lead.phone}</span> · Email:{" "}
                        <span className="font-mono text-foreground">{leadNurtureData.lead.email}</span> · Rep:{" "}
                        <span className="font-bold text-foreground">{leadNurtureData.lead.assignedSalesRep || "Dana Ruiz"}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Quote Amount</p>
                      <p className="font-display text-xl font-extrabold text-primary">
                        ${leadNurtureData.lead.quoteAmount ? leadNurtureData.lead.quoteAmount.toLocaleString() : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-secondary/40 p-3 text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground">Monthly Bill</span>
                      <p className="font-bold">${leadNurtureData.lead.monthlyElectricBill}/mo</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">Timeline</span>
                      <p className="font-bold">{leadNurtureData.lead.timeline || "1-3 months"}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">Lead Source</span>
                      <p className="font-bold">{leadNurtureData.lead.leadSource || "Website"}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground">Timezone</span>
                      <p className="font-bold">{leadNurtureData.lead.customerTimezone || "America/Phoenix"}</p>
                    </div>
                  </div>
                </div>

                {/* Active Enrollments */}
                <div className="surface-card p-6">
                  <h3 className="font-display text-base font-bold flex items-center gap-2 mb-4">
                    <Activity className="size-4 text-primary" />
                    Active Workflow Enrollments ({leadNurtureData.activeEnrollments?.length || 0})
                  </h3>

                  {leadNurtureData.activeEnrollments?.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      No active enrollments for this lead. Click an "Enroll" button on the left to start a drip sequence.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leadNurtureData.activeEnrollments.map((enr: any) => (
                        <div key={enr.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-xs font-bold text-primary">{enr.workflowId}</span>
                              <p className="text-xs text-muted-foreground">Enrolled on: {new Date(enr.enrolledAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusPill tone={enr.state === "ACTIVE" ? "success" : enr.state === "PAUSED" ? "warning" : "danger"}>
                                {enr.state}
                              </StatusPill>
                              {enr.state === "ACTIVE" ? (
                                <Button size="sm" variant="outline" onClick={() => handlePauseEnrollment(enr.id)} disabled={actionLoading}>
                                  <PauseCircle className="size-3.5 mr-1" /> Pause
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => handleResumeEnrollment(enr.id)} disabled={actionLoading}>
                                  <PlayCircle className="size-3.5 mr-1" /> Resume
                                </Button>
                              )}
                              <Button size="sm" variant="destructive" onClick={() => handleCancelEnrollment(enr.id)} disabled={actionLoading}>
                                <StopCircle className="size-3.5 mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>

                          <div className="text-xs">
                            <div className="flex justify-between font-semibold mb-1">
                              <span>Step {enr.currentStepIndex + 1} Execution Progress</span>
                              <span className="font-mono text-muted-foreground">
                                Next execution: {enr.nextExecutionTimestamp ? new Date(enr.nextExecutionTimestamp).toLocaleTimeString() : "Pending"}
                              </span>
                            </div>
                            <Progress value={((enr.currentStepIndex + 1) / 3) * 100} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sent Messages Log */}
                <div className="surface-card p-6">
                  <h3 className="font-display text-base font-bold flex items-center gap-2 mb-4">
                    <MessageSquare className="size-4 text-blue-500" />
                    Sent Message Log ({leadNurtureData.messages?.length || 0})
                  </h3>

                  {leadNurtureData.messages?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No outgoing messages logged yet for this lead.</p>
                  ) : (
                    <div className="space-y-3">
                      {leadNurtureData.messages.map((m: any) => (
                        <div key={m.id} className="rounded-xl border border-border p-3.5 text-xs space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>{m.channel} · {m.subject || "SMS Message"}</span>
                            <StatusPill tone="success">{m.status}</StatusPill>
                          </div>
                          <p className="text-foreground italic bg-secondary/40 p-2.5 rounded text-xs">{m.body}</p>
                          <p className="text-[10px] text-muted-foreground text-right">{new Date(m.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="surface-card p-12 text-center text-sm text-muted-foreground">
                Loading lead nurture details...
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATES & PERSONALIZATION */}
      {activeTab === "templates" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Templates Listing */}
          <div className="surface-card p-6 space-y-4">
            <h3 className="font-display text-base font-bold flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Module 03 Factual Templates ({templates.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Templates strictly interpolate verified CRM variables with automated fallback logic to ensure compliance.
            </p>

            <div className="space-y-3">
              {templates.map((t: any) => (
                <div key={t.id} className="rounded-xl border border-border p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="font-mono text-primary text-sm">{t.name}</span>
                    <span className="bg-primary-soft text-primary px-2 py-0.5 rounded font-mono text-[10px]">{t.channel}</span>
                  </div>
                  {t.subject && <p className="font-semibold text-foreground">Subject: {t.subject}</p>}
                  <p className="bg-secondary/60 p-3 rounded font-mono text-[11px] leading-relaxed text-muted-foreground">
                    "{t.body}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Compiler Preview */}
          <div className="surface-card p-6 space-y-4 self-start">
            <h3 className="font-display text-base font-bold flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              Live Factual Interpolation Evaluator
            </h3>

            <div>
              <label className="text-xs font-bold text-muted-foreground">Target CRM Lead</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold"
              >
                <option value="LD-JOHN-01">Rajesh Sharma (₹5,200/mo bill, Quote: ₹4,50,000)</option>
                <option value="LD-SARAH-02">Ananya Patel (₹4,200/mo bill)</option>
                <option value="LD-MIKE-03">Vikram Iyer (₹6,800/mo bill, Quote: ₹5,80,000)</option>
              </select>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-4 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Flame className="size-4" /> Live Output (Proposal Follow-up Template)
              </h4>

              <div className="bg-background rounded-lg p-4 border border-border space-y-2 text-xs">
                <p className="text-muted-foreground font-mono text-[11px]">
                  Template: <span className="text-primary font-bold">proposal_followup_sms_1</span>
                </p>
                <p className="text-foreground text-sm font-medium leading-relaxed italic">
                  "Hi {leadNurtureData?.lead?.firstName || "John"}, just checking in on the solar proposal we sent for ${leadNurtureData?.lead?.quoteAmount ? leadNurtureData?.lead?.quoteAmount.toLocaleString() : "23,400"}. Would you like to review it with {leadNurtureData?.lead?.assignedSalesRep || "Dana Ruiz"}?"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INBOUND WEBHOOK SIMULATOR */}
      {activeTab === "simulator" && (
        <div className="surface-card p-6 max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Sliders className="size-5 text-primary" />
              Inbound Webhook & Opt-Out Guardrail Test Bench
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Simulate customer inbound SMS replies. Keywords like <span className="font-mono font-bold text-rose-500">STOP</span>, <span className="font-mono font-bold text-rose-500">UNSUBSCRIBE</span>, or <span className="font-mono font-bold text-rose-500">CANCEL</span> trigger instant suppression in Module 03.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Customer Phone Number</label>
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground">Inbound Message Body</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setSimBody("STOP")}
                  className="rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2.5 py-1 text-xs font-mono font-bold"
                >
                  STOP (Opt-Out)
                </button>
                <button
                  type="button"
                  onClick={() => setSimBody("REPLY YES")}
                  className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-xs font-mono font-bold"
                >
                  REPLY YES (Re-engage)
                </button>
                <button
                  type="button"
                  onClick={() => setSimBody("Can you call me tomorrow?")}
                  className="rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2.5 py-1 text-xs font-mono font-bold"
                >
                  Inquiry
                </button>
              </div>
              <textarea
                value={simBody}
                onChange={(e) => setSimBody(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm font-mono"
              />
            </div>

            <Button onClick={handleSimulateSms} disabled={simulating} className="w-full">
              <Send className="size-4 mr-2" />
              {simulating ? "Processing Webhook..." : "Send Webhook to Module 03"}
            </Button>

            {simResult && (
              <div
                className={`rounded-xl p-4 text-xs font-mono ${
                  simResult.action === "OPT_OUT_SUPPRESSED"
                    ? "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300"
                    : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                <p className="font-bold text-sm mb-1">
                  {simResult.action === "OPT_OUT_SUPPRESSED"
                    ? "🛑 OPT-OUT SUPPRESSION TRIGGERED"
                    : "✅ INBOUND SMS PROCESSED SUCCESSFULLY"}
                </p>
                <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(simResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}



