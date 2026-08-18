import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settingsQuery } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { TeamAccessPanel } from "@/components/settings/TeamAccessPanel";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — BR Car Seminovos" },
      { name: "description", content: "Dados da loja exibidos no catálogo público." },
      { property: "og:title", content: "Configurações — BR Car Seminovos" },
      { property: "og:description", content: "Preferências da garagem." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const queryClient = useQueryClient();
  const { data } = useQuery(settingsQuery);
  const { roles, profileName, session } = useAuth();
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    address: "",
    city: "",
    instagram: "",
    catalog_headline: "",
    stale_days: "45",
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      whatsapp: data.whatsapp,
      address: data.address ?? "",
      city: data.city ?? "",
      instagram: data.instagram ?? "",
      catalog_headline: data.catalog_headline ?? "",
      stale_days: String(data.stale_days),
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("garage_settings")
        .update({
          name: form.name,
          whatsapp: form.whatsapp,
          address: form.address,
          city: form.city,
          instagram: form.instagram,
          catalog_headline: form.catalog_headline,
          stale_days: Number(form.stale_days) || 45,
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

  const fields = [
    ["name", "Nome da loja"],
    ["whatsapp", "WhatsApp(s) com DDI (separe dois números com |)"],
    ["address", "Endereço"],
    ["city", "Cidade"],
    ["instagram", "Instagram"],
    ["catalog_headline", "Título do catálogo"],
    ["stale_days", "Alerta de veículo parado (dias)"],
  ] as const;

  return (
    <>
      <PageHeader title="Configurações" description="Dados usados no catálogo e nos alertas." />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <form
          className="card-elevated space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          {fields.map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <Button type="submit" disabled={save.isPending}>
            Salvar configurações
          </Button>
        </form>

        <div className="card-elevated h-fit p-6">
          <h2 className="font-display text-lg font-bold">Sua conta</h2>
          <p className="mt-2 text-sm text-muted-foreground">{session?.user.email}</p>
          <p className="text-sm">
            <span className="font-semibold">{profileName || "Equipe"}</span> ·{" "}
            {roles.join(", ") || "sem papel definido"}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            O primeiro usuário cadastrado recebe o papel de administrador automaticamente.
          </p>
        </div>

        {roles.includes("admin") ? <TeamAccessPanel /> : null}
      </div>
    </>
  );
}
