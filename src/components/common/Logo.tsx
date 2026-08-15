import { Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Sun className="size-4.5" strokeWidth={2.4} />
      </span>
      <span
        className={cn(
          "font-display text-[17px] font-extrabold tracking-tight",
          tone === "light" ? "text-navy-foreground" : "text-foreground",
        )}
      >
        Solar<span className="text-primary">Peak</span>
      </span>
    </span>
  );
}
