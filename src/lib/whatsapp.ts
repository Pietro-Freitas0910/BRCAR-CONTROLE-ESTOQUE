import { formatBRL, formatKm, vehicleTitle, yearLabel } from "./format";

export interface VehicleForMessage {
  brand: string;
  model: string;
  version?: string | null;
  manufacture_year?: number | null;
  model_year?: number | null;
  mileage?: number | null;
  listed_price?: number | null;
  notes?: string | null;
}

export function buildVehicleMessage(v: VehicleForMessage, link?: string): string {
  const lines = [
    `🚗 *${vehicleTitle(v)}*`,
    `📅 Ano: ${yearLabel(v)}`,
    `🛣️ KM: ${formatKm(v.mileage ?? null)}`,
    `💰 Valor: ${formatBRL(v.listed_price ?? null)}`,
  ];
  if (v.notes) lines.push(`ℹ️ ${v.notes}`);
  if (link) lines.push("", `📸 Fotos e detalhes: ${link}`);
  lines.push("", "Fale com a BR Car Seminovos e agende sua visita! 🔑");
  return lines.join("\n");
}

export function buildCatalogMessage(vehicles: VehicleForMessage[], catalogUrl: string): string {
  const lines = ["🚗 *Veículos disponíveis — BR Car Seminovos*", ""];
  vehicles.forEach((v) => {
    lines.push(`• ${vehicleTitle(v)} — ${yearLabel(v)} — ${formatBRL(v.listed_price ?? null)}`);
  });
  lines.push("", `Veja fotos e detalhes de todos: ${catalogUrl}`);
  return lines.join("\n");
}

/**
 * Aceita um ou mais telefones no mesmo campo, separados por |, /, ; ou quebra de linha.
 * Retorna somente números com DDI, prontos para wa.me.
 */
export function whatsappPhones(phone?: string | null): string[] {
  if (!phone) return [];
  return phone
    .split(/[|;/\n]+/)
    .map((part) => part.replace(/\D/g, ""))
    .filter(Boolean)
    .map((digits) => (digits.length === 11 ? `55${digits}` : digits));
}

export function whatsappUrl(message: string, phone?: string | null): string {
  // Quando houver dois números, usa o primeiro como principal para links simples.
  const digits = whatsappPhones(phone)[0] ?? "";
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
