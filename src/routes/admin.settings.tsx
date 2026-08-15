import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Database, Globe, Key, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { solarApi } from "@/lib/api";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const team = [
  { name: "Dana Ruiz", email: "dana@solarpeak.com", role: "Sales Manager" },
  { name: "Ben Okafor", email: "ben@solarpeak.com", role: "Solar Consultant" },
  { name: "Field Team", email: "ops@solarpeak.com", role: "Operations" },
];

function SettingsPage() {
  const [provider, setProvider] = useState<"HubSpot" | "Salesforce" | "GoHighLevel" | "Custom Webhook">("HubSpot");
  const [webhookUrl, setWebhookUrl] = useState("https://api.hubapi.com/crm/v3/objects/contacts");
  const [apiKey, setApiKey] = useState("pat-na1-demo-api-key-solarflow");
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    solarApi.getCrmSettings().then((s) => {
      if (s) {
        setProvider(s.provider || "HubSpot");
        setWebhookUrl(s.webhookUrl || "https://api.hubapi.com/crm/v3/objects/contacts");
        setApiKey(s.apiKey || "pat-na1-demo-api-key-solarflow");
        setSyncEnabled(s.syncEnabled ?? true);
      }
    });
  }, []);

  async function handleSaveCrmSettings(e: React.FormEvent) {
    e.preventDefault();
    await solarApi.updateCrmSettings({
      provider,
      webhookUrl,
      apiKey,
      syncEnabled,
      autoResponseEnabled: true,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <PageHeader title="Settings & CRM Integrations" description="Workspace, team, CRM webhook endpoints and API keys" />

      <Tabs defaultValue="integrations">
        <TabsList className="flex-wrap">
          <TabsTrigger value="integrations">CRM & Integrations</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="routing">Lead routing</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-5 space-y-6">
          <div className="surface-card max-w-3xl p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-lg font-extrabold flex items-center gap-2">
                  <Database className="size-5 text-primary" />
                  Live CRM Integration Adapter
                </h2>
                <p className="text-xs text-muted-foreground">
                  Plug in your CRM API key and webhook endpoint. All incoming leads, qualifying answers, intent scores, and booked slots will map directly to your CRM.
                </p>
              </div>
              <StatusPill tone={syncEnabled ? "success" : "neutral"} dot>
                {syncEnabled ? "2-Way Sync Active" : "Disabled"}
              </StatusPill>
            </div>

            {saved ? (
              <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-bold">
                <CheckCircle2 className="size-4 text-emerald-500" />
                CRM Adapter Settings Saved & Server Endpoint Synced
              </div>
            ) : null}

            <form onSubmit={handleSaveCrmSettings} className="mt-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">CRM Provider</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["HubSpot", "Salesforce", "GoHighLevel", "Custom Webhook"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setProvider(p);
                        if (p === "HubSpot") setWebhookUrl("https://api.hubapi.com/crm/v3/objects/contacts");
                        else if (p === "Salesforce") setWebhookUrl("https://yourinstance.salesforce.com/services/data/v54.0/sobjects/Lead");
                        else if (p === "GoHighLevel") setWebhookUrl("https://rest.gohighlevel.com/v1/contacts");
                        else setWebhookUrl("https://your-custom-crm.com/api/leads/webhook");
                      }}
                      className={`rounded-xl border p-3 text-xs font-bold transition-colors text-center ${
                        provider === p
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Outbound 2-Way Sync Webhook URL</label>
                <div className="relative">
                  <Globe className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="pl-9 font-mono text-xs" required />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Our server posts real-time updates (qualified leads, scores, appointment bookings, milestone changes) to this URL.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">CRM Secret API Key / Authorization Token</label>
                <div className="relative">
                  <Key className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="pl-9 font-mono text-xs" required />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4">
                <div>
                  <span className="font-bold text-sm block">Enable Automatic Outbound 2-Way Sync</span>
                  <span className="text-xs text-muted-foreground">Automatically dispatches every lead mutation back to your CRM endpoint</span>
                </div>
                <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="gap-2">
                  <Save className="size-4" />
                  Save CRM Adapter Config
                </Button>
              </div>
            </form>
          </div>

          <div className="surface-card max-w-3xl p-6">
            <h3 className="font-bold text-sm mb-3">Inbound Webhook Payload Schema</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Your CRM or ad form can POST JSON directly to <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono">/api/webhooks/lead</code> using this schema:
            </p>
            <pre className="bg-navy text-navy-foreground p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`// POST http://localhost:3000/api/webhooks/lead
{
  "name": "Sarah Jenkins",
  "email": "s.jenkins@example.com",
  "phone": "(602) 555-9012",
  "source": "${provider}",
  "monthlyBill": 380,
  "roof": "Asphalt shingle",
  "homeowner": true,
  "city": "Scottsdale",
  "state": "AZ"
}`}
            </pre>
          </div>
        </TabsContent>

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
      </Tabs>
    </>
  );
}
