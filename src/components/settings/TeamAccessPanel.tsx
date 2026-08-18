import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, type AppRole } from "@/hooks/useAuth";

type InviteRow = {
  email: string;
  role: AppRole;
  created_at: string;
};

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

export function TeamAccessPanel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("vendedor");

  const { data: invites, isLoading: loadingInvites } = useQuery({
    queryKey: ["team_access_emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_access_emails")
        .select("email, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as InviteRow[];
    },
  });

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: roleRows, error: rErr }] =
        await Promise.all([
          supabase.from("profiles").select("id, name, email, active"),
          supabase.from("user_roles").select("user_id, role"),
        ]);
      if (pErr) throw new Error(pErr.message);
      if (rErr) throw new Error(rErr.message);
      const roleByUser = new Map((roleRows ?? []).map((r) => [r.user_id, r.role as AppRole]));
      return (profiles ?? [])
        .map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          active: p.active,
          role: roleByUser.get(p.id) ?? null,
        }))
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")) as MemberRow[];
    },
  });

  const addInvite = useMutation({
    mutationFn: async () => {
      const clean = email.trim().toLowerCase();
      if (!clean) throw new Error("Informe um e-mail.");
      const { error } = await supabase.from("team_access_emails").insert({ email: clean, role });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Acesso liberado. Peça para a pessoa criar a conta com esse e-mail.");
      setEmail("");
      setRole("vendedor");
      await queryClient.invalidateQueries({ queryKey: ["team_access_emails"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeInvite = useMutation({
    mutationFn: async (targetEmail: string) => {
      const { error } = await supabase.from("team_access_emails").delete().eq("email", targetEmail);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Convite removido.");
      await queryClient.invalidateQueries({ queryKey: ["team_access_emails"] });
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
      await queryClient.invalidateQueries({ queryKey: ["team_members"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="card-elevated h-fit space-y-8 p-6">
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold">Membros com acesso</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Só você (administrador) vê e controla essa lista. Revogar tira o acesso da pessoa na
            hora, mesmo que ela já esteja logada — sem precisar apagar a conta dela.
          </p>
        </div>

        <div className="divide-y rounded-lg border">
          {loadingMembers ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
          ) : !members?.length ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum membro ainda.</p>
          ) : (
            members.map((m) => {
              const isSelf = m.id === user?.id;
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {m.name || m.email} {isSelf ? <span className="text-muted-foreground">(você)</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.email} · {m.role ? ROLE_LABEL[m.role] : "sem cargo"} ·{" "}
                      <span className={m.active ? "text-emerald-600" : "text-destructive"}>
                        {m.active ? "acesso ativo" : "acesso revogado"}
                      </span>
                    </p>
                  </div>
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
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold">Convites (ainda sem conta)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Libere um e-mail aqui e peça para a pessoa criar conta na tela de login com esse
            mesmo e-mail — ela recebe o link de confirmação e já entra com o cargo escolhido.
          </p>
        </div>

        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            addInvite.mutate();
          }}
        >
          <div className="flex-1 space-y-1.5">
            <Label>E-mail autorizado</Label>
            <Input
              type="email"
              placeholder="pessoa@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:w-40">
            <Label>Cargo</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={addInvite.isPending}>
            Liberar acesso
          </Button>
        </form>

        <div className="divide-y rounded-lg border">
          {loadingInvites ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
          ) : !invites?.length ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum convite pendente.</p>
          ) : (
            invites.map((r) => (
              <div key={r.email} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-medium">{r.email}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABEL[r.role]}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={removeInvite.isPending}
                  onClick={() => removeInvite.mutate(r.email)}
                  aria-label={`Remover convite de ${r.email}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
