import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  CircleDot,
  CreditCard,
  Download,
  FileText,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sun,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusPill, toneForText } from "@/components/common/StatusPill";
import {
  portalAppointments,
  portalDocuments,
  portalMessages,
  portalMilestones,
  portalPayments,
  portalProject as project,
} from "@/data/mock";
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
      { property: "og:title", content: "My Solar Project | SolarPeak customer portal" },
      {
        property: "og:description",
        content: "Every milestone, document and payment for your solar installation in one place.",
      },
    ],
  }),
  component: PortalPage,
});

function PortalPage() {
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

        {/* Status banner */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-navy p-6 shadow-card sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-widest text-primary uppercase">
                Current stage · 4 of 7
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-navy-foreground">
                {project.status}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-foreground/70">
                {project.statusDetail}
              </p>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-semibold text-navy-foreground/70">
                  <span>Project progress</span>
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
                { label: "Est. monthly savings", value: `$${project.estMonthlySavings}`, sub: "Illustrative" },
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
              ["support", "Support", LifeBuoy],
              ["profile", "Profile", User],
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

          {/* Timeline */}
          <TabsContent value="timeline" className="mt-5">
            <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
              <div className="surface-card min-w-0 p-6">
                <h3 className="text-base font-bold">Installation timeline</h3>
                <ol className="mt-6 space-y-0">
                  {portalMilestones.map((m, i) => (
                    <li key={m.title} className="relative flex gap-4 pb-7 last:pb-0">
                      {i < portalMilestones.length - 1 ? (
                        <span
                          className={cn(
                            "absolute top-8 left-[15px] h-full w-0.5",
                            m.state === "done" ? "bg-primary" : "bg-border",
                          )}
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className={cn(
                          "z-10 grid size-8 shrink-0 place-items-center rounded-full border-2",
                          m.state === "done" && "border-primary bg-primary text-primary-foreground",
                          m.state === "active" && "border-primary bg-primary-soft text-primary",
                          m.state === "upcoming" && "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {m.state === "done" ? (
                          <Check className="size-4" />
                        ) : (
                          <CircleDot className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold">{m.title}</h4>
                          {m.state === "active" ? (
                            <StatusPill tone="warning" dot>
                              In progress
                            </StatusPill>
                          ) : null}
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">{m.date}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {m.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="min-w-0 space-y-5">
                <div className="surface-card p-6">
                  <h3 className="text-base font-bold">Your consultant</h3>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                      DR
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{project.consultant.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {project.consultant.role}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <Button variant="outline" className="justify-start">
                      <Phone />
                      {project.consultant.phone}
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Mail />
                      Send a message
                    </Button>
                  </div>
                </div>

                <div className="surface-card p-6">
                  <h3 className="text-base font-bold">Expected production</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Once your system is switched on.
                  </p>
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary-soft p-4">
                    <Zap className="size-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-display text-xl font-extrabold">
                        {project.estAnnualProduction}
                      </p>
                      <p className="text-xs text-muted-foreground">Estimated annual production</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Live monitoring becomes available after utility approval (PTO).
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-5">
            <div className="surface-card overflow-hidden">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-6 py-4">
                <h3 className="min-w-0 truncate text-base font-bold">Documents</h3>
                <StatusPill>{portalDocuments.length} files</StatusPill>
              </div>
              <ul className="divide-y divide-border">
                {portalDocuments.map((d) => (
                  <li
                    key={d.name}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                        <FileText className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{d.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {d.type} · {d.size} · {d.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusPill tone={toneForText(d.status)}>{d.status}</StatusPill>
                      <Button variant="ghost" size="icon" aria-label={`Download ${d.name}`}>
                        <Download />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="mt-5">
            <div className="surface-card flex flex-col overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h3 className="text-base font-bold">Messages with {project.consultant.name}</h3>
                <p className="text-xs text-muted-foreground">Typically replies within an hour</p>
              </div>
              <div className="space-y-4 bg-secondary/30 px-6 py-6">
                {portalMessages.map((m, i) => (
                  <div
                    key={i}
                    className={cn("flex flex-col gap-1", m.mine ? "items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-card",
                        m.mine
                          ? "rounded-br-sm bg-navy text-navy-foreground"
                          : "rounded-bl-sm bg-card",
                      )}
                    >
                      {m.text}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {m.from} · {m.at}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-border p-4">
                <Input placeholder="Write a message…" className="flex-1" />
                <Button>
                  <Send />
                  Send
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Appointments */}
          <TabsContent value="appointments" className="mt-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {portalAppointments.map((a) => (
                <div key={a.title} className="surface-card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold">{a.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{a.when}</p>
                    </div>
                    <StatusPill tone={toneForText(a.status)}>{a.status}</StatusPill>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Team</dt>
                      <dd className="font-medium">{a.who}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Location</dt>
                      <dd className="font-medium">{a.where}</dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex gap-2">
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                    <Button variant="ghost" size="sm">
                      Add to calendar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="mt-5">
            <div className="surface-card overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h3 className="text-base font-bold">Payment schedule</h3>
                <p className="text-xs text-muted-foreground">
                  Milestone-based. You are never charged before work is completed.
                </p>
              </div>
              <ul className="divide-y divide-border">
                {portalPayments.map((p) => (
                  <li
                    key={p.label}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.due}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="font-display text-base font-extrabold">{p.amount}</span>
                      <StatusPill tone={toneForText(p.status)}>{p.status}</StatusPill>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-4 bg-secondary/50 px-6 py-4">
                <span className="text-sm font-semibold">Contract total</span>
                <span className="font-display text-lg font-extrabold">$46,900</span>
              </div>
            </div>
          </TabsContent>

          {/* Support */}
          <TabsContent value="support" className="mt-5">
            <div className="grid gap-5 lg:grid-cols-3">
              {[
                { icon: Phone, title: "Call support", body: "Mon–Sat, 7 AM – 7 PM MST", action: "(480) 555-0170" },
                { icon: MessageSquare, title: "Message your consultant", body: "Typical reply within an hour", action: "Open messages" },
                { icon: LifeBuoy, title: "Report an issue", body: "Warranty, service or billing questions", action: "Submit a request" },
              ].map((s) => (
                <div key={s.title} className="surface-card p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <s.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                  <Button variant="outline" className="mt-4 w-full">
                    {s.action}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile" className="mt-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="surface-card p-6">
                <h3 className="text-base font-bold">Account details</h3>
                <div className="mt-5 grid gap-4">
                  {[
                    ["Full name", project.customer],
                    ["Email", "abrennan@example.com"],
                    ["Phone", "(602) 555-0133"],
                    ["Service address", project.address],
                  ].map(([label, value]) => (
                    <div key={label} className="grid gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                      <Input defaultValue={value} />
                    </div>
                  ))}
                </div>
                <Button className="mt-5">Save changes</Button>
              </div>
              <div className="surface-card p-6">
                <h3 className="text-base font-bold">Notifications</h3>
                <ul className="mt-4 divide-y divide-border">
                  {[
                    ["Project milestone updates", "Email + SMS"],
                    ["Appointment reminders", "SMS"],
                    ["Billing and payments", "Email"],
                    ["Product news", "Off"],
                  ].map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between gap-4 py-3.5">
                      <span className="min-w-0 truncate text-sm">{k}</span>
                      <StatusPill tone={v === "Off" ? "neutral" : "brand"}>{v}</StatusPill>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <SiteFooter />
    </div>
  );
}
