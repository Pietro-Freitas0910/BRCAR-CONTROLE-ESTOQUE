import { Link } from "@tanstack/react-router";
import { Fuel, Gauge, Settings2 } from "lucide-react";
import { formatBRL, formatKm, vehicleTitle, yearLabel } from "@/lib/format";

export interface CatalogVehicle {
  id: string;
  brand: string;
  model: string;
  version: string | null;
  manufacture_year: number | null;
  model_year: number | null;
  mileage: number | null;
  fuel: string | null;
  transmission: string | null;
  color: string | null;
  listed_price: number | null;
  status: string;
  cover_photo_url: string | null;
}

export function VehicleCard({ vehicle }: { vehicle: CatalogVehicle }) {
  return (
    <Link
      to="/veiculo/$id"
      params={{ id: vehicle.id }}
      className="group card-elevated hover-lift block overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {vehicle.cover_photo_url ? (
          <img
            src={vehicle.cover_photo_url}
            alt={vehicleTitle(vehicle)}
            loading="lazy"
            className="size-full object-contain p-1 transition-opacity duration-300 group-hover:opacity-95"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            Sem foto
          </div>
        )}
        {vehicle.status === "reservado" ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-semibold text-ink-foreground">
            Reservado
          </span>
        ) : null}
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="font-display text-lg font-bold leading-tight">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="line-clamp-1 text-sm text-muted-foreground">{vehicle.version ?? "—"}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Gauge className="size-3.5" /> {formatKm(vehicle.mileage)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Fuel className="size-3.5" /> {vehicle.fuel ?? "—"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Settings2 className="size-3.5" /> {vehicle.transmission ?? "—"}
          </span>
        </div>
        <div className="flex items-end justify-between border-t border-border pt-3">
          <span className="text-xs font-semibold text-muted-foreground">{yearLabel(vehicle)}</span>
          <span className="font-display text-xl font-extrabold">
            {formatBRL(vehicle.listed_price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
