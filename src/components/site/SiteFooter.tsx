import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/common/Logo";

const columns = [
  {
    title: "Company",
    links: ["About SolarPeak", "Our installers", "Careers", "Press"],
  },
  {
    title: "Solutions",
    links: ["Home solar", "Battery storage", "EV charging", "Roof replacement"],
  },
  {
    title: "Resources",
    links: ["Savings calculator", "Financing options", "Incentives guide", "Warranty"],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-navy text-navy-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="min-w-0">
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-foreground/65">
              Residential solar design, installation and service across Arizona. Licensed,
              bonded and insured. ROC #331204.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-navy-foreground/70">
              <span className="rounded-md border border-navy-foreground/15 px-2.5 py-1">
                25-yr warranty
              </span>
              <span className="rounded-md border border-navy-foreground/15 px-2.5 py-1">
                NABCEP certified
              </span>
              <span className="rounded-md border border-navy-foreground/15 px-2.5 py-1">
                4.9 / 5 · 1,240 reviews
              </span>
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title} className="min-w-0">
              <h3 className="text-sm font-bold text-navy-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <span className="cursor-pointer text-sm text-navy-foreground/65 transition-colors hover:text-navy-foreground">
                      {l}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-navy-foreground/10 pt-6 text-xs text-navy-foreground/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SolarPeak Energy. All rights reserved. Savings figures are illustrative.</p>
          <div className="flex flex-wrap gap-5">
            <span className="cursor-pointer hover:text-navy-foreground">Privacy</span>
            <span className="cursor-pointer hover:text-navy-foreground">Terms</span>
            <Link to="/admin" className="hover:text-navy-foreground">
              Team login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
