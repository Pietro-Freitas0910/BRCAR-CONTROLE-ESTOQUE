import { cn } from "@/lib/utils";
import { STATUS_LABEL, type VehicleStatus } from "@/lib/format";

const STYLES: Record<VehicleStatus, string> = {
  em_preparacao: "bg-warning/15 text-warning-foreground border-warning/40",
  disponivel: "bg-success/15 text-success border-success/40",
  reservado: "bg-info/15 text-info border-info/40",
  vendido: "bg-primary/20 text-primary-foreground border-primary/50",
  entregue: "bg-muted text-muted-foreground border-border",
  consignado: "bg-accent text-accent-foreground border-border",
};

export function StatusBadge({
  status,
  className,
}: {
  status: VehicleStatus | string;
  className?: string;
}) {
  const key = (status as VehicleStatus) in STATUS_LABEL ? (status as VehicleStatus) : "disponivel";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STYLES[key],
        className,
      )}
    >
      {STATUS_LABEL[key]}
    </span>
  );
}
