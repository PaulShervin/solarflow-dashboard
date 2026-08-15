import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill, toneForText } from "@/components/common/StatusPill";
import { conversations } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/conversations")({
  component: ConversationsPage,
});

function ConversationsPage() {
  const [activeId, setActiveId] = useState(conversations[0]!.id);
  const active = conversations.find((c) => c.id === activeId)!;

  return (
    <>
      <PageHeader
        title="Conversations"
        description="Web chat, SMS and email threads captured by the assistant"
      />
      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="surface-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <Input placeholder="Search conversations" />
          </div>
          <ul className="divide-y divide-border">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full px-4 py-3.5 text-left transition-colors hover:bg-secondary/60",
                    c.id === activeId && "bg-primary-soft",
                  )}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <span className="truncate text-sm font-bold">{c.name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {c.updatedAt}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{c.preview}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusPill tone={toneForText(c.status)}>{c.status}</StatusPill>
                    <StatusPill tone="neutral">{c.channel}</StatusPill>
                    {c.unread ? <StatusPill tone="danger">{c.unread} new</StatusPill> : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card flex min-w-0 flex-col overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold">{active.name}</h2>
              <p className="truncate text-xs text-muted-foreground">
                {active.leadId} · {active.channel}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusPill tone="brand">Score {active.score}</StatusPill>
              <Button size="sm" variant="outline">
                Open lead
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4 bg-secondary/30 px-5 py-6">
            {active.messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex flex-col gap-1", m.from === "customer" ? "items-start" : "items-end")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card",
                    m.from === "customer" && "rounded-bl-sm bg-card",
                    m.from === "assistant" && "rounded-br-sm bg-primary-soft text-foreground",
                    m.from === "rep" && "rounded-br-sm bg-navy text-navy-foreground",
                  )}
                >
                  {m.text}
                </div>
                <span className="text-[11px] text-muted-foreground capitalize">
                  {m.from} · {m.at}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4">
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary-soft px-3 py-2.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed">
                <span className="font-bold">Suggested reply:</span> offer the Thursday 4 PM slot
                and confirm $0-down financing eligibility.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="Type a reply…" className="flex-1" />
              <Button>
                <Send />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
