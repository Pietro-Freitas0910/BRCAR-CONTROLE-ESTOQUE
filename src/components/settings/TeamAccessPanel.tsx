import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldOff, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, type AppRole } from "@/hooks/useAuth";

type MemberRow = {
  id: string;
  name: string | null;
  email: string | null;
  active: boolean;
  role: AppRole | null;
};

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
  financeiro: "Financeiro",
};

async function fetchMembers(): Promise<MemberRow[]> {
  const [{ data: profiles, error: pErr }, { data: roleRows, error: rErr }] = await Promise.all([
    supabase.from("profiles").select("id, name, email, active"),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (pErr) throw new Error(pErr.message);
  if (rErr) throw new Error(rErr.message);
  const roleByUser = new Map((roleRows ?? []).map((r) => [r.user_id, r.role as AppRole]));
  return (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    active: p.active,
    role: roleByUser.get(p.id) ?? null,
  }));
}

export function TeamAccessPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: members, isLoading } = useQuery({
    queryKey: ["team_members"],
    queryFn: fetchMembers,
  });

  const pending = (members ?? []).filter((m) => !m.role);
  const approved = (members ?? []).filter((m) => !!m.role);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["team_members"] });

  const approve = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error: e1 } = await supabase.from("profiles").update({ active: true }).eq("id", id);
      if (e1) throw new Error(e1.message);
      const { error: e2 } = await supabase.from("user_roles").insert({ user_id: id, role });
      if (e2) throw new Error(e2.message);
    },
    onSuccess: async () => {
      toast.success("Acesso aprovado.");
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Cadastro recusado.");
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("profiles").update({ active }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async (_data, vars) => {
      toast.success(vars.active ? "Acesso reativado." : "Acesso revogado.");
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", id);
      if (delErr) throw new Error(delErr.message);
      const { error: insErr } = await supabase.from("user_roles").insert({ user_id: id, role });
      if (insErr) throw new Error(insErr.message);
    },
    onSuccess: async () => {
      toast.success("Cargo atualizado.");
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="card-elevated h-fit space-y-8 p-6">
      <div>
        <h2 className="font-display text-lg font-bold">Acessos da equipe</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Só você (administrador) vê e controla essa lista. Qualquer pessoa pode criar uma conta
          no site, mas ela só entra no painel depois que você aprovar aqui.
        </p>
      </div>

      {pending.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-amber-700">
            Pedidos de acesso ({pending.length})
          </h3>
          <div className="divide-y rounded-lg border border-amber-200 bg-amber-50/50">
            {pending.map((m) => (
              <PendingRow
                key={m.id}
                member={m}
                onApprove={(role) => approve.mutate({ id: m.id, role })}
                onReject={() => reject.mutate(m.id)}
                busy={approve.isPending || reject.isPending}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Membros aprovados</h3>
        <div className="divide-y rounded-lg border">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
          ) : !approved.length ? (
            <p className="p-4 text-sm text-muted-foreground">Ninguém aprovado ainda.</p>
          ) : (
            approved.map((m) => {
              const isSelf = m.id === user?.id;
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {m.name || m.email}{" "}
                      {isSelf ? <span className="text-muted-foreground">(você)</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.email} ·{" "}
                      <span className={m.active ? "text-emerald-600" : "text-destructive"}>
                        {m.active ? "acesso ativo" : "acesso revogado"}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={m.role ?? "vendedor"}
                      disabled={isSelf || changeRole.isPending}
                      onValueChange={(v) => changeRole.mutate({ id: m.id, role: v as AppRole })}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs" title={isSelf ? "Você não pode mudar seu próprio cargo" : undefined}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isSelf || setActive.isPending}
                      title={isSelf ? "Você não pode revogar seu próprio acesso" : undefined}
                      onClick={() => setActive.mutate({ id: m.id, active: !m.active })}
                      aria-label={m.active ? `Revogar acesso de ${m.email}` : `Reativar acesso de ${m.email}`}
                    >
                      {m.active ? (
                        <ShieldOff className="h-4 w-4 text-destructive" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function PendingRow({
  member,
  onApprove,
  onReject,
  busy,
}: {
  member: MemberRow;
  onApprove: (role: AppRole) => void;
  onReject: () => void;
  busy: boolean;
}) {
  const [role, setRole] = useState<AppRole>("vendedor");

  return (
    <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{member.name || member.email}</p>
        <p className="text-xs text-muted-foreground">{member.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vendedor">Vendedor</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busy}
          onClick={() => onApprove(role)}
          aria-label={`Aprovar ${member.email}`}
        >
          <UserCheck className="h-4 w-4 text-emerald-600" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busy}
          onClick={onReject}
          aria-label={`Recusar ${member.email}`}
        >
          <UserX className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
