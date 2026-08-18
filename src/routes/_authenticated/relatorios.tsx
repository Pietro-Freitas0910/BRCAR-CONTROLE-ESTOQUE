import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { PageHeader } from "@/components/app/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appSettingsQuery, garageExpensesQuery, salesQuery, vehiclesQuery } from "@/lib/api";
import { formatBRL, formatDate, formatPercent, PAYMENT_LABEL, vehicleTitle } from "@/lib/format";
import { exportCsv, exportExcel, htmlKpis, htmlTable, printDocument } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — BR Car Seminovos" },
      { name: "description", content: "Relatório mensal de vendas, margem, giro e exportação." },
      { property: "og:title", content: "Relatórios — BR Car Seminovos" },
      { property: "og:description", content: "Indicadores e exportação de relatórios." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Relatorios,
});

type SaleRow = {
  id: string;
  sale_date: string;
  sold_value: number | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  payment_method: string | null;
  is_financed: boolean | null;
  bank: string | null;
  commission_value: number | null;
  sale_expenses: number | null;
  vehicle_id: string;
  vehicles: {
    brand: string;
    model: string;
    version: string | null;
    manufacture_year: number | null;
    model_year: number | null;
  } | null;
};

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const index = Number(month ?? "1") - 1;
  return `${MONTHS[index] ?? month} / ${year}`;
}

function todayMonth() {
  return new Date().toISOString().slice(0, 7);
}

function Relatorios() {
  const vehicles = useQuery(vehiclesQuery);
  const sales = useQuery(salesQuery);
  const garageExpenses = useQuery(garageExpensesQuery);
  const settings = useQuery(appSettingsQuery);

  const [mode, setMode] = useState<"mes" | "periodo">("mes");
  const [month, setMonth] = useState(todayMonth());
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const allSales = (sales.data ?? []) as unknown as SaleRow[];
  const vehicleList = vehicles.data ?? [];
  const finById = useMemo(
    () => new Map(vehicleList.map((v) => [v.id, v.fin])),
    [vehicleList],
  );

  const range = useMemo(() => {
    if (mode === "mes") {
      const start = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const endDate = new Date(Number(y), Number(m), 0);
      return { start, end: endDate.toISOString().slice(0, 10), label: monthLabel(month) };
    }
    return { start: from, end: to, label: `${formatDate(from)} a ${formatDate(to)}` };
  }, [mode, month, from, to]);

  const periodSales = useMemo(
    () =>
      allSales.filter((s) => {
        const date = String(s.sale_date).slice(0, 10);
        return date >= range.start && date <= range.end;
      }),
    [allSales, range],
  );

  const periodGarageExpenses = useMemo(
    () =>
      (garageExpenses.data ?? []).filter((e) => {
        const date = String(e.expense_date).slice(0, 10);
        return date >= range.start && date <= range.end;
      }),
    [garageExpenses.data, range],
  );

  const revenue = periodSales.reduce((s, v) => s + Number(v.sold_value ?? 0), 0);
  const cost = periodSales.reduce(
    (s, v) => s + Number(finById.get(v.vehicle_id)?.total_cost ?? 0),
    0,
  );
  const commissions = periodSales.reduce((s, v) => s + Number(v.commission_value ?? 0), 0);
  const saleExpenses = periodSales.reduce((s, v) => s + Number(v.sale_expenses ?? 0), 0);
  const grossProfit = revenue - cost - commissions - saleExpenses;
  const fixedCosts = periodGarageExpenses.reduce((s, e) => s + Number(e.value ?? 0), 0);
  const netProfit = grossProfit - fixedCosts;
  const ticket = periodSales.length ? revenue / periodSales.length : 0;
  const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const avgDays = periodSales.length
    ? Math.round(
        periodSales.reduce(
          (s, v) => s + Number(finById.get(v.vehicle_id)?.days_in_stock ?? 0),
          0,
        ) / periodSales.length,
      )
    : 0;

  const goalRevenue = Number(settings.data?.monthly_goal_revenue ?? 0);
  const goalSales = Number(settings.data?.monthly_goal_sales ?? 0);
  const goalProfit = Number(settings.data?.monthly_goal_profit ?? 0);

  const historySeries = useMemo(() => {
    const map = new Map<string, { month: string; receita: number; lucro: number; vendas: number }>();
    allSales.forEach((s) => {
      const key = String(s.sale_date).slice(0, 7);
      const current = map.get(key) ?? { month: key, receita: 0, lucro: 0, vendas: 0 };
      current.receita += Number(s.sold_value ?? 0);
      current.lucro +=
        Number(s.sold_value ?? 0) -
        Number(finById.get(s.vehicle_id)?.total_cost ?? 0) -
        Number(s.commission_value ?? 0) -
        Number(s.sale_expenses ?? 0);
      current.vendas += 1;
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [allSales, finById]);

  const paymentSplit = useMemo(() => {
    const map = new Map<string, number>();
    periodSales.forEach((s) => {
      const key = PAYMENT_LABEL[s.payment_method ?? "outro"] ?? "Outro";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [periodSales]);

  const expenseSplit = useMemo(() => {
    const map = new Map<string, number>();
    periodGarageExpenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.value ?? 0));
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodGarageExpenses]);

  const PIE_COLORS = ["#F5C518", "#111111", "#7c7c7c", "#c9a227", "#4a4a4a", "#e0b400"];

  const rows = periodSales.map((s) => {
    const fin = finById.get(s.vehicle_id);
    const profit =
      Number(s.sold_value ?? 0) -
      Number(fin?.total_cost ?? 0) -
      Number(s.commission_value ?? 0) -
      Number(s.sale_expenses ?? 0);
    return {
      date: String(s.sale_date).slice(0, 10),
      vehicle: s.vehicles ? vehicleTitle(s.vehicles) : "Veículo",
      year: s.vehicles
        ? `${s.vehicles.manufacture_year ?? "—"}/${s.vehicles.model_year ?? "—"}`
        : "—",
      buyer: s.buyer_name ?? "—",
      phone: s.buyer_phone ?? "—",
      payment: PAYMENT_LABEL[s.payment_method ?? "outro"] ?? "—",
      cost: Number(fin?.total_cost ?? 0),
      commission: Number(s.commission_value ?? 0),
      expenses: Number(s.sale_expenses ?? 0),
      value: Number(s.sold_value ?? 0),
      profit,
      margin: Number(s.sold_value ?? 0) > 0 ? (profit / Number(s.sold_value)) * 100 : 0,
      days: Number(fin?.days_in_stock ?? 0),
    };
  });

  const columns = [
    { header: "Data", value: (r: (typeof rows)[number]) => formatDate(r.date) },
    { header: "Veículo", value: (r: (typeof rows)[number]) => r.vehicle },
    { header: "Ano", value: (r: (typeof rows)[number]) => r.year },
    { header: "Comprador", value: (r: (typeof rows)[number]) => r.buyer },
    { header: "Telefone", value: (r: (typeof rows)[number]) => r.phone },
    { header: "Pagamento", value: (r: (typeof rows)[number]) => r.payment },
    { header: "Custo total", value: (r: (typeof rows)[number]) => r.cost },
    { header: "Comissão", value: (r: (typeof rows)[number]) => r.commission },
    { header: "Despesas da venda", value: (r: (typeof rows)[number]) => r.expenses },
    { header: "Valor vendido", value: (r: (typeof rows)[number]) => r.value },
    { header: "Lucro", value: (r: (typeof rows)[number]) => r.profit },
    { header: "Margem %", value: (r: (typeof rows)[number]) => r.margin.toFixed(1) },
    { header: "Dias em estoque", value: (r: (typeof rows)[number]) => r.days },
  ];

  const fileName = `relatorio-vendas-${mode === "mes" ? month : `${range.start}_a_${range.end}`}`;

  const print = () => {
    const kpis = htmlKpis([
      { label: "Vendas", value: String(periodSales.length) },
      { label: "Faturamento", value: formatBRL(revenue) },
      { label: "Lucro bruto", value: formatBRL(grossProfit) },
      { label: "Despesas fixas", value: formatBRL(fixedCosts) },
      { label: "Resultado líquido", value: formatBRL(netProfit) },
      { label: "Ticket médio", value: formatBRL(ticket) },
      { label: "Margem média", value: formatPercent(marginPct) },
      { label: "Giro médio", value: `${avgDays} dias` },
    ]);
    const salesTable = htmlTable(
      ["Data", "Veículo", "Comprador", "Pagamento", "Custo", "Venda", "Lucro", "Margem"],
      rows.map((r) => [
        formatDate(r.date),
        r.vehicle,
        r.buyer,
        r.payment,
        formatBRL(r.cost),
        formatBRL(r.value),
        formatBRL(r.profit),
        formatPercent(r.margin),
      ]),
      ["", "", "", "Totais", formatBRL(cost), formatBRL(revenue), formatBRL(grossProfit), formatPercent(marginPct)],
    );
    const expensesTable = expenseSplit.length
      ? `<h2>Despesas fixas da garagem</h2>${htmlTable(
          ["Categoria", "Valor"],
          expenseSplit.map((e) => [e.name, formatBRL(e.value)]),
          ["Total", formatBRL(fixedCosts)],
        )}`
      : "";
    const dre = htmlTable(
      ["DRE do período", "Valor"],
      [
        ["(+) Faturamento", formatBRL(revenue)],
        ["(-) Custo dos veículos vendidos", formatBRL(cost)],
        ["(-) Comissões", formatBRL(commissions)],
        ["(-) Despesas das vendas", formatBRL(saleExpenses)],
        ["(=) Lucro bruto", formatBRL(grossProfit)],
        ["(-) Despesas fixas", formatBRL(fixedCosts)],
      ],
      ["(=) Resultado líquido", formatBRL(netProfit)],
    );
    printDocument(
      `${settings.data?.name ?? "BR Car Seminovos"} — Relatório de vendas · ${range.label}`,
      `${kpis}<h2>Vendas do período</h2>${salesTable}${expensesTable}<h2>Resultado</h2>${dre}`,
      settings.data?.logo_url ?? null,
    );
  };

  return (
    <>
      <PageHeader
        title="Relatórios"
        description={`Período analisado: ${range.label}`}
        actions={
          <>
            <Button variant="outline" onClick={() => exportCsv(fileName, rows, columns)}>
              <Download className="size-4" /> CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportExcel(fileName, `Relatório de vendas — ${range.label}`, rows, columns)
              }
            >
              <FileSpreadsheet className="size-4" /> Excel
            </Button>
            <Button onClick={print}>
              <Printer className="size-4" /> Imprimir / PDF
            </Button>
          </>
        }
      />

      <div className="card-elevated mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="space-y-2">
          <Label>Tipo de período</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "mes" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("mes")}
            >
              Por mês
            </Button>
            <Button
              type="button"
              variant={mode === "periodo" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("periodo")}
            >
              Personalizado
            </Button>
          </div>
        </div>
        {mode === "mes" ? (
          <div className="space-y-2">
            <Label>Mês</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-48"
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>De</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-2">
              <Label>Até</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-44"
              />
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Vendas no período"
          value={String(periodSales.length)}
          {...(goalSales ? { hint: `Meta: ${goalSales} · ${formatPercent((periodSales.length / goalSales) * 100)}` } : {})}
          tone="ink"
        />
        <KpiCard
          label="Faturamento"
          value={formatBRL(revenue)}
          hint={goalRevenue ? `Meta: ${formatBRL(goalRevenue)}` : `Ticket médio ${formatBRL(ticket)}`}
          tone="primary"
        />
        <KpiCard
          label="Lucro bruto"
          value={formatBRL(grossProfit)}
          hint={`Margem ${formatPercent(marginPct)}`}
          tone={grossProfit < 0 ? "danger" : "success"}
        />
        <KpiCard
          label="Resultado líquido"
          value={formatBRL(netProfit)}
          hint={goalProfit ? `Meta de lucro: ${formatBRL(goalProfit)}` : `Giro médio ${avgDays} dias`}
          tone={netProfit < 0 ? "danger" : "success"}
        />
      </div>

      <Tabs defaultValue="vendas" className="mt-6">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="vendas">Vendas ({periodSales.length})</TabsTrigger>
          <TabsTrigger value="dre">DRE do período</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução mensal</TabsTrigger>
          <TabsTrigger value="estoque">Estoque atual</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="pt-6">
          <div className="card-elevated overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">Giro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, index) => (
                  <TableRow key={`${r.date}-${index}`}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell className="font-semibold">{r.vehicle}</TableCell>
                    <TableCell>{r.buyer}</TableCell>
                    <TableCell>{r.payment}</TableCell>
                    <TableCell className="text-right">{formatBRL(r.cost)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatBRL(r.value)}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${r.profit < 0 ? "text-destructive" : "text-success"}`}
                    >
                      {formatBRL(r.profit)}
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(r.margin)}</TableCell>
                    <TableCell className="text-right">{r.days} d</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      Nenhuma venda registrada neste período.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="dre" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="card-elevated p-6">
              <h2 className="font-display text-lg font-bold">DRE — {range.label}</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  ["(+) Faturamento", revenue],
                  ["(-) Custo dos veículos vendidos", -cost],
                  ["(-) Comissões", -commissions],
                  ["(-) Despesas das vendas", -saleExpenses],
                  ["(=) Lucro bruto", grossProfit],
                  ["(-) Despesas fixas da garagem", -fixedCosts],
                ].map(([label, value]) => (
                  <li key={String(label)} className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{formatBRL(Number(value))}</span>
                  </li>
                ))}
                <li className="flex justify-between pt-2">
                  <span className="font-semibold">(=) Resultado líquido</span>
                  <span
                    className={`font-display text-xl font-extrabold ${netProfit < 0 ? "text-destructive" : "text-success"}`}
                  >
                    {formatBRL(netProfit)}
                  </span>
                </li>
              </ul>
            </div>

            <div className="card-elevated p-6">
              <h2 className="font-display text-lg font-bold">Despesas fixas por categoria</h2>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseSplit} dataKey="value" nameKey="name" outerRadius={80}>
                      {expenseSplit.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatBRL(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {expenseSplit.map((e) => (
                  <li key={e.name} className="flex justify-between">
                    <span className="text-muted-foreground">{e.name}</span>
                    <span className="font-semibold">{formatBRL(e.value)}</span>
                  </li>
                ))}
                {expenseSplit.length === 0 ? (
                  <li className="py-4 text-center text-muted-foreground">
                    Nenhuma despesa fixa no período.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evolucao" className="pt-6">
          <div className="card-elevated p-6">
            <h2 className="font-display text-lg font-bold">Faturamento e lucro (12 meses)</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                  />
                  <Tooltip formatter={(v) => formatBRL(Number(v))} />
                  <Bar dataKey="receita" name="Faturamento" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="lucro" name="Lucro" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="vendas"
                    name="Veículos vendidos"
                    stroke="var(--color-chart-1)"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  exportCsv("evolucao-mensal", historySeries, [
                    { header: "Mês", value: (r) => monthLabel(r.month) },
                    { header: "Vendas", value: (r) => r.vendas },
                    { header: "Faturamento", value: (r) => r.receita },
                    { header: "Lucro", value: (r) => r.lucro },
                  ])
                }
              >
                <Download className="size-4" /> Exportar evolução
              </Button>
            </div>
          </div>

          <div className="card-elevated mt-6 p-6">
            <h2 className="font-display text-lg font-bold">Formas de pagamento no período</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentSplit} dataKey="value" nameKey="name" outerRadius={80} label>
                    {paymentSplit.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="estoque" className="pt-6">
          <div className="card-elevated overflow-x-auto p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-0">
              <h2 className="font-display text-lg font-bold">Posição de estoque</h2>
              <Button
                variant="outline"
                onClick={() =>
                  exportCsv(
                    "posicao-estoque",
                    vehicleList.filter((v) => v.status !== "vendido" && v.status !== "entregue"),
                    [
                      { header: "Veículo", value: (v) => vehicleTitle(v) },
                      { header: "Placa", value: (v) => v.plate ?? "" },
                      { header: "Situação", value: (v) => v.status },
                      { header: "Custo total", value: (v) => Number(v.fin?.total_cost ?? 0) },
                      { header: "Preço anunciado", value: (v) => Number(v.listed_price ?? 0) },
                      { header: "Lucro previsto", value: (v) => Number(v.fin?.expected_profit ?? 0) },
                      { header: "Dias em estoque", value: (v) => Number(v.fin?.days_in_stock ?? 0) },
                    ],
                  )
                }
              >
                <Download className="size-4" /> Exportar estoque
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Anunciado</TableHead>
                  <TableHead className="text-right">Lucro previsto</TableHead>
                  <TableHead className="text-right">Dias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleList
                  .filter((v) => v.status !== "vendido" && v.status !== "entregue")
                  .map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-semibold">{vehicleTitle(v)}</TableCell>
                      <TableCell className="text-right">{formatBRL(v.fin?.total_cost ?? null)}</TableCell>
                      <TableCell className="text-right">{formatBRL(v.listed_price)}</TableCell>
                      <TableCell className="text-right">
                        {formatBRL(v.fin?.expected_profit ?? null)}
                      </TableCell>
                      <TableCell className="text-right">{v.fin?.days_in_stock ?? 0} d</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
