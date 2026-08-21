import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Área da equipe — BR Car Seminovos" },
      {
        name: "description",
        content: "Acesso restrito ao painel de gestão da BR Car Seminovos.",
      },
      { property: "og:title", content: "Área da equipe — BR Car Seminovos" },
      { property: "og:description", content: "Painel de gestão de estoque e vendas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    async function routeSignedInUser(userId: string) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1);

      if (roles?.length) {
        void navigate({ to: "/painel" });
        return;
      }

      await supabase.auth.signOut();
      toast.error(
        "Sua conta ainda não foi aprovada pelo administrador. Aguarde a liberação."
      );
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        void routeSignedInUser(data.session.user.id);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setTimeout(() => {
          void routeSignedInUser(session.user.id);
        }, 0);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword(login);

    setLoading(false);

    if (error) {
      toast.error("E-mail ou senha inválidos.");
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("team-signup", {
      body: {
        name: signup.name,
        email: signup.email,
        password: signup.password,
      },
    });

    setLoading(false);

    const fnError = (data as { error?: string } | null)?.error;

    if (error || fnError) {
      toast.error(
        fnError ??
          "Não foi possível criar a conta. Tente novamente em instantes."
      );
      return;
    }

    setSignup({
      name: "",
      email: "",
      password: "",
    });

    toast.success(
      "Conta criada. Aguarde a aprovação do administrador para acessar o painel."
    );
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="surface-ink hidden flex-col justify-between p-12 lg:flex">
        <BrandLogo tone="dark" />

        <div>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-ink-foreground">
            Gestão completa da sua garagem de seminovos.
          </h1>

          <p className="mt-4 max-w-md text-ink-muted">
            Estoque, custos, margem por veículo, leads do catálogo e vendas —
            tudo em um só painel.
          </p>
        </div>

        <p className="text-xs text-ink-muted">
          Acesso restrito à equipe BR Car.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLogo />
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>

                  <Input
                    id="login-email"
                    type="email"
                    value={login.email}
                    onChange={(e) =>
                      setLogin({
                        ...login,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>

                  <Input
                    id="login-password"
                    type="password"
                    value={login.password}
                    onChange={(e) =>
                      setLogin({
                        ...login,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  Entrar no painel
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>

                  <Input
                    id="signup-name"
                    value={signup.name}
                    onChange={(e) =>
                      setSignup({
                        ...signup,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>

                  <Input
                    id="signup-email"
                    type="email"
                    value={signup.email}
                    onChange={(e) =>
                      setSignup({
                        ...signup,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>

                  <Input
                    id="signup-password"
                    type="password"
                    minLength={6}
                    value={signup.password}
                    onChange={(e) =>
                      setSignup({
                        ...signup,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  Criar conta da equipe
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              ← Voltar ao catálogo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
