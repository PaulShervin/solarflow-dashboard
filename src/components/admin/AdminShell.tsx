import { useState, type ReactNode } from "react";
import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  Compass,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessagesSquare,
  Menu,
  PhoneCall,
  PieChart,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  UserSquare2,
  X,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/common/StatusPill";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: string;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Operate",
    items: [
      { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/pre-design" as const, label: "Pre-Design Engine", icon: Sun, badge: "Mod 2" },
      { to: "/admin/post-sale" as const, label: "Post-Sale Tracking", icon: Compass, badge: "Mod 4" },
      { to: "/admin/leads" as const, label: "Leads", icon: Users, badge: "23" },
      { to: "/admin/conversations" as const, label: "Conversations", icon: MessagesSquare, badge: "3" },
      { to: "/admin/appointments" as const, label: "Appointments", icon: CalendarDays },
      { to: "/admin/proposals" as const, label: "Proposals", icon: FileText },
      { to: "/admin/customers" as const, label: "Customers", icon: UserSquare2 },
    ],
  },
  {
    label: "Grow",
    items: [
      { to: "/admin/nurture" as const, label: "Nurture Campaigns", icon: Megaphone },
      { to: "/admin/tasks" as const, label: "Tasks", icon: ClipboardCheck, badge: "5" },
      { to: "/admin/call-coaching" as const, label: "Call Coaching", icon: PhoneCall },
      { to: "/admin/reports" as const, label: "Reports", icon: PieChart },
    ],
  },
  {
    label: "Configure",
    items: [{ to: "/admin/settings" as const, label: "Settings", icon: Settings }],
  },
];

export function AdminShell() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  const userInitials = session?.name
    ? session.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "DR";

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/admin">
            <Logo tone="light" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-sidebar-foreground/40 uppercase">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.to
                    : pathname.startsWith(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to as "/admin"}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <item.icon
                          className={cn("size-4 shrink-0", active && "text-sidebar-primary")}
                        />
                        <span className="truncate">{item.label}</span>
                        {item.badge ? (
                          <span className="shrink-0 rounded-full bg-sidebar-primary px-1.5 py-0.5 text-[10px] font-bold text-sidebar-primary-foreground">
                            {item.badge}
                          </span>
                        ) : (
                          <span />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center justify-between rounded-lg px-2 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
                {userInitials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-sidebar-accent-foreground">
                  {session?.name || "Dana Ruiz"}
                </p>
                <p className="truncate text-[10px] text-sidebar-foreground/50 capitalize">
                  Role: {session?.role || "Consultant"}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-sidebar-foreground/70 hover:text-sidebar-accent-foreground size-8"
              title="Sign Out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-navy/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </Button>
            <div className="relative hidden min-w-0 max-w-sm flex-1 sm:block">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search leads, customers, proposals…" className="pl-9" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusPill tone="brand" dot className="hidden sm:inline-flex">
              Auth Active: {session?.email || "admin@solarpeak.com"}
            </StatusPill>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">View customer site</Link>
            </Button>
          </div>
        </header>

        <main className="p-4 pb-24 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate font-display text-xl font-extrabold sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
