import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  CreditCard,
  Download,
  FileText,
  MessageSquare,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusPill } from "@/components/common/StatusPill";
import {
  portalDocuments,
} from "@/data/mock";
import { useSolarDB } from "@/hooks/useSolarDB";
import { solarApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "My Solar Project — Customer Portal | SolarPeak" },
      {
        name: "description",
        content:
          "Track your solar installation: project status, milestones, documents, appointments, payments and messages with your consultant.",
      },
    ],
  }),
  component: PortalPage,
});

function PortalPage() {
  const { portalProject: defaultProject, portalMilestones: defaultMilestones, portalMessages: defaultMessages } = useSolarDB();
  const [realProject, setRealProject] = useState<any>(null);
  const [realMilestones, setRealMilestones] = useState<any[]>([]);
  const [realUpdates, setRealUpdates] = useState<any[]>([]);

  useEffect(() => {
    async function syncBackendData() {
      // Attempt to load from Module 04 backend for PROJ-101 or first project
      const projectsList = await solarApi.getAdminProjects();
      if (projectsList && projectsList.length > 0) {
        const targetProj = projectsList[0];
        setRealProject(targetProj);
        const [mList, uList] = await Promise.all([
          solarApi.getCustomerPortalMilestones(targetProj.id),
          solarApi.getCustomerPortalUpdates(targetProj.id),
        ]);
        if (mList && mList.length > 0) {
          setRealMilestones(mList);
        }
        if (uList && uList.length > 0) {
          setRealUpdates(uList);
        }
      }
    }
    syncBackendData();
  }, []);

  const project = realProject
    ? {
        customer: "Sarah Jenkins",
        address: "742 Evergreen Terrace, Scottsdale, AZ 85251",
        status: realProject.currentMilestone ? `Stage: ${realProject.currentMilestone}` : realProject.status,
        statusDetail: `Your solar project is actively being managed by our post-sale retention engine. Current stage: ${realProject.currentMilestone}.`,
        progress: realProject.status === "COMPLETED" ? 100 : 45,
        systemKw: "9.6",
        panels: 24,
        battery: "Tesla Powerwall 2",
        projectedInstall: "Aug 24, 2026",
        estMonthlySavings: 285,
      }
    : defaultProject;

  const displayMilestones = realMilestones.length > 0
    ? realMilestones.map((m: any) => ({
        title: m.milestoneType.replace(/_/g, " "),
        date: m.completedAt ? new Date(m.completedAt).toLocaleDateString() : m.startedAt ? "In Progress" : "Pending",
        description: `Status: ${m.status}${m.notes ? ` · Note: ${m.notes}` : ""}`,
        status: m.status === "COMPLETED" ? "complete" : m.status === "IN_PROGRESS" ? "current" : "upcoming",
      }))
    : defaultMilestones;

  const displayMessages = realUpdates.length > 0
    ? realUpdates.map((u: any) => ({
        id: u.id,
        text: u.message,
        time: new Date(u.createdAt).toLocaleTimeString(),
        channel: `Portal (${u.createdBy})`,
      }))
    : defaultMessages;

  return (
    <div className="min-h-screen bg-secondary/30">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy text-navy-foreground">
              <Sun className="size-6 text-primary" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-extrabold sm:text-2xl">
                My Solar Project
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                {project.customer} · {project.address}
              </p>
            </div>
          </div>
          <StatusPill tone="warning" dot className="shrink-0">
            {project.status}
          </StatusPill>
        </header>

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-navy p-6 shadow-card sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-widest text-primary uppercase">
                Live Status Tracker · Synced with CRM
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-navy-foreground">
                {project.status}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-foreground/70">
                {project.statusDetail}
              </p>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-semibold text-navy-foreground/70">
                  <span>Installation Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="mt-2 h-2 bg-navy-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "System size", value: `${project.systemKw} kW`, sub: `${project.panels} panels` },
                { label: "Battery", value: "Included", sub: project.battery },
                { label: "Est. install", value: project.projectedInstall, sub: "Subject to permit" },
                { label: "Est. monthly savings", value: `$${project.estMonthlySavings}`, sub: "Guaranteed" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-navy-muted/60 p-4">
                  <p className="text-[11px] font-semibold text-navy-foreground/60">{s.label}</p>
                  <p className="mt-1 font-display text-lg font-extrabold text-navy-foreground">
                    {s.value}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-navy-foreground/50">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Tabs defaultValue="timeline" className="mt-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-card p-1">
            {[
              ["timeline", "Timeline", CalendarDays],
              ["documents", "Documents", FileText],
              ["messages", "Messages", MessageSquare],
              ["appointments", "Appointments", CalendarDays],
              ["payments", "Payments", CreditCard],
            ].map(([v, label, Icon]) => {
              const I = Icon as typeof CalendarDays;
              return (
                <TabsTrigger key={v as string} value={v as string} className="gap-1.5">
                  <I className="size-4" />
                  {label as string}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="timeline" className="mt-5">
            <div className="surface-card min-w-0 p-6">
              <h3 className="text-base font-bold">Post-Sale Installation Milestones</h3>
              <ol className="mt-6 space-y-0">
                {displayMilestones.map((m, i) => (
                  <li key={m.title} className="relative flex gap-4 pb-7 last:pb-0">
                    {i < displayMilestones.length - 1 ? (
                      <span
                        className={cn(
                          "absolute top-6 left-3.5 -ml-px h-full w-0.5",
                          m.status === "complete" ? "bg-primary" : "bg-border",
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors",
                        m.status === "complete" && "bg-primary text-primary-foreground",
                        m.status === "current" && "bg-navy text-navy-foreground ring-4 ring-primary-soft",
                        m.status === "upcoming" && "bg-secondary text-muted-foreground border border-border",
                      )}
                    >
                      {m.status === "complete" ? <Check className="size-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-foreground">{m.title}</span>
                        <span className="text-xs text-muted-foreground">{m.date}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-5">
            <div className="surface-card p-6">
              <h3 className="text-base font-bold mb-4">Project Documents</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {portalDocuments.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div>
                      <p className="font-bold text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.date} · {doc.size}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-5">
            <div className="surface-card p-6 space-y-4">
              <h3 className="text-base font-bold">Project Updates & SMS Log</h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto bg-secondary/30 p-4 rounded-xl">
                {displayMessages.map((msg) => (
                  <div key={msg.id} className="rounded-lg border border-border bg-card p-3 text-xs">
                    <p className="font-semibold text-primary">{msg.text}</p>
                    <span className="mt-1 block text-[10px] text-muted-foreground">{msg.time} via {msg.channel}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <SiteFooter />
    </div>
  );
}
