import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Car,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { leadsQuery, settingsQuery, vehiclesQuery } from "@/lib/api";
import { formatBRL, formatDate, STATUS_LABEL, vehicleTitle, type VehicleStatus } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — BR Car Seminovos" },
      { name: "description", content: "Visão geral do estoque, margens e vendas da garagem." },
      { property: "og:title", content: "Painel — BR Car Seminovos" },
      { property: "og:description", content: "Indicadores de estoque e resultado." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Painel,
});

const IN_STOCK: VehicleStatus[] = ["em_preparacao", "disponivel", "reservado", "consignado"];

function Painel() {
  const vehicles = useQuery(vehiclesQuery);
  const leads = useQuery(leadsQuery);
  const settings = useQuery(settingsQuery);

  if (vehicles.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const list = vehicles.data ?? [];
  const staleDays = settings.data?.stale_days ?? 45;
  const inStock = list.filter((v) => IN_STOCK.includes(v.status as VehicleStatus));
  const sold = list.filter((v) => v.status === "vendido" || v.status === "entregue");

  const capitalInvested = inStock.reduce((sum, v) => sum + Number(v.fin?.total_cost ?? 0), 0);
  const expectedProfit = inStock.reduce((sum, v) => sum + Number(v.fin?.expected_profit ?? 0), 0);
  const realProfit = sold.reduce((sum, v) => sum + Number(v.fin?.real_profit ?? 0), 0);
  const avgDays =
    inStock.length > 0
      ? Math.round(
          inStock.reduce((sum, v) => sum + Number(v.fin?.days_in_stock ?? 0), 0) / inStock.length,
        )
      : 0;

  const stale = inStock
    .filter((v) => Number(v.fin?.days_in_stock ?? 0) >= staleDays)
    .sort((a, b) => Number(b.fin?.days_in_stock ?? 0) - Number(a.fin?.days_in_stock ?? 0));

  const byStatus = Object.entries(
    inStock.reduce<Record<string, number>>((acc, v) => {
      acc[v.status] = (acc[v.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([status, total]) => ({
    name: STATUS_LABEL[status as VehicleStatus] ?? status,
    value: total,
  }));

  const marginData = inStock
    .filter((v) => v.fin?.expected_profit != null)
    .sort((a, b) => Number(b.fin?.expected_profit ?? 0) - Number(a.fin?.expected_profit ?? 0))
    .slice(0, 8)
    .map((v) => ({
      name: `${v.brand} ${v.model}`.slice(0, 16),
      lucro: Number(v.fin?.expected_profit ?? 0),
    }));

  const pieColors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  const newLeads = (leads.data ?? []).filter((l) => l.status === "novo");

  return (
    <>
      <PageHeader
        title="Painel"
        description="Resultado da operação em tempo real."
        actions={
          <Button asChild>
            <Link to="/estoque/novo">
              <Plus className="size-4" /> Novo veículo
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Veículos em estoque"
          value={String(inStock.length)}
          hint={`${list.filter((v) => v.status === "disponivel").length} disponíveis`}
          icon={Car}
          tone="ink"
        />
        <KpiCard
          label="Capital investido"
          value={formatBRL(capitalInvested)}
          hint="Compra + despesas dos veículos em estoque"
          icon={Wallet}
        />
        <KpiCard
          label="Lucro previsto"
          value={formatBRL(expectedProfit)}
          hint="Se vender pelo preço anunciado"
          icon={TrendingUp}
          tone="primary"
        />
        <KpiCard
          label="Lucro realizado"
          value={formatBRL(realProfit)}
          hint={`${sold.length} vendas registradas`}
          icon={DollarSign}
          tone="success"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tempo médio em estoque" value={`${avgDays} dias`} icon={Clock} />
        <KpiCard
          label="Parados há +" 
          value={`${stale.length} veículos`}
          hint={`${staleDays} dias ou mais`}
          icon={AlertTriangle}
          tone={stale.length > 0 ? "danger" : "default"}
        />
        <KpiCard label="Leads novos" value={String(newLeads.length)} hint="Vindos do catálogo" />
        <KpiCard
          label="Ticket médio de venda"
          value={formatBRL(
            sold.length ? sold.reduce((s, v) => s + Number(v.fin?.sold_value ?? 0), 0) / sold.length : 0,
          )}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card-elevated p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Lucro previsto por veículo</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={50} dy={10} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                <Tooltip formatter={(v) => formatBRL(Number(v))} />
                <Bar dataKey="lucro" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h2 className="font-display text-lg font-bold">Estoque por situação</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {byStatus.map((entry, i) => (
                    <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1 text-sm">
            {byStatus.map((s, i) => (
              <li key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: pieColors[i % pieColors.length] }}
                  />
                  {s.name}
                </span>
                <span className="font-semibold">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {stale.length > 0 ? (
        <div className="card-elevated mt-6 border-destructive/30 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <AlertTriangle className="size-5 text-destructive" /> Veículos parados
          </h2>
          <p className="text-sm text-muted-foreground">
            Estão há {staleDays} dias ou mais no pátio — considere revisar o preço.
          </p>
          <div className="mt-4 divide-y divide-border">
            {stale.slice(0, 6).map((v) => (
              <Link
                key={v.id}
                to="/estoque/$id"
                params={{ id: v.id }}
                className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{vehicleTitle(v)}</p>
                  <p className="text-xs text-muted-foreground">
                    Entrada em {formatDate(v.fin?.entry_date ?? null)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={v.status} />
                  <span className="font-display text-sm font-bold text-destructive">
                    {v.fin?.days_in_stock ?? 0} dias
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
