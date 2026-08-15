import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const team = [
  { name: "Dana Ruiz", email: "dana@solarpeak.com", role: "Sales Manager" },
  { name: "Ben Okafor", email: "ben@solarpeak.com", role: "Solar Consultant" },
  { name: "Field Team", email: "ops@solarpeak.com", role: "Operations" },
];

function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Workspace, team, routing and integrations" />

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="routing">Lead routing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-5">
          <div className="surface-card max-w-2xl p-6">
            <h2 className="text-base font-bold">Company profile</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Company name", "SolarPeak Energy"],
                ["License number", "ROC #331204"],
                ["Support phone", "(480) 555-0170"],
                ["Service area", "Phoenix metro, AZ"],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                  <Input defaultValue={value} />
                </div>
              ))}
            </div>
            <Button className="mt-5">Save changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-5">
          <div className="surface-card max-w-3xl overflow-hidden">
            <ul className="divide-y divide-border">
              {team.map((m) => (
                <li key={m.email} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">
                      {m.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <StatusPill tone="brand">{m.role}</StatusPill>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="routing" className="mt-5">
          <div className="surface-card max-w-2xl p-6">
            <h2 className="text-base font-bold">Routing rules</h2>
            <ul className="mt-4 divide-y divide-border">
              {[
                ["Auto-assign inbound leads round-robin", true],
                ["Escalate unworked leads after 15 minutes", true],
                ["Auto-enroll unqualified leads in nurture", true],
                ["Notify manager on cancellation risk", false],
              ].map(([label, on]) => (
                <li key={label as string} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="min-w-0 text-sm">{label}</span>
                  <Switch defaultChecked={on as boolean} />
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-5">
          <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
            {[
              ["CRM sync", "Not connected"],
              ["Telephony & SMS", "Not connected"],
              ["Calendar", "Not connected"],
              ["Proposal engine", "Not connected"],
            ].map(([name, status]) => (
              <div key={name} className="surface-card flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">{status}</p>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
