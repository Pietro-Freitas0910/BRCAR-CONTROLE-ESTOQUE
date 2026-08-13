import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { whatsappPhones, whatsappUrl } from "@/lib/whatsapp";

function sellerName(digits: string) {
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.endsWith("996428523")) return "Rodrigo";
  if (local.endsWith("999774439")) return "Roberto";
  return null;
}

function formatPhone(digits: string) {
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length !== 11) return digits;
  return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
}

export function WhatsAppButton({
  message,
  phones,
  label = "Falar no WhatsApp",
  className,
  variant = "default",
}: {
  message: string;
  phones?: string | null;
  label?: string;
  className?: string;
  variant?: "default" | "outline";
}) {
  const numbers = whatsappPhones(phones);

  if (numbers.length <= 1) {
    return (
      <Button asChild variant={variant} className={className}>
        <a href={whatsappUrl(message, phones)} target="_blank" rel="noreferrer">
          <MessageCircle className="size-4" /> {label}
        </a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className={className}>
          <MessageCircle className="size-4" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        {numbers.map((number) => (
          <DropdownMenuItem key={number} asChild>
            <a href={whatsappUrl(message, number)} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" />
              <span className="flex flex-col items-start">
                {sellerName(number) ? <span className="font-medium">{sellerName(number)}</span> : null}
                <span className={sellerName(number) ? "text-xs text-muted-foreground" : ""}>
                  {formatPhone(number)}
                </span>
              </span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
