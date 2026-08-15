import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PhoneCall, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill, toneForText } from "@/components/common/StatusPill";
import { useSolarDB } from "@/hooks/useSolarDB";
import { solarApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/conversations")({
  component: ConversationsPage,
});

function ConversationsPage() {
  const { conversations } = useSolarDB();
  const [activeId, setActiveId] = useState(conversations[0]?.id || "");
  const [messageInput, setMessageInput] = useState("");
  const [channelSelect, setChannelSelect] = useState<"SMS" | "Voice Call" | "Webchat">("SMS");
  const [sending, setSending] = useState(false);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || !active) return;
    setSending(true);
    await solarApi.sendMessage(active.id, "rep", messageInput.trim(), channelSelect);
    setMessageInput("");
    setSending(false);
  }

  if (!active) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        No active conversations. Simulate a lead to view messages.
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Conversations & 2-Way CRM Messages"
        description="Live SMS, Voice Call logs and AI assistant chats writing back into client CRM"
      />
      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="surface-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <Input placeholder="Search conversations" />
          </div>
          <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full px-4 py-3.5 text-left transition-colors hover:bg-secondary/60",
                    c.id === active.id && "bg-primary-soft",
                  )}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <span className="truncate text-sm font-bold">{c.customer || (c as any).name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {c.lastTime || (c as any).updatedAt}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{c.lastMessage || (c as any).preview}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusPill tone={toneForText(c.stage || (c as any).status)}>{c.stage || (c as any).status}</StatusPill>
                    <StatusPill tone="neutral">{c.channel}</StatusPill>
                    {c.unread ? <StatusPill tone="danger">Unread</StatusPill> : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card flex min-w-0 flex-col overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold">{active.customer || (active as any).name}</h2>
              <p className="truncate text-xs text-muted-foreground">
                Phone: {active.phone || "(480) 555-0142"} · Channel: {active.channel}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusPill tone="brand">Stage: {active.stage || (active as any).status}</StatusPill>
              <Button size="sm" variant="outline" className="gap-1.5">
                <PhoneCall className="size-3.5 text-primary" />
                Simulate Call Pickup
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4 bg-secondary/30 px-5 py-6 max-h-[420px] overflow-y-auto">
            {active.messages.map((m) => {
              const senderType = m.sender || (m as any).from;
              const isCustomer = senderType === "user" || senderType === "customer";
              const isRep = senderType === "rep";

              return (
                <div
                  key={m.id}
                  className={cn("flex flex-col gap-1", isCustomer ? "items-start" : "items-end")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card",
                      isCustomer && "rounded-bl-sm bg-card text-foreground",
                      !isCustomer && !isRep && "rounded-br-sm bg-primary-soft text-foreground",
                      isRep && "rounded-br-sm bg-navy text-navy-foreground",
                    )}
                  >
                    {m.text}
                  </div>
                  <span className="text-[11px] text-muted-foreground capitalize flex items-center gap-1">
                    {senderType} · {m.time || (m as any).at} {m.channel ? `· ${m.channel}` : ""}
                  </span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-border p-4 space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft px-3 py-2">
              <Sparkles className="size-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Two-way CRM Sync: Sending a message here writes directly to the client's CRM timeline and dispatches SMS/Voice call.
              </p>
              <select
                value={channelSelect}
                onChange={(e) => setChannelSelect(e.target.value as any)}
                className="ml-auto rounded border border-border bg-card px-2 py-1 text-xs font-semibold"
              >
                <option value="SMS">SMS</option>
                <option value="Voice Call">Voice Call</option>
                <option value="Webchat">Webchat</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Type a message via ${channelSelect}...`}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !messageInput.trim()}>
                <Send className="size-4" />
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
