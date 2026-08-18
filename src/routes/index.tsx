import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Search, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { listCatalog, getPublicSettings } from "@/lib/catalog.functions";
import { SiteFooter, SiteHeader } from "@/components/catalog/SiteHeader";
import { VehicleCard, type CatalogVehicle } from "@/components/catalog/VehicleCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { buildCatalogMessage } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => listCatalog(),
});

const settingsPublicQuery = queryOptions({
  queryKey: ["settings-public"],
  queryFn: () => getPublicSettings(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BR Car Seminovos — Catálogo de seminovos revisados" },
      {
        name: "description",
        content:
          "Confira o estoque atualizado da BR Car Seminovos: carros revisados, procedência garantida e atendimento direto pelo WhatsApp.",
      },
      { property: "og:title", content: "BR Car Seminovos — Catálogo" },
      {
        property: "og:description",
        content: "Seminovos selecionados, revisados e prontos para rodar.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(catalogQuery),
      context.queryClient.ensureQueryData(settingsPublicQuery),
    ]),
  component: CatalogPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-center text-muted-foreground">
      Não foi possível carregar o catálogo: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Catálogo indisponível.</div>,
});

const SORTS = {
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  year_desc: "Mais novos",
  km_asc: "Menor km",
} as const;

function CatalogPage() {
  const { data: vehicles } = useSuspenseQuery(catalogQuery);
  const { data: settings } = useSuspenseQuery(settingsPublicQuery);

  const [term, setTerm] = useState("");
  const [brand, setBrand] = useState("todas");
  const [sort, setSort] = useState<keyof typeof SORTS>("price_asc");

  const brands = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.brand))).sort(),
    [vehicles],
  );

  const filtered = useMemo(() => {
    const q = term.toLowerCase().trim();
    const list = vehicles.filter((v) => {
      const matchTerm =
        !q ||
        `${v.brand} ${v.model} ${v.version ?? ""} ${v.color ?? ""}`.toLowerCase().includes(q);
      const matchBrand = brand === "todas" || v.brand === brand;
      return matchTerm && matchBrand;
    });
    return [...list].sort((a, b) => {
      if (sort === "price_asc") return (a.listed_price ?? 0) - (b.listed_price ?? 0);
      if (sort === "price_desc") return (b.listed_price ?? 0) - (a.listed_price ?? 0);
      if (sort === "year_desc") return (b.model_year ?? 0) - (a.model_year ?? 0);
      return (a.mileage ?? 0) - (b.mileage ?? 0);
    });
  }, [vehicles, term, brand, sort]);

  const cheapest = vehicles.reduce<number | null>(
    (min, v) => (v.listed_price && (min === null || v.listed_price < min) ? v.listed_price : min),
    null,
  );

  const catalogLink = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="surface-ink relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="eyebrow text-primary">{settings?.city ?? "Seminovos"}</p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] text-ink-foreground lg:text-6xl">
              {settings?.catalog_headline ?? "Seminovos selecionados, prontos para rodar"}
            </h1>
            <p className="mt-5 max-w-lg text-base text-ink-muted">
              Cada veículo passa por checklist de preparação, revisão mecânica e conferência
              documental antes de entrar no nosso estoque.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#estoque">Ver estoque ({vehicles.length})</a>
              </Button>
              <WhatsAppButton
                message={buildCatalogMessage(vehicles.slice(0, 8), catalogLink)}
                phones={settings?.whatsapp}
                label="Falar no WhatsApp"
                variant="outline"
                className="border-ink-foreground/40 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground"
              />
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-sidebar-border pt-6">
              <div>
                <dt className="eyebrow text-ink-muted">Em estoque</dt>
                <dd className="font-display text-2xl font-extrabold text-ink-foreground">
                  {vehicles.length}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-ink-muted">A partir de</dt>
                <dd className="font-display text-2xl font-extrabold text-primary">
                  {formatBRL(cheapest)}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-ink-muted">Marcas</dt>
                <dd className="font-display text-2xl font-extrabold text-ink-foreground">
                  {brands.length}
                </dd>
              </div>
            </dl>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, title: "Procedência conferida", text: "Laudo, documentação e histórico verificados." },
              { icon: Wrench, title: "Revisão completa", text: "Checklist de preparação item a item." },
              { icon: Sparkles, title: "Higienização premium", text: "Entrega detalhada e pronta para uso." },
              { icon: Search, title: "Preço transparente", text: "Valor final publicado, sem surpresas." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-5"
              >
                <item.icon className="size-5 text-primary" />
                <h3 className="mt-3 font-display text-sm font-bold text-ink-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-ink-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="estoque" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Estoque</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold">Veículos disponíveis</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar modelo, versão, cor..."
                className="w-56 pl-9"
              />
            </div>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as marcas</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as keyof typeof SORTS)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORTS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground">
            Nenhum veículo encontrado com esses filtros.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => (
              <VehicleCard key={v.id} vehicle={v as CatalogVehicle} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter whatsapp={settings?.whatsapp} address={settings?.address ?? undefined} />
    </div>
  );
}
