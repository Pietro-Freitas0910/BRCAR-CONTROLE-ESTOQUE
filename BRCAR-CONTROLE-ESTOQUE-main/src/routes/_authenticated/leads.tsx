import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leadsQuery } from "@/lib/api";
import { formatDateTime, vehicleTitle } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "Leads — BR Car Seminovos" },
      { name: "description", content: "Interessados vindos do catálogo online." },
      { property: "og:title", content: "Leads — BR Car Seminovos" },
      { property: "og:description", content: "Gestão de interessados." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Leads,
});

const STATUSES = { novo: "Novo", em_contato: "Em contato", convertido: "Convertido", perdido: "Perdido" };

function Leads() {
  const queryClient = useQueryClient();
  const { data } = useQuery(leadsQuery);

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  return (
    <>
      <PageHeader title="Leads" description="Interessados que chegaram pelo catálogo." />
      <div className="card-elevated divide-y divide-border">
        {(data ?? []).map((lead) => {
          const v = lead.vehicles as { brand: string; model: string; version: string | null } | null;
          return (
            <div key={lead.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="font-semibold">{lead.name}</p>
                <p className="text-sm text-muted-foreground">
                  {lead.phone} · {v ? vehicleTitle(v) : "Interesse geral"}
                </p>
                {lead.message ? <p className="mt-1 text-sm">{lead.message}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(lead.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={lead.status}
                  onValueChange={(status) => setStatus.mutate({ id: lead.id, status })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUSES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button asChild variant="outline" size="icon">
                  <a
                    href={whatsappUrl(`Olá ${lead.name}, aqui é da BR Car Seminovos!`, lead.phone)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-4" />
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
        {(data ?? []).length === 0 ? (
          <p className="p-10 text-center text-muted-foreground">Nenhum lead recebido ainda.</p>
        ) : null}
      </div>
    </>
  );
}
