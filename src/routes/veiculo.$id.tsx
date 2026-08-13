import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { createLead, getCatalogVehicle, getPublicSettings } from "@/lib/catalog.functions";
import { SiteFooter, SiteHeader } from "@/components/catalog/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatBRL, formatKm, vehicleTitle, yearLabel } from "@/lib/format";
import { buildVehicleMessage } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const vehicleQ = (id: string) =>
  queryOptions({
    queryKey: ["catalog-vehicle", id],
    queryFn: () => getCatalogVehicle({ data: { id } }),
  });

const settingsQ = queryOptions({
  queryKey: ["settings-public"],
  queryFn: () => getPublicSettings(),
});

export const Route = createFileRoute("/veiculo/$id")({
  loader: async ({ context, params }) => {
    const vehicle = await context.queryClient.ensureQueryData(vehicleQ(params.id));
    if (!vehicle) throw notFound();
    await context.queryClient.ensureQueryData(settingsQ);
    return { title: vehicleTitle(vehicle), price: vehicle.listed_price, image: vehicle.cover_photo_url };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Veículo indisponível — BR Car" }, { name: "robots", content: "noindex" }],
      };
    }
    const description = `${loaderData.title} por ${formatBRL(loaderData.price)} na BR Car Seminovos.`;
    return {
      meta: [
        { title: `${loaderData.title} — BR Car Seminovos` },
        { name: "description", content: description },
        { property: "og:title", content: `${loaderData.title} — BR Car Seminovos` },
        { property: "og:description", content: description },
      ],
    };
  },
  component: VehicleDetail,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-16 text-center">
      <p className="font-display text-xl font-bold">Este veículo não está mais disponível.</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Ver estoque atual
      </Link>
    </div>
  ),
});

function VehicleDetail() {
  const { id } = Route.useParams();
  const { data: vehicle } = useSuspenseQuery(vehicleQ(id));
  const { data: settings } = useSuspenseQuery(settingsQ);
  const [active, setActive] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const lead = useMutation({
    mutationFn: () =>
      createLead({
        data: { vehicleId: id, name: form.name, phone: form.phone, message: form.message },
      }),
    onSuccess: () => {
      toast.success("Recebemos seu contato! Nossa equipe vai te chamar.");
      setForm({ name: "", phone: "", message: "" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!vehicle) return null;

  const gallery = vehicle.photos.length
    ? vehicle.photos.map((p) => p.url)
    : vehicle.cover_photo_url
      ? [vehicle.cover_photo_url]
      : [];

  const specs = [
    ["Ano", yearLabel(vehicle)],
    ["Quilometragem", formatKm(vehicle.mileage)],
    ["Câmbio", vehicle.transmission ?? "—"],
    ["Combustível", vehicle.fuel ?? "—"],
    ["Cor", vehicle.color ?? "—"],
    ["Motor", vehicle.engine ?? "—"],
    ["Portas", vehicle.doors ? String(vehicle.doors) : "—"],
    ["Categoria", vehicle.category ?? "—"],
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar ao estoque
        </Link>

        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)] lg:gap-8">
          <div className="min-w-0">
            <div className="card-elevated min-w-0 overflow-hidden">
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted sm:aspect-[3/2] lg:max-h-[34rem]">
                {gallery[active] ? (
                  <img
                    src={gallery[active]}
                    alt={vehicleTitle(vehicle)}
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </div>
            </div>
            {gallery.length > 1 ? (
              <div className="mt-3 flex w-full min-w-0 gap-3 overflow-x-auto overscroll-x-contain pb-1">
                {gallery.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setActive(i)}
                    className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 ${
                      i === active ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={url} alt="" className="size-full object-contain bg-muted" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="card-elevated mt-6 p-4 sm:mt-8 sm:p-6">
              <h2 className="font-display text-lg font-bold">Ficha técnica</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {specs.map(([label, value]) => (
                  <div key={label}>
                    <dt className="eyebrow text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {vehicle.optionals.length ? (
              <div className="card-elevated mt-6 p-4 sm:p-6">
                <h2 className="font-display text-lg font-bold">Opcionais</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {vehicle.optionals.map((opt) => (
                    <li key={opt} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-success" /> {opt}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {vehicle.notes ? (
              <div className="card-elevated mt-6 p-4 sm:p-6">
                <h2 className="font-display text-lg font-bold">Observações</h2>
                <p className="mt-2 text-sm text-muted-foreground">{vehicle.notes}</p>
              </div>
            ) : null}
          </div>

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="card-elevated p-4 sm:p-6">
              <p className="eyebrow text-primary">{vehicle.brand}</p>
              <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight">
                {vehicle.model} {vehicle.version ?? ""}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {yearLabel(vehicle)} · {formatKm(vehicle.mileage)}
              </p>
              <p className="mt-5 font-display text-4xl font-extrabold">
                {formatBRL(vehicle.listed_price)}
              </p>
              <WhatsAppButton
                message={buildVehicleMessage(
                  vehicle,
                  typeof window !== "undefined" ? window.location.href : undefined,
                )}
                phones={settings?.whatsapp}
                label="Tenho interesse"
                className="mt-5 w-full"
              />
            </div>

            <form
              className="card-elevated space-y-4 p-4 sm:p-6"
              onSubmit={(e) => {
                e.preventDefault();
                lead.mutate();
              }}
            >
              <div>
                <h2 className="font-display text-lg font-bold">Simular ou agendar visita</h2>
                <p className="text-sm text-muted-foreground">Deixe seu contato e falamos com você.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(44) 99999-0000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full" disabled={lead.isPending}>
                {lead.isPending ? "Enviando..." : "Quero ser contatado"}
              </Button>
            </form>
          </aside>
        </div>
      </main>
      <SiteFooter whatsapp={settings?.whatsapp} address={settings?.address ?? undefined} />
    </div>
  );
}
