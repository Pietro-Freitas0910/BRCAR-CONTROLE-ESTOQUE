import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { customersQuery, suppliersQuery } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/pessoas")({
  head: () => ({
    meta: [
      { title: "Clientes e fornecedores — BR Car Seminovos" },
      { name: "description", content: "Cadastro de clientes e parceiros da garagem." },
      { property: "og:title", content: "Clientes e fornecedores — BR Car Seminovos" },
      { property: "og:description", content: "Cadastro de pessoas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Pessoas,
});

function Pessoas() {
  const queryClient = useQueryClient();
  const customers = useQuery(customersQuery);
  const suppliers = useQuery(suppliersQuery);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", city: "" });
  const [supplier, setSupplier] = useState({ name: "", phone: "", category: "", city: "" });

  const addCustomer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customers").insert({
        name: customer.name,
        phone: customer.phone || null,
        email: customer.email || null,
        city: customer.city || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Cliente cadastrado.");
      setCustomer({ name: "", phone: "", email: "", city: "" });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSupplier = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("suppliers").insert({
        name: supplier.name,
        phone: supplier.phone || null,
        category: supplier.category || null,
        city: supplier.city || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Fornecedor cadastrado.");
      setSupplier({ name: "", phone: "", category: "", city: "" });
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Clientes e fornecedores" description="Sua rede de contatos." />
      <Tabs defaultValue="clientes">
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form
              className="card-elevated space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                addCustomer.mutate();
              }}
            >
              <h2 className="font-display text-lg font-bold">Novo cliente</h2>
              {(
                [
                  ["name", "Nome", true],
                  ["phone", "Telefone", false],
                  ["email", "E-mail", false],
                  ["city", "Cidade", false],
                ] as const
              ).map(([key, label, required]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    required={required}
                    value={customer[key]}
                    onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })}
                  />
                </div>
              ))}
              <Button type="submit" className="w-full">
                Cadastrar cliente
              </Button>
            </form>
            <div className="card-elevated divide-y divide-border p-6">
              {(customers.data ?? []).map((c) => (
                <div key={c.id} className="py-3">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[c.phone, c.email, c.city].filter(Boolean).join(" · ") || "Sem contato"}
                  </p>
                </div>
              ))}
              {(customers.data ?? []).length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Nenhum cliente cadastrado.</p>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fornecedores" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form
              className="card-elevated space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                addSupplier.mutate();
              }}
            >
              <h2 className="font-display text-lg font-bold">Novo fornecedor</h2>
              {(
                [
                  ["name", "Nome", true],
                  ["phone", "Telefone", false],
                  ["category", "Categoria", false],
                  ["city", "Cidade", false],
                ] as const
              ).map(([key, label, required]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    required={required}
                    value={supplier[key]}
                    onChange={(e) => setSupplier({ ...supplier, [key]: e.target.value })}
                  />
                </div>
              ))}
              <Button type="submit" className="w-full">
                Cadastrar fornecedor
              </Button>
            </form>
            <div className="card-elevated divide-y divide-border p-6">
              {(suppliers.data ?? []).map((s) => (
                <div key={s.id} className="py-3">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[s.category, s.phone, s.city].filter(Boolean).join(" · ") || "Sem contato"}
                  </p>
                </div>
              ))}
              {(suppliers.data ?? []).length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Nenhum fornecedor.</p>
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
