import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/data/mock";

const pill = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-border bg-secondary text-secondary-foreground",
        brand: "border-primary/25 bg-primary-soft text-primary",
        info: "border-info/25 bg-info-soft text-info",
        success: "border-success/25 bg-primary-soft text-success",
        warning: "border-warning/30 bg-warning-soft text-warning-foreground",
        danger: "border-destructive/25 bg-destructive/10 text-destructive",
      },
      dot: { true: "", false: "" },
    },
    defaultVariants: { tone: "neutral", dot: false },
  },
);

export type StatusPillProps = VariantProps<typeof pill> & {
  children: React.ReactNode;
  className?: string;
  tone?: BadgeTone;
};

export function StatusPill({ tone = "neutral", dot, children, className }: StatusPillProps) {
  return (
    <span className={cn(pill({ tone, dot }), className)}>
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export function toneForText(value: string): BadgeTone {
  const v = value.toLowerCase();
  if (["signed", "won", "paid", "confirmed", "active", "done", "final", "completed", "installed"].some((k) => v.includes(k)))
    return "success";
  if (["pending", "viewed", "sent", "awaiting", "upcoming", "tentative", "submitted", "in progress", "permitting", "scheduled"].some((k) => v.includes(k)))
    return "warning";
  if (["lost", "expired", "critical", "rescheduled", "risk", "paused"].some((k) => v.includes(k))) return "danger";
  if (["new", "draft", "virtual"].some((k) => v.includes(k))) return "info";
  return "neutral";
}
