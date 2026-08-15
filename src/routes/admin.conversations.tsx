import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, PhoneCall, Send, Sparkles, UserCheck } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  const filteredConversations = conversations.filter(
    (c) =>
      (c.customer || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || !active) return;
    setSending(true);
    await solarApi.sendMessage(active.id, "rep", messageInput.trim(), channelSelect);
    setMessageInput("");
    setSending(false);
  }

  async function handleSimulateCustomerReply() {
    if (!active) return;
    const replies = [
      "Thanks for the details! Can you confirm if the 30% tax credit applies to the battery too?",
      "Sounds good. When is the site auditor coming out to measure our roof?",
      "I reviewed the quote with my spouse and we'd like to proceed with the 13.5 kWh battery package.",
    ];
    const randomReply = replies[Math.floor(Math.random() * replies.length)] ?? "Thanks for the information!";
    await solarApi.sendMessage(active.id, "user", randomReply, "SMS");
  }

  if (!active) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        No active conversations found.
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Conversations & 2-Way CRM Messages"
        description="Live SMS, Voice Call logs and AI assistant chats writing back into client CRM"
        actions={
          <Button variant="outline" onClick={handleSimulateCustomerReply} className="gap-1.5">
            <MessageSquare className="size-4 text-primary" />
            Simulate Incoming SMS
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="surface-card overflow-hidden border-border/80">
          <div className="border-b border-border p-3.5">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations by lead..."
              className="text-xs"
            />
          </div>
          <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {filteredConversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full px-4 py-3.5 text-left transition-colors hover:bg-secondary/60",
                    c.id === active.id && "bg-primary-soft border-l-4 border-primary",
                  )}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <span className="truncate text-sm font-bold text-foreground">{c.customer || c.name}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
                      {c.lastTime || c.updatedAt}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{c.lastMessage || c.preview}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusPill tone={toneForText(c.stage || c.status)}>{c.stage || c.status}</StatusPill>
                    <StatusPill tone="neutral" className="text-[10px]">{c.channel}</StatusPill>
                    {c.unread ? <StatusPill tone="danger" className="text-[10px]">Unread</StatusPill> : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card flex min-w-0 flex-col overflow-hidden border-border/80 shadow-card">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4 bg-secondary/30">
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-foreground">{active.customer || active.name}</h2>
              <p className="truncate text-xs text-muted-foreground">
                Phone: {active.phone || "(480) 555-0142"} · Primary Channel: {active.channel}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusPill tone="brand">Stage: {active.stage || active.status}</StatusPill>
              <Button size="sm" variant="outline" onClick={handleSimulateCustomerReply} className="gap-1 text-xs">
                <PhoneCall className="size-3.5 text-primary" />
                Simulate Call Pickup
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4 bg-slate-950/20 px-5 py-6 max-h-[420px] min-h-[320px] overflow-y-auto">
            {active.messages.map((m) => {
              const senderType = m.sender || m.from;
              const isCustomer = senderType === "user" || senderType === "customer";
              const isRep = senderType === "rep";

              return (
                <div
                  key={m.id}
                  className={cn("flex flex-col gap-1", isCustomer ? "items-start" : "items-end")}
                >
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-card",
                      isCustomer && "rounded-bl-none bg-card border border-border text-foreground font-medium",
                      !isCustomer && !isRep && "rounded-br-none bg-primary-soft text-foreground border border-primary/30",
                      isRep && "rounded-br-none bg-navy text-white font-semibold",
                    )}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1 px-1">
                    {senderType} · {m.time || m.at} {m.channel ? `· ${m.channel}` : ""}
                  </span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-border p-4 space-y-3 bg-card">
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft/50 px-3.5 py-2">
              <Sparkles className="size-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground leading-snug">
                <strong>Outbound 2-Way CRM Sync</strong>: Messages sent here write directly to your client's CRM timeline and dispatch SMS/Voice alerts.
              </p>
              <select
                value={channelSelect}
                onChange={(e) => setChannelSelect(e.target.value as any)}
                className="ml-auto rounded-md border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground"
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
                className="flex-1 text-sm"
              />
              <Button type="submit" disabled={sending || !messageInput.trim()} className="gap-1.5 font-bold">
                <Send className="size-4" />
                Send Message
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
