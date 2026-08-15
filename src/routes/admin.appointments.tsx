import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill, toneForText } from "@/components/common/StatusPill";
import { appointments } from "@/data/mock";

export const Route = createFileRoute("/admin/appointments")({
  component: AppointmentsPage,
});

const days = ["Today", "Tomorrow", "Mon", "Tue"];

function AppointmentsPage() {
  return (
    <>
      <PageHeader
        title="Appointments"
        description={`${appointments.length} scheduled · 78% show rate this month`}
        actions={
          <Button>
            <CalendarPlus />
            New appointment
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {days.map((d) => {
          const items = appointments.filter((a) => a.day === d);
          return (
            <div key={d} className="surface-card min-h-40 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold">{d}</h2>
                <StatusPill>{items.length}</StatusPill>
              </div>
              <ul className="mt-3 space-y-2">
                {items.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Nothing scheduled
                  </li>
                ) : (
                  items.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-lg border border-border p-3 transition-shadow hover:shadow-card"
                    >
                      <p className="text-xs font-bold text-primary">{a.time}</p>
                      <p className="mt-0.5 truncate text-sm font-semibold">{a.customer}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.type}</p>
                      <div className="mt-2">
                        <StatusPill tone={toneForText(a.status)}>{a.status}</StatusPill>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-bold">All appointments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs font-semibold text-muted-foreground">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Rep</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-secondary/50">
                  <td className="px-5 py-3.5 font-semibold">{a.customer}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{a.type}</td>
                  <td className="px-5 py-3.5">
                    {a.day} · {a.time}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{a.rep}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{a.address}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      <StatusPill tone={toneForText(a.status)}>{a.status}</StatusPill>
                      {a.risk ? <StatusPill tone="danger">{a.risk}</StatusPill> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
