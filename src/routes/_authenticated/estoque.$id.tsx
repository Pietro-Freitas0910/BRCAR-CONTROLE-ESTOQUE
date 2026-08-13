import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, MessageCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { KpiCard } from "@/components/KpiCard";
import { VehicleForm, toVehiclePayload, type VehicleFormValues } from "@/components/app/VehicleForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { customersQuery, settingsQuery, vehicleQuery } from "@/lib/api";
import {
  DOC_STATUS_LABEL,
  ENTRY_TYPE_LABEL,
  formatBRL,
  formatDate,
  formatDateTime,
  formatKm,
  formatPercent,
  PAYMENT_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  vehicleTitle,
  yearLabel,
} from "@/lib/format";
import { buildVehicleMessage } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const Route = createFileRoute("/_authenticated/estoque/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do veículo — BR Car Seminovos" },
      { name: "description", content: "Custos, despesas, documentos e venda do veículo." },
      { property: "og:title", content: "Ficha do veículo — BR Car Seminovos" },
      { property: "og:description", content: "Gestão completa do veículo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VehicleDetail,
});

const EXPENSE_CATEGORIES = [
  "Mecânica",
  "Funilaria",
  "Pintura",
  "Pneus",
  "Higienização",
  "Documentação",
  "Comissão",
  "Marketing",
  "Outros",
];

function VehicleDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(vehicleQuery(id));
  const customers = useQuery(customersQuery);
  const settings = useQuery(settingsQuery);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["vehicle", id] });
    await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const [expense, setExpense] = useState({
    category: "Mecânica",
    description: "",
    value: "",
    expense_date: new Date().toISOString().slice(0, 10),
  });
  const [checkItem, setCheckItem] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [doc, setDoc] = useState({ doc_type: "", status: "pendente", due_date: "" });
  const [entry, setEntry] = useState({
    entry_type: "compra_direta",
    purchase_value: "",
    entry_date: new Date().toISOString().slice(0, 10),
    seller_name: "",
    seller_phone: "",
    payment_method: "a_vista",
    notes: "",
  });
  const [sale, setSale] = useState({
    sold_value: "",
    sale_date: new Date().toISOString().slice(0, 10),
    customer_id: "",
    buyer_name: "",
    buyer_phone: "",
    payment_method: "a_vista",
    commission_value: "",
    sale_expenses: "",
    notes: "",
  });

  const addExpense = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vehicle_expenses").insert({
        vehicle_id: id,
        category: expense.category,
        description: expense.description || null,
        value: Number(expense.value),
        expense_date: expense.expense_date,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Despesa lançada.");
      setExpense({ ...expense, description: "", value: "" });
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveEntry = useMutation({
    mutationFn: async () => {
      const payload = {
        vehicle_id: id,
        entry_type: entry.entry_type as "compra_direta" | "troca" | "consignacao",
        purchase_value: Number(entry.purchase_value),
        entry_date: entry.entry_date,
        seller_name: entry.seller_name || null,
        seller_phone: entry.seller_phone || null,
        payment_method: entry.payment_method as "a_vista",
        notes: entry.notes || null,
      };
      const { error } = data?.entry
        ? await supabase.from("vehicle_entries").update(payload).eq("id", data.entry.id)
        : await supabase.from("vehicle_entries").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Entrada registrada.");
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const registerSale = useMutation({
    mutationFn: async () => {
      const payload = {
        vehicle_id: id,
        sold_value: Number(sale.sold_value),
        sale_date: sale.sale_date,
        customer_id: sale.customer_id || null,
        buyer_name: sale.buyer_name || null,
        buyer_phone: sale.buyer_phone || null,
        payment_method: sale.payment_method as "a_vista",
        commission_value: sale.commission_value ? Number(sale.commission_value) : 0,
        sale_expenses: sale.sale_expenses ? Number(sale.sale_expenses) : 0,
        notes: sale.notes || null,
      };
      const { error } = data?.sale
        ? await supabase.from("vehicle_sales").update(payload).eq("id", data.sale.id)
        : await supabase.from("vehicle_sales").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Venda registrada!");
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateVehicle = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      const { error } = await supabase.from("vehicles").update(toVehiclePayload(values)).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Dados atualizados.");
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("vehicles")
        .update({ status: status as "disponivel" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const removeVehicle = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("vehicles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Veículo arquivado.");
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      void navigate({ to: "/estoque" });
    },
  });

  const simpleInsert = useMutation({
    mutationFn: async (action: "check" | "doc") => {
      if (action === "check") {
        const { error } = await supabase
          .from("vehicle_checklist")
          .insert({ vehicle_id: id, item: checkItem, position: (data?.checklist.length ?? 0) + 1 });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("vehicle_documents").insert({
          vehicle_id: id,
          doc_type: doc.doc_type,
          status: doc.status as "pendente",
          due_date: doc.due_date || null,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      setCheckItem("");
      setDoc({ doc_type: "", status: "pendente", due_date: "" });
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadPhotos = useMutation({
    mutationFn: async () => {
      if (photoFiles.length === 0) throw new Error("Selecione pelo menos uma foto.");
      const currentCount = data?.photos.length ?? 0;
      const rows: { vehicle_id: string; url: string; position: number; is_cover: boolean }[] = [];

      for (let index = 0; index < photoFiles.length; index += 1) {
        const file = photoFiles[index];
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${id}/${Date.now()}-${index}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("vehicle-photos")
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (uploadError) throw new Error(`Erro ao enviar ${file.name}: ${uploadError.message}`);

        const { data: publicData } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
        rows.push({
          vehicle_id: id,
          url: publicData.publicUrl,
          position: currentCount + index,
          is_cover: currentCount === 0 && index === 0,
        });
      }

      const { error: insertError } = await supabase.from("vehicle_photos").insert(rows);
      if (insertError) throw new Error(insertError.message);

      if (currentCount === 0) {
        const { error: coverError } = await supabase
          .from("vehicles")
          .update({ cover_photo_url: rows[0].url })
          .eq("id", id);
        if (coverError) throw new Error(coverError.message);
      }
    },
    onSuccess: async () => {
      toast.success("Fotos adicionadas.");
      setPhotoFiles([]);
      const input = document.getElementById("gallery-upload") as HTMLInputElement | null;
      if (input) input.value = "";
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleCheck = useMutation({
    mutationFn: async ({ checkId, done }: { checkId: string; done: boolean }) => {
      const { error } = await supabase
        .from("vehicle_checklist")
        .update({ done, done_at: done ? new Date().toISOString() : null })
        .eq("id", checkId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const deleteRow = useMutation({
    mutationFn: async ({ table, rowId }: { table: "vehicle_expenses" | "vehicle_photos" | "vehicle_checklist" | "vehicle_documents"; rowId: string }) => {
      const { error } = await supabase.from(table).delete().eq("id", rowId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  if (isLoading || !data || !data.vehicle) return <Skeleton className="h-96 w-full rounded-xl" />;

  const { fin, photos, docs, expenses, checklist, history } = data;
  const vehicle = data.vehicle;
  const doneChecks = checklist.filter((c) => c.done).length;

  const formInitial: VehicleFormValues = {
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version ?? "",
    manufacture_year: vehicle.manufacture_year?.toString() ?? "",
    model_year: vehicle.model_year?.toString() ?? "",
    plate: vehicle.plate ?? "",
    color: vehicle.color ?? "",
    mileage: vehicle.mileage?.toString() ?? "",
    fuel: vehicle.fuel ?? "Flex",
    transmission: vehicle.transmission ?? "Automático",
    doors: vehicle.doors?.toString() ?? "",
    engine: vehicle.engine ?? "",
    category: vehicle.category ?? "",
    status: vehicle.status,
    listed_price: vehicle.listed_price?.toString() ?? "",
    minimum_price: vehicle.minimum_price?.toString() ?? "",
    target_price: vehicle.target_price?.toString() ?? "",
    optionals: vehicle.optionals.join(", "),
    notes: vehicle.notes ?? "",
    chassi: vehicle.chassi ?? "",
    renavam: vehicle.renavam ?? "",
  };

  return (
    <>
      <Link
        to="/estoque"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Voltar ao estoque
      </Link>

      <PageHeader
        title={vehicleTitle(vehicle)}
        description={`${yearLabel(vehicle)} · ${formatKm(vehicle.mileage)} · ${vehicle.plate ?? "sem placa"}`}
        actions={
          <>
            <Select value={vehicle.status} onValueChange={(v) => changeStatus.mutate(v)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <WhatsAppButton
              message={buildVehicleMessage(vehicle)}
              phones={settings.data?.whatsapp}
              label="Enviar anúncio"
              variant="outline"
            />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Custo total" value={formatBRL(fin?.total_cost ?? null)} tone="ink" />
        <KpiCard
          label="Despesas"
          value={formatBRL(fin?.total_expenses ?? null)}
          hint={`${expenses.length} lançamentos`}
        />
        <KpiCard
          label={vehicle.status === "vendido" ? "Lucro real" : "Lucro previsto"}
          value={formatBRL(
            vehicle.status === "vendido" ? (fin?.real_profit ?? null) : (fin?.expected_profit ?? null),
          )}
          hint={`Margem ${formatPercent(fin?.expected_margin_pct ?? null)}`}
          tone={
            Number(
              vehicle.status === "vendido" ? (fin?.real_profit ?? 0) : (fin?.expected_profit ?? 0),
            ) < 0
              ? "danger"
              : "success"
          }
        />
        <KpiCard
          label="Dias em estoque"
          value={`${fin?.days_in_stock ?? 0}`}
          hint={`Entrada ${formatDate(fin?.entry_date ?? null)}`}
        />
      </div>

      <Tabs defaultValue="resumo" className="mt-6">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="entrada">Entrada</TabsTrigger>
          <TabsTrigger value="despesas">Despesas ({expenses.length})</TabsTrigger>
          <TabsTrigger value="preparacao">
            Preparação ({doneChecks}/{checklist.length})
          </TabsTrigger>
          <TabsTrigger value="fotos">Fotos ({photos.length})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({docs.length})</TabsTrigger>
          <TabsTrigger value="venda">Venda</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="editar">Editar</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="card-elevated overflow-hidden">
              <div className="aspect-[16/10] bg-muted">
                {vehicle.cover_photo_url ? (
                  <img src={vehicle.cover_photo_url} alt="" className="size-full object-contain bg-muted" />
                ) : null}
              </div>
              <div className="p-6">
                <StatusBadge status={vehicle.status} />
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Preço anunciado", formatBRL(vehicle.listed_price)],
                    ["Preço alvo", formatBRL(vehicle.target_price)],
                    ["Preço mínimo", formatBRL(vehicle.minimum_price)],
                    ["Cor", vehicle.color ?? "—"],
                    ["Câmbio", vehicle.transmission ?? "—"],
                    ["Combustível", vehicle.fuel ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="eyebrow text-muted-foreground">{label}</dt>
                      <dd className="mt-1 text-sm font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
                {vehicle.notes ? (
                  <p className="mt-4 text-sm text-muted-foreground">{vehicle.notes}</p>
                ) : null}
              </div>
            </div>

            <div className="card-elevated p-6">
              <h2 className="font-display text-lg font-bold">Composição do custo</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Valor de compra</span>
                  <span className="font-semibold">{formatBRL(fin?.entry_value ?? null)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Despesas de preparação</span>
                  <span className="font-semibold">{formatBRL(fin?.total_expenses ?? null)}</span>
                </li>
                <li className="flex justify-between border-t border-border pt-3">
                  <span className="font-semibold">Custo total</span>
                  <span className="font-display text-lg font-extrabold">
                    {formatBRL(fin?.total_cost ?? null)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Preço anunciado</span>
                  <span className="font-semibold">{formatBRL(vehicle.listed_price)}</span>
                </li>
                <li className="flex justify-between border-t border-border pt-3">
                  <span className="font-semibold">Lucro previsto</span>
                  <span className="font-display text-lg font-extrabold text-success">
                    {formatBRL(fin?.expected_profit ?? null)}
                  </span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="mt-6 w-full text-destructive"
                onClick={() => removeVehicle.mutate()}
              >
                Arquivar veículo
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="entrada" className="pt-6">
          <form
            className="card-elevated grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveEntry.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Tipo de entrada</Label>
              <Select
                value={data.entry?.entry_type ?? entry.entry_type}
                onValueChange={(v) => setEntry({ ...entry, entry_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENTRY_TYPE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor de compra (R$)</Label>
              <Input
                type="number"
                required
                value={entry.purchase_value || (data.entry?.purchase_value?.toString() ?? "")}
                onChange={(e) => setEntry({ ...entry, purchase_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de entrada</Label>
              <Input
                type="date"
                value={entry.entry_date}
                onChange={(e) => setEntry({ ...entry, entry_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Vendedor / origem</Label>
              <Input
                value={entry.seller_name}
                onChange={(e) => setEntry({ ...entry, seller_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={entry.seller_phone}
                onChange={(e) => setEntry({ ...entry, seller_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select
                value={entry.payment_method}
                onValueChange={(v) => setEntry({ ...entry, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={saveEntry.isPending}>
                {data.entry ? "Atualizar entrada" : "Registrar entrada"}
              </Button>
              {data.entry ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Entrada atual: {formatBRL(data.entry.purchase_value)} em{" "}
                  {formatDate(data.entry.entry_date)}
                </p>
              ) : null}
            </div>
          </form>
        </TabsContent>

        <TabsContent value="despesas" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form
              className="card-elevated space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                addExpense.mutate();
              }}
            >
              <h2 className="font-display text-lg font-bold">Nova despesa</h2>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={expense.category}
                  onValueChange={(v) => setExpense({ ...expense, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={expense.description}
                  onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    required
                    value={expense.value}
                    onChange={(e) => setExpense({ ...expense, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={expense.expense_date}
                    onChange={(e) => setExpense({ ...expense, expense_date: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={addExpense.isPending}>
                <Plus className="size-4" /> Lançar despesa
              </Button>
            </form>

            <div className="card-elevated p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Lançamentos</h2>
                <span className="font-display text-lg font-extrabold">
                  {formatBRL(fin?.total_expenses ?? null)}
                </span>
              </div>
              <ul className="mt-4 divide-y divide-border">
                {expenses.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {e.category}
                        {e.description ? ` — ${e.description}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.expense_date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatBRL(e.value)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRow.mutate({ table: "vehicle_expenses", rowId: e.id })}
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </li>
                ))}
                {expenses.length === 0 ? (
                  <li className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma despesa lançada.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preparacao" className="pt-6">
          <div className="card-elevated p-6">
            <h2 className="font-display text-lg font-bold">Checklist de preparação</h2>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                simpleInsert.mutate("check");
              }}
            >
              <Input
                value={checkItem}
                onChange={(e) => setCheckItem(e.target.value)}
                placeholder="Ex.: Alinhamento e balanceamento"
                required
              />
              <Button type="submit">
                <Plus className="size-4" />
              </Button>
            </form>
            <ul className="mt-4 divide-y divide-border">
              {checklist.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <Checkbox
                    checked={c.done}
                    onCheckedChange={(value) =>
                      toggleCheck.mutate({ checkId: c.id, done: Boolean(value) })
                    }
                  />
                  <span className={`flex-1 text-sm ${c.done ? "text-muted-foreground line-through" : ""}`}>
                    {c.item}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow.mutate({ table: "vehicle_checklist", rowId: c.id })}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
              {checklist.length === 0 ? (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum item de preparação cadastrado.
                </li>
              ) : null}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="fotos" className="pt-6">
          <div className="card-elevated p-6">
            <h2 className="font-display text-lg font-bold">Galeria do anúncio</h2>
            <div className="mt-4 space-y-3">
              <Label htmlFor="gallery-upload">Adicionar fotos da galeria</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="gallery-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                />
                <Button
                  type="button"
                  disabled={uploadPhotos.isPending || photoFiles.length === 0}
                  onClick={() => uploadPhotos.mutate()}
                >
                  <ImagePlus className="mr-2 size-4" />
                  {uploadPhotos.isPending ? "Enviando..." : "Enviar fotos"}
                </Button>
              </div>
              {photoFiles.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {photoFiles.length} foto{photoFiles.length > 1 ? "s" : ""} selecionada{photoFiles.length > 1 ? "s" : ""}.
                </p>
              ) : null}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((p) => (
                <div key={p.id} className="group relative overflow-hidden rounded-lg border border-border">
                  <img src={p.url} alt="" className="aspect-[4/3] w-full object-contain bg-muted" />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => deleteRow.mutate({ table: "vehicle_photos", rowId: p.id })}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="pt-6">
          <div className="card-elevated p-6">
            <h2 className="font-display text-lg font-bold">Documentação</h2>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-4"
              onSubmit={(e) => {
                e.preventDefault();
                simpleInsert.mutate("doc");
              }}
            >
              <Input
                value={doc.doc_type}
                onChange={(e) => setDoc({ ...doc, doc_type: e.target.value })}
                placeholder="CRLV, laudo, transferência..."
                required
              />
              <Select value={doc.status} onValueChange={(v) => setDoc({ ...doc, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_STATUS_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={doc.due_date}
                onChange={(e) => setDoc({ ...doc, due_date: e.target.value })}
              />
              <Button type="submit">Adicionar</Button>
            </form>
            <ul className="mt-4 divide-y divide-border">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold">{d.doc_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOC_STATUS_LABEL[d.status]} · vence {formatDate(d.due_date)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow.mutate({ table: "vehicle_documents", rowId: d.id })}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
              {docs.length === 0 ? (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum documento cadastrado.
                </li>
              ) : null}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="venda" className="pt-6">
          <form
            className="card-elevated grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              registerSale.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Valor da venda (R$)</Label>
              <Input
                type="number"
                required
                value={sale.sold_value || (data.sale?.sold_value?.toString() ?? "")}
                onChange={(e) => setSale({ ...sale, sold_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={sale.sale_date}
                onChange={(e) => setSale({ ...sale, sale_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cliente cadastrado</Label>
              <Select
                value={sale.customer_id}
                onValueChange={(v) => setSale({ ...sale, customer_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {(customers.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comprador (avulso)</Label>
              <Input
                value={sale.buyer_name}
                onChange={(e) => setSale({ ...sale, buyer_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={sale.buyer_phone}
                onChange={(e) => setSale({ ...sale, buyer_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select
                value={sale.payment_method}
                onValueChange={(v) => setSale({ ...sale, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comissão (R$)</Label>
              <Input
                type="number"
                value={sale.commission_value}
                onChange={(e) => setSale({ ...sale, commission_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Despesas da venda (R$)</Label>
              <Input
                type="number"
                value={sale.sale_expenses}
                onChange={(e) => setSale({ ...sale, sale_expenses: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={sale.notes}
                onChange={(e) => setSale({ ...sale, notes: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" size="lg" disabled={registerSale.isPending}>
                {data.sale ? "Atualizar venda" : "Registrar venda"}
              </Button>
              {data.sale ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Vendido por {formatBRL(data.sale.sold_value)} em {formatDate(data.sale.sale_date)} ·
                  Lucro real {formatBRL(fin?.real_profit ?? null)}
                </p>
              ) : null}
            </div>
          </form>
        </TabsContent>

        <TabsContent value="historico" className="pt-6">
          <div className="card-elevated p-6">
            <h2 className="font-display text-lg font-bold">Linha do tempo</h2>
            <ol className="mt-4 space-y-4 border-l border-border pl-5">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[1.65rem] top-1.5 size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-semibold">{h.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</p>
                </li>
              ))}
              {history.length === 0 ? (
                <li className="text-sm text-muted-foreground">Sem eventos registrados.</li>
              ) : null}
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="editar" className="pt-6">
          <VehicleForm
            initial={formInitial}
            submitLabel="Salvar alterações"
            submitting={updateVehicle.isPending}
            onSubmit={(values) => updateVehicle.mutate(values)}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
