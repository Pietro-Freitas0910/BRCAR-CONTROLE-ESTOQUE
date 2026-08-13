import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vehiclesQuery } from "@/lib/api";
import {
  formatBRL,
  formatKm,
  formatPercent,
  STATUS_LABEL,
  STATUS_ORDER,
  vehicleTitle,
  yearLabel,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/estoque/")({
  head: () => ({
    meta: [
      { title: "Estoque — BR Car Seminovos" },
      { name: "description", content: "Todos os veículos, custos e margens do estoque." },
      { property: "og:title", content: "Estoque — BR Car Seminovos" },
      { property: "og:description", content: "Controle de veículos e margens." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Estoque,
});

function Estoque() {
  const { data, isLoading } = useQuery(vehiclesQuery);
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("todos");
  const [view, setView] = useState<"grid" | "table">("grid");

  const filtered = useMemo(() => {
    const q = term.toLowerCase().trim();
    return (data ?? []).filter((v) => {
      const matchTerm =
        !q ||
        `${v.brand} ${v.model} ${v.version ?? ""} ${v.plate ?? ""}`.toLowerCase().includes(q);
      return matchTerm && (status === "todos" || v.status === status);
    });
  }, [data, term, status]);

  return (
    <>
      <PageHeader
        title="Estoque"
        description={`${filtered.length} veículos listados`}
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setView(view === "grid" ? "table" : "grid")}
            >
              {view === "grid" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
            </Button>
            <Button asChild>
              <Link to="/estoque/novo">
                <Plus className="size-4" /> Novo veículo
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full min-w-0 flex-1 sm:min-w-56">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por modelo, versão ou placa"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as situações</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : view === "table" ? (
        <div className="card-elevated overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Custo total</TableHead>
                <TableHead className="text-right">Anunciado</TableHead>
                <TableHead className="text-right">Lucro previsto</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Dias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id} className="cursor-pointer">
                  <TableCell>
                    <Link to="/estoque/$id" params={{ id: v.id }} className="block">
                      <span className="font-semibold">{vehicleTitle(v)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {yearLabel(v)} · {formatKm(v.mileage)} · {v.plate ?? "sem placa"}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(v.fin?.total_cost ?? null)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatBRL(v.listed_price)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      Number(v.fin?.expected_profit ?? 0) < 0 ? "text-destructive" : "text-success"
                    }`}
                  >
                    {formatBRL(v.fin?.expected_profit ?? null)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(v.fin?.expected_margin_pct ?? null)}
                  </TableCell>
                  <TableCell className="text-right">{v.fin?.days_in_stock ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">Nenhum veículo encontrado.</p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <Link
              key={v.id}
              to="/estoque/$id"
              params={{ id: v.id }}
              className="card-elevated hover-lift overflow-hidden"
            >
              <div className="aspect-[16/10] bg-muted">
                {v.cover_photo_url ? (
                  <img src={v.cover_photo_url} alt="" className="size-full object-contain bg-muted p-1" />
                ) : null}
              </div>
              <div className="space-y-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold leading-tight">{vehicleTitle(v)}</h3>
                  <StatusBadge status={v.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {yearLabel(v)} · {formatKm(v.mileage)}
                </p>
                <div className="flex items-end justify-between border-t border-border pt-3">
                  <div>
                    <p className="eyebrow text-muted-foreground">Custo</p>
                    <p className="text-sm font-semibold">{formatBRL(v.fin?.total_cost ?? null)}</p>
                  </div>
                  <div className="text-right">
                    <p className="eyebrow text-muted-foreground">Anunciado</p>
                    <p className="font-display text-lg font-extrabold">
                      {formatBRL(v.listed_price)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
