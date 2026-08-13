import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Link to="/" className="flex items-center">
          <BrandLogo />
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/"
            hash="estoque"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Estoque
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link to="/auth">Área da equipe</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({
  whatsapp,
  address,
}: {
  whatsapp?: string | undefined;
  address?: string | undefined;
}) {

  return (
    <footer className="surface-ink mt-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <BrandLogo tone="dark" />
        <div className="text-sm text-ink-muted">
          {address ? <p>{address}</p> : null}
          {whatsapp ? <p>WhatsApp: {whatsapp}</p> : null}
          <p className="mt-2 text-xs">
            © {new Date().getFullYear()} BR Car Seminovos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
