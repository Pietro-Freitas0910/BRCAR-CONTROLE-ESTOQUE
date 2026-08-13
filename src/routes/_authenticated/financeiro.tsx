import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { garageExpensesQuery, salesQuery, vehiclesQuery } from "@/lib/api";
import { formatBRL, formatDate, vehicleTitle } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — BR Car Seminovos" },
      { name: "description", content: "Faturamento, lucro e despesas fixas da garagem." },
      { property: "og:title", content: "Financeiro — BR Car Seminovos" },
      { property: "og:description", content: "Resultado financeiro da operação." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Financeiro,
});

function Financeiro() {
  const queryClient = useQueryClient();
  const vehicles = useQuery(vehiclesQuery);
  const sales = useQuery(salesQuery);
  const expenses = useQuery(garageExpensesQuery);
  const [form, setForm] = useState({
    category: "Fixa",
    description: "",
    value: "",
    expense_date: new Date().toISOString().slice(0, 10),
  });

  const addExpense = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("garage_expenses").insert({
        category: form.category,
        description: form.description || null,
        value: Number(form.value),
        expense_date: form.expense_date,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Despesa da garagem lançada.");
      setForm({ ...form, description: "", value: "" });
      await queryClient.invalidateQueries({ queryKey: ["garage_expenses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saleList = sales.data ?? [];
  const revenue = saleList.reduce((s, v) => s + Number(v.sold_value ?? 0), 0);
  const grossProfit = (vehicles.data ?? [])
    .filter((v) => v.status === "vendido" || v.status === "entregue")
    .reduce((s, v) => s + Number(v.fin?.real_profit ?? 0), 0);
  const fixedCosts = (expenses.data ?? []).reduce((s, e) => s + Number(e.value), 0);

  return (
    <>
      <PageHeader title="Financeiro" description="Resultado consolidado da operação." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Faturamento" value={formatBRL(revenue)} tone="ink" />
        <KpiCard label="Lucro bruto das vendas" value={formatBRL(grossProfit)} tone="success" />
        <KpiCard label="Despesas da garagem" value={formatBRL(fixedCosts)} tone="danger" />
        <KpiCard label="Resultado líquido" value={formatBRL(grossProfit - fixedCosts)} tone="primary" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card-elevated p-6">
          <h2 className="font-display text-lg font-bold">Vendas registradas</h2>
          <ul className="mt-4 divide-y divide-border">
            {saleList.map((s) => {
              const v = s.vehicles as { brand: string; model: string; version: string | null } | null;
              return (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold">{v ? vehicleTitle(v) : "Veículo"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(s.sale_date)} · {s.buyer_name ?? "cliente"}
                    </p>
                  </div>
                  <span className="font-display font-bold">{formatBRL(s.sold_value)}</span>
                </li>
              );
            })}
            {saleList.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma venda registrada ainda.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="card-elevated p-6">
          <h2 className="font-display text-lg font-bold">Despesas da garagem</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              addExpense.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Aluguel, energia, marketing..."
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  required
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Lançar despesa
            </Button>
          </form>
          <ul className="mt-4 divide-y divide-border">
            {(expenses.data ?? []).slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span>{e.description ?? e.category}</span>
                <span className="font-semibold">{formatBRL(e.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
