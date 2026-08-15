import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Frontend-only demo view switcher. No auth — purely lets a reviewer jump
 * between the customer-facing site and the internal operations app.
 */
export function DemoSwitcher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 print:hidden">
      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-navy/95 p-1 shadow-lift backdrop-blur">
        <span className="hidden px-2.5 text-[10px] font-bold tracking-widest text-navy-foreground/50 uppercase sm:inline">
          Demo
        </span>
        <Link
          to="/"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            !isAdmin
              ? "bg-primary text-primary-foreground"
              : "text-navy-foreground/70 hover:text-navy-foreground",
          )}
        >
          <Globe className="size-3.5" />
          Customer
        </Link>
        <Link
          to="/admin"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            isAdmin
              ? "bg-primary text-primary-foreground"
              : "text-navy-foreground/70 hover:text-navy-foreground",
          )}
        >
          <LayoutDashboard className="size-3.5" />
          Admin
        </Link>
      </div>
    </div>
  );
}
