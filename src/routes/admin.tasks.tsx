import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { priorityActions, tasks as seedTasks } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/tasks")({
  component: TasksPage,
});

const priorityTone = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "neutral",
} as const;

function TasksPage() {
  const [tasks, setTasks] = useState(seedTasks);
  const open = tasks.filter((t) => !t.done);

  return (
    <>
      <PageHeader
        title="Tasks & priority actions"
        description={`${open.length} open · ranked by revenue impact`}
        actions={
          <Button>
            <Plus />
            New task
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="surface-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-bold">Task list</h2>
          </div>
          <ul className="divide-y divide-border">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/50"
              >
                <Checkbox
                  checked={t.done}
                  onCheckedChange={() =>
                    setTasks((ts) =>
                      ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                    )
                  }
                  aria-label={`Complete ${t.title}`}
                />
                <div className="min-w-0">
                  <p className={cn("truncate text-sm font-semibold", t.done && "text-muted-foreground line-through")}>
                    {t.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.type} · {t.related} · {t.owner} · {t.due}
                  </p>
                </div>
                <StatusPill tone={priorityTone[t.priority]}>{t.priority}</StatusPill>
              </li>
            ))}
          </ul>
        </div>

        <aside className="surface-card min-w-0 self-start p-6">
          <h2 className="text-base font-bold">Next best actions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Generated from lead scoring, SLA timers and deal risk.
          </p>
          <ul className="mt-4 space-y-3">
            {priorityActions.slice(0, 4).map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <p className="truncate text-sm font-semibold">{a.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.meta}</p>
                <Button size="sm" variant="outline" className="mt-2.5 w-full">
                  {a.action}
                </Button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
