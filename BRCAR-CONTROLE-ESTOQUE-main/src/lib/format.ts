export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return BRL.format(Number(value));
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR").format(Number(value));
}

export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${formatNumber(value)} km`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Number(value).toFixed(1).replace(".", ",")}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function parseCurrencyInput(value: string): number {
  const digits = digitsOnly(value);
  return digits ? Number(digits) : 0;
}

export type VehicleStatus =
  | "em_preparacao"
  | "disponivel"
  | "reservado"
  | "vendido"
  | "entregue"
  | "consignado";

export const STATUS_LABEL: Record<VehicleStatus, string> = {
  em_preparacao: "Em preparação",
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
  entregue: "Entregue",
  consignado: "Consignado",
};

export const STATUS_ORDER: VehicleStatus[] = [
  "em_preparacao",
  "disponivel",
  "reservado",
  "vendido",
  "entregue",
  "consignado",
];

export const PAYMENT_LABEL: Record<string, string> = {
  a_vista: "À vista",
  financiamento: "Financiamento",
  troca: "Troca",
  pix: "PIX",
  cartao: "Cartão",
  boleto: "Boleto",
  outro: "Outro",
};

export const ENTRY_TYPE_LABEL: Record<string, string> = {
  compra_direta: "Compra direta",
  troca: "Troca",
  consignacao: "Consignação",
};

export const DOC_STATUS_LABEL: Record<string, string> = {
  ok: "OK",
  pendente: "Pendente",
  incompleta: "Incompleta",
  irregular: "Irregular",
};

export function vehicleTitle(v: {
  brand: string;
  model: string;
  version?: string | null;
}): string {
  return `${v.brand} ${v.model}${v.version ? ` ${v.version}` : ""}`;
}

export function yearLabel(v: {
  manufacture_year?: number | null;
  model_year?: number | null;
}): string {
  if (!v.manufacture_year && !v.model_year) return "—";
  return `${v.manufacture_year ?? "—"}/${v.model_year ?? "—"}`;
}
