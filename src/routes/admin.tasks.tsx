import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, CheckCircle2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill } from "@/components/common/StatusPill";
import { useSolarDB } from "@/hooks/useSolarDB";
import type { Task } from "@/types/solar";
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
  const { tasks, leads } = useSolarDB();
  const [taskList, setTaskList] = useState<Task[]>(tasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newOwner, setNewOwner] = useState("Dana Ruiz");
  const [newPriority, setNewPriority] = useState<"Critical" | "High" | "Medium" | "Low">("High");
  const [newType, setNewType] = useState<"Call" | "Email" | "Follow-up" | "Admin" | "Site">("Follow-up");

  // Keep synced with DB store if tasks update
  const displayTasks = taskList.length > 0 ? taskList : tasks;
  const open = displayTasks.filter((t) => !t.done);

  function handleToggle(id: string) {
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: `TK-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      related: "CRM Operations",
      due: "Today · Urgent",
      priority: newPriority,
      owner: newOwner,
      done: false,
      type: newType,
    };

    setTaskList((prev) => [newTask, ...prev]);
    setNewTitle("");
    setModalOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Tasks & SLA Actions"
        description={`${open.length} open tasks · prioritized by customer impact`}
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus />
            New task
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="surface-card overflow-hidden rounded-2xl">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <h2 className="text-base font-bold">Operational Task List</h2>
            <span className="text-xs text-muted-foreground">{displayTasks.length} total</span>
          </div>

          {displayTasks.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground">No active tasks</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Tasks created during lead nurturing or consult scheduling will appear here.
              </p>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setModalOpen(true)}>
                <Plus className="size-3.5 mr-1.5" />
                Create First Task
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {displayTasks.map((t) => (
                <li
                  key={t.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/50"
                >
                  <Checkbox
                    checked={t.done}
                    onCheckedChange={() => handleToggle(t.id)}
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
          )}
        </div>

        <aside className="surface-card min-w-0 self-start p-6 rounded-2xl">
          <h2 className="text-base font-bold">Priority Lead Opportunities</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Active leads requiring follow-up or consult scheduling.
          </p>
          <ul className="mt-4 space-y-3">
            {leads.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No hot leads in queue. Inbound leads from ads or web calculator will appear here.
              </li>
            ) : (
              leads.slice(0, 4).map((l) => (
                <li key={l.id} className="rounded-xl border border-border p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-bold">{l.name}</p>
                    <span className="text-[10px] font-semibold text-primary">Score {l.score}</span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {l.city}, {l.state} · ${l.monthlyBill}/mo bill
                  </p>
                  <StatusPill tone="brand" className="text-[10px] py-0.5">
                    {l.status}
                  </StatusPill>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Operational Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4 mt-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Task Title</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Follow up on battery quote review"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Owner</label>
                <Input
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="Dana Ruiz"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
