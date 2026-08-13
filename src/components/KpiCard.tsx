import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "danger" | "ink";
  className?: string;
}) {
  const tones = {
    default: "card-elevated",
    primary: "card-elevated border-primary/40 bg-primary/5",
    success: "card-elevated border-success/30 bg-success/5",
    danger: "card-elevated border-destructive/30 bg-destructive/5",
    ink: "surface-ink rounded-xl border border-sidebar-border",
  } as const;

  return (
    <div className={cn(tones[tone], "p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "eyebrow",
            tone === "ink" ? "text-ink-muted" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {Icon ? (
          <Icon
            className={cn("size-4 shrink-0", tone === "ink" ? "text-primary" : "text-muted-foreground")}
          />
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold tracking-tight lg:text-3xl">{value}</p>
      {hint ? (
        <p
          className={cn(
            "mt-1 text-xs",
            tone === "ink" ? "text-ink-muted" : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
