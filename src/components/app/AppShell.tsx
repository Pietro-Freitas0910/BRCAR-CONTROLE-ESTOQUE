import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Car,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/estoque", label: "Estoque", icon: Car },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/leads", label: "Leads", icon: MessageSquare },
  { to: "/pessoas", label: "Clientes e fornecedores", icon: Users },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { profileName, session, roles, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link to="/painel" className="mb-6 px-1">
          <BrandLogo tone="dark" />
        </Link>
        {nav}
        <div className="mt-4 border-t border-sidebar-border pt-4">
          <p className="truncate px-3 text-sm font-semibold text-sidebar-foreground">
            {profileName || session?.user.email}
          </p>
          <p className="px-3 text-xs capitalize text-sidebar-foreground/60">
            {roles.join(", ") || "equipe"}
          </p>
          <div className="mt-3 flex gap-2 px-1">
            <Button asChild variant="ghost" size="sm" className="flex-1 text-sidebar-foreground/80">
              <Link to="/">Ver site</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground/80"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 bg-ink/50 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <BrandLogo showName={false} />
        </header>
        <main className="min-w-0 max-w-full flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col items-stretch justify-between gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight lg:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div> : null}
    </div>
  );
}
