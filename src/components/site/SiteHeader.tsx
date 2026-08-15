import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, Phone, ShieldCheck, Sun, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { StatusPill } from "@/components/common/StatusPill";
import { useAuth } from "@/lib/authContext";

const nav = [
  { label: "Home", to: "/" as const },
  { label: "Solar Pre-Design", to: "/estimate" as const },
  { label: "60s AI Qualifier", to: "/qualify" as const },
  { label: "Customer Portal", to: "/portal" as const },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="shrink-0 transition-opacity hover:opacity-90">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1.5 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-primary font-bold bg-primary-soft" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-secondary/50" }}
                className="rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href="tel:+14805550170"
            className="hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-primary hover:text-foreground md:inline-flex"
          >
            <Phone className="size-3.5 text-primary" />
            (480) 555-0170
          </a>

          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" asChild className="gap-1.5 font-bold border-primary/40 bg-primary-soft">
                <Link to="/admin">
                  <ShieldCheck className="size-4 text-primary" />
                  Admin Console
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => logout()} title="Sign Out">
                <LogOut className="size-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex gap-1.5 font-semibold">
              <Link to="/login">
                <LogIn className="size-4 text-primary" />
                Sign In
              </Link>
            </Button>
          )}

          <Button asChild size="sm" className="hidden sm:inline-flex font-bold shadow-md bg-primary hover:bg-primary/90">
            <Link to="/estimate">Free Solar Quote →</Link>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background/95 backdrop-blur p-4 lg:hidden space-y-3">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border pt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin" onClick={() => setOpen(false)}>
                  Admin Console ({session?.name})
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link to="/login" onClick={() => setOpen(false)}>
                  Sign In / Employee Login
                </Link>
              </Button>
            )}
            <Button asChild className="w-full">
              <Link to="/estimate" onClick={() => setOpen(false)}>
                Free Solar Quote
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
