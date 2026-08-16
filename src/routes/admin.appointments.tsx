import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatusPill, toneForText } from "@/components/common/StatusPill";
import type { Appointment, AvailabilitySlot, Lead } from "@/data/mock";
import { solarApi } from "@/lib/api";

export const Route = createFileRoute("/admin/appointments")({
  component: AppointmentsPage,
});

const days = ["Today", "Tomorrow", "Mon", "Tue"];

function AppointmentsPage() {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [busySlotId, setBusySlotId] = useState<string | null>(null);

  const bookableLeads = useMemo(
    () => leads.filter((l) => !["appointment", "won", "lost"].includes(l.status)),
    [leads],
  );

  const refresh = async () => {
    const [avail, appts] = await Promise.all([solarApi.getAvailability(), solarApi.getAppointments()]);
    setAvailability(avail || []);
    setAppointments(appts || []);
  };

  useEffect(() => {
    refresh();
    solarApi.getLeads().then((l) => setLeads(l || []));
  }, []);

  async function handleBookSlot(slot: AvailabilitySlot) {
    if (!selectedLeadId) {
      toast.error("Select a lead first, then click an open slot to book it.");
      return;
    }
    setBusySlotId(slot.id);
    try {
      await solarApi.bookSlotFromCalendar(slot.id, selectedLeadId);
      const lead = leads.find((l) => l.id === selectedLeadId);
      toast.success(`Booked ${lead?.name || "lead"} with ${slot.rep} on ${slot.day} at ${slot.time}`);
      setSelectedLeadId("");
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || "Slot could not be booked");
    } finally {
      setBusySlotId(null);
    }
  }

  async function handleCloseSlot(slot: AvailabilitySlot) {
    setBusySlotId(slot.id);
    try {
      await solarApi.updateAvailabilitySlot(slot.id, "closed");
      toast.info(`Closed slot ${slot.day} ${slot.time} for ${slot.rep}`);
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || "Slot could not be closed");
    } finally {
      setBusySlotId(null);
    }
  }

  async function handleReopenSlot(slot: AvailabilitySlot) {
    setBusySlotId(slot.id);
    try {
      await solarApi.updateAvailabilitySlot(slot.id, "open");
      toast.success(`Reopened ${slot.day} ${slot.time} for ${slot.rep}`);
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || "Slot could not be reopened");
    } finally {
      setBusySlotId(null);
    }
  }

  const reps = [...new Set(availability.map((s) => s.rep))];
  const dates = [...new Set(availability.map((s) => s.date))];
  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  return (
    <>
      <PageHeader
        title="Appointments"
        description={`${appointments.length} scheduled · ${bookableLeads.length} bookable leads`}
        actions={
          <Button>
            <CalendarPlus />
            New appointment
          </Button>
        }
      />

      {/* Sales rep availability matrix */}
      <div className="surface-card mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-bold">Sales Rep Availability Matrix</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <StatusPill tone="brand" dot>Auto-booking</StatusPill>
            <span className="hidden sm:inline">· click open slot to book · click closed slot to reopen</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-secondary/30 px-5 py-3">
          <span className="text-xs font-semibold text-muted-foreground">Book lead:</span>
          <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
            <SelectTrigger className="w-full max-w-xs h-9 text-xs">
              <SelectValue placeholder="Select a lead to book…" />
            </SelectTrigger>
            <SelectContent>
              {bookableLeads.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">No bookable leads</div>
              ) : (
                bookableLeads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} · {l.id} · score {l.score}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedLead ? (
            <StatusPill tone="success" dot>
              {selectedLead.name}
            </StatusPill>
          ) : (
            <StatusPill>No lead selected</StatusPill>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs font-semibold text-muted-foreground">
                <th className="px-5 py-3">Rep</th>
                {dates.map((d) => (
                  <th key={d} className="px-3 py-3">
                    {availability.find((s) => s.date === d)?.day || d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reps.map((rep) => (
                <tr key={rep} className="transition-colors hover:bg-secondary/50">
                  <td className="px-5 py-3.5 font-semibold">{rep}</td>
                  {dates.map((d) => {
                    const daySlots = availability
                      .filter((s) => s.rep === rep && s.date === d)
                      .sort((a, b) => a.order - b.order);
                    return (
                      <td key={d} className="px-3 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {daySlots.map((s) =>
                            s.status === "open" ? (
                              <span key={s.id} className="group relative inline-flex">
                                <button
                                  onClick={() => handleBookSlot(s)}
                                  disabled={busySlotId === s.id}
                                  title={
                                    selectedLead
                                      ? `Book ${selectedLead.name} — ${s.day} ${s.time}`
                                      : "Select a lead first, then click to book"
                                  }
                                  className="rounded-md border border-primary/40 bg-primary-soft/40 px-1.5 py-0.5 text-[10px] font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95 disabled:opacity-50"
                                >
                                  {s.time}
                                </button>
                                <button
                                  onClick={() => handleCloseSlot(s)}
                                  disabled={busySlotId === s.id}
                                  title="Close slot (no booking)"
                                  className="absolute -top-1.5 -right-1.5 hidden size-3.5 place-items-center rounded-full border border-border bg-background text-[9px] leading-none text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground group-hover:grid"
                                >
                                  <X className="size-2.5" />
                                </button>
                              </span>
                            ) : (
                              <button
                                key={s.id}
                                onClick={() => handleReopenSlot(s)}
                                disabled={busySlotId === s.id}
                                title="Reopen slot"
                                className="rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground line-through transition-all hover:border-primary/50 hover:text-primary hover:no-underline active:scale-95 disabled:opacity-50"
                              >
                                {s.time}
                              </button>
                            ),
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                    {a.day || a.date} · {a.time}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{a.rep}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{a.address || "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      <StatusPill tone={toneForText(a.status)}>{a.status}</StatusPill>
                      {a.risk ? <StatusPill tone="danger">{a.risk}</StatusPill> : null}
                    </div>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-muted-foreground">
                    No appointments yet — book a lead into an open matrix slot.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
