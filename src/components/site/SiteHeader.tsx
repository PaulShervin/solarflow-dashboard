import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, Phone, ShieldCheck, Sun, User, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/lib/authContext";

const nav = [
  { label: "Home", to: "/" as const },
  { label: "Get Free Estimate", to: "/qualify" as const },
  { label: "Track Installation", to: "/portal" as const },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-transparent px-4 pt-3 pb-1 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/80 bg-white/95 px-5 py-2.5 shadow-sm backdrop-blur-md transition-all sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="shrink-0 transition-transform duration-200 hover:scale-[1.02]">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-emerald-800 font-bold bg-emerald-100/70" }}
                inactiveProps={{ className: "text-slate-600 hover:text-slate-900 hover:bg-slate-100" }}
                className="rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-150"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-3.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Instant AI Quotes Live
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {session?.role === "admin" || session?.role === "consultant" ? (
                <Button variant="outline" size="sm" asChild className="gap-1.5 font-bold border-emerald-300 bg-emerald-50 text-emerald-800 rounded-full">
                  <Link to="/admin">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    Rep Console
                  </Link>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-slate-100/90 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">
                    <div className="size-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                      {(session?.name || "U")[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="max-w-[110px] truncate">{session?.name || "My Account"}</span>
                  </div>
                  <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex rounded-full text-xs font-semibold">
                    <Link to="/portal">My Portal</Link>
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={() => logout()} title="Sign Out" className="rounded-full">
                <LogOut className="size-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-full">
                <Link to="/login">
                  Rep Login
                </Link>
              </Button>

              <Button asChild size="sm" className="font-bold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 py-2 text-xs sm:text-sm">
                <Link to="/qualify">
                  Get Started
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="mt-2 mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white/98 p-4 shadow-xl backdrop-blur-md md:hidden space-y-3">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <div className="px-4 py-2 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Signed in as <strong>{session?.name}</strong></span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{session?.role}</span>
                </div>
                {session?.role === "admin" || session?.role === "consultant" ? (
                  <Button asChild variant="outline" className="w-full rounded-2xl">
                    <Link to="/admin" onClick={() => setOpen(false)}>
                      Rep & Admin Console
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full rounded-2xl">
                    <Link to="/portal" onClick={() => setOpen(false)}>
                      Track My Installation
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" onClick={() => { logout(); setOpen(false); }} className="w-full rounded-2xl text-destructive hover:bg-destructive/10">
                  <LogOut className="size-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full rounded-2xl">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    Rep Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl">
                  <Link to="/qualify" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
