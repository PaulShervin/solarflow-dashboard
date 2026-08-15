import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";

const nav = [
  { label: "Home", to: "/" as const },
  { label: "Get an estimate", to: "/estimate" as const },
  { label: "Talk to the assistant", to: "/qualify" as const },
  { label: "My project", to: "/portal" as const },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-foreground bg-secondary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="tel:+14805550170"
            className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            <Phone className="size-4" />
            (480) 555-0170
          </a>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/qualify">Get My Free Estimate</Link>
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
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col p-3">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="mt-2">
              <Link to="/qualify" onClick={() => setOpen(false)}>
                Get My Free Estimate
              </Link>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
