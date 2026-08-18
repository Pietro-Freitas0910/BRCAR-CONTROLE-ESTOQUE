import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, KeyRound, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/AppShell";
import { ImageUploadField } from "@/components/ImageUploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  appSettingsQuery,
  customersQuery,
  garageExpensesQuery,
  profileQuery,
  salesQuery,
  suppliersQuery,
  vehiclesQuery,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { TeamAccessPanel } from "@/components/settings/TeamAccessPanel";
import { exportCsv } from "@/lib/export";
import { formatBRL, vehicleTitle } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — BR Car Seminovos" },
      { name: "description", content: "Loja, catálogo, metas, operação, equipe e backup." },
      { property: "og:title", content: "Configurações — BR Car Seminovos" },
      { property: "og:description", content: "Preferências completas da garagem." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Configuracoes,
});

type FormState = {
  name: string;
  whatsapp: string;
  email: string;
  cnpj: string;
  address: string;
  city: string;
  instagram: string;
  opening_hours: string;
  catalog_headline: string;
  catalog_subheadline: string;
  show_prices: boolean;
  logo_url: string | null;
  catalog_banner_url: string | null;
  stale_days: string;
  doc_alert_days: string;
  min_margin_pct: string;
  default_commission_pct: string;
  monthly_goal_sales: string;
  monthly_goal_revenue: string;
  monthly_goal_profit: string;
  expense_categories: string[];
  garage_expense_categories: string[];
  checklist_template: string[];
};

const EMPTY: FormState = {
  name: "",
  whatsapp: "",
  email: "",
  cnpj: "",
  address: "",
  city: "",
  instagram: "",
  opening_hours: "",
  catalog_headline: "",
  catalog_subheadline: "",
  show_prices: true,
  logo_url: null,
  catalog_banner_url: null,
  stale_days: "45",
  doc_alert_days: "15",
  min_margin_pct: "8",
  default_commission_pct: "0",
  monthly_goal_sales: "0",
  monthly_goal_revenue: "0",
  monthly_goal_profit: "0",
  expense_categories: [],
  garage_expense_categories: [],
  checklist_template: [],
};

function ListEditor({
  label,
  hint,
  items,
  onChange,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold"
          >
            {item}
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-3" />
            </button>
          </span>
        ))}
        {items.length === 0 ? (
          <span className="text-xs text-muted-foreground">Nenhum item cadastrado.</span>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder="Adicionar item"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (draft.trim()) {
                onChange([...items, draft.trim()]);
                setDraft("");
              }
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!draft.trim()) return;
            onChange([...items, draft.trim()]);
            setDraft("");
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function Configuracoes() {
  const queryClient = useQueryClient();
  const { data } = useQuery(appSettingsQuery);
  const { roles, session } = useAuth();
  const profile = useQuery(profileQuery(session?.user.id));
  const vehicles = useQuery(vehiclesQuery);
  const sales = useQuery(salesQuery);
  const customers = useQuery(customersQuery);
  const suppliers = useQuery(suppliersQuery);
  const garageExpenses = useQuery(garageExpensesQuery);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [account, setAccount] = useState({ name: "", phone: "", avatar_url: null as string | null });
  const [password, setPassword] = useState({ next: "", confirm: "" });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? "",
      whatsapp: data.whatsapp ?? "",
      email: data.email ?? "",
      cnpj: data.cnpj ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      instagram: data.instagram ?? "",
      opening_hours: data.opening_hours ?? "",
      catalog_headline: data.catalog_headline ?? "",
      catalog_subheadline: data.catalog_subheadline ?? "",
      show_prices: data.show_prices ?? true,
      logo_url: data.logo_url ?? null,
      catalog_banner_url: data.catalog_banner_url ?? null,
      stale_days: String(data.stale_days ?? 45),
      doc_alert_days: String(data.doc_alert_days ?? 15),
      min_margin_pct: String(data.min_margin_pct ?? 8),
      default_commission_pct: String(data.default_commission_pct ?? 0),
      monthly_goal_sales: String(data.monthly_goal_sales ?? 0),
      monthly_goal_revenue: String(data.monthly_goal_revenue ?? 0),
      monthly_goal_profit: String(data.monthly_goal_profit ?? 0),
      expense_categories: data.expense_categories ?? [],
      garage_expense_categories: data.garage_expense_categories ?? [],
      checklist_template: data.checklist_template ?? [],
    });
  }, [data]);

  useEffect(() => {
    if (!profile.data) return;
    setAccount({
      name: profile.data.name ?? "",
      phone: profile.data.phone ?? "",
      avatar_url: profile.data.avatar_url ?? null,
    });
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async (patch?: Partial<FormState>) => {
      const merged = { ...form, ...(patch ?? {}) };
      const { error } = await db
        .from("garage_settings")
        .update({
          name: merged.name,
          whatsapp: merged.whatsapp,
          email: merged.email || null,
          cnpj: merged.cnpj || null,
          address: merged.address,
          city: merged.city,
          instagram: merged.instagram,
          opening_hours: merged.opening_hours || null,
          catalog_headline: merged.catalog_headline,
          catalog_subheadline: merged.catalog_subheadline || null,
          show_prices: merged.show_prices,
          logo_url: merged.logo_url,
          catalog_banner_url: merged.catalog_banner_url,
          stale_days: Number(merged.stale_days) || 45,
          doc_alert_days: Number(merged.doc_alert_days) || 15,
          min_margin_pct: Number(merged.min_margin_pct) || 0,
          default_commission_pct: Number(merged.default_commission_pct) || 0,
          monthly_goal_sales: Number(merged.monthly_goal_sales) || 0,
          monthly_goal_revenue: Number(merged.monthly_goal_revenue) || 0,
          monthly_goal_profit: Number(merged.monthly_goal_profit) || 0,
          expense_categories: merged.expense_categories,
          garage_expense_categories: merged.garage_expense_categories,
          checklist_template: merged.checklist_template,
        })
        .eq("id", true);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Configurações salvas.");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveAccount = useMutation({
    mutationFn: async (patch?: Partial<typeof account>) => {
      const merged = { ...account, ...(patch ?? {}) };
      if (!session?.user.id) throw new Error("Sessão expirada.");
      const { error } = await db
        .from("profiles")
        .update({ name: merged.name, phone: merged.phone || null, avatar_url: merged.avatar_url })
        .eq("id", session.user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Perfil atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (password.next.length < 8) throw new Error("A senha precisa ter ao menos 8 caracteres.");
      if (password.next !== password.confirm) throw new Error("As senhas não conferem.");
      const { error } = await supabase.auth.updateUser({ password: password.next });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Senha alterada.");
      setPassword({ next: "", confirm: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field = (key: keyof FormState, label: string, type = "text", placeholder?: string) => (
    <div className="space-y-2" key={key}>
      <Label>{label}</Label>
      <Input
        type={type}
        placeholder={placeholder ?? ""}
        value={String(form[key] ?? "")}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Loja, catálogo, metas, operação, equipe, conta e backup dos dados."
        actions={
          <Button onClick={() => save.mutate(undefined)} disabled={save.isPending}>
            <Save className="size-4" /> Salvar alterações
          </Button>
        }
      />

      <Tabs defaultValue="loja">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="loja">Loja</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="metas">Metas e financeiro</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="conta">Minha conta</TabsTrigger>
          {roles.includes("admin") ? <TabsTrigger value="equipe">Equipe</TabsTrigger> : null}
          <TabsTrigger value="dados">Backup e dados</TabsTrigger>
        </TabsList>

        <TabsContent value="loja" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="card-elevated space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Dados da loja</h2>
              {field("name", "Nome da loja")}
              {field("whatsapp", "WhatsApp(s) com DDI (separe dois números com |)")}
              {field("email", "E-mail de contato", "email")}
              {field("cnpj", "CNPJ")}
              {field("address", "Endereço")}
              {field("city", "Cidade")}
              {field("instagram", "Instagram")}
              <div className="space-y-2">
                <Label>Horário de funcionamento</Label>
                <Textarea
                  rows={3}
                  placeholder="Seg a sex 8h–18h · Sáb 8h–13h"
                  value={form.opening_hours}
                  onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                />
              </div>
            </div>
            <div className="card-elevated space-y-6 p-6">
              <h2 className="font-display text-lg font-bold">Identidade visual</h2>
              <ImageUploadField
                label="Logo da loja"
                hint="Usada nos relatórios impressos e no cabeçalho do catálogo."
                folder="branding"
                value={form.logo_url}
                onChange={async (url) => {
                  setForm({ ...form, logo_url: url });
                  await save.mutateAsync({ logo_url: url });
                }}
              />
              <ImageUploadField
                label="Banner do catálogo"
                hint="Imagem de destaque no topo do site público (1920x600 recomendado)."
                folder="branding"
                value={form.catalog_banner_url}
                onChange={async (url) => {
                  setForm({ ...form, catalog_banner_url: url });
                  await save.mutateAsync({ catalog_banner_url: url });
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="catalogo" className="pt-6">
          <div className="card-elevated space-y-4 p-6 lg:max-w-3xl">
            <h2 className="font-display text-lg font-bold">Site público</h2>
            {field("catalog_headline", "Título do catálogo")}
            <div className="space-y-2">
              <Label>Subtítulo do catálogo</Label>
              <Textarea
                rows={3}
                value={form.catalog_subheadline}
                onChange={(e) => setForm({ ...form, catalog_subheadline: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-semibold">Exibir preços no catálogo</p>
                <p className="text-xs text-muted-foreground">
                  Desligue para trabalhar com “consulte o valor” nos anúncios.
                </p>
              </div>
              <Switch
                checked={form.show_prices}
                onCheckedChange={(v) => setForm({ ...form, show_prices: v })}
              />
            </div>
            <Button onClick={() => save.mutate(undefined)} disabled={save.isPending}>
              <Save className="size-4" /> Salvar catálogo
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="metas" className="pt-6">
          <div className="card-elevated grid gap-4 p-6 sm:grid-cols-2 lg:max-w-3xl">
            <h2 className="font-display text-lg font-bold sm:col-span-2">Metas mensais</h2>
            {field("monthly_goal_sales", "Meta de veículos vendidos no mês", "number")}
            {field("monthly_goal_revenue", "Meta de faturamento (R$)", "number")}
            {field("monthly_goal_profit", "Meta de lucro (R$)", "number")}
            {field("min_margin_pct", "Margem mínima aceitável (%)", "number")}
            {field("default_commission_pct", "Comissão padrão do vendedor (%)", "number")}
            <div className="sm:col-span-2">
              <Button onClick={() => save.mutate(undefined)} disabled={save.isPending}>
                <Save className="size-4" /> Salvar metas
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="operacao" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-elevated space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Alertas</h2>
              {field("stale_days", "Alerta de veículo parado (dias)", "number")}
              {field("doc_alert_days", "Alerta de documento vencendo (dias)", "number")}
            </div>
            <div className="card-elevated space-y-6 p-6">
              <h2 className="font-display text-lg font-bold">Listas padrão</h2>
              <ListEditor
                label="Categorias de despesa por veículo"
                items={form.expense_categories}
                onChange={(next) => setForm({ ...form, expense_categories: next })}
              />
              <ListEditor
                label="Categorias de despesa da garagem"
                items={form.garage_expense_categories}
                onChange={(next) => setForm({ ...form, garage_expense_categories: next })}
              />
              <ListEditor
                label="Checklist padrão de preparação"
                hint="Aplicado com um clique em qualquer veículo novo."
                items={form.checklist_template}
                onChange={(next) => setForm({ ...form, checklist_template: next })}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => save.mutate(undefined)} disabled={save.isPending}>
              <Save className="size-4" /> Salvar operação
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="conta" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-elevated space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Meus dados</h2>
              <p className="text-sm text-muted-foreground">{session?.user.email}</p>
              <ImageUploadField
                label="Foto de perfil"
                folder={`avatars/${session?.user.id ?? "user"}`}
                rounded
                value={account.avatar_url}
                onChange={async (url) => {
                  setAccount({ ...account, avatar_url: url });
                  await saveAccount.mutateAsync({ avatar_url: url });
                }}
              />
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={account.name}
                  onChange={(e) => setAccount({ ...account, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={account.phone}
                  onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Papel de acesso: {roles.join(", ") || "sem papel definido"}
              </p>
              <Button onClick={() => saveAccount.mutate(undefined)} disabled={saveAccount.isPending}>
                <Save className="size-4" /> Salvar perfil
              </Button>
            </div>

            <div className="card-elevated space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">Segurança</h2>
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input
                  type="password"
                  value={password.next}
                  onChange={(e) => setPassword({ ...password, next: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar nova senha</Label>
                <Input
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => changePassword.mutate()}
                disabled={changePassword.isPending}
              >
                <KeyRound className="size-4" /> Alterar senha
              </Button>
            </div>
          </div>
        </TabsContent>

        {roles.includes("admin") ? (
          <TabsContent value="equipe" className="pt-6">
            <TeamAccessPanel />
          </TabsContent>
        ) : null}

        <TabsContent value="dados" className="pt-6">
          <div className="card-elevated space-y-4 p-6 lg:max-w-3xl">
            <h2 className="font-display text-lg font-bold">Backup em planilha</h2>
            <p className="text-sm text-muted-foreground">
              Baixe os dados do sistema em CSV (abre no Excel) sempre que quiser guardar uma cópia.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  exportCsv("backup-estoque", vehicles.data ?? [], [
                    { header: "Veículo", value: (v) => vehicleTitle(v) },
                    { header: "Placa", value: (v) => v.plate ?? "" },
                    { header: "Ano fab.", value: (v) => v.manufacture_year ?? "" },
                    { header: "Ano mod.", value: (v) => v.model_year ?? "" },
                    { header: "KM", value: (v) => v.mileage ?? 0 },
                    { header: "Situação", value: (v) => v.status },
                    { header: "Custo total", value: (v) => Number(v.fin?.total_cost ?? 0) },
                    { header: "Preço anunciado", value: (v) => Number(v.listed_price ?? 0) },
                  ])
                }
              >
                <Download className="size-4" /> Estoque
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  exportCsv("backup-vendas", sales.data ?? [], [
                    { header: "Data", value: (s) => String(s.sale_date) },
                    { header: "Valor", value: (s) => Number(s.sold_value ?? 0) },
                    { header: "Comprador", value: (s) => s.buyer_name ?? "" },
                    { header: "Telefone", value: (s) => s.buyer_phone ?? "" },
                    { header: "Pagamento", value: (s) => s.payment_method ?? "" },
                  ])
                }
              >
                <Download className="size-4" /> Vendas
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  exportCsv("backup-clientes", customers.data ?? [], [
                    { header: "Nome", value: (c) => c.name },
                    { header: "Telefone", value: (c) => c.phone ?? "" },
                    { header: "Documento", value: (c) => c.document ?? "" },
                    { header: "Cidade", value: (c) => c.city ?? "" },
                    { header: "E-mail", value: (c) => c.email ?? "" },
                  ])
                }
              >
                <Download className="size-4" /> Clientes
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  exportCsv("backup-fornecedores", suppliers.data ?? [], [
                    { header: "Nome", value: (s) => s.name },
                    { header: "Categoria", value: (s) => s.category ?? "" },
                    { header: "Telefone", value: (s) => s.phone ?? "" },
                    { header: "Cidade", value: (s) => s.city ?? "" },
                  ])
                }
              >
                <Download className="size-4" /> Fornecedores
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  exportCsv("backup-despesas-garagem", garageExpenses.data ?? [], [
                    { header: "Data", value: (e) => String(e.expense_date) },
                    { header: "Categoria", value: (e) => e.category },
                    { header: "Descrição", value: (e) => e.description ?? "" },
                    { header: "Valor", value: (e) => Number(e.value ?? 0) },
                  ])
                }
              >
                <Download className="size-4" /> Despesas da garagem
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Total investido no estoque atual:{" "}
              <strong>
                {formatBRL(
                  (vehicles.data ?? [])
                    .filter((v) => v.status !== "vendido" && v.status !== "entregue")
                    .reduce((s, v) => s + Number(v.fin?.total_cost ?? 0), 0),
                )}
              </strong>
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
