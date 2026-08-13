import { supabase } from "@/integrations/supabase/client";

const CATALOG_COLUMNS =
  "id, brand, model, version, manufacture_year, model_year, mileage, color, fuel, transmission, doors, engine, category, optionals, notes, listed_price, status, cover_photo_url";

export async function listCatalog() {
  const { data, error } = await supabase
    .from("vehicles")
    .select(CATALOG_COLUMNS)
    .in("status", ["disponivel", "reservado"])
    .is("deleted_at", null)
    .order("listed_price", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCatalogVehicle(input: { data: { id: string } }) {
  const { id } = input.data;
  const { data, error } = await supabase
    .from("vehicles")
    .select(CATALOG_COLUMNS)
    .eq("id", id)
    .in("status", ["disponivel", "reservado"])
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: photos, error: photoError } = await supabase
    .from("vehicle_photos")
    .select("id, url, is_cover, position")
    .eq("vehicle_id", id)
    .order("position", { ascending: true });
  if (photoError) throw new Error(photoError.message);

  return { ...data, photos: photos ?? [] };
}

export async function createLead(input: {
  data: { vehicleId: string | null; name: string; phone: string; message?: string };
}) {
  const name = input.data.name.trim().slice(0, 120);
  const phone = input.data.phone.trim().slice(0, 40);
  if (name.length < 2) throw new Error("Informe seu nome.");
  if (phone.replace(/\D/g, "").length < 10) {
    throw new Error("Informe um telefone válido com DDD.");
  }
  const message = (input.data.message ?? "").trim().slice(0, 500);

  const { error } = await supabase.from("leads").insert({
    vehicle_id: input.data.vehicleId,
    name,
    phone,
    message: message || null,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function getPublicSettings() {
  const { data, error } = await supabase
    .from("garage_settings")
    .select("name, whatsapp, address, city, instagram, catalog_headline")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
