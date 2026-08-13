import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { salesQuery, vehiclesQuery } from "@/lib/api";
import { formatBRL, formatPercent, vehicleTitle } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — BR Car Seminovos" },
      { name: "description", content: "Desempenho de vendas, giro e margem por veículo." },
      { property: "og:title", content: "Relatórios — BR Car Seminovos" },
      { property: "og:description", content: "Indicadores de desempenho." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Relatorios,
});

function Relatorios() {
  const vehicles = useQuery(vehiclesQuery);
  const sales = useQuery(salesQuery);

  const list = vehicles.data ?? [];
  const sold = list.filter((v) => v.status === "vendido" || v.status === "entregue");
  const avgTurn = sold.length
    ? Math.round(sold.reduce((s, v) => s + Number(v.fin?.days_in_stock ?? 0), 0) / sold.length)
    : 0;

  const byMonth = (sales.data ?? []).reduce<Record<string, number>>((acc, s) => {
    const key = String(s.sale_date).slice(0, 7);
    acc[key] = (acc[key] ?? 0) + Number(s.sold_value ?? 0);
    return acc;
  }, {});
  const monthData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  const ranking = [...sold]
    .sort((a, b) => Number(b.fin?.real_profit ?? 0) - Number(a.fin?.real_profit ?? 0))
    .slice(0, 10);

  return (
    <>
      <PageHeader title="Relatórios" description="Como o estoque está performando." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Veículos vendidos" value={String(sold.length)} tone="ink" />
        <KpiCard label="Giro médio" value={`${avgTurn} dias`} />
        <KpiCard
          label="Margem média realizada"
          value={formatPercent(
            sold.length
              ? sold.reduce((s, v) => s + Number(v.fin?.expected_margin_pct ?? 0), 0) / sold.length
              : 0,
          )}
          tone="primary"
        />
        <KpiCard
          label="Lucro total"
          value={formatBRL(sold.reduce((s, v) => s + Number(v.fin?.real_profit ?? 0), 0))}
          tone="success"
        />
      </div>

      <div className="card-elevated mt-6 p-6">
        <h2 className="font-display text-lg font-bold">Faturamento por mês</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
              <Tooltip formatter={(v) => formatBRL(Number(v))} />
              <Bar dataKey="total" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-elevated mt-6 p-6">
        <h2 className="font-display text-lg font-bold">Ranking de lucro por veículo</h2>
        <ul className="mt-4 divide-y divide-border">
          {ranking.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-3">
              <span className="text-sm font-semibold">{vehicleTitle(v)}</span>
              <span className="font-display font-bold text-success">
                {formatBRL(v.fin?.real_profit ?? null)}
              </span>
            </li>
          ))}
          {ranking.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground">
              Registre vendas para ver o ranking.
            </li>
          ) : null}
        </ul>
      </div>
    </>
  );
}
